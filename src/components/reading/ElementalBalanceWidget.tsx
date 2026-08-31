"use client";

import React, { useMemo } from "react";
import type { TarotCard } from "@/data/cards/types";
import type { DrawnCard } from "@/lib/tarot/shuffle";
import { calculateElementalBalance } from "@/lib/tarot/elements";

interface ElementalBalanceWidgetProps {
  cards: TarotCard[];
  drawn?: DrawnCard[];
}

export const ElementalBalanceWidget: React.FC<ElementalBalanceWidgetProps> = ({ cards, drawn }) => {
  const breakdown = useMemo(() => {
    try {
      return calculateElementalBalance(cards, drawn);
    } catch {
      return null;
    }
  }, [cards, drawn]);

  if (!breakdown) return null;

  return (
    <div className="my-6 rounded-2xl border border-amber-500/20 bg-gradient-to-b from-[#161224]/90 to-[#0c0a14]/95 p-5 shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-amber-500/35">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between border-b border-amber-500/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚖️</span>
          <div>
            <h4 className="font-serif text-sm font-semibold text-amber-200/90 sm:text-base">
              สมดุลพลังงาน 4 ธาตุในผัง (Elemental Dignities)
            </h4>
            <p className="text-xs text-amber-200/50">วิเคราะห์คลื่นพลังงาน ไฟ · น้ำ · ลม · ดิน</p>
          </div>
        </div>
        <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300">
          {breakdown.dominantElement === "สมดุล" ? "✦ สมดุลกลมกลืน" : `ธาตุ${breakdown.dominantElement}เด่น`}
        </span>
      </div>

      {/* Progress Bars */}
      <div className="space-y-2.5">
        {/* Fire */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-orange-300">
              <span>🔥</span> ธาตุไฟ (แพชชัน / งาน / แรงผลักดัน)
            </span>
            <span className="font-mono text-orange-200/80">{breakdown.fire}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-900/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-400 transition-all duration-700 ease-out"
              style={{ width: `${breakdown.fire}%` }}
            />
          </div>
        </div>

        {/* Water */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-cyan-300">
              <span>💧</span> ธาตุน้ำ (อารมณ์ / ความรู้สึก / สัญชาตญาณ)
            </span>
            <span className="font-mono text-cyan-200/80">{breakdown.water}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-900/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-300 transition-all duration-700 ease-out"
              style={{ width: `${breakdown.water}%` }}
            />
          </div>
        </div>

        {/* Air */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-indigo-300">
              <span>🌪️</span> ธาตุลม (ตรรกะ / ความคิด / การตัดสินใจ)
            </span>
            <span className="font-mono text-indigo-200/80">{breakdown.air}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-900/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-purple-500 to-sky-300 transition-all duration-700 ease-out"
              style={{ width: `${breakdown.air}%` }}
            />
          </div>
        </div>

        {/* Earth */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-emerald-300">
              <span>🌍</span> ธาตุดิน (การเงิน / ทรัพย์สิน / ความมั่นคง)
            </span>
            <span className="font-mono text-emerald-200/80">{breakdown.earth}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-900/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-700 via-teal-600 to-green-400 transition-all duration-700 ease-out"
              style={{ width: `${breakdown.earth}%` }}
            />
          </div>
        </div>
      </div>

      {/* Dominant & Balancing Advice */}
      <div className="mt-4 rounded-xl border border-amber-500/15 bg-black/40 p-3.5 text-xs text-amber-100/80">
        <p className="font-medium text-amber-200">
          ✦ {breakdown.dominantTitleTh}:
        </p>
        <p className="mt-1 text-amber-200/70">{breakdown.dominantInsightTh}</p>
        <p className="mt-2 text-amber-300/90">
          💡 <span className="font-medium">วิธีปรับสมดุล:</span> {breakdown.balancingAdviceTh}
        </p>
      </div>
    </div>
  );
};
