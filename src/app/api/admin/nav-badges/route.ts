import { NextResponse } from "next/server";

import { requireAdminOrReportToken } from "@/lib/auth/require-admin";
import { getNavBadges } from "@/lib/admin/executive-data";

export const runtime = "nodejs";

/**
 * GET /api/admin/nav-badges
 * ตัวเลขเตือนบนเมนูข้างของแอดมิน (เงินต้องคืน · แม่หมอรอตรวจ · ความเห็นใหม่ 7 วัน)
 * ตารางไหนอ่านไม่ได้ = `null` และเมนูไม่แสดงตัวเลข (ไม่แสดง 0 ปลอม)
 * เข้าได้ด้วยคุกกี้แอดมิน หรือรหัสอ่านรายงาน `ADMIN_REPORT_TOKEN` (`npm run exec:report`) — มีแต่ตัวนับ ไม่มีข้อมูลส่วนตัว
 */
export async function GET(request: Request) {
  const denied = await requireAdminOrReportToken(request);
  if (denied) return denied;
  return NextResponse.json({ ok: true, badges: await getNavBadges() });
}
