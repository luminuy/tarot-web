"use client";

import React, { useState, useMemo } from "react";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import type { Article, ArticleSummary } from "@/data/articles";
import {
  getArticleTitle,
  getArticleDescription,
  getArticleCategory,
} from "@/data/article-helpers";
import { soundManager } from "@/lib/utils/audio";
import { CardImage } from "@/components/card/CardImage";
import { SearchTabIcon } from "@/components/ui/TarotArtIcons";
import { useLocale } from "@/lib/i18n";

interface BlogIndexClientProps {
  articles: ArticleSummary[];
}

const CATEGORIES = [
  { id: "all", labelTh: "ทั้งหมด", labelEn: "All Articles" },
  { id: "love", labelTh: "ความรัก & เนื้อคู่", labelEn: "Love & Soulmates" },
  { id: "career", labelTh: "การงาน & การเงิน", labelEn: "Career & Abundance" },
  { id: "spreads", labelTh: "ผังการเปิดไพ่", labelEn: "Tarot Spreads" },
  { id: "cards", labelTh: "ความหมายไพ่", labelEn: "Card Meanings" },
  { id: "wisdom", labelTh: "จิตวิทยา & AI", labelEn: "Psychology & AI" },
];

/**
 * จับคู่บทความกับภาพหน้าไพ่ 1909 Rider-Waite ประจำบทความอย่างวิจิตร
 */
const ARTICLE_CARD_MAP: Record<string, string> = {
  "how-to-read-tarot-for-beginners": "major-01.jpg",
  "tarot-love-reading-guide": "major-06.jpg",
  "tarot-love-3-cards-feelings": "cups-02.jpg",
  "tarot-ex-return-signs": "cups-06.jpg",
  "top-10-soulmate-tarot-cards": "major-06.jpg",
  "tarot-single-timing-love": "cups-01.jpg",
  "tarot-career-change-spread": "major-07.jpg",
  "tarot-job-interview-one-card": "wands-01.jpg",
  "tarot-wealth-money-cards": "pentacles-01.jpg",
  "tarot-business-elements-spread": "major-04.jpg",
  "celtic-cross-spread-guide": "major-10.jpg",
  "tarot-daily-card-guide": "major-19.jpg",
  "tarot-7-chakras-spread": "major-14.jpg",
  "how-to-ask-tarot-questions": "major-02.jpg",
  "the-lovers-card-meaning": "major-06.jpg",
  "the-tower-and-death-meaning": "major-16.jpg",
  "the-fool-journey-meaning": "major-00.jpg",
  "the-wheel-of-fortune-meaning": "major-10.jpg",
  "reversed-tarot-cards-guide": "major-12.jpg",
  "provably-fair-tarot-guide": "major-11.jpg",
  "tarot-and-carl-jung-psychology": "major-09.jpg",
  "ai-tarot-oracle-vs-human-reader": "major-17.jpg",
  "tarot-history-1909-rider-waite": "major-01.jpg",
  "major-arcana-22-cards-complete-guide": "major-21.jpg",
  "minor-arcana-4-suits-guide": "wands-04.jpg",
  "tarot-yes-no-spread-guide": "swords-01.jpg",
};

/* คืนเฉพาะชื่อไฟล์ภาพ — ไม่คืน alt เพราะภาพไพ่ประจำบทความเป็นภาพประกอบล้วน
   หัวข้อบทความที่พิมพ์อยู่ข้าง ๆ ทำหน้าที่บอกชื่อให้แล้ว (INC-0125) */
function getArticleCardArt(article: Article | ArticleSummary): { image: string } {
  const image =
    ARTICLE_CARD_MAP[article.slug] ||
    (article.category === "love"
      ? "major-06.jpg"
      : article.category === "career"
        ? "pentacles-01.jpg"
        : article.category === "spreads"
          ? "major-10.jpg"
          : article.category === "cards"
            ? "major-01.jpg"
            : "major-09.jpg");

  return { image };
}

