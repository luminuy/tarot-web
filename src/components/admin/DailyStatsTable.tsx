"use client";

import { useMemo, useState } from "react";

import { BarList, SectionTitle, StatCard, fmt, fmtPct, thaiDay } from "@/components/admin/StatsWidgets";
import { PERSONAS } from "@/data/personas";
import { SPREADS } from "@/data/spreads";
import { CATEGORY_NAME, FLAG_NAME, summarize, type StatsSummary } from "@/lib/stats/admin-metrics";

const SPREAD_NAME = Object.fromEntries(SPREADS.map((s) => [s.id, s.nameTh]));
const PERSONA_NAME = Object.fromEntries(PERSONAS.map((p) => [p.id, p.nameTh]));

interface DailyStatsTableProps {
  daily: Record<string, Record<string, number>>;
  range: Record<string, number>;
  rangeDays: number;
  today: string;
  /** กดแถว/แท่งกราฟ ➔ เปิด "สรุปรายวัน" ของวันนั้น */
  onSelectDay: (day: string) => void;
}

interface DayRow {
  date: string;
  label: string;
  short: string;
  weekday: string;
  s: StatsSummary;
  problems: number;
}

function problemsOf(s: StatsSummary): number {
  return s.usage.failed + s.ai.errors + s.ai.mockServed + s.ai.chatOffline;
}

/**
 * มุมมอง "แนวโน้ม & ความนิยม" — ภาพรวมทั้งช่วง · กราฟรายวัน · ความนิยม · ตารางย้อนหลัง · ส่งออก CSV
 * รายละเอียดเจาะลึกของแต่ละวันอยู่ที่ `DailySummary` (กดแถวเพื่อเปิด)
 */
