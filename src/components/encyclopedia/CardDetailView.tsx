"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import type { TarotCard } from "@/data/cards/types";
import { CardImage } from "@/components/card/CardImage";
import { getCardImageSrc } from "@/lib/tarot/card-image";

interface CardDetailViewProps {
  card: TarotCard;
  prevCard?: TarotCard;
  nextCard?: TarotCard;
  totalCards: number;
  currentIndex: number;
}

const ELEMENT_CONFIG: Record<string, { border: string; glow: string; text: string; bg: string; icon: string }> = {
  ไฟ: {
    border: "border-[#8F5C1A]/40",
    glow: "rgba(245, 158, 11, 0.35)",
    text: "text-[#8F5C1A]",
    bg: "bg-[#8F5C1A]/15",
    icon: "✦",
  },
  น้ำ: {
    border: "border-[#6F5B4A]/40",
    glow: "rgba(56, 189, 248, 0.35)",
    text: "text-[#6F5B4A]",
    bg: "bg-[#6F5B4A]/15",
    icon: "✦",
  },
  ลม: {
    border: "border-[#6F5B4A]/40",
    glow: "rgba(168, 85, 247, 0.35)",
    text: "text-[#6F5B4A]",
    bg: "bg-[#6F5B4A]/15",
    icon: "✦",
  },
  ดิน: {
    border: "border-[#3A7044]/40",
    glow: "rgba(16, 185, 129, 0.35)",
    text: "text-[#3A7044]",
    bg: "bg-[#3A7044]/15",
    icon: "✦",
  },
};

