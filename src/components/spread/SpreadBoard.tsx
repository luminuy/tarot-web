"use client";

import React from "react";
import { motion } from "motion/react";
import type { Spread, SpreadPosition } from "@/data/spreads-helpers";
import { getSpreadName, getPositionName } from "@/data/spreads-helpers";
import { TarotCard } from "@/components/card/TarotCard";
import { soundManager } from "@/lib/utils/audio";
import { useLocale } from "@/lib/i18n";
import { ExpandTabIcon } from "@/components/ui/TarotArtIcons";
import { useMotionSafe } from "@/lib/use-motion-safe";
import { useNarrowViewport } from "@/lib/use-narrow-viewport";

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
  const { isEnglish } = useLocale();
  const railRef = React.useRef<HTMLDivElement>(null);
  /* ♿ R-03: ตรรกะ "ผู้ใช้ขอลดการเคลื่อนไหวไหม" ต้องมาจากที่เดียวทั้งเว็บ
     ของเดิมเขียน matchMedia เองแบบ inline ที่นี่ ทั้งที่ StreamReader ย้ายมาใช้ฮุกนี้แล้ว
     สองที่ที่เขียนเงื่อนไขเดียวกันเอง = วันหนึ่งจะตอบไม่ตรงกันโดยไม่มีใครรู้ */
  const motionSafe = useMotionSafe();
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  /**
   * 📱 บนมือถือให้ผังไพ่เป็น "รางเลื่อนทีละใบ" เสมอ ไม่ว่าผังจะกี่ใบ (คำสั่งเจ้าของ รอบ 134)
   *
   * ทำไมถึงคุ้มกว่าการวางให้ครบในตาเดียว — วัดจากการเรนเดอร์จริงที่ 320–430px:
   *   • ที่ความกว้างเหล่านั้น แผงมีที่ให้ไพ่แถวละ **2 ใบ** เท่านั้น
   *     ผัง 3 ใบจึงตัดบรรทัดเป็น 2+1 อยู่แล้ว — "เห็นผังครบในตาเดียว" จึงไม่เคยเกิดขึ้นจริงบนมือถือ
   *   • ไพ่กว้าง 96px = ภาพ 1909 เล็กจนดูรายละเอียดไม่ออก
   *   • ป้ายชื่อตำแหน่งกว้างแค่ 112px ➔ ถูกย่อด้วยจุดไข่ปลาทุกใบทุกผัง
   *     ("1. อดีต (ที่มาของเ…") ผู้ใช้อ่านไม่ออกว่าไพ่ใบนั้นตอบอะไร ซึ่งคือหัวใจของการดูผัง
   *
   * พอเหลือใบเดียวต่อหน้าจอ: ไพ่กว้างขึ้นเป็น 176px · ชื่อตำแหน่งขึ้นครบไม่ต้องย่อ
   * และรางตัวนี้ **เลื่อนตามไพ่ที่แม่หมอกำลังอ่านให้เอง** อยู่แล้ว (เอฟเฟกต์ด้านบน)
   *
   * จอ `sm:` ขึ้นไปยังเป็นแท่นบูชาแบบเดิมทุกประการ — ที่นั่นไพ่เรียงครบได้จริง
   */
  const isPhone = useNarrowViewport();
  const useRail = isPhone || spread.positions.length >= RAIL_THRESHOLD;
  /** หนึ่งใบต่อหนึ่งหน้าจอ (โผล่ใบถัดไปนิดหน่อยให้รู้ว่าปัดต่อได้) */
  const oneUp = isPhone;

  /**
   * ♿ T-33: ประกาศผลการพลิกไพ่ผ่านโหนด live region ที่ซ่อนไว้
   * ของเดิมอาศัยการ "สลับข้อความใน `aria-label` ของอิลิเมนต์ที่โฟกัสอยู่" ซึ่งไม่รับประกัน
   * ว่าจะถูกประกาศซ้ำในทุกคู่เบราว์เซอร์/โปรแกรมอ่านหน้าจอ — บางคู่อ่าน label แค่ตอนโฟกัสครั้งแรก
   */
  const [flipAnnouncement, setFlipAnnouncement] = React.useState("");

  const handleCardClick = (order: number) => {
    soundManager.playCardFlipSound();
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(15);
    }
    if (onFlipCard) onFlipCard(order);
  };

  // ประกาศเมื่อ "จำนวนไพ่ที่เปิดแล้ว" เปลี่ยนจริง — ไม่ใช่ทุกครั้งที่กด (กดซ้ำใบเดิมไม่ต้องพูด)
  const lastAnnouncedRef = React.useRef<string>("");
  React.useEffect(() => {
    const newest = revealedOrders[revealedOrders.length - 1];
    if (newest === undefined) {
      lastAnnouncedRef.current = "";
      setFlipAnnouncement("");
      return;
    }
    const drawn = drawnCards.find((d) => d.order === newest);
    const name = isEnglish
      ? drawn?.card?.nameEn || drawn?.card?.nameTh || "Card"
      : drawn?.card?.nameTh || "ไพ่";
    const text = isEnglish ? `Revealed: ${name}` : `เปิดแล้ว: ${name}`;
    if (text === lastAnnouncedRef.current) return;
    lastAnnouncedRef.current = text;
    setFlipAnnouncement("");
    const timer = setTimeout(() => setFlipAnnouncement(text), 120);
    return () => clearTimeout(timer);
  }, [revealedOrders, drawnCards, isEnglish]);

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
      behavior: motionSafe ? "smooth" : "auto",
    });
  }, [currentReadingPosition, useRail, motionSafe]);

  const nudgeRail = (direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    const step = rail.clientWidth * 0.7;
    rail.scrollBy({
      left: direction * step,
      behavior: motionSafe ? "smooth" : "auto",
    });
  };

  const isAllRevealed = drawnCards.length > 0 && revealedOrders.length === drawnCards.length;

  const renderSlot = (pos: SpreadPosition) => {
    const drawn = drawnCards.find((d) => d.order === pos.index);
    const isRevealed = revealedOrders.includes(pos.index);
    const isCurrentReading = currentReadingPosition === pos.index;

    const posName = getPositionName(pos, isEnglish);

    return (
      <motion.div
        key={pos.index}
        data-slot-order={pos.index}
        role="button"
        tabIndex={0}
        aria-label={
          isEnglish
            ? `Position #${pos.index + 1}: ${posName} - ${isRevealed ? (drawn?.card?.nameEn || "Card Revealed") : "Tap to reveal card"}`
            : `ตำแหน่งที่ ${pos.index + 1}: ${pos.nameTh} - ${isRevealed ? drawn?.card?.nameTh || "เปิดไพ่แล้ว" : "แตะหรือกดเพื่อเปิดไพ่"}`
        }
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: pos.index * 0.06 }}
        className={`flex flex-col items-center cursor-pointer focus-visible:outline-none group rounded-lg ${
          useRail ? "snap-center flex-shrink-0" : ""
        } ${oneUp ? "basis-[74%] max-w-[74%]" : ""}`}
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
          className={`relative transition duration-300 rounded-lg group-focus-visible:ring-2 group-focus-visible:ring-gold-ink ${
            isCurrentReading
              ? "ring-4 ring-gold-ink ring-offset-2 ring-offset-[#F3EDE2] shadow-overlay scale-105"
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
              className="tap-overlay-y absolute -top-2.5 -right-2.5 px-2.5 py-1 rounded-full bg-surface hover:bg-surface-warm border border-line-warm hover:border-gold-ink text-ink-deep hover:text-gold-ink transition duration-300 cursor-pointer flex items-center gap-1.5 z-30 group hover:scale-105 active:scale-95"
              title={isEnglish ? "Zoom 3D High-Definition Card" : "ซูมดูไพ่ 3D ความละเอียดสูง"}
            >
              <ExpandTabIcon className="w-3 h-3 text-gold-ink group-hover:text-gold-ink-deep transition-colors" />
              <span className="text-[12px] font-serif-th font-bold tracking-wide">
                {isEnglish ? "Zoom" : "ขยาย"}
              </span>
            </button>
          )}

          {drawn ? (
            <TarotCard
              imageSizes="(min-width: 640px) 112px, 96px"
              card={drawn.card || { cardIndex: drawn.cardIndex }}
              isReversed={drawn.isReversed}
              isRevealed={isRevealed}
              isHighlighted={isCurrentReading}
              className={oneUp ? "w-44 h-[299px]" : "w-24 h-[163px] sm:w-28 sm:h-[190px]"}
            />
          ) : (
            <div className={`${oneUp ? "w-44 h-[299px]" : "w-24 h-[163px] sm:w-28 sm:h-[190px]"} rounded-lg border-2 border-dashed border-line-warm bg-inset-warm flex items-center justify-center text-xs text-muted`}>
              {pos.index + 1}
            </div>
          )}
        </div>

        {/* Slot Position Name Tag */}
        <div className={`text-center mt-2.5 ${oneUp ? "w-full px-1" : "w-28 sm:w-32"}`}>
          <span className="text-[13px] text-gold-ink font-mono block font-semibold">
            {isEnglish ? `Card #${pos.index + 1}` : `ใบที่ ${pos.index + 1}`}
          </span>
          {/*
            บนมือถือ (หนึ่งใบต่อหน้าจอ) มีที่พอให้ชื่อตำแหน่งขึ้นครบ จึงไม่ย่อด้วยจุดไข่ปลา
            — ชื่อตำแหน่งคือสิ่งที่บอกว่าไพ่ใบนั้นตอบคำถามอะไร ย่อทิ้งเท่ากับทิ้งความหมายของผัง
            จอกว้างยังต้องย่ออยู่ เพราะไพ่เรียงกันหลายใบและกล่องกว้างแค่ 112–128px
          */}
          <span
            className={`text-xs font-serif-th font-bold text-ink-deep leading-snug py-0.5 block ${
              oneUp ? "[text-wrap:balance]" : "truncate"
            }`}
            title={posName}
          >
            {posName}
          </span>
        </div>
      </motion.div>
    );
  };

  const spreadNameLocalized = getSpreadName(spread, isEnglish);

  return (
    <div className="w-full rounded-lg border border-line-warm bg-surface p-4 sm:p-6 flex flex-col justify-between space-y-4 select-none relative overflow-hidden">
      {/* ♿ ประกาศชื่อไพ่ที่เพิ่งเปิด (T-33) — ซ่อนจากสายตา แต่โปรแกรมอ่านหน้าจอเห็น */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {flipAnnouncement}
      </p>

      {/* Header Bar: Spread Name & Quick Flip Button */}
      <div className="flex items-center justify-between pb-3 border-b border-line-warm/30 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-muted font-serif-th font-semibold">
              {isEnglish ? "Spread:" : "ผังพยากรณ์:"}
            </span>
            <span className="text-xs text-surface bg-gold-ink px-2.5 py-0.5 rounded-full font-bold font-mono ">
              {spread.positions.length} {isEnglish ? "Cards" : "ใบ"}
            </span>
          </div>
          <h3 className="font-serif-th text-base sm:text-lg font-bold text-ink-deep mt-0.5">
            {spreadNameLocalized}
          </h3>
        </div>

        {/* Reveal All Cards Action Button or Revealed Badge */}
        {drawnCards.length > 0 &&
          (isAllRevealed ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-inset-warm border border-line-warm text-muted text-xs font-serif-th font-semibold ">
              
              <span>{isEnglish ? "All Cards Revealed" : "เปิดไพ่ครบแล้ว"}</span>
            </div>
          ) : onRevealAll ? (
            <button
              type="button"
              onClick={onRevealAll}
              className="tap-overlay-y px-3.5 py-1.5 rounded-full text-xs font-serif-th font-bold bg-gold-ink hover:bg-gold-ink-deep text-surface transition cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink active:scale-95"
            >
              
              <span>{isEnglish ? "Reveal All Cards" : "พลิกดูไพ่ทั้งหมด"}</span>
            </button>
          ) : null)}
      </div>

      {useRail ? (
        /* ── ผังใหญ่: รางเลื่อนแนวนอนผืนเดียว (Unified Rail) ── */
        <div className="relative z-10">
          <div
            ref={railRef}
            onScroll={syncRailEdges}
            className="flex snap-x snap-mandatory items-start gap-4 sm:gap-6 overflow-x-auto overscroll-x-contain px-6 py-6 no-scrollbar"
            role="group"
            aria-label={
              isEnglish
                ? `All ${spread.positions.length} cards in ${spreadNameLocalized} — swipe to browse`
                : `ไพ่ทั้ง ${spread.positions.length} ใบในผัง ${spread.nameTh} — ปัดซ้ายขวาเพื่อดูใบอื่น`
            }
          >
            {spread.positions.map((pos) => renderSlot(pos))}
          </div>

          {/* ขอบจางซ้าย/ขวา บอกใบ้ว่ายังมีไพ่ต่อไปอีก */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-surface to-transparent transition-opacity duration-300 ${
              canScrollLeft ? "opacity-100" : "opacity-0"
            }`}
          />
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-surface to-transparent transition-opacity duration-300 ${
              canScrollRight ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* ปุ่มเลื่อนสำหรับเมาส์/คีย์บอร์ด */}
          <button
            type="button"
            onClick={() => nudgeRail(-1)}
            disabled={!canScrollLeft}
            aria-label={isEnglish ? "Scroll left" : "เลื่อนดูไพ่ทางซ้าย"}
            className={`tap-overlay-y absolute left-0 top-[45%] -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-line-warm bg-inset-warm text-ink-deep transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink ${
              canScrollLeft ? "cursor-pointer opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => nudgeRail(1)}
            disabled={!canScrollRight}
            aria-label={isEnglish ? "Scroll right" : "เลื่อนดูไพ่ทางขวา"}
            className={`tap-overlay-y absolute right-0 top-[45%] -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-line-warm bg-inset-warm text-ink-deep transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink ${
              canScrollRight ? "cursor-pointer opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            →
          </button>
        </div>
      ) : (
        /* ── ผังเล็ก: แท่นบูชา Unified Canvas แบบเดิม เห็นครบทุกใบในตาเดียว ── */
        <div className="w-full flex-1 flex flex-wrap items-center justify-center gap-4 sm:gap-6 py-2 relative z-10 min-h-[220px]">
          {spread.positions.map((pos) => renderSlot(pos))}
        </div>
      )}

      {/* Helpful Hint */}
      <div className="text-center pt-2 border-t border-line-warm/30 text-[13px] text-muted relative z-10 flex items-center justify-center gap-1.5 font-serif-th">
        
        <span>
          {useRail
            ? isEnglish
              ? "Swipe horizontally to navigate cards. Tap any card to reveal its sacred artwork."
              : "ปัดซ้าย–ขวาเพื่อดูไพ่ใบอื่น แตะที่การ์ดเพื่อพลิกดูหน้าไพ่"
            : isEnglish
              ? "Tap any card to reveal its sacred artwork or read its interpretation."
              : "แตะที่การ์ดเพื่อพลิกดูหน้าไพ่ หรือเลือกอ่านคำทำนายของใบนั้น"}
        </span>
      </div>
    </div>
  );
};
