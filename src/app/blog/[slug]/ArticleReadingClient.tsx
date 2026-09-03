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
          <span className="px-3 py-1 rounded-full bg-[#F0E8DB] border border-[#E4D8C4] text-[#8F5C1A] font-bold">
            ✦ {article.categoryTh}
          </span>
          <span className="text-[#6F5B4A]">⏱ เวลาอ่าน {article.readTime}</span>
          <span className="text-[#6F5B4A]">·</span>
          <span className="text-[#6F5B4A]">โดย {article.author}</span>
        </div>

        <h1 className="font-serif-th text-2xl sm:text-4xl font-bold font-mystic-gold leading-tight">{article.title}</h1>

        <p className="text-sm sm:text-base text-[#2E211A] font-serif-th leading-relaxed border-l-2 border-[#E4D8C4] pl-4 py-1 italic bg-[#FFFFFF] rounded-r-lg">
          {article.description}
        </p>
      </header>

      {/* Table of Contents (TOC) */}
      {article.toc && article.toc.length > 0 && (
        <div className="rounded-lg border border-[#E4D8C4] bg-[#FFFFFF] p-5 sm:p-6 space-y-3 ">
          <div className="flex items-center gap-2 text-xs font-serif-th font-bold text-[#2E211A]">
            <span>✦</span> สารบัญคัมภีร์ความรู้ (Table of Contents)
          </div>
          <ul className="space-y-2 text-xs sm:text-sm font-serif-th text-[#2E211A]">
            {article.toc.map((item, idx) => (
              <li key={item.id} className="flex items-start gap-2">
                <span className="text-[#8F5C1A] font-mono text-xs font-bold">{idx + 1}.</span>
                <a href={`#${item.id}`} className="hover:text-[#8F5C1A] hover:underline transition-colors">
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Target Card Highlight Box if available */}
      {article.targetCardId && article.cardNameTh && (
        <div className="rounded-lg border border-[#E4D8C4] bg-[#FFFFFF] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 ">
          <div className="space-y-1 text-center sm:text-left">
            <div className="text-[10px] font-mono text-[#8F5C1A] font-bold">✦ สำรวจไพ่ใบนี้ในสารานุกรม 78 ใบ</div>
            <div className="font-serif-th font-bold text-base text-[#2E211A]">
              ไพ่ {article.cardNameTh} (1909 Rider-Waite)
            </div>
            <p className="text-xs text-[#6F5B4A] font-serif-th">
              ดูภาพขยาย 1909 ความหมายลึกซึ้ง 5 ด้าน และตำแหน่งในผังพยากรณ์
            </p>
          </div>
          <Link
            href={`/cards/${article.targetCardId}`}
            className="shrink-0 px-4 py-2 rounded-lg border border-[#E4D8C4] bg-[#F0E8DB] hover:bg-[#FFFFFF] text-[#8F5C1A] text-xs font-serif-th font-bold transition-all "
          >
            เปิดดูรายละเอียดไพ่ 78 ใบ →
          </Link>
        </div>
      )}

      {/* Main Content Body */}
      <article className="prose prose-stone max-w-none font-serif-th text-xs sm:text-sm leading-relaxed text-[#2E211A] space-y-6">
        <div
          dangerouslySetInnerHTML={{
            __html: article.content
              .replace(
                /## (.*?)\n/g,
                '<h2 class="text-lg sm:text-2xl font-bold font-mystic-gold mt-8 mb-4 border-b border-[#E4D8C4]/30 pb-2">$1</h2>'
              )
              .replace(/### (.*?)\n/g, '<h3 class="text-base sm:text-xl font-bold text-[#2E211A] mt-6 mb-3">$1</h3>')
              .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#2E211A] font-semibold">$1</strong>')
              .replace(/\*(.*?)\*/g, '<em class="text-[#8F5C1A] font-medium">$1</em>')
              .replace(/- (.*?)\n/g, '<li class="ml-4 list-disc text-[#2E211A] my-1">$1</li>')
              .replace(/\n\n/g, '<p class="my-4 leading-relaxed text-[#2E211A]"></p>')
              .replace(/---/g, '<hr class="border-[#E4D8C4]/30 my-6" />'),
          }}
        />
      </article>

      {/* FAQ Section with Accordion */}
      {article.faqs && article.faqs.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-[#E4D8C4]/20">
          <div className="flex items-center gap-2 text-sm sm:text-base font-serif-th font-bold font-mystic-gold">
            <span>❓</span> คำถามที่พบบ่อย (FAQ)
          </div>
          <div className="space-y-3">
            {article.faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-lg border border-[#E4D8C4] bg-[#FFFFFF] overflow-hidden transition-all "
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-4 text-left font-serif-th text-xs sm:text-sm font-semibold text-[#2E211A] hover:text-[#8F5C1A] transition-colors gap-3 cursor-pointer"
                  >
                    <span>✦ {faq.question}</span>
                    <span className="text-[#8F5C1A] font-mono text-sm font-bold">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <div className="p-4 pt-0 text-xs font-serif-th text-[#2E211A] leading-relaxed border-t border-[#E4D8C4]/30 bg-[#F0E8DB] p-4">
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
      <div className="rounded-lg border border-[#E4D8C4] bg-[#FFFFFF] p-6 sm:p-8 text-center space-y-4 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#E4D8C4] bg-[#F0E8DB] text-[11px] text-[#8F5C1A] font-mono font-bold ">
          <span>✦</span> Interactive Provably-Fair Reading <span>✦</span>
        </div>
        <h2 className="font-serif-th text-xl sm:text-3xl font-bold font-mystic-gold">
          พร้อมเปิดไพ่รับคำตอบสำหรับชีวิตคุณหรือยัง?
        </h2>
        <p className="text-xs sm:text-sm text-[#6F5B4A] font-serif-th max-w-lg mx-auto leading-relaxed">
          สัมผัสประสบการณ์สับไพ่และเลือกหยิบไพ่ 78 ใบด้วยตัวคุณเองแบบ 3D พร้อมรับคำพยากรณ์เจาะลึกจากแม่หมอ AI ตลอด 24
          ชั่วโมง
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#8F5C1A] hover:bg-[#74490F] text-[#FFFFFF] font-bold text-sm hover:scale-[1.03] transition-all font-serif-th cursor-pointer"
          >
            <span>✦ เปิดไพ่ทำนายดวงชะตาฟรีทันที</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* Share / Copy Link Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-[#E4D8C4]/30 text-xs font-serif-th">
        <div className="flex items-center gap-2 text-[#6F5B4A]">
          <span>แชร์คัมภีร์นี้:</span>
          <button
            onClick={handleCopyLink}
            className="px-3 py-1 rounded-lg border border-[#E4D8C4] bg-[#FFFFFF] text-[#2E211A] hover:border-[#8F5C1A] hover:text-[#8F5C1A] transition-colors flex items-center gap-1.5 cursor-pointer "
          >
            <span>✦</span>
            <span>{copied ? "คัดลอกลิงก์สำเร็จ!" : "คัดลอกลิงก์"}</span>
          </button>
        </div>
        <Link href="/blog" className="text-[#8F5C1A] hover:underline font-bold">
          ← กลับสู่คัมภีร์ทั้งหมด (20 บทความ)
        </Link>
      </div>

      {/* Related Articles Carousel/Grid */}
      {relatedArticles.length > 0 && (
        <section className="space-y-4 pt-4">
          <h2 className="font-serif-th text-lg sm:text-xl font-bold font-mystic-gold">✦ คัมภีร์บทความที่เกี่ยวข้อง</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedArticles.map((rel) => (
              <Link
                key={rel.slug}
                href={`/blog/${rel.slug}`}
                className="rounded-lg border border-[#E4D8C4] bg-[#FFFFFF] p-4 space-y-2 hover:border-[#8F5C1A] hover:bg-[#F6F1E9] transition-all group flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono text-[#8F5C1A] font-bold">{rel.categoryTh}</div>
                  <h3 className="font-serif-th text-xs sm:text-sm font-bold text-[#2E211A] group-hover:text-[#8F5C1A] transition-colors line-clamp-2">
                    {rel.title}
                  </h3>
                </div>
                <div className="text-[10px] text-[#6F5B4A] font-mono pt-2 border-t border-[#E4D8C4]/30">
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
