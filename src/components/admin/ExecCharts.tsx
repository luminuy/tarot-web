"use client";

/**
 * 📈 กราฟของแดชบอร์ดผู้บริหาร — SVG ล้วน ไม่ลากไลบรารีกราฟเข้าบันเดิล
 * ---------------------------------------------------------------------------
 * ทำตามแนวทาง dataviz: เส้นบาง 2px · แท่งปลายมน 4px ชิดฐาน · ช่องว่างระหว่างแท่ง 2px
 * · กริดจาง · ชี้แล้วมีเส้นตั้ง + กล่องค่าทุกชุดข้อมูล · แป้นลูกศรเลื่อนดูได้ · มีมุมมองตารางทุกกราฟ
 * · สีมาจากโทเคน `--viz-*` ใน admin-theme.css เท่านั้น (ด่าน test-palette-drift)
 * · ห้ามสองแกน Y — ตัวเลขต่างหน่วยให้แยกกราฟ
 */

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from "react";

import { fmt, thaiDay } from "@/components/admin/StatsWidgets";

export interface Series {
  key: string;
  label: string;
  /** โทเคนสี เช่น `var(--viz-1)` */
  color: string;
  values: number[];
}

/** ความกว้างจริงของกล่อง — กราฟวาดตามพิกเซลจริง ตัวหนังสือจึงไม่ยืดตาม viewBox */
function useWidth<T extends HTMLElement>(): [RefObject<T | null>, number] {
  const ref = useRef<T | null>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.floor(e.contentRect.width)));
    ro.observe(el);
    setW(Math.floor(el.getBoundingClientRect().width));
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/** เพดานแกน Y ที่อ่านง่าย (1 · 2 · 5 × 10ⁿ) + ขั้นของเส้นกริด */
function niceScale(max: number, ticks = 4): { top: number; step: number } {
  if (max <= 0) return { top: 4, step: 1 };
  const raw = max / ticks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  return { top: step * Math.ceil(max / step), step };
}

const compact = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 10_000 ? `${Math.round(n / 1000)}k` : fmt(n);

/** ป้ายแกน X — กระจายเท่า ๆ กัน รวมวันแรกและวันสุดท้าย · ป้ายละอย่างน้อย ~64px (จอมือถือไม่ชนกัน) */
function xTickIndexes(n: number, plotWidth: number): number[] {
  if (n <= 1) return [0];
  const count = Math.max(2, Math.min(6, n, Math.floor(plotWidth / 64)));
  return Array.from(new Set(Array.from({ length: count }, (_, i) => Math.round((i * (n - 1)) / (count - 1)))));
}

function useIndexKeys(n: number, index: number | null, setIndex: (i: number | null) => void) {
  return (e: KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const cur = index ?? (e.key === "ArrowLeft" ? n : -1);
    setIndex(Math.max(0, Math.min(n - 1, cur + (e.key === "ArrowRight" ? 1 : -1))));
  };
}

function Tooltip({ x, width, title, rows }: { x: number; width: number; title: string; rows: { color: string; label: string; value: string }[] }) {
  const left = Math.min(Math.max(x - 80, 0), Math.max(0, width - 168));
  return (
    <div
      role="status"
      className="pointer-events-none absolute top-1 z-10 w-[168px] rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-sm"
      style={{ left }}
    >
      <p className="mb-1 text-[11px] text-muted">{title}</p>
      {rows.map((r) => (
        <p key={r.label} className="flex items-center gap-2">
          <span className="inline-block h-0.5 w-3 shrink-0 rounded" style={{ background: r.color }} aria-hidden />
          <span className="font-mono font-semibold tabular-nums text-ink">{r.value}</span>
          <span className="truncate text-muted">{r.label}</span>
        </p>
      ))}
    </div>
  );
}

