import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { getStats } from "@/lib/stats/read";
import { listAudit } from "@/lib/admin/audit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const url = new URL(request.url);
  const rangeDays = Math.min(90, Math.max(1, Number(url.searchParams.get("days")) || 30));

  const [stats, audit] = await Promise.all([getStats(rangeDays), listAudit(50)]);

  return NextResponse.json({ stats, audit });
}
