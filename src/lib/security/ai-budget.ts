import { createHash } from "node:crypto";
import { kvGetJSON, kvPutJSON, KEY } from "@/lib/platform/kv-store";
import { getWaitUntil } from "@/lib/platform/cf";
import { utcDay } from "@/lib/stats/record";

const DEFAULT_DAILY_CAP = 2000;
const MEMO_MS = 30_000;
/** ผู้เยี่ยมชมถูกตัดที่สัดส่วนนี้ของเพดาน สมาชิกใช้ได้ถึง 100% (ENTITLEMENT_PLAN ข้อ 6) */
const GUEST_CAP_RATIO = 0.7;
let memo: { day: string; count: number; at: number } | null = null;

export function getAiDailyCap(): number {
  const n = Number(process.env.AI_DAILY_CALL_CAP);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_DAILY_CAP;
}

/**
 * true ถ้าวันนี้เรียก AI เกินเพดานแล้ว — ตรวจสอบก่อนเริ่ม stream Gemini
 * เพดานสองชั้น: ผู้เยี่ยมชมตัดที่ 70% · สมาชิกใช้ได้ถึง 100%
 * (default = "guest" เพื่อความปลอดภัย — call site ต้องระบุ "member" เอง)
 */
export async function isAiCapReached(tier: "guest" | "member" = "guest"): Promise<boolean> {
  const day = utcDay();
  if (!memo || memo.day !== day || Date.now() - memo.at > MEMO_MS) {
    const raw = await kvGetJSON<{ count: number }>(KEY.aiCap(day)).catch(() => null);
    memo = { day, count: raw?.count ?? 0, at: Date.now() };
  }
  const cap = getAiDailyCap();
  const effective = tier === "member" ? cap : Math.floor(cap * GUEST_CAP_RATIO);
  return memo.count >= effective;
}

/**
 * เรียกหลังจุด Gemini call สำเร็จ (ใน done handler) — best-effort, background
 */
export async function recordAiCall(n = 1): Promise<void> {
  const day = utcDay();
  try {
    const waitUntil = await getWaitUntil();
    waitUntil(
      (async () => {
        const k = KEY.aiCap(day);
        const cur = (await kvGetJSON<{ count: number }>(k).catch(() => null))?.count ?? 0;
        await kvPutJSON(k, { count: cur + n }, { expirationTtl: 60 * 60 * 48 }).catch(() => {});
        if (memo?.day === day) {
          memo.count = cur + n;
        }
      })()
    );
  } catch {
    // If background waitUntil fails or is not available
    const k = KEY.aiCap(day);
    const cur = (await kvGetJSON<{ count: number }>(k).catch(() => null))?.count ?? 0;
    await kvPutJSON(k, { count: cur + n }, { expirationTtl: 60 * 60 * 48 }).catch(() => {});
    if (memo?.day === day) {
      memo.count = cur + n;
    }
  }
}

const DEFAULT_IP_READ_QUOTA = 40; // 40 readings per day per IP
const ipMemo = new Map<string, { count: number; at: number }>();

function hashIpForDay(ip: string, day: string): string {
  return createHash("sha256").update(`${ip}:${day}`).digest("hex").slice(0, 16);
}

/**
 * ตรวจสอบโควตาการเปิดไพ่ต่อ IP ข้าม Edge fleet (Cloudflare KV Backed)
 * ป้องกันการยิงคำขอต่อเนื่องข้าม Edge Nodes
 */
export async function checkPerIpReadQuota(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  const day = utcDay();
  const ipHash = hashIpForDay(ip, day);
  const cacheKey = `${day}:${ipHash}`;

  const cached = ipMemo.get(cacheKey);
  if (cached && Date.now() - cached.at < 20_000) {
    const rem = Math.max(0, DEFAULT_IP_READ_QUOTA - cached.count);
    return { allowed: cached.count < DEFAULT_IP_READ_QUOTA, remaining: rem };
  }

  const kvKey = `app:ipq:read:${day}:${ipHash}`;
  const raw = await kvGetJSON<{ count: number }>(kvKey).catch(() => null);
  const count = raw?.count ?? 0;
  ipMemo.set(cacheKey, { count, at: Date.now() });

  const remaining = Math.max(0, DEFAULT_IP_READ_QUOTA - count);
  return { allowed: count < DEFAULT_IP_READ_QUOTA, remaining };
}

