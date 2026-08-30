"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import type { Spread } from "@/data/spreads";
import { renderSpreadIllustration } from "@/components/spread/SpreadCardSelector";

interface SpreadsLibraryProps {
  spreads: Spread[];
}

export const SpreadsLibrary: React.FC<SpreadsLibraryProps> = ({ spreads }) => {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [expandedSpreadId, setExpandedSpreadId] = useState<string | null>(null);

  const categories = [
    { id: "all", label: "ผังทั้งหมด", count: spreads.length },
    { id: "recommended", label: "ยอดนิยมแนะนำ", count: 6 },
    { id: "love", label: "ความรัก & ความสัมพันธ์", count: 5 },
    { id: "career", label: "การงาน & การเงิน", count: 5 },
    { id: "master", label: "ผังใหญ่เจาะลึก", count: 5 },
  ];

  const filteredSpreads = useMemo(() => {
    switch (activeCategory) {
      case "recommended":
        return spreads.filter((s) =>
          ["daily", "quick", "yes-no", "three-card", "situation-solution", "celtic-cross"].includes(s.id)
        );
      case "love":
        return spreads.filter((s) =>
          ["love", "how-they-feel", "ex-reconciliation", "soulmate", "three-card"].includes(s.id)
        );
      case "career":
        return spreads.filter((s) =>
          ["career", "money", "career-switch", "decision", "inner-potential"].includes(s.id)
        );
      case "master":
        return spreads.filter((s) =>
          ["celtic-cross", "year-ahead", "weekly", "chakra", "monthly"].includes(s.id)
        );
      case "all":
      default:
        return spreads;
    }
  }, [spreads, activeCategory]);

  const toggleExpand = (id: string) => {
    setExpandedSpreadId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex items-center justify-start gap-1.5 sm:gap-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-serif-th font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap select-none ${
                isActive
                  ? "bg-gradient-to-r from-[#c59b27] via-[#f5deaa] to-[#e5c07b] text-[#05040a] shadow-[0_0_15px_rgba(229,192,123,0.35)]"
                  : "bg-[#100b20]/90 text-[#9c93b8] hover:text-[#f5deaa] border border-[#e5c07b]/20 hover:border-[#e5c07b]/40"
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isActive ? "bg-[#05040a]/20 text-[#05040a]" : "bg-white/5 text-[#9c93b8]"
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 20 Spreads Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {filteredSpreads.map((spread) => {
            const isExpanded = expandedSpreadId === spread.id;

            return (
              <div
                key={spread.id}
                className="rounded-2xl border border-[#e5c07b]/25 bg-gradient-to-b from-[#130d24]/95 to-[#07040f]/95 p-5 flex flex-col justify-between space-y-4 hover:border-[#ffd700]/60 transition-all shadow-xl relative overflow-hidden"
              >
                {/* Header Tag */}
                <div className="flex items-center justify-between z-10">
                  <span className="text-[10px] font-mono font-bold text-[#e5c07b] bg-[#e5c07b]/15 px-2.5 py-0.5 rounded-full border border-[#e5c07b]/30">
                    {spread.positions.length} ใบ
                  </span>
                  <span className="text-[10px] text-[#9c93b8] font-serif-th">
                    หมวด: {spread.defaultCategory}
                  </span>
                </div>

                {/* Interactive Spread Visual Diagram */}
                <div className="my-auto py-2 flex items-center justify-center filter drop-shadow-[0_0_15px_rgba(229,192,123,0.25)]">
                  {renderSpreadIllustration(spread.id)}
                </div>

                {/* Titles & Tagline */}
                <div className="space-y-1 z-10 pt-2 border-t border-[#e5c07b]/15">
                  <h3 className="font-serif-th text-base font-bold font-mystic-gold">
                    {spread.nameTh}
                  </h3>
                  <p className="text-xs text-[#9c93b8] leading-snug">{spread.tagline}</p>
                </div>

                <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2 z-10">
                  {spread.description}
                </p>

                {/* Expandable Positions Breakdown */}
                <div className="z-10 space-y-2">
                  <button
                    type="button"
                    onClick={() => toggleExpand(spread.id)}
                    className="w-full text-left text-[11px] font-serif-th text-[#e5c07b] hover:text-[#ffd700] flex items-center justify-between py-1 border-t border-[#e5c07b]/10 cursor-pointer"
                  >
                    <span>✦ ดูรายละเอียด {spread.positions.length} ตำแหน่งไพ่</span>
                    <span>{isExpanded ? "▲ ย่อ" : "▼ ขยาย"}</span>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-1.5 overflow-hidden text-[11px] font-serif-th text-gray-300 pt-1"
                      >
                        {spread.positions.map((pos) => (
                          <div
                            key={pos.index}
                            className="p-1.5 rounded bg-black/40 border border-white/5 space-y-0.5"
                          >
                            <div className="font-bold text-[#e5c07b] text-[10px]">
                              {pos.nameTh}
                            </div>
                            <div className="text-[10px] text-gray-400 leading-tight">
                              {pos.meaning}
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Start Reading Action Button */}
                <div className="pt-2 z-10">
                  <Link
                    href={`/?spread=${spread.id}`}
                    className="w-full py-2 px-4 rounded-xl text-xs font-serif-th font-bold bg-gradient-to-r from-[#c59b27] via-[#f5deaa] to-[#e5c07b] text-[#05040a] shadow-[0_0_15px_rgba(229,192,123,0.3)] hover:scale-[1.02] transition-transform flex items-center justify-center gap-1.5 text-center"
                  >
                    <span>✦</span> เข้าสู่วิหารพยากรณ์ด้วยผังนี้
                  </Link>
                </div>

                {/* Holographic Sheen Layer */}
                <div className="gold-foil-sheen absolute inset-0 opacity-10 hover:opacity-25 transition-opacity pointer-events-none" />
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
