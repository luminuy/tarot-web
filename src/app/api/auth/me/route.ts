import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, verifyUserSession } from "@/lib/auth/edge-auth";
import { clearAuthCookie, getRevocationState, type SessionUser } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** ห้าม CDN/เบราว์เซอร์แคชสถานะล็อกอิน — ไม่งั้นคนถัดไปบนเครื่องเดียวกันเห็นบัญชีคนก่อน */
const NO_STORE = { "Cache-Control": "no-store, no-cache, must-revalidate, private" };

function anonymous(clearCookie: boolean) {
  const response = NextResponse.json({ user: null }, { headers: NO_STORE });
  if (clearCookie) clearAuthCookie(response);
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
      return NextResponse.json({ user }, { headers: NO_STORE });
    }

    try {
      const { getUserById } = await import("@/lib/users/users.repo");
      const dbUser = await getUserById(user.id);
      if (!dbUser) return anonymous(true);

      return NextResponse.json(
        {
          user: {
            ...user,
            name: dbUser.name || user.name,
            email: dbUser.email ?? user.email,
            emailVerified: dbUser.emailVerified,
            marketingConsent: dbUser.marketingConsent,
            // ฝั่งหน้าเว็บต้องรู้ว่าบัญชีนี้ "ตั้งรหัสผ่านไว้แล้วหรือยัง" เพื่อเลือกฟอร์มให้ถูก
            // เดาจาก provider ไม่ได้ — บัญชี Google ที่ตั้งรหัสผ่านเพิ่มก็มี hasPassword = true
            hasPassword: dbUser.hasPassword,
          },
        },
        { headers: NO_STORE },
      );
    } catch {
      return NextResponse.json({ user }, { headers: NO_STORE });
    }
  } catch {
    return anonymous(false);
  }
}
