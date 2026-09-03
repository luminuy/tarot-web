"use client";

import React, { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { soundManager } from "@/lib/utils/audio";
import { CardImage } from "@/components/card/CardImage";

interface InteractiveCardFanProps {
  totalCards?: number;
  pickedIndices: number[];
  targetCount: number;
  currentPositionName?: string;
  onPickCard: (fanIndex: number) => void;
  disabled?: boolean;
}

interface FanCardProps {
  cardIdx: number;
  posInTier: number;
  tierIdx: number;
  isPicked: boolean;
  disabled: boolean;
  onClick: (idx: number) => void;
}

const FanCard = React.memo<FanCardProps>(
  ({ cardIdx, posInTier, tierIdx, isPicked, disabled, onClick }) => {
    if (isPicked) return null;

    // P1-M4: True mathematical arc geometry
    // Each tier has 26 cards; use position within tier for arc spread
    const TIER_SPREAD_DEG = 22; // total arc spread per tier in degrees
    const CARDS_PER_TIER = 26;
    const normalized = (posInTier % CARDS_PER_TIER) / (CARDS_PER_TIER - 1) - 0.5; // -0.5 to 0.5
    const angle = normalized * TIER_SPREAD_DEG;

    // Arc Y: cards at edges of fan dip down following the circumference
    const ARC_RADIUS = 320; // virtual radius in px
    const angleRad = (angle * Math.PI) / 180;
    const arcY = ARC_RADIUS * (1 - Math.cos(angleRad));

    return (
      <motion.div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={`เลือกไพ่ใบที่ ${cardIdx + 1}`}
        aria-disabled={disabled}
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, rotate: angle, y: arcY }}
        exit={{
          opacity: 0,
          y: -130,
          scale: 0.35,
          rotate: angle * 3,
          transition: { duration: 0.3, ease: [0.4, 0, 1, 1] },
        }}
        whileHover={{ y: arcY - 22, scale: 1.18, rotate: 0, zIndex: 200 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => !disabled && onClick(cardIdx)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!disabled) onClick(cardIdx);
          }
        }}
        className="cursor-pointer relative select-none flex-shrink-0 w-[46px] sm:w-[66px] md:w-[74px] group focus-visible:outline-none"
        style={{ zIndex: tierIdx * 40 + posInTier, originY: 1 }}
      >
        <div className="w-[46px] h-[78px] sm:w-[66px] sm:h-[112px] md:w-[74px] md:h-[124px] rounded-xl sm:rounded-2xl border-2 card-back-pattern shadow-sm flex flex-col items-center justify-between p-1 sm:p-1.5 relative overflow-hidden transition-all duration-200 border-[#D6B48D] group-hover:border-[#CD9F5B] group-hover:ring-2 group-hover:ring-[#CD9F5B]/60 group-hover:shadow-[0_0_20px_rgba(205,159,91,0.5)] group-focus-visible:border-[#CD9F5B] group-focus-visible:ring-2 group-focus-visible:ring-[#CD9F5B] bg-[#382518]">
          <div className="w-full flex items-center justify-end text-[7px] sm:text-[8px] text-[#CD9F5B]/90">
            <span className="font-mono opacity-80">#{cardIdx + 1}</span>
          </div>
          <div className="gold-foil-sheen absolute inset-0 opacity-20 group-hover:opacity-50 transition-opacity pointer-events-none" />
        </div>
      </motion.div>
    );
  }
);
FanCard.displayName = "FanCard";

const TOTAL_CARDS = 78;

