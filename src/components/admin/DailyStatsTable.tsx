"use client";

import { useMemo, useState } from "react";
import { PERSONAS } from "@/data/personas";
import { SPREADS } from "@/data/spreads";

const SPREAD_NAME = Object.fromEntries(SPREADS.map((s) => [s.id, s.nameTh]));
const PERSONA_NAME = Object.fromEntries(PERSONAS.map((p) => [p.id, p.nameTh]));
const CATEGORY_NAME: Record<string, string> = {
  general: "ทั่วไป",
  love: "ความรัก",
  work: "การงาน",
  money: "การเงิน",
  self: "ตัวเอง",
};
const FLAG_NAME: Record<string, string> = {
  crisis: "สัญญาณวิกฤต (1323)",
  crisis_ai: "สัญญาณวิกฤต (1323)",
  medical: "สุขภาพ/การแพทย์",
  legal: "กฎหมาย/คดี",
  gambling: "หวย/พนัน/หุ้น",
  third_party: "เรื่องบุคคลที่สาม",
};

interface DailyStatsTableProps {
  daily: Record<string, Record<string, number>>;
  rangeDays: number;
}

interface DayRow {
  date: string; // YYYY-MM-DD
  dayLabel: string; // e.g. "12 ก.ย. 2569"
  weekdayLabel: string; // e.g. "วันศุกร์"
  isToday: boolean;
  isYesterday: boolean;
  started: number;
  completed: number;
  completionRate: string;
  completionRateNum: number;
  chat: number;
  blocked: number;
  topCategory: { name: string; count: number; pct: string } | null;
  topSpread: { name: string; count: number } | null;
  topPersona: { name: string; count: number } | null;
  categories: { key: string; name: string; count: number; pct: string }[];
  personas: { key: string; name: string; count: number }[];
  spreads: { key: string; name: string; count: number }[];
  flags: { key: string; name: string; count: number }[];
  raw: Record<string, number>;
}

function parseBreakdown(src: Record<string, number>, prefix: string) {
  return Object.entries(src)
    .filter(([k]) => k.startsWith(prefix))
    .map(([k, count]) => ({ key: k.slice(prefix.length), count }))
    .sort((a, b) => b.count - a.count);
}

function formatThaiDate(iso: string): { label: string; weekday: string } {
  try {
    const [y, m, d] = iso.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const label = new Intl.DateTimeFormat("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Bangkok",
    }).format(date);
    const weekday = new Intl.DateTimeFormat("th-TH", {
      weekday: "long",
      timeZone: "Asia/Bangkok",
    }).format(date);
    return { label, weekday };
  } catch {
    return { label: iso, weekday: "" };
  }
}

