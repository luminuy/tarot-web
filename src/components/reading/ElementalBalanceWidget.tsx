"use client";

import React, { useMemo } from "react";
import { motion } from "motion/react";
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
    <div className="my-6 rounded-2xl border border-[#D6B48D] bg-[#FCF0E6] p-5 shadow-xs transition-all duration-300">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between border-b border-[#D6B48D]/30 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#CD9F5B]">✦</span>
          <div>
            <h4 className="font-serif-th text-sm font-bold text-[#5A432F] sm:text-base">
              สมดุลพลังงาน 4 ธาตุในผัง (Elemental Dignities)
            </h4>
            <p className="text-xs text-[#8C735D]">วิเคราะห์คลื่นพลังงาน ไฟ · น้ำ · ลม · ดิน</p>
          </div>
        </div>
        <span className="rounded-full border border-[#D6B48D] bg-[#FDF7F0] px-2.5 py-1 text-xs font-bold text-[#CD9F5B] shadow-xs">
          {breakdown.dominantElement === "สมดุล" ? "✦ สมดุลกลมกลืน" : `ธาตุ${breakdown.dominantElement}เด่น`}
        </span>
      </div>

      {/* Progress Bars with scaleX animation for compositor perf */}
      <div className="space-y-2.5">
        {/* Fire */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1.5 font-bold text-[#A04515]">
              <span className="text-xs text-[#A04515]">✦</span> ธาตุไฟ (แพชชัน / งาน / แรงผลักดัน)
            </span>
            <span className="font-mono font-bold text-[#5A432F]">{breakdown.fire}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#FDF7F0] border border-[#D6B48D]/40">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: breakdown.fire / 100 }}
              style={{ transformOrigin: "left" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="h-full w-full rounded-full bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-400"
            />
          </div>
        </div>

        {/* Water */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1.5 font-bold text-[#1B5E80]">
              <span className="text-xs text-[#1B5E80]">✦</span> ธาตุน้ำ (อารมณ์ / ความรู้สึก / สัญชาตญาณ)
            </span>
            <span className="font-mono font-bold text-[#5A432F]">{breakdown.water}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#FDF7F0] border border-[#D6B48D]/40">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: breakdown.water / 100 }}
              style={{ transformOrigin: "left" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
              className="h-full w-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400"
            />
          </div>
        </div>

        {/* Air */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1.5 font-bold text-[#4A3B82]">
              <span className="text-xs text-[#4A3B82]">✦</span> ธาตุลม (ตรรกะ / ความคิด / การตัดสินใจ)
            </span>
            <span className="font-mono font-bold text-[#5A432F]">{breakdown.air}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#FDF7F0] border border-[#D6B48D]/40">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: breakdown.air / 100 }}
              style={{ transformOrigin: "left" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.16 }}
              className="h-full w-full rounded-full bg-gradient-to-r from-indigo-600 via-purple-500 to-sky-400"
            />
          </div>
        </div>

        {/* Earth */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1.5 font-bold text-[#2D5A27]">
              <span className="text-xs text-[#2D5A27]">✦</span> ธาตุดิน (การเงิน / ทรัพย์สิน / ความมั่นคง)
            </span>
            <span className="font-mono font-bold text-[#5A432F]">{breakdown.earth}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#FDF7F0] border border-[#D6B48D]/40">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: breakdown.earth / 100 }}
              style={{ transformOrigin: "left" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.24 }}
              className="h-full w-full rounded-full bg-gradient-to-r from-emerald-700 via-teal-600 to-green-500"
            />
          </div>
        </div>
      </div>

      {/* Dominant & Balancing Advice */}
      <div className="mt-4 rounded-xl border border-[#D6B48D] bg-[#FDF7F0] p-3.5 text-xs text-[#5A432F] shadow-xs">
        <p className="font-serif-th font-bold text-[#CD9F5B]">
          ✦ {breakdown.dominantTitleTh}:
        </p>
        <p className="mt-1 text-[#5A432F] leading-relaxed font-serif-th">{breakdown.dominantInsightTh}</p>
        <p className="mt-2 text-[#8C735D] font-serif-th">
          <span className="text-[#CD9F5B]">✨</span> <span className="font-bold text-[#5A432F]">วิธีปรับสมดุล:</span> {breakdown.balancingAdviceTh}
        </p>
      </div>
    </div>
  );
};
