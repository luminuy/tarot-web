"use client";

import React, { useState, useMemo } from "react";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import type { ArticleSummary } from "@/data/articles";
import {
  getArticleTitle,
  getArticleDescription,
  getArticleCategory,
} from "@/data/article-helpers";
import { getArticleCardArt } from "@/data/article-art";
import { CardImage } from "@/components/card/CardImage";
import { useLocale } from "@/lib/i18n";

const SearchIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="10.8" cy="10.8" r="6.3" />
    <path d="m15.4 15.4 4.1 4.1" />
  </svg>
);

export type BlogCardItem = Pick<
  ArticleSummary,
  | "slug"
  | "category"
  | "categoryTh"
  | "categoryEn"
  | "title"
  | "titleEn"
  | "description"
  | "descriptionEn"
  | "readTime"
  | "keywords"
>;

export interface BlogIndexClientProps {
  articles: BlogCardItem[];
}

const CATEGORIES = [
  { id: "all", labelTh: "ทั้งหมด", labelEn: "All Articles" },
  { id: "love", labelTh: "ความรัก & เนื้อคู่", labelEn: "Love & Soulmates" },
  { id: "career", labelTh: "การงาน & การเงิน", labelEn: "Career & Abundance" },
  { id: "spreads", labelTh: "ผังการเปิดไพ่", labelEn: "Tarot Spreads" },
  { id: "cards", labelTh: "ความหมายไพ่", labelEn: "Card Meanings" },
  { id: "wisdom", labelTh: "จิตวิทยา & AI", labelEn: "Psychology & AI" },
];

