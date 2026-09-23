import { createHash } from "node:crypto";

import { getAppDB } from "@/lib/platform/db";
import { isRedisEnabled, redisIncrBy } from "@/lib/platform/redis";
import { recordEvent } from "@/lib/stats/record";

/**
 * 🚦 เพดานอัตราคำขอที่ **บังคับได้จริงข้าม isolate** (Distributed Rate Limit)
 * ---------------------------------------------------------------------------
 * ## ทำไมต้องมีไฟล์นี้ (T-11 · T-12)
 *
 * `checkRateLimit()` ใน `lib/utils/rate-limit.ts` เก็บสถานะทั้งหมดใน `Map` ระดับโมดูล
 * Cloudflare รัน isolate หลายตัวต่อ colo และรีไซเคิลตลอดเวลา เพดานจริงจึงเท่ากับ
 * **"เพดาน × จำนวน isolate ที่คำขอไปตก"** และรีเซ็ตทุกครั้งที่ isolate ถูกทิ้ง
 *
 * ## ที่เก็บ (ลำดับที่ลอง)
 *
 * 1. Redis `INCRBY` — ถ้าตั้งค่าไว้ (atomic)
 * 2. D1 ตาราง `edge_rate_buckets` (migrations/0018) — `INSERT … ON CONFLICT … RETURNING`
 *    นับและตัดสินในคำสั่งเดียว แพตเทิร์นเดียวกับ `auth-ratelimit.ts`
 *    (เดิมเป็น KV อ่าน ➔ +1 ➔ เขียน ซึ่งไม่ atomic และกินโควตาเขียน KV 1,000 ครั้ง/วัน)
 * 3. หน่วยความจำของ isolate — ทางถอยสุดท้าย
 *
 * ## นโยบายเมื่อที่เก็บใช้ไม่ได้
 *
 * **fail-closed ไม่ได้** เพราะ D1/Redis ล่ม = ทั้งเว็บใช้ไม่ได้
 * จึงถอยไปใช้บักเก็ตในหน่วยความจำ (ซึ่งยังกันคนกดรัวจากเครื่องเดียวได้จริง
 * เพราะคำขอต่อเนื่องมักตกที่ isolate เดิม) **พร้อมยิง metric ทุกครั้ง** ไม่ใช่เงียบ
 *
 * ## ข้อแลกเปลี่ยนที่ยอมรับ
 *
 * - คำขอที่ผ่านต้องรอ D1 หนึ่งรอบต่อชั้น (หลักมิลลิวินาที) — ถูกกว่าค่าโมเดลที่ทะลุเพดานมาก
 * - ความ "เข้าคิวพร้อมกัน" (`maxConcurrent`) ยังอยู่ในหน่วยความจำตามเดิม — เป็นตัวกัน
 *   กดซ้ำซ้อนของผู้ใช้คนเดียว ไม่ใช่ด่านค่าใช้จ่าย และพังแบบไม่มีผลเสีย
 */

interface Bucket {
  count: number;
  resetAt: number;
}

export interface EdgeRateLimitConfig {
  /** จำนวนคำขอสูงสุดในหนึ่งหน้าต่าง */
  max: number;
  /** ความยาวหน้าต่าง (วินาที) */
  windowSec: number;
}

export interface EdgeRateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

/** สำเนาในหน่วยความจำ — ใช้ตอน D1/Redis ใช้ไม่ได้ และตอนรันในเครื่อง */
const memoryBuckets = new Map<string, Bucket>();

function pruneMemory(now: number): void {
  if (memoryBuckets.size < 2000) return;
  for (const [k, b] of memoryBuckets) {
    if (b.resetAt <= now) memoryBuckets.delete(k);
  }
}

