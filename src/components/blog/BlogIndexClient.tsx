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
import { Ui2PageHero } from "@/components/ui2/Ui2PageHero";
import { Ui2Showcase, type Ui2ShowcaseSection } from "@/components/ui2/Ui2Showcase";

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

/** หมวดบทความ = หน้าต่างโชว์เคส (สีหมวด · คำอังกฤษเอียง) — เจ้าของ 2026-10-17 "ทำแบบหน้าแรกกับหน้าผัง" */
const CATEGORIES = [
  { id: "love", labelTh: "ความรัก & เนื้อคู่", labelEn: "Love & Soulmates", kicker: "Love", kickerTh: "ความรัก", tone: 3, leadTh: "ใจเขา ใจเรา คนคุย แฟนเก่า และวิธีอ่านไพ่ความรักให้ตรง", leadEn: "Their feelings, yours, exes and reading love spreads well" },
  { id: "career", labelTh: "การงาน & การเงิน", labelEn: "Career & Abundance", kicker: "Work · Money", kickerTh: "งาน · เงิน", tone: 1, leadTh: "งาน เงิน การตัดสินใจ และจังหวะชีวิตที่จับต้องได้", leadEn: "Work, money, decisions and the timing of real life" },
  { id: "spreads", labelTh: "ผังการเปิดไพ่", labelEn: "Tarot Spreads", kicker: "Spreads", kickerTh: "ผังไพ่", tone: 4, leadTh: "เลือกผังให้ตรงคำถาม และอ่านแต่ละตำแหน่งให้เป็น", leadEn: "Pick the right spread and read every position" },
  { id: "cards", labelTh: "ความหมายไพ่", labelEn: "Card Meanings", kicker: "Card Meanings", kickerTh: "ความหมายไพ่", tone: 2, leadTh: "เจาะไพ่รายใบและรายชุด ภาพ สัญลักษณ์ และเรื่องเล่าเบื้องหลัง", leadEn: "Cards and suits in depth: imagery, symbols and their stories" },
  { id: "wisdom", labelTh: "จิตวิทยา & AI", labelEn: "Psychology & AI", kicker: "Wisdom", kickerTh: "จิตวิทยา", tone: 5, leadTh: "ไพ่กับจิตวิทยาเชิงลึก ความเชื่อ และการอ่านไพ่ร่วมกับ AI", leadEn: "Tarot, depth psychology, belief and reading with AI" },
] as const;

/** ไพ่ลอยรอบหัวข้อ (ตกแต่ง · ไม่ใช่ผลสุ่ม) */
const HERO_CARDS = ["major-06", "major-02", "major-17", "major-09", "cups-02", "major-21"] as const;

