"use client";

import React, { useMemo, useState } from "react";
import { CardImage } from "@/components/card/CardImage";
import { deckMeta } from "@/data/cards/deck-index-meta";
import { moodOption } from "@/lib/journal/mood";
import type { SavedReadingItem } from "@/lib/utils/history";
import { dayKeyOf, formatMonth, moonMarker, primaryCard } from "./journal-format";

/**
 * ✦ ปฏิทินสมุดดวง — "หนึ่งเดือนในหน้าไพ่" (REFLECTION_JOURNAL_PLAN 1.3)
 * ช่องวันแสดงภาพย่อไพ่ใบหลักของคำอ่านล่าสุดวันนั้น + จุดสี "ใจตอนนี้" + จันทร์ดับ/เพ็ญ
 * แตะวัน ➔ กรองรายการของวันนั้น (`onPickDay`) · ใช้เวลาไทยเป็นเกณฑ์วัน (เหมือนพิธีประจำวัน)
 * ⚠️ ไม่มี overflow-hidden บนแถวไพ่ — ช่องวันเป็นกริด ภาพย่อพอดีช่อง (กฎเหล็กข้อ 3)
 */
export const JournalCalendar: React.FC<{
  items: SavedReadingItem[];
  isEnglish: boolean;
  onPickDay: (dayKey: string) => void;
}> = ({ items, isEnglish, onPickDay }) => {
  const todayKey = dayKeyOf(new Date());
  const [ym, setYm] = useState(() => {
    const [y, m] = todayKey.split("-").map(Number);
    return { y, m: m - 1 };
  });

  const byDay = useMemo(() => {
    const map = new Map<string, SavedReadingItem[]>();
    for (const r of items) {
      if (r.corrupted) continue;
      const k = dayKeyOf(r.date);
      map.set(k, [...(map.get(k) ?? []), r]);
    }
    return map;
  }, [items]);

  const first = new Date(Date.UTC(ym.y, ym.m, 1));
  const daysInMonth = new Date(Date.UTC(ym.y, ym.m + 1, 0)).getUTCDate();
  const lead = first.getUTCDay(); // 0 = อาทิตย์ (ปฏิทินไทยเริ่มวันอาทิตย์)
  const cells: Array<string | null> = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${ym.y}-${String(ym.m + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`),
  ];
  const monthCount = cells.filter((k) => k && byDay.has(k)).length;
  const weekdays = isEnglish ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] : ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
  const shift = (d: number) =>
    setYm(({ y, m }) => {
      const t = m + d;
      return { y: y + Math.floor(t / 12), m: ((t % 12) + 12) % 12 };
    });

  return (
    <section className="altar-card-porcelain !rounded-2xl p-3 sm:p-6 space-y-4" aria-label={isEnglish ? "Journal calendar" : "ปฏิทินสมุดดวง"}>
      <header className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => shift(-1)}
          aria-label={isEnglish ? "Previous month" : "เดือนก่อน"}
          className="tap-overlay-y w-11 h-11 rounded-full glass-chip text-ink-deep cursor-pointer"
        >
          ←
        </button>
        <div className="text-center">
          <h2 className="font-serif-th text-lg sm:text-xl font-bold text-ink-deep">{formatMonth(ym.y, ym.m, isEnglish)}</h2>
          <p className="text-[11px] sm:text-xs text-muted font-serif-th">
            {isEnglish ? `${monthCount} day${monthCount === 1 ? "" : "s"} with a reading` : `เปิดไพ่ ${monthCount} วันในเดือนนี้`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label={isEnglish ? "Next month" : "เดือนถัดไป"}
          className="tap-overlay-y w-11 h-11 rounded-full glass-chip text-ink-deep cursor-pointer"
        >
          →
        </button>
      </header>

      <div className="grid grid-cols-7 gap-1 sm:gap-2" role="grid">
        {weekdays.map((w) => (
          <div key={w} role="columnheader" className="text-center text-[11px] sm:text-xs font-serif-th text-muted pb-1">
            {w}
          </div>
        ))}
        {cells.map((k, i) => {
          if (!k) return <div key={`b${i}`} role="gridcell" aria-hidden="true" />;
          const day = Number(k.slice(8));
          const list = byDay.get(k) ?? [];
          const latest = list[0];
          const pc = latest ? primaryCard(latest) : undefined;
          const meta = pc ? deckMeta(pc.cardIndex) : undefined;
          const mood = moodOption(latest?.moodAfter ?? latest?.moodBefore);
          const moon = moonMarker(k);
          const isToday = k === todayKey;
          const label = isEnglish
            ? `${day}: ${list.length ? `${list.length} reading${list.length > 1 ? "s" : ""}` : "no reading"}${moon === "full" ? ", full moon" : moon === "new" ? ", new moon" : ""}`
            : `วันที่ ${day}: ${list.length ? `เปิดไพ่ ${list.length} ครั้ง` : "ไม่ได้เปิดไพ่"}${moon === "full" ? " · จันทร์เพ็ญ" : moon === "new" ? " · จันทร์ดับ" : ""}`;
          return (
            <div key={k} role="gridcell">
              <button
                type="button"
                disabled={list.length === 0}
                onClick={() => onPickDay(k)}
                aria-label={label}
                className={`relative w-full aspect-[3/4] rounded-lg border flex flex-col items-center justify-start p-0.5 sm:p-1 transition-colors ${
                  list.length ? "border-line-warm bg-surface/70 hover:border-gold-ink cursor-pointer" : "border-transparent bg-inset-warm/40 cursor-default"
                } ${isToday ? "ring-2 ring-gold-ink/70" : ""}`}
              >
                <span className={`self-start text-[10px] sm:text-xs font-mono leading-none ${list.length ? "text-ink-deep" : "text-muted"}`}>{day}</span>
                {moon && (
                  <span
                    aria-hidden="true"
                    className={`absolute top-1 right-1 w-2 h-2 rounded-full border border-gold-ink ${moon === "full" ? "bg-gold-ink/80" : "bg-transparent"}`}
                  />
                )}
                {meta && (
                  <span className={`mt-0.5 block w-[62%] aspect-[3/5] rounded-[3px] border border-line-warm ${pc?.isReversed ? "rotate-180" : ""}`}>
                    <CardImage cardId={meta.id} alt="" sizes="40px" thumb loading="lazy" className="w-full h-full object-cover rounded-[3px]" />
                  </span>
                )}
                {(mood || list.length > 1) && (
                  <span className="absolute bottom-0.5 inset-x-0.5 flex items-center justify-center gap-0.5">
                    {mood && <span aria-hidden="true" className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full" style={{ backgroundColor: mood.color }} />}
                    {list.length > 1 && <span className="text-[9px] sm:text-[10px] text-muted font-mono">+{list.length - 1}</span>}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] sm:text-xs text-muted font-serif-th text-center">
        {isEnglish
          ? "Card = main card of that day · dot = your mood · gold circle = full moon, outline = new moon"
          : "ภาพไพ่ = ไพ่ใบหลักของวันนั้น · จุดสี = ใจตอนนั้น · วงทองเต็ม = จันทร์เพ็ญ · วงโปร่ง = จันทร์ดับ"}
      </p>
    </section>
  );
};
