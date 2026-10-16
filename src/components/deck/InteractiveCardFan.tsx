"use client";

import React, { useState, useMemo, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { soundManager } from "@/lib/utils/audio";
import { useLocale } from "@/lib/i18n";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";

// useLayoutEffect ฝั่ง server จะเตือน — สลับเป็น useEffect ตอน SSR
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface InteractiveCardFanProps {
  totalCards?: number;
  pickedIndices: number[];
  targetCount: number;
  currentPositionName?: string;
  /** ชื่อตำแหน่งทุกใบตามลำดับ — ใช้วาดช่องวางไพ่ใต้พัด (v2) */
  positionNames?: string[];
  onPickCard: (fanIndex: number) => void;
  disabled?: boolean;
}

interface FanCardProps {
  cardIdx: number;
  posInTier: number;
  tierIdx: number;
  /** จำนวนไพ่ต่อแถว — 26 (3 แถว) บนจอกว้าง · 13 (6 แถว) บนมือถือ ให้ไพ่ใหญ่พอจิ้มได้ */
  perTier: number;
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

const FanCard = React.memo<FanCardProps>(({ cardIdx, posInTier, tierIdx, perTier, isPicked, disabled, onClick, isTabStop, onKeyNav, isEnglish }) => {
  if (isPicked) return null;

  // P1-M4: True mathematical arc geometry
  // Each tier has 26 cards; use position within tier for arc spread
  const TIER_SPREAD_DEG = 22; // total arc spread per tier in degrees
  const normalized = (posInTier % perTier) / (perTier - 1) - 0.5; // -0.5 to 0.5
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
      className="v2-fan-card"
      style={{ zIndex: tierIdx * 40 + posInTier, originY: 1 }}
    >
      <div className="v2-fan-back card-back-pattern">
        {/* A5-14: เลขบนหลังไพ่พื้นเข้มใช้ gold-on-dark ทึบเต็ม (≈ 6.3:1) */}
        <span className="v2-fan-no text-gold-on-dark">
          <span className="font-mono">#{cardIdx + 1}</span>
        </span>
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
  positionNames,
  onPickCard,
  disabled = false,
}) => {
  const { isEnglish } = useLocale();
  // ป้ายชื่อตำแหน่งสำรอง: ต้องเลือกภาษาตอนเรนเดอร์ ไม่ใช่ค่า default ของพารามิเตอร์
  // (ค่า default เป็นภาษาไทยตายตัว ทำให้โหมด EN เห็นคำไทยหลุดมา)
  const positionLabel = (currentPositionName || (isEnglish ? "Next Position" : "ตำแหน่งถัดไป")).replace(/^\d+\.\s*/, "");
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
    // พัดเปลี่ยนความกว้างเอง (สลับจำนวนแถว · ไพ่ถูกหยิบ) — ดูด้วย ไม่ใช่รอตัวจับเวลาอย่างเดียว
    if (fanRef.current) ro.observe(fanRef.current);
    return () => ro.disconnect();
  }, [fitFan]);

  // ไพ่ถูกหยิบออก → พัดแคบลง → วัดใหม่ให้ขยายกลับได้
  useEffect(() => {
    const id = window.setTimeout(fitFan, 320);
    return () => window.clearTimeout(id);
  }, [pickedIndices.length, targetCount, fitFan]);

  /*
   * แบ่งสำรับเป็นแถว — จอกว้าง 3 แถว × 26 ใบ · มือถือ (< 640px) 6 แถว × 13 ใบ
   * v1 ใช้ 3 แถวทุกจอ บนมือถือพัดถูกย่อจนไพ่กว้าง ~15px จิ้มโดนใบข้าง ๆ (v2 · 2026-10-16)
   * อ่านขนาดจอตั้งแต่เรนเดอร์แรก — พัดไพ่ไม่เคยอยู่ใน HTML จากเซิร์ฟเวอร์ (ขั้นนี้เกิดหลังกดในเบราว์เซอร์เสมอ)
   * ถ้าเริ่ม 3 แถวแล้วค่อยสลับ ไพ่ทุกใบย้ายแถว = AnimatePresence เล่นขาออกทั้งสำรับ (เห็นไพ่ปลิว)
   */
  const [rows, setRows] = useState(() =>
    typeof window !== "undefined" && window.matchMedia?.("(max-width: 639px)").matches ? 6 : 3,
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const apply = () => setRows(mq.matches ? 6 : 3);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  useEffect(() => {
    const id = window.setTimeout(fitFan, 30);
    return () => window.clearTimeout(id);
  }, [rows, fitFan]);
  const perTier = Math.ceil(totalCards / rows);
  const tiers = useMemo(() => {
    const out: number[][] = Array.from({ length: rows }, () => []);
    for (let i = 0; i < totalCards; i++) out[Math.min(rows - 1, Math.floor(i / perTier))].push(i);
    return out;
  }, [totalCards, rows, perTier]);

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

  /*
   * v2 (เจ้าของ 2026-10-16 "ลดขั้นตอน ทำให้ใช้ง่ายกว่านี้ และสวย") — โต๊ะเลือกไพ่
   * หัว: บอกแค่ "ใบนี้สำหรับตำแหน่งไหน" · กลาง: พัดไพ่บนผ้าปูโต๊ะ · ล่าง: ช่องวางไพ่ตามตำแหน่งจริง
   * (v1 มีแถบความคืบหน้า + ป้าย "ใบที่ n" + ภาพไพ่ประดับ ซ้ำกันสามที่ และปุ่มสุ่มเล็กจนหาไม่เจอ)
   */
  const names = positionNames ?? [];
  return (
    <div className="v2-pick">
      <div className="v2-pick-head" aria-live="polite">
        {!isComplete ? (
          <>
            <p className="v2-pick-k">
              {isEnglish
                ? `Card ${pickedIndices.length + 1} of ${targetCount}`
                : `ใบที่ ${pickedIndices.length + 1} จาก ${targetCount}`}
            </p>
            <h2 className="v2-pick-t">
              <ThaiPhrases>{isEnglish ? "Pick a card for" : "เลือกไพ่สำหรับ"}</ThaiPhrases>{" "}
              <span>{positionLabel}</span>
            </h2>
          </>
        ) : (
          <>
            <p className="v2-pick-k">{isEnglish ? "All cards chosen" : "เลือกครบแล้ว"}</p>
            <h2 className="v2-pick-t">
              {isEnglish ? "Laying out your cards..." : "กำลังวางไพ่ลงผังของคุณ..."}
            </h2>
          </>
        )}
      </div>

      {/* โต๊ะผ้าปู — พัดไพ่ทั้ง 3 ชั้นย่อพอดีความกว้าง ไม่ต้องเลื่อน (P1-U10) */}
      <div className="v2-tb">
        <div ref={stageRef} className="v2-tb-stage">
          <div
            ref={fanRef}
            className="v2-tb-fan"
            style={{
              transform: `scale(${fanFit.scale})`,
              // ย่อจากมุมซ้ายบน: เมื่อพัดกว้างกว่ากรอบ mx-auto จะ pin ไว้ซ้าย → origin ต้องเป็นซ้ายด้วย
              transformOrigin: "top left",
              marginBottom: -fanFit.trimY,
            }}
          >
            {tiers.map((tierCards, tierIdx) => (
              <div key={tierIdx} className={`v2-tb-tier is-t${tierIdx % 3}`} style={{ zIndex: tierIdx * 30 }}>
                <AnimatePresence>
                  {tierCards.map((cardIdx, posInTier) => (
                    <FanCard
                      key={cardIdx}
                      cardIdx={cardIdx}
                      posInTier={posInTier}
                      tierIdx={tierIdx}
                      perTier={perTier}
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
            ))}
          </div>
        </div>

        {/* ช่องวางไพ่ตามตำแหน่งของผัง — เห็นทันทีว่าเหลืออีกกี่ใบ และใบต่อไปไปลงตรงไหน */}
        <ol className="v2-tb-slots" aria-label={isEnglish ? "Your spread positions" : "ตำแหน่งในผัง"}>
          {Array.from({ length: targetCount }).map((_, idx) => {
            const isFilled = idx < pickedIndices.length;
            const isCurrent = idx === pickedIndices.length;
            const label = (names[idx] || (isEnglish ? `Card ${idx + 1}` : `ใบที่ ${idx + 1}`)).replace(/^\d+\.\s*/, "");
            return (
              <li key={idx} className={isFilled ? "is-filled" : isCurrent ? "is-now" : ""}>
                <span className={`v2-tb-slot${isFilled ? " card-back-pattern" : ""}`} aria-hidden="true">
                  {!isFilled && idx + 1}
                </span>
                <span className="v2-tb-slot-name">{label}</span>
              </li>
            );
          })}
        </ol>
      </div>

      {!isComplete && (
        <div className="v2-pick-tools">
          <p>{isEnglish ? "Tap the card you feel drawn to" : "แตะใบที่รู้สึกว่าใช่ ไม่มีถูกหรือผิด"}</p>
          {/* P1-U6: ทางเลือกสำหรับคีย์บอร์ด/คนไม่อยากเลือกเอง */}
          <button
            type="button"
            onClick={handleAutoPick}
            disabled={disabled}
            className="v2-pick-auto"
            aria-label={isEnglish ? "Auto-draw next card" : "สุ่มเลือกไพ่ใบถัดไปอัตโนมัติ"}
          >
            {isEnglish ? "Draw for me" : "สุ่มให้ฉัน"}
          </button>
        </div>
      )}
    </div>
  );
};
