import { cookies } from "next/headers";

import { signPayload, verifyPayload } from "@/lib/auth/edge-auth";
import { GUEST_LIMIT } from "@/lib/entitlement/entitlement";
import { KEY, kvGetJSON, kvPutJSON } from "@/lib/platform/kv-store";

/**
 * คุกกี้นับสิทธิ์ผู้เยี่ยมชม (ENTITLEMENT_PLAN PR C)
 * ------------------------------------------------
 * - เซ็นด้วยกลไกเดิมของ edge-auth (`signPayload`/`verifyPayload`) — ไม่มีกลไกเซ็นใหม่
 * - httpOnly · SameSite=Lax · Secure บน production · อายุ 1 ปี
 * - เก็บแค่ `{ gid, used }` — ไม่มีข้อมูลส่วนบุคคล
 * - กันไม่ได้ 100% (ล้างคุกกี้/incognito = สิทธิ์ใหม่) — โดยเจตนา ไม่ไล่อุด
 *
 * ⚠️ คุกกี้ตัวนี้ระบุตัวผู้เยี่ยมชมข้ามครั้ง → ต้องประกาศในนโยบายความเป็นส่วนตัว (ทำใน PR C)
 */

export const GUEST_COOKIE_NAME = "tarot_guest";
const MAX_AGE_SEC = 365 * 24 * 60 * 60;

export interface GuestState {
  gid: string;
  used: number;
}

interface GuestPayload extends Record<string, unknown> {
  gid: string;
  used: number;
  iat: number;
}

export function newGid(): string {
  return `g_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
}

/**
 * เครื่องหมาย "ผู้เยี่ยมชม gid นี้ใช้สิทธิ์ฟรีแล้ว" ฝั่ง server (KV · TTL ~400 วัน)
 * ------------------------------------------------------------------------
 * ทำไมต้องมี: หลัง PR #96 การหักสิทธิ์ guest เกิดที่ `POST /api/entitlement/guest-consume`
 * ซึ่ง client เป็นคนยิง → ถ้า client บล็อก call นั้น คุกกี้จะค้าง `used=0` ตลอด = ไม่จำกัด
 * เครื่องหมายนี้เขียนฝั่ง server ตอน read เสร็จจริง (`realReading`) → `start` เช็คได้เอง
 * ไม่ต้องพึ่ง client · ช่องที่เหลือคือ "ล้างคุกกี้ = gid ใหม่" ตาม ENTITLEMENT_PLAN ข้อ 3
 *
 * gid เป็น pseudonym (ไม่มี PII) · TTL หมดอายุเอง ไม่ต้องมี cleanup job (PDPA)
 */
const GUEST_USED_TTL_SEC = 400 * 24 * 60 * 60;

export async function isGuestUsedOnServer(gid: string): Promise<boolean> {
  if (!gid || gid === "anon") return false;
  // memo 15s ต่อ isolate — การ mark เรียก kvPutJSON ซึ่งล้าง memo ให้เอง จึงไม่ค้าง stale ใน isolate เดียวกัน
  const row = await kvGetJSON<{ at: number }>(KEY.guestUsed(gid), 15_000).catch(() => null);
  return !!row;
}

/** best-effort — caller ควรห่อ `void` เอง (fire-and-forget) หรือ `await` ใน test */
export async function markGuestUsedOnServer(gid: string): Promise<void> {
  if (!gid || gid === "anon") return;
  await kvPutJSON(
    KEY.guestUsed(gid),
    { at: Date.now() },
    { expirationTtl: GUEST_USED_TTL_SEC },
  ).catch(() => {});
}

/** อ่านสถานะผู้เยี่ยมชมจากคุกกี้ (null ถ้าไม่มี/เสียหาย) */
export async function readGuestCookie(): Promise<GuestState | null> {
  try {
    const raw = (await cookies()).get(GUEST_COOKIE_NAME)?.value;
    if (!raw) return null;
    const p = await verifyPayload<GuestPayload>(raw);
    if (!p || typeof p.gid !== "string") return null;
    return { gid: p.gid, used: Math.max(0, Math.min(GUEST_LIMIT, Number(p.used) || 0)) };
  } catch {
    return null;
  }
}

/** สร้าง state ผู้เยี่ยมชมใหม่ (ยังไม่ใช้สิทธิ์) */
export function freshGuest(): GuestState {
  return { gid: newGid(), used: 0 };
}

/** เซ็ตคุกกี้ผู้เยี่ยมชมลงใน response */
export async function writeGuestCookie(res: Response, state: GuestState): Promise<void> {
  const token = await signPayload({ gid: state.gid, used: state.used, iat: Date.now() });
  const parts = [
    `${GUEST_COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${MAX_AGE_SEC}`,
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  res.headers.append("Set-Cookie", parts.join("; "));
}

/** ค่า Set-Cookie แบบ string (สำหรับ NextResponse.cookies หรือ header object) */
export async function guestCookieValue(state: GuestState): Promise<string> {
  return signPayload({ gid: state.gid, used: state.used, iat: Date.now() });
}

export const GUEST_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_SEC,
};

/**
 * Ticket หักสิทธิ์ผู้เยี่ยมชม (เซ็น HMAC ด้วยกลไก edge-auth เดิม)
 * ------------------------------------------------------------
 * `read` route ออก ticket นี้ "เฉพาะตอน" event `done` ที่เป็นคำอ่านจริง
 * failure path ทุกทาง (AI error / refusal / stream cut / token=0) ไม่มีทางได้ ticket
 * → ผู้เยี่ยมชมไม่มีทางเสียสิทธิ์ฟรีเพราะระบบเราพัง (ENTITLEMENT_PLAN ข้อ 4)
 *
 * client ส่ง ticket กลับมาที่ `POST /api/entitlement/guest-consume` แล้วเราจึง Set-Cookie used=1
 */
const TICKET_PURPOSE = "guest-consume";
const TICKET_MAX_AGE_MS = 10 * 60 * 1000;
const TICKET_CLOCK_SKEW_MS = 60 * 1000;

interface ConsumeTicket extends Record<string, unknown> {
  rid: string;
  purpose: string;
  iat: number;
}

export async function signGuestConsumeTicket(readingId: string): Promise<string> {
  return signPayload({ rid: readingId, purpose: TICKET_PURPOSE, iat: Date.now() } satisfies ConsumeTicket);
}

/** คืน readingId ถ้า ticket ถูกต้องและยังไม่หมดอายุ · null ถ้าไม่ผ่าน */
export async function verifyGuestConsumeTicket(token: string): Promise<string | null> {
  if (!token) return null;
  const t = await verifyPayload<ConsumeTicket>(token);
  if (!t || t.purpose !== TICKET_PURPOSE) return null;
  if (typeof t.rid !== "string" || !t.rid) return null;
  if (typeof t.iat !== "number") return null;
  const age = Date.now() - t.iat;
  if (age > TICKET_MAX_AGE_MS || age < -TICKET_CLOCK_SKEW_MS) return null;
  return t.rid;
}
