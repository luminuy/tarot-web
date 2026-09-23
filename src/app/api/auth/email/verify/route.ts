import { NextResponse } from "next/server";
import { consumeToken, findUsedTokenOwner } from "@/lib/auth/auth-tokens.repo";
import { getUserById, markEmailVerified } from "@/lib/users/users.repo";
import { resolveAppOrigin } from "@/lib/security/app-origin";
import { checkAuthRateLimit } from "@/lib/security/auth-ratelimit";
import { LOCALE_COOKIE_KEY } from "@/lib/i18n/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const origin = resolveAppOrigin(request);

  const cookieLang = (request.headers.get("cookie") ?? "")
    .split(/;\s*/)
    .find((c) => c.startsWith(`${LOCALE_COOKIE_KEY}=`))
    ?.slice(LOCALE_COOKIE_KEY.length + 1);
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

  /*
   * ⚠️ ลิงก์นี้ "ยืนยันอีเมล" อย่างเดียว — ห้ามออกคุกกี้เซสชัน (A1-03)
   * เดิมออกเซสชันของเจ้าของ token ให้ใครก็ได้ที่เปิดลิงก์ ทับเซสชันเดิมของเบราว์เซอร์นั้นด้วย
   * ผู้โจมตีสมัครด้วยอีเมลตัวเองแล้วส่งลิงก์ให้เหยื่อกด (หรือฝังเป็น <img>) ➔ เหยื่อถูกสลับ
   * เข้าบัญชีผู้โจมตีเงียบ ๆ แล้วทุกคำถาม/วันเกิดที่กรอกต่อไปลงบัญชีคนอื่น (login CSRF · PDPA)
   * คนที่สมัครในเบราว์เซอร์นี้ล็อกอินอยู่แล้วตั้งแต่ตอนสมัคร · เปิดจากเครื่องอื่นให้ล็อกอินเอง
   */
  try {
    const result = await consumeToken(token, "verify");
    if (!result) {
      // ตัวสแกนลิงก์ของอีเมลเปิดไปก่อนแล้ว — ถ้าบัญชียืนยันแล้วจริง บอกว่าสำเร็จ ไม่ใช่ "หมดอายุ"
      const used = await findUsedTokenOwner(token, "verify");
      const owner = used ? await getUserById(used.userId) : null;
      if (owner?.emailVerified) {
        return NextResponse.redirect(`${origin}${targetPath}?verified=1`);
      }
      return NextResponse.redirect(`${origin}${targetPath}?verify_error=expired`);
    }

    await markEmailVerified(result.userId);
    // ล้างแคชโปรไฟล์ของ isolate นี้ทันที ไม่งั้น /api/auth/me อาจตอบข้อมูลเก่าได้อีก 30 วิ
    (await import("@/lib/auth/user-cache")).invalidateUserCache(result.userId);

    return NextResponse.redirect(`${origin}${targetPath}?verified=1`);
  } catch (err) {
    console.error("[Verify Email Error]", err);
    return NextResponse.redirect(`${origin}${targetPath}?verify_error=server`);
  }
}