// ─────────────────────────────────────────────────────────────────────────────
// เพดานเฉพาะผู้เยี่ยมชม (ENTITLEMENT_PLAN — ป้องกันการล้างคุกกี้ซ้ำเพื่อเผางบ AI)
// ต่อ IP: ต่ำ (household NAT ที่ชน = โอกาสให้สมัคร ไม่ใช่ error)
// ต่อซับเน็ต /24 (IPv4) หรือ /64 (IPv6): จับ IP rotation ในผู้กระทำรายเดียว
// ทั้งคู่นับเฉพาะ "อ่านจบจริง" · KV eventually-consistent (~60s) — ยอมรับได้ตามข้อ 3
// ─────────────────────────────────────────────────────────────────────────────
const GUEST_IP_DAILY = numFromEnv("GUEST_IP_DAILY_READS", 5);
const GUEST_SUBNET_DAILY = numFromEnv("GUEST_SUBNET_DAILY_READS", 20);
const guestQuotaMemo = new Map<string, { count: number; at: number }>();

function numFromEnv(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** ย่อ IP เป็น prefix ซับเน็ต: IPv4 → /24 · IPv6 → /64 (คร่าว ๆ พอสำหรับ bucket) */
export function subnetPrefix(ip: string): string {
  if (ip.includes(":")) {
    const h = ip.split(":");
    return h.slice(0, 4).join(":") + "::/64";
  }
  const o = ip.split(".");
  return o.length === 4 ? `${o[0]}.${o[1]}.${o[2]}.0/24` : ip;
}

async function readCounter(kvKey: string): Promise<number> {
  const cached = guestQuotaMemo.get(kvKey);
  if (cached && Date.now() - cached.at < 20_000) return cached.count;
  const raw = await kvGetJSON<{ count: number }>(kvKey).catch(() => null);
  const count = raw?.count ?? 0;
  guestQuotaMemo.set(kvKey, { count, at: Date.now() });
  return count;
}

/** true ถ้าผู้เยี่ยมชมจาก IP/ซับเน็ตนี้เปิดไพ่ครบเพดานวันนี้แล้ว */
export async function isGuestReadQuotaReached(ip: string): Promise<boolean> {
  const day = utcDay();
  const ipHash = hashIpForDay(ip, day);
  const subHash = hashIpForDay(subnetPrefix(ip), day);
  const [ipCount, subCount] = await Promise.all([
    readCounter(KEY.guestIpQuota(day, ipHash)),
    readCounter(KEY.guestSubnetQuota(day, subHash)),
  ]);
  return ipCount >= GUEST_IP_DAILY || subCount >= GUEST_SUBNET_DAILY;
}

/** บันทึกการเปิดไพ่ของผู้เยี่ยมชม (เรียกตอนอ่านจบจริงเท่านั้น) · caller ห่อ `void` เอง */
export async function recordGuestRead(ip: string): Promise<void> {
  const day = utcDay();
  const keys = [
    KEY.guestIpQuota(day, hashIpForDay(ip, day)),
    KEY.guestSubnetQuota(day, hashIpForDay(subnetPrefix(ip), day)),
  ];
  for (const k of keys) {
    const cur = (await kvGetJSON<{ count: number }>(k).catch(() => null))?.count ?? 0;
    await kvPutJSON(k, { count: cur + 1 }, { expirationTtl: 60 * 60 * 36 }).catch(() => {});
    guestQuotaMemo.set(k, { count: cur + 1, at: Date.now() });
  }
}

/**
 * บันทึกการใช้งานโควตาต่อ IP หลังเริ่มอ่านสำเร็จ
 */
export async function recordPerIpReadQuota(ip: string): Promise<void> {
  const day = utcDay();
  const ipHash = hashIpForDay(ip, day);
  const cacheKey = `${day}:${ipHash}`;
  const kvKey = `app:ipq:read:${day}:${ipHash}`;

  try {
    const waitUntil = await getWaitUntil();
    waitUntil(
      (async () => {
        const raw = await kvGetJSON<{ count: number }>(kvKey).catch(() => null);
        const newCount = (raw?.count ?? 0) + 1;
        await kvPutJSON(kvKey, { count: newCount }, { expirationTtl: 60 * 60 * 24 }).catch(() => {});
        ipMemo.set(cacheKey, { count: newCount, at: Date.now() });
      })()
    );
  } catch {
    const raw = await kvGetJSON<{ count: number }>(kvKey).catch(() => null);
    const newCount = (raw?.count ?? 0) + 1;
    await kvPutJSON(kvKey, { count: newCount }, { expirationTtl: 60 * 60 * 24 }).catch(() => {});
    ipMemo.set(cacheKey, { count: newCount, at: Date.now() });
  }
}

