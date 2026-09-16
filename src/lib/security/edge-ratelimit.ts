import { createHash } from "node:crypto";

import { getAppKV } from "@/lib/platform/cf";
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
 * รีโปนี้เคยเจอปัญหาเดียวกันกับบักเก็ตล็อกอินแอดมินและย้ายไป KV แก้ไปแล้ว
 * (`lib/security/auth-ratelimit.ts`) แต่ไม่ได้ย้ายเส้นทางที่เรียก AI ตามมาด้วย
 * ซึ่งเป็นเส้นทางที่ "ทะลุเพดาน" แล้วเสียเงินจริงทุกคำขอ
 *
 * ## นโยบายเมื่อที่เก็บใช้ไม่ได้
 *
 * **fail-closed ไม่ได้** เพราะ KV/Redis ล่ม = ทั้งเว็บใช้ไม่ได้
 * จึงถอยไปใช้บักเก็ตในหน่วยความจำ (ซึ่งยังกันคนกดรัวจากเครื่องเดียวได้จริง
 * เพราะคำขอต่อเนื่องมักตกที่ isolate เดิม) **พร้อมยิง metric ทุกครั้ง** ไม่ใช่เงียบ
 *
 * ## ข้อแลกเปลี่ยนที่ยอมรับ
 *
 * - Redis (`INCRBY`) เป็น atomic จึงแม่นจริง — เป็นเส้นทางที่ต้องการ
 * - KV เป็น read-modify-write จึงนับขาดได้เมื่อยิงพร้อมกันหลาย isolate
 *   แต่ยังดีกว่า `Map` ต่อ isolate หลายเท่า และเป็นแพตเทิร์นเดียวกับ `auth-ratelimit.ts`
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

/** สำเนาในหน่วยความจำ — ใช้ตอน KV/Redis ใช้ไม่ได้ และตอนรันในเครื่อง */
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

/**
 * นับหนึ่งครั้งแล้วบอกว่าผ่านไหม
 * เรียก **ก่อน** ทำงานหนัก (ก่อนเรียกโมเดล) เสมอ
 */
export async function consumeEdgeRateLimit(
  key: string,
  config: EdgeRateLimitConfig,
): Promise<EdgeRateLimitResult> {
  const now = Date.now();
  const windowMs = config.windowSec * 1000;

  // ── เส้นทางที่ดีที่สุด: Redis INCRBY แบบ atomic ────────────────────────────
  if (await isRedisEnabled()) {
    const next = await redisIncrBy(key, 1, config.windowSec);
    if (next !== null) {
      if (next > config.max) {
        return { allowed: false, remaining: 0, retryAfterSec: config.windowSec };
      }
      return { allowed: true, remaining: config.max - next, retryAfterSec: 0 };
    }
    recordEvent("ratelimit_store_degraded:redis");
  }

  // ── เส้นทางรอง: บักเก็ตบน KV (read-modify-write เหมือน auth-ratelimit.ts) ──
  try {
    const kv = await getAppKV();
    const raw = await kv.get(key);
    const stored = raw ? (JSON.parse(raw) as Bucket) : null;
    const bucket =
      stored && now < stored.resetAt ? stored : { count: 0, resetAt: now + windowMs };

    if (bucket.count >= config.max) return denyResult(bucket.resetAt, now);

    bucket.count += 1;
    memoryBuckets.set(key, bucket);
    const ttl = Math.max(60, Math.ceil((bucket.resetAt - now) / 1000));
    await kv.put(key, JSON.stringify(bucket), { expirationTtl: ttl });
    return { allowed: true, remaining: config.max - bucket.count, retryAfterSec: 0 };
  } catch {
    // KV ไม่พร้อม (dev / binding หาย) — ถอยไปหน่วยความจำ **แต่ต้องเห็นได้ว่าเกิดขึ้น**
    recordEvent("ratelimit_store_degraded:kv");
  }

  // ── เส้นทางสุดท้าย: หน่วยความจำของ isolate นี้ ─────────────────────────────
  pruneMemory(now);
  const existing = bucketFromMemory(key, now);
  const bucket = existing ?? { count: 0, resetAt: now + windowMs };
  if (bucket.count >= config.max) return denyResult(bucket.resetAt, now);
  bucket.count += 1;
  memoryBuckets.set(key, bucket);
  return { allowed: true, remaining: config.max - bucket.count, retryAfterSec: 0 };
}

/**
 * ตรวจเพดานของ "ตัวตน" หลายชั้นพร้อมกัน (IP และ userId)
 * ชั้นไหนเต็มก่อนก็ปฏิเสธทันที — และ **นับเฉพาะเมื่อผ่านครบทุกชั้น**
 * ไม่งั้นคนที่ถูกปฏิเสธเพราะชั้นหนึ่งเต็ม จะไปกินโควตาของอีกชั้นฟรี ๆ
 */
export async function consumeEdgeRateLimits(
  entries: Array<{ key: string; config: EdgeRateLimitConfig }>,
): Promise<EdgeRateLimitResult> {
  for (const { key, config } of entries) {
    const peek = await peekEdgeRateLimit(key, config);
    if (!peek.allowed) return peek;
  }

  let worst: EdgeRateLimitResult = { allowed: true, remaining: Number.MAX_SAFE_INTEGER, retryAfterSec: 0 };
  for (const { key, config } of entries) {
    const res = await consumeEdgeRateLimit(key, config);
    if (!res.allowed) return res;
    if (res.remaining < worst.remaining) worst = res;
  }
  return worst;
}

/** ดูว่าเต็มหรือยังโดยไม่นับเพิ่ม */
export async function peekEdgeRateLimit(
  key: string,
  config: EdgeRateLimitConfig,
): Promise<EdgeRateLimitResult> {
  const now = Date.now();

  if (await isRedisEnabled()) {
    const { redisGetCount } = await import("@/lib/platform/redis");
    const count = await redisGetCount(key);
    if (count !== null) {
      return count >= config.max
        ? { allowed: false, remaining: 0, retryAfterSec: config.windowSec }
        : { allowed: true, remaining: config.max - count, retryAfterSec: 0 };
    }
  }

  try {
    const kv = await getAppKV();
    const raw = await kv.get(key);
    const stored = raw ? (JSON.parse(raw) as Bucket) : null;
    if (stored && now < stored.resetAt && stored.count >= config.max) {
      return denyResult(stored.resetAt, now);
    }
    return {
      allowed: true,
      remaining: config.max - (stored && now < stored.resetAt ? stored.count : 0),
      retryAfterSec: 0,
    };
  } catch {
    const b = bucketFromMemory(key, now);
    if (b && b.count >= config.max) return denyResult(b.resetAt, now);
    return { allowed: true, remaining: config.max - (b?.count ?? 0), retryAfterSec: 0 };
  }
}
