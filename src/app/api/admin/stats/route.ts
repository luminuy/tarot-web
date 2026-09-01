import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { getStats } from "@/lib/stats/read";
import { listAudit } from "@/lib/admin/audit";
import { kvGetJSON, KEY } from "@/lib/platform/kv-store";
import { utcDay } from "@/lib/stats/record";
import { getAiDailyCap } from "@/lib/security/ai-budget";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const url = new URL(request.url);
  const rangeDays = Math.min(90, Math.max(1, Number(url.searchParams.get("days")) || 30));

  const [stats, audit, aiCapDoc] = await Promise.all([
    getStats(rangeDays),
    listAudit(50),
    kvGetJSON<{ count: number }>(KEY.aiCap(utcDay())).catch(() => null),
  ]);

  return NextResponse.json({
    stats,
    audit,
    aiCapToday: aiCapDoc?.count ?? 0,
    aiDailyCap: getAiDailyCap(),
  });
}

