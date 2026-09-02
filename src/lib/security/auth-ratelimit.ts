import { createHash } from "node:crypto";
import { getAppKV } from "@/lib/platform/cf";
import { isPrivilegedTestRequest } from "@/lib/security/privileged";

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

// In-memory fallback (ใช้เมื่อ KV ยังไม่พร้อม / dev)
const memoryBuckets = new Map<string, RateLimitBucket>();

function getClientIp(request: Request): string {
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) return xForwardedFor.split(",")[0].trim();

  return "127.0.0.1";
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

export type AuthRateLimitAction = "login" | "signup" | "forgot" | "resend" | "reset";

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

async function readBucket(key: string): Promise<RateLimitBucket | null> {
  try {
    const kv = await getAppKV();
    const raw = await kv.get(key);
    if (raw) return JSON.parse(raw) as RateLimitBucket;
  } catch {
    // KV ไม่พร้อม / JSON เสีย — ตกไปใช้ในหน่วยความจำ
  }
  return memoryBuckets.get(key) ?? null;
}

async function writeBucket(key: string, bucket: RateLimitBucket): Promise<void> {
  memoryBuckets.set(key, bucket);
  try {
    const kv = await getAppKV();
    // TTL ต้องเหลือเท่าที่หน้าต่างเหลือจริง ไม่ใช่ความยาวหน้าต่างเต็ม
    const ttl = Math.max(60, Math.ceil((bucket.resetAt - Date.now()) / 1000));
    await kv.put(key, JSON.stringify(bucket), { expirationTtl: ttl });
  } catch {
    // ignore KV write errors in local dev
  }
}

async function clearBucket(key: string): Promise<void> {
  memoryBuckets.delete(key);
  try {
    const kv = await getAppKV();
    await kv.delete(key);
  } catch {
    // ignore
  }
}

export interface AuthRateLimitResult {
  allowed: boolean;
  retryAfterSec?: number;
}

/**
 * ตรวจว่าเกินเพดานหรือยัง **โดยไม่นับเพิ่ม**
 * ใช้กับ action ที่ต้องนับเฉพาะครั้งที่ล้มเหลว (เช่น การเข้าสู่ระบบ)
 */
export async function peekAuthRateLimit(
  request: Request,
  action: AuthRateLimitAction,
  identifier?: string
): Promise<AuthRateLimitResult> {
  if (await isPrivilegedTestRequest(request)) return { allowed: true };
  return peekUnchecked(request, action, identifier);
}

async function peekUnchecked(
  request: Request,
  action: AuthRateLimitAction,
  identifier?: string
): Promise<AuthRateLimitResult> {
  const now = Date.now();
  for (const { key, max } of keysFor(request, action, identifier)) {
    const bucket = await readBucket(key);
    if (bucket && now < bucket.resetAt && bucket.count >= max) {
      return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
    }
  }
  return { allowed: true };
}

/** นับความพยายามที่ล้มเหลวเพิ่ม 1 ครั้ง (ทั้งถัง IP และถังบัญชี) */
export async function recordAuthFailure(
  request: Request,
  action: AuthRateLimitAction,
  identifier?: string
): Promise<void> {
  if (await isPrivilegedTestRequest(request)) return;
  await recordUnchecked(request, action, identifier);
}

async function recordUnchecked(
  request: Request,
  action: AuthRateLimitAction,
  identifier?: string
): Promise<void> {
  const now = Date.now();
  const windowSec = ACTION_CONFIGS[action].windowSec;
  for (const { key } of keysFor(request, action, identifier)) {
    const existing = await readBucket(key);
    const bucket =
      existing && now < existing.resetAt
        ? { count: existing.count + 1, resetAt: existing.resetAt }
        : { count: 1, resetAt: now + windowSec * 1000 };
    await writeBucket(key, bucket);
  }
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

  const peeked = await peekUnchecked(request, action, identifier);
  if (!peeked.allowed) return peeked;

  await recordUnchecked(request, action, identifier);
  return { allowed: true };
}
