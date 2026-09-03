"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import type { TarotCard } from "@/data/cards/types";
import { CardImage } from "@/components/card/CardImage";

import {
  AirElementIcon,
  CrownTabIcon,
  FireElementIcon,
  PentacleTabIcon,
  SparkleTabIcon,
  WaterElementIcon,
} from "@/components/ui/TarotArtIcons";
interface CardsExplorerProps {
  cards: readonly TarotCard[];
}

const SUIT_TABS = [
  { id: "all", label: "ไพ่ทั้งหมด", Icon: SparkleTabIcon, desc: "ครบ 78 ใบ", count: 78 },
  { id: "major", label: "ไพ่ชุดใหญ่ (Major)", Icon: CrownTabIcon, desc: "ไพ่หลัก 22 ใบ", count: 22 },
  { id: "wands", label: "ไม้เท้า (Wands)", Icon: FireElementIcon, desc: "ธาตุไฟ • พลังงาน & การงาน", count: 14 },
  { id: "cups", label: "ถ้วย (Cups)", Icon: WaterElementIcon, desc: "ธาตุน้ำ • ความรัก & อารมณ์", count: 14 },
  { id: "swords", label: "ดาบ (Swords)", Icon: AirElementIcon, desc: "ธาตุลม • ความคิด & การตัดสินใจ", count: 14 },
  {
    id: "pentacles",
    label: "เหรียญ (Pentacles)",
    Icon: PentacleTabIcon,
    desc: "ธาตุดิน • การเงิน & ความมั่นคง",
    count: 14,
  },
];