export const BlogIndexClient: React.FC<BlogIndexClientProps> = ({ articles }) => {
  const { isEnglish, locale } = useLocale();
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
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
            ? "Explore depth psychology, Jungian archetypes, archetypal symbolism, and master guides for love, career, and 25 sacred spreads rooted in the authentic 1909 Rider-Waite lineage."
            : "เจาะลึกศาสตร์ไพ่ทาโรต์ดั้งเดิม 1909 Rider-Waite จิตวิทยาเชิงลึก ปรัชญา คาร์ล ยุง และคู่มือการอ่านไพ่ความรัก การงาน และผังพยากรณ์ทั้ง 25 แบบ โดยวิหาร SeerTarot"}
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
            className="w-full bg-surface border border-line rounded-2xl px-5 py-3.5 pl-11 text-xs sm:text-sm text-ink placeholder:text-muted/70 focus:outline-none focus:border-gold-ink focus:ring-1 focus:ring-gold-ink shadow-[0_2px_8px_rgba(41,38,31,0.03)] transition font-serif-th"
          />
          <SearchTabIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-ink" />
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
                  soundManager.playMenuTapSound();
                  setSelectedCat(cat.id);
                }}
                className={`tap-overlay-y rounded-full px-4 py-1.5 text-xs font-serif-th font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-ink text-canvas border border-ink shadow-xs"
                    : "bg-surface border border-line text-muted hover:border-gold-ink hover:text-gold-ink shadow-2xs"
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
                />
              </div>

              {/* Content */}
              <div className="space-y-3.5 flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-surface border border-line-warm text-[11px] font-serif-th font-bold text-gold-ink shadow-2xs">
                    {isEnglish ? "Featured Codex of the Week" : "บทความแนะนำประจำสัปดาห์"}
                  </span>
                  <span className="text-[11px] font-serif-th text-muted px-2.5 py-0.5 rounded-full bg-surface border border-line-warm/60">
                    {featCat}
                  </span>
                </div>

                <h2 className="font-serif-th text-xl sm:text-2xl lg:text-3xl font-bold text-ink group-hover:text-gold-ink transition-colors leading-snug">
                  <Link href={`/blog/${featured.slug}`}>{featTitle}</Link>
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
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ink hover:bg-gold-ink text-canvas font-semibold text-xs transition font-serif-th shadow-sm group/btn"
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
          <div className="rounded-2xl border border-line-warm bg-surface p-12 text-center space-y-3 shadow-xs">
            
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
            {filtered.map((article) => {
              const cardArt = getArticleCardArt(article);
              const artTitle = getArticleTitle(article, locale);
              const artDesc = getArticleDescription(article, locale);
              const artCat = getArticleCategory(article, locale);
              const readTime = isEnglish
                ? article.readTime.replace("นาที", "min read")
                : article.readTime;

              return (
                <article
                  key={article.slug}
                  className="rounded-2xl border border-line-warm bg-gradient-to-b from-surface via-surface-warm to-[#F7F3EB] p-5 sm:p-6 space-y-4 hover:border-gold-ink transition duration-300 flex flex-col justify-between group shadow-[0_2px_12px_rgba(41,38,31,0.04)] hover:shadow-[0_10px_28px_rgba(143,92,26,0.10)] relative overflow-hidden"
                >
                  <div className="space-y-3.5">
                    {/* Header: Category & Read Time */}
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-line-warm/40">
                      <span className="text-[11px] font-serif-th font-bold text-gold-ink px-2.5 py-0.5 rounded-full bg-surface border border-line-warm/70 shadow-2xs">
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
                            className="text-[11px] text-muted font-serif-th bg-surface px-2.5 py-0.5 rounded-full border border-line-warm/60"
                          >
                            #{kw}
                          </span>
                        ))}
                    </div>
                    <Link
                      href={`/blog/${article.slug}`}
                      prefetch={false}
                      className="inline-flex items-center gap-1 text-xs text-ink group-hover:text-gold-ink group-hover:translate-x-0.5 transition font-serif-th font-bold flex-shrink-0"
                    >
                      <span>{isEnglish ? "Read Codex" : "อ่านต่อ"}</span>
                      <span>→</span>
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