export const BlogIndexClient: React.FC<BlogIndexClientProps> = ({ articles }) => {
  const { isEnglish, locale } = useLocale();
  const [searchQuery, setSearchQuery] = useState<string>("");
  /** 📱 มือถือ: หมวดที่กดดูครบแล้ว (ปกติโชว์ 3 เรื่องแรกต่อหมวด · ที่เหลืออยู่ใน HTML ครบ ซ่อนด้วย CSS เท่านั้น) */
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());

  const q = searchQuery.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return articles;
    return articles.filter((a) => {
      const titleEn = getArticleTitle(a, "en").toLowerCase();
      const descEn = getArticleDescription(a, "en").toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        titleEn.includes(q) ||
        descEn.includes(q) ||
        a.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [articles, q]);

  const featured = articles[0];
  const showCover = !q && !!featured;
  const readTimeOf = (a: BlogCardItem) => (isEnglish ? a.readTime.replace("นาที", "min read") : a.readTime);
  let artIndex = 0;

  const row = (article: BlogCardItem) => {
    const art = getArticleCardArt(article);
    const title = getArticleTitle(article, locale);
    const i = artIndex++;
    return (
      <article key={article.slug} className="v3-at">
        <span className="v3-at-art" aria-hidden="true">
          <CardImage image={art.image} alt="" sizes="96px" loading={i < 4 ? "eager" : "lazy"} />
        </span>
        <div className="v3-at-body">
          <h3 className="v3-at-title">
            <ThaiPhrases>
              <Link href={`/blog/${article.slug}`} prefetch={false}>
                {title}
              </Link>
            </ThaiPhrases>
          </h3>
          <p className="v3-at-desc">{getArticleDescription(article, locale)}</p>
          <p className="v3-at-meta">{isEnglish ? `${readTimeOf(article)}` : `อ่าน ${readTimeOf(article)}`}</p>
        </div>
      </article>
    );
  };

  const sections: Ui2ShowcaseSection[] = CATEGORIES.map((cat) => {
    const all = articles.filter((a) => a.category === cat.id && !(showCover && a.slug === featured.slug));
    const list = filtered.filter((a) => a.category === cat.id && !(showCover && a.slug === featured.slug));
    const clipped = !q && !expanded.has(cat.id) && list.length > 3;
    return {
      id: `cat-${cat.id}`,
      kicker: isEnglish ? cat.kicker : cat.kickerTh,
      title: isEnglish ? cat.labelEn : cat.labelTh,
      tone: cat.tone,
      count: q ? list.length : all.length,
      hidden: list.length === 0,
      lead: <ThaiPhrases>{isEnglish ? cat.leadEn : cat.leadTh}</ThaiPhrases>,
      meta: q
        ? isEnglish
          ? `${list.length} matching articles`
          : `ตรงคำค้น ${list.length} เรื่อง`
        : isEnglish
          ? `${all.length} articles`
          : `${all.length} บทความ`,
      children: (
        <>
          <div className={`v3-at-grid${clipped ? " is-clipped" : ""}`}>{list.map(row)}</div>
          {clipped && (
            <p className="v3-at-more">
              <button type="button" onClick={() => setExpanded((prev) => new Set(prev).add(cat.id))}>
                {isEnglish ? `Show all ${list.length}` : `ดูอีก ${list.length - 3} เรื่อง`}
              </button>
            </p>
          )}
        </>
      ),
    };
  });

  return (
    <div className="v3-bl">
      <Ui2PageHero
        crumbs={[{ label: isEnglish ? "Home" : "หน้าแรก", href: "/" }, { label: isEnglish ? "Articles" : "บทความ" }]}
        title={isEnglish ? "Tarot Wisdom Codex & Divination Essays" : "คัมภีร์บทความ ดูดวงไพ่ยิปซี ทาโรต์ 1909"}
        accent={isEnglish ? "Tarot Wisdom Codex" : "คัมภีร์บทความ"}
        lede={
          <ThaiPhrases>
            {isEnglish
              ? "Depth psychology, symbolism, and practical guides for love, career and all 26 spreads."
              : "เจาะลึกศาสตร์ไพ่ทาโรต์ดั้งเดิม จิตวิทยาเชิงลึก และคู่มือการอ่านไพ่ความรัก การงาน และผังพยากรณ์ทั้ง 26 แบบ"}
          </ThaiPhrases>
        }
        trust={[
          isEnglish ? `${articles.length} articles` : `รวม ${articles.length} บทความ`,
          isEnglish ? "Rooted in the 1909 Rider-Waite deck" : "อ้างอิงไพ่ต้นฉบับ 1909 Rider-Waite",
        ]}
        cards={HERO_CARDS}
      >
        <label className="v3-bl-search">
          <SearchIcon className="v3-bl-search-ic" />
          <input
            aria-label={isEnglish ? "Search articles" : "ค้นหาบทความ"}
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isEnglish ? "Search articles or card meanings" : "ค้นหาบทความ หรือความหมายไพ่"}
          />
        </label>
      </Ui2PageHero>

      <Ui2Showcase
        label={isEnglish ? "Articles by topic" : "บทความแยกตามหมวด"}
        sections={sections}
        before={
          <>
            {showCover && featured && (
              (() => {
                const art = getArticleCardArt(featured);
                return (
                  <article className="v3-bl-cover" aria-label={isEnglish ? "Cover story" : "เรื่องจากปก"}>
                    <span className="v3-bl-cover-art" aria-hidden="true">
                      <CardImage image={art.image} alt="" sizes="(min-width: 1024px) 220px, 150px" loading="eager" fetchPriority="high" />
                    </span>
                    <div className="v3-bl-cover-body">
                      <p className="v3-bl-cover-k">
                        <span className="ui2-accent">{isEnglish ? "Cover story" : "เรื่องจากปก"}</span>
                        <span>{getArticleCategory(featured, locale)}</span>
                      </p>
                      <h2 className="v3-bl-cover-title">
                        <ThaiPhrases>
                          <Link href={`/blog/${featured.slug}`} prefetch={false}>
                            {getArticleTitle(featured, locale)}
                          </Link>
                        </ThaiPhrases>
                      </h2>
                      <p className="v3-bl-cover-desc">{getArticleDescription(featured, locale)}</p>
                      <p className="v3-at-meta">{isEnglish ? `Reading time ${readTimeOf(featured)}` : `เวลาอ่าน ${readTimeOf(featured)}`}</p>
                    </div>
                  </article>
                );
              })()
            )}
            {q && (
              <div className="v3-bl-status" role="status">
                <p>
                  {isEnglish ? (
                    <>
                      <b>{filtered.length}</b> articles match
                    </>
                  ) : (
                    <>
                      พบ <b>{filtered.length}</b> บทความ
                    </>
                  )}
                </p>
                <button type="button" onClick={() => setSearchQuery("")}>
                  {isEnglish ? "Clear search" : "ล้างคำค้น"}
                </button>
                {filtered.length === 0 && (
                  <p className="v3-bl-empty">
                    {isEnglish ? `No articles found matching "${searchQuery}"` : `ไม่พบบทความที่ตรงกับ "${searchQuery}"`}
                  </p>
                )}
              </div>
            )}
          </>
        }
      />
    </div>
  );
};
