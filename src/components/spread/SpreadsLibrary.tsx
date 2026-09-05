"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  type Spread,
  getSpreadName,
  getSpreadTagline,
  getSpreadDescription,
  getPositionName,
  getPositionMeaning,
} from "@/data/spreads";
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
import { useLocale } from "@/lib/i18n";

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

const CATEGORY_MAP_EN: Record<string, string> = {
  general: "General",
  love: "Love & Romance",
  career: "Career & Work",
  work: "Career & Work",
  money: "Finances & Abundance",
  finance: "Finances & Abundance",
  spiritual: "Spiritual Growth",
  decision: "Decision & Dilemmas",
  all: "All",
  recommended: "Recommended",
  master: "Grand Spread",
};

export const SpreadsLibrary: React.FC<SpreadsLibraryProps> = ({ spreads }) => {
  const { isEnglish } = useLocale();
  const [activeCategory, setActiveCategory] = useState<string>("recommended");
  const [expandedSpreadId, setExpandedSpreadId] = useState<string | null>(null);

  const categories = useMemo(
    () => [
      { id: "recommended", label: isEnglish ? "Recommended" : "ยอดนิยมแนะนำ", count: 6, Icon: SparkleTabIcon },
      { id: "love", label: isEnglish ? "Love & Romance" : "ความรัก & คนในใจ", count: 5, Icon: HeartTabIcon },
      { id: "career", label: isEnglish ? "Career & Finances" : "การงาน & การเงิน", count: 5, Icon: PentacleTabIcon },
      { id: "master", label: isEnglish ? "Grand Spreads" : "ผังใหญ่เจาะลึก", count: 5, Icon: CrystalBallTabIcon },
      { id: "all", label: isEnglish ? "All Spreads" : "ผังทั้งหมด", count: spreads.length, Icon: AllSpreadsTabIcon },
    ],
    [spreads.length, isEnglish]
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
      {/* Dynamic Bilingual Hero Header */}
      <div className="text-center space-y-4 sm:space-y-5 py-6 sm:py-8">
        <div>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D5CEC2] bg-[#FFFFFF] text-xs text-[#A58A5C] font-serif-th font-bold shadow-xs">
            
            {isEnglish ? "20 CLASSIC DIVINATION SPREADS" : "20 ผังการเปิดไพ่มาตรฐานสากล"}{" "}
            
          </span>
        </div>
        <h1 className="font-serif-th text-3xl sm:text-5xl font-bold text-[#29261F] tracking-wide leading-normal sm:leading-tight pt-1 [text-wrap:balance]">
          {isEnglish ? "20 Sacred Tarot Spreads & Layouts" : "ผังการเปิดไพ่ทาโรต์ 20 รูปแบบ"}
        </h1>
        <p className="text-xs sm:text-sm text-[#635B4E] max-w-2xl mx-auto leading-relaxed font-serif-th [text-wrap:balance]">
          {isEnglish
            ? "Select a sacred spread attuned to your inquiry. Explore positional dynamics, archetypal geometry, and card interpretations."
            : "เลือกผังที่ตรงกับเรื่องที่คุณอยากรู้ พร้อมดูตัวอย่างการจัดวางและความหมายของแต่ละตำแหน่ง"}
        </p>
      </div>

      {/* Category Tabs with Editorial Styling */}
      <div
        role="tablist"
        aria-label={isEnglish ? "Spread library categories" : "หมวดหมู่คลังผังพยากรณ์"}
        className="flex items-center justify-start gap-2 overflow-x-auto pb-3 px-1 no-scrollbar select-none border-b border-[#D5CEC2]/40"
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
              className={`px-4 py-2 rounded-full text-xs font-serif-th font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 whitespace-nowrap relative focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#A58A5C] ${
                isActive
                  ? "bg-[#29261F] text-[#F3F0EA] shadow-sm"
                  : "bg-[#EAE7E0] text-[#29261F] hover:text-[#A58A5C] border border-[#D5CEC2] hover:border-[#A58A5C]"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-[#A58A5C]" : "text-[#635B4E]"}`} />
              <span>{cat.label}</span>
              <span
                className={`text-[12px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isActive ? "bg-white/20 text-[#F3F0EA]" : "bg-black/5 text-[#635B4E]"
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 20 Spreads Grid */}
      {/* initial={false} — กริดผังคือเนื้อหาหลักของหน้า ต้องมองเห็นได้ใน HTML ฝั่งเซิร์ฟเวอร์ */}
      <AnimatePresence mode="wait" initial={false}>
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
                className="rounded-xl border border-[#D5CEC2] bg-[#FFFFFF] p-5 sm:p-6 flex flex-col justify-between space-y-4 hover:border-[#A58A5C] transition-all duration-300 relative overflow-hidden group shadow-[0_10px_30px_rgba(42,38,31,0.06)]"
              >
                {/* Header Tag */}
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-mono font-bold text-[#29261F] bg-[#EAE7E0] px-2.5 py-0.5 rounded-full border border-[#D5CEC2]">
                      {spread.positions.length} {isEnglish ? "Cards" : "ใบ"}
                    </span>
                    {!isStandardSpread(spread.id) && (
                      <span className="text-[12px] text-[#A58A5C] bg-[#FFFFFF] border border-[#D5CEC2] px-2 py-0.5 rounded-full font-serif-th font-bold flex items-center gap-1">
                        <SealedLockIcon className="w-3 h-3" />
                        <span>{isEnglish ? "Grand Spread" : "ญาณพิเศษ"}</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[13px] text-[#635B4E] font-serif-th">
                    {isEnglish
                      ? `Category: ${CATEGORY_MAP_EN[spread.defaultCategory] || spread.defaultCategory}`
                      : `หมวด: ${CATEGORY_MAP_TH[spread.defaultCategory] || spread.defaultCategory}`}
                  </span>
                </div>

                {/* Interactive Spread Visual Diagram on Illuminated Pedestal */}
                <div className="h-44 flex items-center justify-center my-1 relative select-none rounded-xl bg-[#EAE7E0] border border-[#D5CEC2] p-2 group-hover:border-[#A58A5C] transition-colors">
                  {renderSpreadIllustration(spread.id)}
                </div>

                {/* Titles & Tagline */}
                <div className="space-y-1.5 z-10 pt-3 border-t border-[#D5CEC2]/40">
                  {/* ชื่อผังแต่ละแบบคือหัวข้อระดับที่สองของหน้า /spreads (h1 = ชื่อหน้า) */}
                  <h2 className="font-serif-th text-base sm:text-lg font-bold text-[#29261F] leading-snug py-0.5 [text-wrap:balance]">
                    {getSpreadName(spread, isEnglish)}
                  </h2>
                  <p className="text-xs text-[#635B4E] leading-relaxed font-serif-th">{getSpreadTagline(spread, isEnglish)}</p>
                </div>

                <p className="text-[13px] text-[#29261F] leading-relaxed line-clamp-2 z-10 font-serif-th [text-wrap:pretty]">{getSpreadDescription(spread, isEnglish)}</p>

                {/* Expandable Positions Breakdown */}
                <div className="z-10 space-y-2">
                  <button
                    type="button"
                    onClick={() => toggleExpand(spread.id)}
                    className="w-full text-left text-[13px] font-serif-th text-[#A58A5C] hover:text-[#29261F] flex items-center justify-between py-1.5 border-t border-[#D5CEC2]/40 cursor-pointer transition-colors font-bold"
                  >
                    <span className="flex items-center gap-1.5">
                       {isEnglish ? `View ${spread.positions.length} card positions` : `ดูรายละเอียด ${spread.positions.length} ตำแหน่งไพ่`}
                    </span>
                    <span className="text-[13px]">{isExpanded ? (isEnglish ? "▲ Collapse" : "▲ ย่อ") : (isEnglish ? "▼ Expand" : "▼ ขยาย")}</span>
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
                            className="text-[13px] p-2 rounded-lg bg-[#EAE7E0] border border-[#D5CEC2] flex items-start gap-2"
                          >
                            <span className="text-[#A58A5C] font-mono font-bold flex-shrink-0 text-[13px]">
                              #{idx + 1}
                            </span>
                            <div>
                              <strong className="text-[#29261F] font-serif-th">{getPositionName(pos, isEnglish)}:</strong>{" "}
                              <span className="text-[#635B4E] leading-relaxed font-serif-th">{getPositionMeaning(pos, isEnglish)}</span>
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
                  prefetch={false}
                  className="w-full py-3 rounded-full bg-[#29261F] hover:bg-[#A58A5C] text-[#F3F0EA] font-serif-th font-bold text-xs sm:text-sm text-center active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 z-10 shadow-sm"
                >
                  <span>{isEnglish ? (isStandardSpread(spread.id) ? "Begin Reading with Spread" : "Unlock Grand Spread") : (isStandardSpread(spread.id) ? "เริ่มดูดวงด้วยผังนี้" : "เปิดผังพยากรณ์พิเศษนี้")}</span>
                </Link>
                <Link
                  href={`/spreads/${spread.id}`}
                  prefetch={false}
                  className="z-10 -mt-1 text-center text-[13px] font-serif-th text-[#A58A5C] hover:text-[#29261F] transition-colors"
                >
                  {isEnglish ? "Read Spread Guide →" : "อ่านคู่มือผังนี้ →"}
                </Link>
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
