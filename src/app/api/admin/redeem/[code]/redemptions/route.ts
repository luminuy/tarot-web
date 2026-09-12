import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { listRedemptions } from "@/lib/entitlement/redeem-admin.repo";

export const runtime = "nodejs";

/**
 * GET /api/admin/redeem/[code]/redemptions
 * ดึงรายการผู้แลกสิทธิ์ของรหัสที่ระบุ (จำกัด 200 รายการล่าสุด)
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { code } = await params;
  if (!code) {
    return NextResponse.json({ error: "ไม่พบรหัสที่ระบุ" }, { status: 400 });
  }

  try {
    const redemptions = await listRedemptions(code, 200);
    return NextResponse.json({ redemptions, success: true });
  } catch (err) {
    console.error("[API Admin Redeem Redemptions Error]", err);
    return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลประวัติการแลกสิทธิ์ได้" }, { status: 500 });
  }
}
