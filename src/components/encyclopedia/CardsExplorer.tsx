"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import type { TarotCard } from "@/data/cards/types";
import { CardImage } from "@/components/card/CardImage";

interface CardsExplorerProps {
  cards: readonly TarotCard[];
}

const SUIT_TABS = [
  { id: "all", label: "ไพ่ทั้งหมด", icon: "✦", desc: "ครบ 78 ใบ", count: 78 },
  { id: "major", label: "ไพ่ชุดใหญ่ (Major)", icon: "👑", desc: "ไพ่หลัก 22 ใบ", count: 22 },
  { id: "wands", label: "ไม้เท้า (Wands)", icon: "🔥", desc: "ธาตุไฟ • พลังงาน & การงาน", count: 14 },
  { id: "cups", label: "ถ้วย (Cups)", icon: "🌊", desc: "ธาตุน้ำ • ความรัก & อารมณ์", count: 14 },
  { id: "swords", label: "ดาบ (Swords)", icon: "⚔️", desc: "ธาตุลม • ความคิด & การตัดสินใจ", count: 14 },
  { id: "pentacles", label: "เหรียญ (Pentacles)", icon: "🪙", desc: "ธาตุดิน • การเงิน & ความมั่นคง", count: 14 },
];

const ELEMENT_STYLES: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  ไฟ: { bg: "bg-amber-500/10", text: "text-amber-300", border: "border-amber-500/30", glow: "rgba(245, 158, 11, 0.25)" },
  น้ำ: { bg: "bg-sky-500/10", text: "text-sky-300", border: "border-sky-500/30", glow: "rgba(56, 189, 248, 0.25)" },
  ลม: { bg: "bg-purple-500/10", text: "text-purple-300", border: "border-purple-500/30", glow: "rgba(168, 85, 247, 0.25)" },
  ดิน: { bg: "bg-emerald-500/10", text: "text-emerald-300", border: "border-emerald-500/30", glow: "rgba(16, 185, 129, 0.25)" },
};

