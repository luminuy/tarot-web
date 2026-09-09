import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, verifyUserSession } from "@/lib/auth/edge-auth";
import {
  clearAuthCookie,
  clearAuthHintCookie,
  getRevocationState,
  setAuthHintCookie,
  type SessionUser,
} from "@/lib/auth/session";

/**
 * สิ่งที่ต้องทำกับคุกกี้หลังตรวจเซสชันเสร็จ
 * - `clear-session` = ลายเซ็นผิด/ถูกเพิกถอน → ล้างคุกกี้เซสชันทิ้ง
 * - `clear-hint`    = ไม่มีเซสชันตั้งแต่แรก → เก็บคุกกี้ใบ้ทิ้ง หน้าเว็บจะได้เลิกถามซ้ำ
 * - `set-hint`      = มีเซสชันจริง → ย้ำคุกกี้ใบ้ไว้เสมอ
 */
export type SessionCookieAction = "clear-session" | "clear-hint" | "set-hint";

export interface ResolvedSession {
  user: SessionUser | null;
  action: SessionCookieAction;
}

/**
 * ตรวจว่า "ใครกำลังเรียกอยู่" จากคุกกี้เซสชัน — แหล่งความจริงเดียวของ
 * `/api/auth/me` และ `/api/bootstrap`
 *
 * ⚠️ ย้ายออกมาจาก `src/app/api/auth/me/route.ts` เพื่อไม่ให้สองเส้นทางตรวจเซสชัน
 * คนละแบบ · ตรรกะเพิกถอนเซสชัน (token_version) ต้องเหมือนกันเป๊ะทั้งสองเส้น
 * ไม่งั้นเส้นหนึ่งจะยังให้ผ่านทั้งที่อีกเส้นตัดสินว่าถูกเพิกถอนแล้ว
 */
export async function resolveSession(): Promise<ResolvedSession> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return { user: null, action: "clear-hint" };

    const user = (await verifyUserSession(token)) as SessionUser | null;
    // ลายเซ็นผิด/หมดอายุ → ล้างคุกกี้ทิ้งเลย จะได้ไม่ต้องส่งขยะไปทุก request
    if (!user?.id) return { user: null, action: "clear-session" };

    const state = await getRevocationState(user);
    if (state === "revoked" || state === "deleted") {
      return { user: null, action: "clear-session" };
    }

    // ฐานข้อมูลตอบไม่ได้ชั่วคราว — ยังให้ใช้งานต่อด้วยข้อมูลในคุกกี้ (ห้ามเตะออกเพราะ D1 สะดุด)
    if (state === "unknown") {
      return { user, action: "set-hint" };
    }

    try {
      // อ่านผ่านแคชอายุ 30 วินาที — การเทียบ token_version (เพิกถอนเซสชัน) ทำไปแล้วด้านบน
      // และไม่ได้ถูกแคชที่นี่ · ดูขอบเขตการใช้งานใน `src/lib/auth/user-cache.ts`
      const { getUserById } = await import("@/lib/users/users.repo");
      const { getCachedUser } = await import("@/lib/auth/user-cache");
      const dbUser = await getCachedUser(user.id, getUserById);
      if (!dbUser) return { user: null, action: "clear-session" };

      return {
        user: {
          ...user,
          name: dbUser.name || user.name,
          email: dbUser.email ?? user.email,
          emailVerified: dbUser.emailVerified,
          marketingConsent: dbUser.marketingConsent,
          // ฝั่งหน้าเว็บต้องรู้ว่าบัญชีนี้ "ตั้งรหัสผ่านไว้แล้วหรือยัง" เพื่อเลือกฟอร์มให้ถูก
          // เดาจาก provider ไม่ได้ — บัญชี Google ที่ตั้งรหัสผ่านเพิ่มก็มี hasPassword = true
          hasPassword: dbUser.hasPassword,
        } as SessionUser,
        action: "set-hint",
      };
    } catch {
      return { user, action: "set-hint" };
    }
  } catch {
    return { user: null, action: "clear-hint" };
  }
}

/**
 * แนบผลของการตรวจเซสชันลงคุกกี้ของ response
 * — ต้องอยู่ในไฟล์ lib ไม่ใช่ไฟล์ route เพราะ Next.js ห้าม route export ตัวอื่น
 *   นอกจาก HTTP method กับค่าคอนฟิกที่กำหนดไว้ (typecheck จะฟ้องทันที)
 */
export function applySessionCookies(response: NextResponse, action: SessionCookieAction): NextResponse {
  if (action === "clear-session") clearAuthCookie(response);
  // ไม่มีเซสชันแล้ว → เก็บคุกกี้ใบ้ทิ้งด้วยเสมอ ไม่งั้นหน้าเว็บจะถามซ้ำทุกหน้าไปตลอด
  else if (action === "clear-hint") clearAuthHintCookie(response);
  // คนที่ล็อกอินไว้ก่อนหน้าที่จะมีคุกกี้ใบ้ จะได้รับไปตอนเรียกเส้นนี้ครั้งแรก
  else setAuthHintCookie(response);
  return response;
}
