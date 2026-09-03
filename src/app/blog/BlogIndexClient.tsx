"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import type { Article } from "@/data/articles";
import { soundManager } from "@/lib/utils/audio";

interface BlogIndexClientProps {
  articles: Article[];
}

const CATEGORIES = [
  { id: "all", label: "✦ ทั้งหมด (20 เรื่อง)" },
  { id: "love", label: "💖 ความรัก & เนื้อคู่" },
  { id: "career", label: "💼 การงาน & การเงิน" },
  { id: "spreads", label: "📐 ผังการเปิดไพ่" },
  { id: "cards", label: "🃏 ความหมายไพ่" },
  { id: "wisdom", label: "🔮 จิตวิทยา & AI" },
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
            className="w-full bg-[#FFFFFF] border border-[#E4D8C4] rounded-lg px-5 py-3.5 pl-11 text-xs sm:text-sm text-[#2E211A] placeholder:text-[#6F5B4A]/60 focus:outline-none focus:border-[#8F5C1A] focus:ring-2 focus:ring-[#8F5C1A]/20 transition-all "
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8F5C1A] text-base">🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#6F5B4A] hover:text-[#2E211A] cursor-pointer"
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
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold font-serif-th transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#8F5C1A] border border-[#E4D8C4] text-[#FFFFFF] scale-[1.03]"
                    : "bg-[#FFFFFF] border border-[#E4D8C4] text-[#2E211A] hover:border-[#8F5C1A] hover:text-[#8F5C1A] hover:bg-[#F6F1E9]"
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
        <div className="rounded-lg border border-[#E4D8C4] bg-[#FFFFFF] p-6 sm:p-8 relative overflow-hidden group hover:border-[#8F5C1A] transition-all">
          <div className="relative z-10 space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#E4D8C4] bg-[#F0E8DB] text-[11px] text-[#8F5C1A] font-mono font-bold ">
              <span>✦</span> บทความแนะนำประจำสัปดาห์ (Featured)
            </div>
            <h2 className="font-serif-th text-xl sm:text-3xl font-bold font-mystic-gold leading-snug">
              {featured.title}
            </h2>
            <p className="text-xs sm:text-sm text-[#6F5B4A] font-serif-th leading-relaxed line-clamp-3">
              {featured.description}
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <span className="text-[11px] text-[#6F5B4A] font-mono">
                ⏱ เวลาอ่าน {featured.readTime} · หมวด {featured.categoryTh}
              </span>
              <Link
                href={`/blog/${featured.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#8F5C1A] hover:bg-[#74490F] text-[#FFFFFF] font-semibold text-xs transition-all font-serif-th"
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
        <div className="flex items-center justify-between text-xs text-[#6F5B4A] px-1 font-serif-th">
          <span>พบบทความ {filtered.length} เรื่อง</span>
          {selectedCat !== "all" && (
            <button
              onClick={() => setSelectedCat("all")}
              className="text-[#8F5C1A] hover:underline cursor-pointer font-bold"
            >
              แสดงทั้งหมด
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-[#E4D8C4] bg-[#FFFFFF] p-12 text-center space-y-3 ">
            <p className="text-3xl">🔮</p>
            <p className="font-serif-th text-sm text-[#2E211A]">
              ไม่พบบทความที่ตรงกับคำค้นหา &ldquo;{searchQuery}&rdquo;
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCat("all");
              }}
              className="text-xs text-[#8F5C1A] underline hover:text-[#2E211A] cursor-pointer"
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
                className="rounded-lg border border-[#E4D8C4] bg-[#FFFFFF] p-5 sm:p-6 space-y-3 hover:border-[#8F5C1A] hover:bg-[#F6F1E9] transition-all hover:scale-[1.01] flex flex-col justify-between group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#F0E8DB] border border-[#E4D8C4] text-[#8F5C1A] font-bold">
                      {article.categoryTh}
                    </span>
                    <span className="text-[#6F5B4A]">⏱ {article.readTime}</span>
                  </div>

                  <h3 className="font-serif-th text-base sm:text-lg font-bold font-mystic-gold group-hover:text-[#8F5C1A] transition-colors leading-snug">
                    <Link href={`/blog/${article.slug}`}>{article.title}</Link>
                  </h3>

                  <p className="text-xs text-[#6F5B4A] font-serif-th leading-relaxed line-clamp-3">
                    {article.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#E4D8C4]/30 flex items-center justify-between text-xs">
                  <div className="flex flex-wrap gap-1.5">
                    {article.keywords.slice(0, 2).map((kw) => (
                      <span
                        key={kw}
                        className="text-[9px] text-[#2E211A] font-mono bg-[#F0E8DB] px-1.5 py-0.5 rounded border border-[#E4D8C4]"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                  <Link
                    href={`/blog/${article.slug}`}
                    className="inline-flex items-center gap-1 text-xs text-[#8F5C1A] group-hover:text-[#2E211A] group-hover:translate-x-1 transition-all font-serif-th font-bold"
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
