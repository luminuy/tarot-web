"use client";

import React, { useMemo } from "react";
import { motion } from "motion/react";
import type { TarotCard } from "@/data/cards/types";
import type { DrawnCard } from "@/lib/tarot/shuffle";
import { calculateElementalBalance } from "@/lib/tarot/elements";
import { useLocale } from "@/lib/i18n";

interface ElementalBalanceWidgetProps {
  cards: TarotCard[];
  drawn?: DrawnCard[];
}

export const ElementalBalanceWidget: React.FC<ElementalBalanceWidgetProps> = ({ cards, drawn }) => {
  const { isEnglish } = useLocale();
  const breakdown = useMemo(() => {
    try {
      return calculateElementalBalance(cards, drawn);
    } catch {
      return null;
    }
  }, [cards, drawn]);

  if (!breakdown) return null;

  const dominantPill = isEnglish
    ? breakdown.dominantElement === "สมดุล"
      ? "✦ Balanced Harmony"
      : `${breakdown.dominantElement === "ไฟ" ? "Fire" : breakdown.dominantElement === "น้ำ" ? "Water" : breakdown.dominantElement === "ลม" ? "Air" : "Earth"} Dominant`
    : breakdown.dominantElement === "สมดุล"
      ? "✦ สมดุลกลมกลืน"
      : `ธาตุ${breakdown.dominantElement}เด่น`;

  return (
    <div className="my-6 rounded-lg border border-[#D9C8AC] bg-[#F3EDE2] p-5 transition-all duration-300">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between border-b border-[#D9C8AC]/30 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#8F5C1A]">✦</span>
          <div>
            <h4 className="font-serif-th text-sm font-bold text-[#2E211A] sm:text-base">
              {isEnglish ? "Elemental Balance & Dignities" : "สมดุลพลังงาน 4 ธาตุในผัง (Elemental Dignities)"}
            </h4>
            <p className="text-xs text-[#635B4E]">
              {isEnglish ? "Energy current analysis: Fire · Water · Air · Earth" : "วิเคราะห์คลื่นพลังงาน ไฟ · น้ำ · ลม · ดิน"}
            </p>
          </div>
        </div>
        <span className="rounded-full border border-[#D9C8AC] bg-[#FFFFFF] px-2.5 py-1 text-xs font-bold text-[#8F5C1A] ">
          {dominantPill}
        </span>
      </div>

      {/* Progress Bars with scaleX animation for compositor perf */}
      <div className="space-y-2.5">
        {/* Fire */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1.5 font-bold text-[#2E211A]">
              <span className="text-xs text-[#8F5C1A]">✦</span>{" "}
              {isEnglish ? "Fire (Passion / Action / Creative Will)" : "ธาตุไฟ (แพชชัน / งาน / แรงผลักดัน)"}
            </span>
            <span className="font-mono font-bold text-[#2E211A]">{breakdown.fire}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#FFFFFF] border border-[#D9C8AC]/40">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: breakdown.fire / 100 }}
              style={{ transformOrigin: "left" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="h-full w-full rounded-full bg-[#8F5C1A]"
            />
          </div>
        </div>

        {/* Water */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1.5 font-bold text-[#2E211A]">
              <span className="text-xs text-[#8F5C1A]">✦</span>{" "}
              {isEnglish ? "Water (Emotion / Intuition / Depth)" : "ธาตุน้ำ (อารมณ์ / ความรู้สึก / สัญชาตญาณ)"}
            </span>
            <span className="font-mono font-bold text-[#2E211A]">{breakdown.water}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#FFFFFF] border border-[#D9C8AC]/40">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: breakdown.water / 100 }}
              style={{ transformOrigin: "left" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
              className="h-full w-full rounded-full bg-[#8F5C1A]"
            />
          </div>
        </div>

        {/* Air */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1.5 font-bold text-[#2E211A]">
              <span className="text-xs text-[#8F5C1A]">✦</span>{" "}
              {isEnglish ? "Air (Logic / Intellect / Truth)" : "ธาตุลม (ตรรกะ / ความคิด / การตัดสินใจ)"}
            </span>
            <span className="font-mono font-bold text-[#2E211A]">{breakdown.air}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#FFFFFF] border border-[#D9C8AC]/40">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: breakdown.air / 100 }}
              style={{ transformOrigin: "left" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.16 }}
              className="h-full w-full rounded-full bg-[#8F5C1A]"
            />
          </div>
        </div>

        {/* Earth */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1.5 font-bold text-[#2E211A]">
              <span className="text-xs text-[#8F5C1A]">✦</span>{" "}
              {isEnglish ? "Earth (Stability / Wealth / Manifestation)" : "ธาตุดิน (การเงิน / ทรัพย์สิน / ความมั่นคง)"}
            </span>
            <span className="font-mono font-bold text-[#2E211A]">{breakdown.earth}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#FFFFFF] border border-[#D9C8AC]/40">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: breakdown.earth / 100 }}
              style={{ transformOrigin: "left" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.24 }}
              className="h-full w-full rounded-full bg-[#8F5C1A]"
            />
          </div>
        </div>
      </div>

      {/* Dominant & Balancing Advice */}
      <div className="mt-4 rounded-lg border border-[#D9C8AC] bg-[#FFFFFF] p-3.5 text-xs text-[#2E211A] ">
        <p className="font-serif-th font-bold text-[#8F5C1A]">
          ✦ {isEnglish && breakdown.dominantTitleEn ? breakdown.dominantTitleEn : breakdown.dominantTitleTh}:
        </p>
        <p className="mt-1 text-[#2E211A] leading-relaxed font-serif-th">
          {isEnglish && breakdown.dominantInsightEn ? breakdown.dominantInsightEn : breakdown.dominantInsightTh}
        </p>
        <p className="mt-2 text-[#635B4E] font-serif-th">
          <span className="text-[#8F5C1A]">✨</span>{" "}
          <span className="font-bold text-[#2E211A]">
            {isEnglish ? "Harmonizing Key:" : "วิธีปรับสมดุล:"}
          </span>{" "}
          {isEnglish && breakdown.balancingAdviceEn ? breakdown.balancingAdviceEn : breakdown.balancingAdviceTh}
        </p>
      </div>
    </div>
  );
};
