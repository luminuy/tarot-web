import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signUserSession } from "@/lib/auth/edge-auth";
import { setAuthCookie } from "@/lib/auth/session";
import { consumeToken } from "@/lib/auth/auth-tokens.repo";
import { getUserById, markEmailVerified } from "@/lib/users/users.repo";
import { resolveAppOrigin } from "@/lib/security/app-origin";
import { checkAuthRateLimit } from "@/lib/security/auth-ratelimit";
import { LOCALE_COOKIE_KEY } from "@/lib/i18n/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const origin = resolveAppOrigin(request);

  const cookieStore = await cookies();
  const cookieLang = cookieStore.get(LOCALE_COOKIE_KEY)?.value;
  const paramLang = url.searchParams.get("lang");
  const isEnglish = paramLang === "en" || cookieLang === "en";
  const targetPath = isEnglish ? "/en" : "/";

  if (!token) {
    return NextResponse.redirect(`${origin}${targetPath}?verify_error=invalid`);
  }

  // กันการยิงสุ่ม token ตรวจสอบอีเมลแบบ brute-force
  const limit = await checkAuthRateLimit(request, "verify");
  if (!limit.allowed) {
    return NextResponse.redirect(`${origin}${targetPath}?verify_error=ratelimit`);
  }

  try {
    const result = await consumeToken(token, "verify");
    if (!result) {
      return NextResponse.redirect(`${origin}${targetPath}?verify_error=expired`);
    }

    await markEmailVerified(result.userId);
    // ล้างแคชโปรไฟล์ของ isolate นี้ทันที ไม่งั้น /api/auth/me อาจตอบข้อมูลเก่าได้อีก 30 วิ
    (await import("@/lib/auth/user-cache")).invalidateUserCache(result.userId);

    const user = await getUserById(result.userId);
    const redirectUrl = `${origin}${targetPath}?verified=1`;
    const response = NextResponse.redirect(redirectUrl);

    // หากพบข้อมูลผู้ใช้ ให้ออก Session Cookie ให้อัตโนมัติ
    if (user) {
      const sessionToken = await signUserSession({
        id: user.id,
        provider: user.provider,
        email: user.email || undefined,
        name: user.name,
        createdAt: new Date(user.createdAt).toISOString(),
        tokenVersion: user.tokenVersion,
      });

      setAuthCookie(response, sessionToken);
    }

    return response;
  } catch (err) {
    console.error("[Verify Email Error]", err);
    return NextResponse.redirect(`${origin}${targetPath}?verify_error=server`);
  }
}
