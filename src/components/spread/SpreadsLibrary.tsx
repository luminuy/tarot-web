"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import type { Spread } from "@/data/spreads";
import { renderSpreadIllustration } from "@/components/spread/SpreadCardSelector";
import {
  SparkleTabIcon,
  HeartTabIcon,
  PentacleTabIcon,
  CrystalBallTabIcon,
  AllSpreadsTabIcon,
} from "@/components/ui/TarotArtIcons";
import { SealedLockIcon } from "@/components/entitlement/EntitlementIcons";
import { isStandardSpread } from "@/lib/entitlement/limits";

interface SpreadsLibraryProps {
  spreads: Spread[];
}

const CATEGORY_MAP_TH: Record<string, string> = {
  general: "ทั่วไป",
  love: "ความรัก",
  career: "การงาน",
  work: "การงาน",
  money: "การเงิน",
  finance: "การเงิน",
  spiritual: "จิตวิญญาณ",
  decision: "การตัดสินใจ",
  all: "ทั้งหมด",
  recommended: "แนะนำ",
  master: "ผังใหญ่",
};

export const SpreadsLibrary: React.FC<SpreadsLibraryProps> = ({ spreads }) => {
  const [activeCategory, setActiveCategory] = useState<string>("recommended");
  const [expandedSpreadId, setExpandedSpreadId] = useState<string | null>(null);

  const categories = useMemo(
    () => [
      { id: "recommended", label: "ยอดนิยมแนะนำ", count: 6, Icon: SparkleTabIcon },
      { id: "love", label: "ความรัก & คนในใจ", count: 5, Icon: HeartTabIcon },
      { id: "career", label: "การงาน & การเงิน", count: 5, Icon: PentacleTabIcon },
      { id: "master", label: "ผังใหญ่เจาะลึก", count: 5, Icon: CrystalBallTabIcon },
      { id: "all", label: "ผังทั้งหมด", count: spreads.length, Icon: AllSpreadsTabIcon },
    ],
    [spreads.length]
  );

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
        return spreads.filter((s) => ["celtic-cross", "year-ahead", "weekly", "chakra", "monthly"].includes(s.id));
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
      {/* Category Tabs with Refined Golden Halo */}
      <div
        role="tablist"
        aria-label="หมวดหมู่คลังผังพยากรณ์"
        className="flex items-center justify-start gap-2 overflow-x-auto pb-2 px-1 no-scrollbar select-none"
      >
        {categories.map((cat, catIdx) => {
          const isActive = activeCategory === cat.id;
          const Icon = cat.Icon;

          return (
            <button
              key={cat.id}
              role="tab"
              id={`library-tab-${cat.id}`}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              onKeyDown={(e) => {
                let nextIdx = -1;
                if (e.key === "ArrowRight") nextIdx = (catIdx + 1) % categories.length;
                else if (e.key === "ArrowLeft") nextIdx = (catIdx - 1 + categories.length) % categories.length;
                if (nextIdx !== -1) {
                  e.preventDefault();
                  setActiveCategory(categories[nextIdx].id);
                  const nextTab = document.getElementById(`library-tab-${categories[nextIdx].id}`);
                  nextTab?.focus();
                }
              }}
              className={`px-4 py-2 rounded-full text-xs font-serif-th font-bold transition-colors duration-200 cursor-pointer flex items-center gap-2 whitespace-nowrap relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A] ${
                isActive
                  ? "bg-[#8F5C1A] text-[#FFFFFF] border border-[#8F5C1A]"
                  : "bg-[#FFFFFF] text-[#2E211A] hover:text-[#8F5C1A] border border-[#E4D8C4] hover:border-[#8F5C1A] hover:bg-[#F6F1E9]"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-[#FFFFFF]" : "text-[#8F5C1A]"}`} />
              <span>{cat.label}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isActive ? "bg-white/20 text-[#FFFFFF]" : "bg-black/5 text-[#6F5B4A]"
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
          role="tabpanel"
          id={`library-panel-${activeCategory}`}
          aria-labelledby={`library-tab-${activeCategory}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
        >
          {filteredSpreads.map((spread) => {
            const isExpanded = expandedSpreadId === spread.id;

            return (
              <div
                key={spread.id}
                className="rounded-lg border border-[#E4D8C4] bg-[#FFFFFF] p-5 sm:p-6 flex flex-col justify-between space-y-4 hover:border-[#8F5C1A] transition-all duration-300 relative overflow-hidden group"
              >
                {/* Header Tag */}
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-[#2E211A] bg-[#F0E8DB] px-2.5 py-0.5 rounded-full border border-[#E4D8C4] ">
                      {spread.positions.length} ใบ
                    </span>
                    {!isStandardSpread(spread.id) && (
                      <span className="text-[9px] text-[#8F5C1A] bg-[#FFFFFF] border border-[#E4D8C4] px-2 py-0.5 rounded-full font-serif-th font-bold flex items-center gap-1 ">
                        <SealedLockIcon className="w-3 h-3" />
                        <span>✦ ญาณพิเศษ</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#6F5B4A] font-serif-th">
                    หมวด: {CATEGORY_MAP_TH[spread.defaultCategory] || spread.defaultCategory}
                  </span>
                </div>

                {/* Interactive Spread Visual Diagram on Illuminated Pedestal */}
                <div className="h-44 flex items-center justify-center my-1 relative select-none rounded-lg bg-[#F0E8DB] border border-[#E4D8C4]/50 p-2 group-hover:border-[#8F5C1A] transition-colors">
                  {renderSpreadIllustration(spread.id)}
                </div>

                {/* Titles & Tagline */}
                <div className="space-y-1.5 z-10 pt-3 border-t border-[#E4D8C4]/30">
                  <h3 className="font-serif-th text-base sm:text-lg font-bold font-mystic-gold leading-tight">
                    {spread.nameTh}
                  </h3>
                  <p className="text-xs text-[#6F5B4A] leading-snug">{spread.tagline}</p>
                </div>

                <p className="text-[11px] text-[#2E211A] leading-relaxed line-clamp-2 z-10">{spread.description}</p>

                {/* Expandable Positions Breakdown */}
                <div className="z-10 space-y-2">
                  <button
                    type="button"
                    onClick={() => toggleExpand(spread.id)}
                    className="w-full text-left text-[11px] font-serif-th text-[#8F5C1A] hover:text-[#2E211A] flex items-center justify-between py-1.5 border-t border-[#E4D8C4]/30 cursor-pointer transition-colors font-bold"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>✦</span> ดูรายละเอียด {spread.positions.length} ตำแหน่งไพ่
                    </span>
                    <span className="text-[10px]">{isExpanded ? "▲ ย่อ" : "▼ ขยาย"}</span>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-1.5 pt-1 overflow-hidden"
                      >
                        {spread.positions.map((pos, idx) => (
                          <div
                            key={idx}
                            className="text-[10.5px] p-2 rounded-lg bg-[#F0E8DB] border border-[#E4D8C4] flex items-start gap-2"
                          >
                            <span className="text-[#8F5C1A] font-mono font-bold flex-shrink-0 text-[10px]">
                              #{idx + 1}
                            </span>
                            <div>
                              <strong className="text-[#2E211A] font-serif-th">{pos.nameTh}:</strong>{" "}
                              <span className="text-[#6F5B4A] leading-relaxed">{pos.meaning}</span>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Primary Action Button: Link directly to Altar */}
                <Link
                  href={`/?spread=${spread.id}`}
                  className="w-full py-3 rounded-full bg-[#8F5C1A] hover:bg-[#74490F] text-[#FFFFFF] font-serif-th font-bold text-xs sm:text-sm text-center active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 z-10"
                >
                  <span>✦ {isStandardSpread(spread.id) ? "เริ่มดูดวงด้วยผังนี้" : "เปิดผังพยากรณ์พิเศษนี้"}</span>
                </Link>
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
