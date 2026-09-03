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

/**
 * ผังตั้งแต่กี่ใบขึ้นไปถึงจะเปลี่ยนจากแท่นบูชาแบบตัดบรรทัด (wrap) มาเป็น "รางเลื่อนแนวนอน"
 * เหตุผล: ผังใหญ่ (เช่น เซลติกครอส 10 ใบ) ในคอลัมน์ซ้ายที่แคบจะตัดบรรทัดเหลือแถวละ 2 ใบ
 * ทำให้แผงสูงเกิน 1,000px ผู้ใช้ต้องเลื่อนหน้าจอยาวมากกว่าจะพ้นผังไพ่ (คำร้องเจ้าของโปรเจกต์)
 */
const RAIL_THRESHOLD = 6;

export const SpreadBoard: React.FC<SpreadBoardProps> = ({
  spread,
  drawnCards,
  revealedOrders,
  currentReadingPosition,
  onFlipCard,
  onRevealAll,
  onZoomCard,
}) => {
  const railRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const useRail = spread.positions.length >= RAIL_THRESHOLD;

  const handleCardClick = (order: number) => {
    soundManager.playCardFlipSound();
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(15);
    }
    if (onFlipCard) onFlipCard(order);
  };

  const syncRailEdges = React.useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    setCanScrollLeft(rail.scrollLeft > 8);
    setCanScrollRight(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 8);
  }, []);

  React.useEffect(() => {
    if (!useRail) return;
    syncRailEdges();
    const rail = railRef.current;
    if (!rail) return;
    const onResize = () => syncRailEdges();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [useRail, syncRailEdges, spread.positions.length]);

  const prefersReducedMotion = () =>
    typeof window !== "undefined" &&
    !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  /**
   * เลื่อน "เฉพาะราง" ให้เห็นไพ่ใบที่กำลังอ่าน — ห้ามใช้ scrollIntoView เด็ดขาด
   * เพราะมันจะดึงทั้งหน้าจอเลื่อนตามไปด้วย (บทเรียนเดียวกับกล่องแชทถามแม่หมอ)
   */
  React.useEffect(() => {
    if (!useRail || currentReadingPosition === undefined) return;
    const rail = railRef.current;
    if (!rail) return;
    const slot = rail.querySelector<HTMLElement>(`[data-slot-order="${currentReadingPosition}"]`);
    if (!slot) return;
    const target = slot.offsetLeft - (rail.clientWidth - slot.clientWidth) / 2;
    rail.scrollTo({
      left: Math.max(0, target),
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, [currentReadingPosition, useRail]);

  const nudgeRail = (direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    const step = rail.clientWidth * 0.7;
    rail.scrollBy({
      left: direction * step,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  };

  const isAllRevealed = drawnCards.length > 0 && revealedOrders.length === drawnCards.length;

  const renderSlot = (pos: SpreadPosition) => {
    const drawn = drawnCards.find((d) => d.order === pos.index);
    const isRevealed = revealedOrders.includes(pos.index);
    const isCurrentReading = currentReadingPosition === pos.index;

    return (
      <motion.div
        key={pos.index}
        data-slot-order={pos.index}
        role="button"
        tabIndex={0}
        aria-label={`ตำแหน่งที่ ${pos.index + 1}: ${pos.nameTh} - ${isRevealed ? (drawn?.card?.nameTh || "เปิดไพ่แล้ว") : "แตะหรือกดเพื่อเปิดไพ่"}`}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: pos.index * 0.06 }}
        className={`flex flex-col items-center cursor-pointer focus-visible:outline-none group rounded-2xl ${
          useRail ? "snap-center flex-shrink-0" : ""
        }`}
        onClick={() => handleCardClick(pos.index)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCardClick(pos.index);
          }
        }}
      >
        {/* Card Container with Active Glow */}
        <div
          className={`relative transition-all duration-300 rounded-2xl group-focus-visible:ring-2 group-focus-visible:ring-[#ffd700] ${
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
              className="absolute -top-2.5 -right-2.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-[#22153d]/95 to-[#100720]/95 hover:from-[#c59b27] hover:to-[#f5deaa] border border-[#e5c07b]/70 hover:border-[#ffd700] text-[#f5deaa] hover:text-[#05040a] shadow-[0_0_20px_rgba(0,0,0,0.95),0_0_12px_rgba(229,192,123,0.45)] transition-all duration-300 cursor-pointer flex items-center gap-1.5 z-30 group hover:scale-105 active:scale-95"
              title="ซูมดูไพ่ 3D ความละเอียดสูง"
            >
              <span className="text-[10px] text-[#e5c07b] group-hover:text-[#05040a] transition-colors">⛶</span>
              <span className="text-[9.5px] font-serif-th font-bold tracking-wide">ขยาย</span>
            </button>
          )}

          {drawn ? (
            <TarotCard
              imageSizes="(min-width: 640px) 112px, 96px"
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
        <div className="text-center mt-2.5 w-24 sm:w-28">
          <span className="text-[9px] text-[#e5c07b] font-mono block">
            ใบที่ {pos.index + 1}
          </span>
          <span className="text-xs font-serif-th font-semibold text-[#f5deaa] leading-tight block truncate">
            {pos.nameTh}
          </span>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="w-full rounded-[1.618rem] border border-[#D6B48D] bg-[#FDF7F0] p-5 sm:p-7 shadow-md flex flex-col justify-between space-y-5 select-none relative overflow-hidden">
      {/* Background Sacred Geometric Mandala */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
        <div className="w-80 h-80 sm:w-[480px] sm:h-[480px] rounded-full border border-dashed border-[#D6B48D] animate-[spin_120s_linear_infinite]" />
        <div className="absolute w-56 h-56 sm:w-[320px] sm:h-[320px] rounded-full border border-[#CD9F5B]/30 animate-[spin_80s_linear_infinite_reverse]" />
        <div className="absolute w-full h-full bg-radial from-[#CD9F5B]/10 via-transparent to-transparent blur-3xl" />
      </div>

      {/* Header Bar: Spread Name & Quick Flip Button */}
      <div className="flex items-center justify-between pb-3 border-b border-[#D6B48D]/30 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-[#8C735D] font-mono">ผังพยากรณ์:</span>
            <span className="text-xs text-[#FDF7F0] bg-[#CD9F5B] px-2 py-0.2 rounded-full font-bold font-mono shadow-xs">
              {spread.positions.length} ใบ
            </span>
          </div>
          <h3 className="font-serif-th text-base sm:text-lg font-bold text-[#5A432F] mt-0.5">
            {spread.nameTh}
          </h3>
        </div>

        {/* Reveal All Cards Action Button */}
        {onRevealAll && drawnCards.length > 0 && (
          <button
            type="button"
            onClick={onRevealAll}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-serif-th font-semibold border transition-all cursor-pointer flex items-center gap-1.5 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CD9F5B] ${
              isAllRevealed
                ? "bg-[#FCF0E6] border-[#D6B48D] text-[#8C735D]"
                : "bg-[#CD9F5B] hover:bg-[#B8853E] text-[#FDF7F0] font-bold border-transparent shadow-xs"
            }`}
          >
            <span>✨</span>
            <span>{isAllRevealed ? "พลิกดูครบแล้ว" : "พลิกดูไพ่ทั้งหมด"}</span>
          </button>
        )}
      </div>

      {useRail ? (
        /* ── ผังใหญ่: รางเลื่อนแนวนอนผืนเดียว (Unified Rail) ── */
        <div className="relative z-10">
          <div
            ref={railRef}
            onScroll={syncRailEdges}
            className="flex snap-x snap-mandatory items-start gap-4 sm:gap-6 overflow-x-auto overscroll-x-contain px-6 py-6 no-scrollbar"
            role="group"
            aria-label={`ไพ่ทั้ง ${spread.positions.length} ใบในผัง ${spread.nameTh} — ปัดซ้ายขวาเพื่อดูใบอื่น`}
          >
            {spread.positions.map((pos) => renderSlot(pos))}
          </div>

          {/* ขอบจางซ้าย/ขวา บอกใบ้ว่ายังมีไพ่ต่อไปอีก */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#FDF7F0] to-transparent transition-opacity duration-300 ${
              canScrollLeft ? "opacity-100" : "opacity-0"
            }`}
          />
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#FDF7F0] to-transparent transition-opacity duration-300 ${
              canScrollRight ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* ปุ่มเลื่อนสำหรับเมาส์/คีย์บอร์ด */}
          <button
            type="button"
            onClick={() => nudgeRail(-1)}
            disabled={!canScrollLeft}
            aria-label="เลื่อนดูไพ่ทางซ้าย"
            className={`absolute left-0 top-[45%] -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-[#D6B48D] bg-[#FCF0E6] text-[#5A432F] shadow-md transition-all hover:bg-[#FFFFFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CD9F5B] ${
              canScrollLeft ? "cursor-pointer opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => nudgeRail(1)}
            disabled={!canScrollRight}
            aria-label="เลื่อนดูไพ่ทางขวา"
            className={`absolute right-0 top-[45%] -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-[#D6B48D] bg-[#FCF0E6] text-[#5A432F] shadow-md transition-all hover:bg-[#FFFFFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CD9F5B] ${
              canScrollRight ? "cursor-pointer opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            →
          </button>
        </div>
      ) : (
        /* ── ผังเล็ก: แท่นบูชา Unified Canvas แบบเดิม เห็นครบทุกใบในตาเดียว ── */
        <div className="w-full flex-1 flex flex-wrap items-center justify-center gap-4 sm:gap-6 py-4 relative z-10 min-h-[300px]">
          {spread.positions.map((pos) => renderSlot(pos))}
        </div>
      )}

      {/* Helpful Hint */}
      <div className="text-center pt-2 border-t border-[#D6B48D]/30 text-[11px] text-[#8C735D] relative z-10 flex items-center justify-center gap-1.5 font-serif-th">
        <span className="text-[#CD9F5B]">✦</span>
        <span>
          {useRail
            ? "ปัดซ้าย–ขวาเพื่อดูไพ่ใบอื่น แตะที่การ์ดเพื่อพลิกดูหน้าไพ่"
            : "แตะที่การ์ดเพื่อพลิกดูหน้าไพ่ หรือเลือกอ่านคำทำนายของใบนั้น"}
        </span>
      </div>
    </div>
  );
};
