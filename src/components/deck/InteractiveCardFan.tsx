"use client";

import React, { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { soundManager } from "@/lib/utils/audio";

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
    <div className="w-full flex flex-col items-center select-none space-y-6">
      {/* Top Sacred Guidance & Target Slot Focus */}
      <div className="text-center space-y-2 relative z-10 px-4">
        {!isComplete ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="inline-flex items-center gap-2 bg-[#140d28]/95 border border-[#e5c07b]/40 px-5 py-2 rounded-full shadow-[0_0_30px_rgba(229,192,123,0.35)]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e5c07b] animate-ping" />
              <span className="text-xs sm:text-sm font-serif-th font-bold text-[#f5deaa]">
                เลือกไพ่ใบที่ {pickedIndices.length + 1} จากทั้งหมด {targetCount} ใบ
              </span>
            </div>

            <h3 className="text-2xl sm:text-4xl font-serif-th font-bold font-mystic-gold tracking-wide filter drop-shadow leading-relaxed py-1 px-2">
              เลือกไพ่สำหรับ <span className="text-[#f5deaa]">"{currentPositionName}"</span>
            </h3>
            <p className="text-xs sm:text-sm text-[#9c93b8] max-w-xl mx-auto leading-relaxed">
              แตะเลือกไพ่ใบที่คุณรู้สึกถูกชะตาหรือดึงดูดสายตาคุณมากที่สุด
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-1"
          >
            <h3 className="text-xl sm:text-3xl font-serif-th font-bold font-mystic-gold flex items-center justify-center gap-2">
              <span>✨</span> เลือกไพ่ครบ {targetCount} ใบเรียบร้อยแล้ว <span>✨</span>
            </h3>
            <p className="text-xs sm:text-sm text-[#9c93b8]">
              กำลังเตรียมเปิดไพ่และคำทำนายของคุณ...
            </p>
          </motion.div>
        )}
      </div>

      {/* Unified Masterpiece Altar Stage (No Row-Level Clipping) */}
      <div className="w-full relative rounded-3xl border border-[#e5c07b]/35 bg-gradient-to-b from-[#140d28]/95 via-[#0a0714]/95 to-[#05040a]/95 backdrop-blur-2xl shadow-[0_0_70px_rgba(0,0,0,0.95)] overflow-hidden">
        {/* Background Sacred Geometric Mandala */}
        <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none">
          <div className="w-[700px] h-[700px] rounded-full border border-dashed border-[#e5c07b] animate-[spin_160s_linear_infinite]" />
          <div className="absolute w-[500px] h-[500px] rounded-full border border-[#8b5cf6]/40 animate-[spin_100s_linear_infinite_reverse]" />
          <div className="absolute w-full h-full bg-radial from-[#e5c07b]/15 via-transparent to-transparent blur-3xl" />
        </div>


        {/*
          SINGLE UNIFIED SCROLL CONTAINER FOR ALL 3 TIERS
          - No inner overflow containers on rows!
          - All tiers share one vertical space with ample pt-14 pb-14 padding
          - Cards elevate freely into the open canvas without hitting any borders!
        */}
        <div
          ref={scrollContainerRef}
          className="w-full overflow-x-auto custom-scrollbar pt-14 pb-12 px-6 sm:px-10 relative z-10"
        >
          <div className="min-w-max mx-auto flex flex-col items-center gap-6 sm:gap-7 py-2">
            {tiers.map((tierCards, tierIdx) => {
              // Offset tiers organically for staggered fan aesthetic
              const tierOffsetClass =
                tierIdx === 1
                  ? "pl-8 sm:pl-12"
                  : tierIdx === 2
                  ? "pl-16 sm:pl-24"
                  : "pl-0";

              return (
                <div
                  key={tierIdx}
                  className={`flex items-center justify-center -space-x-3 sm:-space-x-5 md:-space-x-6 relative ${tierOffsetClass}`}
                  style={{ zIndex: tierIdx * 30 }}
                >
                  {tierCards.map((cardIdx, posInTier) => {
                    const isPicked = pickedIndices.includes(cardIdx);
                    const isHovered = hoveredIdx === cardIdx;
                    // Natural subtle fan angle
                    const angle = ((posInTier % 9) - 4) * 1.4;

                    return (
                      <AnimatePresence key={cardIdx}>
                        {!isPicked ? (
                          <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{
                              opacity: 1,
                              y: isHovered ? -36 : 0,
                              scale: isHovered ? 1.25 : 1,
                              rotate: isHovered ? 0 : angle,
                            }}
                            exit={{
                              opacity: 0,
                              y: -180,
                              scale: 0.3,
                              rotate: 180,
                              transition: { duration: 0.45, ease: "easeInOut" },
                            }}
                            whileHover={{ y: -40, scale: 1.28 }}
                            whileTap={{ scale: 0.94 }}
                            onPointerEnter={() => !disabled && setHoveredIdx(cardIdx)}
                            onPointerLeave={() => setHoveredIdx(null)}
                            onClick={() => handleCardClick(cardIdx)}
                            className="cursor-pointer relative select-none flex-shrink-0"
                            style={{
                              width: "58px",
                              zIndex: isHovered ? 200 : tierIdx * 40 + posInTier,
                            }}
                          >
                            {/* Authentic Gold Tarot Back Tablet */}
                            <div
                              className={`w-[58px] h-[98px] sm:w-[68px] sm:h-[116px] md:w-[76px] md:h-[128px] rounded-2xl border-2 card-back-pattern shadow-2xl flex flex-col items-center justify-between p-1.5 sm:p-2 relative overflow-hidden transition-all duration-300 ${
                                isHovered
                                  ? "border-[#ffd700] ring-4 ring-[#ffd700]/80 shadow-[0_0_40px_rgba(255,215,0,0.9),0_0_60px_rgba(168,85,247,0.6)] bg-[#251842]"
                                  : "border-[#e5c07b]/45 shadow-[0_8px_20px_rgba(0,0,0,0.9)] bg-[#0d0918]"
                              }`}
                            >
                              <div className="w-full flex items-center justify-end text-[7.5px] sm:text-[8.5px] text-[#e5c07b]/80">
                                <span className="font-mono opacity-60">#{cardIdx + 1}</span>
                              </div>

                              {/* Dynamic Gold Sheen */}
                              <div className="gold-foil-sheen absolute inset-0 opacity-30 hover:opacity-75 transition-opacity" />
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

        {/* Masterpiece Sacred Selection Progress Dock */}
        <div className="border-t border-[#e5c07b]/25 bg-[#090614]/90 p-4 sm:p-6 backdrop-blur-2xl flex flex-col md:flex-row items-center justify-between gap-5 relative z-20">
          {/* Left: 3D Layered Sacred Deck Emblem & Status */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* 3D Layered Tarot Deck Seal Icon */}
            <div className="relative w-11 h-14 sm:w-12 sm:h-16 flex-shrink-0 group">
              {/* Back Deck Shadow */}
              <div className="absolute inset-0 translate-x-1.5 -translate-y-1 rounded-xl bg-[#19102e] border border-[#e5c07b]/30 shadow-md transform rotate-6 opacity-70" />

              {/* Front Primary 1909 Tarot Emblem */}
              <div className="absolute inset-0 rounded-xl border-2 border-[#e5c07b] overflow-hidden shadow-[0_0_20px_rgba(229,192,123,0.45)] bg-[#07050d] transform -rotate-2 group-hover:rotate-0 transition-transform duration-300">
                <img
                  src="/cards/major-01.jpg"
                  alt="Sacred Tarot Altar"
                  className="w-full h-full object-cover object-top filter contrast-[1.08] brightness-[1.02]"
                />
                <div className="gold-foil-sheen absolute inset-0 opacity-40" />
              </div>

              {/* Glowing Halo Star */}
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-gradient-to-r from-[#ffd700] to-[#e5c07b] border border-[#05040a] shadow-[0_0_8px_#ffd700] flex items-center justify-center text-[8px] text-[#05040a] font-bold">
                ✦
              </div>
            </div>

            {/* Typography & Animated Progress Bar */}
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-[#e5c07b] font-mono font-bold flex items-center gap-1.5">
                  <span>✦</span>
                  <span>ความคืบหน้าพิธีจับไพ่</span>
                </span>
                <span className="text-xs font-mono font-bold text-[#f5deaa] bg-[#1a1130] border border-[#e5c07b]/30 px-2.5 py-0.5 rounded-full shadow-inner">
                  {pickedIndices.length} / {targetCount}
                </span>
              </div>

              {/* Luminous Animated Progress Bar */}
              <div className="w-full h-2 rounded-full bg-[#0d081a] border border-[#e5c07b]/25 overflow-hidden p-0.5 relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(pickedIndices.length / targetCount) * 100}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-[#c59b27] via-[#f5deaa] to-[#ffd700] shadow-[0_0_12px_rgba(255,215,0,0.8)] relative"
                >
                  <div className="absolute inset-0 bg-white/25 animate-[pulse_2s_infinite]" />
                </motion.div>
              </div>

              <p className="text-[11px] text-[#9c93b8] font-serif-th leading-tight">
                {isComplete ? (
                  <span className="text-emerald-400 font-semibold">✨ เลือกไพ่ครบถ้วนแล้ว พร้อมเปิดม่านคำทำนาย</span>
                ) : (
                  <span>
                    กำลังเลือกใบสำหรับ <strong className="text-[#f5deaa]">"{currentPositionName}"</strong>
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Right: World-Class Talisman Target Badges */}
          <div className="flex items-center gap-2 max-w-full overflow-x-auto pb-1 no-scrollbar w-full md:w-auto justify-start md:justify-end">
            {Array.from({ length: targetCount }).map((_, idx) => {
              const isFilled = idx < pickedIndices.length;
              const isCurrent = idx === pickedIndices.length;

              return (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.04 }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs transition-all duration-300 font-serif-th whitespace-nowrap select-none shadow-md ${
                    isFilled
                      ? "bg-gradient-to-r from-[#c59b27] via-[#f5deaa] to-[#e5c07b] text-[#05040a] font-bold shadow-[0_0_16px_rgba(229,192,123,0.55)] border border-[#fff0d4]"
                      : isCurrent
                      ? "bg-gradient-to-br from-[#251842] to-[#120b22] border-2 border-[#ffd700] text-[#f5deaa] shadow-[0_0_20px_rgba(229,192,123,0.45)] ring-2 ring-[#e5c07b]/40 font-bold"
                      : "bg-[#0c0818]/90 border border-[#e5c07b]/20 text-[#9c93b8]/40"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono font-bold ${
                      isFilled
                        ? "bg-[#05040a] text-[#ffd700]"
                        : isCurrent
                        ? "bg-[#e5c07b] text-[#05040a] animate-ping"
                        : "bg-[#18112c] text-[#9c93b8]/50"
                    }`}
                  >
                    {isFilled ? "✓" : idx + 1}
                  </div>
                  <span className="text-[11px] tracking-wide">ใบที่ {idx + 1}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
