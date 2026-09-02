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
            className="w-full bg-[#130d24]/90 border border-[#e5c07b]/30 rounded-2xl px-5 py-3.5 pl-11 text-xs sm:text-sm text-[#f5deaa] placeholder:text-[#8a7f9d] focus:outline-none focus:border-[#ffd700] focus:ring-2 focus:ring-[#ffd700]/20 transition-all shadow-inner"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#e5c07b] text-base">
            🔍
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#9c93b8] hover:text-white"
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
                    ? "bg-[#e5c07b]/20 border border-[#ffd700] text-[#ffd700] shadow-[0_0_15px_rgba(229,192,123,0.25)] scale-[1.03]"
                    : "bg-[#140c24]/70 border border-[#e5c07b]/20 text-[#9c93b8] hover:border-[#ffd700]/50 hover:text-[#e5c07b]"
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
        <div className="rounded-3xl border border-[#ffd700]/40 bg-gradient-to-br from-[#241740]/90 via-[#140b28]/95 to-[#07040f] p-6 sm:p-8 relative overflow-hidden shadow-2xl group hover:border-[#ffd700]/70 transition-all">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-radial from-[#ffd700]/15 to-transparent rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#ffd700]/40 bg-[#ffd700]/10 text-[11px] text-[#ffd700] font-mono">
              <span>✦</span> บทความแนะนำประจำสัปดาห์ (Featured)
            </div>
            <h2 className="font-serif-th text-xl sm:text-3xl font-bold font-mystic-gold leading-snug">
              {featured.title}
            </h2>
            <p className="text-xs sm:text-sm text-[#cfc8e2] font-serif-th leading-relaxed line-clamp-3">
              {featured.description}
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <span className="text-[11px] text-[#9c93b8] font-mono">
                ⏱ เวลาอ่าน {featured.readTime} · หมวด {featured.categoryTh}
              </span>
              <Link
                href={`/blog/${featured.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4a72c] to-[#a27b14] text-[#0b0714] font-semibold text-xs hover:brightness-110 transition-all shadow-lg font-serif-th"
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
        <div className="flex items-center justify-between text-xs text-[#9c93b8] px-1 font-serif-th">
          <span>พบบทความ {filtered.length} เรื่อง</span>
          {selectedCat !== "all" && (
            <button
              onClick={() => setSelectedCat("all")}
              className="text-[#e5c07b] hover:underline"
            >
              แสดงทั้งหมด
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-[#e5c07b]/20 bg-[#120a22]/70 p-12 text-center space-y-3">
            <p className="text-3xl">🔮</p>
            <p className="font-serif-th text-sm text-[#e5c07b]">
              ไม่พบบทความที่ตรงกับคำค้นหา &ldquo;{searchQuery}&rdquo;
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCat("all");
              }}
              className="text-xs text-[#9c93b8] underline hover:text-white"
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
                className="rounded-2xl border border-[#e5c07b]/20 bg-gradient-to-b from-[#140c26]/90 via-[#0d071a]/95 to-[#06030c] p-5 sm:p-6 space-y-3 hover:border-[#ffd700]/50 hover:bg-[#180f2e] transition-all hover:scale-[1.01] shadow-xl flex flex-col justify-between group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#e5c07b]/10 border border-[#e5c07b]/30 text-[#e5c07b]">
                      {article.categoryTh}
                    </span>
                    <span className="text-[#8c82a5]">⏱ {article.readTime}</span>
                  </div>

                  <h3 className="font-serif-th text-base sm:text-lg font-bold font-mystic-gold group-hover:text-[#ffe28a] transition-colors leading-snug">
                    <Link href={`/blog/${article.slug}`}>
                      {article.title}
                    </Link>
                  </h3>

                  <p className="text-xs text-[#a99fc2] font-serif-th leading-relaxed line-clamp-3">
                    {article.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#e5c07b]/10 flex items-center justify-between text-xs">
                  <div className="flex flex-wrap gap-1.5">
                    {article.keywords.slice(0, 2).map((kw) => (
                      <span
                        key={kw}
                        className="text-[9px] text-[#7d7396] font-mono bg-[#090514] px-1.5 py-0.5 rounded border border-[#e5c07b]/10"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                  <Link
                    href={`/blog/${article.slug}`}
                    className="inline-flex items-center gap-1 text-xs text-[#e5c07b] group-hover:text-[#ffd700] group-hover:translate-x-1 transition-all font-serif-th font-semibold"
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
