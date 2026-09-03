"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DECK, type TarotCard } from "@/data/cards";
import { TarotCard as TarotCardComponent } from "@/components/card/TarotCard";
import { soundManager } from "@/lib/utils/audio";

interface TarotEncyclopediaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SuitFilter = "all" | "major" | "wands" | "cups" | "swords" | "pentacles";

export const TarotEncyclopediaModal: React.FC<TarotEncyclopediaModalProps> = ({ isOpen, onClose }) => {
  const [filter, setFilter] = useState<SuitFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedCard, setSelectedCard] = useState<TarotCard | null>(null);
  const [activeMeaningCategory, setActiveMeaningCategory] = useState<"general" | "work" | "money" | "love" | "self">(
    "general"
  );
  const [viewOrientation, setViewOrientation] = useState<"upright" | "reversed">("upright");

  if (!isOpen) return null;

  const handleSelectCard = (card: TarotCard) => {
    setSelectedCard(card);
    soundManager.playCardSelectSound();
  };

  const filteredCards = DECK.filter((c) => {
    // Suit match
    if (filter === "major" && c.arcana !== "major") return false;
    if (filter === "wands" && c.suit !== "wands") return false;
    if (filter === "cups" && c.suit !== "cups") return false;
    if (filter === "swords" && c.suit !== "swords") return false;
    if (filter === "pentacles" && c.suit !== "pentacles") return false;

    // Search match
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.nameTh.toLowerCase().includes(q) ||
      c.nameEn.toLowerCase().includes(q) ||
      c.keywords.upright.some((k) => k.toLowerCase().includes(q)) ||
      c.keywords.reversed.some((k) => k.toLowerCase().includes(q))
    );
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#2E211A]/50 backdrop-blur-[3px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          className="w-full max-w-4xl max-h-[90vh] rounded-lg bg-[#FFFFFF] border border-[#D9C8AC] p-5 sm:p-7 shadow-[var(--shadow-overlay)] flex flex-col relative space-y-4 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#D9C8AC]/30 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full border border-[#D9C8AC] flex items-center justify-center text-xs text-[#8F5C1A] bg-[#F3EDE2] font-bold">
                ✦
              </div>
              <div>
                <h3 className="font-serif-th text-sm sm:text-base font-bold font-mystic-gold">
                  ความหมายไพ่ทาโรต์ 78 ใบ
                </h3>
                <p className="text-[10px] text-[#6F5B4A] font-serif-th">
                  ดูคำแปลและความหมายของไพ่ทาโรต์ทั้ง 78 ใบ (ความรัก การงาน การเงิน)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="ปิดความหมายไพ่ทาโรต์"
              className="w-11 h-11 rounded-full bg-[#F3EDE2] border border-[#D9C8AC] text-[#2E211A] hover:bg-[#8F5C1A] hover:text-[#FFFFFF] text-sm flex items-center justify-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A]"
            >
              ✕
            </button>
          </div>

          {/* Filter Bar & Search */}
          <div className="space-y-2">
            <div
              role="tablist"
              aria-label="ชุดไพ่ทาโรต์"
              className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar"
            >
              {[
                { id: "all", label: "ทั้งหมด (78)" },
                { id: "major", label: "ชุดหลัก Major (22)" },
                { id: "wands", label: "✦ ไม้เท้า Wands" },
                { id: "cups", label: "✦ ถ้วย Cups" },
                { id: "swords", label: "✦ ดาบ Swords" },
                { id: "pentacles", label: "✦ เหรียญ Pentacles" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={filter === tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id as SuitFilter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-serif-th font-semibold whitespace-nowrap transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A] ${
                    filter === tab.id
                      ? "bg-[#8F5C1A] text-[#FFFFFF] font-bold"
                      : "bg-[#FFFFFF] text-[#6F5B4A] hover:text-[#2E211A] border border-[#D9C8AC]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="✦ ค้นหาตามชื่อไพ่ (เช่น The Fool, ราชินีถ้วย, ความรัก, การเงิน)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FFFFFF] border border-[#D9C8AC] rounded-lg px-3.5 py-2 text-xs text-[#2E211A] placeholder:text-[#6F5B4A]/70 focus:outline-none focus:border-[#8F5C1A] "
            />
          </div>

          {/* Content Area: Grid of Cards */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 no-scrollbar min-h-[300px]">
            {filteredCards.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {filteredCards.map((c) => (
                  <div
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`ดูความหมาย ${c.nameTh} (${c.nameEn})`}
                    onClick={() => handleSelectCard(c)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelectCard(c);
                      }
                    }}
                    className="p-2 rounded-lg bg-[#FFFFFF] border border-[#D9C8AC] hover:border-[#8F5C1A] transition-all cursor-pointer flex flex-col items-center text-center space-y-1.5 hover:scale-105 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A]"
                  >
                    <div className="w-16 h-[108px] sm:w-18 sm:h-[122px] rounded-lg overflow-hidden flex-shrink-0 bg-[#F3EDE2]">
                      <TarotCardComponent
                        card={c}
                        isRevealed={true}
                        size="sm"
                        imageSizes="(min-width: 640px) 72px, 64px"
                        className="w-full h-full"
                      />
                    </div>
                    <span className="text-[10px] font-serif-th font-bold text-[#2E211A] truncate max-w-full block leading-tight">
                      {c.nameTh}
                    </span>
                    <span className="text-[8px] text-[#6F5B4A] font-mono truncate max-w-full block">{c.nameEn}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <div className="text-2xl text-[#8F5C1A]">✦</div>
                <h4 className="font-serif-th text-sm font-bold text-[#2E211A]">
                  ไม่พบไพ่ที่ตรงกับ &ldquo;{search}&rdquo;
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setFilter("all");
                  }}
                  className="px-4 py-1.5 rounded-full text-xs font-serif-th font-bold bg-[#8F5C1A] hover:bg-[#74490F] text-[#FFFFFF] transition-all cursor-pointer "
                >
                  ล้างการค้นหา
                </button>
              </div>
            )}
          </div>

          {/* Selected Card Deep Wisdom Detail Modal Layer */}
          {selectedCard && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`ความหมายไพ่ ${selectedCard.nameTh}`}
              className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-[#2E211A]/50 backdrop-blur-[3px]"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-2xl max-h-[90vh] rounded-lg bg-[#FFFFFF] border-2 border-[#D9C8AC] p-5 sm:p-7 shadow-[var(--shadow-overlay)] flex flex-col relative space-y-4 overflow-y-auto text-[#2E211A]"
              >
                <button
                  type="button"
                  onClick={() => setSelectedCard(null)}
                  aria-label="ปิดหน้ารายละเอียดไพ่"
                  className="absolute top-4 right-4 w-11 h-11 rounded-full bg-[#F3EDE2] border border-[#D9C8AC] text-[#2E211A] hover:bg-[#8F5C1A] hover:text-[#FFFFFF] text-sm flex items-center justify-center transition-all cursor-pointer z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A]"
                >
                  ✕
                </button>

                {/* Card Title & Meta */}
                <div className="flex items-start gap-4 pb-3 border-b border-[#D9C8AC]/30">
                  <div className="w-24 h-[163px] flex-shrink-0 bg-[#F3EDE2] rounded-lg overflow-hidden ">
                    <TarotCardComponent
                      card={selectedCard}
                      isRevealed={true}
                      isReversed={viewOrientation === "reversed"}
                      size="sm"
                      imageSizes="96px"
                      className="w-full h-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif-th text-base sm:text-lg font-bold font-mystic-gold">
                        {selectedCard.nameTh}
                      </h3>
                      <span className="text-xs text-[#6F5B4A] font-mono">({selectedCard.nameEn})</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-[10px] text-[#2E211A]">
                      <span className="px-2 py-0.5 rounded-full bg-[#FFFFFF] border border-[#D9C8AC] text-[#8F5C1A] font-semibold">
                        ธาตุ: {selectedCard.element}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#FFFFFF] border border-[#D9C8AC]">
                        โหราศาสตร์: {selectedCard.astrology}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#FFFFFF] border border-[#D9C8AC]">
                        ตัวเลข: {selectedCard.numerology}
                      </span>
                    </div>

                    {/* Orientation Switcher */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => setViewOrientation("upright")}
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                          viewOrientation === "upright"
                            ? "bg-[#EBF3ED] text-[#3A7044] border border-[#D9C8AC]"
                            : "bg-[#FFFFFF] text-[#6F5B4A] border border-[#D9C8AC]"
                        }`}
                      >
                        ✦ หัวตั้ง (Upright)
                      </button>
                      <button
                        onClick={() => setViewOrientation("reversed")}
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                          viewOrientation === "reversed"
                            ? "bg-[#FCEEEA] text-[#A6392C] border border-[#D9C8AC]"
                            : "bg-[#FFFFFF] text-[#6F5B4A] border border-[#D9C8AC]"
                        }`}
                      >
                        ↷ กลับหัว (Reversed)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Keywords List */}
                <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#D9C8AC] space-y-1 ">
                  <span className="text-[10px] text-[#8F5C1A] font-bold block">✦ คำสำคัญ (Keywords):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCard.keywords[viewOrientation].map((kw, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded bg-[#F3EDE2] border border-[#D9C8AC] text-xs font-serif-th text-[#2E211A] font-medium"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 5-Category Deep Meanings */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                    {[
                      { id: "general", label: "ภาพรวมทั่วไป" },
                      { id: "work", label: "การงาน" },
                      { id: "money", label: "การเงิน" },
                      { id: "love", label: "❤️ ความรัก" },
                      { id: "self", label: "จิตวิญญาณ" },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveMeaningCategory(cat.id as typeof activeMeaningCategory)}
                        className={`px-3 py-1 rounded-lg text-xs font-serif-th font-semibold transition-all cursor-pointer whitespace-nowrap ${
                          activeMeaningCategory === cat.id
                            ? "bg-[#8F5C1A] text-[#FFFFFF] font-bold"
                            : "bg-[#FFFFFF] text-[#6F5B4A] hover:text-[#2E211A] border border-[#D9C8AC]"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  <div className="p-4 rounded-lg bg-[#FFFFFF] border border-[#D9C8AC] text-xs text-[#2E211A] font-serif-th leading-relaxed min-h-[90px]">
                    {selectedCard.meanings[activeMeaningCategory][viewOrientation]}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
