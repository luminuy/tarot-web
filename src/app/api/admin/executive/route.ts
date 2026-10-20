import { NextResponse } from "next/server";

import { requireAdminOrReportToken } from "@/lib/auth/require-admin";
import { getExecutiveReport } from "@/lib/admin/executive-data";
import { EXECUTIVE_RANGES, type ExecutiveRange } from "@/lib/admin/executive-report";

export const runtime = "nodejs";

/**
 * GET /api/admin/executive?days=7|28|90
 * รายงานผู้บริหาร (แท็บ "แดชบอร์ดผู้บริหาร") — ตัวเลขหลักเทียบช่วงก่อนหน้า · รายได้จริง · Stripe · สิ่งที่ต้องดู
 * ⚠️ วันในระบบสถิติคือวัน UTC (ตัดรอบ 07:00 น. เวลาไทย)
 * เข้าได้ด้วยคุกกี้แอดมิน หรือรหัสอ่านรายงาน `ADMIN_REPORT_TOKEN` (`npm run exec:report`) — รายงานนี้ไม่มีข้อมูลส่วนตัวลูกค้า
 */
export async function GET(request: Request) {
  const denied = await requireAdminOrReportToken(request);
  if (denied) return denied;

  const raw = Number(new URL(request.url).searchParams.get("days"));
  const days: ExecutiveRange = (EXECUTIVE_RANGES as readonly number[]).includes(raw) ? (raw as ExecutiveRange) : 28;

  try {
    const report = await getExecutiveReport(days);
    return NextResponse.json({ ok: true, report });
  } catch (err) {
    console.error("[API Admin Executive GET Error]", err);
    return NextResponse.json({ ok: false, error: "สร้างรายงานผู้บริหารไม่สำเร็จ" }, { status: 500 });
  }
}
