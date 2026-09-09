import { NextResponse } from "next/server";

import { getEntitlementSnapshot } from "@/lib/entitlement/snapshot";

export const runtime = "nodejs";

/**
 * GET /api/entitlement — คืนสถานะสิทธิ์ปัจจุบันให้ UI ใช้แสดงผล
 * (ห้าม UI คำนวณสิทธิ์เอง — การซ่อนปุ่มไม่ใช่การบังคับสิทธิ์)
 *
 * 📌 ตรรกะทั้งหมดอยู่ที่ `getEntitlementSnapshot()` เพราะ `/api/bootstrap` ใช้ก้อนเดียวกัน
 *    เส้นนี้ยังอยู่สำหรับการ "ขอสิทธิ์ล่าสุดซ้ำ" หลังใช้โควตาไป (refreshEntitlement)
 */
export async function GET(request: Request) {
  return NextResponse.json(await getEntitlementSnapshot(request));
}
