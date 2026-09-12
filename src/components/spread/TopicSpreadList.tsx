"use client";

import { useState } from "react";
// ลิงก์ภายในต้องอยู่ในต้นไม้ภาษาเดียวกับหน้าที่ผู้ใช้ยืนอยู่ — ดู src/components/ui/LocaleLink.tsx
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import type { Spread, SpreadPosition } from "@/data/spreads-helpers";
import { isStandardSpread } from "@/lib/entitlement/limits";
import { SealedLockIcon } from "@/components/entitlement/EntitlementIcons";
import { renderSpreadIllustration } from "@/components/spread/spread-illustrations";
import { useLocale } from "@/lib/i18n";

interface TopicSpreadListProps {
  spreads: Spread[];
}

export function TopicSpreadList({ spreads }: TopicSpreadListProps) {
  const { isEnglish } = useLocale();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {spreads.map((spread) => {
        const isExpanded = expandedId === spread.id;
        const isStandard = isStandardSpread(spread.id);

        return (
          <div
            key={spread.id}
            className="rounded-2xl border border-line bg-surface p-6 flex flex-col justify-between space-y-4 hover:border-gold transition duration-300 relative overflow-hidden shadow-xs hover:shadow-md"
          >
            {/* Badges */}
            <div className="flex items-center justify-between z-10">
              <span className="text-xs font-mono font-bold text-ink bg-inset px-3 py-1 rounded-full border border-line">
                {spread.positions.length} {isEnglish ? "Cards" : "ใบ"}
              </span>
              {!isStandard ? (
                <span className="text-xs text-gold-ink bg-surface-warm border border-line px-2.5 py-0.5 rounded-full font-serif-th font-semibold flex items-center gap-1">
                  <SealedLockIcon className="w-3 h-3" />
                  <span>{isEnglish ? "Deep Vision" : "ผังญาณลึก"}</span>
                </span>
              ) : (
                <span className="text-xs text-[#5E5240] bg-surface-warm border border-line-soft px-2.5 py-0.5 rounded-full font-serif-th">
                  {isEnglish ? "Free" : "เปิดฟรี"}
                </span>
              )}
            </div>

            {/* Visual Formation */}
            <div className="h-44 flex items-center justify-center my-1 relative select-none rounded-xl bg-[#F7F5F0] border border-line-soft p-2 hover:border-gold/60 transition-colors">
              {renderSpreadIllustration(spread.id)}
            </div>

            {/* Title & Description */}
            <div className="space-y-2 z-10 pt-2 border-t border-line-soft">
              <h2 className="font-serif-th text-lg font-bold text-ink leading-snug">
                {isEnglish ? (spread.nameEn || spread.nameTh) : spread.nameTh}
              </h2>
              <p className="text-xs font-serif-th text-[#7A6F5D] leading-relaxed line-clamp-1">
                {isEnglish ? (spread.taglineEn || spread.tagline) : spread.tagline}
              </p>
              <p className="text-xs font-serif-th text-[#4A4338] leading-relaxed line-clamp-3">
                {isEnglish ? (spread.descriptionEn || spread.description) : spread.description}
              </p>
            </div>

            {/* Positional Breakdown Accordion */}
            <div className="z-10 pt-2 border-t border-line-soft/60 space-y-2">
              <button
                type="button"
                onClick={() => toggleExpand(spread.id)}
                className="tap-overlay-y w-full text-left text-xs font-serif-th text-gold-ink hover:text-[#5E390A] flex items-center justify-between py-1 font-semibold cursor-pointer transition-colors"
                aria-expanded={isExpanded}
              >
                <span>{isEnglish ? `${spread.positions.length} Card Positions` : `ความหมาย ${spread.positions.length} ตำแหน่งไพ่`}</span>
                <span className="text-[11px]">{isExpanded ? (isEnglish ? "▲ Hide" : "▲ ย่อ") : (isEnglish ? "▼ Details" : "▼ ขยาย")}</span>
              </button>

              {isExpanded && (
                <div className="space-y-1.5 pt-2 pb-1 text-xs text-muted bg-surface-warm p-3 rounded-lg border border-line-soft max-h-48 overflow-y-auto">
                  {spread.positions.map((pos: SpreadPosition) => (
                    <div key={pos.index} className="flex items-start gap-2">
                      <span className="font-mono text-gold-ink font-bold shrink-0">
                        {pos.index}.
                      </span>
                      <div>
                        <span className="font-serif-th font-bold text-ink">
                          {isEnglish ? (pos.nameEn || pos.nameTh) : pos.nameTh}
                        </span>
                        <span className="mx-1 text-line">·</span>
                        <span className="font-serif-th text-[11px] text-[#7A6F5D]">
                          {isEnglish ? (pos.meaningEn || pos.meaning) : pos.meaning}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-line-soft z-10">
              <Link
                href={`/?spread=${spread.id}`}
                className="w-full py-2 px-3 text-xs font-serif-th font-bold text-center rounded-lg bg-ink text-surface-warm hover:bg-[#3D382E] transition-colors"
              >
                {isEnglish ? "Begin Reading" : "เริ่มเปิดไพ่"}
              </Link>
              <Link
                href={`/spreads/${spread.id}`}
                className="w-full py-2 px-3 text-xs font-serif-th font-semibold text-center rounded-lg border border-line text-[#4A4338] hover:bg-surface-warm transition-colors"
              >
                {isEnglish ? "Spread Details" : "รายละเอียดผัง"}
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
