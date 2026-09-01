import { cookies } from "next/headers";

import { signPayload, verifyPayload } from "@/lib/auth/edge-auth";
import { GUEST_LIMIT } from "@/lib/entitlement/entitlement";

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

function newGid(): string {
  return `g_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
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
