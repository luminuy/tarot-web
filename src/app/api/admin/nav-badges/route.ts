import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { getNavBadges } from "@/lib/admin/executive-data";

export const runtime = "nodejs";

/**
 * GET /api/admin/nav-badges
 * ตัวเลขเตือนบนเมนูข้างของแอดมิน (เงินต้องคืน · แม่หมอรอตรวจ · ความเห็นใหม่ 7 วัน)
 * ตารางไหนอ่านไม่ได้ = `null` และเมนูไม่แสดงตัวเลข (ไม่แสดง 0 ปลอม)
 */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({ ok: true, badges: await getNavBadges() });
}
