"use client";

import React, { useMemo, useState } from "react";
import { CardImage } from "@/components/card/CardImage";
import type { ExplainResponse } from "@/lib/tarot/explain-types";

/**
 * ✦ แผนภาพความเชื่อมโยง — "กลุ่มดาวของผังไพ่" (REFLECTION_JOURNAL_PLAN 1.1)
 * ---------------------------------------------------------------------------
 * วางไพ่ตามพิกัดจริงของผัง (`SpreadPosition.x/y` 0–1) แล้วลากเส้นระหว่างคู่ที่คำนวณได้
 *   ทอง = เสริมกัน · แดงอิฐ = ดึงกันคนละทาง · เส้นประ = สะท้อนเรื่องเดียวกัน
 * ผัง ≥ 7 ใบแสดงแค่ 3 เส้นที่แรงที่สุด (รายการเต็มอยู่ใต้ภาพ) กันภาพรก
 *
 * ทำไมไม่วาดทับผังไพ่จริง (`SpreadBoard`): ผังจริงตัดบรรทัด/เป็นรางเลื่อนบนมือถือ ตำแหน่งไพ่ขยับตามจอ
 * เส้นที่ลากทับจะชี้ผิดใบ — ภาพนี้เป็นผืนผ้าใบของตัวเอง (Unified Canvas) สัดส่วนคงที่ ไม่มีอะไรล้นหรือถูกตัด
 * ⚠️ ภาพไพ่ผ่าน `<CardImage>` เสมอ (กฎเหล็กข้อ 8) — จึงวางเป็นกล่อง HTML ซ้อนบนชั้นเส้น SVG
 * ♿ เส้นแต่ละเส้นเป็นปุ่ม (โฟกัสด้วยคีย์บอร์ดได้) — เลือกแล้วคำอธิบายขึ้นใต้ภาพใน live region
 */

const KIND_STROKE = {
  support: "var(--color-gold-ink)",
  tension: "var(--color-err)",
  echo: "var(--color-muted)",
} as const;

export const RelationsConstellation: React.FC<{
  data: ExplainResponse;
  layout: Array<{ order: number; x: number; y: number }>;
  isEnglish: boolean;
}> = ({ data, layout, isEnglish }) => {
  const [active, setActive] = useState<string | null>(null);
  const n = layout.length;
  const pairs = n >= 7 ? data.relations.pairs.slice(0, 3) : data.relations.pairs;

  // ปรับพิกัดให้เต็มกรอบ (ผังส่วนใหญ่ใช้แค่บางช่วงของ 0–1) แล้วเว้นขอบให้ภาพไพ่ไม่ล้น
  const pts = useMemo(() => {
    const xs = layout.map((p) => p.x);
    const ys = layout.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;
    const map = new Map<number, { x: number; y: number }>();
    for (const p of layout) {
      map.set(p.order, {
        x: maxX === minX ? 50 : 12 + ((p.x - minX) / spanX) * 76,
        y: maxY === minY ? 50 : 16 + ((p.y - minY) / spanY) * 68,
      });
    }
    return map;
  }, [layout]);

  if (n < 2) return null;
  const card = (order: number) => data.cards.find((c) => c.order === order);
  const activePair = pairs.find((p) => `${p.a}-${p.b}` === active);

  return (
    <figure className="space-y-2 m-0">
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] rounded-xl bg-inset-warm/50 border border-line-warm">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" aria-hidden={pairs.length === 0}>
          {pairs.map((p) => {
            const a = pts.get(p.a);
            const b = pts.get(p.b);
            if (!a || !b) return null;
            const key = `${p.a}-${p.b}`;
            const on = active === key;
            const label = `${card(p.a)?.name ?? ""} + ${card(p.b)?.name ?? ""}: ${p.note}`;
            return (
              <g key={key}>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={KIND_STROKE[p.kind]}
                  strokeWidth={on ? 3 : 1.6 + p.strength * 0.4}
                  strokeDasharray={p.kind === "echo" ? "3 2.5" : undefined}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  opacity={active && !on ? 0.35 : 0.9}
                />
                {/* เส้นล่องหนหนา ๆ ให้แตะง่ายบนมือถือ */}
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="transparent"
                  strokeWidth={14}
                  vectorEffect="non-scaling-stroke"
                  role="button"
                  tabIndex={0}
                  aria-label={label}
                  aria-pressed={on}
                  className="cursor-pointer focus:outline-none"
                  onClick={() => setActive(on ? null : key)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActive(on ? null : key);
                    }
                  }}
                >
                  <title>{label}</title>
                </line>
              </g>
            );
          })}
        </svg>
        {layout.map((p) => {
          const pt = pts.get(p.order)!;
          const c = card(p.order);
          if (!c) return null;
          return (
            <div
              key={p.order}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
              style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
            >
              <span className={`block w-8 h-[54px] sm:w-10 sm:h-[68px] rounded-[4px] border border-line-warm shadow-sm bg-surface ${c.isReversed ? "rotate-180" : ""}`}>
                <CardImage cardId={c.cardId} alt="" sizes="40px" thumb loading="lazy" className="w-full h-full object-cover rounded-[4px]" />
              </span>
              <span className="mt-0.5 text-[9px] sm:text-[10px] font-mono text-gold-ink font-semibold bg-surface/90 px-1 rounded">{p.order + 1}</span>
            </div>
          );
        })}
      </div>
      <figcaption className="text-[11px] sm:text-xs font-serif-th text-ink-deep min-h-[2.5em]" aria-live="polite">
        {activePair ? (
          <>
            <span className="font-semibold">
              {card(activePair.a)?.position.name} + {card(activePair.b)?.position.name}
            </span>
            {" — "}
            {activePair.note}
          </>
        ) : (
          <span className="text-muted">
            {pairs.length === 0
              ? isEnglish
                ? "No strong links to draw in this spread."
                : "ผังนี้ไม่มีเส้นเชื่อมที่เด่นชัด"
              : isEnglish
                ? `Tap a line to see why those cards connect${n >= 7 ? " · showing the 3 strongest" : ""} · gold = support · red = tension · dashed = echo`
                : `แตะเส้นเพื่อดูว่าไพ่คู่นั้นเชื่อมกันอย่างไร${n >= 7 ? " · แสดง 3 เส้นที่แรงที่สุด" : ""} · ทอง = เสริมกัน · แดง = ดึงคนละทาง · ประ = สะท้อนกัน`}
          </span>
        )}
      </figcaption>
    </figure>
  );
};
