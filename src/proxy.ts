import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOCALE_COOKIE_KEY } from "./lib/i18n/types";

/**
 * 🌐 Proxy จัดการภาษาและส่งต่อ Locale ให้ Server Components (S-02)
 *
 * หน้าที่:
 * 1. ตรวจสอบ query parameter `?lang=en` หรือ `?lang=th`
 *    - ฉีด header `x-locale` เพื่อให้ Server Components (`layout.tsx` / `page.tsx`) เรนเดอร์ภาษาที่ถูกต้องตั้งแต่ไบต์แรก
 *    - บันทึก Cookie `seertarot_lang` (และ `locale`) เพื่อจดจำการตั้งค่าในคำขอถัดไป
 * 2. ตรวจสอบ Cookie กรณีไม่มี query parameter
 *    - ฉีด header `x-locale` ตามค่าใน Cookie เพื่อให้ Server Components ทราบภาษา
 */
export function proxy(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const langParam = searchParams.get("lang");

  // 1. ตรวจสอบ query parameter (?lang=en หรือ ?lang=th)
  if (langParam === "en" || langParam === "th") {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-locale", langParam);

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    const currentCookie =
      request.cookies.get(LOCALE_COOKIE_KEY)?.value ||
      request.cookies.get("locale")?.value;

    if (currentCookie !== langParam) {
      response.cookies.set(LOCALE_COOKIE_KEY, langParam, {
        path: "/",
        maxAge: 31536000,
        sameSite: "lax",
      });
      response.cookies.set("locale", langParam, {
        path: "/",
        maxAge: 31536000,
        sameSite: "lax",
      });
    }

    return response;
  }

  // 2. ตรวจสอบ Cookie กรณีไม่มี query parameter
  const cookieLang =
    request.cookies.get(LOCALE_COOKIE_KEY)?.value ||
    request.cookies.get("locale")?.value;

  if (cookieLang === "en" || cookieLang === "th") {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-locale", cookieLang);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * กรองเฉพาะ Page Routes โดยข้าม:
     * - api (API endpoints)
     * - _next/static, _next/image (Next.js assets)
     * - cards, og (ไฟล์รูปภาพการ์ดและภาพพรีวิว)
     * - favicon.ico, sitemap.xml, robots.txt, manifest.json
     */
    "/((?!api|_next/static|_next/image|cards|og|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest).*)",
  ],
};
