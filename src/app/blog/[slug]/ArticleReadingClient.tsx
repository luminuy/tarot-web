"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import type { Article } from "@/data/articles";
import {
  getArticleTitle,
  getArticleDescription,
  getArticleCategory,
  getArticleAuthor,
} from "@/data/articles";
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

  return (
    <div className="space-y-10">
      {/* Top Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs font-serif-th text-[#635B4E] border-b border-[#D5CEC2]/40 pb-4 overflow-x-auto whitespace-nowrap"
      >
        <Link href="/" className="hover:text-[#A58A5C] transition-colors">
          {isEnglish ? "Home" : "หน้าแรก"}
        </Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-[#A58A5C] transition-colors">
          {isEnglish ? "Wisdom Codex" : "คัมภีร์บทความ"}
        </Link>
        <span>/</span>
        <span className="text-[#29261F] truncate font-bold">{articleCat}</span>
      </nav>

      {/* Article Header */}
      <header className="space-y-4 text-center sm:text-left">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-xs font-mono">
          <span className="px-3 py-1 rounded-full bg-[#EAE7E0] border border-[#D5CEC2] text-[#A58A5C] font-bold">
            {articleCat}
          </span>
          <span className="text-[#635B4E]">
            {isEnglish ? `⏱ ${readTimeFormatted}` : `⏱ เวลาอ่าน ${article.readTime}`}
          </span>
          <span className="text-[#635B4E]">·</span>
          <span className="text-[#635B4E]">
            {isEnglish ? `By ${articleAuthor}` : `โดย ${article.author}`}
          </span>
        </div>

        <h1 className="font-serif-th text-2xl sm:text-4xl font-bold text-[#29261F] leading-snug sm:leading-normal py-0.5 [text-wrap:balance]">
          {articleTitle}
        </h1>

        <p className="text-sm sm:text-base text-[#29261F] font-serif-th leading-relaxed border-l-2 border-[#D5CEC2] pl-4 py-1 italic bg-[#FFFFFF] rounded-r-xl shadow-xs [text-wrap:pretty]">
          {articleDesc}
        </p>
      </header>

      {/* Table of Contents (TOC) */}
      {article.toc && article.toc.length > 0 && (
        <div className="rounded-xl border border-[#D5CEC2] bg-[#FFFFFF] p-5 sm:p-6 space-y-3 shadow-[0_10px_30px_rgba(42,38,31,0.06)]">
          <div className="flex items-center gap-2 text-xs font-serif-th font-bold text-[#29261F]">
            
            {isEnglish
              ? "Table of Contents (Wisdom Codex)"
              : "สารบัญคัมภีร์ความรู้ (Table of Contents)"}
          </div>
          <ul className="space-y-2 text-xs sm:text-sm font-serif-th text-[#29261F]">
            {article.toc.map((item, idx) => (
              <li key={item.id} className="flex items-start gap-2">
                <span className="text-[#A58A5C] font-mono text-xs font-bold">{idx + 1}.</span>
                <a href={`#${item.id}`} className="hover:text-[#A58A5C] hover:underline transition-colors">
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Target Card Highlight Box if available */}
      {article.targetCardId && article.cardNameTh && (
        <div className="rounded-xl border border-[#D5CEC2] bg-[#FFFFFF] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_10px_30px_rgba(42,38,31,0.06)]">
          <div className="space-y-1 text-center sm:text-left">
            <div className="text-[13px] font-mono text-[#A58A5C] font-bold">
              {isEnglish ? "Explore this card in the 78-Card Encyclopedia" : "สำรวจไพ่ใบนี้ในสารานุกรม 78 ใบ"}
            </div>
            <div className="font-serif-th font-bold text-base text-[#29261F]">
              {isEnglish
                ? `Card: ${article.targetCardId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} (1909 Rider-Waite)`
                : `ไพ่ ${article.cardNameTh} (1909 Rider-Waite)`}
            </div>
            <p className="text-xs text-[#635B4E] font-serif-th">
              {isEnglish
                ? "View full 1909 artwork, 5-dimensional archetypal interpretations, and spread positions."
                : "ดูภาพขยาย 1909 ความหมายลึกซึ้ง 5 ด้าน และตำแหน่งในผังพยากรณ์"}
            </p>
          </div>
          <Link
            href={`/cards/${article.targetCardId}`}
            className="shrink-0 px-4 py-2 rounded-full border border-[#D5CEC2] bg-[#EAE7E0] hover:bg-[#FFFFFF] text-[#29261F] hover:text-[#A58A5C] text-xs font-serif-th font-bold transition-all shadow-xs"
          >
            {isEnglish ? "View 78-Card Details →" : "เปิดดูรายละเอียดไพ่ 78 ใบ →"}
          </Link>
        </div>
      )}

      {/* Main Content Body */}
      <article className="prose prose-stone max-w-none font-serif-th text-xs sm:text-sm leading-relaxed text-[#29261F] space-y-6">
        <div
          dangerouslySetInnerHTML={{
            __html: article.content
              .replace(
                /## (.*?)\n/g,
                '<h2 class="text-lg sm:text-2xl font-bold text-[#29261F] mt-8 mb-4 border-b border-[#D5CEC2]/40 pb-2">$1</h2>'
              )
              .replace(/### (.*?)\n/g, '<h3 class="text-base sm:text-xl font-bold text-[#29261F] mt-6 mb-3">$1</h3>')
              .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#29261F] font-semibold">$1</strong>')
              .replace(/\*(.*?)\*/g, '<em class="text-[#A58A5C] font-medium">$1</em>')
              .replace(/- (.*?)\n/g, '<li class="ml-4 list-disc text-[#29261F] my-1">$1</li>')
              .replace(/\n\n/g, '<p class="my-4 leading-relaxed text-[#29261F]"></p>')
              .replace(/---/g, '<hr class="border-[#D5CEC2]/40 my-6" />'),
          }}
        />
      </article>

      {/* FAQ Section with Accordion */}
      {article.faqs && article.faqs.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-[#D5CEC2]/40">
          <h2 className="flex items-center gap-2 text-sm sm:text-base font-serif-th font-bold text-[#29261F]">
            
            {isEnglish ? "Frequently Asked Questions (FAQ)" : "คำถามที่พบบ่อย (FAQ)"}
          </h2>
          {/* ใช้ <details> ของเบราว์เซอร์ เพื่อให้ "คำตอบ" อยู่ใน HTML ตั้งแต่ฝั่งเซิร์ฟเวอร์เสมอ
              หน้านี้ประกาศ FAQPage JSON-LD ที่มีทั้งคำถามและคำตอบไว้ ถ้าคำตอบโผล่เฉพาะตอนคลิก
              จะกลายเป็น structured data ที่อ้างถึงข้อความซึ่งไม่มีอยู่บนหน้า */}
          <div className="space-y-3">
            {article.faqs.map((faq, idx) => (
              <details
                key={idx}
                className="group rounded-xl border border-[#D5CEC2] bg-[#FFFFFF] overflow-hidden transition-all shadow-xs"
              >
                <summary className="w-full flex items-center justify-between p-4 text-left font-serif-th text-xs sm:text-sm font-semibold text-[#29261F] hover:text-[#A58A5C] transition-colors gap-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span>{faq.question}</span>
                  <span
                    aria-hidden="true"
                    className="text-[#A58A5C] font-mono text-sm font-bold transition-transform duration-300 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <div className="p-4 pt-0 text-xs font-serif-th text-[#29261F] leading-relaxed border-t border-[#D5CEC2]/40 bg-[#EAE7E0]">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* High-Impact Interactive CTA Box */}
      <div className="rounded-xl border border-[#D5CEC2] bg-[#FFFFFF] p-6 sm:p-8 text-center space-y-4 relative overflow-hidden shadow-[0_10px_30px_rgba(42,38,31,0.06)]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D5CEC2] bg-[#EAE7E0] text-[13px] text-[#A58A5C] font-mono font-bold">
          {isEnglish ? "Interactive Provably-Fair Divination" : "Interactive Provably-Fair Reading"}
        </div>
        <h2 className="font-serif-th text-xl sm:text-3xl font-bold text-[#29261F]">
          {isEnglish
            ? "Ready to Reveal the Hidden Wisdom of Your Path?"
            : "พร้อมเปิดไพ่รับคำตอบสำหรับชีวิตคุณหรือยัง?"}
        </h2>
        <p className="text-xs sm:text-sm text-[#635B4E] font-serif-th max-w-lg mx-auto leading-relaxed">
          {isEnglish
            ? "Experience 3D tactile card shuffling and draw with free will from the complete 78-card Rider-Waite deck, illuminated by provably-fair cryptography and deep archetypal guidance 24/7."
            : "สัมผัสประสบการณ์สับไพ่และเลือกหยิบไพ่ 78 ใบด้วยตัวคุณเองแบบ 3D พร้อมรับคำพยากรณ์เจาะลึกจากแม่หมอ AI ตลอด 24 ชั่วโมง"}
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#29261F] hover:bg-[#A58A5C] text-[#F3F0EA] font-bold text-sm hover:scale-[1.02] transition-all font-serif-th cursor-pointer shadow-sm"
          >
            <span>{isEnglish ? "Begin Free Tarot Reading Now" : "เปิดไพ่ทำนายดวงชะตาฟรีทันที"}</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* Share / Copy Link Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-[#D5CEC2]/40 text-xs font-serif-th">
        <div className="flex items-center gap-2 text-[#635B4E]">
          <span>{isEnglish ? "Share this codex:" : "แชร์คัมภีร์นี้:"}</span>
          <button
            onClick={handleCopyLink}
            className="px-3.5 py-1.5 rounded-full border border-[#D5CEC2] bg-[#FFFFFF] text-[#29261F] hover:border-[#A58A5C] hover:text-[#A58A5C] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
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
        <Link href="/blog" className="text-[#A58A5C] hover:underline font-bold">
          {isEnglish
            ? `← Back to Wisdom Codex (${COUNTS.articles} articles)`
            : `← กลับสู่คัมภีร์ทั้งหมด (${COUNTS.articles} บทความ)`}
        </Link>
      </div>

      {/* Related Articles Carousel/Grid */}
      {relatedArticles.length > 0 && (
        <section className="space-y-4 pt-4">
          <h2 className="font-serif-th text-lg sm:text-xl font-bold text-[#29261F]">
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
                  className="rounded-xl border border-[#D5CEC2] bg-[#FFFFFF] p-4 space-y-2 hover:border-[#A58A5C] transition-all group flex flex-col justify-between shadow-[0_10px_30px_rgba(42,38,31,0.04)]"
                >
                  <div className="space-y-1.5">
                    <div className="text-[13px] font-mono text-[#A58A5C] font-bold">{relCat}</div>
                    <h3 className="font-serif-th text-xs sm:text-sm font-bold text-[#29261F] group-hover:text-[#A58A5C] transition-colors line-clamp-2">
                      {relTitle}
                    </h3>
                  </div>
                  <div className="text-[13px] text-[#635B4E] font-mono pt-2 border-t border-[#D5CEC2]/40">
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
