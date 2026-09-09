import { NextResponse } from "next/server";

import { applySessionCookies, resolveSession } from "@/lib/auth/resolve-session";
import { getEntitlementSnapshot } from "@/lib/entitlement/snapshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** ห้าม CDN/เบราว์เซอร์แคช — ในนี้มีทั้งสถานะล็อกอินและโควตาที่ต่างกันรายคน */
const NO_STORE = { "Cache-Control": "no-store, no-cache, must-revalidate, private" };

/**
 * GET /api/bootstrap — "ใครกำลังใช้อยู่ + สิทธิ์เท่าไร" ในคำขอเดียว
 * ---------------------------------------------------------------------------
 * ทำไมต้องมี: ทุกครั้งที่เปิดหน้าเว็บ ฝั่งไคลเอนต์ต้องรู้สองอย่างนี้ ของเดิมจึงยิง
 * `/api/auth/me` กับ `/api/entitlement` แยกกันสองเส้น = ปลุก Worker สองครั้งต่อการเปิดหน้า
 * ทั้งที่ทั้งคู่อ่านคุกกี้ใบเดียวกันและตอบพร้อมกันได้
 *
 * ⚠️ ตรรกะทั้งหมดยืมมาจากสองเส้นเดิม (`resolveSession` + `getEntitlementSnapshot`)
 * ห้ามเขียนตรรกะสิทธิ์หรือการตรวจเซสชันซ้ำในไฟล์นี้เด็ดขาด
 */
export async function GET(request: Request) {
  const [{ user, action }, entitlement] = await Promise.all([
    resolveSession(),
    getEntitlementSnapshot(request),
  ]);

  return applySessionCookies(NextResponse.json({ user, entitlement }, { headers: NO_STORE }), action);
}