export const CardsExplorer: React.FC<CardsExplorerProps> = ({ cards }) => {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      // Suit filter
      let matchesFilter = true;
      if (activeFilter === "major") matchesFilter = card.arcana === "major";
      else if (activeFilter === "wands") matchesFilter = card.suit === "wands";
      else if (activeFilter === "cups") matchesFilter = card.suit === "cups";
      else if (activeFilter === "swords") matchesFilter = card.suit === "swords";
      else if (activeFilter === "pentacles") matchesFilter = card.suit === "pentacles";

      if (!matchesFilter) return false;

      // Search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const nameTh = card.nameTh.toLowerCase();
      const nameEn = card.nameEn.toLowerCase();
      const element = card.element?.toLowerCase() || "";
      const astro = card.astrology?.toLowerCase() || "";
      const keywords = [...card.keywords.upright, ...card.keywords.reversed].join(" ").toLowerCase();

      return nameTh.includes(q) || nameEn.includes(q) || keywords.includes(q) || element.includes(q) || astro.includes(q);
    });
  }, [cards, activeFilter, searchQuery]);

  return (
    <div className="space-y-8 relative z-10">
      {/* World-Class Sacred Search & Filter Dashboard */}
      <div className="rounded-3xl border border-[#e5c07b]/30 bg-gradient-to-b from-[#130d24]/90 via-[#0a0715]/95 to-[#05040a]/95 p-4 sm:p-6 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] space-y-5">
        {/* Search Bar & Result Stats */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xl">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#e5c07b] text-sm pointer-events-none">
              ✦
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อไพ่, ภาษาอังกฤษ, ความหมาย, ราศี หรือธาตุ..."
              className="w-full pl-10 pr-10 py-3.5 rounded-2xl border border-[#e5c07b]/35 bg-[#090514]/90 text-white placeholder-gray-400 text-xs sm:text-sm font-sans focus:outline-none focus:border-[#ffd700] focus:ring-2 focus:ring-[#ffd700]/30 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs bg-white/10 hover:bg-white/20 w-6 h-6 rounded-full flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3 text-xs font-mono text-[#9c93b8]">
            <span>
              ค้นพบ <strong className="text-[#ffd700] text-sm font-bold">{filteredCards.length}</strong> จาก {cards.length} ใบ
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveFilter("all");
                }}
                className="text-[11px] text-[#e5c07b] hover:text-[#ffd700] underline cursor-pointer"
              >
                ล้างคำค้นหา
              </button>
            )}
          </div>
        </div>

        {/* Suit & Arcana Filter Tabs (World-Class Interactive Badges) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
          {SUIT_TABS.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`p-3 rounded-2xl border text-left transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden group select-none ${
                  isActive
                    ? "border-[#ffd700] bg-gradient-to-b from-[#2d224d] via-[#1d1438] to-[#100b24] shadow-[0_0_25px_rgba(229,192,123,0.35)] scale-[1.02]"
                    : "border-[#e5c07b]/20 bg-[#0c081a]/80 hover:border-[#e5c07b]/50 hover:bg-[#150e2e]"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-base">{tab.icon}</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? "bg-gradient-to-r from-[#c59b27] to-[#f5deaa] text-[#05040a]"
                        : "bg-white/5 text-[#9c93b8] group-hover:text-white"
                    }`}
                  >
                    {tab.count}
                  </span>
                </div>
                <div>
                  <h4 className={`font-serif-th text-xs font-bold leading-tight ${
                    isActive ? "text-[#ffd700]" : "text-[#f5deaa] group-hover:text-[#ffd700]"
                  }`}>
                    {tab.label}
                  </h4>
                  <p className="text-[10px] text-[#9c93b8] truncate mt-0.5">{tab.desc}</p>
                </div>
                {isActive && (
                  <div className="gold-foil-sheen absolute inset-0 opacity-20 pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 78 Cards Luxury Masterpiece Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeFilter + searchQuery}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-5"
        >
          {filteredCards.map((card) => {
            const elemStyle = ELEMENT_STYLES[card.element] || ELEMENT_STYLES["ไฟ"];
            return (
              <Link
                key={card.id}
                href={`/cards/${card.id}`}
                className="rounded-2xl border border-[#e5c07b]/30 bg-gradient-to-b from-[#160e2c]/95 via-[#0d081c]/95 to-[#06040d]/95 p-3 flex flex-col justify-between hover:border-[#ffd700] hover:shadow-[0_12px_35px_rgba(229,192,123,0.3)] transition-all duration-300 group cursor-pointer relative overflow-hidden transform-gpu hover:-translate-y-1.5"
              >
                {/* Card Artwork Showcase (1909 Authentic Rider-Waite-Smith) */}
                <div className="relative aspect-[7/12] w-full rounded-xl overflow-hidden border border-[#e5c07b]/35 shadow-inner bg-[#040308] mb-3">
                  <CardImage
                    image={card.image}
                    cardId={card.id}
                    alt={card.nameTh}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 filter contrast-[1.06] saturate-[1.06] brightness-[1.02] tarot-hd-card-image"
                    sizes="(min-width: 1024px) 155px, (min-width: 768px) 145px, (min-width: 640px) 175px, 40vw"
                  />
                  <div className="gold-foil-sheen absolute inset-0 opacity-10 group-hover:opacity-40 transition-opacity pointer-events-none" />

                  {/* Top Badge: Number & Arcana */}
                  <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-black/85 text-[#ffd700] border border-[#ffd700]/40 backdrop-blur shadow">
                      {card.arcana === "major" ? `#${card.number}` : card.suit?.toUpperCase().slice(0, 1)}
                    </span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md backdrop-blur border ${elemStyle.border} ${elemStyle.bg} ${elemStyle.text} font-bold shadow`}>
                      {card.element}
                    </span>
                  </div>

                  {/* Bottom Hover Action Overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[10px] font-serif-th font-bold text-[#ffd700] flex items-center gap-1">
                      <span>✦</span> ดูความหมาย
                    </span>
                  </div>
                </div>

                {/* Card Title & English Subtitle */}
                <div className="text-center space-y-1 z-10">
                  <span className="text-[10px] font-mono text-[#e5c07b]/85 block truncate">
                    {card.nameEn}
                  </span>
                  <h3 className="font-serif-th text-xs sm:text-sm font-bold text-[#f5deaa] group-hover:text-[#ffd700] transition-colors truncate">
                    {card.nameTh}
                  </h3>

                  {/* Top 2 Upright Keywords */}
                  <div className="flex flex-wrap items-center justify-center gap-1 pt-1">
                    {card.keywords.upright.slice(0, 2).map((kw, i) => (
                      <span
                        key={i}
                        className="text-[9px] font-serif-th px-1.5 py-0.5 rounded-md bg-[#1d1438]/80 text-[#d8cce8] border border-white/5 truncate max-w-full"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Subtle Luxury Corner Sparkle */}
                <div className="absolute top-1 right-1 text-[8px] text-[#e5c07b]/20 group-hover:text-[#ffd700]/70 transition-colors pointer-events-none">
                  ✦
                </div>
              </Link>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Empty State */}
      {filteredCards.length === 0 && (
        <div className="text-center py-16 rounded-3xl border border-[#e5c07b]/20 bg-[#0d081c]/80 p-8 space-y-3">
          <div className="text-3xl">🔮</div>
          <h3 className="font-serif-th text-lg font-bold text-[#f5deaa]">
            ไม่พบไพ่ที่ตรงกับ &ldquo;{searchQuery}&rdquo;
          </h3>
          <p className="text-xs text-[#9c93b8] max-w-md mx-auto">
            ลองค้นหาด้วยชื่ออื่น เช่น &ldquo;ความรัก&rdquo;, &ldquo;The Sun&rdquo;, &ldquo;ดาวพฤหัสบดี&rdquo; หรือ &ldquo;ธาตุไฟ&rdquo;
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setActiveFilter("all");
            }}
            className="px-5 py-2 rounded-xl text-xs font-serif-th font-bold bg-[#1d1438] border border-[#e5c07b]/40 text-[#ffd700] hover:bg-[#2a1d4f] transition-all cursor-pointer"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      )}
    </div>
  );
};
