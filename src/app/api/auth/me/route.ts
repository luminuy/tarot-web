import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, verifyUserSession } from "@/lib/auth/edge-auth";
import {
  clearAuthCookie,
  clearAuthHintCookie,
  getRevocationState,
  setAuthHintCookie,
  type SessionUser,
} from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** ห้าม CDN/เบราว์เซอร์แคชสถานะล็อกอิน — ไม่งั้นคนถัดไปบนเครื่องเดียวกันเห็นบัญชีคนก่อน */
const NO_STORE = { "Cache-Control": "no-store, no-cache, must-revalidate, private" };

function anonymous(clearCookie: boolean) {
  const response = NextResponse.json({ user: null }, { headers: NO_STORE });
  if (clearCookie) clearAuthCookie(response);
  // ไม่มีเซสชันแล้ว → เก็บคุกกี้ใบ้ทิ้งด้วยเสมอ ไม่งั้นหน้าเว็บจะถามเส้นนี้ซ้ำทุกหน้าไปตลอด
  else clearAuthHintCookie(response);
  return response;
}

/**
 * ตอบว่า "คนนี้ล็อกอินอยู่" พร้อมย้ำคุกกี้ใบ้ทุกครั้ง
 * — คนที่ล็อกอินไว้ก่อนหน้าที่จะมีคุกกี้ใบ้ จะได้รับไปตอนเรียกเส้นนี้ครั้งแรก
 *   หลังจากนั้นหน้าเว็บก็รู้ตัวเองว่าต้องถาม ไม่ต้องยิงเผื่อทุกครั้งอีก
 */
function authenticated(user: unknown) {
  const response = NextResponse.json({ user }, { headers: NO_STORE });
  setAuthHintCookie(response);
  return response;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return anonymous(false);

    const user = (await verifyUserSession(token)) as SessionUser | null;
    // ลายเซ็นผิด/หมดอายุ → ล้างคุกกี้ทิ้งเลย จะได้ไม่ต้องส่งขยะไปทุก request
    if (!user?.id) return anonymous(true);

    const state = await getRevocationState(user);
    if (state === "revoked" || state === "deleted") {
      return anonymous(true);
    }

    // ฐานข้อมูลตอบไม่ได้ชั่วคราว — ยังให้ใช้งานต่อด้วยข้อมูลในคุกกี้ (ห้ามเตะออกเพราะ D1 สะดุด)
    if (state === "unknown") {
      return authenticated(user);
    }

    try {
      // อ่านผ่านแคชอายุ 30 วินาที — หน้าเว็บยิงเส้นนี้ทุก ~30 วิและทุกครั้งที่สลับหน้า
      // การเทียบ token_version (เพิกถอนเซสชัน) ทำไปแล้วด้านบนและไม่ได้ถูกแคชที่นี่
      // ดูขอบเขตการใช้งานใน `src/lib/auth/user-cache.ts`
      const { getUserById } = await import("@/lib/users/users.repo");
      const { getCachedUser } = await import("@/lib/auth/user-cache");
      const dbUser = await getCachedUser(user.id, getUserById);
      if (!dbUser) return anonymous(true);

      return authenticated({
        ...user,
        name: dbUser.name || user.name,
        email: dbUser.email ?? user.email,
        emailVerified: dbUser.emailVerified,
        marketingConsent: dbUser.marketingConsent,
        // ฝั่งหน้าเว็บต้องรู้ว่าบัญชีนี้ "ตั้งรหัสผ่านไว้แล้วหรือยัง" เพื่อเลือกฟอร์มให้ถูก
        // เดาจาก provider ไม่ได้ — บัญชี Google ที่ตั้งรหัสผ่านเพิ่มก็มี hasPassword = true
        hasPassword: dbUser.hasPassword,
      });
    } catch {
      return authenticated(user);
    }
  } catch {
    return anonymous(false);
  }
}
