"use client";

/**
 * ชิ้นส่วนหน้าจอที่แผงสถิติแอดมินใช้ร่วมกัน (การ์ดตัวเลข · แถบสัดส่วน · ป้ายเทียบ · หัวหมวด)
 * ใช้โทเคนสีเดิมของแผงแอดมินเท่านั้น — ห้ามเติมสีใหม่ (ด่าน test-palette-drift)
 */

import type { ReactNode } from "react";

import type { CountRow } from "@/lib/stats/admin-metrics";
import { change } from "@/lib/stats/admin-metrics";
import { APP_TIME_ZONE } from "@/lib/time/bangkok";

export function fmt(v: number | null | undefined): string {
  return v == null ? "—" : v.toLocaleString("th-TH");
}

export function fmtPct(v: number | null | undefined): string {
  return v == null ? "—" : `${v}%`;
}

/** "YYYY-MM-DD" ➔ "23 ก.ย. 2569" + "วันพุธ" */
export function thaiDay(iso: string): { label: string; weekday: string; short: string } {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return { label: iso, weekday: "", short: iso };
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  const f = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("th-TH", { ...o, timeZone: APP_TIME_ZONE }).format(date);
  return {
    label: f({ day: "numeric", month: "short", year: "numeric" }),
    weekday: f({ weekday: "long" }),
    short: f({ day: "numeric", month: "short" }),
  };
}

/**
 * ป้ายส่วนต่างเทียบช่วงก่อน · `goodWhen="down"` สำหรับตัวเลขที่ยิ่งน้อยยิ่งดี (ข้อผิดพลาด ฯลฯ)
 */
export function Delta({
  cur,
  prev,
  goodWhen = "up",
  prevLabel = "เมื่อวาน",
}: {
  cur: number;
  prev: number;
  goodWhen?: "up" | "down" | "none";
  prevLabel?: string;
}) {
  const { diff, pct } = change(cur, prev);
  if (diff === 0) return <span className="text-muted">เท่ากับ{prevLabel} ({fmt(prev)})</span>;
  const good = goodWhen === "none" ? null : goodWhen === "up" ? diff > 0 : diff < 0;
  const tone = good == null ? "text-ink" : good ? "text-emerald-700" : "text-rose-700";
  const sign = diff > 0 ? "+" : "";
  return (
    <span>
      <span className={`font-semibold ${tone}`}>
        {diff > 0 ? "▲" : "▼"} {sign}
        {pct == null ? fmt(diff) : `${pct}%`}
      </span>
      <span className="text-muted"> จาก{prevLabel} ({fmt(prev)})</span>
    </span>
  );
}

export function StatCard({
  label,
  value,
  sub,
  children,
}: {
  label: string;
  value: string;
  sub?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="altar-card-porcelain p-4">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold font-mono text-ink tabular-nums">{value}</p>
      {sub ? <p className="mt-1 text-xs text-muted">{sub}</p> : null}
      {children}
    </div>
  );
}

/** แถบความคืบหน้าเทียบเพดาน + เส้นบอกเพดานรอง (เช่น เพดานผู้เยี่ยมชม 70%) */
export function Meter({ value, max, marker }: { value: number; max: number; marker?: number }) {
  const w = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const m = marker && max > 0 ? Math.min(100, (marker / max) * 100) : null;
  return (
    <div className="relative mt-3 h-2 w-full rounded-full bg-inset" aria-hidden>
      <span className="block h-full rounded-full bg-gold" style={{ width: `${w}%` }} />
      {m != null ? <span className="absolute -top-1 h-4 w-0.5 bg-ink" style={{ left: `${m}%` }} /> : null}
    </div>
  );
}

export function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
      <h3 className="font-mystic-gold text-sm font-bold text-ink">{title}</h3>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

/** รายการชื่อ–ตัวเลขแบบแถว (ใช้กับหมวด "ปัญหา/ถูกกั้น" ที่อยากเห็นทุกบรรทัดแม้เป็น 0) */
export function KeyValueList({
  items,
  alertWhenPositive = false,
}: {
  items: { label: string; value: number | null; hint?: string }[];
  alertWhenPositive?: boolean;
}) {
  return (
    <ul className="flex flex-col divide-y divide-line text-xs">
      {items.map((it) => (
        <li key={it.label} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
          <span className="text-ink">
            {it.label}
            {it.hint ? <span className="block text-[11px] text-muted">{it.hint}</span> : null}
          </span>
          <span
            className={`shrink-0 font-mono tabular-nums ${
              alertWhenPositive && (it.value ?? 0) > 0 ? "font-semibold text-rose-700" : "text-ink"
            }`}
          >
            {fmt(it.value)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function BarList({
  title,
  rows,
  nameMap,
  empty = "ยังไม่มีข้อมูล",
  limit,
}: {
  title: string;
  rows: CountRow[];
  nameMap?: Record<string, string>;
  empty?: string;
  limit?: number;
}) {
  const total = rows.reduce((s, r) => s + r.count, 0);
  const max = Math.max(1, ...rows.map((r) => r.count));
  const shown = limit ? rows.slice(0, limit) : rows;
  const rest = limit ? rows.slice(limit).reduce((s, r) => s + r.count, 0) : 0;
  return (
    <div className="altar-card-porcelain p-5">
      <SectionTitle title={title} hint={total > 0 ? `รวม ${fmt(total)}` : undefined} />
      {rows.length === 0 ? (
        <p className="mt-3 text-xs text-muted">{empty}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2.5">
          {shown.map((r) => {
            const name = nameMap?.[r.key] ?? r.key;
            return (
              <li key={r.key} className="flex items-center gap-3">
                <span className="w-36 shrink-0 truncate text-xs font-medium text-ink" title={name}>
                  {name}
                </span>
                <span className="h-2 flex-1 rounded-full bg-inset">
                  <span className="block h-full rounded-full bg-gold" style={{ width: `${(r.count / max) * 100}%` }} />
                </span>
                <span className="w-20 shrink-0 text-right text-xs font-mono tabular-nums text-muted">
                  {fmt(r.count)} · {Math.round((r.count / total) * 100)}%
                </span>
              </li>
            );
          })}
          {rest > 0 ? (
            <li className="text-right text-[11px] text-muted">อื่น ๆ อีก {fmt(rest)}</li>
          ) : null}
        </ul>
      )}
    </div>
  );
}
