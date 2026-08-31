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
  ไฟ: { border: "border-amber-500/40", glow: "rgba(245, 158, 11, 0.35)", text: "text-amber-300", bg: "bg-amber-500/15", icon: "🔥" },
  น้ำ: { border: "border-sky-500/40", glow: "rgba(56, 189, 248, 0.35)", text: "text-sky-300", bg: "bg-sky-500/15", icon: "🌊" },
  ลม: { border: "border-purple-500/40", glow: "rgba(168, 85, 247, 0.35)", text: "text-purple-300", bg: "bg-purple-500/15", icon: "🌪️" },
  ดิน: { border: "border-emerald-500/40", glow: "rgba(16, 185, 129, 0.35)", text: "text-emerald-300", bg: "bg-emerald-500/15", icon: "🌿" },
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
  const getImageSrc = (targetCard?: TarotCard) =>
    getCardImageSrc(targetCard?.image, targetCard?.id) ?? "";

  const categories = [
    { id: "general" as const, nameTh: "ภาพรวมและเส้นทางชีวิต", icon: "✦", color: "#ffd700" },
    { id: "love" as const, nameTh: "ความรักและคนในใจ", icon: "♥", color: "#f472b6" },
    { id: "work" as const, nameTh: "การงานและโครงการ", icon: "★", color: "#38bdf8" },
    { id: "money" as const, nameTh: "การเงินและโชคลาภ", icon: "◆", color: "#34d399" },
    { id: "self" as const, nameTh: "จิตวิทยาและการเติบโตภายใน", icon: "✧", color: "#c084fc" },
  ];

  return (
    <div className="space-y-8 w-full max-w-5xl mx-auto relative z-10">
      {/* Top Breadcrumbs & Header Bar */}
      <div className="flex items-center justify-between border-b border-[#e5c07b]/20 pb-4 text-xs font-mono">
        <Link
          href="/cards"
          className="inline-flex items-center gap-1.5 text-[#e5c07b] hover:text-[#ffd700] transition-colors py-1 px-3 rounded-full bg-[#130d24]/60 border border-[#e5c07b]/20 hover:border-[#e5c07b]/50 font-serif-th"
        >
          <span>←</span> กลับหน้ารวมไพ่ 78 ใบ
        </Link>
        <span className="text-[#9c93b8]">
          ลำดับที่ <strong className="text-[#ffd700]">{currentIndex + 1}</strong> / {totalCards}
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
              className="absolute -inset-4 rounded-3xl opacity-40 blur-2xl transition-all duration-500 group-hover:opacity-75"
              style={{ background: elem.glow }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-64 sm:w-72 aspect-[7/12] rounded-2xl overflow-hidden border-2 border-[#ffd700]/70 p-1.5 bg-gradient-to-b from-[#2d224d] via-[#150d2c] to-[#07040f] shadow-[0_0_50px_rgba(229,192,123,0.35)]"
            >
              <div className="relative w-full h-full rounded-xl overflow-hidden bg-black">
                <motion.img
                  animate={{ rotate: isUpright ? 0 : 180 }}
                  transition={{ type: "spring", stiffness: 220, damping: 22 }}
                  src={getImageSrc(card)}
                  alt={card.nameTh}
                  className="w-full h-full object-cover filter contrast-[1.06] saturate-[1.06] brightness-[1.02] tarot-hd-card-image"
                  decoding="async"
                  fetchPriority="high"
                />
                <div className="gold-foil-sheen absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none" />

                {/* Top Floating Badge */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-black/85 text-[#ffd700] border border-[#ffd700]/40 backdrop-blur shadow">
                    {card.arcana === "major" ? `Major #${card.number}` : card.suit?.toUpperCase()}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md backdrop-blur border ${elem.border} ${elem.bg} ${elem.text} font-bold shadow`}>
                    {elem.icon} {card.element}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Upright / Reversed Orientation Switcher */}
          <div className="flex items-center justify-center p-1.5 rounded-2xl bg-[#130d24] border border-[#e5c07b]/30 w-full max-w-xs select-none shadow-lg">
            <button
              type="button"
              onClick={() => setOrientation("upright")}
              className={`flex-1 py-2.5 text-xs font-serif-th font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                isUpright
                  ? "bg-gradient-to-r from-[#d4af37] via-[#f7e7b4] to-[#c59b27] text-[#0a0715] shadow-[0_0_15px_rgba(229,192,123,0.4)]"
                  : "text-[#9c93b8] hover:text-white"
              }`}
            >
              <span>✦</span> ไพ่หัวตั้ง (ปกติ)
            </button>
            <button
              type="button"
              onClick={() => setOrientation("reversed")}
              className={`flex-1 py-2.5 text-xs font-serif-th font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                !isUpright
                  ? "bg-gradient-to-r from-[#9333ea] to-[#c084fc] text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]"
                  : "text-[#9c93b8] hover:text-white"
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
              <span className="px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300">
                🪐 {card.astrology}
              </span>
            )}
            {card.yesNo && (
              <span className={`px-3 py-1 rounded-full border font-bold ${
                card.yesNo === "yes"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : card.yesNo === "no"
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-300"
              }`}>
                Yes/No: {card.yesNo === "yes" ? "ใช่ (Yes)" : card.yesNo === "no" ? "ไม่ใช่ (No)" : "ไม่แน่ชัด (Maybe)"}
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Titles, Keywords & Categorized Deep Meanings */}
        <div className="md:col-span-7 lg:col-span-8 space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[#e5c07b]">
              <span className="px-2.5 py-0.5 rounded-full bg-[#e5c07b]/15 border border-[#e5c07b]/30 font-semibold uppercase">
                {card.arcana === "major" ? "Major Arcana" : `${card.suit} Suit`}
              </span>
              <span className="text-[#9c93b8]">|</span>
              <span className="text-gray-300 font-sans tracking-wide">{card.nameEn}</span>
            </div>
            <h1 className="font-serif-th text-3xl sm:text-4xl lg:text-5xl font-bold font-mystic-gold leading-tight">
              {card.nameTh}
            </h1>
            <p className="text-xs sm:text-sm text-[#9c93b8] leading-relaxed pt-1">
              {card.numerology}
            </p>
          </div>

          {/* Keywords Ribbon */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-mono text-[#e5c07b] uppercase tracking-wider flex items-center gap-1.5">
              <span>✦</span> สัญลักษณ์และคีย์เวิร์ด ({isUpright ? "ไพ่หัวตั้ง" : "ไพ่หัวกลับ"})
            </h4>
            <div className="flex flex-wrap gap-2">
              {currentKeywords.map((kw, i) => (
                <span
                  key={i}
                  className="text-xs px-3 py-1.5 rounded-xl border border-[#e5c07b]/35 bg-[#130d24] text-[#f5deaa] font-serif-th font-semibold shadow-sm"
                >
                  ✦ {kw}
                </span>
              ))}
            </div>
          </div>

          {/* 5 Categorized Meanings List */}
          <div className="space-y-3.5 pt-2">
            <h3 className="font-serif-th text-base font-bold text-[#ffd700] flex items-center gap-2">
              <span>✦</span> ความหมายและการทำนาย 5 ด้าน ({isUpright ? "หัวตั้ง" : "หัวกลับ"})
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
                      className="rounded-2xl border border-[#e5c07b]/25 bg-gradient-to-r from-[#130d24]/95 via-[#0d091a]/95 to-[#06040e]/95 p-4 sm:p-5 space-y-2 hover:border-[#ffd700]/60 transition-all shadow-md group"
                    >
                      <div className="flex items-center gap-2">
                        <span style={{ color: cat.color }} className="text-sm">
                          {cat.icon}
                        </span>
                        <h4 className="font-serif-th text-xs sm:text-sm font-bold text-[#e5c07b]">
                          {cat.nameTh}
                        </h4>
                      </div>
                      <p className="font-serif-th text-xs sm:text-sm text-gray-200 leading-relaxed pl-4 border-l-2 border-[#e5c07b]/25 group-hover:border-[#ffd700] transition-colors">
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
              className="px-7 py-3 rounded-2xl text-xs sm:text-sm font-serif-th font-bold bg-gradient-to-r from-[#d4af37] via-[#f7e7b4] to-[#c59b27] text-[#0a0715] shadow-[0_0_25px_rgba(229,192,123,0.45)] hover:scale-105 transition-transform flex items-center gap-2"
            >
              <span>✦</span> ไปหน้าดูดวงหลัก
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Previous / Next Card Navigation Bar */}
      <div className="pt-8 border-t border-[#e5c07b]/20 flex items-center justify-between gap-4">
        {prevCard ? (
          <Link
            href={`/cards/${prevCard.id}`}
            className="flex items-center gap-3 p-3.5 rounded-2xl border border-[#e5c07b]/25 hover:border-[#ffd700] bg-[#130d24]/80 hover:bg-[#181030] transition-all group max-w-[48%]"
          >
            <div className="w-9 h-14 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 bg-black">
              <CardImage image={prevCard.image} cardId={prevCard.id} alt="" className="w-full h-full object-cover tarot-hd-card-image" sizes="36px" />
            </div>
            <div className="text-left overflow-hidden">
              <span className="text-[10px] font-mono text-[#9c93b8] block">← ใบก่อนหน้า</span>
              <span className="font-serif-th text-xs sm:text-sm font-bold text-[#f5deaa] group-hover:text-[#ffd700] truncate block">
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
            className="flex items-center gap-3 p-3.5 rounded-2xl border border-[#e5c07b]/25 hover:border-[#ffd700] bg-[#130d24]/80 hover:bg-[#181030] transition-all group max-w-[48%] text-right"
          >
            <div className="text-right overflow-hidden">
              <span className="text-[10px] font-mono text-[#9c93b8] block">ใบถัดไป →</span>
              <span className="font-serif-th text-xs sm:text-sm font-bold text-[#f5deaa] group-hover:text-[#ffd700] truncate block">
                {nextCard.nameTh}
              </span>
            </div>
            <div className="w-9 h-14 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 bg-black">
              <CardImage image={nextCard.image} cardId={nextCard.id} alt="" className="w-full h-full object-cover tarot-hd-card-image" sizes="36px" />
            </div>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
};
