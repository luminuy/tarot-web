"use client";

import React, { useState, useRef } from "react";
import { cardSummaryById, cardSummaryByIndex } from "@/data/cards/summary";
import { CardImage } from "@/components/card/CardImage";
import { getCardImageSrc } from "@/lib/tarot/card-image";
import { useLocale } from "@/lib/i18n";

export interface TarotCardProps {
  card?: {
    id?: string;
    nameTh?: string;
    nameEn?: string;
    image?: string;
    element?: string;
    keywords?: string[] | { upright: string[]; reversed: string[] };
    cardIndex?: number;
    [key: string]: any;
  };
  isReversed?: boolean;
  isRevealed?: boolean;
  isHighlighted?: boolean;
  positionLabel?: string;
  size?: "sm" | "md" | "lg" | "responsive";
  className?: string;
  onClick?: () => void;
  /**
   * ความกว้างจริงที่การ์ดถูกแสดงบนหน้าจอ ใช้เลือกไฟล์ภาพย่อให้พอดี
   * (ต้องส่งมาเองเมื่อ override ขนาดด้วย `className` เช่น `w-full h-full`)
   */
  imageSizes?: string;
  /** `true` = ใช้ภาพต้นฉบับความละเอียดเต็ม สำหรับการ์ดใบใหญ่ เช่น หน้าซูมไพ่ */
  imageFull?: boolean;
}

const ELEMENT_CONFIG: Record<string, { border: string; glow: string; icon: string; name: string; bgGradient: string }> =
  {
    ไฟ: {
      border: "#D9C8AC",
      glow: "rgba(143, 92, 26, 0.12)",
      icon: "•",
      name: "ธาตุไฟ (Wands)",
      bgGradient: "from-surface via-surface to-surface",
    },
    น้ำ: {
      border: "#D9C8AC",
      glow: "rgba(143, 92, 26, 0.12)",
      icon: "•",
      name: "ธาตุน้ำ (Cups)",
      bgGradient: "from-surface via-surface to-surface",
    },
    ลม: {
      border: "#D9C8AC",
      glow: "rgba(143, 92, 26, 0.12)",
      icon: "•",
      name: "ธาตุลม (Swords)",
      bgGradient: "from-surface via-surface to-surface",
    },
    ดิน: {
      border: "#D9C8AC",
      glow: "rgba(143, 92, 26, 0.12)",
      icon: "•",
      name: "ธาตุดิน (Pentacles)",
      bgGradient: "from-surface via-surface to-surface",
    },
  };

const SIZE_MAP = {
  sm: "w-20 h-[136px] text-xs",
  md: "w-28 h-[190px] sm:w-32 sm:h-[218px] text-sm",
  lg: "w-48 h-[326px] sm:w-56 sm:h-[380px] text-base",
  responsive: "w-full aspect-[1/1.7] max-w-[200px]",
};

/**
 * ✦ อุปกรณ์นี้มี "ตัวชี้ที่แม่นยำ" (เมาส์ / trackpad) หรือไม่
 *
 * เอฟเฟกต์เอียงไพ่ตามเมาส์ (parallax) มีความหมายเฉพาะกับเมาส์เท่านั้น
 * แต่บนมือถือ เบราว์เซอร์ยัง "สังเคราะห์" เหตุการณ์ mousemove ตามหลังการแตะทุกครั้ง
 * ตัวจับจึงยังทำงานอยู่ดี แล้วสั่งสปริง 4 ตัวต่อไพ่หนึ่งใบให้วิ่ง — ผู้ใช้ไม่ได้อะไรเลย
 * นอกจากเฟรมที่หายไป (ผู้ชมเว็บนี้ 85% เป็นมือถือ)
 *
 * ⚠️ ต้องอ่านค่า "ตอนผู้ใช้ขยับเมาส์" เท่านั้น ห้ามอ่านระหว่างเรนเดอร์
 * `matchMedia` ให้คำตอบคนละอย่างระหว่างเซิร์ฟเวอร์กับเบราว์เซอร์ = hydration mismatch
 * ซึ่งเป็นบทเรียนที่จ่ายราคาไปแล้วใน INC-0053 (useReducedMotion ตอน SSR)
 */
