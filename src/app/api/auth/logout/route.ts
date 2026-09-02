import { NextResponse } from "next/server";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { clearAuthCookie } from "@/lib/auth/session";

export const runtime = "nodejs";

/**
 * POST /api/auth/logout — ออกจากระบบ
 *
 * ต้องล้างคุกกี้บน "response" ด้วยคุณสมบัติชุดเดียวกับตอนเขียน (path/secure/sameSite)
 * ไม่ใช่ `cookies().delete()` เฉย ๆ — ถ้าคุณสมบัติไม่ตรง เบราว์เซอร์จะไม่ลบให้
 * ผลคือกดออกจากระบบแล้วรีเฟรชกลับมายังล็อกอินอยู่เหมือนเดิม
 */
export async function POST(request: Request) {
  // กันเว็บอื่นยิงข้ามไซต์มาเตะผู้ใช้ออกจากระบบ (CSRF logout)
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึงจากภายนอก" }, { status: 403 });
  }

  const response = NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } },
  );
  clearAuthCookie(response);
  return response;
}
