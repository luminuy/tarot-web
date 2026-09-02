import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, verifyUserSession, type UserProfile } from "@/lib/auth/edge-auth";

/**
 * จุดตรวจเซสชันสมาชิก "จุดเดียวของระบบ" (Single Source of Truth)
 * ---------------------------------------------------------------------------
 * เดิมแต่ละ route แกะคุกกี้เอง แล้วเรียก `verifyUserSession()` ตรง ๆ ซึ่งตรวจแค่
 * ลายเซ็น HMAC กับวันหมดอายุเท่านั้น — **ไม่ได้ตรวจว่าเซสชันถูกเพิกถอนไปแล้วหรือยัง**
 * ผลคือมีแค่ `/api/auth/me` ที่เทียบ `token_version` ส่วน journal / entitlement /
 * account ยอมรับคุกกี้เก่าต่อไปแม้เจ้าของบัญชีจะเพิ่งเปลี่ยนรหัสผ่านเพื่อไล่คนอื่นออก
 *
 * ทุก route ที่ต้องรู้ว่า "ใครกำลังเรียก" ต้องผ่านไฟล์นี้เท่านั้น
 * และทุกที่ที่เขียน/ลบคุกกี้เซสชันต้องใช้ `setAuthCookie()` / `clearAuthCookie()`
 * เพื่อให้คุณสมบัติของคุกกี้ (path/secure/sameSite/maxAge) ตรงกันทุกจุด
 */

export type SessionUser = UserProfile & { tokenVersion: number };

export const AUTH_SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 วัน

/** คุณสมบัติคุกกี้เซสชัน — ต้องเหมือนกันทุกจุดที่ set/delete ไม่งั้นลบไม่ออก */
export function authCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: AUTH_SESSION_MAX_AGE,
  };
}

/** แนบคุกกี้เซสชันลง response */
export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(AUTH_COOKIE_NAME, token, authCookieOptions());
}

/**
 * ล้างคุกกี้เซสชันแบบ "ลบออกจริง"
 * — ต้องส่งค่าว่าง + maxAge 0 พร้อม path เดิม ไม่ใช่แค่ `.delete()`
 *   เพราะเบราว์เซอร์จะลบให้เฉพาะเมื่อ path/secure ตรงกับตอนที่เขียนไว้
 */
export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(AUTH_COOKIE_NAME, "", { ...authCookieOptions(), maxAge: 0 });
}

/* ── แคช token_version ระดับ isolate — กัน D1 โดนยิงซ้ำทุก request ───────────── */
const TOKEN_VERSION_TTL_MS = 60_000;
const tokenVersionCache = new Map<string, { version: number; at: number }>();

/** ล้างแคชรุ่นเซสชันของผู้ใช้ทันทีหลังเปลี่ยนรหัสผ่าน (ไม่ต้องรอ TTL 60 วินาที) */
export function invalidateTokenVersionCache(userId: string): void {
  tokenVersionCache.delete(userId);
}

export type RevocationState = "active" | "revoked" | "deleted" | "unknown";

/**
 * เทียบรุ่นเซสชันในคุกกี้กับ `users.token_version` ในฐานข้อมูล
 *
 * - `revoked` = เจ้าของบัญชีเปลี่ยน/รีเซ็ตรหัสผ่านหลังคุกกี้ใบนี้ถูกออก → ต้องเตะออก
 * - `deleted` = ไม่พบบัญชี (ถูกลบ) → ต้องเตะออก
 * - `unknown` = ฐานข้อมูลตอบไม่ได้ชั่วคราว → **ห้ามเตะออก** (D1 สะดุดครั้งเดียว
 *   ต้องไม่กลายเป็นการล็อกเอาต์ผู้ใช้ทั้งเว็บ)
 */
export async function getRevocationState(user: SessionUser): Promise<RevocationState> {
  const cached = tokenVersionCache.get(user.id);
  const now = Date.now();
  if (cached && now - cached.at < TOKEN_VERSION_TTL_MS) {
    return cached.version > (user.tokenVersion || 0) ? "revoked" : "active";
  }

  try {
    const { getUserById } = await import("@/lib/users/users.repo");
    const dbUser = await getUserById(user.id);
    if (!dbUser) return "deleted";

    tokenVersionCache.set(user.id, { version: dbUser.tokenVersion, at: now });
    return dbUser.tokenVersion > (user.tokenVersion || 0) ? "revoked" : "active";
  } catch {
    return "unknown";
  }
}

/**
 * อ่านผู้ใช้จากคุกกี้เซสชัน — คืน `null` ถ้าไม่มีคุกกี้ / ลายเซ็นผิด / หมดอายุ / ถูกเพิกถอน
 *
 * @param opts.skipRevocationCheck ข้ามการเทียบ token_version (ใช้เฉพาะ path ที่อ่านอย่างเดียว
 *        และยอมรับความหน่วงได้ เช่น การนับสิทธิ์ผู้เยี่ยมชม) — ค่าปกติคือ "ตรวจ"
 */
export async function getSessionUser(opts?: { skipRevocationCheck?: boolean }): Promise<SessionUser | null> {
  let token: string | undefined;
  try {
    token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  } catch {
    // cookies() throw ได้ในบางบริบท (static render) — ถือว่าไม่มีเซสชัน
    return null;
  }
  if (!token) return null;

  const user = (await verifyUserSession(token)) as SessionUser | null;
  if (!user?.id) return null;

  if (opts?.skipRevocationCheck) return user;

  const state = await getRevocationState(user);
  if (state === "revoked" || state === "deleted") return null;

  return user;
}
