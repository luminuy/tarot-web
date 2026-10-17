import { NextResponse } from "next/server";

import { listAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth/require-admin";

export const runtime = "nodejs";

/**
 * GET /api/admin/audit?limit=N (1–500 · ค่าเริ่มต้น 300)
 * บันทึกการทำงานของแอดมินย้อนหลัง (เก็บ 180 วัน) — หน้าจอกรอง/ค้นฝั่งเบราว์เซอร์
 */
export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const limit = Math.min(500, Math.max(1, Number(new URL(request.url).searchParams.get("limit")) || 300));
  return NextResponse.json({ ok: true, entries: await listAudit(limit) });
}
