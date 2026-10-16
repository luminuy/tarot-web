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
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { Ui2Crumbs } from "@/components/ui2/Ui2PageHero";

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
  /** 📱 มือถือโชว์ 8 เรื่องแรกก่อน (เดิม 30 เรื่องยาว ~9,000px) — ที่เหลือยังอยู่ใน HTML ครบ ซ่อนด้วย CSS เท่านั้น */
  const [showAllOnMobile, setShowAllOnMobile] = useState(false);

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
  const previewOnMobile = !showAllOnMobile && selectedCat === "all" && !searchQuery.trim();

  const featured = articles[0];
  const isFront = selectedCat === "all" && !searchQuery.trim() && !!featured;
  /* หน้าแรกของนิตยสาร: เรื่องจากปก 1 + เรื่องรอง 3 · ที่เหลือลงกริด (ไม่ซ้ำกัน) */
  const sideStories = isFront ? articles.slice(1, 4) : [];
  const shownOnFront = new Set([featured?.slug, ...sideStories.map((a) => a.slug)]);
  const gridItems = isFront ? filtered.filter((a) => !shownOnFront.has(a.slug)) : filtered;
  const readTimeOf = (a: BlogCardItem) => (isEnglish ? a.readTime.replace("นาที", "min read") : a.readTime);

  /*
   * v2 (เจ้าของ 2026-10-16 "สร้างใหม่เลย") — นิตยสารดูดวง
   * หัวนิตยสาร (masthead) ➔ แถบหมวดแบบแท็บนิตยสาร + ช่องค้นหา ➔ เรื่องจากปกใหญ่ + เรื่องรอง 3 เรื่องเรียงเลข
   * ➔ กริดบทความ 3 คอลัมน์ ภาพไพ่เป็นแถบหัวการ์ด (v1 การ์ดตัวหนังสือแน่น ภาพไพ่จิ๋ว 64px)
   */
  return (
    <div className="v2-bl">
      <header className="v2-bl-mast">
        <Ui2Crumbs crumbs={[{ label: isEnglish ? "Home" : "หน้าแรก", href: "/" }, { label: isEnglish ? "Articles" : "บทความ" }]} />
        <h1 className="v2-bl-title">
          {isEnglish ? (
            <>
              <span className="ui2-gold-night">Tarot Wisdom Codex</span> &amp; Divination Essays
            </>
          ) : (
            <>
              <span className="tp ui2-gold-night">คัมภีร์บทความ</span>
              <span className="tp">ดูดวงไพ่ยิปซี ทาโรต์ 1909</span>
            </>
          )}
        </h1>
        <p className="v2-bl-issue">
          <span>{isEnglish ? `${articles.length} articles` : `รวม ${articles.length} บทความ`}</span>
          <span aria-hidden="true" className="v2-bl-dot" />
          <span>{isEnglish ? "Rooted in the 1909 Rider-Waite deck" : "อ้างอิงไพ่ต้นฉบับ 1909 Rider-Waite"}</span>
        </p>
        <p className="v2-bl-lede">
          <ThaiPhrases>
            {isEnglish
              ? "Depth psychology, Jungian archetypes, symbolism, and practical guides for love, career, and 26 spreads."
              : "เจาะลึกศาสตร์ไพ่ทาโรต์ดั้งเดิม จิตวิทยาเชิงลึก และคู่มือการอ่านไพ่ความรัก การงาน และผังพยากรณ์ทั้ง 26 แบบ"}
          </ThaiPhrases>
        </p>
      </header>

      {/* แถบหมวด + ค้นหา */}
      <div className="v2-bl-nav">
        <div className="v2-bl-tabs" role="group" aria-label={isEnglish ? "Article categories" : "หมวดบทความ"}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              aria-pressed={selectedCat === cat.id}
              onClick={() => {
                import("@/lib/utils/audio")
                  .then(({ soundManager }) => soundManager.playMenuTapSound())
                  .catch(() => {});
                setSelectedCat(cat.id);
              }}
              className="v2-bl-tab"
            >
              {cat.id === "all" ? (isEnglish ? "All" : "ทั้งหมด") : isEnglish ? cat.labelEn : cat.labelTh}
            </button>
          ))}
        </div>
        <label className="v2-bl-search">
          <SearchIcon className="v2-bl-search-ic" />
          <input
            aria-label={isEnglish ? "Search articles" : "ค้นหาบทความ"}
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isEnglish ? "Search articles or card meanings" : "ค้นหาบทความ หรือความหมายไพ่"}
          />
        </label>
      </div>

      {isFront && featured && (
        <section className="v2-bl-front" aria-label={isEnglish ? "Featured articles" : "บทความแนะนำ"}>
          {(() => {
            const art = getArticleCardArt(featured);
            return (
              <article className="v2-bl-cover">
                <span className="v2-bl-cover-art" aria-hidden="true">
                  <CardImage image={art.image} alt="" sizes="(min-width: 1024px) 220px, 140px" loading="eager" fetchPriority="high" />
                </span>
                <div className="v2-bl-cover-body">
                  <p className="v2-bl-kicker">
                    {isEnglish ? "Cover story" : "เรื่องจากปก"} <span>{getArticleCategory(featured, locale)}</span>
                  </p>
                  <h2 className="v2-bl-cover-title">
                    <ThaiPhrases>
                      <Link href={`/blog/${featured.slug}`} prefetch={false}>
                        {getArticleTitle(featured, locale)}
                      </Link>
                    </ThaiPhrases>
                  </h2>
                  <p className="v2-bl-cover-desc">{getArticleDescription(featured, locale)}</p>
                  <p className="v2-bl-meta">
                    {isEnglish ? `Reading time ${readTimeOf(featured)}` : `เวลาอ่าน ${readTimeOf(featured)}`}
                  </p>
                </div>
              </article>
            );
          })()}
          <ol className="v2-bl-side">
            {sideStories.map((a, i) => (
              <li key={a.slug}>
                <span className="v2-bl-side-n" aria-hidden="true">
                  {String(i + 2).padStart(2, "0")}
                </span>
                <div>
                  <p className="v2-bl-kicker">{getArticleCategory(a, locale)}</p>
                  <h3>
                    <ThaiPhrases>
                      <Link href={`/blog/${a.slug}`} prefetch={false}>
                        {getArticleTitle(a, locale)}
                      </Link>
                    </ThaiPhrases>
                  </h3>
                  <p className="v2-bl-meta">{readTimeOf(a)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="v2-bl-all" aria-labelledby="bl-all-h">
        <div className="v2-bl-all-h">
          <h2 id="bl-all-h">
            {isFront ? (isEnglish ? "More to read" : "อ่านต่อ") : isEnglish ? `Found ${filtered.length} articles` : `พบบทความ ${filtered.length} เรื่อง`}
          </h2>
          {(selectedCat !== "all" || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedCat("all");
                setSearchQuery("");
              }}
            >
              {isEnglish ? "Show All" : "แสดงทั้งหมด"}
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <p className="v2-bl-empty">
            {isEnglish ? `No articles found matching "${searchQuery}"` : `ไม่พบบทความที่ตรงกับคำค้นหา “${searchQuery}”`}
          </p>
        ) : (
          <div className={`v2-bl-grid${previewOnMobile ? " mobile-preview-8" : ""}`}>
            {gridItems.map((article, idx) => {
              const cardArt = getArticleCardArt(article);
              const artTitle = getArticleTitle(article, locale);
              return (
                <article key={article.slug} className="v2-bl-card">
                  <span className="v2-bl-card-art" aria-hidden="true">
                    <CardImage image={cardArt.image} alt="" sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 92vw" loading={idx < 3 ? "eager" : "lazy"} />
                  </span>
                  <div className="v2-bl-card-body">
                    <p className="v2-bl-kicker">
                      {getArticleCategory(article, locale)} <span>{readTimeOf(article)}</span>
                    </p>
                    <h3>
                      <ThaiPhrases>
                        <Link href={`/blog/${article.slug}`} prefetch={false}>
                          {artTitle}
                        </Link>
                      </ThaiPhrases>
                    </h3>
                    <p className="v2-bl-card-desc">{getArticleDescription(article, locale)}</p>
                    {/* ♿ R-23: ชื่อลิงก์ต้องมีชื่อบทความ (ไม่ใช่คำสั้นคำเดียวกันทุกการ์ด) */}
                    <Link
                      href={`/blog/${article.slug}`}
                      prefetch={false}
                      aria-label={isEnglish ? `Read Codex: ${artTitle}` : `อ่านต่อ: ${artTitle}`}
                      className="v2-bl-more"
                    >
                      {isEnglish ? "Read Codex" : "อ่านต่อ"}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        {previewOnMobile && filtered.length > 8 && (
          <div className="v2-bl-moreall">
            <button type="button" onClick={() => setShowAllOnMobile(true)} className="ui2-btn-ghost">
              {isEnglish ? `Show all ${filtered.length} articles` : `ดูบทความทั้งหมด ${filtered.length} เรื่อง`}
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
