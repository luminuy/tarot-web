/**
 * ⚡ Upstash Redis (REST) — ที่พักของตัวนับและเซสชันเปิดไพ่ แทน Cloudflare KV
 * ---------------------------------------------------------------------------
 * ทำไมต้องมี (ข้อ 16 ใน `docs/CLOUDFLARE_OPTIMIZATION_GUIDE.md` — ตัวที่คู่มือชูอันดับ 1):
 * Cloudflare KV แพ็กเกจฟรีเขียนได้ ~1,000 ครั้ง/วัน ซึ่งเป็น **คอขวดจริง** ของเว็บนี้
 * ส่วน Upstash ฟรี 10,000 คำสั่ง/วัน และที่สำคัญกว่าคือมี `INCRBY` แบบ atomic
 *
 * 🎯 ได้มากกว่าแค่ "เขียนได้เยอะขึ้น" — ตัวนับกลายเป็นแม่นจริง:
 * ของเดิมบน KV ต้อง read-modify-write ซึ่งไม่ atomic สอง isolate ที่เขียนพร้อมกัน
 * ทับกันได้ (นับขาด) และ KV ยัง eventually-consistent (~60 วินาที) การบังคับโควตา
 * ข้าม edge จึงหลวมโดยธรรมชาติ · `INCRBY` ของ Redis แก้ทั้งสองเรื่องในคำสั่งเดียว
 *
 * 🔌 เปิด/ปิดด้วย env — ไม่ตั้ง = ระบบทำงานเหมือนเดิมทุกอย่าง (ใช้ KV):
 *     UPSTASH_REDIS_REST_URL
 *     UPSTASH_REDIS_REST_TOKEN
 * (แพตเทิร์นเดียวกับ `CF_AI_GATEWAY_*` ใน `src/lib/ai/gateway.ts`)
 *
 * ตั้งค่าบน production:
 *     npx wrangler secret put UPSTASH_REDIS_REST_URL
 *     npx wrangler secret put UPSTASH_REDIS_REST_TOKEN
 *
 * ⚠️ ใช้ REST API ไม่ใช่ TCP — เพราะ Cloudflare Workers ต่อ TCP socket ไม่ได้
 * ⚠️ ทุกฟังก์ชันในไฟล์นี้ **ห้าม throw** — Upstash ล่มต้องไม่ทำให้เว็บล่มตาม
 *    ผู้เรียกทุกจุดต้องมีทางถอยกลับไปใช้ KV เสมอ
 */

interface RedisConfig {
  url: string;
  token: string;
}

function config(): RedisConfig | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ""), token };
}

/** เปิดใช้ Upstash อยู่หรือไม่ (มีครบทั้ง url + token) */
export function isRedisEnabled(): boolean {
  return config() !== null;
}

/** timeout กันคำสั่งค้างจนลาก request ทั้งเส้นให้ช้าตาม */
const TIMEOUT_MS = 2_000;

/**
 * ยิงคำสั่ง Redis ผ่าน REST — คืน `null` ทุกกรณีที่ล้มเหลว (ไม่ throw)
 * รูปแบบ: POST <url> body = ["SET", "key", "value", "EX", "60"]
 */
async function command<T>(args: (string | number)[]): Promise<T | null> {
  const cfg = config();
  if (!cfg) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(cfg.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args.map(String)),
      signal: controller.signal,
    });

    if (!res.ok) return null;
    const json = (await res.json()) as { result?: T; error?: string };
    if (json.error) return null;
    return (json.result ?? null) as T | null;
  } catch {
    // เครือข่ายล่ม / timeout / ตอบไม่ใช่ JSON — ผู้เรียกถอยไปใช้ KV
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * เพิ่มตัวนับแบบ atomic แล้วคืนค่าใหม่ · `null` = ใช้ Redis ไม่ได้ ให้ผู้เรียกถอยไป KV
 * ตั้ง TTL ให้เฉพาะตอนที่คีย์เพิ่งถูกสร้าง (ค่าใหม่ == amount) เพื่อไม่ให้อายุถูกยืดไปเรื่อย ๆ
 */
export async function redisIncrBy(
  key: string,
  amount: number,
  ttlSec: number,
): Promise<number | null> {
  const next = await command<number>(["INCRBY", key, amount]);
  if (next === null) return null;

  if (next === amount) {
    // คีย์เพิ่งเกิด — ตั้งอายุครั้งเดียว (ไม่สนใจผลลัพธ์ ตัวนับสำคัญกว่า TTL)
    void command(["EXPIRE", key, ttlSec]);
  }
  return next;
}

/** อ่านตัวนับ · `null` = ใช้ Redis ไม่ได้ (ต่างจาก 0 ที่แปลว่า "ยังไม่เคยนับ") */
export async function redisGetCount(key: string): Promise<number | null> {
  const raw = await command<string | number | null>(["GET", key]);
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

/** เก็บค่า JSON พร้อมอายุ · คืน true เมื่อสำเร็จจริง */
export async function redisSetJSON(
  key: string,
  value: unknown,
  ttlSec: number,
): Promise<boolean> {
  const ok = await command<string>(["SET", key, JSON.stringify(value), "EX", ttlSec]);
  return ok === "OK";
}

/** อ่านค่า JSON · `null` = ไม่มีคีย์ หรือใช้ Redis ไม่ได้ (ผู้เรียกถอยไป KV ได้เลย) */
export async function redisGetJSON<T>(key: string): Promise<T | null> {
  const raw = await command<string | null>(["GET", key]);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** ตรวจว่าต่อ Upstash ได้จริงไหม — ใช้ในหน้า /admin (Cloud Health) */
export async function redisPing(): Promise<boolean> {
  if (!isRedisEnabled()) return false;
  return (await command<string>(["PING"])) === "PONG";
}