export default function DailyStatsTable({ daily, range, rangeDays, today, onSelectDay }: DailyStatsTableProps) {
  const [hover, setHover] = useState<string | null>(null);

  const rows: DayRow[] = useMemo(
    () =>
      Object.entries(daily || {})
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([date, doc]) => {
          const s = summarize(doc);
          const { label, short, weekday } = thaiDay(date);
          return { date, label, short, weekday, s, problems: problemsOf(s) };
        }),
    [daily],
  );
  const total = useMemo(() => summarize(range), [range]);
  const chartRows = useMemo(() => [...rows].reverse(), [rows]);
  const maxStarted = Math.max(1, ...rows.map((r) => r.s.usage.started));
  const peak = rows.reduce<DayRow | null>((best, r) => (!best || r.s.usage.started > best.s.usage.started ? r : best), null);
  const activeDays = rows.filter((r) => r.s.usage.started > 0).length;
  const hovered = rows.find((r) => r.date === hover) ?? null;

  const exportCsv = () => {
    const headers = [
      "วันที่",
      "วันในสัปดาห์",
      "เริ่มเปิดไพ่",
      "อ่านจบ",
      "อัตราอ่านจบ (%)",
      "ล้มเหลว",
      "ยกเลิกกลางคัน",
      "แชทถามต่อ",
      "เรียก AI Groq",
      "เรียก AI Gemini",
      "สลับ Groq ไป Gemini",
      "AI ผิดพลาด",
      "คำตอบสำรอง",
      "เวลาเฉลี่ย (ms)",
      "Token รวม",
      "บล็อกความปลอดภัย",
      "ถูกกั้นด้วยสิทธิ์",
      "เช็กอินรายวัน",
      "หมวดยอดนิยม",
      "ผังยอดนิยม",
    ];
    const q = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = rows.map(({ date, weekday, s }) => [
      q(date),
      q(weekday),
      s.usage.started,
      s.usage.completed,
      s.usage.completionPct ?? "",
      s.usage.failed,
      s.usage.cancelled,
      s.usage.chat,
      s.ai.groq,
      s.ai.gemini,
      s.ai.failover,
      s.ai.errors,
      s.ai.mockServed + s.ai.chatOffline,
      s.ai.avgLatencyMs ?? "",
      s.ai.tokensIn + s.ai.tokensOut,
      s.safety.total,
      s.gating.total,
      s.usage.dailyCheckin,
      q(s.top.categories[0] ? (CATEGORY_NAME[s.top.categories[0].key] ?? s.top.categories[0].key) : ""),
      q(s.top.spreads[0] ? (SPREAD_NAME[s.top.spreads[0].key] ?? s.top.spreads[0].key) : ""),
    ]);
    // BOM นำหน้า ไม่งั้น Excel เปิดภาษาไทยเป็นตัวต่างดาว
    const csv = "\uFEFF" + [headers.map(q).join(","), ...lines.map((l) => l.join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `seertarot-stats-${rangeDays}d-${today}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* ─── ภาพรวมทั้งช่วง ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={`เริ่มเปิดไพ่ (${rangeDays} วัน)`}
          value={fmt(total.usage.started)}
          sub={`เฉลี่ยวันละ ${fmt(Math.round(total.usage.started / Math.max(1, rows.length)))} ครั้ง`}
        />
        <StatCard
          label="อ่านจบสมบูรณ์"
          value={fmt(total.usage.completed)}
          sub={`${fmtPct(total.usage.completionPct)} ของที่เริ่ม · ล้มเหลว ${fmt(total.usage.failed)}`}
        />
        <StatCard label="แชทถามต่อ" value={fmt(total.usage.chat)} sub={`เช็กอินรายวัน ${fmt(total.usage.dailyCheckin)} ครั้ง`} />
        <StatCard
          label="วันที่คนใช้มากสุด"
          value={peak && peak.s.usage.started > 0 ? peak.short : "—"}
          sub={
            peak && peak.s.usage.started > 0
              ? `${fmt(peak.s.usage.started)} ครั้ง · มีการใช้งาน ${activeDays}/${rows.length} วัน`
              : "ยังไม่มีการใช้งานในช่วงนี้"
          }
        />
      </div>

      {/* ─── กราฟรายวัน ─────────────────────────────────────────────── */}
      <div className="altar-card-porcelain space-y-3 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <SectionTitle title="ปริมาณการเปิดไพ่รายวัน" />
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-xs bg-line" /> เริ่มเปิดไพ่
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-xs bg-gold" /> อ่านจบ
            </span>
          </div>
        </div>
        <p className="min-h-4 text-xs text-muted" aria-live="polite">
          {hovered
            ? `${hovered.weekday} ${hovered.label} — เริ่ม ${fmt(hovered.s.usage.started)} · อ่านจบ ${fmt(
                hovered.s.usage.completed,
              )} (${fmtPct(hovered.s.usage.completionPct)}) · แชท ${fmt(hovered.s.usage.chat)} · กดเพื่อเปิดสรุปของวันนั้น`
            : "ชี้หรือแตะแท่งเพื่อดูตัวเลข · กดเพื่อเปิดสรุปของวันนั้น"}
        </p>

        {rows.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted">ยังไม่มีข้อมูลสถิติรายวัน</p>
        ) : (
          <>
            <div className="flex h-36 w-full items-end gap-[2px] border-b border-line" onMouseLeave={() => setHover(null)}>
              {chartRows.map((r) => {
                const startedPct = (r.s.usage.started / maxStarted) * 100;
                const completedPct = (r.s.usage.completed / maxStarted) * 100;
                return (
                  <button
                    key={r.date}
                    type="button"
                    onMouseEnter={() => setHover(r.date)}
                    onFocus={() => setHover(r.date)}
                    onClick={() => onSelectDay(r.date)}
                    aria-label={`${r.label}: เริ่มเปิดไพ่ ${r.s.usage.started} อ่านจบ ${r.s.usage.completed} — เปิดสรุปของวันนั้น`}
                    className={`tap-overlay-y relative flex h-full min-w-0 flex-1 items-end justify-center cursor-pointer rounded-t-sm ${
                      hover === r.date ? "bg-canvas" : ""
                    }`}
                  >
                    <span
                      className={`relative block w-full max-w-7 rounded-t-sm ${r.date === today ? "bg-ink/25" : "bg-line"}`}
                      style={{ height: `${Math.max(r.s.usage.started > 0 ? 3 : 0, startedPct)}%` }}
                    >
                      <span
                        className={`absolute inset-x-0 bottom-0 block rounded-t-sm ${
                          hover === r.date ? "bg-gold-deep" : "bg-gold"
                        }`}
                        style={{ height: startedPct > 0 ? `${(completedPct / startedPct) * 100}%` : 0 }}
                      />
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between text-[11px] font-mono text-muted">
              <span>{chartRows[0]?.short}</span>
              <span>{chartRows[chartRows.length - 1]?.short}</span>
            </div>
          </>
        )}
      </div>

      {/* ─── ความนิยมทั้งช่วง ───────────────────────────────────────── */}
      <div className="grid gap-3 lg:grid-cols-2">
        <BarList title={`หมวดคำถาม (${rangeDays} วัน)`} rows={total.top.categories} nameMap={CATEGORY_NAME} />
        <BarList title={`ผังไพ่ที่ถูกเลือก (${rangeDays} วัน)`} rows={total.top.spreads} nameMap={SPREAD_NAME} limit={8} />
        <BarList title={`แม่หมอที่ถูกเลือก (${rangeDays} วัน)`} rows={total.top.personas} nameMap={PERSONA_NAME} />
        <BarList
          title={`สัญญาณเสี่ยงที่ตรวจพบ (${rangeDays} วัน)`}
          rows={total.safety.flags}
          nameMap={FLAG_NAME}
          empty="ไม่พบสัญญาณเสี่ยงในช่วงนี้"
        />
      </div>

      {/* ─── ตารางย้อนหลัง ──────────────────────────────────────────── */}
      <div className="altar-card-porcelain space-y-4 p-5">
        <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <SectionTitle title="ตารางย้อนหลังรายวัน" />
            <p className="mt-0.5 text-xs text-muted">กดที่วันเพื่อเปิดสรุปเต็มของวันนั้น</p>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            disabled={rows.length === 0}
            className="btn-gold-glass !rounded-xl tap-overlay-y inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            ดาวน์โหลด CSV (Excel)
          </button>
        </div>

        {rows.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted">ยังไม่มีข้อมูลบันทึกในระบบ</p>
        ) : (
          <>
            {/* มือถือ: การ์ดทีละวัน */}
            <ul className="space-y-2 md:hidden">
              {rows.map((r) => (
                <li key={r.date}>
                  <button
                    type="button"
                    onClick={() => onSelectDay(r.date)}
                    className={`w-full min-h-11 rounded-xl border p-3 text-left text-xs cursor-pointer ${
                      r.date === today ? "border-gold bg-canvas" : "border-line bg-white"
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <span className="font-semibold text-ink">
                        {r.label} <span className="font-normal text-muted">({r.weekday})</span>
                      </span>
                      <span className="text-gold-ink">ดูสรุป ›</span>
                    </span>
                    <span className="mt-2 grid grid-cols-4 gap-1 text-center">
                      <Cell label="เริ่ม" value={fmt(r.s.usage.started)} />
                      <Cell label="อ่านจบ" value={fmtPct(r.s.usage.completionPct)} />
                      <Cell label="แชท" value={fmt(r.s.usage.chat)} />
                      <Cell label="ปัญหา" value={fmt(r.problems)} alert={r.problems > 0} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            {/* เดสก์ท็อป */}
            <div className="hidden w-full md:block">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-line bg-canvas text-muted">
                    <th className="px-3 py-2.5 font-semibold">วันที่</th>
                    <th className="px-3 py-2.5 text-right font-semibold">เริ่มเปิดไพ่</th>
                    <th className="px-3 py-2.5 text-right font-semibold">อ่านจบ</th>
                    <th className="px-3 py-2.5 text-right font-semibold">แชท</th>
                    <th className="px-3 py-2.5 text-right font-semibold">เรียก AI</th>
                    <th className="px-3 py-2.5 text-right font-semibold" title="ล้มเหลว + AI ผิดพลาด + คำตอบสำรอง">
                      ปัญหา
                    </th>
                    <th className="px-3 py-2.5 text-right font-semibold">บล็อกความปลอดภัย</th>
                    <th className="px-3 py-2.5 font-semibold">หมวดยอดนิยม</th>
                    <th className="px-3 py-2.5 text-center font-semibold">
                      <span className="sr-only">เปิดสรุป</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((r) => (
                    <tr key={r.date} className={r.date === today ? "bg-canvas" : "hover:bg-canvas"}>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className="font-semibold text-ink">{r.label}</span>
                        {r.date === today ? (
                          <span className="btn-gold-glass ml-2 px-2 py-0.5 text-[10px] font-bold">วันนี้</span>
                        ) : null}
                        <span className="block text-[11px] text-muted">{r.weekday}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold tabular-nums text-ink">
                        {fmt(r.s.usage.started)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono tabular-nums">
                        <span className="font-semibold text-emerald-700">{fmt(r.s.usage.completed)}</span>
                        <span className="ml-1 text-muted">({fmtPct(r.s.usage.completionPct)})</span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-ink">{fmt(r.s.usage.chat)}</td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-ink">{fmt(r.s.ai.calls)}</td>
                      <td
                        className={`px-3 py-2.5 text-right font-mono tabular-nums ${
                          r.problems > 0 ? "font-semibold text-rose-700" : "text-muted"
                        }`}
                      >
                        {fmt(r.problems)}
                      </td>
                      <td
                        className={`px-3 py-2.5 text-right font-mono tabular-nums ${
                          r.s.safety.total > 0 ? "font-semibold text-rose-700" : "text-muted"
                        }`}
                      >
                        {fmt(r.s.safety.total)}
                      </td>
                      <td className="max-w-40 truncate px-3 py-2.5 text-ink">
                        {r.s.top.categories[0]
                          ? (CATEGORY_NAME[r.s.top.categories[0].key] ?? r.s.top.categories[0].key)
                          : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => onSelectDay(r.date)}
                          className="tap-overlay-y whitespace-nowrap rounded-lg border border-line bg-white px-2.5 py-1 text-[11px] font-medium text-ink hover:border-gold hover:bg-canvas cursor-pointer"
                        >
                          ดูสรุป ›
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Cell({ label, value, alert = false }: { label: string; value: string; alert?: boolean }) {
  return (
    <span className="rounded-lg bg-canvas py-1.5">
      <span className="block text-[10px] text-muted">{label}</span>
      <span className={`font-mono font-semibold ${alert ? "text-rose-700" : "text-ink"}`}>{value}</span>
    </span>
  );
}
