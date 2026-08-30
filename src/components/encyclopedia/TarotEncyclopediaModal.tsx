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

export const TarotEncyclopediaModal: React.FC<TarotEncyclopediaModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [filter, setFilter] = useState<SuitFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedCard, setSelectedCard] = useState<TarotCard | null>(null);
  const [activeMeaningCategory, setActiveMeaningCategory] = useState<"general" | "work" | "money" | "love" | "self">("general");
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          className="w-full max-w-4xl max-h-[90vh] rounded-3xl bg-[#0e081e]/98 border border-[#e5c07b]/40 p-5 sm:p-7 shadow-[0_0_80px_rgba(0,0,0,0.95)] flex flex-col relative space-y-4 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#e5c07b]/20 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full border border-[#e5c07b] flex items-center justify-center text-sm bg-[#0a0812]">
                📖
              </div>
              <div>
                <h3 className="font-serif-th text-sm sm:text-base font-bold font-mystic-gold">
                  คัมภีร์สารานุกรมไพ่ 78 ใบ (Tarot Encyclopedia)
                </h3>
                <p className="text-[10px] text-[#9c93b8]">
                  ศึกษาความหมายเชิงลึก 5 หมวดชีวิต สัญลักษณ์ และคีย์เวิร์ดของสำรับทาโรต์
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#1b1230] border border-[#e5c07b]/30 text-[#e5c07b] hover:bg-[#e5c07b] hover:text-[#05040a] text-sm flex items-center justify-center transition-all cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Filter Bar & Search */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: "all", label: "ทั้งหมด (78)" },
                { id: "major", label: "ชุดหลัก Major (22)" },
                { id: "wands", label: "🔥 ไม้เท้า Wands" },
                { id: "cups", label: "🌊 ถ้วย Cups" },
                { id: "swords", label: "🌪️ ดาบ Swords" },
                { id: "pentacles", label: "🌿 เหรียญ Pentacles" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id as SuitFilter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-serif-th font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    filter === tab.id
                      ? "bg-gradient-to-r from-[#c59b27] to-[#e5c07b] text-[#05040a] font-bold shadow"
                      : "bg-[#140b24] text-[#cfc8e2] hover:bg-[#1f1238] border border-[#e5c07b]/20"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="🔍 ค้นหาตามชื่อไพ่ (เช่น The Fool, ราชินีถ้วย, ความรัก, การเงิน)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#140b24] border border-[#e5c07b]/30 rounded-xl px-3.5 py-2 text-xs text-[#f5deaa] placeholder:text-[#9c93b8]/60 focus:outline-none focus:border-[#e5c07b]"
            />
          </div>

          {/* Content Area: Grid of Cards */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 no-scrollbar min-h-[300px]">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {filteredCards.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleSelectCard(c)}
                  className="p-2 rounded-2xl bg-gradient-to-b from-[#180f30] to-[#0d071a] border border-[#e5c07b]/25 hover:border-[#e5c07b]/80 transition-all cursor-pointer flex flex-col items-center text-center space-y-1.5 shadow-md hover:scale-105 group"
                >
                  <div className="w-16 h-[108px] sm:w-18 sm:h-[122px] rounded-xl shadow overflow-hidden flex-shrink-0">
                    <TarotCardComponent card={c} isRevealed={true} size="sm" className="w-full h-full" />
                  </div>
                  <span className="text-[10px] font-serif-th font-bold text-[#f5deaa] truncate max-w-full block leading-tight">
                    {c.nameTh}
                  </span>
                  <span className="text-[8px] text-[#9c93b8] font-mono truncate max-w-full block">
                    {c.nameEn}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Card Deep Wisdom Detail Modal Layer */}
          {selectedCard && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/90 backdrop-blur-2xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-2xl max-h-[90vh] rounded-3xl bg-[#0e081e] border-2 border-[#e5c07b]/60 p-5 sm:p-7 shadow-[0_0_80px_rgba(229,192,123,0.3)] flex flex-col relative space-y-4 overflow-y-auto"
              >
                <button
                  type="button"
                  onClick={() => setSelectedCard(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#1b1230] border border-[#e5c07b]/30 text-[#e5c07b] hover:bg-[#e5c07b] hover:text-[#05040a] text-sm flex items-center justify-center transition-all cursor-pointer z-10"
                >
                  ✕
                </button>

                {/* Card Title & Meta */}
                <div className="flex items-start gap-4 pb-3 border-b border-[#e5c07b]/20">
                  <div className="w-24 h-[163px] flex-shrink-0">
                    <TarotCardComponent
                      card={selectedCard}
                      isRevealed={true}
                      isReversed={viewOrientation === "reversed"}
                      size="sm"
                      className="w-full h-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif-th text-base sm:text-lg font-bold font-mystic-gold">
                        {selectedCard.nameTh}
                      </h3>
                      <span className="text-xs text-[#9c93b8] font-mono">
                        ({selectedCard.nameEn})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-[10px] text-[#cfc8e2]">
                      <span className="px-2 py-0.5 rounded-full bg-[#1b1230] border border-[#e5c07b]/30 text-[#e5c07b]">
                        ธาตุ: {selectedCard.element}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#1b1230] border border-[#e5c07b]/30">
                        โหราศาสตร์: {selectedCard.astrology}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#1b1230] border border-[#e5c07b]/30">
                        ตัวเลข: {selectedCard.numerology}
                      </span>
                    </div>

                    {/* Orientation Switcher */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => setViewOrientation("upright")}
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                          viewOrientation === "upright"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-500/50 shadow"
                            : "bg-[#140b24] text-[#9c93b8]"
                        }`}
                      >
                        ✦ หัวตั้ง (Upright)
                      </button>
                      <button
                        onClick={() => setViewOrientation("reversed")}
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                          viewOrientation === "reversed"
                            ? "bg-rose-950 text-rose-300 border border-rose-500/50 shadow"
                            : "bg-[#140b24] text-[#9c93b8]"
                        }`}
                      >
                        ↷ กลับหัว (Reversed)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Keywords List */}
                <div className="p-3 rounded-xl bg-[#140b24] border border-[#e5c07b]/25 space-y-1">
                  <span className="text-[10px] text-[#e5c07b] font-semibold block">
                    ✦ คำสำคัญ (Keywords):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCard.keywords[viewOrientation].map((kw, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded-md bg-[#090514] border border-[#e5c07b]/30 text-xs font-serif-th text-[#f5deaa]"
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
                      { id: "work", label: "💼 การงาน" },
                      { id: "money", label: "💰 การเงิน" },
                      { id: "love", label: "❤️ ความรัก" },
                      { id: "self", label: "🌱 จิตวิญญาณ" },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveMeaningCategory(cat.id as typeof activeMeaningCategory)}
                        className={`px-3 py-1 rounded-lg text-xs font-serif-th font-semibold transition-all cursor-pointer whitespace-nowrap ${
                          activeMeaningCategory === cat.id
                            ? "bg-[#e5c07b] text-[#05040a] font-bold"
                            : "bg-[#140b24] text-[#cfc8e2] hover:bg-[#1e1236]"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  <div className="p-4 rounded-xl bg-[#090514] border border-[#e5c07b]/25 text-xs text-[#cfc8e2] font-serif-th leading-relaxed shadow-inner min-h-[90px]">
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
