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
import { SealedLockIcon } from "@/components/entitlement/EntitlementIcons";
import { isStandardSpread } from "@/lib/entitlement/limits";
import { soundManager } from "@/lib/utils/audio";

interface SpreadCardSelectorProps {
  selectedSpread: Spread;
  onSelectSpread: (spread: Spread) => void;
  onProceed?: () => void;
  isPassHolder?: boolean;
  onRequireUpgrade?: (reason: "grand_spread", spread: Spread) => void;
  /**
   * ถ้อยคำบนปุ่มเริ่ม — ส่งมาทับได้เมื่อสิทธิ์ยังไม่พอ
   * เพื่อบอกล่วงหน้าตั้งแต่ก่อนกดว่าต้องสมัคร/ปลดล็อกก่อน (กันเซอร์ไพรส์ตอนกดแล้วเจอหน้าต่างสิทธิ์)
   */
  proceedLabel?: string;
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
  isPassHolder = false,
  onRequireUpgrade,
  proceedLabel,
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
      <div
        role="tablist"
        aria-label="หมวดหมู่ผังพยากรณ์"
        className="flex items-center justify-start gap-2 overflow-x-auto pb-1.5 px-1 no-scrollbar select-none"
      >
        {categories.map((cat, catIdx) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              role="tab"
              id={`spread-tab-${cat.id}`}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              onKeyDown={(e) => {
                let nextIdx = -1;
                if (e.key === "ArrowRight") nextIdx = (catIdx + 1) % categories.length;
                else if (e.key === "ArrowLeft") nextIdx = (catIdx - 1 + categories.length) % categories.length;
                if (nextIdx !== -1) {
                  e.preventDefault();
                  setActiveCategory(categories[nextIdx].id);
                  const nextTab = document.getElementById(`spread-tab-${categories[nextIdx].id}`);
                  nextTab?.focus();
                }
              }}
              className={`px-3.5 sm:px-4 py-2 rounded-full text-xs font-serif-th font-bold transition-colors duration-200 cursor-pointer flex items-center gap-2 whitespace-nowrap relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059] ${
                isActive
                  ? "bg-[#8F5C1A] text-[#FFFFFF] border border-[#8F5C1A]"
                  : "bg-[#FFFFFF] text-[#231812] hover:text-[#B8853E] border border-[#D6B48D]/50 hover:border-[#C5A059] hover:bg-[#FAF8F5] shadow-xs"
              }`}
            >
              <cat.Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-[#FFFFFF]" : "text-[#C5A059]"}`} />
              <span>{cat.label}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isActive
                    ? "bg-white/20 text-[#FFFFFF]"
                    : "bg-[#FAF8F5] text-[#7C6553] border border-[#D6B48D]/40"
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* World-Class Responsive Tarot Cards (Mobile Horizontal Swipe / Desktop Grid) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          role="tabpanel"
          id={`spread-panel-${activeCategory}`}
          aria-labelledby={`spread-tab-${activeCategory}`}
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
            const isGrand = !isStandardSpread(spread.id);
            const isLocked = isGrand && !isPassHolder;

            const handleCardClick = () => {
              if (isLocked) {
                soundManager.playMenuTapSound();
                onRequireUpgrade?.("grand_spread", spread);
                return;
              }
              onSelectSpread(spread);
              scrollToCard(idx);
            };

            return (
              <div
                key={spread.id}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={`ผัง ${spread.nameTh} (${spread.positions.length} ใบ)${isLocked ? " - ปลดล็อกด้วยญาณพยากรณ์พิเศษ" : ""} - ${spread.description}`}
                onClick={handleCardClick}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleCardClick();
                  }
                }}
                className={`w-[82vw] max-w-[310px] flex-shrink-0 snap-center sm:w-auto sm:max-w-none sm:flex-shrink rounded-[1.618rem] border transition-all duration-300 transform-gpu hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between p-4 sm:p-5 relative overflow-hidden select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059] group/card ${
                  isSelected
                    ? "bg-[#FFFFFF] border-2 border-[#D4AF37] ring-4 ring-[#C5A059]/20 shadow-[0_16px_40px_-6px_rgba(197,160,89,0.35)]"
                    : isLocked
                    ? "bg-[#FFFFFF]/90 border border-[#D6B48D]/50 hover:border-[#C5A059] hover:bg-[#FFFFFF] shadow-xs opacity-90 hover:opacity-100"
                    : "bg-[#FFFFFF] border border-[#D6B48D]/50 hover:border-[#C5A059] shadow-sm hover:shadow-xl"
                }`}
                style={{ minHeight: "320px" }}
              >
                {/* Top Card Header Tags */}
                <div className="flex items-center justify-between z-10 pb-1">
                  <span className="text-[10px] text-[#231812] bg-[#FAF8F5] px-2.5 py-0.5 rounded-full border border-[#D6B48D]/60 font-semibold font-mono shadow-xs">
                    {spread.positions.length} ใบ
                  </span>
                  {isLocked ? (
                    <span className="text-[9px] text-[#7C6553] bg-[#FAF8F5] border border-[#D6B48D]/60 px-2.5 py-0.5 rounded-full font-serif-th font-bold flex items-center gap-1 shadow-xs">
                      <SealedLockIcon className="w-3 h-3 text-[#C5A059]" />
                      <span>✦ ญาณพิเศษ</span>
                    </span>
                  ) : isRecommended ? (
                    <span className="text-[9px] text-[#FFFFFF] bg-gradient-to-r from-[#B8853E] to-[#D4AF37] px-2.5 py-0.5 rounded-full font-bold shadow-xs flex items-center gap-1">
                      <span>✦</span> ยอดนิยม
                    </span>
                  ) : null}
                </div>

                {/* 1909 Tarot Spread Centerpiece on Dedicated Altar Pad */}
                <div className="my-auto py-2 flex flex-col items-center justify-center gap-2 relative">
                  <div
                    className={`w-full flex items-center justify-center p-3 rounded-2xl bg-gradient-to-b from-[#FAF8F5] to-[#F5EFEB]/60 border border-[#D6B48D]/25 shadow-inner relative group-hover/card:scale-105 transition-transform duration-300 ${
                      isLocked ? "opacity-65 saturate-[0.9] group-hover/card:opacity-90" : ""
                    }`}
                  >
                    <div className="drop-shadow-[0_4px_12px_rgba(90,67,47,0.16)]">
                      {renderSpreadIllustration(spread.id)}
                    </div>
                  </div>

                  {/* ตราผนึกญาณพิเศษ */}
                  {isLocked && (
                    <div className="z-20 flex items-center gap-1.5 rounded-full border border-[#D6B48D] bg-[#FFFFFF] px-3 py-1 shadow-xs group-hover/card:border-[#C5A059] transition-all duration-300">
                      <SealedLockIcon className="w-3.5 h-3.5 text-[#C5A059] flex-shrink-0" />
                      <span className="text-[10.5px] font-serif-th font-bold text-[#231812] whitespace-nowrap">
                        แตะเพื่อปลดล็อกผังนี้
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Footer Titles */}
                <div className="pt-2.5 border-t border-[#D6B48D]/30 text-center z-10">
                  <h4 className="font-serif-th text-base sm:text-lg font-bold text-[#231812] group-hover/card:text-[#B8853E] transition-colors leading-tight">
                    {spread.nameTh}
                  </h4>
                  <p className="text-[11px] text-[#7C6553] line-clamp-2 mt-1 leading-snug font-serif-th">
                    {spread.tagline}
                  </p>
                </div>

                {/* Selected Golden Corner Seals */}
                {isSelected && (
                  <>
                    <div className="absolute top-1.5 left-1.5 text-[8px] text-[#C5A059]">✦</div>
                    <div className="absolute top-1.5 right-1.5 text-[8px] text-[#C5A059]">✦</div>
                    <div className="absolute bottom-1.5 left-1.5 text-[8px] text-[#C5A059]">✦</div>
                    <div className="absolute bottom-1.5 right-1.5 text-[8px] text-[#C5A059]">✦</div>
                  </>
                )}

                {/* Holographic Sheen Layer */}
                <div className="gold-foil-sheen absolute inset-0 opacity-15 hover:opacity-30 transition-opacity pointer-events-none" />
              </div>
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
          className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-[1.618rem] bg-[#FFFFFF]/90 backdrop-blur-xl border border-[#D6B48D]/50 shadow-[0_12px_36px_rgba(90,67,47,0.1)]"
        >
          <div className="flex items-center gap-3.5">
            {/* Real 1909 Rider-Waite Spread Card Emblem */}
            <div className="w-9 h-14 sm:w-10 sm:h-15 rounded-xl border-2 border-[#D6B48D] overflow-hidden shadow-xs bg-[#FAF8F5] relative flex-shrink-0">
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
                className="w-full h-full object-cover object-top tarot-hd-card-image"
                sizes="72px"
              />
              <div className="gold-foil-sheen absolute inset-0 opacity-20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-[#7C6553] font-mono">ผังที่เลือกไว้:</span>
                <span className="text-[10px] text-[#FFFFFF] bg-gradient-to-r from-[#B8853E] to-[#D4AF37] px-2.5 py-0.2 rounded-full font-bold font-mono shadow-xs">
                  {selectedSpread.positions.length} ใบ
                </span>
              </div>
              <h4 className="font-serif-th text-base sm:text-lg font-bold text-[#231812] leading-tight mt-0.5">
                {selectedSpread.nameTh}
                <span className="text-xs font-normal text-[#7C6553] ml-2 hidden sm:inline font-serif-th">
                  — {selectedSpread.tagline}
                </span>
              </h4>
            </div>
          </div>

          <button
            type="button"
            onClick={onProceed}
            className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-full bg-[#8F5C1A] hover:bg-[#74490F] text-white font-bold font-serif-th text-sm sm:text-base shadow-xs active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap group"
          >
            <span>{proceedLabel ?? "ถัดไป: ตั้งคำถามและเลือกแม่หมอ"}</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </motion.div>
      )}
    </div>
  );
};
