"use client";

import { useState } from "react";
import Link from "next/link";
import type { Spread, SpreadPosition } from "@/data/spreads";
import { isStandardSpread } from "@/lib/entitlement/limits";
import { SealedLockIcon } from "@/components/entitlement/EntitlementIcons";
import { renderSpreadIllustration } from "@/components/spread/SpreadCardSelector";

interface TopicSpreadListProps {
  spreads: Spread[];
}

export function TopicSpreadList({ spreads }: TopicSpreadListProps) {
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
            className="rounded-2xl border border-[#D5CEC2] bg-[#FFFFFF] p-6 flex flex-col justify-between space-y-4 hover:border-[#A58A5C] transition-all duration-300 relative overflow-hidden shadow-xs hover:shadow-md"
          >
            {/* Badges */}
            <div className="flex items-center justify-between z-10">
              <span className="text-xs font-mono font-bold text-[#29261F] bg-[#EAE7E0] px-3 py-1 rounded-full border border-[#D5CEC2]">
                {spread.positions.length} ใบ
              </span>
              {!isStandard ? (
                <span className="text-xs text-[#A58A5C] bg-[#FAF8F5] border border-[#D5CEC2] px-2.5 py-0.5 rounded-full font-serif-th font-semibold flex items-center gap-1">
                  <SealedLockIcon className="w-3 h-3" />
                  <span>ผังญาณลึก</span>
                </span>
              ) : (
                <span className="text-xs text-[#5E5240] bg-[#FAF8F5] border border-[#E8E2D8] px-2.5 py-0.5 rounded-full font-serif-th">
                  เปิดฟรี
                </span>
              )}
            </div>

            {/* Visual Formation */}
            <div className="h-44 flex items-center justify-center my-1 relative select-none rounded-xl bg-[#F7F5F0] border border-[#E8E2D8] p-2 hover:border-[#A58A5C]/60 transition-colors">
              {renderSpreadIllustration(spread.id)}
            </div>

            {/* Title & Description */}
            <div className="space-y-2 z-10 pt-2 border-t border-[#E8E2D8]">
              <h2 className="font-serif-th text-lg font-bold text-[#29261F] leading-snug">
                {spread.nameTh}
              </h2>
              <p className="text-xs font-serif-th text-[#7A6F5D] leading-relaxed line-clamp-1">
                {spread.tagline}
              </p>
              <p className="text-xs font-serif-th text-[#4A4338] leading-relaxed line-clamp-3">
                {spread.description}
              </p>
            </div>

            {/* Positional Breakdown Accordion */}
            <div className="z-10 pt-2 border-t border-[#E8E2D8]/60 space-y-2">
              <button
                type="button"
                onClick={() => toggleExpand(spread.id)}
                className="w-full text-left text-xs font-serif-th text-[#8F5C1A] hover:text-[#5E390A] flex items-center justify-between py-1 font-semibold cursor-pointer transition-colors"
                aria-expanded={isExpanded}
              >
                <span>ความหมาย {spread.positions.length} ตำแหน่งไพ่</span>
                <span className="text-[11px]">{isExpanded ? "▲ ย่อ" : "▼ ขยาย"}</span>
              </button>

              {isExpanded && (
                <div className="space-y-1.5 pt-2 pb-1 text-xs text-[#635B4E] bg-[#FAF8F5] p-3 rounded-lg border border-[#E8E2D8] max-h-48 overflow-y-auto">
                  {spread.positions.map((pos: SpreadPosition) => (
                    <div key={pos.index} className="flex items-start gap-2">
                      <span className="font-mono text-[#8F5C1A] font-bold shrink-0">
                        {pos.index}.
                      </span>
                      <div>
                        <span className="font-serif-th font-bold text-[#29261F]">
                          {pos.nameTh}
                        </span>
                        <span className="mx-1 text-[#D5CEC2]">·</span>
                        <span className="font-serif-th text-[11px] text-[#7A6F5D]">
                          {pos.meaning}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#E8E2D8] z-10">
              <Link
                href={`/?spread=${spread.id}`}
                className="w-full py-2 px-3 text-xs font-serif-th font-bold text-center rounded-lg bg-[#29261F] text-[#FAF8F5] hover:bg-[#3D382E] transition-colors"
              >
                เริ่มเปิดไพ่
              </Link>
              <Link
                href={`/spreads/${spread.id}`}
                className="w-full py-2 px-3 text-xs font-serif-th font-semibold text-center rounded-lg border border-[#D5CEC2] text-[#4A4338] hover:bg-[#FAF8F5] transition-colors"
              >
                รายละเอียดผัง
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
