import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_COOKIE_NAME, isAdminConfigured, verifyAdminSessionLive } from "@/lib/auth/admin-auth";

/**
 * Guard สำหรับทุก route ใต้ /api/admin/*
 * คืน `null` ถ้าผ่าน — คืน `NextResponse` (401/503) ถ้าไม่ผ่าน ให้ route return ออกไปเลย
 *
 *   const denied = await requireAdmin();
 *   if (denied) return denied;
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "ยังไม่ได้ตั้งค่าระบบแอดมิน (ADMIN_PASSWORD)" },
      { status: 503 },
    );
  }

  const token = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;
  // ต้องใช้ตัวที่ตรวจ allowlist ด้วย (T-15) — `verifyAdminSession` ตรวจแค่ลายเซ็น
  // ซึ่งคุกกี้ที่ถูก logout ไปแล้วก็ยังผ่าน
  if (!(await verifyAdminSessionLive(token))) {
    return NextResponse.json({ error: "ต้องเข้าสู่ระบบแอดมินก่อน" }, { status: 401 });
  }

  return null;
}

/** เช็คเฉยๆ ว่า request นี้เป็นแอดมินไหม (สำหรับ page server component) */
export async function isAdminRequest(): Promise<boolean> {
  if (!isAdminConfigured()) return false;
  const token = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminSessionLive(token);
}
