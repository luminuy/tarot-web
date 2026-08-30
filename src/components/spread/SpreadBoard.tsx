"use client";

import React from "react";
import { motion } from "motion/react";
import type { Spread, SpreadPosition } from "@/data/spreads";
import { TarotCard } from "@/components/card/TarotCard";
import { soundManager } from "@/lib/utils/audio";

export interface DrawnSlotCard {
  order: number;
  cardIndex: number;
  isReversed: boolean;
  position: SpreadPosition;
  card?: {
    id: string;
    nameTh: string;
    nameEn: string;
    image: string;
    element: string;
    keywords: string[];
    astrology?: string;
    numerology?: string;
  };
}

interface SpreadBoardProps {
  spread: Spread;
  drawnCards: DrawnSlotCard[];
  revealedOrders: number[];
  currentReadingPosition?: number;
  onFlipCard?: (order: number) => void;
  onRevealAll?: () => void;
  onZoomCard?: (card: DrawnSlotCard) => void;
  compact?: boolean;
}

export const SpreadBoard: React.FC<SpreadBoardProps> = ({
  spread,
  drawnCards,
  revealedOrders,
  currentReadingPosition,
  onFlipCard,
  onRevealAll,
  onZoomCard,
}) => {
  const handleCardClick = (order: number) => {
    soundManager.playCardFlipSound();
    if (onFlipCard) onFlipCard(order);
  };

  const isAllRevealed = drawnCards.length > 0 && revealedOrders.length === drawnCards.length;

  return (
    <div className="w-full rounded-3xl border border-[#e5c07b]/35 bg-gradient-to-b from-[#140d28]/95 via-[#0a0714]/95 to-[#05040a]/95 backdrop-blur-2xl p-5 sm:p-7 shadow-[0_0_50px_rgba(0,0,0,0.85)] flex flex-col justify-between space-y-5 select-none relative overflow-hidden">
      {/* Background Sacred Geometric Mandala */}
      <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none">
        <div className="w-80 h-80 sm:w-[480px] sm:h-[480px] rounded-full border border-dashed border-[#e5c07b] animate-[spin_120s_linear_infinite]" />
        <div className="absolute w-56 h-56 sm:w-[320px] sm:h-[320px] rounded-full border border-[#8b5cf6]/40 animate-[spin_80s_linear_infinite_reverse]" />
        <div className="absolute w-full h-full bg-radial from-[#e5c07b]/10 via-transparent to-transparent blur-3xl" />
      </div>

      {/* Header Bar: Spread Name & Quick Flip Button */}
      <div className="flex items-center justify-between pb-3 border-b border-[#e5c07b]/20 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-[#e5c07b] font-mono">ผังพยากรณ์:</span>
            <span className="text-xs text-[#05040a] bg-gradient-to-r from-[#c59b27] to-[#f5deaa] px-2 py-0.2 rounded-full font-bold font-mono shadow">
              {spread.positions.length} ใบ
            </span>
          </div>
          <h3 className="font-serif-th text-base sm:text-lg font-bold text-[#f5deaa] mt-0.5">
            {spread.nameTh}
          </h3>
        </div>

        {/* Reveal All Cards Action Button */}
        {onRevealAll && drawnCards.length > 0 && (
          <button
            type="button"
            onClick={onRevealAll}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-serif-th font-semibold border transition-all cursor-pointer flex items-center gap-1.5 shadow ${
              isAllRevealed
                ? "bg-[#100b20] border-[#e5c07b]/30 text-[#9c93b8]"
                : "bg-gradient-to-r from-[#c59b27] via-[#f5deaa] to-[#e5c07b] text-[#05040a] font-bold border-transparent shadow-[0_0_15px_rgba(229,192,123,0.4)] hover:opacity-90"
            }`}
          >
            <span>✨</span>
            <span>{isAllRevealed ? "พลิกดูครบแล้ว" : "พลิกดูไพ่ทั้งหมด"}</span>
          </button>
        )}
      </div>

      {/* Interactive 3D Placed Cards Grid */}
      <div className="w-full flex-1 flex flex-wrap items-center justify-center gap-4 sm:gap-6 py-4 relative z-10 min-h-[300px]">
        {spread.positions.map((pos) => {
          const drawn = drawnCards.find((d) => d.order === pos.index);
          const isRevealed = revealedOrders.includes(pos.index);
          const isCurrentReading = currentReadingPosition === pos.index;

          return (
            <motion.div
              key={pos.index}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: pos.index * 0.06 }}
              className="flex flex-col items-center cursor-pointer"
              onClick={() => handleCardClick(pos.index)}
            >
              {/* Card Container with Active Glow */}
              <div
                className={`relative transition-all duration-300 rounded-2xl ${
                  isCurrentReading
                    ? "ring-4 ring-[#e5c07b] ring-offset-2 ring-offset-[#07040f] shadow-[0_0_30px_rgba(229,192,123,0.7)] scale-105"
                    : "hover:scale-105"
                }`}
              >
                {isRevealed && onZoomCard && drawn && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onZoomCard(drawn);
                    }}
                    className="absolute -top-2.5 -right-2.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-[#22153d]/95 to-[#100720]/95 hover:from-[#c59b27] hover:to-[#f5deaa] border border-[#e5c07b]/70 hover:border-[#ffd700] text-[#f5deaa] hover:text-[#05040a] shadow-[0_0_20px_rgba(0,0,0,0.95),0_0_12px_rgba(229,192,123,0.45)] backdrop-blur-xl transition-all duration-300 cursor-pointer flex items-center gap-1.5 z-30 group hover:scale-105 active:scale-95"
                    title="ซูมดูไพ่ 3D ความละเอียดสูง"
                  >
                    <span className="text-[10px] text-[#e5c07b] group-hover:text-[#05040a] transition-colors">⛶</span>
                    <span className="text-[9.5px] font-serif-th font-bold tracking-wide">ขยาย</span>
                  </button>
                )}

                {drawn ? (
                  <TarotCard
                    card={drawn.card || { cardIndex: drawn.cardIndex }}
                    isReversed={drawn.isReversed}
                    isRevealed={isRevealed}
                    isHighlighted={isCurrentReading}
                    className="w-24 h-[163px] sm:w-28 sm:h-[190px]"
                  />
                ) : (
                  <div className="w-24 h-[163px] sm:w-28 sm:h-[190px] rounded-2xl border-2 border-dashed border-[#e5c07b]/30 bg-[#07040f]/60 flex items-center justify-center text-xs text-[#9c93b8]">
                    {pos.index + 1}
                  </div>
                )}
              </div>

              {/* Slot Position Name Tag */}
              <div className="text-center mt-2.5 max-w-[120px]">
                <span className="text-[9px] text-[#e5c07b] font-mono block">
                  ใบที่ {pos.index + 1}
                </span>
                <span className="text-xs font-serif-th font-semibold text-[#f5deaa] leading-tight block truncate">
                  {pos.nameTh}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Helpful Hint */}
      <div className="text-center pt-2 border-t border-[#e5c07b]/15 text-[11px] text-[#9c93b8] relative z-10 flex items-center justify-center gap-1.5 font-serif-th">
        <span className="text-[#e5c07b]">✦</span>
        <span>แตะที่ใบไพ่บนผังเพื่อพลิกดู และสลับไปอ่านคำทำนายของใบนั้นทันที</span>
      </div>
    </div>
  );
};
