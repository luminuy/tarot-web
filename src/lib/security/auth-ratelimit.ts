import { createHash } from "node:crypto";
import { getAppDB } from "@/lib/platform/db";
import { isPrivilegedTestRequest } from "@/lib/security/privileged";
import { getClientIdentifier } from "@/lib/utils/rate-limit";

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

// สำเนาในหน่วยความจำ — ใช้เมื่อ D1 ยังไม่พร้อม (ตารางยังไม่ migrate / ล่ม)
const memoryBuckets = new Map<string, RateLimitBucket>();

/**
 * ⚠️ ใช้ตัวเดียวกับ rate limiter หลัก (`getClientIdentifier`) เสมอ
 * ของเดิมมีสำเนาของตัวเองที่หยิบ `x-forwarded-for` ตัว **ซ้ายสุด** ซึ่งไคลเอนต์
 * ปลอมได้ทั้งหมด — ถ้าวันไหนไม่มี `cf-connecting-ip` (เช่นย้ายออกจาก Cloudflare
 * หรือเรียกผ่าน proxy ชั้นอื่น) ผู้โจมตีแค่หมุนค่า header ก็ข้ามเพดานเดารหัสผ่านได้ทันที
 * ตัวหลักหยิบ hop **ขวาสุด** ซึ่งเป็นค่าที่ proxy ของเราเติมเอง ปลอมไม่ได้
 */
function getClientIp(request: Request): string {
  return getClientIdentifier(request);
}

/**
 * ⚠️ ห้ามผสม "วันที่" ลงในคีย์
 * ของเดิมใช้ `sha256(value:YYYY-MM-DD)` ทำให้ทุกถังถูกรีเซ็ตเองตอนเที่ยงคืน UTC
 * (06:00 ตามเวลาไทย) — ผู้โจมตีที่ชนเพดานแค่รอถึงเวลานั้นก็ได้โควตาใหม่ทันที
 * อายุถังต้องมาจาก `resetAt` + TTL ของ KV เท่านั้น
 */