export default function DailyStatsTable({ daily, rangeDays }: DailyStatsTableProps) {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [activeChartDate, setActiveChartDate] = useState<string | null>(null);

  // Today and yesterday ISO strings in Asia/Bangkok time
  const todayISO = useMemo(() => {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
  }, []);

  const yesterdayISO = useMemo(() => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 1);
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(d);
  }, []);

  // Process rows
  const rows: DayRow[] = useMemo(() => {
    const entries = Object.entries(daily || {});
    // Sort descending by date (newest first)
    entries.sort((a, b) => b[0].localeCompare(a[0]));

    return entries.map(([date, metrics]) => {
      const { label, weekday } = formatThaiDate(date);
      const isToday = date === todayISO;
      const isYesterday = date === yesterdayISO;

      const started = metrics.reading_started ?? 0;
      const completed = metrics.reading_completed ?? 0;
      const failed = metrics.reading_failed ?? 0;
      const blocked = (metrics.reading_blocked ?? 0) + (metrics.entitlement_blocked_read ?? 0);
      const chat = metrics.chat_message ?? 0;

      const completionRateNum = started > 0 ? Math.round((completed / started) * 100) : 0;
      const completionRate = started > 0 ? `${completionRateNum}%` : "—";

      // Categories breakdown
      const rawCategories = parseBreakdown(metrics, "category:");
      const totalCatCounts = rawCategories.reduce((sum, item) => sum + item.count, 0);
      const categories = rawCategories.map((c) => ({
        key: c.key,
        name: CATEGORY_NAME[c.key] ?? c.key,
        count: c.count,
        pct: totalCatCounts > 0 ? `${Math.round((c.count / totalCatCounts) * 100)}%` : "0%",
      }));
      const topCategory =
        categories.length > 0
          ? { name: categories[0].name, count: categories[0].count, pct: categories[0].pct }
          : null;

      // Spreads breakdown
      const rawSpreads = parseBreakdown(metrics, "spread:");
      const spreads = rawSpreads.map((s) => ({
        key: s.key,
        name: SPREAD_NAME[s.key] ?? s.key,
        count: s.count,
      }));
      const topSpread = spreads.length > 0 ? { name: spreads[0].name, count: spreads[0].count } : null;

      // Personas breakdown
      const rawPersonas = parseBreakdown(metrics, "persona:");
      const personas = rawPersonas.map((p) => ({
        key: p.key,
        name: PERSONA_NAME[p.key] ?? p.key,
        count: p.count,
      }));
      const topPersona = personas.length > 0 ? { name: personas[0].name, count: personas[0].count } : null;

      // Flags breakdown
      const rawFlags = parseBreakdown(metrics, "safety_flag:");
      const flags = rawFlags.map((f) => ({
        key: f.key,
        name: FLAG_NAME[f.key] ?? f.key,
        count: f.count,
      }));

      return {
        date,
        dayLabel: label,
        weekdayLabel: weekday,
        isToday,
        isYesterday,
        started,
        completed,
        completionRate,
        completionRateNum,
        chat,
        blocked: blocked + failed,
        topCategory,
        topSpread,
        topPersona,
        categories,
        personas,
        spreads,
        flags,
        raw: metrics,
      };
    });
  }, [daily, todayISO, yesterdayISO]);

  // Today & Yesterday summary comparison
  const todayRow = rows.find((r) => r.isToday);
  const yesterdayRow = rows.find((r) => r.isYesterday);

  const dayOverDay = useMemo(() => {
    const todayStarted = todayRow?.started ?? 0;
    const yestStarted = yesterdayRow?.started ?? 0;
    let startedDiffPct = 0;
    if (yestStarted > 0) {
      startedDiffPct = Math.round(((todayStarted - yestStarted) / yestStarted) * 100);
    }

    const todayChat = todayRow?.chat ?? 0;
    const yestChat = yesterdayRow?.chat ?? 0;

    return {
      todayStarted,
      yestStarted,
      startedDiffPct,
      todayChat,
      yestChat,
      todayCompleted: todayRow?.completed ?? 0,
      todayCompletionRate: todayRow?.completionRate ?? "—",
    };
  }, [todayRow, yesterdayRow]);

  // Chronological rows for visual bar chart (oldest to newest)
  const chartRows = useMemo(() => {
    return [...rows].reverse();
  }, [rows]);

  const maxStartedInChart = useMemo(() => {
    return Math.max(1, ...chartRows.map((r) => r.started));
  }, [chartRows]);

  // Overall Plain-Thai insights summary
  const insights = useMemo(() => {
    if (rows.length === 0) return null;
    const totalStarted = rows.reduce((s, r) => s + r.started, 0);
    const avgPerDay = Math.round(totalStarted / rows.length);

    // Find peak day
    const peakRow = [...rows].sort((a, b) => b.started - a.started)[0];

    // Find overall top category in range
    const catMap: Record<string, number> = {};
    for (const r of rows) {
      for (const c of r.categories) {
        catMap[c.name] = (catMap[c.name] ?? 0) + c.count;
      }
    }
    const topCatSorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    const overallTopCategory = topCatSorted[0] ? topCatSorted[0][0] : "ทั่วไป";

    return {
      totalStarted,
      avgPerDay,
      peakDate: peakRow ? `${peakRow.weekdayLabel}ที่ ${peakRow.dayLabel}` : "—",
      peakCount: peakRow?.started ?? 0,
      topCategory: overallTopCategory,
    };
  }, [rows]);

  // Export to CSV with UTF-8 BOM for Microsoft Excel compatibility
  const handleExportCSV = () => {
    const headers = [
      "วันที่",
      "วันในสัปดาห์",
      "เริ่มเปิดไพ่ (ครั้ง)",
      "อ่านจบสมบูรณ์ (ครั้ง)",
      "อัตราสำเร็จ",
      "แชทถามต่อ (ข้อความ)",
      "หมวดยอดนิยม",
      "ผังยอดนิยม",
      "แม่หมอยอดนิยม",
      "รายการบล็อก/ปัญหา",
    ];

    const csvLines = rows.map((r) => [
      `"${r.date}"`,
      `"${r.weekdayLabel}"`,
      r.started,
      r.completed,
      `"${r.completionRate}"`,
      r.chat,
      `"${r.topCategory?.name ?? "—"}"`,
      `"${r.topSpread?.name ?? "—"}"`,
      `"${r.topPersona?.name ?? "—"}"`,
      r.blocked,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...csvLines.map((l) => l.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seertarot-daily-stats-${todayISO}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* ─── ชั้นที่ 1: สถานะวันนี้ (ภาพรวมด่วนประจำวัน) ──────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-ink font-mystic-gold">
              สถิติประจำวันนี้ ({formatThaiDate(todayISO).label})
            </h3>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
              ข้อมูลสดวันนี้
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Today vs Yesterday */}
          <div className="rounded-2xl border border-line bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted">ยอดเปิดไพ่วันนี้</span>
              <span className="rounded-full bg-canvas px-2 py-0.5 text-[10px] font-semibold text-ink border border-line">
                วันนี้
              </span>
            </div>
            <p className="mt-1 text-2xl font-bold font-mono text-ink">
              {dayOverDay.todayStarted.toLocaleString("th-TH")}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              {dayOverDay.yestStarted > 0 ? (
                <>
                  <span
                    className={`font-semibold ${
                      dayOverDay.startedDiffPct >= 0 ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {dayOverDay.startedDiffPct >= 0 ? `+${dayOverDay.startedDiffPct}%` : `${dayOverDay.startedDiffPct}%`}
                  </span>
                  <span className="text-muted">
                    เทียบกับเมื่อวาน ({dayOverDay.yestStarted.toLocaleString("th-TH")})
                  </span>
                </>
              ) : (
                <span className="text-muted">เมื่อวาน: {dayOverDay.yestStarted.toLocaleString("th-TH")} ครั้ง</span>
              )}
            </div>
          </div>

          {/* Card 2: Completion Rate Today */}
          <div className="rounded-2xl border border-line bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted">อ่านจบสมบูรณ์</span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                สำเร็จ
              </span>
            </div>
            <p className="mt-1 text-2xl font-bold font-mono text-ink">
              {dayOverDay.todayCompleted.toLocaleString("th-TH")}
            </p>
            <p className="mt-2 text-xs text-muted">
              คิดเป็น <strong className="text-ink">{dayOverDay.todayCompletionRate}</strong> ของรอบที่เริ่ม
            </p>
          </div>

          {/* Card 3: Chat Messages Today */}
          <div className="rounded-2xl border border-line bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted">แชทถามต่อกับแม่หมอ</span>
              <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700 border border-sky-200">
                ข้อความ
              </span>
            </div>
            <p className="mt-1 text-2xl font-bold font-mono text-ink">
              {dayOverDay.todayChat.toLocaleString("th-TH")}
            </p>
            <p className="mt-2 text-xs text-muted">
              เมื่อวาน: <strong className="text-ink">{dayOverDay.yestChat.toLocaleString("th-TH")}</strong> ข้อความ
            </p>
          </div>

          {/* Card 4: Top Topic Today */}
          <div className="rounded-2xl border border-line bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted">เรื่องยอดนิยมวันนี้</span>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
                อันดับ 1
              </span>
            </div>
            <p className="mt-1 text-xl font-bold text-ink truncate">
              {todayRow?.topCategory ? todayRow.topCategory.name : "ยังไม่มีข้อมูล"}
            </p>
            <p className="mt-2 text-xs text-muted">
              {todayRow?.topCategory
                ? `มีผู้ถามเรื่องนี้ ${todayRow.topCategory.pct} ของวันนี้`
                : "รอผู้ใช้งานในวันนี้"}
            </p>
          </div>
        </div>
      </div>

      {/* ─── ชั้นที่ 2: สรุปภาพรวมและแนวโน้มช่วงเวลา ──────────────────── */}
      <div className="rounded-2xl border border-line bg-white p-5 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gold-ink">
                สรุปภาพรวมในรอบ {rangeDays} วันล่าสุด
              </span>
            </div>
            {insights && (
              <p className="text-xs sm:text-sm text-ink leading-relaxed">
                ในช่วง {rangeDays} วันที่ผ่านมา มีการเปิดไพ่รวมทั้งหมด{" "}
                <strong className="font-semibold text-ink">
                  {insights.totalStarted.toLocaleString("th-TH")} ครั้ง
                </strong>{" "}
                (เฉลี่ยวันละ {insights.avgPerDay.toLocaleString("th-TH")} ครั้ง)
                {insights.totalStarted > 0 ? (
                  <>
                    {" "}โดยวันที่มีการใช้งานสูงสุดคือ{" "}
                    <strong className="font-semibold text-ink">{insights.peakDate}</strong> (
                    {insights.peakCount.toLocaleString("th-TH")} ครั้ง) และเรื่องที่ผู้คนให้ความสนใจถามมากที่สุดคือ{" "}
                    <strong className="font-semibold text-ink">{insights.topCategory}</strong>
                  </>
                ) : (
                  <> — ระบบสถิติพร้อมบันทึกข้อมูลอย่างละเอียดทันทีที่มีผู้ใช้เปิดไพ่</>
                )}
              </p>
            )}
          </div>
          <div className="shrink-0">
            <button
              type="button"
              onClick={handleExportCSV}
              className="tap-overlay-y inline-flex items-center gap-2 rounded-xl border border-ink bg-ink px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-dark transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <span>ดาวน์โหลดรายงาน (CSV / Excel)</span>
            </button>
          </div>
        </div>

        {/* กราฟแนวโน้มรายวัน */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-ink font-mystic-gold">
                กราฟแนวโน้มปริมาณการเปิดไพ่รายวัน
              </h4>
              <p className="text-xs text-muted mt-0.5">
                แสดงการกระจายตัวของจำนวนการเปิดไพ่ในแต่ละวัน (แตะหรือชี้ที่แท่งเพื่อดูสรุป)
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-xs text-muted">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-xs bg-gold" />
                <span>เปิดไพ่จบสมบูรณ์</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-xs bg-line" />
                <span>เริ่มเปิดไพ่</span>
              </div>
            </div>
          </div>

        {chartRows.length === 0 ? (
          <p className="text-xs text-muted py-8 text-center">ยังไม่มีข้อมูลสถิติรายวัน</p>
        ) : (
          <div className="pt-4">
            {/* Chart Area */}
            <div className="flex items-end gap-1 sm:gap-2 h-36 w-full border-b border-line pb-1 overflow-x-auto">
              {chartRows.map((r) => {
                const heightPct = Math.max(6, Math.round((r.started / maxStartedInChart) * 100));
                const isSelected = activeChartDate === r.date;
                return (
                  <div
                    key={r.date}
                    onMouseEnter={() => setActiveChartDate(r.date)}
                    onClick={() => setActiveChartDate(r.date)}
                    className="flex-1 min-w-[20px] flex flex-col items-center justify-end h-full group relative cursor-pointer"
                  >
                    {/* Tooltip on hover / selection */}
                    {isSelected && (
                      <div className="absolute -top-14 z-20 whitespace-nowrap rounded-lg border border-line bg-ink px-2.5 py-1.5 text-[11px] text-white shadow-md pointer-events-none">
                        <p className="font-semibold">{r.dayLabel}</p>
                        <p className="text-line text-[10px]">
                          เริ่ม {r.started} · สำเร็จ {r.completed} ({r.completionRate})
                        </p>
                      </div>
                    )}

                    {/* Bar visual */}
                    <div
                      className={`w-full max-w-[28px] rounded-t-sm transition-colors duration-200 ${
                        r.isToday
                          ? "bg-ink"
                          : isSelected
                          ? "bg-gold-deep"
                          : "bg-gold hover:bg-gold-deep"
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* X-Axis labels */}
            <div className="flex justify-between items-center pt-2 text-[10px] text-muted font-mono">
              <span>{chartRows[0]?.dayLabel ?? ""}</span>
              <span className="hidden sm:inline">แนวโน้มรายวัน</span>
              <span>{chartRows[chartRows.length - 1]?.dayLabel ?? ""}</span>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* ─── ชั้นที่ 3: ตารางบันทึกข้อมูลย้อนหลังรายวัน ──────────────── */}
      <div className="rounded-2xl border border-line bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <h3 className="text-sm font-bold text-ink font-mystic-gold">
              ตารางบันทึกข้อมูลย้อนหลังรายวัน
            </h3>
            <p className="text-xs text-muted mt-0.5">
              บันทึกกิจกรรมย้อนหลังรายวัน แตะหรือคลิกที่แถวเพื่อดูรายละเอียดเจาะลึกของแต่ละวัน
            </p>
          </div>
          <div className="text-xs text-muted">
            แสดงทั้งหมด <strong className="text-ink">{rows.length}</strong> วัน
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="text-xs text-muted py-8 text-center">ยังไม่มีข้อมูลบันทึกในระบบ</p>
        ) : (
          <>
            {/* Mobile Card List View (Zero Scroll, 100% Full-Width Responsive) */}
            <div className="space-y-3 md:hidden">
              {rows.map((row) => {
                const isExpanded = expandedDate === row.date;
                return (
                  <div
                    key={row.date}
                    className={`rounded-xl border border-line p-4 shadow-2xs space-y-3 transition-colors ${
                      row.isToday ? "bg-amber-50/40 border-amber-300" : "bg-white"
                    }`}
                  >
                    {/* Date & Badges */}
                    <div className="flex items-center justify-between border-b border-line pb-2">
                      <div>
                        <span className="font-semibold text-sm text-ink">{row.dayLabel}</span>
                        <span className="text-xs text-muted ml-1.5">({row.weekdayLabel})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {row.isToday && (
                          <span className="rounded-full bg-ink text-white px-2 py-0.5 text-[9px] font-bold">
                            วันนี้
                          </span>
                        )}
                        {row.isYesterday && (
                          <span className="rounded-full bg-canvas text-muted border border-line px-2 py-0.5 text-[9px]">
                            เมื่อวาน
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 3 Metric Stats */}
                    <div className="grid grid-cols-3 gap-2 rounded-lg bg-canvas p-2.5 text-center text-xs">
                      <div>
                        <span className="text-muted block text-[10px]">เริ่มเปิดไพ่</span>
                        <span className="font-bold text-ink">{row.started.toLocaleString("th-TH")}</span>
                      </div>
                      <div>
                        <span className="text-muted block text-[10px]">อ่านจบ (สำเร็จ)</span>
                        <span className="font-bold text-emerald-700">{row.completed.toLocaleString("th-TH")}</span>
                      </div>
                      <div>
                        <span className="text-muted block text-[10px]">แชทถามต่อ</span>
                        <span className="font-bold text-ink">{row.chat.toLocaleString("th-TH")}</span>
                      </div>
                    </div>

                    {/* Highlights & Expand */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="text-[11px] text-muted truncate max-w-[200px]">
                        หมวดยอดนิยม: <strong className="text-ink">{row.topCategory?.name ?? "—"}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExpandedDate(isExpanded ? null : row.date)}
                        className={`tap-overlay-y rounded-lg border px-2.5 py-1 text-[11px] font-medium transition cursor-pointer shrink-0 ${
                          isExpanded
                            ? "border-ink bg-ink text-white"
                            : "border-line bg-white text-ink hover:bg-canvas"
                        }`}
                      >
                        {isExpanded ? "ย่อข้อมูล ▴" : "ดูข้อมูลย่อย ▾"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop & Tablet Full-Width Responsive Table (Zero Scroll, Fits Entire Page) */}
            <div className="hidden md:block w-full overflow-hidden rounded-xl border border-line bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-line bg-canvas text-muted">
                    <th className="py-3 px-3.5 font-semibold whitespace-nowrap">วันที่</th>
                    <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">เริ่มเปิดไพ่</th>
                    <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">อ่านจบ (สำเร็จ)</th>
                    <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">แชทถามต่อ</th>
                    <th className="py-3 px-3.5 font-semibold whitespace-nowrap">หมวดยอดนิยม</th>
                    <th className="py-3 px-3.5 font-semibold whitespace-nowrap">ผังยอดนิยม</th>
                    <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">บล็อก/ปัญหา</th>
                    <th className="py-3 px-3.5 font-semibold text-center whitespace-nowrap">รายละเอียด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((row) => {
                    const isExpanded = expandedDate === row.date;
                    return (
                      <tr
                        key={row.date}
                        className={`group transition-colors ${
                          row.isToday
                            ? "bg-amber-50/40 hover:bg-amber-50/70"
                            : isExpanded
                            ? "bg-canvas"
                            : "hover:bg-canvas"
                        }`}
                      >
                        {/* Date & Badge */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-ink">{row.dayLabel}</span>
                            {row.isToday && (
                              <span className="rounded-full bg-ink text-white px-2 py-0.5 text-[9px] font-bold whitespace-nowrap">
                                วันนี้
                              </span>
                            )}
                            {row.isYesterday && (
                              <span className="rounded-full bg-canvas text-muted border border-line px-2 py-0.5 text-[9px] whitespace-nowrap">
                                เมื่อวาน
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted mt-0.5">{row.weekdayLabel}</p>
                        </td>

                        {/* Total Started */}
                        <td className="py-3 px-3 text-right font-mono font-semibold text-ink whitespace-nowrap">
                          {row.started.toLocaleString("th-TH")}
                        </td>

                        {/* Completed */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <span className="font-mono font-semibold text-emerald-700">
                            {row.completed.toLocaleString("th-TH")}
                          </span>
                          <span className="text-[11px] text-muted ml-1 font-mono">
                            ({row.completionRate})
                          </span>
                        </td>

                        {/* Chat Messages */}
                        <td className="py-3 px-3 text-right font-mono text-ink whitespace-nowrap">
                          {row.chat.toLocaleString("th-TH")}
                        </td>

                        {/* Top Category */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          {row.topCategory ? (
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                              <span className="rounded-md border border-line bg-canvas px-2 py-0.5 text-[11px] font-medium text-ink whitespace-nowrap">
                                {row.topCategory.name}
                              </span>
                              <span className="text-[10px] text-muted whitespace-nowrap">{row.topCategory.pct}</span>
                            </div>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>

                        {/* Top Spread */}
                        <td className="py-3 px-3.5 text-muted truncate max-w-[160px] whitespace-nowrap">
                          {row.topSpread ? row.topSpread.name : "—"}
                        </td>

                        {/* Blocked / Issues */}
                        <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                          {row.blocked > 0 ? (
                            <span className="text-rose-700 font-semibold">{row.blocked}</span>
                          ) : (
                            <span className="text-muted">0</span>
                          )}
                        </td>

                        {/* Expand Button */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setExpandedDate(isExpanded ? null : row.date)}
                            className={`tap-overlay-y inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition cursor-pointer whitespace-nowrap ${
                              isExpanded
                                ? "border-ink bg-ink text-white"
                                : "border-line bg-white text-ink hover:bg-canvas hover:border-gold"
                            }`}
                          >
                            <span>{isExpanded ? "ย่อข้อมูล" : "ดูข้อมูลย่อย"}</span>
                            <span className="text-[10px]">{isExpanded ? "▴" : "▾"}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ─── Expanded Sub-panel for Selected Date ───────────────────── */}
        {expandedDate && (() => {
          const selectedRow = rows.find((r) => r.date === expandedDate);
          if (!selectedRow) return null;
          return (
            <div className="mt-4 rounded-xl border border-line bg-canvas p-5 space-y-4 anim-swap-rise-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-ink">
                    ข้อมูลเจาะลึกประจำ{selectedRow.weekdayLabel}ที่ {selectedRow.dayLabel}
                  </h4>
                  {selectedRow.isToday && (
                    <span className="rounded-full bg-ink text-white px-2 py-0.5 text-[9px] font-bold">
                      วันนี้
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedDate(null)}
                  className="text-xs text-muted hover:text-ink self-end cursor-pointer"
                >
                  ปิดหน้าต่างย่อย ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* 1. Categories Breakdown */}
                <div className="rounded-xl border border-line bg-white p-4 space-y-2.5 shadow-2xs">
                  <p className="font-semibold text-ink">สัดส่วนหมวดคำถาม</p>
                  {selectedRow.categories.length === 0 ? (
                    <p className="text-muted">ไม่มีข้อมูลหมวดหมู่ในวันนี้</p>
                  ) : (
                    <ul className="space-y-2">
                      {selectedRow.categories.map((c) => (
                        <li key={c.key} className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-ink">{c.name}</span>
                            <span className="font-mono text-muted">
                              {c.count} ({c.pct})
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-inset overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gold"
                              style={{ width: c.pct }}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* 2. Persona Breakdown */}
                <div className="rounded-xl border border-line bg-white p-4 space-y-2.5 shadow-2xs">
                  <p className="font-semibold text-ink">แม่หมอที่ถูกเลือก</p>
                  {selectedRow.personas.length === 0 ? (
                    <p className="text-muted">ไม่มีข้อมูลการเลือกแม่หมอ</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {selectedRow.personas.map((p) => (
                        <li key={p.key} className="flex justify-between items-center text-[11px]">
                          <span className="text-ink truncate pr-2">{p.name}</span>
                          <span className="font-mono text-muted">{p.count} ครั้ง</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* 3. Spreads & Safety */}
                <div className="rounded-xl border border-line bg-white p-4 space-y-2.5 shadow-2xs">
                  <p className="font-semibold text-ink">ผังไพ่ & ความปลอดภัย</p>
                  <div className="space-y-2">
                    <p className="text-[11px] font-medium text-muted">ผังยอดนิยม:</p>
                    {selectedRow.spreads.slice(0, 3).map((s) => (
                      <div key={s.key} className="flex justify-between text-[11px]">
                        <span className="text-ink truncate pr-2">{s.name}</span>
                        <span className="font-mono text-muted">{s.count}</span>
                      </div>
                    ))}

                    <div className="border-t border-line pt-2">
                      <p className="text-[11px] font-medium text-muted">ธงความปลอดภัย:</p>
                      {selectedRow.flags.length === 0 ? (
                        <p className="text-[11px] text-emerald-700 mt-1">ปลอดภัย ไม่มีสัญญาณวิกฤต</p>
                      ) : (
                        selectedRow.flags.map((f) => (
                          <div key={f.key} className="flex justify-between text-[11px] text-rose-700 mt-1">
                            <span>{f.name}</span>
                            <span className="font-mono font-semibold">{f.count} ครั้ง</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
