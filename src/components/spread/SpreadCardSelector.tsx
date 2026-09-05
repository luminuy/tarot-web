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

import { useLocale } from "@/lib/i18n";

export const SpreadCardSelector: React.FC<SpreadCardSelectorProps> = ({
  selectedSpread,
  onSelectSpread,
  onProceed,
  isPassHolder = false,
  onRequireUpgrade,
  proceedLabel,
}) => {
  const { isEnglish } = useLocale();
  const [activeCategory, setActiveCategory] = useState<SpreadCategory>("recommended");

  const categories: CategoryTab[] = useMemo(
    () => [
      { id: "recommended", label: isEnglish ? "Featured" : "ยอดนิยมแนะนำ", Icon: SparkleTabIcon, count: 5 },
      { id: "love", label: isEnglish ? "Love & Relationships" : "ความรัก & คนในใจ", Icon: HeartTabIcon, count: 5 },
      { id: "career", label: isEnglish ? "Career & Abundance" : "การงาน & การเงิน", Icon: PentacleTabIcon, count: 5 },
      { id: "master", label: isEnglish ? "Grand Spreads" : "ผังใหญ่เจาะลึก", Icon: CrystalBallTabIcon, count: 5 },
      { id: "all", label: isEnglish ? "All Spreads" : "ผังทั้งหมด", Icon: AllSpreadsTabIcon, count: SPREADS.length },
    ],
    [isEnglish]
  );

  const filteredSpreads = useMemo(() => {
    switch (activeCategory) {
      case "recommended":
        return SPREADS.filter((s) =>
          ["daily", "quick", "yes-no", "three-card", "celtic-cross"].includes(s.id)
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
        return SPREADS.filter((s) => ["celtic-cross", "year-ahead", "weekly", "chakra", "monthly"].includes(s.id));
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

  // Defer off-screen carousel spread illustrations on mobile to keep initial LCP and image payload minimal
  const [shouldRenderAllSpreads, setShouldRenderAllSpreads] = useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth >= 640) {
      setShouldRenderAllSpreads(true);
      return;
    }
    const idleCallback =
      "requestIdleCallback" in window
        ? (window as any).requestIdleCallback(() => setShouldRenderAllSpreads(true), { timeout: 2000 })
        : setTimeout(() => setShouldRenderAllSpreads(true), 1200);

    return () => {
      if ("cancelIdleCallback" in window) (window as any).cancelIdleCallback(idleCallback);
      else clearTimeout(idleCallback);
    };
  }, []);

  return (
    <div className="space-y-6 w-full">
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
              className={`px-3.5 sm:px-4 py-2 rounded-full text-xs font-serif-th font-bold transition-colors duration-200 cursor-pointer flex items-center gap-2 whitespace-nowrap relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A] ${
                isActive
                  ? "bg-[#8F5C1A] text-[#FFFFFF] border border-[#8F5C1A]"
                  : "bg-[#FFFFFF] text-[#2E211A] hover:text-[#8F5C1A] border border-[#D9C8AC]/50 hover:border-[#8F5C1A] hover:bg-[#FAF7F2]"
              }`}
            >
              <cat.Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-[#FFFFFF]" : "text-[#8F5C1A]"}`} />
              <span>{cat.label}</span>
              <span
                className={`text-[12px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isActive ? "bg-white/20 text-[#FFFFFF]" : "bg-[#FFFFFF] text-[#635B4E] border border-[#D9C8AC]/40"
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* World-Class Responsive Tarot Cards (Mobile Horizontal Swipe / Desktop Grid) */}
      {/* initial={false} — เรนเดอร์แรก (ฝั่งเซิร์ฟเวอร์) ต้องออกมาที่สถานะพร้อมอ่านเสมอ
          ไม่ใช่ opacity:0 เพราะ (1) ผู้ใช้ที่เปิด prefers-reduced-motion จะได้ HTML ไม่ตรงกับฝั่ง
          เซิร์ฟเวอร์จนเกิด hydration mismatch (ISSUE-008) และ (2) เนื้อหาหลักของหน้าแรก
          ไม่ควรถูกส่งออกไปแบบมองไม่เห็นสำหรับบอทค้นหา · การสลับแท็บยังมีอนิเมชันครบเหมือนเดิม */}
      <AnimatePresence mode="wait" initial={false}>
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

            const isCardVisibleOrNear =
              idx <= 1 || shouldRenderAllSpreads || Math.abs(idx - activeScrollIndex) <= 1;

            return (
              <div
                key={spread.id}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={
                  isEnglish
                    ? `Spread ${spread.nameEn || spread.nameTh} (${spread.positions.length} cards)${isLocked ? " - Unlock with Grand Tier" : ""} - ${spread.descriptionEn || spread.description}`
                    : `ผัง ${spread.nameTh} (${spread.positions.length} ใบ)${isLocked ? " - ปลดล็อกด้วยญาณพยากรณ์พิเศษ" : ""} - ${spread.description}`
                }
                onClick={handleCardClick}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleCardClick();
                  }
                }}
                className={`w-[82vw] max-w-[310px] flex-shrink-0 snap-center sm:w-auto sm:max-w-none sm:flex-shrink rounded-lg border transition-all duration-300 transform-gpu hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between p-4 sm:p-5 relative overflow-hidden select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A] group/card ${
                  isSelected
                    ? "bg-[#FFFFFF] border-2 border-[#D9C8AC] ring-4 ring-[#8F5C1A]/20 shadow-[var(--shadow-overlay)]"
                    : isLocked
                      ? "bg-[#FFFFFF]/90 border border-[#D9C8AC]/50 hover:border-[#8F5C1A] hover:bg-[#FAF7F2] opacity-90 hover:opacity-100"
                      : "bg-[#FFFFFF] border border-[#D9C8AC]/50 hover:border-[#8F5C1A] hover:shadow-[var(--shadow-overlay)]"
                }`}
                style={{ minHeight: "320px" }}
              >
                {/* Top Card Header Tags */}
                <div className="flex items-center justify-between z-10 pb-1">
                  <span className="text-[13px] text-[#2E211A] bg-[#FFFFFF] px-2.5 py-0.5 rounded-full border border-[#D9C8AC]/60 font-semibold font-mono ">
                    {spread.positions.length} {isEnglish ? "Cards" : "ใบ"}
                  </span>
                  {isLocked ? (
                    <span className="text-[12px] text-[#635B4E] bg-[#FFFFFF] border border-[#D9C8AC]/60 px-2.5 py-0.5 rounded-full font-serif-th font-bold flex items-center gap-1 ">
                      <SealedLockIcon className="w-3 h-3 text-[#8F5C1A]" />
                      <span>{isEnglish ? "Master Tier" : "ญาณพิเศษ"}</span>
                    </span>
                  ) : isRecommended ? (
                    <span className="text-[12px] text-[#FFFFFF] bg-[#8F5C1A] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                      {isEnglish ? "Popular" : "ยอดนิยม"}
                    </span>
                  ) : null}
                </div>

                {/* 1909 Tarot Spread Centerpiece on Dedicated Altar Pad */}
                <div className="my-auto py-2 flex flex-col items-center justify-center gap-2 relative">
                  <div
                    className={`w-full flex items-center justify-center p-3 rounded-lg bg-[#FFFFFF] border border-[#D9C8AC]/25 shadow-inner relative group-hover/card:scale-105 transition-transform duration-300 ${
                      isLocked ? "opacity-65 saturate-[0.9] group-hover/card:opacity-90" : ""
                    }`}
                  >
                    <div className="drop-shadow-[0_4px_12px_rgba(90,67,47,0.16)] w-full flex items-center justify-center">
                      {isCardVisibleOrNear ? (
                        renderSpreadIllustration(spread.id)
                      ) : (
                        <div
                          aria-hidden="true"
                          className="w-full h-40 flex items-center justify-center pointer-events-none"
                        >
                          <div className="w-12 h-16 rounded border border-[#D9C8AC]/25 bg-[#F3EDE2]/40 animate-pulse" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ตราผนึกญาณพิเศษ */}
                  {isLocked && (
                    <div className="z-20 flex items-center gap-1.5 rounded-full border border-[#D9C8AC] bg-[#FFFFFF] px-3 py-1 group-hover/card:border-[#D9C8AC] transition-all duration-300">
                      <SealedLockIcon className="w-3.5 h-3.5 text-[#8F5C1A] flex-shrink-0" />
                      <span className="text-[13px] font-serif-th font-bold text-[#2E211A] whitespace-nowrap">
                        {isEnglish ? "Tap to unlock this spread" : "แตะเพื่อปลดล็อกผังนี้"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Footer Titles */}
                <div className="pt-2.5 border-t border-[#D9C8AC]/30 text-center z-10">
                  <h3 className="font-serif-th text-base sm:text-lg font-bold text-[#2E211A] group-hover/card:text-[#8F5C1A] transition-colors leading-snug py-0.5 [text-wrap:balance]">
                    {isEnglish ? (spread.nameEn || spread.nameTh) : spread.nameTh}
                  </h3>
                  <p className="text-[13px] text-[#635B4E] line-clamp-2 mt-1 leading-relaxed font-serif-th [text-wrap:pretty]">
                    {isEnglish ? (spread.taglineEn || spread.tagline) : spread.tagline}
                  </p>
                </div>

                {/* Selected Golden Corner Seals */}
                {isSelected && (
                  <>
                    
                    
                    
                    
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
                  ? "w-7 bg-[#8F5C1A]"
                  : isSelected
                    ? "w-3 bg-[#8F5C1A]/60"
                    : "w-1.5 bg-[#8F5C1A]/20 hover:bg-[#74490F]/45"
              }`}
              aria-label={isEnglish ? `Select spread ${spread.nameEn || spread.nameTh}` : `เลือกผัง ${spread.nameTh}`}
            />
          );
        })}
      </div>

      {/* Selected Spread In-Focus Action Bar */}
      {onProceed && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-lg bg-[#FFFFFF]/90 backdrop-blur-xl border border-[#D9C8AC]/50 shadow-[var(--shadow-overlay)]"
        >
          <div className="flex items-center gap-3.5">
            {/* Real 1909 Rider-Waite Spread Card Emblem */}
            <div className="w-9 h-14 sm:w-10 sm:h-15 rounded-lg border-2 border-[#D9C8AC] overflow-hidden bg-[#FFFFFF] relative flex-shrink-0">
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
                alt={isEnglish ? (selectedSpread.nameEn || selectedSpread.nameTh) : selectedSpread.nameTh}
                className="w-full h-full object-cover object-top tarot-hd-card-image"
                sizes="72px"
              />
              <div className="gold-foil-sheen absolute inset-0 opacity-20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-[#635B4E] font-serif-th font-semibold">
                  {isEnglish ? "Selected Spread:" : "ผังที่เลือกไว้:"}
                </span>
                <span className="text-[13px] text-[#FFFFFF] bg-[#8F5C1A] px-2.5 py-0.2 rounded-full font-bold font-mono ">
                  {selectedSpread.positions.length} {isEnglish ? "Cards" : "ใบ"}
                </span>
              </div>
              <div className="font-serif-th text-base sm:text-lg font-bold text-[#2E211A] leading-snug py-0.5 mt-0.5">
                {isEnglish ? (selectedSpread.nameEn || selectedSpread.nameTh) : selectedSpread.nameTh}
                <span className="text-xs font-normal text-[#635B4E] ml-2 hidden sm:inline font-serif-th">
                  — {isEnglish ? (selectedSpread.taglineEn || selectedSpread.tagline) : selectedSpread.tagline}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onProceed}
            className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-full bg-[#8F5C1A] hover:bg-[#74490F] text-white font-bold font-serif-th text-sm sm:text-base active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap group"
          >
            <span>{proceedLabel ?? (isEnglish ? "Next: Set Intention & Choose Reader" : "ถัดไป: ตั้งคำถามและเลือกแม่หมอ")}</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </motion.div>
      )}
    </div>
  );
};
