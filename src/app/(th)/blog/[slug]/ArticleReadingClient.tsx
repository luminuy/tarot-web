"use client";

import React, { useState, useEffect } from "react";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import type { Article } from "@/data/articles";
import {
  getArticleTitle,
  getArticleDescription,
  getArticleCategory,
  getArticleAuthor,
} from "@/data/article-helpers";
import { soundManager } from "@/lib/utils/audio";
import { trackEvent } from "@/lib/analytics";
import { COUNTS } from "@/components/layout/nav-links";
import { useLocale } from "@/lib/i18n";

interface Props {
  article: Article;
  relatedArticles: Article[];
}

export const ArticleReadingClient: React.FC<Props> = ({ article, relatedArticles }) => {
  const { isEnglish, locale } = useLocale();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    trackEvent("blog_read", {
      slug: article.slug,
      title: article.title,
      category: article.category,
    });
  }, [article.slug, article.title, article.category]);

  const handleCopyLink = () => {
    soundManager.playMenuTapSound();
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const articleTitle = getArticleTitle(article, locale);
  const articleDesc = getArticleDescription(article, locale);
  const articleCat = getArticleCategory(article, locale);
  const articleAuthor = getArticleAuthor(article, locale);
  const readTimeFormatted = isEnglish
    ? article.readTime.replace("นาที", "min read")
    : article.readTime;

  const effectiveContent = isEnglish && article.contentEn ? article.contentEn : article.content;
  const effectiveToc = isEnglish && article.tocEn && article.tocEn.length > 0 ? article.tocEn : article.toc;
  const effectiveFaqs = isEnglish && article.faqsEn && article.faqsEn.length > 0 ? article.faqsEn : article.faqs;

  return (
    <div className="space-y-10">
      {/* Top Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs font-serif-th text-muted border-b border-line/40 pb-4 overflow-x-auto whitespace-nowrap"
      >
        <Link href="/" className="hover:text-gold transition-colors">
          {isEnglish ? "Home" : "หน้าแรก"}
        </Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-gold transition-colors">
          {isEnglish ? "Wisdom Codex" : "คัมภีร์บทความ"}
        </Link>
        <span>/</span>
        <span className="text-ink truncate font-bold">{articleCat}</span>
      </nav>

      {/* Article Header */}
      <header className="space-y-4 text-center sm:text-left">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-xs font-mono">
          <span className="px-3 py-1 rounded-full bg-inset border border-line text-gold font-bold">
            {articleCat}
          </span>
          <span className="text-muted">
            {isEnglish ? `⏱ ${readTimeFormatted}` : `⏱ เวลาอ่าน ${article.readTime}`}
          </span>
          <span className="text-muted">·</span>
          <span className="text-muted">
            {isEnglish ? `By ${articleAuthor}` : `โดย ${article.author}`}
          </span>
        </div>

        <h1 className="font-serif-th text-2xl sm:text-4xl font-bold text-ink leading-snug sm:leading-normal py-0.5 [text-wrap:balance]">
          {articleTitle}
        </h1>

        <p className="text-sm sm:text-base text-ink font-serif-th leading-relaxed border-l-2 border-line pl-4 py-1 italic bg-surface rounded-r-xl shadow-xs [text-wrap:pretty]">
          {articleDesc}
        </p>
      </header>

      {/* Table of Contents (TOC) */}
      {effectiveToc && effectiveToc.length > 0 && (
        <div className="rounded-xl border border-line bg-surface p-5 sm:p-6 space-y-3 shadow-[0_10px_30px_rgba(42,38,31,0.06)]">
          <div className="flex items-center gap-2 text-xs font-serif-th font-bold text-ink">
            
            {isEnglish
              ? "Table of Contents (Wisdom Codex)"
              : "สารบัญคัมภีร์ความรู้ (Table of Contents)"}
          </div>
          <ul className="space-y-2 text-xs sm:text-sm font-serif-th text-ink">
            {effectiveToc.map((item, idx) => (
              <li key={item.id} className="flex items-start gap-2">
                <span className="text-gold-ink font-mono text-xs font-bold">{idx + 1}.</span>
                <a href={`#${item.id}`} className="hover:text-gold hover:underline transition-colors">
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Target Card Highlight Box if available */}
      {article.targetCardId && article.cardNameTh && (
        <div className="rounded-xl border border-line bg-surface p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_10px_30px_rgba(42,38,31,0.06)]">
          <div className="space-y-1 text-center sm:text-left">
            <div className="text-[13px] font-mono text-gold-ink font-bold">
              {isEnglish ? "Explore this card in the 78-Card Encyclopedia" : "สำรวจไพ่ใบนี้ในสารานุกรม 78 ใบ"}
            </div>
            <div className="font-serif-th font-bold text-base text-ink">
              {isEnglish
                ? `Card: ${article.targetCardId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} (1909 Rider-Waite)`
                : `ไพ่ ${article.cardNameTh} (1909 Rider-Waite)`}
            </div>
            <p className="text-xs text-muted font-serif-th">
              {isEnglish
                ? "View full 1909 artwork, 5-dimensional archetypal interpretations, and spread positions."
                : "ดูภาพขยาย 1909 ความหมายลึกซึ้ง 5 ด้าน และตำแหน่งในผังพยากรณ์"}
            </p>
          </div>
          <Link
            href={`/cards/${article.targetCardId}`}
            className="shrink-0 px-4 py-2 rounded-full border border-line bg-inset hover:bg-surface text-ink hover:text-gold-ink text-xs font-serif-th font-bold transition shadow-xs"
          >
            {isEnglish ? "View 78-Card Details →" : "เปิดดูรายละเอียดไพ่ 78 ใบ →"}
          </Link>
        </div>
      )}

      {/* Main Content Body */}
      <article className="prose prose-stone max-w-none font-serif-th text-xs sm:text-sm leading-relaxed text-ink space-y-6">
        <div
          dangerouslySetInnerHTML={{
            __html: effectiveContent
              .replace(
                /## (.*?)\n/g,
                '<h2 class="text-lg sm:text-2xl font-bold text-ink mt-8 mb-4 border-b border-line/40 pb-2">$1</h2>'
              )
              .replace(/### (.*?)\n/g, '<h3 class="text-base sm:text-xl font-bold text-ink mt-6 mb-3">$1</h3>')
              .replace(/\*\*(.*?)\*\*/g, '<strong class="text-ink font-semibold">$1</strong>')
              .replace(/\*(.*?)\*/g, '<em class="text-gold font-medium">$1</em>')
              .replace(/- (.*?)\n/g, '<li class="ml-4 list-disc text-ink my-1">$1</li>')
              .replace(/\n\n/g, '<p class="my-4 leading-relaxed text-ink"></p>')
              .replace(/---/g, '<hr class="border-line/40 my-6" />'),
          }}
        />
      </article>

      {/* FAQ Section with Accordion */}
      {effectiveFaqs && effectiveFaqs.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-line/40">
          <h2 className="flex items-center gap-2 text-sm sm:text-base font-serif-th font-bold text-ink">
            
            {isEnglish ? "Frequently Asked Questions (FAQ)" : "คำถามที่พบบ่อย (FAQ)"}
          </h2>
          {/* ใช้ <details> ของเบราว์เซอร์ เพื่อให้ "คำตอบ" อยู่ใน HTML ตั้งแต่ฝั่งเซิร์ฟเวอร์เสมอ
              หน้านี้ประกาศ FAQPage JSON-LD ที่มีทั้งคำถามและคำตอบไว้ ถ้าคำตอบโผล่เฉพาะตอนคลิก
              จะกลายเป็น structured data ที่อ้างถึงข้อความซึ่งไม่มีอยู่บนหน้า */}
          <div className="space-y-3">
            {effectiveFaqs.map((faq, idx) => (
              <details
                key={idx}
                className="group rounded-xl border border-line bg-surface overflow-hidden transition shadow-xs"
              >
                <summary className="w-full flex items-center justify-between p-4 text-left font-serif-th text-xs sm:text-sm font-semibold text-ink hover:text-gold-ink transition-colors gap-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span>{faq.question}</span>
                  <span
                    aria-hidden="true"
                    className="text-gold-ink font-mono text-sm font-bold transition-transform duration-300 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <div className="p-4 pt-0 text-xs font-serif-th text-ink leading-relaxed border-t border-line/40 bg-inset">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* High-Impact Interactive CTA Box */}
      <div className="rounded-xl border border-line bg-surface p-6 sm:p-8 text-center space-y-4 relative overflow-hidden shadow-[0_10px_30px_rgba(42,38,31,0.06)]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-line bg-inset text-[13px] text-gold-ink font-mono font-bold">
          {isEnglish ? "Interactive Provably-Fair Divination" : "Interactive Provably-Fair Reading"}
        </div>
        <h2 className="font-serif-th text-xl sm:text-3xl font-bold text-ink">
          {isEnglish
            ? "Ready to Reveal the Hidden Wisdom of Your Path?"
            : "พร้อมเปิดไพ่รับคำตอบสำหรับชีวิตคุณหรือยัง?"}
        </h2>
        <p className="text-xs sm:text-sm text-muted font-serif-th max-w-lg mx-auto leading-relaxed">
          {isEnglish
            ? "Experience 3D tactile card shuffling and draw with free will from the complete 78-card Rider-Waite deck, illuminated by provably-fair cryptography and deep archetypal guidance 24/7."
            : "สัมผัสประสบการณ์สับไพ่และเลือกหยิบไพ่ 78 ใบด้วยตัวคุณเองแบบ 3D พร้อมรับคำพยากรณ์เจาะลึกจากแม่หมอ AI ตลอด 24 ชั่วโมง"}
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-ink hover:bg-gold text-canvas font-bold text-sm hover:scale-[1.02] transition font-serif-th cursor-pointer shadow-sm"
          >
            <span>{isEnglish ? "Begin Free Tarot Reading Now" : "เปิดไพ่ทำนายดวงชะตาฟรีทันที"}</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* Share / Copy Link Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-line/40 text-xs font-serif-th">
        <div className="flex items-center gap-2 text-muted">
          <span>{isEnglish ? "Share this codex:" : "แชร์คัมภีร์นี้:"}</span>
          <button
            onClick={handleCopyLink}
            className="px-3.5 py-1.5 rounded-full border border-line bg-surface text-ink hover:border-gold hover:text-gold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            
            <span>
              {copied
                ? isEnglish
                  ? "Link Copied!"
                  : "คัดลอกลิงก์สำเร็จ!"
                : isEnglish
                  ? "Copy Link"
                  : "คัดลอกลิงก์"}
            </span>
          </button>
        </div>
        <Link href="/blog" className="text-gold hover:underline font-bold">
          {isEnglish
            ? `← Back to Wisdom Codex (${COUNTS.articles} articles)`
            : `← กลับสู่คัมภีร์ทั้งหมด (${COUNTS.articles} บทความ)`}
        </Link>
      </div>

      {/* Related Articles Carousel/Grid */}
      {relatedArticles.length > 0 && (
        <section className="space-y-4 pt-4">
          <h2 className="font-serif-th text-lg sm:text-xl font-bold text-ink">
            {isEnglish ? "Resonant & Related Articles" : "คัมภีร์บทความที่เกี่ยวข้อง"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedArticles.map((rel) => {
              const relTitle = getArticleTitle(rel, locale);
              const relCat = getArticleCategory(rel, locale);
              const relReadTime = isEnglish
                ? rel.readTime.replace("นาที", "min read")
                : rel.readTime;

              return (
                <Link
                  key={rel.slug}
                  href={`/blog/${rel.slug}`}
                  className="rounded-xl border border-line bg-surface p-4 space-y-2 hover:border-gold transition group flex flex-col justify-between shadow-[0_10px_30px_rgba(42,38,31,0.04)]"
                >
                  <div className="space-y-1.5">
                    <div className="text-[13px] font-mono text-gold-ink font-bold">{relCat}</div>
                    <h3 className="font-serif-th text-xs sm:text-sm font-bold text-ink group-hover:text-gold-ink transition-colors line-clamp-2">
                      {relTitle}
                    </h3>
                  </div>
                  <div className="text-[13px] text-muted font-mono pt-2 border-t border-line/40">
                    ⏱ {relReadTime}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
