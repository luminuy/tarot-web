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
import { mapLayout, boxOf } from "@/lib/tarot/spread-map-geometry";
import { cardsEn } from "@/lib/text/plural-en";

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
  /** เลื่อนคำอ่านไปที่ใบนั้นโดยไม่พลิก — ใช้กับรายการตำแหน่งใต้โต๊ะ (ใบที่เปิดแล้วแตะซ้ำต้องไม่คว่ำกลับ) */
  onFocusCard?: (order: number) => void;
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
  onFocusCard,
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
  /* ผัง 1 ใบไม่มีอะไรให้ปัด — ใช้แท่นบูชาจัดกึ่งกลางแทน (รางชิดซ้ายเพราะ px-6 ไพ่ใบเดียวจึงเยื้อง) */
  /* v2 (2026-10-16): จอกว้างวางไพ่บนโต๊ะตามพิกัดจริงของผังทุกขนาด (เซลติกครอสก็เห็นเป็นกากบาทจริง)
     รางเลื่อนเหลือไว้เฉพาะมือถือ — RAIL_THRESHOLD ไม่ใช้ตัดสินแล้ว คงไว้เป็นประวัติ */
  void RAIL_THRESHOLD;
  const useRail = isPhone && spread.positions.length > 1;
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
  const map = React.useMemo(() => mapLayout(spread.positions), [spread.positions]);
  /**
   * กรอบจริงของไพ่ทั้งผัง (หน่วยเทียบความกว้างโต๊ะ) — สูตรแผนผังย่อเผื่อที่ว่างด้านบนไว้ตามพิกัด y
   * โต๊ะจริงตัดที่ว่างนั้นทิ้ง ไม่งั้นผังแถวเดียวลอยอยู่ก้นโต๊ะสูงครึ่งจอ
   */
  const bounds = React.useMemo(() => {
    let top = Infinity;
    let bottom = -Infinity;
    for (const pos of spread.positions) {
      const b = boxOf(pos, map);
      top = Math.min(top, b.top);
      bottom = Math.max(bottom, b.bottom);
    }
    if (!Number.isFinite(top)) return { top: 0, height: map.boxHeight };
    return { top, height: bottom - top };
  }, [spread.positions, map]);
  /** โต๊ะสูงไม่เกิน ~540px — ผังสูง (เซลติกครอส) จึงแคบลงแทนที่จะยาวจนต้องเลื่อน */
  const tableMaxWidth = Math.round(540 / Math.max(0.2, bounds.height));
  /** ไพ่ 1909 สูง:กว้าง ≈ 1.7 แต่สูตรผังคิดที่ 1.5 — ย่อความกว้างให้ความสูงเท่าที่ผังเผื่อไว้ ไม่ทับกัน */
  const TABLE_CARD_SHRINK = (1.5 / 1.7) * 0.9; // เผื่อช่องไฟ ~10% ไม่ให้ไพ่แถวตั้ง (เซลติกครอส ใบ 7–10) ชนกัน

  const renderSlot = (pos: SpreadPosition, mode: "rail" | "table" | "single") => {
    const drawn = drawnCards.find((d) => d.order === pos.index);
    const isRevealed = revealedOrders.includes(pos.index);
    const isCurrentReading = currentReadingPosition === pos.index;

    const posName = getPositionName(pos, isEnglish);
    const tableStyle: React.CSSProperties | undefined =
      mode === "table"
        ? {
            left: `${pos.x * 100}%`,
            top: `${(((pos.y * map.yScale + map.offsetY - bounds.top) / bounds.height) * 100).toFixed(3)}%`,
            width: `${(map.cardW * TABLE_CARD_SHRINK * 100).toFixed(2)}%`,
            transform: `translate(-50%, -50%) rotate(${pos.rotate ?? 0}deg)`,
            zIndex: isCurrentReading ? 20 : 10 + pos.index,
          }
        : undefined;

    const slot = (
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
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: pos.index * 0.06 }}
        className={`v2-sb-slot is-${mode}${isCurrentReading ? " is-now" : ""}${isRevealed ? " is-open" : ""} group ${
          useRail ? "snap-center flex-shrink-0" : ""
        } ${oneUp ? "basis-[74%] max-w-[74%]" : ""}`}
        /*
          ไพ่ที่เปิดแล้ว ➔ แตะ = อ่านใบนั้น (ตามป้าย "แตะไพ่เพื่ออ่านใบนั้น") ไม่คว่ำกลับ (B4-03)
          เดิมทำไว้เฉพาะรายการใต้โต๊ะซึ่งถูกซ่อนบนมือถือ ผู้ใช้มือถือแตะตามป้ายแล้วไพ่คว่ำกลับ ดูเหมือนรีเซ็ต
        */
        onClick={() => (isRevealed && onFocusCard ? onFocusCard(pos.index) : handleCardClick(pos.index))}
        onKeyDown={(e) => {
          // กดปุ่มลูก (เช่น "ขยาย") ต้องไม่ถูกช่องไพ่กลืน (A5-17) — preventDefault ตรงนี้ยกเลิก
          // การ activate ปุ่มลูก Enter/Space บนปุ่มขยายจึงกลายเป็นเลือกไพ่ใบนั้นแทน
          if (e.target !== e.currentTarget) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (isRevealed && onFocusCard) onFocusCard(pos.index);
            else handleCardClick(pos.index);
          }
        }}
      >
        {/*
          ⚠️ ห้ามใส่ `scale-*` ของไพ่ที่กำลังอ่านที่ชั้นนี้ — `TarotCard` ยก+ขยายไพ่เองแล้ว (`.card-lift`)
        */}
        <div className="v2-sb-card relative rounded-lg group-focus-visible:ring-2 group-focus-visible:ring-gold-ink">
          {mode === "table" && (
            <span className="v2-sb-no" aria-hidden="true">
              {pos.index + 1}
            </span>
          )}
          {isRevealed && onZoomCard && drawn && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onZoomCard(drawn);
              }}
              className="v2-sb-zoom absolute -top-2.5 -right-2.5 z-30"
              title={isEnglish ? "Zoom 3D High-Definition Card" : "ซูมดูไพ่ 3D ความละเอียดสูง"}
            >
              <ExpandTabIcon className="w-3 h-3" />
              <span>
                {isEnglish ? "Zoom" : "ขยาย"}
              </span>
            </button>
          )}

          {drawn ? (
            <TarotCard
              imageSizes={mode === "table" ? "(min-width: 1024px) 140px, 120px" : oneUp ? "176px" : "(min-width: 640px) 140px, 112px"}
              card={drawn.card || { cardIndex: drawn.cardIndex }}
              isReversed={drawn.isReversed}
              isRevealed={isRevealed}
              isHighlighted={isCurrentReading}
              className={mode === "table" ? "!w-full !h-auto aspect-[1/1.7]" : oneUp ? "w-44 h-[299px]" : "w-32 h-[218px] sm:w-36 sm:h-[245px]"}
            />
          ) : (
            <div className={`${mode === "table" ? "w-full aspect-[1/1.7]" : oneUp ? "w-44 h-[299px]" : "w-32 h-[218px]"} v2-sb-empty`}>
              {pos.index + 1}
            </div>
          )}
        </div>

        {/* Slot Position Name Tag — โหมดโต๊ะไม่มีป้ายใต้ไพ่ (ไพ่วางชิดกันตามผังจริง) ชื่อตำแหน่งอยู่ในรายการใต้โต๊ะแทน */}
        {mode !== "table" && (
          <div className={`v2-sb-label ${oneUp ? "w-full px-1" : "w-36"}`}>
            <span className="v2-sb-label-n">
              {isEnglish ? `Card ${pos.index + 1}` : `ใบที่ ${pos.index + 1}`}
            </span>
            {/*
              บนมือถือ (หนึ่งใบต่อหน้าจอ) มีที่พอให้ชื่อตำแหน่งขึ้นครบ จึงไม่ย่อด้วยจุดไข่ปลา
              — ชื่อตำแหน่งคือสิ่งที่บอกว่าไพ่ใบนั้นตอบคำถามอะไร ย่อทิ้งเท่ากับทิ้งความหมายของผัง
            */}
            <span
              className={`v2-sb-label-t py-0.5 ${oneUp ? "[text-wrap:balance]" : "truncate"}`}
              title={posName}
            >
              {posName}
            </span>
          </div>
        )}
      </motion.div>
    );
    /* โหมดโต๊ะ: ตัวหมุด (พิกัด + หมุน) ต้องเป็นคนละชั้นกับ motion.div — motion เขียน transform ของตัวเองทับ
       translate(-50%,-50%) rotate(...) จนไพ่หลุดตำแหน่งและไพ่ขวางไม่ขวาง */
    return mode === "table" ? (
      <div key={pos.index} className="v2-sb-pin" style={tableStyle}>
        {slot}
      </div>
    ) : (
      slot
    );
  };

  const spreadNameLocalized = getSpreadName(spread, isEnglish);
  const single = spread.positions.length === 1;

  return (
    <div className="v2-sb">
      {/* ♿ ประกาศชื่อไพ่ที่เพิ่งเปิด (T-33) — ซ่อนจากสายตา แต่โปรแกรมอ่านหน้าจอเห็น */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {flipAnnouncement}
      </p>

      {/* แถบบนโต๊ะ: บอกว่าต้องทำอะไร + ปุ่มเปิดทั้งหมด (ชื่อผังอยู่หัวหน้าแล้ว ไม่ซ้ำ) */}
      <div className="v2-sb-bar">
        <p className="v2-sb-hint">
          {isAllRevealed
            ? isEnglish
              ? "All cards revealed · tap a card to read it"
              : "เปิดครบแล้ว · แตะไพ่เพื่ออ่านใบนั้น"
            : useRail
              ? isEnglish
                ? "Swipe to browse · tap a card to flip it"
                : "ปัดดูใบอื่น · แตะไพ่เพื่อพลิก"
              : isEnglish
                ? "Tap each card to flip it"
                : "แตะไพ่ทีละใบเพื่อพลิกดู"}
        </p>
        {drawnCards.length > 0 && !isAllRevealed && onRevealAll && (
          <button type="button" onClick={onRevealAll} className="v2-sb-all">
            {isEnglish ? "Reveal all" : "พลิกทั้งหมด"}
          </button>
        )}
      </div>

      {useRail ? (
        /* ── มือถือ: รางเลื่อนทีละใบ ── */
        <div className="relative">
          {/* ช่องไพ่กว้าง 74% ➔ ตัวเว้นระยะหัว–ท้ายราง (before/after) 13% − gap ให้ใบแรก/ใบสุดท้ายอยู่กลางได้
              ⚠️ ห้ามใช้ px-[13%] แทน — basis 74% คิดจากพื้นที่ด้านในราง ขอบยิ่งกว้างช่องไพ่ยิ่งหด ไม่มีวันตรงกลาง */}
          <div
            ref={railRef}
            onScroll={syncRailEdges}
            className={`flex snap-x snap-mandatory items-start gap-4 overflow-x-auto overscroll-x-contain pt-8 pb-4 no-scrollbar ${
              oneUp
                ? "px-6 before:content-[''] before:shrink-0 before:basis-[calc(13%-1rem)] after:content-[''] after:shrink-0 after:basis-[calc(13%-1rem)]"
                : "px-6"
            }`}
            role="group"
            aria-label={
              isEnglish
                ? `All ${cardsEn(spread.positions.length)} in ${spreadNameLocalized} — swipe to browse`
                : `ไพ่ทั้ง ${spread.positions.length} ใบในผัง ${spread.nameTh} — ปัดซ้ายขวาเพื่อดูใบอื่น`
            }
          >
            {spread.positions.map((pos) => renderSlot(pos, "rail"))}
          </div>
          <span aria-hidden="true" className={`v2-sb-fade is-l${canScrollLeft ? " is-on" : ""}`} />
          <span aria-hidden="true" className={`v2-sb-fade is-r${canScrollRight ? " is-on" : ""}`} />
          <button
            type="button"
            onClick={() => nudgeRail(-1)}
            disabled={!canScrollLeft}
            aria-label={isEnglish ? "Scroll left" : "เลื่อนดูไพ่ทางซ้าย"}
            className={`v2-sb-nudge is-l${canScrollLeft ? " is-on" : ""}`}
          />
          <button
            type="button"
            onClick={() => nudgeRail(1)}
            disabled={!canScrollRight}
            aria-label={isEnglish ? "Scroll right" : "เลื่อนดูไพ่ทางขวา"}
            className={`v2-sb-nudge is-r${canScrollRight ? " is-on" : ""}`}
          />
        </div>
      ) : single ? (
        <div className="v2-sb-single">{spread.positions.map((pos) => renderSlot(pos, "single"))}</div>
      ) : (
        /* ── จอกว้าง: วางไพ่ตามพิกัดจริงของผัง (สูตรเดียวกับแผนผังย่อในหน้า /spreads) ── */
        <div className="v2-sb-table" style={{ maxWidth: `${tableMaxWidth}px` }}>
          <div
            className="v2-sb-area"
            style={{ paddingBottom: `${(bounds.height * 100).toFixed(2)}%` }}
            role="group"
            aria-label={isEnglish ? `${spreadNameLocalized} — ${cardsEn(spread.positions.length)}` : `ผัง${spread.nameTh} — ${spread.positions.length} ใบ`}
          >
            {spread.positions.map((pos) => renderSlot(pos, "table"))}
          </div>
        </div>
      )}

      {/* รายการตำแหน่ง — ทุกใบตอบเรื่องอะไร (แตะใบที่เปิดแล้ว = อ่านใบนั้น · ใบที่ยังคว่ำ = พลิก) */}
      {!single && (
        <ol className="v2-sb-legend">
          {spread.positions.map((pos) => {
            const drawn = drawnCards.find((d) => d.order === pos.index);
            const isRevealed = revealedOrders.includes(pos.index);
            const isNow = currentReadingPosition === pos.index;
            const cardName = isRevealed ? (isEnglish ? drawn?.card?.nameEn || drawn?.card?.nameTh : drawn?.card?.nameTh) : "";
            return (
              <li key={pos.index}>
                <button
                  type="button"
                  aria-current={isNow ? "true" : undefined}
                  className={`v2-sb-leg${isNow ? " is-now" : ""}${isRevealed ? " is-open" : ""}`}
                  onClick={() => (isRevealed && onFocusCard ? onFocusCard(pos.index) : handleCardClick(pos.index))}
                >
                  <span className="v2-sb-leg-n">{pos.index + 1}</span>
                  <span className="v2-sb-leg-t">
                    <b>{getPositionName(pos, isEnglish).replace(/^\d+\.\s*/, "")}</b>
                    <small>{cardName || (isEnglish ? "Face down · tap to flip" : "ยังคว่ำอยู่ · แตะเพื่อพลิก")}</small>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
};
