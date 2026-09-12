"use client";

import React, { useState, useMemo, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { soundManager } from "@/lib/utils/audio";
import { CardImage } from "@/components/card/CardImage";
import { useLocale } from "@/lib/i18n";

// useLayoutEffect ฝั่ง server จะเตือน — สลับเป็น useEffect ตอน SSR
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

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
  /**
   * จุดหยุดของ Tab เพียงจุดเดียวของทั้งพัด (roving tabindex — UX-20)
   * ⚠️ ต้องมี `true` เพียงใบเดียวเสมอ ไม่งั้นจะกลับไปเป็น 78 จุดเหมือนเดิม
   */
  isTabStop: boolean;
  onKeyNav: (from: number, dir: -1 | 1 | "home" | "end") => void;
  isEnglish?: boolean;
}

const FanCard = React.memo<FanCardProps>(({ cardIdx, posInTier, tierIdx, isPicked, disabled, onClick, isTabStop, onKeyNav, isEnglish }) => {
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
      data-fan-card={cardIdx}
      tabIndex={disabled || !isTabStop ? -1 : 0}
      aria-label={isEnglish ? `Select card #${cardIdx + 1}` : `เลือกไพ่ใบที่ ${cardIdx + 1}`}
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
          return;
        }
        /*
         * 🎹 เลื่อนระหว่างไพ่ด้วยลูกศร (roving tabindex — UX-20)
         * ก่อนหน้านี้ไพ่ทุกใบมี `tabIndex={0}` ผู้ใช้คีย์บอร์ดจึงต้องกด Tab
         * **78 ครั้ง** เพื่อผ่านสำรับไปให้ถึงเนื้อหาถัดไป และไม่มีทางลัดใด ๆ
         * แพตเทิร์นนี้เป็นชุดเดียวกับที่แท็บหมวดผังใช้อยู่แล้วทั้งเว็บ
         */
        const map: Record<string, -1 | 1 | "home" | "end"> = {
          ArrowRight: 1,
          ArrowDown: 1,
          ArrowLeft: -1,
          ArrowUp: -1,
          Home: "home",
          End: "end",
        };
        const dir = map[e.key];
        if (dir !== undefined) {
          e.preventDefault();
          onKeyNav(cardIdx, dir);
        }
      }}
      className="cursor-pointer relative select-none flex-shrink-0 w-[46px] sm:w-[66px] md:w-[74px] group focus-visible:outline-none"
      style={{ zIndex: tierIdx * 40 + posInTier, originY: 1 }}
    >
      <div className="w-[46px] h-[78px] sm:w-[66px] sm:h-[112px] md:w-[74px] md:h-[124px] rounded-lg sm:rounded-lg border-2 card-back-pattern flex flex-col items-center justify-between p-1 sm:p-1.5 relative overflow-hidden transition duration-200 border-line-warm group-hover:border-gold-ink group-hover:ring-2 group-hover:ring-gold-ink/60 group-focus-visible:border-line-warm group-focus-visible:ring-2 group-focus-visible:ring-gold-ink bg-[#382518]">
        <div className="w-full flex items-center justify-end text-[12px] sm:text-[12px] text-gold-ink/90">
          <span className="font-mono opacity-80">#{cardIdx + 1}</span>
        </div>
        <div className="gold-foil-sheen absolute inset-0 opacity-20 group-hover:opacity-50 transition-opacity pointer-events-none" />
      </div>
    </motion.div>
  );
});
FanCard.displayName = "FanCard";

const TOTAL_CARDS = 78;