export const CardDetailView: React.FC<CardDetailViewProps> = ({
  card,
  prevCard,
  nextCard,
  totalCards,
  currentIndex,
}) => {
  const [orientation, setOrientation] = useState<"upright" | "reversed">("upright");

  const isUpright = orientation === "upright";
  const currentKeywords = isUpright ? card.keywords.upright : card.keywords.reversed;
  const elem = ELEMENT_CONFIG[card.element] || ELEMENT_CONFIG["ไฟ"];

  // ภาพหน้าไพ่ใบหลักใช้ไฟล์ต้นฉบับความละเอียดเต็ม (แสดงใหญ่ 256-288px)
  const getImageSrc = (targetCard?: TarotCard) => getCardImageSrc(targetCard?.image, targetCard?.id) ?? "";

  const categories = [
    { id: "general" as const, nameTh: "ภาพรวมและเส้นทางชีวิต", icon: "✦", color: "#8F5C1A" },
    { id: "love" as const, nameTh: "ความรักและคนในใจ", icon: "✦", color: "#A6392C" },
    { id: "work" as const, nameTh: "การงานและโครงการ", icon: "✦", color: "#6F5B4A" },
    { id: "money" as const, nameTh: "การเงินและโชคลาภ", icon: "◆", color: "#3A7044" },
    { id: "self" as const, nameTh: "จิตวิทยาและการเติบโตภายใน", icon: "✧", color: "#6F5B4A" },
  ];

  return (
    <div className="space-y-8 w-full max-w-5xl mx-auto relative z-10">
      {/* Top Breadcrumbs & Header Bar */}
      <div className="flex items-center justify-between border-b border-[#E4D8C4]/30 pb-4 text-xs font-mono">
        <Link
          href="/cards"
          className="inline-flex items-center gap-1.5 text-[#2E211A] hover:text-[#8F5C1A] transition-colors py-1 px-3 rounded-full bg-[#FFFFFF] border border-[#E4D8C4] hover:border-[#8F5C1A] font-serif-th "
        >
          <span>←</span> กลับหน้ารวมไพ่ 78 ใบ
        </Link>
        <span className="text-[#6F5B4A]">
          ลำดับที่ <strong className="text-[#8F5C1A]">{currentIndex + 1}</strong> / {totalCards}
        </span>
      </div>

      {/* Main Showcase Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Column: 3D Showcase Card & Orientation Controller */}
        <div className="md:col-span-5 lg:col-span-4 flex flex-col items-center space-y-5">
          {/* 3D Sacred Card Container */}
          <div className="relative group">
            {/* Celestial Ambient Halo Glow */}
            <div
              className="absolute -inset-4 rounded-lg opacity-20 blur-2xl transition-all duration-500 group-hover:opacity-40"
              style={{ background: elem.glow }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-64 sm:w-72 aspect-[7/12] rounded-lg overflow-hidden border-2 border-[#E4D8C4] p-1.5 bg-[#FFFFFF] "
            >
              <div className="relative w-full h-full rounded-lg overflow-hidden bg-[#F0E8DB]">
                <motion.div
                  animate={{ rotate: isUpright ? 0 : 180 }}
                  transition={{ type: "spring", stiffness: 220, damping: 22 }}
                  className="w-full h-full"
                >
                  <CardImage
                    image={card.image}
                    cardId={card.id}
                    alt={card.nameTh}
                    className="w-full h-full object-cover tarot-card-enhance tarot-hd-card-image"
                    sizes="(min-width: 640px) 600px, 400px"
                    loading="eager"
                  />
                </motion.div>
                <div className="gold-foil-sheen absolute inset-0 opacity-15 group-hover:opacity-30 transition-opacity pointer-events-none" />

                {/* Top Floating Badge */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#2E211A] text-[#FFFFFF] border border-[#E4D8C4] ">
                    {card.arcana === "major" ? `Major #${card.number}` : card.suit?.toUpperCase()}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${elem.border} ${elem.bg} ${elem.text} font-bold `}
                  >
                    {elem.icon} {card.element}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Upright / Reversed Orientation Switcher */}
          <div className="flex items-center justify-center p-1.5 rounded-lg bg-[#F0E8DB] border border-[#E4D8C4] w-full max-w-xs select-none ">
            <button
              type="button"
              onClick={() => setOrientation("upright")}
              className={`flex-1 py-2.5 text-xs font-serif-th font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                isUpright ? "bg-[#8F5C1A] text-[#FFFFFF]" : "text-[#6F5B4A] hover:text-[#2E211A]"
              }`}
            >
              <span>✦</span> ไพ่หัวตั้ง (ปกติ)
            </button>
            <button
              type="button"
              onClick={() => setOrientation("reversed")}
              className={`flex-1 py-2.5 text-xs font-serif-th font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                !isUpright ? "bg-[#F0E8DB] text-[#2E211A] font-bold" : "text-[#6F5B4A] hover:text-[#8F5C1A]"
              }`}
            >
              <span>↻</span> ไพ่หัวกลับ
            </button>
          </div>

          {/* Astrological & Numerological Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono">
            <span className={`px-3 py-1 rounded-full border ${elem.border} ${elem.bg} ${elem.text} font-bold`}>
              ธาตุ{card.element}
            </span>
            {card.astrology && (
              <span className="px-3 py-1 rounded-full border border-[#E4D8C4] bg-[#FFFFFF] text-[#2E211A]">
                ✦ {card.astrology}
              </span>
            )}
            {card.yesNo && (
              <span
                className={`px-3 py-1 rounded-full border font-bold ${
                  card.yesNo === "yes"
                    ? "border-[#3A7044]/40 bg-[#EBF3ED] text-[#3A7044]"
                    : card.yesNo === "no"
                      ? "border-[#A6392C]/40 bg-[#FCEEEA] text-[#A6392C]"
                      : "border-[#8F5C1A]/40 bg-[#F0E8DB] text-[#8F5C1A]"
                }`}
              >
                Yes/No: {card.yesNo === "yes" ? "ใช่ (Yes)" : card.yesNo === "no" ? "ไม่ใช่ (No)" : "ไม่แน่ชัด (Maybe)"}
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Titles, Keywords & Categorized Deep Meanings */}
        <div className="md:col-span-7 lg:col-span-8 space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[#8F5C1A]">
              <span className="px-2.5 py-0.5 rounded-full bg-[#F0E8DB] border border-[#E4D8C4] font-semibold uppercase">
                {card.arcana === "major" ? "Major Arcana" : `${card.suit} Suit`}
              </span>
              <span className="text-[#6F5B4A]">|</span>
              <span className="text-[#2E211A] font-sans tracking-wide">{card.nameEn}</span>
            </div>
            <h1 className="font-serif-th text-3xl sm:text-4xl lg:text-5xl font-bold font-mystic-gold leading-tight">
              {card.nameTh}
            </h1>
            <p className="text-xs sm:text-sm text-[#6F5B4A] leading-relaxed pt-1">{card.numerology}</p>
          </div>

          {/* Keywords Ribbon */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-mono text-[#8F5C1A] uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <span>✦</span> สัญลักษณ์และคีย์เวิร์ด ({isUpright ? "ไพ่หัวตั้ง" : "ไพ่หัวกลับ"})
            </h4>
            <div className="flex flex-wrap gap-2">
              {currentKeywords.map((kw, i) => (
                <span
                  key={i}
                  className="text-xs px-3 py-1.5 rounded-lg border border-[#E4D8C4] bg-[#FFFFFF] text-[#2E211A] font-serif-th font-semibold "
                >
                  ✦ {kw}
                </span>
              ))}
            </div>
          </div>

          {/* 5 Categorized Meanings List */}
          <div className="space-y-3.5 pt-2">
            <h3 className="font-serif-th text-base font-bold text-[#2E211A] flex items-center gap-2">
              <span className="text-[#8F5C1A]">✦</span> ความหมายและการทำนาย 5 ด้าน ({isUpright ? "หัวตั้ง" : "หัวกลับ"})
            </h3>

            <AnimatePresence mode="wait">
              <motion.div
                key={orientation}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {categories.map((cat) => {
                  const interp = card.meanings[cat.id];
                  const text = isUpright ? interp?.upright : interp?.reversed;

                  return (
                    <div
                      key={cat.id}
                      className="rounded-lg border border-[#E4D8C4] bg-[#FFFFFF] p-4 sm:p-5 space-y-2 hover:border-[#8F5C1A] transition-all group"
                    >
                      <div className="flex items-center gap-2">
                        <span style={{ color: cat.color }} className="text-sm">
                          {cat.icon}
                        </span>
                        <h4 className="font-serif-th text-xs sm:text-sm font-bold text-[#2E211A]">{cat.nameTh}</h4>
                      </div>
                      <p className="font-serif-th text-xs sm:text-sm text-[#2E211A] leading-relaxed pl-4 border-l-2 border-[#E4D8C4] group-hover:border-[#8F5C1A] transition-colors">
                        {text || "กำลังรวบรวมคำแปลมิตินี้"}
                      </p>
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Action Button: Start Tarot Ritual with this Card */}
          <div className="pt-4 flex items-center gap-4 flex-wrap">
            <Link
              href="/"
              className="px-7 py-3 rounded-full text-xs sm:text-sm font-serif-th font-bold bg-[#8F5C1A] hover:bg-[#74490F] text-[#FFFFFF] hover:scale-105 transition-transform flex items-center gap-2"
            >
              <span>✦</span> ไปหน้าดูดวงหลัก
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Previous / Next Card Navigation Bar */}
      <div className="pt-8 border-t border-[#E4D8C4]/30 flex items-center justify-between gap-4">
        {prevCard ? (
          <Link
            href={`/cards/${prevCard.id}`}
            className="flex items-center gap-3 p-3.5 rounded-lg border border-[#E4D8C4] hover:border-[#8F5C1A] bg-[#FFFFFF] hover:bg-[#F6F1E9] transition-all group max-w-[48%] "
          >
            <div className="w-9 h-14 rounded-lg overflow-hidden border border-[#E4D8C4] flex-shrink-0 bg-[#F0E8DB]">
              <CardImage
                image={prevCard.image}
                cardId={prevCard.id}
                alt=""
                className="w-full h-full object-cover tarot-hd-card-image"
                sizes="36px"
              />
            </div>
            <div className="text-left overflow-hidden">
              <span className="text-[10px] font-mono text-[#6F5B4A] block">← ใบก่อนหน้า</span>
              <span className="font-serif-th text-xs sm:text-sm font-bold text-[#2E211A] group-hover:text-[#8F5C1A] truncate block">
                {prevCard.nameTh}
              </span>
            </div>
          </Link>
        ) : (
          <div />
        )}

        {nextCard ? (
          <Link
            href={`/cards/${nextCard.id}`}
            className="flex items-center gap-3 p-3.5 rounded-lg border border-[#E4D8C4] hover:border-[#8F5C1A] bg-[#FFFFFF] hover:bg-[#F6F1E9] transition-all group max-w-[48%] text-right "
          >
            <div className="text-right overflow-hidden">
              <span className="text-[10px] font-mono text-[#6F5B4A] block">ใบถัดไป →</span>
              <span className="font-serif-th text-xs sm:text-sm font-bold text-[#2E211A] group-hover:text-[#8F5C1A] truncate block">
                {nextCard.nameTh}
              </span>
            </div>
            <div className="w-9 h-14 rounded-lg overflow-hidden border border-[#E4D8C4] flex-shrink-0 bg-[#F0E8DB]">
              <CardImage
                image={nextCard.image}
                cardId={nextCard.id}
                alt=""
                className="w-full h-full object-cover tarot-hd-card-image"
                sizes="36px"
              />
            </div>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
};