export const BlogIndexClient: React.FC<BlogIndexClientProps> = ({ articles }) => {
  const { isEnglish, locale } = useLocale();
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (selectedCat === "all" && !q) return articles;

    return articles.filter((a) => {
      const matchCat = selectedCat === "all" || a.category === selectedCat;
      if (!matchCat) return false;
      if (!q) return true;

      const titleTh = a.title.toLowerCase();
      const descTh = a.description.toLowerCase();
      const titleEn = getArticleTitle(a, "en").toLowerCase();
      const descEn = getArticleDescription(a, "en").toLowerCase();
      const matchKeywords = a.keywords.some((k) => k.toLowerCase().includes(q));

      return (
        titleTh.includes(q) ||
        descTh.includes(q) ||
        titleEn.includes(q) ||
        descEn.includes(q) ||
        matchKeywords
      );
    });
  }, [articles, selectedCat, searchQuery]);

  const featured = articles[0];

  return (
    <div className="space-y-10">
      {/* Dynamic Bilingual Hero Header */}
      <header className="text-center space-y-4 pt-2">
        <p className="text-xs sm:text-sm font-semibold tracking-wider text-gold-ink uppercase font-serif-th">
          {isEnglish
            ? "SEERTAROT WISDOM CODEX & ESOTERIC ESSAYS"
            : "คลังความรู้และคู่มือศาสตร์พยากรณ์"}
        </p>
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold font-serif-th text-ink tracking-tight leading-tight">
          {isEnglish
            ? "Tarot Wisdom Codex & Divination Essays"
            : "คัมภีร์บทความดูดวงไพ่ยิปซี ทาโรต์ 1909"}
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-muted max-w-2xl mx-auto leading-relaxed font-serif-th">
          {isEnglish
            ? "Explore depth psychology, Jungian archetypes, archetypal symbolism, and master guides for love, career, and 26 sacred spreads rooted in the authentic 1909 Rider-Waite lineage."
            : "เจาะลึกศาสตร์ไพ่ทาโรต์ดั้งเดิม 1909 Rider-Waite จิตวิทยาเชิงลึก ปรัชญา คาร์ล ยุง และคู่มือการอ่านไพ่ความรัก การงาน และผังพยากรณ์ทั้ง 26 แบบ โดยวิหาร SeerTarot"}
        </p>
      </header>

      {/* Search & Category Filter Bar */}
      <div className="space-y-4">
        {/* Search Input — Soft Porcelain with Taupe border and Gold Accent */}
        <div className="relative max-w-xl mx-auto">
          <input
              aria-label={isEnglish ? "Search articles" : "ค้นหาบทความ"}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isEnglish
                ? "Search articles, card meanings, love, career, or spreads..."
                : "ค้นหาบทความ ความหมายไพ่ ความรัก การงาน หรือผังพยากรณ์..."
            }
            className="glass-field w-full border border-line-interactive rounded-2xl px-5 py-3.5 pl-11 text-xs sm:text-sm text-ink placeholder:text-muted/70 focus:outline-none focus:border-gold-ink focus:ring-1 focus:ring-gold-ink transition font-serif-th"
          />
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-ink" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-gold-ink cursor-pointer font-serif-th"
            >
              {isEnglish ? "✕ Clear" : "✕ ล้าง"}
            </button>
          )}
        </div>

        {/* Category Filter Pills — Quiet Luxury Styling */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCat === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  import("@/lib/utils/audio")
                    .then(({ soundManager }) => soundManager.playMenuTapSound())
                    .catch(() => {});
                  setSelectedCat(cat.id);
                }}
                className={`tap-overlay-y rounded-full px-4 py-1.5 text-xs font-serif-th font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "btn-gold-glass"
                    : "glass-chip text-muted hover:text-gold-ink"
                }`}
              >
                
                <span>
                  {cat.id === "all"
                    ? isEnglish
                      ? `All (${articles.length})`
                      : `ทั้งหมด (${articles.length} บทความ)`
                    : isEnglish
                      ? cat.labelEn
                      : cat.labelTh}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Featured Hero Article (when no filter is applied) */}
      {selectedCat === "all" && !searchQuery && featured && (() => {
        const featArt = getArticleCardArt(featured);
        const featTitle = getArticleTitle(featured, locale);
        const featDesc = getArticleDescription(featured, locale);
        const featCat = getArticleCategory(featured, locale);
        const readTime = isEnglish
          ? featured.readTime.replace("นาที", "min read")
          : featured.readTime;

        return (
          <div className="rounded-2xl border border-line-warm bg-gradient-to-br from-surface via-surface-warm to-[#F5EFE4] p-6 sm:p-8 lg:p-10 shadow-[0_4px_20px_rgba(41,38,31,0.05)] relative overflow-hidden group hover:border-gold-ink transition duration-300">
            {/* Subtle Ambient Gold Hairline */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-gold-ink/40 to-transparent pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 relative z-10">
              {/* 1909 Rider-Waite Card Art Showcase */}
              <div className="w-24 h-36 sm:w-28 sm:h-42 rounded-xl overflow-hidden border-2 border-line-warm shadow-md group-hover:scale-105 group-hover:border-gold-ink transition duration-300 bg-inset-warm flex-shrink-0 relative">
                <CardImage
                  image={featArt.image}
                  alt=""
                  className="w-full h-full object-cover"
                  sizes="112px"
                  loading="eager"
                  fetchPriority="high"
                />
              </div>

              {/* Content */}
              <div className="space-y-3.5 flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="glass-chip inline-flex items-center gap-1.5 px-3 py-0.5 text-[11px] font-serif-th font-bold text-gold-ink">
                    {isEnglish ? "Featured Codex of the Week" : "บทความแนะนำประจำสัปดาห์"}
                  </span>
                  <span className="glass-chip text-[11px] font-serif-th text-muted px-2.5 py-0.5">
                    {featCat}
                  </span>
                </div>

                <h2 className="font-serif-th text-xl sm:text-2xl lg:text-3xl font-bold text-ink group-hover:text-gold-ink transition-colors leading-snug">
                  <Link href={`/blog/${featured.slug}`} prefetch={false}>{featTitle}</Link>
                </h2>

                <p className="text-xs sm:text-sm text-muted font-serif-th leading-relaxed line-clamp-3">
                  {featDesc}
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2">
                  <span className="text-xs text-muted font-serif-th flex items-center gap-1.5">
                    
                    {isEnglish ? `Reading time ${readTime}` : `เวลาอ่าน ${readTime}`}
                  </span>
                  <Link
                    href={`/blog/${featured.slug}`}
                    prefetch={false}
                    className="btn-gold-glass inline-flex items-center gap-2 px-5 py-2.5 font-semibold text-xs font-serif-th group/btn"
                  >
                    <span>{isEnglish ? "Read Full Codex" : "อ่านคัมภีร์ฉบับเต็ม"}</span>
                    <span className="transition-transform group-hover/btn:translate-x-0.5">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Articles Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-muted px-1 font-serif-th">
          <span className="flex items-center gap-1.5">
            
            {isEnglish ? `Found ${filtered.length} articles` : `พบบทความ ${filtered.length} เรื่อง`}
          </span>
          {selectedCat !== "all" && (
            <button
              onClick={() => setSelectedCat("all")}
              className="text-gold-ink hover:underline cursor-pointer font-bold"
            >
              {isEnglish ? "Show All" : "แสดงทั้งหมด"}
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="altar-card-porcelain p-12 text-center space-y-3">
            
            <p className="font-serif-th text-sm text-ink">
              {isEnglish
                ? `No articles found matching "${searchQuery}"`
                : `ไม่พบบทความที่ตรงกับคำค้นหา “${searchQuery}”`}
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCat("all");
              }}
              className="text-xs text-gold-ink underline hover:text-ink cursor-pointer font-serif-th"
            >
              {isEnglish ? "Clear all filters" : "ล้างตัวกรองทั้งหมด"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((article, idx) => {
              const cardArt = getArticleCardArt(article);
              const artTitle = getArticleTitle(article, locale);
              const artDesc = getArticleDescription(article, locale);
              const artCat = getArticleCategory(article, locale);
              const readTime = isEnglish
                ? article.readTime.replace("นาที", "min read")
                : article.readTime;
              const isAboveFold = idx < 4;

              return (
                <article
                  key={article.slug}
                  className="rounded-2xl border border-line-warm bg-gradient-to-b from-surface via-surface-warm to-[#F7F3EB] p-5 sm:p-6 space-y-4 hover:border-gold-ink transition duration-300 flex flex-col justify-between group shadow-[0_2px_12px_rgba(41,38,31,0.04)] hover:shadow-[0_10px_28px_rgba(143,92,26,0.10)] relative overflow-hidden"
                >
                  <div className="space-y-3.5">
                    {/* Header: Category & Read Time */}
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-line-warm/40">
                      <span className="glass-chip text-[11px] font-serif-th font-bold text-gold-ink px-2.5 py-0.5">
                        {artCat}
                      </span>
                      <span className="text-xs font-serif-th text-muted flex items-center gap-1">
                        <span className="text-gold-ink">•</span> {readTime}
                      </span>
                    </div>

                    {/* Middle: Content with 1909 Card Companion */}
                    <div className="flex items-start gap-4">
                      <div className="space-y-2 flex-1 min-w-0">
                        <h3 className="font-serif-th text-base sm:text-lg font-bold text-ink group-hover:text-gold-ink transition-colors leading-snug line-clamp-2">
                          <Link href={`/blog/${article.slug}`} prefetch={false}>{artTitle}</Link>
                        </h3>
                        <p className="text-xs text-muted font-serif-th leading-relaxed line-clamp-3">
                          {artDesc}
                        </p>
                      </div>

                      {/* 1909 Card Miniature */}
                      <div className="w-14 h-21 sm:w-16 sm:h-24 rounded-lg overflow-hidden border-2 border-line-warm shadow-xs group-hover:scale-105 group-hover:border-gold-ink transition duration-300 bg-inset-warm flex-shrink-0 relative">
                        <CardImage
                          image={cardArt.image}
                          alt=""
                          className="w-full h-full object-cover"
                          sizes="64px"
                          loading={isAboveFold ? "eager" : "lazy"}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer: Tags & Read More */}
                  <div className="pt-3 border-t border-line-warm/30 flex items-center justify-between gap-2 text-xs">
                    {/* ป้ายคีย์เวิร์ดมีเฉพาะภาษาไทย (`keywords` ไม่มีคู่ EN) — ซ่อนบนหน้า `/en/blog`
                        ไม่งั้นจะมีข้อความไทยหลุดไปเป็น 11% ของทั้งหน้าในฉบับภาษาอังกฤษ */}
                    <div className="flex flex-wrap gap-1.5">
                      {!isEnglish &&
                        article.keywords.slice(0, 2).map((kw) => (
                          <span
                            key={kw}
                            className="glass-chip text-[11px] text-muted font-serif-th px-2.5 py-0.5"
                          >
                            #{kw}
                          </span>
                        ))}
                    </div>
                    {/* ♿ R-23: ผู้ใช้ที่ไล่ฟัง "รายการลิงก์" จะได้ยินแค่ชื่อลิงก์เท่านั้น
                        ถ้าทุกการ์ดใช้คำว่า "อ่านต่อ" เหมือนกันหมด จะไม่มีทางรู้ว่าลิงก์ไหนไปไหน
                        `aria-label` จึงต้องมีชื่อบทความอยู่ด้วย ส่วนคนที่มองเห็นยังเห็นคำสั้นเหมือนเดิม */}
                    <Link
                      href={`/blog/${article.slug}`}
                      prefetch={false}
                      aria-label={isEnglish ? `Read Codex: ${artTitle}` : `อ่านต่อ: ${artTitle}`}
                      className="inline-flex items-center gap-1 text-xs text-ink group-hover:text-gold-ink group-hover:translate-x-0.5 transition font-serif-th font-bold flex-shrink-0"
                    >
                      <span>{isEnglish ? "Read Codex" : "อ่านต่อ"}</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
