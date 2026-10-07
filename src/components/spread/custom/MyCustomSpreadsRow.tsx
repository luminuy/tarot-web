"use client";

import React, { useEffect, useState } from "react";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { loadMySpreads, type CustomSpreadDef, type MyCustomSpread } from "@/lib/tarot/custom-spread-client";
import { SpreadLayoutGlyph } from "./SpreadLayoutGlyph";

/**
 * ✦ "ผังของฉัน" ในขั้นเลือกผังของพิธีเปิดไพ่ (REFLECTION_JOURNAL_PLAN 1.8)
 * สมาชิก = ผังในบัญชี · ผู้เยี่ยมชม = ผังในเครื่อง · ยังไม่มีผัง = ปุ่มชวนสร้างปุ่มเดียว (ไม่กินที่หน้าแรก)
 * แถวห่อบรรทัดได้ ไม่ตัดขอบ/ไม่เลื่อนแนวนอน (กฎเหล็กข้อ 3)
 * โหลดแบบ lazy จาก `TarotFlow` — ไม่เพิ่มน้ำหนักบันเดิลหน้าแรกจนกว่าจะถึงขั้นเลือกผัง
 */
const MyCustomSpreadsRow: React.FC<{
  isEnglish: boolean;
  selectedName: string | null;
  onPick: (def: CustomSpreadDef) => void;
}> = ({ isEnglish, selectedName, onPick }) => {
  const [spreads, setSpreads] = useState<MyCustomSpread[] | null>(null);

  useEffect(() => {
    let alive = true;
    void loadMySpreads().then((r) => alive && setSpreads(r.spreads));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section aria-label={isEnglish ? "My spreads" : "ผังของฉัน"} className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-serif-th text-sm sm:text-base text-ink-deep">{isEnglish ? "My spreads" : "ผังของฉัน"}</h3>
        <Link href="/spreads/create" className="tap-overlay-y min-h-[44px] inline-flex items-center text-xs sm:text-sm font-serif-th text-gold-ink font-semibold underline underline-offset-2">
          {isEnglish ? "Design a spread" : "ออกแบบผังเอง"}
        </Link>
      </div>
      {spreads && spreads.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {spreads.map((s) => {
            const active = selectedName === s.name;
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={active}
                onClick={() => onPick({ name: s.name, layout: s.layout, positions: s.positions, ...(s.local ? {} : { savedId: s.id }) })}
                className={`tap-overlay-y min-h-[44px] inline-flex items-center gap-2 pl-2 pr-4 rounded-full text-sm font-serif-th text-ink-deep ${
                  active ? "btn-gold-glass font-bold" : "glass-chip"
                }`}
              >
                <SpreadLayoutGlyph layout={s.layout} count={s.positions.length} size={30} className="text-ink-deep shrink-0" />
                <span className="max-w-[12rem] truncate">{s.name}</span>
                <span className="text-[11px] text-muted">{isEnglish ? `${s.positions.length} cards` : `${s.positions.length} ใบ`}</span>
              </button>
            );
          })}
        </div>
      ) : spreads ? (
        <p className="text-xs sm:text-sm text-muted font-serif-th leading-relaxed">
          {isEnglish
            ? "Ask exactly what you want to ask — build a 1–7 card spread from positions written by our readers."
            : "อยากถามแบบที่ใจคิดจริง ๆ ลองสร้างผัง 1–7 ใบจากคลังตำแหน่งที่แม่หมอเขียนไว้ให้"}
        </p>
      ) : null}
    </section>
  );
};

export default MyCustomSpreadsRow;
