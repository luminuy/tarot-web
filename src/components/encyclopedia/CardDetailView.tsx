"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import type { TarotCard } from "@/data/cards/types";

interface CardDetailViewProps {
  card: TarotCard;
  prevCard?: TarotCard;
  nextCard?: TarotCard;
  totalCards: number;
  currentIndex: number;
}

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

  const categories = [
    { id: "general" as const, nameTh: "ภาพรวมและชีวิต", icon: "✦", color: "#ffd700" },
    { id: "love" as const, nameTh: "ความรักและความสัมพันธ์", icon: "♥", color: "#ec4899" },
    { id: "work" as const, nameTh: "การงานและโครงการ", icon: "★", color: "#38bdf8" },
    { id: "money" as const, nameTh: "การเงินและโชคลาภ", icon: "◆", color: "#10b981" },
    { id: "self" as const, nameTh: "จิตวิทยาและการพัฒนาตนเอง", icon: "✧", color: "#a855f7" },
  ];

  const getElementColor = (el: string) => {
    switch (el) {
      case "ไฟ":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      case "น้ำ":
        return "bg-sky-500/15 text-sky-400 border-sky-500/30";
      case "ลม":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "ดิน":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      default:
        return "bg-[#e5c07b]/15 text-[#e5c07b] border-[#e5c07b]/30";
    }
  };

  return (
    <div className="space-y-8 w-full max-w-5xl mx-auto">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between border-b border-[#e5c07b]/20 pb-4 text-xs font-mono">
        <Link
          href="/cards"
          className="inline-flex items-center gap-1.5 text-[#e5c07b] hover:text-[#ffd700] transition-colors"
        >
          <span>←</span> คัมภีร์ไพ่ 78 ใบ
        </Link>
        <span className="text-[#9c93b8]">
          ใบที่ {currentIndex + 1} จาก {totalCards}
        </span>
      </div>

      {/* Main Showcase Header */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: 3D Card Artwork & Core Badges */}
        <div className="md:col-span-5 lg:col-span-4 flex flex-col items-center space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-60 sm:w-64 aspect-[7/12] rounded-2xl overflow-hidden border-2 border-[#ffd700]/70 p-1 bg-gradient-to-b from-[#2d224d] via-[#150d2c] to-[#07040f] shadow-[0_0_40px_rgba(229,192,123,0.35)] group"
          >
            <div className="relative w-full h-full rounded-xl overflow-hidden">
              <motion.img
                animate={{ rotate: isUpright ? 0 : 180 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                src={card.image}
                alt={card.nameTh}
                className="w-full h-full object-cover"
              />
              <div className="gold-foil-sheen absolute inset-0 opacity-25 group-hover:opacity-45 transition-opacity pointer-events-none" />
            </div>
          </motion.div>

          {/* Orientation Toggle Bar */}
          <div className="flex items-center justify-center p-1 rounded-xl bg-[#130d24] border border-[#e5c07b]/30 w-full max-w-xs select-none">
            <button
              type="button"
              onClick={() => setOrientation("upright")}
              className={`flex-1 py-2 text-xs font-serif-th font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                isUpright
                  ? "bg-gradient-to-r from-[#c59b27] via-[#f5deaa] to-[#e5c07b] text-[#05040a] shadow"
                  : "text-[#9c93b8] hover:text-white"
              }`}
            >
              <span>✦</span> ไพ่หัวตั้ง (Upright)
            </button>
            <button
              type="button"
              onClick={() => setOrientation("reversed")}
              className={`flex-1 py-2 text-xs font-serif-th font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                !isUpright
                  ? "bg-gradient-to-r from-[#9333ea] to-[#c084fc] text-white shadow"
                  : "text-[#9c93b8] hover:text-white"
              }`}
            >
              <span>↻</span> ไพ่หัวกลับ (Reversed)
            </button>
          </div>

          {/* Elemental & Astrological Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono">
            <span className={`px-2.5 py-1 rounded-full border ${getElementColor(card.element)} font-bold`}>
              ธาตุ{card.element}
            </span>
            {card.astrology && (
              <span className="px-2.5 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300">
                {card.astrology}
              </span>
            )}
            {card.numerology && (
              <span className="px-2.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300">
                เลขศาสตร์: {card.number}
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Titles, Keywords & Categorized Deep Meanings */}
        <div className="md:col-span-7 lg:col-span-8 space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#e5c07b]">
              <span className="px-2 py-0.5 rounded bg-[#e5c07b]/15 border border-[#e5c07b]/30 font-semibold">
                {card.arcana === "major" ? "Major Arcana" : "Minor Arcana"}
              </span>
              <span className="text-[#9c93b8]">|</span>
              <span className="text-gray-400">{card.nameEn}</span>
            </div>
            <h1 className="font-serif-th text-3xl sm:text-4xl font-bold font-mystic-gold mt-1">
              {card.nameTh}
            </h1>
            <p className="text-xs text-[#9c93b8] mt-1 italic">
              {card.numerology}
            </p>
          </div>

          {/* Keywords Ribbon */}
          <div className="space-y-1.5">
            <h4 className="text-[11px] font-mono text-[#e5c07b] uppercase tracking-wider flex items-center gap-1.5">
              <span>✦</span> คีย์เวิร์ดประจำไพ่ ({isUpright ? "หัวตั้ง" : "หัวกลับ"})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {currentKeywords.map((kw, i) => (
                <span
                  key={i}
                  className="text-xs px-2.5 py-1 rounded-lg border border-[#e5c07b]/30 bg-[#130d24]/90 text-[#f5deaa] font-serif-th"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>

          {/* 5 Categorized Meanings List */}
          <div className="space-y-3 pt-2">
            <h3 className="font-serif-th text-base font-bold text-[#ffd700] flex items-center gap-2">
              <span>✦</span> คำแปลและการตีความ 5 มิติชีวิต
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
                      className="rounded-xl border border-[#e5c07b]/20 bg-gradient-to-r from-[#130d24]/90 to-[#0d091a]/90 p-4 space-y-1 hover:border-[#e5c07b]/50 transition-colors shadow-md"
                    >
                      <div className="flex items-center gap-2">
                        <span style={{ color: cat.color }} className="text-xs">
                          {cat.icon}
                        </span>
                        <h4 className="font-serif-th text-xs font-bold text-[#e5c07b]">
                          {cat.nameTh}
                        </h4>
                      </div>
                      <p className="font-serif-th text-xs sm:text-sm text-gray-300 leading-relaxed pl-4 border-l border-[#e5c07b]/20">
                        {text || "กำลังอัปเดตคำแปลมิตินี้"}
                      </p>
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Quick Action Button */}
          <div className="pt-4 flex items-center gap-3 flex-wrap">
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl text-xs font-serif-th font-bold bg-gradient-to-r from-[#c59b27] via-[#f5deaa] to-[#e5c07b] text-[#05040a] shadow-[0_0_20px_rgba(229,192,123,0.4)] hover:scale-105 transition-transform"
            >
              <span>✦</span> เข้าสู่วิหารเพื่อเปิดไพ่ใบนี้
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Previous / Next Card Pagination */}
      <div className="pt-8 border-t border-[#e5c07b]/20 flex items-center justify-between gap-4">
        {prevCard ? (
          <Link
            href={`/cards/${prevCard.id}`}
            className="flex items-center gap-3 p-3 rounded-xl border border-[#e5c07b]/20 hover:border-[#ffd700]/60 bg-[#130d24]/60 hover:bg-[#181030] transition-all group"
          >
            <div className="w-8 h-12 rounded overflow-hidden border border-white/10 flex-shrink-0">
              <img src={prevCard.image} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="text-left">
              <span className="text-[10px] font-mono text-[#9c93b8] block">← ใบก่อนหน้า</span>
              <span className="font-serif-th text-xs font-bold text-[#f5deaa] group-hover:text-[#ffd700]">
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
            className="flex items-center gap-3 p-3 rounded-xl border border-[#e5c07b]/20 hover:border-[#ffd700]/60 bg-[#130d24]/60 hover:bg-[#181030] transition-all group text-right"
          >
            <div className="text-right">
              <span className="text-[10px] font-mono text-[#9c93b8] block">ใบถัดไป →</span>
              <span className="font-serif-th text-xs font-bold text-[#f5deaa] group-hover:text-[#ffd700]">
                {nextCard.nameTh}
              </span>
            </div>
            <div className="w-8 h-12 rounded overflow-hidden border border-white/10 flex-shrink-0">
              <img src={nextCard.image} alt="" className="w-full h-full object-cover" />
            </div>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
};
