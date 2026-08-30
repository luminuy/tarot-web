"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SPREADS, type Spread } from "@/data/spreads";
import {
  DailySpreadArt,
  QuickSpreadArt,
  YesNoSpreadArt,
  ThreeCardSpreadArt,
  LoveSpreadArt,
  CareerSpreadArt,
  MoneySpreadArt,
  DecisionSpreadArt,
  CelticCrossSpreadArt,
  TwelveMonthsSpreadArt,
  SituationSolutionSpreadArt,
  MindBodySpiritSpreadArt,
  HowTheyFeelSpreadArt,
  ExReconciliationSpreadArt,
  SoulmateSpreadArt,
  CareerSwitchSpreadArt,
  InnerPotentialSpreadArt,
  WeeklySpreadArt,
  MonthlySpreadArt,
  ChakraSpreadArt,
  SparkleTabIcon,
  HeartTabIcon,
  PentacleTabIcon,
  CrystalBallTabIcon,
  AllSpreadsTabIcon,
} from "@/components/ui/TarotArtIcons";

interface SpreadCardSelectorProps {
  selectedSpread: Spread;
  onSelectSpread: (spread: Spread) => void;
  onProceed?: () => void;
}

type SpreadCategory = "all" | "recommended" | "love" | "career" | "master";

interface CategoryTab {
  id: SpreadCategory;
  label: string;
  Icon: React.FC<{ className?: string }>;
  count: number;
}

export const renderSpreadIllustration = (spreadId: string) => {
  switch (spreadId) {
    case "daily":
      return <DailySpreadArt className="w-full h-28" />;
    case "quick":
      return <QuickSpreadArt className="w-full h-28" />;
    case "yes-no":
      return <YesNoSpreadArt className="w-full h-28" />;
    case "three-card":
      return <ThreeCardSpreadArt className="w-full h-28" />;
    case "situation-solution":
      return <SituationSolutionSpreadArt className="w-full h-28" />;
    case "mind-body-spirit":
      return <MindBodySpiritSpreadArt className="w-full h-28" />;
    case "love":
      return <LoveSpreadArt className="w-full h-28" />;
    case "how-they-feel":
      return <HowTheyFeelSpreadArt className="w-full h-28" />;
    case "ex-reconciliation":
      return <ExReconciliationSpreadArt className="w-full h-28" />;
    case "soulmate":
      return <SoulmateSpreadArt className="w-full h-28" />;
    case "career":
      return <CareerSpreadArt className="w-full h-28" />;
    case "money":
      return <MoneySpreadArt className="w-full h-28" />;
    case "career-switch":
      return <CareerSwitchSpreadArt className="w-full h-28" />;
    case "decision":
      return <DecisionSpreadArt className="w-full h-28" />;
    case "inner-potential":
      return <InnerPotentialSpreadArt className="w-full h-28" />;
    case "weekly":
      return <WeeklySpreadArt className="w-full h-28" />;
    case "monthly":
      return <MonthlySpreadArt className="w-full h-28" />;
    case "chakra":
      return <ChakraSpreadArt className="w-full h-28" />;
    case "celtic-cross":
      return <CelticCrossSpreadArt className="w-full h-28" />;
    case "year-ahead":
      return <TwelveMonthsSpreadArt className="w-full h-28" />;
    default:
      return <ThreeCardSpreadArt className="w-full h-28" />;
  }
};

