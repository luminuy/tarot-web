"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import type { TarotCard } from "@/data/cards/types";
import { CardImage } from "@/components/card/CardImage";
import { RelatedCards } from "@/components/encyclopedia/RelatedCards";
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
    glow: "rgba(143, 92, 26, 0.12)",
    text: "text-[#8F5C1A]",
    bg: "bg-[#8F5C1A]/15",
    icon: "✦",
  },
  น้ำ: {
    border: "border-[#6F5B4A]/40",
    glow: "rgba(143, 92, 26, 0.12)",
    text: "text-[#635B4E]",
    bg: "bg-[#6F5B4A]/15",
    icon: "✦",
  },
  ลม: {
    border: "border-[#6F5B4A]/40",
    glow: "rgba(143, 92, 26, 0.12)",
    text: "text-[#635B4E]",
    bg: "bg-[#6F5B4A]/15",
    icon: "✦",
  },
  ดิน: {
    border: "border-[#3A7044]/40",
    glow: "rgba(143, 92, 26, 0.12)",
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
      <div className="flex items-center justify-between border-b border-[#D5CEC2]/40 pb-4 text-xs font-mono">
        <Link
          href="/cards"
          className="inline-flex items-center gap-1.5 text-[#29261F] hover:text-[#A58A5C] transition-colors py-1.5 px-4 rounded-full bg-[#FFFFFF] border border-[#D5CEC2] hover:border-[#A58A5C] font-serif-th shadow-xs"
        >
          <span>←</span> กลับหน้ารวมไพ่ 78 ใบ
        </Link>
        <span className="text-[#635B4E]">
          ลำดับที่ <strong className="text-[#A58A5C]">{currentIndex + 1}</strong> / {totalCards}
        </span>
      </div>

      {/* Main Showcase Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Column: 3D Showcase Card & Orientation Controller */}
        <div className="md:col-span-5 lg:col-span-4 flex flex-col items-center space-y-5">
          {/* 3D Sacred Card Container */}
          <div className="relative group">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-64 sm:w-72 aspect-[7/12] rounded-xl overflow-hidden border-2 border-[#D5CEC2] p-1.5 bg-[#FFFFFF] shadow-[0_10px_30px_rgba(42,38,31,0.08)]"
            >
              <div className="relative w-full h-full rounded-lg overflow-hidden bg-[#EAE7E0]">
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
                    full
                  />
                </motion.div>
                <div className="gold-foil-sheen absolute inset-0 opacity-15 group-hover:opacity-30 transition-opacity pointer-events-none" />

                {/* Top Floating Badge */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                  <span className="text-[13px] font-mono font-bold px-2 py-0.5 rounded bg-[#29261F] text-[#F3F0EA] border border-[#D5CEC2]">
                    {card.arcana === "major" ? `Major #${card.number}` : card.suit?.toUpperCase()}
                  </span>
                  <span
                    className={`text-[13px] font-mono px-2 py-0.5 rounded border ${elem.border} ${elem.bg} ${elem.text} font-bold`}
                  >
                    {elem.icon} {card.element}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Upright / Reversed Orientation Switcher */}
          <div className="flex items-center justify-center p-1 rounded-full bg-[#EAE7E0] border border-[#D5CEC2] w-full max-w-xs select-none">
            <button
              type="button"
              onClick={() => setOrientation("upright")}
              className={`flex-1 py-2 text-xs font-serif-th font-bold rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                isUpright ? "bg-[#29261F] text-[#F3F0EA] shadow-xs" : "text-[#635B4E] hover:text-[#29261F]"
              }`}
            >
              <span>✦</span> ไพ่หัวตั้ง (ปกติ)
            </button>
            <button
              type="button"
              onClick={() => setOrientation("reversed")}
              className={`flex-1 py-2 text-xs font-serif-th font-bold rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                !isUpright ? "bg-[#29261F] text-[#F3F0EA] shadow-xs" : "text-[#635B4E] hover:text-[#29261F]"
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
              <span className="px-3 py-1 rounded-full border border-[#D5CEC2] bg-[#FFFFFF] text-[#29261F]">
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
                      : "border-[#D5CEC2] bg-[#EAE7E0] text-[#A58A5C]"
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
            <div className="flex items-center gap-2 text-xs font-mono text-[#A58A5C]">
              <span className="px-2.5 py-0.5 rounded-full bg-[#EAE7E0] border border-[#D5CEC2] font-semibold uppercase text-[#29261F]">
                {card.arcana === "major" ? "Major Arcana" : `${card.suit} Suit`}
              </span>
              <span className="text-[#635B4E]">|</span>
              <span className="text-[#29261F] font-sans tracking-wide">{card.nameEn}</span>
            </div>
            <h1 className="font-serif-th text-3xl sm:text-4xl lg:text-5xl font-bold text-[#29261F] leading-tight">
              {card.nameTh}
            </h1>
            <p className="text-xs sm:text-sm text-[#635B4E] leading-relaxed pt-1 font-serif-th">{card.numerology}</p>
          </div>

          {/* Keywords Ribbon */}
          <div className="space-y-2">
            <h4 className="text-[13px] font-mono text-[#A58A5C] uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <span>✦</span> สัญลักษณ์และคีย์เวิร์ด ({isUpright ? "ไพ่หัวตั้ง" : "ไพ่หัวกลับ"})
            </h4>
            <div className="flex flex-wrap gap-2">
              {currentKeywords.map((kw, i) => (
                <span
                  key={i}
                  className="text-xs px-3 py-1.5 rounded-full border border-[#D5CEC2] bg-[#FFFFFF] text-[#29261F] font-serif-th font-semibold shadow-xs"
                >
                  ✦ {kw}
                </span>
              ))}
            </div>
          </div>

          {/* 5 Categorized Meanings List */}
          <div className="space-y-3.5 pt-2">
            <h3 className="font-serif-th text-base font-bold text-[#29261F] flex items-center gap-2">
              <span className="text-[#A58A5C]">✦</span> ความหมายและการทำนาย 5 ด้าน ({isUpright ? "หัวตั้ง" : "หัวกลับ"})
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
                      className="rounded-xl border border-[#D5CEC2] bg-[#FFFFFF] p-4 sm:p-5 space-y-2 hover:border-[#A58A5C] transition-all group shadow-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span style={{ color: cat.color }} className="text-sm">
                          {cat.icon}
                        </span>
                        <h4 className="font-serif-th text-xs sm:text-sm font-bold text-[#29261F]">{cat.nameTh}</h4>
                      </div>
                      <p className="font-serif-th text-xs sm:text-sm text-[#29261F] leading-relaxed pl-4 border-l-2 border-[#D5CEC2] group-hover:border-[#A58A5C] transition-colors">
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
              className="px-7 py-3 rounded-full text-xs sm:text-sm font-serif-th font-bold bg-[#29261F] hover:bg-[#A58A5C] text-[#F3F0EA] transition-all flex items-center gap-2 shadow-sm"
            >
              <span>✦</span> ไปหน้าดูดวงหลัก
            </Link>
          </div>
        </div>
      </div>

      {/* ไพ่ที่พลังงานใกล้เคียง (Vectorize · ซ่อนตัวเองถ้า index ยังว่าง) */}
      <RelatedCards cardId={card.id} />

      {/* Bottom Previous / Next Card Navigation Bar */}
      <div className="pt-8 border-t border-[#D5CEC2]/40 flex items-center justify-between gap-4">
        {prevCard ? (
          <Link
            href={`/cards/${prevCard.id}`}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-[#D5CEC2] hover:border-[#A58A5C] bg-[#FFFFFF] hover:bg-[#EAE7E0] transition-all group max-w-[48%] shadow-xs"
          >
            <div className="w-9 h-14 rounded-lg overflow-hidden border border-[#D5CEC2] flex-shrink-0 bg-[#EAE7E0]">
              <CardImage
                image={prevCard.image}
                cardId={prevCard.id}
                alt=""
                className="w-full h-full object-cover tarot-hd-card-image"
                sizes="36px"
              />
            </div>
            <div className="text-left overflow-hidden">
              <span className="text-[13px] font-mono text-[#635B4E] block">← ใบก่อนหน้า</span>
              <span className="font-serif-th text-xs sm:text-sm font-bold text-[#29261F] group-hover:text-[#A58A5C] truncate block">
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
            className="flex items-center gap-3 p-3.5 rounded-xl border border-[#D5CEC2] hover:border-[#A58A5C] bg-[#FFFFFF] hover:bg-[#EAE7E0] transition-all group max-w-[48%] text-right shadow-xs"
          >
            <div className="text-right overflow-hidden">
              <span className="text-[13px] font-mono text-[#635B4E] block">ใบถัดไป →</span>
              <span className="font-serif-th text-xs sm:text-sm font-bold text-[#29261F] group-hover:text-[#A58A5C] truncate block">
                {nextCard.nameTh}
              </span>
            </div>
            <div className="w-9 h-14 rounded-lg overflow-hidden border border-[#D5CEC2] flex-shrink-0 bg-[#EAE7E0]">
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
