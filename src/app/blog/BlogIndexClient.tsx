"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import type { Article } from "@/data/articles";
import { soundManager } from "@/lib/utils/audio";

import { SearchTabIcon } from "@/components/ui/TarotArtIcons";
interface BlogIndexClientProps {
  articles: Article[];
}

const CATEGORIES = [
  { id: "all", label: "✦ ทั้งหมด (20 เรื่อง)" },
  { id: "love", label: "ความรัก & เนื้อคู่" },
  { id: "career", label: "การงาน & การเงิน" },
  { id: "spreads", label: "ผังการเปิดไพ่" },
  { id: "cards", label: "ความหมายไพ่" },
  { id: "wisdom", label: "จิตวิทยา & AI" },
];

export const BlogIndexClient: React.FC<BlogIndexClientProps> = ({ articles }) => {
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      const matchCat = selectedCat === "all" || a.category === selectedCat;
      const matchQuery =
        searchQuery.trim() === "" ||
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchQuery;
    });
  }, [articles, selectedCat, searchQuery]);

  const featured = articles[0];

  return (
    <div className="space-y-8">
      {/* Search & Category Filter Bar */}
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative max-w-xl mx-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาบทความ ความหมายไพ่ ความรัก การงาน หรือผังพยากรณ์..."
            className="w-full bg-[#FFFFFF] border border-[#D5CEC2] rounded-xl px-5 py-3.5 pl-11 text-xs sm:text-sm text-[#29261F] placeholder:text-[#756F66]/60 focus:outline-none focus:border-[#A58A5C] focus:ring-1 focus:ring-[#A58A5C] transition-all"
          />
          <SearchTabIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A58A5C]" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#756F66] hover:text-[#29261F] cursor-pointer"
            >
              ✕ ล้างคำค้น
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCat === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  soundManager.playMenuTapSound();
                  setSelectedCat(cat.id);
                }}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold font-serif-th transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#29261F] text-[#F3F0EA] shadow-xs"
                    : "bg-[#EAE7E0] border border-[#D5CEC2] text-[#29261F] hover:border-[#A58A5C] hover:text-[#A58A5C]"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Featured Hero Article (when no filter is applied) */}
      {selectedCat === "all" && !searchQuery && featured && (
        <div className="rounded-xl border border-[#D5CEC2] bg-[#FFFFFF] p-6 sm:p-8 relative overflow-hidden group hover:border-[#A58A5C] transition-all shadow-[0_10px_30px_rgba(42,38,31,0.06)]">
          <div className="relative z-10 space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D5CEC2] bg-[#EAE7E0] text-[11px] text-[#A58A5C] font-mono font-bold">
              <span>✦</span> บทความแนะนำประจำสัปดาห์ (Featured)
            </div>
            <h2 className="font-serif-th text-xl sm:text-3xl font-bold text-[#29261F] leading-snug">
              {featured.title}
            </h2>
            <p className="text-xs sm:text-sm text-[#756F66] font-serif-th leading-relaxed line-clamp-3">
              {featured.description}
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <span className="text-[11px] text-[#756F66] font-mono">
                ⏱ เวลาอ่าน {featured.readTime} · หมวด {featured.categoryTh}
              </span>
              <Link
                href={`/blog/${featured.slug}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#29261F] hover:bg-[#A58A5C] text-[#F3F0EA] font-semibold text-xs transition-all font-serif-th shadow-sm"
              >
                <span>อ่านคัมภีร์ฉบับเต็ม</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Articles Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-[#756F66] px-1 font-serif-th">
          <span>พบบทความ {filtered.length} เรื่อง</span>
          {selectedCat !== "all" && (
            <button
              onClick={() => setSelectedCat("all")}
              className="text-[#A58A5C] hover:underline cursor-pointer font-bold"
            >
              แสดงทั้งหมด
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-[#D5CEC2] bg-[#FFFFFF] p-12 text-center space-y-3 shadow-[0_10px_30px_rgba(42,38,31,0.06)]">
            <p className="text-3xl text-[#A58A5C]">✦</p>
            <p className="font-serif-th text-sm text-[#29261F]">
              ไม่พบบทความที่ตรงกับคำค้นหา &ldquo;{searchQuery}&rdquo;
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCat("all");
              }}
              className="text-xs text-[#A58A5C] underline hover:text-[#29261F] cursor-pointer font-serif-th"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map((article, idx) => (
              <motion.article
                key={article.slug}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.3) }}
                className="rounded-xl border border-[#D5CEC2] bg-[#FFFFFF] p-5 sm:p-6 space-y-3 hover:border-[#A58A5C] transition-all hover:scale-[1.01] flex flex-col justify-between group shadow-[0_10px_30px_rgba(42,38,31,0.04)]"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#EAE7E0] border border-[#D5CEC2] text-[#29261F] font-bold">
                      {article.categoryTh}
                    </span>
                    <span className="text-[#756F66]">⏱ {article.readTime}</span>
                  </div>

                  <h3 className="font-serif-th text-base sm:text-lg font-bold text-[#29261F] group-hover:text-[#A58A5C] transition-colors leading-snug">
                    <Link href={`/blog/${article.slug}`}>{article.title}</Link>
                  </h3>

                  <p className="text-xs text-[#756F66] font-serif-th leading-relaxed line-clamp-3">
                    {article.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#D5CEC2]/40 flex items-center justify-between text-xs">
                  <div className="flex flex-wrap gap-1.5">
                    {article.keywords.slice(0, 2).map((kw) => (
                      <span
                        key={kw}
                        className="text-[9px] text-[#756F66] font-mono bg-[#EAE7E0] px-2 py-0.5 rounded-full border border-[#D5CEC2]"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                  <Link
                    href={`/blog/${article.slug}`}
                    className="inline-flex items-center gap-1 text-xs text-[#29261F] group-hover:text-[#A58A5C] group-hover:translate-x-1 transition-all font-serif-th font-bold"
                  >
                    <span>อ่านต่อ</span>
                    <span>→</span>
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
