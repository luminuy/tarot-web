"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import type { TarotCard } from "@/data/cards/types";

interface CardsExplorerProps {
  cards: readonly TarotCard[];
}

export const CardsExplorer: React.FC<CardsExplorerProps> = ({ cards }) => {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filters = [
    { id: "all", label: "ไพ่ทั้งหมด", count: cards.length },
    { id: "major", label: "Major Arcana (ชุดใหญ่)", count: cards.filter((c) => c.arcana === "major").length },
    { id: "wands", label: "ไม้เท้า (Wands - ไฟ)", count: cards.filter((c) => c.suit === "wands").length },
    { id: "cups", label: "ถ้วย (Cups - น้ำ)", count: cards.filter((c) => c.suit === "cups").length },
    { id: "swords", label: "ดาบ (Swords - ลม)", count: cards.filter((c) => c.suit === "swords").length },
    { id: "pentacles", label: "เหรียญ (Pentacles - ดิน)", count: cards.filter((c) => c.suit === "pentacles").length },
  ];

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
      const keywords = card.keywords.upright.join(" ").toLowerCase();

      return nameTh.includes(q) || nameEn.includes(q) || keywords.includes(q);
    });
  }, [cards, activeFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อไพ่ (ไทย / อังกฤษ / ความหมาย)..."
            className="w-full px-4 py-2.5 rounded-xl border border-[#e5c07b]/30 bg-[#130d24]/90 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-[#ffd700] focus:ring-1 focus:ring-[#ffd700]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Total Results Count */}
        <div className="text-right text-xs font-mono text-[#9c93b8]">
          แสดง <span className="text-[#ffd700] font-bold">{filteredCards.length}</span> จาก {cards.length} ใบ
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-start gap-1.5 sm:gap-2 overflow-x-auto pb-2 no-scrollbar">
        {filters.map((f) => {
          const isActive = activeFilter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-serif-th font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap select-none ${
                isActive
                  ? "bg-gradient-to-r from-[#c59b27] via-[#f5deaa] to-[#e5c07b] text-[#05040a] shadow-[0_0_15px_rgba(229,192,123,0.35)]"
                  : "bg-[#100b20]/90 text-[#9c93b8] hover:text-[#f5deaa] border border-[#e5c07b]/20 hover:border-[#e5c07b]/40"
              }`}
            >
              <span>{f.label}</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                isActive ? "bg-[#05040a]/20 text-[#05040a]" : "bg-white/5 text-[#9c93b8]"
              }`}>
                {f.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 78 Cards Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeFilter + searchQuery}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4"
        >
          {filteredCards.map((card) => (
            <Link
              key={card.id}
              href={`/cards/${card.id}`}
              className="rounded-xl border border-[#e5c07b]/25 bg-gradient-to-b from-[#130d24]/90 to-[#07040f]/90 p-2.5 hover:border-[#ffd700] hover:ring-1 hover:ring-[#ffd700]/50 transition-all hover:-translate-y-1 group cursor-pointer shadow-lg block"
            >
              <div className="relative aspect-[7/12] rounded-lg overflow-hidden border border-[#e5c07b]/20 mb-2">
                <img
                  src={card.image}
                  alt={card.nameTh}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="gold-foil-sheen absolute inset-0 opacity-15 group-hover:opacity-40 transition-opacity pointer-events-none" />
                <span className="absolute top-1 right-1 text-[8px] font-mono px-1 rounded bg-black/70 text-[#ffd700] border border-[#ffd700]/30 font-bold">
                  {card.arcana === "major" ? card.number : card.suit?.slice(0, 1).toUpperCase()}
                </span>
              </div>
              <div className="text-center space-y-0.5">
                <span className="text-[9px] font-mono text-[#e5c07b]/80 block truncate">
                  {card.nameEn}
                </span>
                <h3 className="font-serif-th text-xs font-bold text-[#f5deaa] group-hover:text-[#ffd700] truncate">
                  {card.nameTh}
                </h3>
              </div>
            </Link>
          ))}
        </motion.div>
      </AnimatePresence>

      {filteredCards.length === 0 && (
        <div className="text-center py-12 text-[#9c93b8] space-y-2">
          <p className="text-sm">ไม่พบไพ่ที่ตรงกับคำค้นหา &ldquo;{searchQuery}&rdquo;</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setActiveFilter("all");
            }}
            className="text-xs text-[#ffd700] hover:underline"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      )}
    </div>
  );
};