export const InteractiveCardFan: React.FC<InteractiveCardFanProps> = ({
  totalCards = TOTAL_CARDS,
  pickedIndices,
  targetCount,
  currentPositionName = "ตำแหน่งถัดไป",
  onPickCard,
  disabled = false,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isComplete = pickedIndices.length >= targetCount;

  // Split 78 cards into 3 cascading tiers (26 cards each)
  const tiers = useMemo(() => {
    const t1: number[] = [];
    const t2: number[] = [];
    const t3: number[] = [];
    for (let i = 0; i < totalCards; i++) {
      if (i < 26) t1.push(i);
      else if (i < 52) t2.push(i);
      else t3.push(i);
    }
    return [t1, t2, t3];
  }, [totalCards]);

  const handleCardClick = (idx: number) => {
    if (disabled || isComplete || pickedIndices.includes(idx)) return;
    soundManager.playCardSelectSound(pickedIndices.length);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(30);
    }
    onPickCard(idx);
  };

  // P1-U6: Accessible Auto-Pick Fallback (Randomly select next card)
  const handleAutoPick = () => {
    if (disabled || isComplete) return;
    const available = Array.from({ length: totalCards }, (_, i) => i).filter(
      (idx) => !pickedIndices.includes(idx)
    );
    if (available.length === 0) return;
    const randomIdx = available[Math.floor(Math.random() * available.length)];
    handleCardClick(randomIdx);
  };

  return (
    <div className="w-full flex flex-col items-center select-none space-y-3.5 sm:space-y-6">
      {/* Top Sacred Guidance & Target Slot Focus */}
      <div className="text-center space-y-1.5 relative z-10 px-3">
        {!isComplete ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-1.5"
          >
            {/* Status Pill Badge — Warm Minimalist Luxury */}
            <div className="inline-flex items-center gap-2 bg-[#FDF7F0] border border-[#D6B48D] px-3.5 sm:px-5 py-1 sm:py-1.5 rounded-full shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#CD9F5B] animate-ping" />
              <span className="text-[11px] sm:text-xs font-serif-th font-bold text-[#5A432F]">
                เลือกไพ่ใบที่ {pickedIndices.length + 1} จากทั้งหมด {targetCount} ใบ
              </span>
            </div>

            {/* Position Heading with Inline Non-Breaking Quotes */}
            <h3 className="text-lg sm:text-3xl font-serif-th font-bold font-mystic-gold tracking-wide drop-shadow leading-snug py-0.5 px-2">
              เลือกไพ่สำหรับ{" "}
              <span className="text-[#CD9F5B] inline-block font-bold">
                &ldquo;{currentPositionName}&rdquo;
              </span>
            </h3>
            <p className="text-[11px] sm:text-xs text-[#8C735D] max-w-xl mx-auto leading-normal">
              แตะเลือกไพ่ใบที่คุณรู้สึกถูกชะตา หรือกดปุ่ม &ldquo;สุ่มเลือกให้ฉัน&rdquo; ด้านล่าง
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-1 py-1"
          >
            <h3 className="text-lg sm:text-2xl font-serif-th font-bold font-mystic-gold flex items-center justify-center gap-2">
              <span>✨</span> เลือกไพ่ครบ {targetCount} ใบเรียบร้อยแล้ว <span>✨</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-[#8C735D]">
              กำลังเตรียมเปิดไพ่และคำทำนายของคุณ...
            </p>
          </motion.div>
        )}
      </div>

      {/* Unified Masterpiece Altar Stage (No Row-Level Clipping) */}
      <div className="w-full relative rounded-[1.618rem] border border-[#D6B48D] bg-[#FDF7F0] shadow-md overflow-hidden">
        {/* Background Sacred Geometric Mandala */}
        <div className="absolute inset-0 flex items-center justify-center opacity-25 pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full border border-dashed border-[#D6B48D] animate-[spin_160s_linear_infinite]" />
          <div className="absolute w-[420px] h-[420px] rounded-full border border-[#CD9F5B]/30 animate-[spin_100s_linear_infinite_reverse]" />
          <div className="absolute w-full h-full bg-radial from-[#CD9F5B]/10 via-transparent to-transparent blur-3xl" />
        </div>

        {/* Mobile Edge Fade Masks */}
        <div className="absolute top-0 bottom-0 left-0 w-6 bg-gradient-to-r from-[#FDF7F0] to-transparent pointer-events-none z-20 sm:hidden" />
        <div className="absolute top-0 bottom-0 right-0 w-6 bg-gradient-to-l from-[#FDF7F0] to-transparent pointer-events-none z-20 sm:hidden" />

        {/* SINGLE UNIFIED SCROLL CONTAINER FOR ALL 3 TIERS (P1-U10 overscroll-contain) */}
        <div
          ref={scrollContainerRef}
          className="w-full overflow-x-auto custom-scrollbar pt-6 pb-6 sm:pt-10 sm:pb-8 px-4 sm:px-8 relative z-10 overscroll-x-contain"
        >
          <div className="min-w-max mx-auto flex flex-col items-center gap-3.5 sm:gap-6 py-1">
            {tiers.map((tierCards, tierIdx) => {
              const tierOffsetClass =
                tierIdx === 1
                  ? "pl-6 sm:pl-10"
                  : tierIdx === 2
                  ? "pl-12 sm:pl-20"
                  : "pl-0";

              return (
                <div
                  key={tierIdx}
                  className={`flex items-center justify-center -space-x-3.5 sm:-space-x-5 md:-space-x-6 relative ${tierOffsetClass}`}
                  style={{ zIndex: tierIdx * 30 }}
                >
                  <AnimatePresence>
                    {tierCards.map((cardIdx, posInTier) => (
                      <FanCard
                        key={cardIdx}
                        cardIdx={cardIdx}
                        posInTier={posInTier}
                        tierIdx={tierIdx}
                        isPicked={pickedIndices.includes(cardIdx)}
                        disabled={disabled}
                        onClick={handleCardClick}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Masterpiece Sacred Selection Slim Progress Dock */}
        <div className="border-t border-[#D6B48D]/30 bg-[#FCF0E6] p-3 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-5 relative z-20">
          {/* Left: Layered Sacred Deck Emblem & Status */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Tarot Deck Seal Icon */}
            <div className="relative w-9 h-12 sm:w-11 sm:h-15 flex-shrink-0 group">
              <div className="absolute inset-0 translate-x-1 -translate-y-0.5 rounded-lg bg-[#E4C09F] border border-[#D6B48D] shadow-xs transform rotate-4 opacity-70" />
              <div className="absolute inset-0 rounded-lg border-2 border-[#D6B48D] overflow-hidden shadow-xs bg-[#FDF7F0] transform -rotate-1 group-hover:rotate-0 transition-transform duration-300">
                <CardImage
                  image="major-01.jpg"
                  alt="Sacred Tarot Altar"
                  className="w-full h-full object-cover object-top tarot-hd-card-image"
                  sizes="72px"
                />
                <div className="gold-foil-sheen absolute inset-0 opacity-20 pointer-events-none" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#CD9F5B] border border-[#FDF7F0] shadow-xs flex items-center justify-center text-[7px] text-[#FDF7F0] font-bold">
                ✦
              </div>
            </div>

            {/* Typography & Animated Progress Bar */}
            <div className="space-y-1 flex-1 min-w-[160px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#5A432F] font-mono font-bold flex items-center gap-1">
                  <span className="text-[#CD9F5B]">✦</span>
                  <span>ความคืบหน้าพิธีจับไพ่</span>
                </span>
                <span className="text-[11px] sm:text-xs font-mono font-bold text-[#5A432F] bg-[#FFFFFF] border border-[#D6B48D] px-2 py-0.2 rounded-full shadow-xs">
                  {pickedIndices.length} / {targetCount}
                </span>
              </div>

              {/* Luminous Animated Progress Bar */}
              <div className="w-full h-1.5 sm:h-2 rounded-full bg-[#FFFFFF] border border-[#D6B48D] overflow-hidden p-0.5 relative">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: pickedIndices.length / targetCount }}
                  style={{ transformOrigin: "left" }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="h-full w-full rounded-full bg-gradient-to-r from-[#CD9F5B] via-[#E4C09F] to-[#CD9F5B] shadow-xs relative"
                >
                  <div className="absolute inset-0 bg-white/35 animate-[pulse_2s_infinite]" />
                </motion.div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] sm:text-[11px] text-[#8C735D] font-serif-th leading-tight truncate">
                  {isComplete ? (
                    <span className="text-emerald-600 font-semibold">✨ เลือกไพ่ครบถ้วนแล้ว พร้อมเปิดคำทำนาย</span>
                  ) : (
                    <span>
                      กำลังเลือกใบสำหรับ <strong className="text-[#5A432F]">&ldquo;{currentPositionName}&rdquo;</strong>
                    </span>
                  )}
                </p>

                {/* P1-U6: Auto-Pick fallback button for keyboard / assistive users */}
                {!isComplete && (
                  <button
                    type="button"
                    onClick={handleAutoPick}
                    disabled={disabled}
                    className="flex-shrink-0 text-[10px] sm:text-[11px] text-[#5A432F] hover:text-[#CD9F5B] bg-[#FFFFFF] hover:bg-[#FCF0E6] border border-[#D6B48D] hover:border-[#CD9F5B] px-2.5 py-0.5 rounded-lg transition-all cursor-pointer font-serif-th shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#CD9F5B]"
                    aria-label="สุ่มเลือกไพ่ใบถัดไปอัตโนมัติ"
                  >
                    ✦ สุ่มเลือกให้ฉัน
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right: Talisman Target Badges */}
          <div className="flex items-center gap-1.5 max-w-full overflow-x-auto pb-0.5 no-scrollbar w-full sm:w-auto justify-start sm:justify-end">
            {Array.from({ length: targetCount }).map((_, idx) => {
              const isFilled = idx < pickedIndices.length;
              const isCurrent = idx === pickedIndices.length;

              return (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.04 }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[10px] sm:text-xs transition-all duration-300 font-serif-th whitespace-nowrap select-none shadow-xs ${
                    isFilled
                      ? "bg-[#CD9F5B] text-[#FDF7F0] font-bold shadow-xs border border-[#D6B48D]"
                      : isCurrent
                      ? "bg-[#FFFFFF] border border-[#CD9F5B] text-[#5A432F] shadow-xs ring-1 ring-[#CD9F5B]/40 font-bold"
                      : "bg-[#FCF0E6] border border-[#D6B48D]/50 text-[#8C735D]/50"
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-mono font-bold ${
                      isFilled
                        ? "bg-[#FDF7F0] text-[#5A432F]"
                        : isCurrent
                        ? "bg-[#CD9F5B] text-[#FDF7F0]"
                        : "bg-[#E4C09F]/30 text-[#8C735D]"
                    }`}
                  >
                    {isFilled ? "✓" : idx + 1}
                  </div>
                  <span className="text-[10px] sm:text-[11px] tracking-wide">ใบที่ {idx + 1}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
