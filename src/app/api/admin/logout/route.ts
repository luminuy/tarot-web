import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { ADMIN_COOKIE_NAME, revokeAdminSession } from "@/lib/auth/admin-auth";

export const runtime = "nodejs";

export async function POST() {
  const jar = await cookies();
  /*
   * 🔑 T-15: ลบคุกกี้อย่างเดียวไม่พอ — มันลบได้แค่สำเนาในเบราว์เซอร์เครื่องนี้
   * คุกกี้ที่ถูกขโมยไปแล้วยังใช้ได้จนหมดอายุ 8 ชั่วโมงและเพิกถอนไม่ได้เลย
   * นอกจากเปลี่ยน ADMIN_PASSWORD ซึ่งเตะทุกคนออกพร้อมกัน
   * ต้องถอน `sid` ออกจาก allowlist บน KV ด้วย จึงจะมีผลทุก isolate ทุก colo ทันที
   */
  await revokeAdminSession(jar.get(ADMIN_COOKIE_NAME)?.value);
  jar.delete(ADMIN_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
