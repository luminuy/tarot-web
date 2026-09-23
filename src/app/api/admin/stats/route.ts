import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { getDayStats, getStats } from "@/lib/stats/read";
import { listAudit } from "@/lib/admin/audit";
import { utcDay } from "@/lib/stats/record";
import { getAiUsageToday } from "@/lib/security/ai-budget";

export const runtime = "nodejs";

/** ย้อนดูสรุปรายวันได้ไกลสุดเท่าอายุก้อนตัวนับรายวัน (`DAY_TTL_SEC` ใน record.ts = 400 วัน) */
const MAX_LOOKBACK_DAYS = 400;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET /api/admin/stats
 * - `?days=N`        ภาพรวมช่วง N วัน (1–90) + บันทึกแอดมิน (แผงภาพรวมใช้) + โควตา AI วันนี้
 * - `?day=YYYY-MM-DD` สรุปของวันเดียว + วันก่อนหน้าไว้เทียบ (หน้า "สรุปรายวัน")
 *
 * ⚠️ วันในระบบสถิติคือวัน UTC (ตัดรอบ 07:00 น. เวลาไทย) — ตรงกับคีย์ตัวนับทุกตัว
 */
export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const url = new URL(request.url);
  const dayParam = url.searchParams.get("day");

  if (dayParam !== null) {
    const today = utcDay();
    const oldest = utcDay(new Date(Date.now() - MAX_LOOKBACK_DAYS * 86_400_000));
    if (!DAY_RE.test(dayParam) || Number.isNaN(Date.parse(`${dayParam}T00:00:00Z`))) {
      return NextResponse.json({ error: "รูปแบบวันที่ไม่ถูกต้อง (ต้องเป็น YYYY-MM-DD)" }, { status: 400 });
    }
    if (dayParam > today || dayParam < oldest) {
      return NextResponse.json(
        { error: `เลือกได้ตั้งแต่ ${oldest} ถึง ${today} เท่านั้น` },
        { status: 400 },
      );
    }
    const isToday = dayParam === today;
    const [dayStats, ai] = await Promise.all([
      getDayStats(dayParam),
      // ตัวนับเพดาน AI มีอายุ 48 ชม. และมีความหมายเฉพาะ "วันนี้" — วันอื่นใช้ยอด ai_call:* แทน
      isToday ? getAiUsageToday() : Promise.resolve(null),
    ]);
    return NextResponse.json({ ...dayStats, today, oldest, isToday, ai });
  }

  const rangeDays = Math.min(90, Math.max(1, Number(url.searchParams.get("days")) || 30));

  const [stats, audit, ai] = await Promise.all([getStats(rangeDays), listAudit(50), getAiUsageToday()]);

  return NextResponse.json({ stats, audit, ai });
}
