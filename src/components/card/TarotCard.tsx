"use client";

import React, { useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { SPRING } from "@/lib/motion";
import { cardById, cardByIndex } from "@/data/cards";
import { CardImage } from "@/components/card/CardImage";
import { getCardImageSrc } from "@/lib/tarot/card-image";

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
      icon: "✦",
      name: "ธาตุไฟ (Wands)",
      bgGradient: "from-[#FFFFFF] via-[#FFFFFF] to-[#FFFFFF]",
    },
    น้ำ: {
      border: "#D9C8AC",
      glow: "rgba(143, 92, 26, 0.12)",
      icon: "✦",
      name: "ธาตุน้ำ (Cups)",
      bgGradient: "from-[#FFFFFF] via-[#FFFFFF] to-[#FFFFFF]",
    },
    ลม: {
      border: "#D9C8AC",
      glow: "rgba(143, 92, 26, 0.12)",
      icon: "✦",
      name: "ธาตุลม (Swords)",
      bgGradient: "from-[#FFFFFF] via-[#FFFFFF] to-[#FFFFFF]",
    },
    ดิน: {
      border: "#D9C8AC",
      glow: "rgba(143, 92, 26, 0.12)",
      icon: "✦",
      name: "ธาตุดิน (Pentacles)",
      bgGradient: "from-[#FFFFFF] via-[#FFFFFF] to-[#FFFFFF]",
    },
  };