const ELEMENT_STYLES: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  ไฟ: {
    bg: "bg-[#8F5C1A]/10",
    text: "text-[#8F5C1A]",
    border: "border-[#8F5C1A]/30",
    glow: "rgba(143, 92, 26, 0.12)",
  },
  น้ำ: {
    bg: "bg-[#6F5B4A]/10",
    text: "text-[#6F5B4A]",
    border: "border-[#6F5B4A]/30",
    glow: "rgba(143, 92, 26, 0.12)",
  },
  ลม: {
    bg: "bg-[#6F5B4A]/10",
    text: "text-[#6F5B4A]",
    border: "border-[#6F5B4A]/30",
    glow: "rgba(143, 92, 26, 0.12)",
  },
  ดิน: {
    bg: "bg-[#3A7044]/10",
    text: "text-[#3A7044]",
    border: "border-[#3A7044]/30",
    glow: "rgba(143, 92, 26, 0.12)",
  },
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

      return (
        nameTh.includes(q) || nameEn.includes(q) || keywords.includes(q) || element.includes(q) || astro.includes(q)
      );
    });
  }, [cards, activeFilter, searchQuery]);

  return (
    <div className="space-y-8 relative z-10">
      {/* Sacred Search & Filter Dashboard */}
      <div className="rounded-lg border border-[#D9C8AC] bg-[#FFFFFF] p-4 sm:p-6 space-y-5">
        {/* Search Bar & Result Stats */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xl">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8F5C1A] text-sm pointer-events-none">
              ✦
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อไพ่, ภาษาอังกฤษ, ความหมาย, ราศี หรือธาตุ..."
              className="w-full pl-10 pr-10 py-3.5 rounded-lg border border-[#D9C8AC] bg-[#FFFFFF] text-[#2E211A] placeholder-[#6F5B4A]/60 text-xs sm:text-sm font-sans focus:outline-none focus:border-[#8F5C1A] focus:ring-2 focus:ring-[#8F5C1A]/30 transition-all "
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6F5B4A] hover:text-[#2E211A] text-xs bg-black/5 hover:bg-black/10 w-6 h-6 rounded-full flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3 text-xs font-mono text-[#6F5B4A]">
            <span>
              ค้นพบ <strong className="text-[#8F5C1A] text-sm font-bold">{filteredCards.length}</strong> จาก{" "}
              {cards.length} ใบ
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveFilter("all");
                }}
                className="text-[11px] text-[#8F5C1A] hover:underline cursor-pointer font-bold"
              >
                ล้างคำค้นหา
              </button>
            )}
          </div>
        </div>

        {/* Suit & Arcana Filter Tabs */}
        <div
          role="tablist"
          aria-label="หมวดหมู่ชุดไพ่และสำรับ"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5"
        >
          {SUIT_TABS.map((tab, tabIdx) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                id={`card-tab-${tab.id}`}
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                onKeyDown={(e) => {
                  let nextIdx = -1;
                  if (e.key === "ArrowRight") nextIdx = (tabIdx + 1) % SUIT_TABS.length;
                  else if (e.key === "ArrowLeft") nextIdx = (tabIdx - 1 + SUIT_TABS.length) % SUIT_TABS.length;
                  if (nextIdx !== -1) {
                    e.preventDefault();
                    setActiveFilter(SUIT_TABS[nextIdx].id);
                    const nextTab = document.getElementById(`card-tab-${SUIT_TABS[nextIdx].id}`);
                    nextTab?.focus();
                  }
                }}
                className={`p-3 rounded-lg border text-left transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden group select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A] ${
                  isActive
                    ? "border-[#D9C8AC] bg-[#FFFFFF] scale-[1.02]"
                    : "border-[#D9C8AC] bg-[#F3EDE2] hover:border-[#8F5C1A] hover:bg-[#FAF7F2]"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <tab.Icon className="w-4 h-4" />
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      isActive ? "bg-[#8F5C1A] text-[#FFFFFF]" : "bg-black/5 text-[#6F5B4A] group-hover:text-[#2E211A]"
                    }`}
                  >
                    {tab.count}
                  </span>
                </div>
                <div>
                  <h4
                    className={`font-serif-th text-xs font-bold leading-tight ${
                      isActive ? "text-[#8F5C1A]" : "text-[#2E211A] group-hover:text-[#74490F]"
                    }`}
                  >
                    {tab.label}
                  </h4>
                  <p className="text-[10px] text-[#6F5B4A] truncate mt-0.5">{tab.desc}</p>
                </div>
                {isActive && <div className="gold-foil-sheen absolute inset-0 opacity-15 pointer-events-none" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 78 Cards Luxury Masterpiece Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeFilter}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-5"
        >
          {filteredCards.map((card) => {
            const elemStyle = ELEMENT_STYLES[card.element] || ELEMENT_STYLES["ไฟ"];
            return (
              <Link
                key={card.id}
                href={`/cards/${card.id}`}
                className="rounded-lg border border-[#D9C8AC] bg-[#FFFFFF] p-3 flex flex-col justify-between hover:border-[#8F5C1A] transition-all duration-300 group cursor-pointer relative overflow-hidden transform-gpu hover:-translate-y-1.5 "
              >
                {/* Card Artwork Showcase (1909 Authentic Rider-Waite-Smith) */}
                <div className="relative aspect-[7/12] w-full rounded-lg overflow-hidden border border-[#D9C8AC] bg-[#F3EDE2] mb-3">
                  <CardImage
                    image={card.image}
                    cardId={card.id}
                    alt={card.nameTh}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 tarot-hd-card-image"
                    sizes="(min-width: 1024px) 160px, (min-width: 768px) 170px, (min-width: 640px) 190px, 45vw"
                  />
                  <div className="gold-foil-sheen absolute inset-0 opacity-10 group-hover:opacity-30 transition-opacity pointer-events-none" />

                  {/* Top Badge: Number & Arcana */}
                  <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#2E211A] text-[#FFFFFF] border border-[#D9C8AC] ">
                      {card.arcana === "major" ? `#${card.number}` : card.suit?.toUpperCase().slice(0, 1)}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${elemStyle.border} ${elemStyle.bg} ${elemStyle.text} font-bold `}
                    >
                      {card.element}
                    </span>
                  </div>

                  {/* Bottom Hover Action Overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-[#2E211A] to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[10px] font-serif-th font-bold text-[#FFFFFF] flex items-center gap-1">
                      <span>✦</span> ดูความหมาย
                    </span>
                  </div>
                </div>

                {/* Card Title & English Subtitle */}
                <div className="text-center space-y-1 z-10">
                  <span className="text-[10px] font-mono text-[#6F5B4A] block truncate">{card.nameEn}</span>
                  <h3 className="font-serif-th text-xs sm:text-sm font-bold text-[#2E211A] group-hover:text-[#8F5C1A] transition-colors truncate">
                    {card.nameTh}
                  </h3>

                  {/* Top 2 Upright Keywords */}
                  <div className="flex flex-wrap items-center justify-center gap-1 pt-1">
                    {card.keywords.upright.slice(0, 2).map((kw, i) => (
                      <span
                        key={i}
                        className="text-[9px] font-serif-th px-1.5 py-0.5 rounded bg-[#F3EDE2] text-[#2E211A] border border-[#D9C8AC] truncate max-w-full"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Subtle Luxury Corner Sparkle */}
                <div className="absolute top-1 right-1 text-[8px] text-[#6F5B4A] group-hover:text-[#8F5C1A] transition-colors pointer-events-none">
                  ✦
                </div>
              </Link>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Empty State */}
      {filteredCards.length === 0 && (
        <div className="text-center py-16 rounded-lg border border-[#D9C8AC] bg-[#FFFFFF] p-8 space-y-3 ">
          <div className="text-3xl text-[#8F5C1A]">✦</div>
          <h3 className="font-serif-th text-lg font-bold text-[#2E211A]">
            ไม่พบไพ่ที่ตรงกับ &ldquo;{searchQuery}&rdquo;
          </h3>
          <p className="text-xs text-[#6F5B4A] max-w-md mx-auto">
            ลองค้นหาด้วยชื่ออื่น เช่น &ldquo;ความรัก&rdquo;, &ldquo;The Sun&rdquo;, &ldquo;ดาวพฤหัสบดี&rdquo; หรือ
            &ldquo;ธาตุไฟ&rdquo;
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setActiveFilter("all");
            }}
            className="px-5 py-2 rounded-full text-xs font-serif-th font-bold bg-[#8F5C1A] hover:bg-[#74490F] border border-[#D9C8AC] text-[#FFFFFF] transition-all cursor-pointer "
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      )}
    </div>
  );
};