/** กราฟเส้นแนวโน้มรายวัน (≤ 3 ชุด · แกนเดียว) */
export function TrendChart({
  days,
  series,
  height = 220,
  format = fmt,
}: {
  days: string[];
  series: Series[];
  height?: number;
  format?: (n: number) => string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [index, setIndex] = useState<number | null>(null);
  const pad = { top: 12, right: 12, bottom: 26, left: 40 };
  const innerW = Math.max(0, width - pad.left - pad.right);
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(0, ...series.flatMap((s) => s.values));
  const { top, step } = niceScale(max);
  const n = days.length;
  const x = (i: number) => pad.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => pad.top + innerH - (v / top) * innerH;
  const onKey = useIndexKeys(n, index, setIndex);

  const pickIndex = (clientX: number, rectLeft: number) => {
    if (n === 0 || innerW <= 0) return;
    const rel = clientX - rectLeft - pad.left;
    setIndex(Math.max(0, Math.min(n - 1, Math.round(n <= 1 ? 0 : (rel / innerW) * (n - 1)))));
  };

  return (
    <div ref={ref} className="relative w-full">
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`กราฟเส้น ${series.map((s) => s.label).join(" และ ")} รายวัน`}
          tabIndex={0}
          onKeyDown={onKey}
          onPointerMove={(e) => pickIndex(e.clientX, e.currentTarget.getBoundingClientRect().left)}
          onPointerLeave={() => setIndex(null)}
          onBlur={() => setIndex(null)}
          className="block touch-pan-y outline-none focus-visible:ring-2 focus-visible:ring-ink/30 rounded"
        >
          {Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step).map((v) => (
            <g key={v}>
              <line x1={pad.left} x2={width - pad.right} y1={y(v)} y2={y(v)} stroke="var(--viz-grid)" strokeWidth={1} />
              <text x={pad.left - 6} y={y(v) + 4} textAnchor="end" fontSize={11} fill="var(--viz-axis)">
                {compact(v)}
              </text>
            </g>
          ))}
          {xTickIndexes(n, innerW).map((i) => (
            <text key={i} x={x(i)} y={height - 6} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} fontSize={11} fill="var(--viz-axis)">
              {thaiDay(days[i]).short}
            </text>
          ))}
          {series.map((s) => (
            <polyline
              key={s.key}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
            />
          ))}
          {index != null && (
            <g>
              <line x1={x(index)} x2={x(index)} y1={pad.top} y2={pad.top + innerH} stroke="var(--viz-axis)" strokeWidth={1} />
              {series.map((s) => (
                <circle key={s.key} cx={x(index)} cy={y(s.values[index] ?? 0)} r={4} fill={s.color} stroke="#ffffff" strokeWidth={2} />
              ))}
            </g>
          )}
        </svg>
      )}
      {index != null && width > 0 && (
        <Tooltip
          x={x(index)}
          width={width}
          title={`${thaiDay(days[index]).label} · ${thaiDay(days[index]).weekday}`}
          rows={series.map((s) => ({ color: s.color, label: s.label, value: format(s.values[index] ?? 0) }))}
        />
      )}
      <Legend items={series.map((s) => ({ color: s.color, label: s.label, kind: "line" as const }))} />
    </div>
  );
}

/** กราฟแท่งรายวัน (ชุดเดียว) — ชี้ที่แท่งเพื่อดูค่า */
export function DailyBars({
  days,
  values,
  label,
  color = "var(--viz-1)",
  height = 180,
  format = fmt,
}: {
  days: string[];
  values: number[];
  label: string;
  color?: string;
  height?: number;
  format?: (n: number) => string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [index, setIndex] = useState<number | null>(null);
  const pad = { top: 10, right: 8, bottom: 26, left: 40 };
  const innerW = Math.max(0, width - pad.left - pad.right);
  const innerH = height - pad.top - pad.bottom;
  const { top, step } = niceScale(Math.max(0, ...values));
  const n = values.length;
  const slot = n > 0 ? innerW / n : 0;
  const barW = Math.max(1, slot - 2);
  const y = (v: number) => pad.top + innerH - (v / top) * innerH;
  const onKey = useIndexKeys(n, index, setIndex);
  const r = Math.min(4, barW / 2);

  return (
    <div ref={ref} className="relative w-full">
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`กราฟแท่ง ${label} รายวัน`}
          tabIndex={0}
          onKeyDown={onKey}
          onPointerLeave={() => setIndex(null)}
          onBlur={() => setIndex(null)}
          className="block touch-pan-y outline-none focus-visible:ring-2 focus-visible:ring-ink/30 rounded"
        >
          {Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step).map((v) => (
            <g key={v}>
              <line x1={pad.left} x2={width - pad.right} y1={y(v)} y2={y(v)} stroke="var(--viz-grid)" strokeWidth={1} />
              <text x={pad.left - 6} y={y(v) + 4} textAnchor="end" fontSize={11} fill="var(--viz-axis)">
                {compact(v)}
              </text>
            </g>
          ))}
          {values.map((v, i) => {
            const bx = pad.left + i * slot + 1;
            const by = y(v);
            const h = pad.top + innerH - by;
            return (
              <g key={days[i]} onPointerEnter={() => setIndex(i)}>
                {/* พื้นที่ชี้กว้างเต็มช่อง ไม่ใช่แค่ตัวแท่ง */}
                <rect x={pad.left + i * slot} y={pad.top} width={slot} height={innerH} fill="transparent" />
                {h > 0 && (
                  <path
                    d={`M${bx},${by + h} V${by + Math.min(r, h)} Q${bx},${by} ${bx + r},${by} H${bx + barW - r} Q${bx + barW},${by} ${bx + barW},${by + Math.min(r, h)} V${by + h} Z`}
                    fill={color}
                    opacity={index == null || index === i ? 1 : 0.55}
                  />
                )}
              </g>
            );
          })}
          {xTickIndexes(n, innerW).map((i) => (
            <text key={i} x={pad.left + i * slot + slot / 2} y={height - 6} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} fontSize={11} fill="var(--viz-axis)">
              {thaiDay(days[i]).short}
            </text>
          ))}
        </svg>
      )}
      {index != null && width > 0 && (
        <Tooltip
          x={pad.left + index * slot + slot / 2}
          width={width}
          title={`${thaiDay(days[index]).label} · ${thaiDay(days[index]).weekday}`}
          rows={[{ color, label, value: format(values[index] ?? 0) }]}
        />
      )}
    </div>
  );
}

