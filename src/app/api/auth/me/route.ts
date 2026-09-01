import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, verifyUserSession } from "@/lib/auth/edge-auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ user: null });
    }

    const user = await verifyUserSession(token);
    if (user) {
      try {
        const { getUserById } = await import("@/lib/users/users.repo");
        const dbUser = await getUserById(user.id);

        // ตรวจสอบว่าบัญชีถูกลบ หรือ token_version เปลี่ยนแปลง (เช่น มีการเปลี่ยนรหัสผ่านบนอุปกรณ์อื่น)
        if (!dbUser || (dbUser.tokenVersion > (user.tokenVersion || 0))) {
          const response = NextResponse.json({ user: null });
          response.cookies.delete(AUTH_COOKIE_NAME);
          return response;
        }

        return NextResponse.json({
          user: {
            ...user,
            emailVerified: dbUser.emailVerified,
            marketingConsent: dbUser.marketingConsent,
          },
        });
      } catch {
        return NextResponse.json({ user });
      }
    }
    return NextResponse.json({ user: null });
  } catch {
    return NextResponse.json({ user: null });
  }
}