let finePointerCache: boolean | null = null;
function hasFinePointer(): boolean {
  if (finePointerCache !== null) return finePointerCache;
  finePointerCache = typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(pointer: fine)").matches
    : false;
  return finePointerCache;
}

const DEFAULT_IMAGE_SIZES: Record<string, string> = {
  sm: "160px",
  md: "(min-width: 640px) 280px, 200px",
  lg: "(min-width: 640px) 512px, 320px",
  responsive: "320px",
};

export const TarotCard: React.FC<TarotCardProps> = ({
  card,
  isReversed = false,
  isRevealed = false,
  isHighlighted = false,
  positionLabel,
  size = "md",
  className = "",
  onClick,
  imageSizes,
  imageFull = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { isEnglish } = useLocale();

  const effectiveImageSizes = imageSizes ?? DEFAULT_IMAGE_SIZES[size] ?? "120px";

  /*
   * ✦ เอียงไพ่ตามเมาส์ — เขียนลง CSS custom property ตรง ๆ ไม่ผ่าน React
   *
   * ของเดิมใช้ `useSpring` 2 ตัวต่อไพ่ 1 ใบ ให้ไลบรารีคำนวณค่าใหม่ทุกเฟรมบนเธรดหลัก
   * ทั้งที่ผลลัพธ์สุดท้ายคือ "เขียนตัวเลขลง transform" ซึ่งเขียนเองได้ในบรรทัดเดียว
   * ส่วนหน้าที่ "กลบการกระตุกระหว่างเฟรม" ที่สปริงเคยทำ ตอนนี้เป็นของ
   * `transition: transform 120ms` บนคลาส `.card-tilt` (ดู globals.css) ซึ่ง compositor ทำเอง
   *
   * ⚠️ ห้ามเก็บค่านี้ลง React state เด็ดขาด — mousemove ยิงถี่หลายสิบครั้งต่อวินาที
   * การ setState ทุกครั้งจะบังคับให้ทั้งคอมโพเนนต์เรนเดอร์ใหม่ตามไปด้วย
   */
  const tiltRef = useRef<HTMLDivElement>(null);
  /*
   * ⚠️ เคยมีสปริง `glintX` / `glintY` อีกสองตัวตรงนี้ ป้อนตำแหน่งประกายทองในชั้นแสงข้างล่าง
   * แต่ค่ามันถูกอ่านด้วย `.get()` "ระหว่างเรนเดอร์" ซึ่งทำสองอย่างพร้อมกัน:
   *   1. ผิดหลัก React (อ่านค่าที่เปลี่ยนนอกวงจรเรนเดอร์ระหว่างเรนเดอร์ — INC-0053)
   *   2. ไม่ทำงานจริง — ค่าที่อ่านได้จะอัปเดตก็ต่อเมื่อคอมโพเนนต์เรนเดอร์ใหม่ ซึ่งการขยับ
   *      เมาส์ไม่ได้สั่งให้เรนเดอร์ใหม่เลย ประกายจึงค้างที่กึ่งกลาง (50%) ตลอดมา
   * = จ่ายค่าสปริง 2 ตัวต่อไพ่ 1 ใบ เพื่อภาพนิ่ง · ถอดออกแล้วเขียนค่า 50% ตรง ๆ
   * หน้าตาที่ผู้ใช้เห็นเหมือนเดิมเป๊ะทุกพิกเซล
   */

  // Safely resolve the card object even if nested or only id/index is provided
  const rawCard = (card as any)?.card || card;
  const resolved = rawCard?.id
    ? cardSummaryById(rawCard.id)
    : rawCard?.cardIndex !== undefined
      ? cardSummaryByIndex(rawCard.cardIndex)
      : undefined;
  const effectiveCard =
    rawCard?.image && (rawCard?.nameTh || rawCard?.name)
      ? rawCard
      : resolved
        ? { ...resolved, nameTh: resolved.nameTh || resolved.name }
        : rawCard;

  const elem = effectiveCard?.element
    ? ELEMENT_CONFIG[effectiveCard.element] || ELEMENT_CONFIG["ไฟ"]
    : ELEMENT_CONFIG["ไฟ"];

  /**
   * ⚠️ อ่านขนาดกล่องครั้งเดียวตอนเมาส์เข้า ไม่ใช่ทุกครั้งที่เมาส์ขยับ
   * `getBoundingClientRect()` บังคับให้เบราว์เซอร์คำนวณ layout ใหม่ทันที (forced reflow)
   * เรียกทุก mousemove ขณะที่การ์ดกำลังเล่น transform อยู่ = สะดุดชัดเจน
   * และผังใหญ่มีการ์ดแบบนี้พร้อมกันได้ถึง 10 ใบ
   */
  const rectRef = useRef<DOMRect | null>(null);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasFinePointer()) return;
    rectRef.current = e.currentTarget.getBoundingClientRect();
    setIsHovered(true);
  };

  const setTilt = (rx: number, ry: number) => {
    const el = tiltRef.current;
    if (!el) return;
    el.style.setProperty("--card-rx", `${rx}deg`);
    el.style.setProperty("--card-ry", `${ry}deg`);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = rectRef.current;
    if (!rect || rect.width === 0 || rect.height === 0) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    // ช่วงเดียวกับของเดิมเป๊ะ: แกน x เอียง +14..-14 องศา · แกน y เอียง -14..+14
    setTilt(py * -28, px * 28);
  };

  const handleMouseLeave = () => {
    rectRef.current = null;
    setTilt(0, 0);
    setIsHovered(false);
  };

  const imageSrc = getCardImageSrc(effectiveCard?.image, effectiveCard?.id);

  return (
    <div
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`card-scene select-none group relative ${SIZE_MAP[size]} ${className} ${
        onClick ? "cursor-pointer" : ""
      }`}
      style={{ perspective: 1800 }}
    >
      {/*
        * สามชั้นนี้แทน `<motion.div>` ชั้นเดียวของเดิม — เหตุผลที่ต้องแยกชั้น
        * (transform มี transition ได้จังหวะเดียว แต่ต้องการสามจังหวะ) อธิบายไว้ที่ globals.css
        * ค่าทั้งหมดส่งผ่าน custom property จึงไม่มี JS วิ่งต่อเฟรมแม้แต่ตัวเดียว
        */}
      <div
        className="w-full h-full relative card-lift rounded-lg"
        data-lift={
          isHighlighted ? (isRevealed ? "high-deep" : "high") : isHovered ? "hover" : "none"
        }
      >
      <div ref={tiltRef} className="w-full h-full relative card-tilt rounded-lg">
      <div
        className="w-full h-full relative card-inner card-flip rounded-lg"
        data-revealed={isRevealed ? "true" : "false"}
      >
        {/* ========================================================= */}
        {/* 1. ด้านหลังไพ่ (Sacred Card Back - Obsidian & Gold Filigree) */}
        {/* ========================================================= */}
        <div
          className={`card-face absolute inset-0 rounded-lg overflow-hidden shadow-overlay border-2 border-line-warm/60 card-back-pattern flex flex-col items-center justify-between p-3 transition-opacity duration-300 ${
            isRevealed ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            boxShadow: "var(--shadow-raised)",
          }}
        >
          {/* S-01: GPU composite shadow layer — แอนิเมตเฉพาะ opacity ไม่ทำให้เกิด repaint */}
          <div
            aria-hidden
            className="absolute inset-0 rounded-lg pointer-events-none transition-opacity duration-200"
            style={{
              boxShadow: "var(--shadow-overlay)",
              opacity: isHighlighted || isHovered ? 1 : 0,
              willChange: isHovered || isHighlighted ? "opacity" : undefined,
            }}
          />

          {/* Top Frame Gold Header */}
          <div className="w-full flex justify-center items-center opacity-85 z-10">
            <span className="text-[12px] font-serif-th text-surface tracking-[0.25em] uppercase font-bold">
              SACRED ORACLE
            </span>
          </div>

          {/* Center Position Tag & Tap to Reveal Badge */}
          <div className="flex flex-col items-center justify-center my-auto gap-1.5 relative z-10">
            {positionLabel && (
              <span className="text-[12px] text-surface font-serif-th font-semibold text-center px-2.5 py-0.5 rounded-full bg-ink-deep/90 border border-line-warm line-clamp-1 max-w-[95%] ">
                {positionLabel}
              </span>
            )}
            {!isRevealed && (
              /*
               * ⚠️ ห้ามเปลี่ยนกลับไปใช้ `<motion.div animate={{ scale: [...] }} repeat: Infinity>`
               * ป้ายนี้อยู่บนไพ่ "ทุกใบที่ยังคว่ำหน้า" — ผังใหญ่มีพร้อมกันได้ถึง 10 ใบ
               * ลูปของ motion คำนวณบนเธรดหลักทุกเฟรมตลอดเวลา = เธรดหลักไม่เคยว่าง
               * ทับกับจังหวะที่ผู้ใช้เลื่อนหน้าและคำทำนายกำลังสตรีมเข้ามาพอดี
               * `.anim-badge-pulse` เป็น CSS keyframes ที่แตะเฉพาะ transform → compositor ทำเอง
               * จำนวนไพ่บนจอจึงไม่มีผลกับเฟรมเรตอีกต่อไป (ดู globals.css)
               */
              <div className="anim-badge-pulse px-2.5 py-1 rounded-full bg-surface border border-line-warm z-20 flex items-center gap-1 text-[12px] text-ink-deep font-serif-th font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-gold-ink animate-ping" />
                <span>{isEnglish ? "Tap to reveal" : "แตะเพื่อเปิด"}</span>
              </div>
            )}
          </div>

          {/* Bottom Frame Subtle Border */}
          <div className="w-full flex justify-center items-center opacity-60 z-10">
            <div className="w-12 h-0.5 bg-inset-warm/60 rounded-full" />
          </div>

          {/* Ethereal Dynamic Gold Foil Glint Reflection */}
          <div
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-60 transition-opacity duration-500"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(205,159,91,0.3) 0%, rgba(214,180,141,0.1) 40%, transparent 70%)",
            }}
          />
        </div>

        {/* ========================================================= */}
        {/* 2. ด้านหน้าไพ่ (Card Face - Pure 1909 Rider-Waite Luxury) */}
        {/* ========================================================= */}
        <div
          className={`card-face card-face--back absolute inset-0 rounded-lg overflow-hidden border-2 bg-inset-warm transition-opacity duration-300 ${
            !isRevealed ? "pointer-events-none opacity-0" : "opacity-100"
          } ${isHighlighted ? "ring-2 ring-gold-ink ring-offset-2 ring-offset-[#F3EDE2]" : ""}`}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            borderColor: elem.border,
            boxShadow: "var(--shadow-raised)",
          }}
        >
          {/* S-01: GPU composite shadow layer — แอนิเมตเฉพาะ opacity ไม่ทำให้เกิด repaint */}
          <div
            aria-hidden
            className="absolute inset-0 rounded-lg pointer-events-none transition-opacity duration-200"
            style={{
              boxShadow: "var(--shadow-overlay)",
              opacity: isHighlighted || isHovered ? 1 : 0,
              willChange: isHovered || isHighlighted ? "opacity" : undefined,
            }}
          />
          {/* Full Authentic 1909 Rider-Waite Card Face */}
          <div className={`w-full h-full relative overflow-hidden ${isReversed ? "rotate-180" : ""}`}>
            {imageSrc ? (
              <CardImage
                image={effectiveCard?.image}
                cardId={effectiveCard?.id}
                alt={(isEnglish ? effectiveCard?.nameEn : effectiveCard?.nameTh) || effectiveCard?.nameTh || "Tarot"}
                className="w-full h-full object-cover object-center tarot-card-enhance tarot-hd-card-image"
                sizes={effectiveImageSizes}
                full={imageFull}
              />
            ) : (
              <div className="w-full h-full bg-surface flex items-center justify-center">
                
              </div>
            )}
          </div>

          {/* Sleek Floating Reversed Badge if applicable */}
          {isReversed && (
            <div className="absolute top-2 left-2 z-20 pointer-events-none">
              <span className="text-[12px] font-bold font-serif-th bg-ink-deep/90 text-surface border border-line-warm/80 px-2 py-0.5 rounded-full ">
                {isEnglish ? "Reversed" : "กลับหัว"}
              </span>
            </div>
          )}

          {/* Specular Light Dynamic Sweep Layer */}
          <div
            className="absolute inset-0 pointer-events-none opacity-25 group-hover:opacity-50 transition-opacity z-20"
            style={{
              background:
                "linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)",
            }}
          />
        </div>
      </div>
      </div>
      </div>
    </div>
  );
};