/** ไม่เก็บ IP ดิบลงที่เก็บถาวร — แฮชก่อนเสมอ (PDPA) */
function hashPart(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

/**
 * สร้างคีย์ของถัง — `scope` คือชื่อปลายทาง (`chat` / `clarify` / …)
 * และ `identity` คือ IP หรือ userId ซึ่งถูกแฮชให้เอง
 */
export function edgeRateLimitKey(scope: string, identity: string): string {
  return `app:edgerl:${scope}:${hashPart(identity)}`;
}

function bucketFromMemory(key: string, now: number): Bucket | null {
  const b = memoryBuckets.get(key);
  if (!b) return null;
  if (b.resetAt <= now) {
    memoryBuckets.delete(key);
    return null;
  }
  return b;
}

function denyResult(resetAt: number, now: number): EdgeRateLimitResult {
  return {
    allowed: false,
    remaining: 0,
    retryAfterSec: Math.max(1, Math.ceil((resetAt - now) / 1000)),
  };
}

/** ผลการนับหนึ่งครั้ง — `count` คือค่า **หลัง** นับแล้ว */
interface Tally {
  count: number;
  resetAt: number;
  store: "redis" | "d1" | "memory";
}

/**
 * บวกถังแบบ atomic แล้วคืนค่าที่นับได้จริง (`delta` ติดลบ = คืนสิทธิ์)
 * ลำดับที่เก็บ: Redis (ถ้าตั้งไว้) ➔ D1 `edge_rate_buckets` ➔ หน่วยความจำของ isolate
 */
async function tally(key: string, windowSec: number, delta: number): Promise<Tally> {
  const now = Date.now();
  const freshReset = now + windowSec * 1000;

  // ── Redis INCRBY (atomic) ──────────────────────────────────────────────────
  if (await isRedisEnabled()) {
    const next = await redisIncrBy(key, delta, windowSec);
    if (next !== null) return { count: next, resetAt: freshReset, store: "redis" };
    recordEvent("ratelimit_store_degraded:redis");
  }

  // ── D1: นับและคืนค่าในคำสั่งเดียว (แพตเทิร์นเดียวกับ auth-ratelimit.ts) ──────
  // เดิมใช้ KV แบบ อ่าน ➔ +1 ➔ เขียน ซึ่งไม่ atomic และกินโควตาเขียน KV 1,000 ครั้ง/วัน
  try {
    const db = await getAppDB();
    const row = await db
      .prepare(
        `INSERT INTO edge_rate_buckets (key, count, reset_at) VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET
           count    = CASE WHEN edge_rate_buckets.reset_at <= ? THEN excluded.count ELSE MAX(0, edge_rate_buckets.count + ?) END,
           reset_at = CASE WHEN edge_rate_buckets.reset_at <= ? THEN excluded.reset_at ELSE edge_rate_buckets.reset_at END
         RETURNING count, reset_at`,
      )
      .bind(key, Math.max(0, delta), freshReset, now, delta, now)
      .first<{ count: number; reset_at: number }>();
    if (row) {
      // กวาดแถวหมดอายุเป็นครั้งคราว — ไม่งั้นตารางโตตามจำนวน IP ที่เคยยิงมา
      if (Math.random() < 0.01) {
        await db.prepare(`DELETE FROM edge_rate_buckets WHERE reset_at < ?`).bind(now).run().catch(() => undefined);
      }
      return { count: Number(row.count), resetAt: Number(row.reset_at), store: "d1" };
    }
  } catch {
    // ตกไปใช้หน่วยความจำด้านล่าง
  }
  // D1 ไม่พร้อม (ตารางยังไม่ migrate / ล่ม) — ถอยไปหน่วยความจำ **แต่ต้องเห็นได้ว่าเกิดขึ้น**
  recordEvent("ratelimit_store_degraded:d1");

  // ── หน่วยความจำของ isolate นี้ ───────────────────────────────────────────────
  pruneMemory(now);
  const existing = bucketFromMemory(key, now);
  const bucket = existing
    ? { count: Math.max(0, existing.count + delta), resetAt: existing.resetAt }
    : { count: Math.max(0, delta), resetAt: freshReset };
  memoryBuckets.set(key, bucket);
  return { ...bucket, store: "memory" };
}

function toResult(t: Tally, config: EdgeRateLimitConfig, now: number): EdgeRateLimitResult {
  if (t.count > config.max) {
    // Redis ไม่รู้เวลาหมดอายุจริงของคีย์ — บอกให้รอทั้งหน้าต่าง (เหมือนเดิม)
    return t.store === "redis"
      ? { allowed: false, remaining: 0, retryAfterSec: config.windowSec }
      : denyResult(t.resetAt, now);
  }
  return { allowed: true, remaining: config.max - t.count, retryAfterSec: 0 };
}

/**
 * นับหนึ่งครั้งแล้วบอกว่าผ่านไหม — เรียก **ก่อน** ทำงานหนัก (ก่อนเรียกโมเดล) เสมอ
 * ตัดสินจากค่าที่นับได้จริงหลังบวก (atomic) ไม่ใช่ค่าที่อ่านไว้ก่อน —
 * คำขอที่ยิงพร้อมกันจึงไม่มีทางผ่านเพดานไปได้ · คำขอที่ถูกปฏิเสธถูกคืนสิทธิ์ ไม่กินหน้าต่างต่อ
 */
export async function consumeEdgeRateLimit(
  key: string,
  config: EdgeRateLimitConfig,
): Promise<EdgeRateLimitResult> {
  return consumeEdgeRateLimits([{ key, config }]);
}

/**
 * ตรวจเพดานของ "ตัวตน" หลายชั้นพร้อมกัน (IP และ userId)
 * ชั้นไหนเต็มก็ปฏิเสธทันที — และ **นับเฉพาะเมื่อผ่านครบทุกชั้น**
 * (ชั้นที่นับไปแล้วถูกคืนสิทธิ์) ไม่งั้นคนที่ถูกปฏิเสธเพราะชั้นหนึ่งเต็ม
 * จะไปกินโควตาของอีกชั้นฟรี ๆ
 */
export async function consumeEdgeRateLimits(
  entries: Array<{ key: string; config: EdgeRateLimitConfig }>,
): Promise<EdgeRateLimitResult> {
  const now = Date.now();
  const counted: Array<{ key: string; windowSec: number }> = [];
  let worst: EdgeRateLimitResult = { allowed: true, remaining: Number.MAX_SAFE_INTEGER, retryAfterSec: 0 };

  for (const { key, config } of entries) {
    const t = await tally(key, config.windowSec, 1);
    counted.push({ key, windowSec: config.windowSec });
    const res = toResult(t, config, now);
    if (!res.allowed) {
      await Promise.all(counted.map((c) => tally(c.key, c.windowSec, -1).catch(() => undefined)));
      return res;
    }
    if (res.remaining < worst.remaining) worst = res;
  }
  return worst;
}
