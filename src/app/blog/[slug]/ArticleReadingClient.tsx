"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { Article } from "@/data/articles";
import { soundManager } from "@/lib/utils/audio";

interface Props {
  article: Article;
  relatedArticles: Article[];
}

export const ArticleReadingClient: React.FC<Props> = ({ article, relatedArticles }) => {
  const [copied, setCopied] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const handleCopyLink = () => {
    soundManager.playMenuTapSound();
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const toggleFaq = (idx: number) => {
    soundManager.playCardFlipSound();
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-10">
      {/* Article Header */}
      <header className="space-y-4 text-center sm:text-left">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-xs font-mono">
          <span className="px-3 py-1 rounded-full bg-[#e5c07b]/15 border border-[#e5c07b]/30 text-[#e5c07b] font-semibold">
            ✦ {article.categoryTh}
          </span>
          <span className="text-[#8c82a5]">⏱ เวลาอ่าน {article.readTime}</span>
          <span className="text-[#8c82a5]">·</span>
          <span className="text-[#8c82a5]">โดย {article.author}</span>
        </div>

        <h1 className="font-serif-th text-2xl sm:text-4xl font-bold font-mystic-gold leading-tight">
          {article.title}
        </h1>

        <p className="text-sm sm:text-base text-[#cfc8e2] font-serif-th leading-relaxed border-l-2 border-[#e5c07b]/40 pl-4 py-1 italic bg-[#110a20]/40 rounded-r-xl">
          {article.description}
        </p>
      </header>

      {/* Table of Contents (TOC) */}
      {article.toc && article.toc.length > 0 && (
        <div className="rounded-2xl border border-[#e5c07b]/25 bg-gradient-to-b from-[#140b26]/90 to-[#0a0515]/95 p-5 sm:p-6 space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-serif-th font-bold text-[#ffd700]">
            <span>📜</span> สารบัญคัมภีร์ความรู้ (Table of Contents)
          </div>
          <ul className="space-y-2 text-xs sm:text-sm font-serif-th text-[#cfc8e2]">
            {article.toc.map((item, idx) => (
              <li key={item.id} className="flex items-start gap-2">
                <span className="text-[#e5c07b] font-mono text-xs">{idx + 1}.</span>
                <a
                  href={`#${item.id}`}
                  className="hover:text-[#ffd700] hover:underline transition-colors"
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Target Card Highlight Box if available */}
      {article.targetCardId && article.cardNameTh && (
        <div className="rounded-2xl border border-[#ffd700]/30 bg-[#160c2c]/80 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <div className="text-[10px] font-mono text-[#e5c07b]">✦ สำรวจไพ่ใบนี้ในสารานุกรม 78 ใบ</div>
            <div className="font-serif-th font-bold text-base text-[#ffd700]">
              ไพ่ {article.cardNameTh} (1909 Rider-Waite)
            </div>
            <p className="text-xs text-[#9c93b8] font-serif-th">
              ดูภาพขยาย 1909 ความหมายลึกซึ้ง 5 ด้าน และตำแหน่งในผังพยากรณ์
            </p>
          </div>
          <Link
            href={`/cards/${article.targetCardId}`}
            className="shrink-0 px-4 py-2 rounded-xl border border-[#ffd700]/60 bg-[#ffd700]/15 hover:bg-[#ffd700]/25 text-[#ffd700] text-xs font-serif-th font-semibold transition-all shadow-md"
          >
            เปิดดูรายละเอียดไพ่ 78 ใบ →
          </Link>
        </div>
      )}

      {/* Main Content Body */}
      <article className="prose prose-invert max-w-none font-serif-th text-xs sm:text-sm leading-relaxed text-[#dfd9ee] space-y-6">
        <div
          dangerouslySetInnerHTML={{
            __html: article.content
              .replace(/## (.*?)\n/g, '<h2 class="text-lg sm:text-2xl font-bold font-mystic-gold mt-8 mb-4 border-b border-[#e5c07b]/20 pb-2">$1</h2>')
              .replace(/### (.*?)\n/g, '<h3 class="text-base sm:text-xl font-bold text-[#ffd700] mt-6 mb-3">$1</h3>')
              .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#ffd700] font-semibold">$1</strong>')
              .replace(/\*(.*?)\*/g, '<em class="text-[#e5c07b]">$1</em>')
              .replace(/- (.*?)\n/g, '<li class="ml-4 list-disc text-[#cfc8e2] my-1">$1</li>')
              .replace(/\n\n/g, '<p class="my-4 leading-relaxed text-[#cfc8e2]"></p>')
              .replace(/---/g, '<hr class="border-[#e5c07b]/20 my-6" />')
          }}
        />
      </article>

      {/* FAQ Section with Accordion */}
      {article.faqs && article.faqs.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-[#e5c07b]/20">
          <div className="flex items-center gap-2 text-sm sm:text-base font-serif-th font-bold font-mystic-gold">
            <span>❓</span> คำถามที่พบบ่อย (FAQ)
          </div>
          <div className="space-y-3">
            {article.faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-[#e5c07b]/20 bg-[#100820]/80 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-4 text-left font-serif-th text-xs sm:text-sm font-semibold text-[#f5deaa] hover:text-[#ffd700] transition-colors gap-3"
                  >
                    <span>✦ {faq.question}</span>
                    <span className="text-[#e5c07b] font-mono text-sm">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <div className="p-4 pt-0 text-xs font-serif-th text-[#b8aeca] leading-relaxed border-t border-[#e5c07b]/10 bg-[#0c0618]">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* High-Impact Interactive CTA Box */}
      <div className="rounded-3xl border border-[#ffd700]/50 bg-gradient-to-br from-[#28184c] via-[#140b28] to-[#070310] p-6 sm:p-8 text-center space-y-4 shadow-2xl relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#ffd700]/40 bg-[#ffd700]/10 text-[11px] text-[#ffd700] font-mono">
          <span>✦</span> Interactive Provably-Fair Reading <span>✦</span>
        </div>
        <h2 className="font-serif-th text-xl sm:text-3xl font-bold font-mystic-gold">
          พร้อมเปิดไพ่รับคำตอบสำหรับชีวิตคุณหรือยัง?
        </h2>
        <p className="text-xs sm:text-sm text-[#cfc8e2] font-serif-th max-w-lg mx-auto leading-relaxed">
          สัมผัสประสบการณ์สับไพ่และเลือกหยิบไพ่ 78 ใบด้วยตัวคุณเองแบบ 3D พร้อมรับคำพยากรณ์เจาะลึกจากแม่หมอ AI ตลอด 24 ชั่วโมง
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#d4a72c] to-[#a27b14] hover:from-[#e5b83d] hover:to-[#b38c25] text-[#0b0714] font-bold text-sm shadow-[0_0_25px_rgba(212,167,44,0.4)] hover:scale-[1.03] transition-all font-serif-th cursor-pointer"
          >
            <span>✦ เปิดไพ่ทำนายดวงชะตาฟรีทันที</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* Share / Copy Link Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-[#e5c07b]/20 text-xs font-serif-th">
        <div className="flex items-center gap-2 text-[#9c93b8]">
          <span>แชร์คัมภีร์นี้:</span>
          <button
            onClick={handleCopyLink}
            className="px-3 py-1 rounded-lg border border-[#e5c07b]/30 bg-[#160c2a] text-[#f5deaa] hover:border-[#ffd700] hover:text-white transition-colors flex items-center gap-1.5"
          >
            <span>🔗</span>
            <span>{copied ? "คัดลอกลิงก์สำเร็จ!" : "คัดลอกลิงก์"}</span>
          </button>
        </div>
        <Link href="/blog" className="text-[#e5c07b] hover:text-[#ffd700] hover:underline">
          ← กลับสู่คัมภีร์ทั้งหมด (20 บทความ)
        </Link>
      </div>

      {/* Related Articles Carousel/Grid */}
      {relatedArticles.length > 0 && (
        <section className="space-y-4 pt-4">
          <h2 className="font-serif-th text-lg sm:text-xl font-bold font-mystic-gold">
            ✦ คัมภีร์บทความที่เกี่ยวข้อง
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedArticles.map((rel) => (
              <Link
                key={rel.slug}
                href={`/blog/${rel.slug}`}
                className="rounded-2xl border border-[#e5c07b]/20 bg-[#120a22]/80 p-4 space-y-2 hover:border-[#ffd700]/50 hover:bg-[#180f2e] transition-all group shadow-md flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono text-[#e5c07b]">
                    {rel.categoryTh}
                  </div>
                  <h3 className="font-serif-th text-xs sm:text-sm font-bold text-[#f5deaa] group-hover:text-[#ffd700] transition-colors line-clamp-2">
                    {rel.title}
                  </h3>
                </div>
                <div className="text-[10px] text-[#8c82a5] font-mono pt-2 border-t border-[#e5c07b]/10">
                  ⏱ {rel.readTime}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
