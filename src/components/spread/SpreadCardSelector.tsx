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
import { CardImage } from "@/components/card/CardImage";

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
      return <DailySpreadArt className="w-full h-40" />;
    case "quick":
      return <QuickSpreadArt className="w-full h-40" />;
    case "yes-no":
      return <YesNoSpreadArt className="w-full h-40" />;
    case "three-card":
      return <ThreeCardSpreadArt className="w-full h-40" />;
    case "situation-solution":
      return <SituationSolutionSpreadArt className="w-full h-40" />;
    case "mind-body-spirit":
      return <MindBodySpiritSpreadArt className="w-full h-40" />;
    case "love":
      return <LoveSpreadArt className="w-full h-40" />;
    case "how-they-feel":
      return <HowTheyFeelSpreadArt className="w-full h-40" />;
    case "ex-reconciliation":
      return <ExReconciliationSpreadArt className="w-full h-40" />;
    case "soulmate":
      return <SoulmateSpreadArt className="w-full h-40" />;
    case "career":
      return <CareerSpreadArt className="w-full h-40" />;
    case "money":
      return <MoneySpreadArt className="w-full h-40" />;
    case "career-switch":
      return <CareerSwitchSpreadArt className="w-full h-40" />;
    case "decision":
      return <DecisionSpreadArt className="w-full h-40" />;
    case "inner-potential":
      return <InnerPotentialSpreadArt className="w-full h-40" />;
    case "weekly":
      return <WeeklySpreadArt className="w-full h-40" />;
    case "monthly":
      return <MonthlySpreadArt className="w-full h-40" />;
    case "chakra":
      return <ChakraSpreadArt className="w-full h-40" />;
    case "celtic-cross":
      return <CelticCrossSpreadArt className="w-full h-40" />;
    case "year-ahead":
      return <TwelveMonthsSpreadArt className="w-full h-40" />;
    default:
      return <ThreeCardSpreadArt className="w-full h-40" />;
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

  const carouselRef = React.useRef<HTMLDivElement>(null);
  const [activeScrollIndex, setActiveScrollIndex] = useState(0);

  // Sync scroll position with active dot indicator on mobile
  const handleCarouselScroll = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, clientWidth } = carouselRef.current;
    const cardWidth = Math.min(clientWidth * 0.82, 310) + 16; // 82vw or max 310px + gap
    const newIdx = Math.round(scrollLeft / cardWidth);
    if (newIdx >= 0 && newIdx < filteredSpreads.length && newIdx !== activeScrollIndex) {
      setActiveScrollIndex(newIdx);
    }
  };

  const scrollToCard = (index: number) => {
    if (!carouselRef.current) return;
    const children = carouselRef.current.children;
    if (children && children[index]) {
      (children[index] as HTMLElement).scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
      setActiveScrollIndex(index);
    }
  };

  // Reset scroll on category change
  React.useEffect(() => {
    setActiveScrollIndex(0);
    if (carouselRef.current) {
      carouselRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  }, [activeCategory]);

  return (
    <div className="space-y-5 w-full">
      {/* Category Filter Tabs (Linear / Apple Tier Navigation) */}
      <div className="flex items-center justify-start gap-2 overflow-x-auto pb-1.5 px-1 no-scrollbar select-none">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 sm:px-4 py-2 rounded-2xl text-xs font-serif-th font-bold transition-all duration-300 cursor-pointer flex items-center gap-2 whitespace-nowrap relative ${
                isActive
                  ? "bg-gradient-to-r from-[#d4af37] via-[#f7e7b4] to-[#c59b27] text-[#0a0715] border border-[#fff6d6]/60 shadow-[0_0_22px_rgba(229,192,123,0.45),0_2px_8px_rgba(0,0,0,0.6)] scale-[1.03]"
                  : "bg-[#0e091e]/85 text-[#a99fc2] hover:text-[#ffd700] border border-[#e5c07b]/20 hover:border-[#ffd700]/50 hover:bg-[#181033] hover:shadow-[0_0_15px_rgba(229,192,123,0.18)]"
              }`}
            >
              <cat.Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-[#0a0715]" : "text-[#e5c07b]"}`} />
              <span>{cat.label}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isActive
                    ? "bg-black/15 text-[#0a0715] border border-black/10"
                    : "bg-white/5 text-[#8f85aa]"
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile Swipe Guidance Header */}
      <div className="flex sm:hidden items-center justify-between px-1 text-[11px] font-serif-th text-[#e5c07b] select-none pt-0.5">
        <div className="flex items-center gap-1.5 font-semibold">
          <span>✦</span>
          <span>ปัดซ้าย-ขวาเพื่อเลือกผัง</span>
        </div>
        <span className="text-[10px] text-[#9c93b8] font-mono bg-[#140c2a] border border-[#e5c07b]/20 px-2 py-0.5 rounded-full shadow-inner">
          {activeScrollIndex + 1} / {filteredSpreads.length} ผัง
        </span>
      </div>

      {/* World-Class Responsive Tarot Cards (Mobile Horizontal Swipe / Desktop Grid) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.22 }}
          ref={carouselRef}
          onScroll={handleCarouselScroll}
          className="flex flex-row overflow-x-auto snap-x snap-mandatory gap-4 pb-3 pt-1 px-4 -mx-4 no-scrollbar scroll-smooth sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-5 sm:mx-0 sm:px-0 sm:pb-0 sm:pt-0 sm:overflow-visible"
        >
          {filteredSpreads.map((spread, idx) => {
            const isSelected = selectedSpread.id === spread.id;
            const isRecommended = spread.id === "three-card";

            return (
              <motion.div
                key={spread.id}
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onSelectSpread(spread);
                  scrollToCard(idx);
                }}
                className={`w-[82vw] max-w-[310px] flex-shrink-0 snap-center sm:w-auto sm:max-w-none sm:flex-shrink rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between p-4 sm:p-5 relative overflow-hidden select-none ${
                  isSelected
                    ? "bg-gradient-to-b from-[#281d4a] via-[#140b28] to-[#07040f] border-[#ffd700] ring-2 ring-[#e5c07b]/90 shadow-[0_0_35px_rgba(229,192,123,0.45)]"
                    : "bg-gradient-to-b from-[#130d24]/95 to-[#07040f]/95 border-[#e5c07b]/25 hover:border-[#e5c07b]/60 hover:bg-[#181130] shadow-xl"
                }`}
                style={{ minHeight: "320px" }}
              >
                {/* Top Card Header Tags */}
                <div className="flex items-center justify-between z-10 pb-1">
                  <span className="text-[10px] text-[#e5c07b] bg-[#e5c07b]/15 px-2.5 py-0.5 rounded-full border border-[#e5c07b]/30 font-semibold font-mono">
                    {spread.positions.length} ใบ
                  </span>
                  {isRecommended && (
                    <span className="text-[9px] text-[#05040a] bg-gradient-to-r from-[#c59b27] via-[#f5deaa] to-[#e5c07b] px-2.5 py-0.5 rounded-full font-bold shadow flex items-center gap-1">
                      <span>✦</span> ยอดนิยม
                    </span>
                  )}
                </div>

                {/* 1909 Tarot Spread Centerpiece with Soft Altar Glow */}
                <div className="my-auto py-2.5 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-radial from-[#e5c07b]/10 via-transparent to-transparent pointer-events-none blur-xl" />
                  <div className="relative z-10 filter drop-shadow-[0_0_14px_rgba(229,192,123,0.3)]">
                    {renderSpreadIllustration(spread.id)}
                  </div>
                </div>

                {/* Card Footer Titles */}
                <div className="pt-2.5 border-t border-[#e5c07b]/15 text-center z-10">
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
                    <div className="absolute top-1.5 left-1.5 text-[8px] text-[#ffd700]">✦</div>
                    <div className="absolute top-1.5 right-1.5 text-[8px] text-[#ffd700]">✦</div>
                    <div className="absolute bottom-1.5 left-1.5 text-[8px] text-[#ffd700]">✦</div>
                    <div className="absolute bottom-1.5 right-1.5 text-[8px] text-[#ffd700]">✦</div>
                  </>
                )}

                {/* Holographic Sheen Layer */}
                <div className="gold-foil-sheen absolute inset-0 opacity-20 hover:opacity-40 transition-opacity pointer-events-none" />
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Interactive Mobile Carousel Navigation Pills */}
      <div className="flex sm:hidden items-center justify-center gap-1.5 pt-0.5 pb-1">
        {filteredSpreads.map((spread, idx) => {
          const isCurrentActive = activeScrollIndex === idx;
          const isSelected = selectedSpread.id === spread.id;

          return (
            <button
              key={spread.id}
              type="button"
              onClick={() => {
                onSelectSpread(spread);
                scrollToCard(idx);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                isCurrentActive
                  ? "w-7 bg-gradient-to-r from-[#d4af37] via-[#f7e7b4] to-[#c59b27] shadow-[0_0_10px_rgba(229,192,123,0.9)]"
                  : isSelected
                  ? "w-3 bg-[#e5c07b]/60"
                  : "w-1.5 bg-[#e5c07b]/20 hover:bg-[#e5c07b]/45"
              }`}
              aria-label={`เลือกผัง ${spread.nameTh}`}
            />
          );
        })}
      </div>

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
              <CardImage
                image={`${
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
                className="w-full h-full object-cover object-top filter contrast-[1.08] saturate-[1.08] brightness-[1.03] tarot-hd-card-image"
                sizes="200px"
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
            className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f7e7b4] to-[#c59b27] text-[#0a0715] font-bold font-serif-th text-sm sm:text-base shadow-[0_0_25px_rgba(229,192,123,0.45)] hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap group"
          >
            <span>ถัดไป: ตั้งคำถามและเลือกแม่หมอ</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </motion.div>
      )}
    </div>
  );
};
