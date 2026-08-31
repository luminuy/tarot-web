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

const TOTAL_CARDS = 78;

export const InteractiveCardFan: React.FC<InteractiveCardFanProps> = ({
  totalCards = TOTAL_CARDS,
  pickedIndices,
  targetCount,
  currentPositionName = "ตำแหน่งถัดไป",
  onPickCard,
  disabled = false,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
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
    soundManager.playCardSelectSound();
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(30);
    }
    onPickCard(idx);
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
            {/* Status Pill Badge */}
            <div className="inline-flex items-center gap-2 bg-[#140d28]/95 border border-[#e5c07b]/40 px-3.5 sm:px-5 py-1 sm:py-1.5 rounded-full shadow-[0_0_25px_rgba(229,192,123,0.25)]">
              <span className="w-2 h-2 rounded-full bg-[#e5c07b] animate-ping" />
              <span className="text-[11px] sm:text-xs font-serif-th font-bold text-[#f5deaa]">
                เลือกไพ่ใบที่ {pickedIndices.length + 1} จากทั้งหมด {targetCount} ใบ
              </span>
            </div>

            {/* Position Heading with Inline Non-Breaking Quotes */}
            <h3 className="text-lg sm:text-3xl font-serif-th font-bold font-mystic-gold tracking-wide filter drop-shadow leading-snug py-0.5 px-2">
              เลือกไพ่สำหรับ{" "}
              <span className="text-[#f5deaa] inline-block font-bold">
                &ldquo;{currentPositionName}&rdquo;
              </span>
            </h3>
            <p className="text-[11px] sm:text-xs text-[#9c93b8] max-w-xl mx-auto leading-normal">
              แตะเลือกไพ่ใบที่คุณรู้สึกถูกชะตาหรือดึงดูดสายตาคุณมากที่สุด
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
            <p className="text-[11px] sm:text-xs text-[#9c93b8]">
              กำลังเตรียมเปิดไพ่และคำทำนายของคุณ...
            </p>
          </motion.div>
        )}
      </div>

      {/* Unified Masterpiece Altar Stage (No Row-Level Clipping) */}
      <div className="w-full relative rounded-2xl sm:rounded-3xl border border-[#e5c07b]/35 bg-gradient-to-b from-[#140d28]/95 via-[#0a0714]/95 to-[#05040a]/95 backdrop-blur-2xl shadow-[0_0_70px_rgba(0,0,0,0.95)] overflow-hidden">
        {/* Background Sacred Geometric Mandala */}
        <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full border border-dashed border-[#e5c07b] animate-[spin_160s_linear_infinite]" />
          <div className="absolute w-[420px] h-[420px] rounded-full border border-[#8b5cf6]/40 animate-[spin_100s_linear_infinite_reverse]" />
          <div className="absolute w-full h-full bg-radial from-[#e5c07b]/15 via-transparent to-transparent blur-3xl" />
        </div>

        {/*
          SINGLE UNIFIED SCROLL CONTAINER FOR ALL 3 TIERS
          - Perfectly proportioned for mobile & desktop
          - Smooth touch panning with zero vertical scroll interference
        */}
        <div
          ref={scrollContainerRef}
          className="w-full overflow-x-auto custom-scrollbar pt-6 pb-6 sm:pt-10 sm:pb-8 px-4 sm:px-8 relative z-10"
        >
          <div className="min-w-max mx-auto flex flex-col items-center gap-3.5 sm:gap-6 py-1">
            {tiers.map((tierCards, tierIdx) => {
              // Offset tiers organically for staggered fan aesthetic
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
                  {tierCards.map((cardIdx, posInTier) => {
                    const isPicked = pickedIndices.includes(cardIdx);
                    const isHovered = hoveredIdx === cardIdx;
                    // Natural subtle fan angle
                    const angle = ((posInTier % 9) - 4) * 1.3;

                    return (
                      <AnimatePresence key={cardIdx}>
                        {!isPicked ? (
                          <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{
                              opacity: 1,
                              y: isHovered ? -22 : 0,
                              scale: isHovered ? 1.18 : 1,
                              rotate: isHovered ? 0 : angle,
                            }}
                            exit={{
                              opacity: 0,
                              y: -140,
                              scale: 0.3,
                              rotate: 180,
                              transition: { duration: 0.4, ease: "easeInOut" },
                            }}
                            whileHover={{ y: -26, scale: 1.22 }}
                            whileTap={{ scale: 0.93 }}
                            onPointerEnter={() => !disabled && setHoveredIdx(cardIdx)}
                            onPointerLeave={() => setHoveredIdx(null)}
                            onClick={() => handleCardClick(cardIdx)}
                            className="cursor-pointer relative select-none flex-shrink-0 w-[46px] sm:w-[66px] md:w-[74px]"
                            style={{
                              zIndex: isHovered ? 200 : tierIdx * 40 + posInTier,
                            }}
                          >
                            {/* Authentic Gold Tarot Back Tablet */}
                            <div
                              className={`w-[46px] h-[78px] sm:w-[66px] sm:h-[112px] md:w-[74px] md:h-[124px] rounded-xl sm:rounded-2xl border-2 card-back-pattern shadow-xl flex flex-col items-center justify-between p-1 sm:p-1.5 relative overflow-hidden transition-all duration-300 ${
                                isHovered
                                  ? "border-[#ffd700] ring-3 ring-[#ffd700]/80 shadow-[0_0_35px_rgba(255,215,0,0.9),0_0_50px_rgba(168,85,247,0.6)] bg-[#251842]"
                                  : "border-[#e5c07b]/45 shadow-[0_6px_16px_rgba(0,0,0,0.85)] bg-[#0d0918]"
                              }`}
                            >
                              <div className="w-full flex items-center justify-end text-[7px] sm:text-[8px] text-[#e5c07b]/80">
                                <span className="font-mono opacity-60">#{cardIdx + 1}</span>
                              </div>

                              {/* Dynamic Gold Sheen */}
                              <div className="gold-foil-sheen absolute inset-0 opacity-30 hover:opacity-75 transition-opacity pointer-events-none" />
                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Masterpiece Sacred Selection Slim Progress Dock */}
        <div className="border-t border-[#e5c07b]/25 bg-[#090614]/90 p-3 sm:p-5 backdrop-blur-2xl flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-5 relative z-20">
          {/* Left: Layered Sacred Deck Emblem & Status */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Tarot Deck Seal Icon */}
            <div className="relative w-9 h-12 sm:w-11 sm:h-15 flex-shrink-0 group">
              <div className="absolute inset-0 translate-x-1 -translate-y-0.5 rounded-lg bg-[#19102e] border border-[#e5c07b]/30 shadow transform rotate-4 opacity-70" />
              <div className="absolute inset-0 rounded-lg border-2 border-[#e5c07b] overflow-hidden shadow-[0_0_15px_rgba(229,192,123,0.45)] bg-[#07050d] transform -rotate-1 group-hover:rotate-0 transition-transform duration-300">
                <CardImage
                  image="major-01.jpg"
                  alt="Sacred Tarot Altar"
                  className="w-full h-full object-cover object-top filter contrast-[1.08] saturate-[1.08] brightness-[1.03] tarot-hd-card-image"
                  sizes="72px"
                />
                <div className="gold-foil-sheen absolute inset-0 opacity-40 pointer-events-none" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gradient-to-r from-[#ffd700] to-[#e5c07b] border border-[#05040a] shadow-[0_0_6px_#ffd700] flex items-center justify-center text-[7px] text-[#05040a] font-bold">
                ✦
              </div>
            </div>

            {/* Typography & Animated Progress Bar */}
            <div className="space-y-1 flex-1 min-w-[160px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#e5c07b] font-mono font-bold flex items-center gap-1">
                  <span>✦</span>
                  <span>ความคืบหน้าพิธีจับไพ่</span>
                </span>
                <span className="text-[11px] sm:text-xs font-mono font-bold text-[#f5deaa] bg-[#1a1130] border border-[#e5c07b]/30 px-2 py-0.2 rounded-full shadow-inner">
                  {pickedIndices.length} / {targetCount}
                </span>
              </div>

              {/* Luminous Animated Progress Bar */}
              <div className="w-full h-1.5 sm:h-2 rounded-full bg-[#0d081a] border border-[#e5c07b]/25 overflow-hidden p-0.5 relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(pickedIndices.length / targetCount) * 100}%` }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-[#c59b27] via-[#f5deaa] to-[#ffd700] shadow-[0_0_10px_rgba(255,215,0,0.8)] relative"
                >
                  <div className="absolute inset-0 bg-white/25 animate-[pulse_2s_infinite]" />
                </motion.div>
              </div>

              <p className="text-[10px] sm:text-[11px] text-[#9c93b8] font-serif-th leading-tight truncate">
                {isComplete ? (
                  <span className="text-emerald-400 font-semibold">✨ เลือกไพ่ครบถ้วนแล้ว พร้อมเปิดคำทำนาย</span>
                ) : (
                  <span>
                    กำลังเลือกใบสำหรับ <strong className="text-[#f5deaa]">&ldquo;{currentPositionName}&rdquo;</strong>
                  </span>
                )}
              </p>
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
                  className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[10px] sm:text-xs transition-all duration-300 font-serif-th whitespace-nowrap select-none shadow-sm ${
                    isFilled
                      ? "bg-gradient-to-r from-[#c59b27] via-[#f5deaa] to-[#e5c07b] text-[#05040a] font-bold shadow-[0_0_12px_rgba(229,192,123,0.5)] border border-[#fff0d4]"
                      : isCurrent
                      ? "bg-gradient-to-br from-[#251842] to-[#120b22] border border-[#ffd700] text-[#f5deaa] shadow-[0_0_15px_rgba(229,192,123,0.4)] ring-1 ring-[#e5c07b]/40 font-bold"
                      : "bg-[#0c0818]/90 border border-[#e5c07b]/20 text-[#9c93b8]/40"
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-mono font-bold ${
                      isFilled
                        ? "bg-[#05040a] text-[#ffd700]"
                        : isCurrent
                        ? "bg-[#e5c07b] text-[#05040a]"
                        : "bg-[#18112c] text-[#9c93b8]/50"
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
