"use client";

import React, { useState, useEffect } from "react";
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

const ELEMENT_CONFIG: Record<string, { border: string; glow: string; icon: string; name: string; bgGradient: string }> = {
  ไฟ: {
    border: "#ff9f43",
    glow: "rgba(255, 159, 67, 0.45)",
    icon: "✦",
    name: "ธาตุไฟ (Wands)",
    bgGradient: "from-[#2a1308] via-[#140a04] to-[#080402]",
  },
  น้ำ: {
    border: "#38bdf8",
    glow: "rgba(56, 189, 248, 0.45)",
    icon: "✦",
    name: "ธาตุน้ำ (Cups)",
    bgGradient: "from-[#081f30] via-[#05101a] to-[#02070c]",
  },
  ลม: {
    border: "#a855f7",
    glow: "rgba(168, 85, 247, 0.45)",
    icon: "✦",
    name: "ธาตุลม (Swords)",
    bgGradient: "from-[#1d0d33] via-[#0e061a] to-[#05020a]",
  },
  ดิน: {
    border: "#10b981",
    glow: "rgba(16, 185, 129, 0.45)",
    icon: "✦",
    name: "ธาตุดิน (Pentacles)",
    bgGradient: "from-[#0a2318] via-[#05140d] to-[#020805]",
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
  const [imgFailed, setImgFailed] = useState(false);

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
      ? cardByIndex(rawCard.cardIndex)
      : rawCard;

  const elem = effectiveCard?.element ? ELEMENT_CONFIG[effectiveCard.element] || ELEMENT_CONFIG["ไฟ"] : ELEMENT_CONFIG["ไฟ"];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  const imageSrc = getCardImageSrc(effectiveCard?.image, effectiveCard?.id);

  useEffect(() => {
    setImgFailed(false);
  }, [imageSrc]);

  return (
    <div
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className={`card-scene select-none group relative ${SIZE_MAP[size]} ${className} ${
        onClick ? "cursor-pointer" : ""
      }`}
      style={{ perspective: 1800 }}
    >
      <motion.div
        className="w-full h-full relative card-inner rounded-2xl"
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
          className={`card-face absolute inset-0 rounded-2xl overflow-hidden shadow-2xl border-2 border-[#e5c07b]/60 card-back-pattern flex flex-col items-center justify-between p-3 transition-opacity duration-300 ${
            isRevealed ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            boxShadow: isHighlighted
              ? "0 0 35px rgba(229, 192, 123, 0.75), 0 0 70px rgba(168, 85, 247, 0.45)"
              : isHovered
              ? "0 0 25px rgba(229, 192, 123, 0.5), 0 20px 40px rgba(0,0,0,0.95)"
              : "0 10px 30px rgba(0, 0, 0, 0.85)",
          }}
        >
          {/* Top Frame Gold Header */}
          <div className="w-full flex justify-center items-center opacity-80 z-10">
            <span className="text-[8px] font-serif-th text-[#f5deaa] tracking-[0.25em] uppercase font-bold">
              SACRED ORACLE
            </span>
          </div>

          {/* Center Position Tag & Tap to Reveal Badge */}
          <div className="flex flex-col items-center justify-center my-auto gap-1.5 relative z-10">
            {positionLabel && (
              <span className="text-[9px] text-[#f5deaa] font-serif-th font-semibold text-center px-2.5 py-0.5 rounded-full bg-black/85 border border-[#e5c07b]/40 backdrop-blur-md line-clamp-1 max-w-[95%] shadow-[0_0_10px_rgba(0,0,0,0.8)]">
                {positionLabel}
              </span>
            )}
            {!isRevealed && (
              <motion.div
                animate={{ scale: [0.95, 1.05, 0.95] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                className="px-2.5 py-1 rounded-full bg-[#180f2e]/95 border border-[#e5c07b] shadow-[0_0_15px_rgba(229,192,123,0.6)] z-20 flex items-center gap-1 text-[8.5px] text-[#f5deaa] font-serif-th font-bold"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#ffd700] animate-ping" />
                <span>แตะเพื่อเปิด</span>
              </motion.div>
            )}
          </div>

          {/* Bottom Frame Subtle Border */}
          <div className="w-full flex justify-center items-center opacity-60 z-10">
            <div className="w-12 h-0.5 bg-[#e5c07b]/40 rounded-full" />
          </div>

          {/* Ethereal Dynamic Gold Foil Glint Reflection */}
          <motion.div
            className="absolute inset-0 pointer-events-none opacity-40 group-hover:opacity-75 transition-opacity"
            style={{
              background: `radial-gradient(circle at ${glintX.get()}% ${glintY.get()}%, rgba(255,230,150,0.4) 0%, rgba(229,192,123,0.1) 40%, transparent 70%)`,
            }}
          />
        </div>

        {/* ========================================================= */}
        {/* 2. ด้านหน้าไพ่ (Card Face - Pure 1909 Rider-Waite Luxury) */}
        {/* ========================================================= */}
        <div
          className={`card-face card-face--back absolute inset-0 rounded-2xl overflow-hidden shadow-2xl border-2 bg-[#05040a] transition-opacity duration-300 ${
            !isRevealed ? "pointer-events-none opacity-0" : "opacity-100"
          } ${
            isHighlighted ? "ring-2 ring-[#e5c07b] ring-offset-2 ring-offset-[#05040a]" : ""
          }`}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            borderColor: elem.border,
            boxShadow: isHighlighted
              ? `0 0 45px ${elem.glow}, 0 0 80px rgba(229, 192, 123, 0.4)`
              : isHovered
              ? `0 0 30px ${elem.glow}, 0 20px 45px rgba(0,0,0,0.95)`
              : "0 15px 35px rgba(0,0,0,0.9)",
          }}
        >
          {/* Full Authentic 1909 Rider-Waite Card Face */}
          <div className={`w-full h-full relative overflow-hidden ${isReversed ? "rotate-180" : ""}`}>
            {imageSrc ? (
              <CardImage
                image={effectiveCard?.image}
                cardId={effectiveCard?.id}
                alt={effectiveCard?.nameTh || "Tarot"}
                className="w-full h-full object-cover object-center filter contrast-[1.08] saturate-[1.08] brightness-[1.03] tarot-hd-card-image"
                sizes={effectiveImageSizes}
                full={imageFull}
              />
            ) : (
              <div className="w-full h-full bg-[#100b20] flex items-center justify-center">
                <span className="text-xs text-[#e5c07b]">✦</span>
              </div>
            )}
          </div>

          {/* Sleek Floating Reversed Badge if applicable */}
          {isReversed && (
            <div className="absolute top-2 left-2 z-20 pointer-events-none">
              <span className="text-[8px] font-bold font-serif-th bg-rose-950/90 text-rose-200 border border-rose-500/70 px-2 py-0.5 rounded-full shadow-lg backdrop-blur-md">
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
