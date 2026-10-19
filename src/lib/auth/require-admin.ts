import { createHash, timingSafeEqual } from "node:crypto";

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

/** เช็คเฉย ๆ ว่า request นี้เป็นแอดมินไหม (สำหรับ page server component) */
export async function isAdminRequest(): Promise<boolean> {
  if (!isAdminConfigured()) return false;
  const token = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminSessionLive(token);
}

/**
 * 📊 รหัสอ่านรายงานผู้บริหาร (`ADMIN_REPORT_TOKEN`) — ให้ผู้ช่วย cmo · coo · cto ดึงตัวเลขจริงด้วย `npm run exec:report`
 * ---------------------------------------------------------------------------
 * ⚠️ ใช้ได้เฉพาะ route ที่**อ่านอย่างเดียวและไม่มีข้อมูลส่วนตัวลูกค้า**เท่านั้น
 *    ตอนนี้มี 2 เส้น: `GET /api/admin/executive` · `GET /api/admin/nav-badges`
 *    ห้ามเรียกฟังก์ชันนี้ใน route ที่เขียนข้อมูล หรือคืนอีเมล/ชื่อ/รหัสผู้ใช้ (สมาชิก · รายการชำระเงิน · บันทึกแอดมิน)
 *    ด่าน `test-admin-stats-keys` หัวข้อ จ. ตรวจว่ามีแค่ 2 เส้นนี้ที่ใช้
 *
 * - ส่งเป็น `Authorization: Bearer <รหัส>` · รหัสต้องยาว ≥ 32 ตัว ไม่งั้นถือว่ายังไม่ได้ตั้ง (ปิดช่องนี้ทั้งหมด)
 * - เทียบแบบ constant-time ผ่าน SHA-256 ของทั้งสองฝั่ง (ความยาวเท่ากันเสมอ)
 * - เปลี่ยนรหัส = ตั้ง secret ใหม่ รหัสเก่าใช้ไม่ได้ทันที · ไม่เกี่ยวกับรหัสผ่านแอดมินหรือคุกกี้แอดมิน
 * - ไม่มีรหัสในหัว = ตรวจคุกกี้แอดมินตามปกติ (หน้าแอดมินยังใช้ได้เหมือนเดิม)
 */
const MIN_REPORT_TOKEN_LEN = 32;

function sha256(v: string): Buffer {
  return createHash("sha256").update(v).digest();
}

export function isReportTokenConfigured(): boolean {
  return (process.env.ADMIN_REPORT_TOKEN ?? "").trim().length >= MIN_REPORT_TOKEN_LEN;
}

/** true ถ้าหัว Authorization ถือรหัสอ่านรายงานที่ถูกต้อง */
export function hasValidReportToken(headers: Headers): boolean {
  const expected = (process.env.ADMIN_REPORT_TOKEN ?? "").trim();
  const value = headers.get("authorization") ?? "";
  if (expected.length < MIN_REPORT_TOKEN_LEN || !value.startsWith("Bearer ")) return false;
  return timingSafeEqual(sha256(value.slice("Bearer ".length).trim()), sha256(expected));
}

/**
 * Guard ของ route รายงานแบบอ่านอย่างเดียว: ผ่านด้วยรหัสอ่านรายงาน **หรือ** คุกกี้แอดมิน
 * ส่งหัว Authorization มาแต่รหัสผิด = 401 ทันที (ไม่ถอยไปตรวจคุกกี้ — กันสับสนเวลาตั้งรหัสผิด)
 */
export async function requireAdminOrReportToken(request: Request): Promise<NextResponse | null> {
  if (request.headers.has("authorization")) {
    if (hasValidReportToken(request.headers)) return null;
    return NextResponse.json(
      {
        error: isReportTokenConfigured()
          ? "รหัสอ่านรายงานไม่ถูกต้อง"
          : "ยังไม่ได้ตั้งรหัสอ่านรายงาน (ADMIN_REPORT_TOKEN อย่างน้อย 32 ตัวอักษร)",
      },
      { status: 401 },
    );
  }
  return requireAdmin();
}