function hashKey(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

export type AuthRateLimitAction =
  | "login"
  | "signup"
  | "forgot"
  | "resend"
  | "reset"
  | "verify"
  | "admin_login"
  | "tester_login"
  | "redeem";

interface AuthRateLimitConfig {
  /** เพดานต่อ IP — ต้องกว้างกว่าต่อบัญชี เพราะมือถือไทยแชร์ IP กัน (CGNAT) ทั้งเสา */
  ipMax: number;
  /** เพดานต่อ "IP + บัญชี" คู่นี้ — ด่านหลักที่กันการไล่เดารหัสผ่านของเหยื่อรายเดียว */
  pairMax: number;
  /** เพดานรวมต่อบัญชี (ทุก IP) — กันการเดาแบบกระจาย IP */
  idMax: number;
  windowSec: number;
}

/**
 * ⚠️ ทำไมต้องมีถัง "IP + บัญชี" แยกจากถัง "บัญชี"
 * ถ้ามีแต่ถังต่อบัญชีที่เพดานต่ำ ใครก็ตามที่รู้อีเมลของเหยื่อจะยิงรหัสผ่านมั่ว ๆ
 * ให้ครบเพดานเพื่อ **ล็อกเจ้าของบัญชีตัวจริงออกจากระบบ** ได้ทันที (lockout DoS)
 * จึงต้องให้ด่านที่แคบที่สุดผูกกับ IP ของผู้พยายาม ส่วนถังรวมต่อบัญชีตั้งไว้กว้าง
 * พอที่คนยิงจาก IP เดียวจะไปไม่ถึง — ต้องกระจายหลาย IP เท่านั้นถึงจะแตะได้
 */
const ACTION_CONFIGS: Record<AuthRateLimitAction, AuthRateLimitConfig> = {
  login: { ipMax: 40, pairMax: 10, idMax: 60, windowSec: 15 * 60 },
  signup: { ipMax: 30, pairMax: 8, idMax: 15, windowSec: 15 * 60 },
  forgot: { ipMax: 15, pairMax: 5, idMax: 10, windowSec: 30 * 60 },
  resend: { ipMax: 15, pairMax: 5, idMax: 10, windowSec: 30 * 60 },
  reset: { ipMax: 20, pairMax: 5, idMax: 20, windowSec: 30 * 60 },
  verify: { ipMax: 30, pairMax: 10, idMax: 15, windowSec: 15 * 60 },
  /**
   * ⚠️ ทางเข้าแอดมินมีปัจจัยเดียวคือ ADMIN_PASSWORD และไม่มีระบบล็อกบัญชี
   * เดิมใช้ตัวจำกัดที่เก็บใน Map ของหน่วยความจำ ซึ่งบน Workers แต่ละ isolate
   * มีสำเนาของตัวเอง เพดาน "5 ครั้ง/15 นาที" จึงกลายเป็น 5 คูณจำนวน isolate
   * และรีเซ็ตทุกครั้งที่ isolate ถูกรีไซเคิล — การเดารหัสผ่านแบบกระจายจึงได้
   * โควตามากกว่าที่ตัวเลขบอกไว้มาก · ย้ายมาใช้ถังที่อยู่บน KV ซึ่งทุก isolate
   * ทุก colo เห็นค่าเดียวกัน · ไม่มี identifier (ไม่มีชื่อผู้ใช้) จึงนับต่อ IP ล้วน
   */
  admin_login: { ipMax: 8, pairMax: 8, idMax: 8, windowSec: 15 * 60 },
  tester_login: { ipMax: 12, pairMax: 12, idMax: 12, windowSec: 15 * 60 },
  /**
   * 🎟 การไล่เดารหัสแลกสิทธิ์ — เดาถูกใบเดียวได้รอบเปิดไพ่ฟรี (หรือสิทธิ์พรีเมียมถ้าเป็นรหัส VIP)
   * ผู้ยิงต้องล็อกอินก่อน จึงนับ identifier เป็น userId ได้ · ตั้งกว้างพอสำหรับคนพิมพ์ผิดจริง ๆ
   * แต่แคบพอที่การไล่เดาจะไม่คุ้ม (รหัสสุ่มจากแผงแอดมินมีพื้นที่ 31^8 ตัวอักษร)
   */
  redeem: { ipMax: 20, pairMax: 10, idMax: 10, windowSec: 60 * 60 },
};

interface ScopedKey {
  key: string;
  max: number;
}

/** คีย์ของถัง "บัญชี" — ถังเดียวที่ยอมให้ล้างทิ้งเมื่อยืนยันตัวตนสำเร็จ */
function identifierKeys(action: AuthRateLimitAction, ipHash: string, identifier: string): string[] {
  const idHash = hashKey(`id:${identifier}`);
  return [
    `app:authrl:${action}:pair:${ipHash}:${idHash}`,
    `app:authrl:${action}:id:${idHash}`,
  ];
}

function keysFor(request: Request, action: AuthRateLimitAction, identifier?: string): ScopedKey[] {
  const config = ACTION_CONFIGS[action];
  const ipHash = hashKey(`ip:${getClientIp(request)}`);
  const keys: ScopedKey[] = [{ key: `app:authrl:${action}:ip:${ipHash}`, max: config.ipMax }];

  const trimmed = identifier?.toLowerCase().trim();
  if (trimmed) {
    const [pairKey, idKey] = identifierKeys(action, ipHash, trimmed);
    keys.push({ key: pairKey, max: config.pairMax });
    keys.push({ key: idKey, max: config.idMax });
  }
  return keys;
}

/**
 * กวาดถังที่หมดอายุออกจากหน่วยความจำ
 * สำเนาใน KV หมดอายุเองด้วย TTL แต่สำเนาในหน่วยความจำไม่เคยหมดอายุ
 * ทุกความพยายามล็อกอินที่ล้มเหลวจาก IP ใหม่ทิ้ง entry ไว้ถาวรสูงสุด 3 รายการ
 * ซึ่งพอดีกับรูปแบบทราฟฟิกแบบ credential stuffing ที่ทำให้ Map โตเร็วที่สุด
 */
function pruneExpiredBuckets(now: number): void {
  if (memoryBuckets.size < 2000) return;
  for (const [k, b] of memoryBuckets) {
    if (b.resetAt <= now) memoryBuckets.delete(k);
  }
}

/*
 * 🚦 ที่เก็บถัง = ตาราง D1 `auth_rate_buckets` (migrations/0016 · A1-02)
 * ---------------------------------------------------------------------------
 * เดิมเก็บใน KV แบบ อ่าน ➔ +1 ➔ เขียน ซึ่ง **ไม่ atomic** และ KV รับเขียนคีย์เดียวได้
 * 1 ครั้ง/วินาที (ที่เกินถูกกลืนเงียบ) — ยิงพร้อมกัน 200 คำขอ ทุกตัวอ่านเจอ count < max
 * แล้วผ่านหมด · ตอนนี้ "นับแล้วคืนค่าที่นับได้" ในคำสั่งเดียว แล้วตัดสินจากค่าที่คืน
 * ไม่ใช่ค่าที่อ่านไว้ก่อนหน้า — คำขอที่ 9 ของหน้าต่างเดียวกันเห็น 9 เสมอ ไม่ว่าจะยิงพร้อมกันแค่ไหน
 *
 * D1 ใช้ไม่ได้ (ตารางยังไม่ migrate / ล่ม) ➔ ถอยไปใช้หน่วยความจำ (ดีกว่าไม่มีด่านเลย)
 */
async function incrementBucket(key: string, windowSec: number, delta = 1): Promise<RateLimitBucket> {
  const now = Date.now();
  const freshReset = now + windowSec * 1000;
  try {
    const db = await getAppDB();
    const row = await db
      .prepare(
        `INSERT INTO auth_rate_buckets (key, count, reset_at) VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET
           count    = CASE WHEN auth_rate_buckets.reset_at <= ? THEN excluded.count ELSE MAX(0, auth_rate_buckets.count + ?) END,
           reset_at = CASE WHEN auth_rate_buckets.reset_at <= ? THEN excluded.reset_at ELSE auth_rate_buckets.reset_at END
         RETURNING count, reset_at`
      )
      .bind(key, Math.max(0, delta), freshReset, now, delta, now)
      .first<{ count: number; reset_at: number }>();
    if (row) {
      // กวาดแถวที่หมดอายุทิ้งเป็นครั้งคราว (ราว 1 ใน 100 ครั้ง) — ไม่งั้นตารางโตตาม IP ที่เคยยิงมา
      if (Math.random() < 0.01) {
        await db.prepare(`DELETE FROM auth_rate_buckets WHERE reset_at < ?`).bind(now).run().catch(() => undefined);
      }
      return { count: Number(row.count), resetAt: Number(row.reset_at) };
    }
  } catch {
    // ตกไปใช้หน่วยความจำ
  }
  pruneExpiredBuckets(now);
  const cached = memoryBuckets.get(key);
  const bucket =
    cached && now < cached.resetAt
      ? { count: Math.max(0, cached.count + delta), resetAt: cached.resetAt }
      : { count: Math.max(0, delta), resetAt: freshReset };
  memoryBuckets.set(key, bucket);
  return bucket;
}

async function clearBucket(key: string): Promise<void> {
  memoryBuckets.delete(key);
  try {
    const db = await getAppDB();
    await db.prepare(`DELETE FROM auth_rate_buckets WHERE key = ?`).bind(key).run();
  } catch {
    // ignore
  }
}

export interface AuthRateLimitResult {
  allowed: boolean;
  retryAfterSec?: number;
}

/** นับก่อนแล้วตัดสินจากค่าที่นับได้จริง (atomic) — ห้ามกลับไปใช้ peek แล้วค่อยนับ */
async function reserveUnchecked(
  request: Request,
  action: AuthRateLimitAction,
  identifier?: string
): Promise<AuthRateLimitResult> {
  const now = Date.now();
  const windowSec = ACTION_CONFIGS[action].windowSec;
  let retryAfterSec = 0;
  for (const { key, max } of keysFor(request, action, identifier)) {
    const bucket = await incrementBucket(key, windowSec);
    if (bucket.count > max) {
      retryAfterSec = Math.max(retryAfterSec, Math.ceil((bucket.resetAt - now) / 1000));
    }
  }
  return retryAfterSec > 0 ? { allowed: false, retryAfterSec: Math.max(1, retryAfterSec) } : { allowed: true };
}

/**
 * จองสิทธิ์ลองยืนยันตัวตน 1 ครั้ง **ก่อน** ตรวจรหัสผ่าน (atomic — A1-02)
 * ใช้คู่กับ `releaseAuthAttempt` เมื่อสำเร็จ ผลรวมจึงยังเป็น "นับเฉพาะครั้งที่ผิด" เหมือนเดิม
 * แต่คำขอที่ยิงพร้อมกันไม่มีทางผ่านเพดานไปได้ เพราะแต่ละคำขอเห็นค่าที่ตัวเองนับเพิ่มแล้ว
 */
export async function reserveAuthAttempt(
  request: Request,
  action: AuthRateLimitAction,
  identifier?: string
): Promise<AuthRateLimitResult> {
  if (await isPrivilegedTestRequest(request)) return { allowed: true };
  return reserveUnchecked(request, action, identifier);
}

/**
 * คืนสิทธิ์ที่จองไว้เมื่อยืนยันตัวตนสำเร็จ — ถัง IP ลดลง 1 (ครั้งที่สำเร็จไม่นับ)
 * ส่วนถังของบัญชีล้างทิ้งทั้งถัง (ตรรกะเดียวกับ clearAuthRateLimit)
 */
export async function releaseAuthAttempt(
  request: Request,
  action: AuthRateLimitAction,
  identifier?: string
): Promise<void> {
  const windowSec = ACTION_CONFIGS[action].windowSec;
  const ipHash = hashKey(`ip:${getClientIp(request)}`);
  await incrementBucket(`app:authrl:${action}:ip:${ipHash}`, windowSec, -1);
  await clearAuthRateLimit(request, action, identifier);
}

/**
 * ล้างถังของบัญชีนี้เมื่อยืนยันตัวตนสำเร็จ
 * ⚠️ ล้างเฉพาะถัง "บัญชี" — ถัง IP ต้องคงไว้ ไม่งั้นผู้โจมตีที่มีบัญชีของตัวเอง
 * ล็อกอินสำเร็จสลับกับการเดารหัสผ่านบัญชีคนอื่นได้ไม่จำกัด
 */
export async function clearAuthRateLimit(
  request: Request,
  action: AuthRateLimitAction,
  identifier?: string
): Promise<void> {
  const trimmed = identifier?.toLowerCase().trim();
  if (!trimmed) return;
  const ipHash = hashKey(`ip:${getClientIp(request)}`);
  for (const key of identifierKeys(action, ipHash, trimmed)) {
    await clearBucket(key);
  }
}

/**
 * ตรวจ + นับในก้าวเดียว — ใช้กับ action ที่ "ทุกครั้งที่เรียกคือการทำรายการจริง"
 * (สมัครสมาชิก / ขอลิงก์ตั้งรหัสผ่าน / ขอส่งอีเมลยืนยันใหม่)
 *
 * ⚠️ ห้ามใช้กับการเข้าสู่ระบบ — ถ้านับทุกครั้งรวมครั้งที่สำเร็จ ใครก็ตามที่รู้อีเมล
 * ของเหยื่อจะยิงรหัสผ่านมั่ว ๆ ให้ครบเพดานเพื่อล็อกเจ้าของบัญชีออกจากระบบได้
 */
export async function checkAuthRateLimit(
  request: Request,
  action: AuthRateLimitAction,
  identifier?: string
): Promise<AuthRateLimitResult> {
  // ตรวจสิทธิ์ผู้ทดสอบครั้งเดียวแล้วใช้ตัวในที่ไม่ตรวจซ้ำ —
  // ไม่งั้นหนึ่งคำขอจะอ่านคุกกี้ + เทียบ token_version สองรอบโดยไม่จำเป็น
  if (await isPrivilegedTestRequest(request)) return { allowed: true };

  // นับและตัดสินในก้าวเดียว (A1-02) — เดิม peek แล้วค่อยนับ ยิงพร้อมกันผ่านได้ทั้งชุด
  return reserveUnchecked(request, action, identifier);
}