/** เส้นเล็กในการ์ดตัวเลข — ประดับให้เห็นทิศทาง ค่าจริงอยู่ในตัวเลขและกราฟหลัก */
export function Sparkline({ values, color = "var(--viz-1)" }: { values: number[]; color?: string }) {
  const w = 120;
  const h = 28;
  if (values.length < 2) return null;
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - 2 - (v / max) * (h - 4)}`).join(" ");
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden className="mt-2 block">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

const ORDINAL = ["var(--viz-ord-1)", "var(--viz-ord-2)", "var(--viz-ord-3)", "var(--viz-ord-4)"];

/** ขั้นตอนจากเริ่มถึงจ่ายเงิน — แท่งแนวนอนไล่ฟ้าอ่อนไปเข้ม · ป้ายค่าและสัดส่วนเทียบขั้นแรกอยู่ข้างแท่งเสมอ */
export function FunnelChart({ steps }: { steps: { label: string; value: number; hint?: string }[] }) {
  const first = steps[0]?.value ?? 0;
  const max = Math.max(1, ...steps.map((s) => s.value));
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((s, i) => {
        const prev = i > 0 ? steps[i - 1].value : null;
        return (
          <li key={s.label} className="grid grid-cols-[minmax(7rem,9rem)_1fr] items-center gap-3 sm:grid-cols-[11rem_1fr]">
            <span className="text-xs text-ink">
              {s.label}
              {s.hint ? <span className="block text-[11px] text-muted">{s.hint}</span> : null}
            </span>
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-5 min-w-0 flex-1">
                <span
                  className="block h-full rounded-r"
                  style={{ width: `${(s.value / max) * 100}%`, minWidth: s.value > 0 ? 3 : 0, background: ORDINAL[Math.min(i, ORDINAL.length - 1)] }}
                />
              </span>
              <span className="w-28 shrink-0 text-right text-xs tabular-nums">
                <span className="font-mono font-semibold text-ink">{fmt(s.value)}</span>
                <span className="text-muted">
                  {" "}
                  {i === 0 ? "" : first > 0 ? `${Math.round((s.value / first) * 100)}%` : "—"}
                </span>
                {prev != null && prev > 0 ? (
                  <span className="block text-[11px] text-muted">จากขั้นก่อน {Math.round((s.value / prev) * 100)}%</span>
                ) : null}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Legend({ items }: { items: { color: string; label: string; kind: "line" | "box" }[] }) {
  if (items.length < 2) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className={it.kind === "line" ? "inline-block h-0.5 w-4 rounded" : "inline-block h-2.5 w-2.5 rounded-sm"}
            style={{ background: it.color }}
          />
          {it.label}
        </li>
      ))}
    </ul>
  );
}

/** กรอบกราฟ: หัวเรื่อง + ปุ่มสลับดูเป็นตาราง (ทุกค่าที่กราฟแสดงต้องอ่านได้โดยไม่ต้องชี้) */
export function ChartCard({
  title,
  hint,
  table,
  children,
}: {
  title: string;
  hint?: string;
  table?: { headers: string[]; rows: (string | number)[][] };
  children: ReactNode;
}) {
  const [asTable, setAsTable] = useState(false);
  return (
    <section className="altar-card-porcelain p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-ink">{title}</h3>
          {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
        </div>
        {table ? (
          <button
            type="button"
            onClick={() => setAsTable((v) => !v)}
            aria-pressed={asTable}
            className="tap-overlay-y rounded-md border border-line bg-white px-2.5 py-1 text-xs text-muted hover:text-ink"
          >
            {asTable ? "ดูเป็นกราฟ" : "ดูเป็นตาราง"}
          </button>
        ) : null}
      </div>
      {asTable && table ? <DataTable headers={table.headers} rows={table.rows} /> : children}
    </section>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="max-h-72 overflow-auto rounded-lg border border-line">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-canvas text-muted">
          <tr>
            {headers.map((h, i) => (
              <th key={h} scope="col" className={`px-3 py-2 font-semibold ${i === 0 ? "text-left" : "text-right"}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, ci) => (
                <td key={ci} className={`px-3 py-1.5 ${ci === 0 ? "text-left text-ink" : "text-right font-mono tabular-nums text-ink"}`}>
                  {typeof c === "number" ? fmt(c) : c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