export const InteractiveCardFan: React.FC<InteractiveCardFanProps> = ({
  totalCards = TOTAL_CARDS,
  pickedIndices,
  targetCount,
  currentPositionName,
  onPickCard,
  disabled = false,
}) => {
  const { isEnglish } = useLocale();
  // ป้ายชื่อตำแหน่งสำรอง: ต้องเลือกภาษาตอนเรนเดอร์ ไม่ใช่ค่า default ของพารามิเตอร์
  // (ค่า default เป็นภาษาไทยตายตัว ทำให้โหมด EN เห็นคำไทยหลุดมา)
  const positionLabel = currentPositionName || (isEnglish ? "Next Position" : "ตำแหน่งถัดไป");
  const stageRef = useRef<HTMLDivElement>(null);
  const fanRef = useRef<HTMLDivElement>(null);
  const [fanFit, setFanFit] = useState({ scale: 1, trimY: 0 });
  const isComplete = pickedIndices.length >= targetCount;

  // จัดพัดไพ่ให้พอดีความกว้างคอนเทนเนอร์เสมอ (ไม่ต้องเลื่อนแนวนอน)
  // offsetWidth = ความกว้าง layout (ไม่สนใจ transform/animation) + เผื่อระยะที่ไพ่ริมสุด "หมุน" ล้นออกมา
  const fitFan = useCallback(() => {
    const stage = stageRef.current;
    const fan = fanRef.current;
    if (!stage || !fan) return;
    const cs = getComputedStyle(stage);
    const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const avail = stage.clientWidth - padX;
    const natural = fan.offsetWidth + 32; // เผื่อไพ่ริมสุดที่หมุน ~11° ล้นด้านละ ~14px
    if (avail <= 0 || natural <= 0) return;
    const scale = Math.min(1, avail / natural);
    // scale ย่อจากขอบบน → เก็บพื้นที่ว่างด้านล่างที่เกินมาคืน
    const trimY = fan.offsetHeight * (1 - scale);
    setFanFit((prev) =>
      Math.abs(prev.scale - scale) < 0.003 && Math.abs(prev.trimY - trimY) < 0.5
        ? prev
        : { scale, trimY }
    );
  }, []);

  useIsoLayoutEffect(() => {
    fitFan();
    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(fitFan);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [fitFan]);

  // ไพ่ถูกหยิบออก → พัดแคบลง → วัดใหม่ให้ขยายกลับได้
  useEffect(() => {
    const id = window.setTimeout(fitFan, 320);
    return () => window.clearTimeout(id);
  }, [pickedIndices.length, targetCount, fitFan]);

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

  /**
   * ⚠️ ต้องเป็น useCallback ที่ identity นิ่ง ไม่งั้น React.memo ของ FanCard ไร้ผลทั้งหมด
   * ของเดิมประกาศเป็น arrow function ธรรมดา ทุกเรนเดอร์จึงได้ฟังก์ชันตัวใหม่
   * prop `onClick` เปลี่ยนทุกครั้ง memo เทียบแล้วไม่ตรงเสมอ → ไพ่ครบ 78 ใบ
   * re-render ใหม่หมดทุกครั้งที่แตะเลือกไพ่ 1 ใบ และทุกครั้งที่ fitFan ปรับขนาด
   *
   * `pickedIndices` เก็บลง ref ด้วย เพราะตัวมันเปลี่ยนทุกครั้งที่เลือกไพ่
   * ถ้าใส่ไว้ใน dependency โดยตรง callback ก็จะเปลี่ยน identity ทุกการเลือกอยู่ดี
   */
  const pickedIndicesRef = useRef(pickedIndices);
  pickedIndicesRef.current = pickedIndices;
  // `onPickCard` ที่ TarotFlow ส่งมาก็เป็น arrow function ใหม่ทุกเรนเดอร์เช่นกัน
  // จึงต้องเก็บลง ref ด้วย ไม่งั้น callback ตัวนี้ก็ยังเปลี่ยน identity อยู่ดี
  const onPickCardRef = useRef(onPickCard);
  onPickCardRef.current = onPickCard;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const isCompleteRef = useRef(isComplete);
  isCompleteRef.current = isComplete;

  const handleCardClick = useCallback((idx: number) => {
    if (disabledRef.current || isCompleteRef.current || pickedIndicesRef.current.includes(idx)) return;
    soundManager.playCardSelectSound(pickedIndicesRef.current.length);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(30);
    }
    onPickCardRef.current(idx);
  }, []);

  /*
   * 🎹 roving tabindex — ทั้งพัดมีจุดหยุดของ Tab เพียง "ใบเดียว" (UX-20)
   * เลือกใบแรกที่ยังไม่ถูกหยิบเป็นจุดหยุด แล้วให้ลูกศรเลื่อนโฟกัสไปใบอื่นแทน
   * ⚠️ ถ้าเผลอให้หลายใบเป็น tab stop พร้อมกัน จะกลับไปเป็น 78 จุดเหมือนเดิมทันที
   */
  const tabStopIdx = useMemo(() => {
    for (let i = 0; i < totalCards; i++) {
      if (!pickedIndices.includes(i)) return i;
    }
    return -1;
  }, [totalCards, pickedIndices]);

  const handleKeyNav = useCallback(
    (from: number, dir: -1 | 1 | "home" | "end") => {
      const available = Array.from({ length: totalCards }, (_, i) => i).filter(
        (i) => !pickedIndicesRef.current.includes(i)
      );
      if (available.length === 0) return;

      let target: number;
      if (dir === "home") target = available[0];
      else if (dir === "end") target = available[available.length - 1];
      else {
        const pos = available.indexOf(from);
        // วนกลับหัวท้ายเหมือนแพตเทิร์นแท็บที่ใช้อยู่ทั้งเว็บ
        target = available[(pos + dir + available.length) % available.length];
      }

      const el = document.querySelector<HTMLElement>(`[data-fan-card="${target}"]`);
      el?.focus();
    },
    [totalCards]
  );

  // P1-U6: Accessible Auto-Pick Fallback (Randomly select next card)
  const handleAutoPick = () => {
    if (disabled || isComplete) return;
    const available = Array.from({ length: totalCards }, (_, i) => i).filter((idx) => !pickedIndices.includes(idx));
    if (available.length === 0) return;
    const randomIdx = available[Math.floor(Math.random() * available.length)];
    handleCardClick(randomIdx);
  };

  return (
    <div className="w-full flex flex-col items-center select-none space-y-3.5 sm:space-y-6">
      {/* Top Sacred Guidance & Target Slot Focus */}
      <div className="text-center space-y-1.5 relative z-10 px-3">
        {!isComplete ? (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
            {/* Status Pill Badge — Warm Minimalist Luxury */}
            <div className="inline-flex items-center gap-2 bg-surface border border-line-warm px-3.5 sm:px-5 py-1 sm:py-1.5 rounded-full ">
              <span className="w-2 h-2 rounded-full bg-gold-ink animate-ping" />
              <span className="text-[13px] sm:text-xs font-serif-th font-bold text-ink-deep">
                {isEnglish
                  ? `Choosing card ${pickedIndices.length + 1} of ${targetCount}`
                  : `เลือกไพ่ใบที่ ${pickedIndices.length + 1} จากทั้งหมด ${targetCount} ใบ`}
              </span>
            </div>

            {/* Position Heading with Inline Non-Breaking Quotes */}
            <h3 className="text-lg sm:text-3xl font-serif-th font-bold font-mystic-gold tracking-wide drop-shadow leading-snug py-0.5 px-2">
              {isEnglish ? "Choose a card for" : "เลือกไพ่สำหรับ"}{" "}
              <span className="text-gold-ink inline-block font-bold">&ldquo;{positionLabel}&rdquo;</span>
            </h3>
            <p className="text-[13px] sm:text-xs text-muted max-w-xl mx-auto leading-normal">
              {isEnglish
                ? "Tap the card you feel drawn to, or press \u201cDraw for Me\u201d below."
                : "แตะเลือกไพ่ใบที่คุณรู้สึกถูกชะตา หรือกดปุ่ม \u201cสุ่มเลือกให้ฉัน\u201d ด้านล่าง"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-1 py-1"
          >
            <h3 className="text-lg sm:text-2xl font-serif-th font-bold font-mystic-gold flex items-center justify-center gap-2">
              {isEnglish
                ? `All ${targetCount} cards have been chosen`
                : `เลือกไพ่ครบ ${targetCount} ใบเรียบร้อยแล้ว`}
            </h3>
            <p className="text-[13px] sm:text-xs text-muted">
              {isEnglish
                ? "Preparing your cards and reading..."
                : "กำลังเตรียมเปิดไพ่และคำทำนายของคุณ..."}
            </p>
          </motion.div>
        )}
      </div>

      {/* Unified Masterpiece Altar Stage (No Row-Level Clipping) */}
      <div className="w-full relative rounded-lg border border-line-warm bg-surface overflow-hidden">
        {/* UNIFIED STAGE — พัดไพ่ทั้ง 3 ชั้นย่อพอดีความกว้าง ไม่ต้องเลื่อน (P1-U10) */}
        <div
          ref={stageRef}
          className="w-full overflow-hidden pt-6 pb-6 sm:pt-10 sm:pb-8 px-4 sm:px-8 relative z-10"
        >
          <div
            ref={fanRef}
            className="min-w-max mx-auto flex flex-col items-center gap-3.5 sm:gap-6 py-1"
            style={{
              transform: `scale(${fanFit.scale})`,
              // ย่อจากมุมซ้ายบน: เมื่อพัดกว้างกว่ากรอบ mx-auto จะ pin ไว้ซ้าย → origin ต้องเป็นซ้ายด้วย
              transformOrigin: "top left",
              marginBottom: -fanFit.trimY,
            }}
          >
            {tiers.map((tierCards, tierIdx) => {
              const tierOffsetClass = tierIdx === 1 ? "pl-6 sm:pl-10" : tierIdx === 2 ? "pl-12 sm:pl-20" : "pl-0";

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
                        isTabStop={cardIdx === tabStopIdx}
                        onKeyNav={handleKeyNav}
                        isEnglish={isEnglish}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Masterpiece Sacred Selection Slim Progress Dock */}
        <div className="border-t border-line-warm/30 bg-inset-warm p-3 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-5 relative z-20">
          {/* Left: Layered Sacred Deck Emblem & Status */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Tarot Deck Seal Icon */}
            <div className="relative w-9 h-12 sm:w-11 sm:h-15 flex-shrink-0 group">
              <div className="absolute inset-0 translate-x-1 -translate-y-0.5 rounded-lg bg-inset-warm border border-line-warm transform rotate-4 opacity-70" />
              <div className="absolute inset-0 rounded-lg border-2 border-line-warm overflow-hidden bg-surface transform -rotate-1 group-hover:rotate-0 transition-transform duration-300">
                <CardImage
                  image="major-01.jpg"
                  alt="Sacred Tarot Altar"
                  className="w-full h-full object-cover object-top tarot-hd-card-image"
                  sizes="72px"
                />
                <div className="gold-foil-sheen absolute inset-0 opacity-20 pointer-events-none" />
              </div>
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-gold-ink border border-line-warm" />
            </div>

            {/* Typography & Animated Progress Bar */}
            <div className="space-y-1 flex-1 min-w-[160px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] text-ink-deep font-serif-th font-bold flex items-center gap-1">
                  
                  <span>{isEnglish ? "Sacred Card Selection" : "ความคืบหน้าพิธีจับไพ่"}</span>
                </span>
                <span className="text-[13px] sm:text-xs font-mono font-bold text-ink-deep bg-surface border border-line-warm px-2 py-0.2 rounded-full ">
                  {pickedIndices.length} / {targetCount}
                </span>
              </div>

              {/* Luminous Animated Progress Bar */}
              <div className="w-full h-1.5 sm:h-2 rounded-full bg-surface border border-line-warm overflow-hidden p-0.5 relative">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: pickedIndices.length / targetCount }}
                  style={{ transformOrigin: "left" }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="h-full w-full rounded-full bg-gradient-to-r from-gold-ink via-ink-soft to-gold-ink relative"
                >
                  <div className="absolute inset-0 bg-white/35 animate-[pulse_2s_infinite]" />
                </motion.div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] sm:text-[13px] text-muted font-serif-th leading-normal truncate">
                  {isComplete ? (
                    <span className="text-ok font-semibold">
                      {isEnglish
                        ? "All cards chosen. Revealing sacred prophecies..."
                        : "เลือกไพ่ครบถ้วนแล้ว พร้อมเปิดคำทำนาย"}
                    </span>
                  ) : (
                    <span>
                      {isEnglish ? (
                        <>
                          Drawing for <strong className="text-ink-deep">&ldquo;{positionLabel}&rdquo;</strong>
                        </>
                      ) : (
                        <>
                          กำลังเลือกใบสำหรับ <strong className="text-ink-deep">&ldquo;{positionLabel}&rdquo;</strong>
                        </>
                      )}
                    </span>
                  )}
                </p>

                {/* P1-U6: Auto-Pick fallback button for keyboard / assistive users */}
                {!isComplete && (
                  <button
                    type="button"
                    onClick={handleAutoPick}
                    disabled={disabled}
                    className="flex-shrink-0 text-[13px] sm:text-[13px] text-ink-deep hover:text-gold-ink bg-surface hover:bg-inset-warm border border-line-warm hover:border-gold-ink px-2.5 py-0.5 rounded-lg transition cursor-pointer font-serif-th focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-ink"
                    aria-label={isEnglish ? "Auto-draw next card" : "สุ่มเลือกไพ่ใบถัดไปอัตโนมัติ"}
                  >
                    {isEnglish ? "Draw for Me" : "สุ่มเลือกให้ฉัน"}
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
                  className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[13px] sm:text-xs transition duration-300 font-serif-th whitespace-nowrap select-none ${
                    isFilled
                      ? "bg-gold-ink text-surface font-bold border border-line-warm"
                      : isCurrent
                        ? "bg-surface border border-line-warm text-ink-deep ring-1 ring-gold-ink/40 font-bold"
                        : "bg-inset-warm border border-line-warm/50 text-muted"
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[12px] font-mono font-bold ${
                      isFilled
                        ? "bg-surface text-ink-deep"
                        : isCurrent
                          ? "bg-gold-ink text-surface"
                          : "bg-inset-warm/30 text-muted"
                    }`}
                  >
                    {isFilled ? "✓" : idx + 1}
                  </div>
                  <span className="text-[13px] sm:text-[13px] tracking-wide">
                    {isEnglish ? `Card #${idx + 1}` : `ใบที่ ${idx + 1}`}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