const SIZE_MAP = {
  sm: "w-20 h-[136px] text-xs",
  md: "w-28 h-[190px] sm:w-32 sm:h-[218px] text-sm",
  lg: "w-48 h-[326px] sm:w-56 sm:h-[380px] text-base",
  responsive: "w-full aspect-[1/1.7] max-w-[200px]",
};

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

  const effectiveImageSizes = imageSizes ?? DEFAULT_IMAGE_SIZES[size] ?? "120px";

  // Smooth Interactive 3D Parallax Spring Physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 280 };
  const smoothRotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [14, -14]), springConfig);
  const smoothRotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-14, 14]), springConfig);
  const glintX = useSpring(useTransform(mouseX, [-0.5, 0.5], [0, 100]), springConfig);
  const glintY = useSpring(useTransform(mouseY, [-0.5, 0.5], [0, 100]), springConfig);

  // Safely resolve the card object even if nested or only id/index is provided
  const rawCard = (card as any)?.card || card;
  const effectiveCard =
    rawCard?.image && rawCard?.nameTh
      ? rawCard
      : rawCard?.id
        ? cardById(rawCard.id) || rawCard
        : rawCard?.cardIndex !== undefined
          ? cardByIndex(rawCard.cardIndex) || rawCard
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
    rectRef.current = e.currentTarget.getBoundingClientRect();
    setIsHovered(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = rectRef.current;
    if (!rect || rect.width === 0 || rect.height === 0) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    rectRef.current = null;
    mouseX.set(0);
    mouseY.set(0);
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
      <motion.div
        className="w-full h-full relative card-inner rounded-lg"
        animate={{
          rotateY: isRevealed ? 180 : 0,
          scale: isHighlighted ? 1.08 : isHovered ? 1.05 : 1,
          y: isHighlighted ? -10 : isHovered ? -5 : 0,
          z: isRevealed && isHighlighted ? 20 : 0,
        }}
        style={{
          rotateX: smoothRotateX,
          rotateY: isRevealed ? 180 : smoothRotateY,
          transformStyle: "preserve-3d",
        }}
        transition={{
          rotateY: SPRING.card,
          scale: SPRING.snappy,
          y: SPRING.follow,
          z: SPRING.card,
        }}
      >
        {/* ========================================================= */}
        {/* 1. ด้านหลังไพ่ (Sacred Card Back - Obsidian & Gold Filigree) */}
        {/* ========================================================= */}
        <div
          className={`card-face absolute inset-0 rounded-lg overflow-hidden shadow-[var(--shadow-overlay)] border-2 border-[#D9C8AC]/60 card-back-pattern flex flex-col items-center justify-between p-3 transition-opacity duration-300 ${
            isRevealed ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            boxShadow: isHighlighted || isHovered ? "var(--shadow-overlay)" : "var(--shadow-raised)",
          }}
        >
          {/* Top Frame Gold Header */}
          <div className="w-full flex justify-center items-center opacity-85 z-10">
            <span className="text-[12px] font-serif-th text-[#FFFFFF] tracking-[0.25em] uppercase font-bold">
              SACRED ORACLE
            </span>
          </div>

          {/* Center Position Tag & Tap to Reveal Badge */}
          <div className="flex flex-col items-center justify-center my-auto gap-1.5 relative z-10">
            {positionLabel && (
              <span className="text-[12px] text-[#FFFFFF] font-serif-th font-semibold text-center px-2.5 py-0.5 rounded-full bg-[#2E211A]/90 border border-[#D9C8AC] line-clamp-1 max-w-[95%] ">
                {positionLabel}
              </span>
            )}
            {!isRevealed && (
              <motion.div
                animate={{ scale: [0.95, 1.05, 0.95] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                className="px-2.5 py-1 rounded-full bg-[#FFFFFF] border border-[#D9C8AC] z-20 flex items-center gap-1 text-[12px] text-[#2E211A] font-serif-th font-bold"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#8F5C1A] animate-ping" />
                <span>แตะเพื่อเปิด</span>
              </motion.div>
            )}
          </div>

          {/* Bottom Frame Subtle Border */}
          <div className="w-full flex justify-center items-center opacity-60 z-10">
            <div className="w-12 h-0.5 bg-[#F3EDE2]/60 rounded-full" />
          </div>

          {/* Ethereal Dynamic Gold Foil Glint Reflection */}
          <motion.div
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-60 transition-opacity duration-500"
            style={{
              background: `radial-gradient(circle at ${glintX.get()}% ${glintY.get()}%, rgba(205,159,91,0.3) 0%, rgba(214,180,141,0.1) 40%, transparent 70%)`,
            }}
          />
        </div>

        {/* ========================================================= */}
        {/* 2. ด้านหน้าไพ่ (Card Face - Pure 1909 Rider-Waite Luxury) */}
        {/* ========================================================= */}
        <div
          className={`card-face card-face--back absolute inset-0 rounded-lg overflow-hidden border-2 bg-[#F3EDE2] transition-opacity duration-300 ${
            !isRevealed ? "pointer-events-none opacity-0" : "opacity-100"
          } ${isHighlighted ? "ring-2 ring-[#8F5C1A] ring-offset-2 ring-offset-[#F3EDE2]" : ""}`}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            borderColor: elem.border,
            boxShadow: isHighlighted || isHovered ? "var(--shadow-overlay)" : "var(--shadow-raised)",
          }}
        >
          {/* Full Authentic 1909 Rider-Waite Card Face */}
          <div className={`w-full h-full relative overflow-hidden ${isReversed ? "rotate-180" : ""}`}>
            {imageSrc ? (
              <CardImage
                image={effectiveCard?.image}
                cardId={effectiveCard?.id}
                alt={effectiveCard?.nameTh || "Tarot"}
                className="w-full h-full object-cover object-center tarot-card-enhance tarot-hd-card-image"
                sizes={effectiveImageSizes}
                full={imageFull}
              />
            ) : (
              <div className="w-full h-full bg-[#FFFFFF] flex items-center justify-center">
                <span className="text-xs text-[#8F5C1A]">✦</span>
              </div>
            )}
          </div>

          {/* Sleek Floating Reversed Badge if applicable */}
          {isReversed && (
            <div className="absolute top-2 left-2 z-20 pointer-events-none">
              <span className="text-[12px] font-bold font-serif-th bg-[#2E211A]/90 text-[#FFFFFF] border border-[#D9C8AC]/80 px-2 py-0.5 rounded-full ">
                กลับหัว
              </span>
            </div>
          )}

          {/* Specular Light Dynamic Sweep Layer */}
          <motion.div
            className="absolute inset-0 pointer-events-none opacity-25 group-hover:opacity-50 transition-opacity z-20"
            style={{
              background: `linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.2) ${glintX.get()}%, transparent 100%)`,
            }}
          />
        </div>
      </motion.div>
    </div>
  );
};