export const SpreadCardSelector: React.FC<SpreadCardSelectorProps> = ({
  selectedSpread,
  onSelectSpread,
  onProceed,
}) => {
  const [activeCategory, setActiveCategory] = useState<SpreadCategory>("recommended");

  const categories: CategoryTab[] = useMemo(
    () => [
      { id: "recommended", label: "ยอดนิยมแนะนำ", Icon: SparkleTabIcon, count: 6 },
      { id: "love", label: "ความรัก & คนในใจ", Icon: HeartTabIcon, count: 5 },
      { id: "career", label: "การงาน & การเงิน", Icon: PentacleTabIcon, count: 5 },
      { id: "master", label: "ผังใหญ่เจาะลึก", Icon: CrystalBallTabIcon, count: 5 },
      { id: "all", label: "ผังทั้งหมด", Icon: AllSpreadsTabIcon, count: SPREADS.length },
    ],
    []
  );

  const filteredSpreads = useMemo(() => {
    switch (activeCategory) {
      case "recommended":
        return SPREADS.filter((s) =>
          ["daily", "quick", "yes-no", "three-card", "situation-solution", "celtic-cross"].includes(s.id)
        );
      case "love":
        return SPREADS.filter((s) =>
          ["love", "how-they-feel", "ex-reconciliation", "soulmate", "three-card"].includes(s.id)
        );
      case "career":
        return SPREADS.filter((s) =>
          ["career", "money", "career-switch", "decision", "inner-potential"].includes(s.id)
        );
      case "master":
        return SPREADS.filter((s) =>
          ["celtic-cross", "year-ahead", "weekly", "chakra", "monthly"].includes(s.id)
        );
      case "all":
      default:
        return SPREADS;
    }
  }, [activeCategory]);

  return (
    <div className="space-y-6 w-full">
      {/* Category Filter Tabs (Linear / Apple Tier Navigation) */}
      {/*
        justify-start เจตนา ไม่ใช่ justify-center: แถวนี้ overflow-x-auto และเนื้อหากว้างกว่ากรอบ
        เสมอบนจอมือถือ — justify-center บนคอนเทนเนอร์ที่ scroll ได้ทำให้ scrollLeft เริ่มที่ 0
        แต่ตัวเลือกแรก (ยอดนิยมแนะนำ) ถูกเบียดพ้นขอบซ้ายไปแล้วและสกรอลไปดูไม่ได้อีกเลย
        (ปุ่มแรกหายไปถาวรบนมือถือ) justify-start กันปัญหานี้ทั้งชุดโดยไม่ต้องพึ่ง breakpoint
      */}
      <div className="flex items-center justify-start gap-1.5 sm:gap-2 overflow-x-auto pb-2 px-1 no-scrollbar">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-serif-th font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap select-none ${
                isActive
                  ? "bg-gradient-to-r from-[#c59b27] via-[#f5deaa] to-[#e5c07b] text-[#05040a] shadow-[0_0_20px_rgba(229,192,123,0.45)] scale-105"
                  : "bg-[#100b20]/90 text-[#9c93b8] hover:text-[#f5deaa] border border-[#e5c07b]/20 hover:border-[#e5c07b]/40 hover:bg-[#16102c]"
              }`}
            >
              <cat.Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>{cat.label}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isActive
                    ? "bg-[#05040a]/20 text-[#05040a]"
                    : "bg-white/5 text-[#9c93b8]"
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* World-Class Responsive Tarot Cards Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5"
        >
          {filteredSpreads.map((spread) => {
            const isSelected = selectedSpread.id === spread.id;
            const isRecommended = spread.id === "three-card";

            return (
              <motion.div
                key={spread.id}
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectSpread(spread)}
                className={`rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between p-4 sm:p-5 relative overflow-hidden select-none ${
                  isSelected
                    ? "bg-gradient-to-b from-[#281d4a] via-[#140b28] to-[#07040f] border-[#e5c07b] ring-2 ring-[#e5c07b]/90 shadow-[0_0_40px_rgba(229,192,123,0.5)]"
                    : "bg-gradient-to-b from-[#130d24]/90 to-[#07040f]/90 border-[#e5c07b]/25 hover:border-[#e5c07b]/60 hover:bg-[#181130] shadow-xl"
                }`}
                style={{ minHeight: "335px" }}
              >
                {/* Card Header Tag */}
                <div className="flex items-center justify-between z-10">
                  <span className="text-[10px] text-[#e5c07b] bg-[#e5c07b]/15 px-2.5 py-0.5 rounded-full border border-[#e5c07b]/30 font-semibold font-mono">
                    {spread.positions.length} ใบ
                  </span>
                  {isRecommended && (
                    <span className="text-[9px] text-[#05040a] bg-gradient-to-r from-[#c59b27] via-[#f5deaa] to-[#e5c07b] px-2 py-0.5 rounded-full font-bold shadow flex items-center gap-0.5">
                      <span>✦</span> ยอดนิยม
                    </span>
                  )}
                </div>

                {/* Distinct Authentic 1909 Tarot Spread Showcase */}
                <div className="my-auto py-3 flex items-center justify-center filter drop-shadow-[0_0_15px_rgba(229,192,123,0.25)]">
                  {renderSpreadIllustration(spread.id)}
                </div>

                {/* Card Footer Titles */}
                <div className="pt-3 border-t border-[#e5c07b]/15 text-center z-10">
                  <h4 className="font-serif-th text-sm sm:text-base font-bold font-mystic-gold leading-tight">
                    {spread.nameTh}
                  </h4>
                  <p className="text-[11px] text-[#9c93b8] line-clamp-2 mt-1 leading-snug">
                    {spread.tagline}
                  </p>
                </div>

                {/* Selected Golden Corner Seals */}
                {isSelected && (
                  <>
                    <div className="absolute top-1.5 left-1.5 text-[8px] text-[#e5c07b]">✦</div>
                    <div className="absolute top-1.5 right-1.5 text-[8px] text-[#e5c07b]">✦</div>
                    <div className="absolute bottom-1.5 left-1.5 text-[8px] text-[#e5c07b]">✦</div>
                    <div className="absolute bottom-1.5 right-1.5 text-[8px] text-[#e5c07b]">✦</div>
                  </>
                )}

                {/* Holographic Sheen Layer */}
                <div className="gold-foil-sheen absolute inset-0 opacity-20 hover:opacity-40 transition-opacity pointer-events-none" />
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Selected Spread In-Focus Action Bar */}
      {onProceed && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#170d30]/95 via-[#100922]/95 to-[#080512]/95 border-2 border-[#e5c07b]/60 backdrop-blur-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)]"
        >
          <div className="flex items-center gap-3.5">
            {/* Real 1909 Rider-Waite Spread Card Emblem */}
            <div className="w-9 h-14 sm:w-10 sm:h-15 rounded-lg border-2 border-[#e5c07b] overflow-hidden shadow-[0_0_20px_rgba(229,192,123,0.5)] bg-[#07050d] relative flex-shrink-0">
              <img
                src={`/cards/${
                  selectedSpread.id === "daily"
                    ? "major-19.jpg"
                    : selectedSpread.id === "quick"
                    ? "major-01.jpg"
                    : selectedSpread.id === "yes-no"
                    ? "major-10.jpg"
                    : selectedSpread.id === "love"
                    ? "major-06.jpg"
                    : selectedSpread.id === "career"
                    ? "major-07.jpg"
                    : selectedSpread.id === "money"
                    ? "pentacles-01.jpg"
                    : selectedSpread.id === "celtic-cross"
                    ? "major-21.jpg"
                    : selectedSpread.id === "decision"
                    ? "major-02.jpg"
                    : "major-17.jpg"
                }`}
                alt={selectedSpread.nameTh}
                className="w-full h-full object-cover object-top filter contrast-[1.04]"
              />
              <div className="gold-foil-sheen absolute inset-0 opacity-30" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-[#e5c07b] font-mono">ผังที่เลือกไว้:</span>
                <span className="text-[10px] text-[#05040a] bg-gradient-to-r from-[#c59b27] to-[#f5deaa] px-2 py-0.2 rounded-full font-bold font-mono shadow">
                  {selectedSpread.positions.length} ใบ
                </span>
              </div>
              <h4 className="font-serif-th text-base sm:text-lg font-bold text-[#f5deaa] leading-tight mt-0.5">
                {selectedSpread.nameTh}
                <span className="text-xs font-normal text-[#9c93b8] ml-2 hidden sm:inline">
                  — {selectedSpread.tagline}
                </span>
              </h4>
            </div>
          </div>

          <button
            type="button"
            onClick={onProceed}
            className="w-full sm:w-auto px-9 py-4 rounded-xl bg-gradient-to-r from-[#c59b27] via-[#f5deaa] to-[#e5c07b] text-[#05040a] font-bold font-serif-th text-base shadow-[0_0_30px_rgba(229,192,123,0.55)] hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2.5 whitespace-nowrap group"
          >
            <span>ถัดไป: ตั้งจิตอธิษฐาน & อัญเชิญแม่หมอ</span>
            <span className="group-hover:translate-x-1 transition-transform">➔</span>
          </button>
        </motion.div>
      )}
    </div>
  );
};
