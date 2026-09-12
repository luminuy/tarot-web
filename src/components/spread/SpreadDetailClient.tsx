"use client";

import React from "react";
// ลิงก์ภายในต้องอยู่ในต้นไม้ภาษาเดียวกับหน้าที่ผู้ใช้ยืนอยู่ — ดู src/components/ui/LocaleLink.tsx
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import type { Spread } from "@/data/spreads-helpers";
import {
  getSpreadName,
  getSpreadTagline,
  getSpreadDescription,
  getPositionName,
  getPositionMeaning,
} from "@/data/spreads-helpers";
import type { Article } from "@/data/articles";
import { getArticleTitle } from "@/data/article-helpers";
import { SpreadPositionMap } from "@/components/spread/SpreadPositionMap";
import { useLocale } from "@/lib/i18n";

interface Props {
  spread: Spread;
  standard: boolean;
  relatedArticles: Article[];
  fallbackSpreads: Spread[];
}

const CATEGORY_TH: Record<string, string> = {
  general: "ทั่วไป",
  love: "ความรัก",
  career: "การงาน",
  work: "การงาน",
  money: "การเงิน",
  finance: "การเงิน",
  spiritual: "จิตวิญญาณ",
  decision: "การตัดสินใจ",
};

const CATEGORY_EN: Record<string, string> = {
  general: "General Inquiries",
  love: "Love & Relationships",
  career: "Career & Ambition",
  work: "Career & Ambition",
  money: "Finances & Wealth",
  finance: "Finances & Wealth",
  spiritual: "Spiritual Path",
  decision: "Decisions & Crossroads",
};

export const SpreadDetailClient: React.FC<Props> = ({
  spread,
  standard,
  relatedArticles,
  fallbackSpreads,
}) => {
  const { isEnglish } = useLocale();

  const spreadName = getSpreadName(spread, isEnglish);
  const spreadTagline = getSpreadTagline(spread, isEnglish);
  const spreadDesc = getSpreadDescription(spread, isEnglish);
  const categoryLabel = isEnglish
    ? CATEGORY_EN[spread.defaultCategory] ?? spread.defaultCategory
    : CATEGORY_TH[spread.defaultCategory] ?? spread.defaultCategory;

  const topicPhrase = isEnglish
    ? (spread.defaultCategory === "general" ? "your core question" : `matters of ${categoryLabel.toLowerCase()}`)
    : (spread.defaultCategory === "general" ? "สิ่งที่อยากรู้" : `เรื่อง${categoryLabel}`);

  const howToSteps = [
    {
      name: isEnglish ? "Frame a clear, focused inquiry" : "ตั้งคำถามให้ชัด",
      text: isEnglish
        ? `Anchor your mind on ${topicPhrase}. ${
            spread.yesNoMode
              ? "This spread provides sharp yes/no directional momentum."
              : "Avoid questions with a simple yes/no answer for richer archetypal revelations."
          }`
        : `นึกถึง${topicPhrase}ให้เป็นคำถามเดียว ${
            spread.yesNoMode
              ? "ผังนี้ตอบแนวโน้มใช่/ไม่ใช่ได้ดี"
              : "หลีกเลี่ยงคำถามที่ตอบแค่ใช่หรือไม่ใช่"
          }`,
    },
    {
      name: isEnglish ? "Shuffle with intention" : "สับและตัดไพ่",
      text: isEnglish
        ? "Hold your question in silent awareness as you shuffle, stopping when intuition signals completion."
        : "ตั้งสมาธิที่คำถามระหว่างสับไพ่ แล้วหยุดเมื่อรู้สึกว่าพอ",
    },
    {
      name: isEnglish ? `Draw ${spread.positions.length} cards` : `เลือกไพ่ ${spread.positions.length} ใบ`,
      text: isEnglish
        ? `Select cards one by one into positions 1 through ${spread.positions.length} without flipping them yet.`
        : `เลือกไพ่ทีละใบวางตามตำแหน่งที่ 1 ถึง ${spread.positions.length} โดยไม่เปิดดูหน้าไพ่`,
    },
    {
      name: isEnglish ? "Interpret sequentially, then synthesize" : "อ่านทีละตำแหน่งแล้วเชื่อมโยง",
      text: isEnglish
        ? "Contemplate each card within its specific positional role first, then step back to see how the holistic tapestry speaks to your journey."
        : "อ่านความหมายไพ่ในบริบทของแต่ละตำแหน่งก่อน จากนั้นมองภาพรวมว่าไพ่ทุกใบเล่าเรื่องเดียวกันอย่างไร",
    },
  ];

  const faqs = [
    {
      question: isEnglish
        ? `What types of questions suit the ${spreadName}?`
        : `ผัง${spread.nameTh} เหมาะกับคำถามแบบไหน`,
      answer: isEnglish
        ? `${spreadDesc} It is designed to reveal hidden dynamics and offer practical guidance.`
        : `${spread.description} ${spread.defaultCategory !== "general" ? `จึงเหมาะกับเรื่อง${categoryLabel}ที่อยากเห็นภาพรวมและปัจจัยรอบด้าน` : ""}`.trim(),
    },
    {
      question: isEnglish
        ? "How many cards are drawn in this spread?"
        : "ผังนี้ใช้ไพ่กี่ใบ",
      answer: isEnglish
        ? `This layout uses ${spread.positions.length} cards arranged in a deliberate geometric pattern.`
        : `ผังนี้ใช้ไพ่ ${spread.positions.length} ใบ วางตามตำแหน่งที่กำหนดไว้`,
    },
    {
      question: standard
        ? (isEnglish ? "Is this spread available on the standard tier?" : "ผังนี้เปิดใช้ฟรีได้ไหม")
        : (isEnglish ? "Why is this spread designated as a Grand Spread?" : "ทำไมผังนี้เป็นผังพิเศษ"),
      answer: standard
        ? (isEnglish ? "Yes, this is an open spread available to all seekers under daily quota." : "ได้ ผังนี้เป็นผังมาตรฐานที่สมาชิกทุกคนเปิดได้ตามโควตาปกติ")
        : (isEnglish ? "This layout features complex multi-card geometry and deep syntheses, unlocked for seekers with Grand Oracle access." : "ผังนี้มีจำนวนไพ่มากและตีความละเอียด จึงสงวนไว้สำหรับผู้ถือสิทธิ์ญาณพยากรณ์พิเศษ"),
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-20">
      {/* Top Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 overflow-x-auto whitespace-nowrap border-b border-line/40 pb-4 font-serif-th text-xs text-muted"
      >
        <Link href="/" className="transition-colors hover:text-gold">
          {isEnglish ? "Home" : "หน้าแรก"}
        </Link>
        <span>/</span>
        <Link href="/spreads" className="transition-colors hover:text-gold">
          {isEnglish ? "Spreads Library" : "คลังผังพยากรณ์"}
        </Link>
        <span>/</span>
        <span className="truncate font-bold text-ink">{spreadName}</span>
      </nav>

      {/* Header */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-[13px] font-serif-th">
          <span className="rounded-full border border-line bg-inset px-2.5 py-0.5 font-mono font-bold">
            {spread.positions.length} {isEnglish ? "Cards" : "ใบ"}
          </span>
          <span className="rounded-full border border-line bg-white px-2.5 py-0.5">
            {isEnglish ? `Category: ${categoryLabel}` : `หมวด ${categoryLabel}`}
          </span>
          <span className="rounded-full border border-line bg-white px-2.5 py-0.5">
            {standard ? (isEnglish ? "Standard Spread" : "ผังมาตรฐาน") : (isEnglish ? "Grand Spread" : "ญาณพิเศษ")}
          </span>
        </div>
        <h1 className="font-serif-th text-3xl font-bold leading-tight sm:text-4xl [text-wrap:balance]">
          {isEnglish ? spreadName : (spread.seoTitleTh ?? `ผัง${spread.nameTh}`)}
        </h1>
        <p className="font-serif-th text-lg text-gold [text-wrap:balance]">{spreadTagline}</p>
        <p className="max-w-2xl font-serif-th leading-relaxed text-ink [text-wrap:pretty]">
          {spreadDesc}
        </p>
        <Link
          href={`/?spread=${spread.id}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-ink px-6 py-3 font-serif-th text-sm font-bold text-canvas transition hover:bg-gold active:scale-[0.98]"
        >
          
          <span>
            {standard
              ? (isEnglish ? "Begin Reading with Spread" : "เริ่มดูดวงด้วยผังนี้")
              : (isEnglish ? "Unlock Grand Spread" : "เปิดผังพยากรณ์พิเศษนี้")}
          </span>
        </Link>
      </header>

      {/* Diagram + Positions */}
      <section className="space-y-6">
        <div className="grid gap-8 sm:grid-cols-[minmax(0,260px)_1fr] sm:items-start">
          <div>
            <SpreadPositionMap positions={spread.positions} isEnglish={isEnglish} />
            <p className="mt-2 text-center text-xs text-muted">
              {isEnglish ? `Layout order 1–${spread.positions.length}` : `ลำดับการวางไพ่ 1–${spread.positions.length}`}
            </p>
          </div>
          <div>
            <h2 className="font-serif-th text-xl font-bold text-ink">
              {isEnglish ? "Positional Roles & Interpretations" : `ตำแหน่งไพ่ทั้ง ${spread.positions.length} ใบและความหมาย`}
            </h2>
            <p className="text-xs text-[#7A6F5D] mt-1 font-serif-th">
              {isEnglish
                ? "Each card role answers a specific dimension of your inquiry:"
                : "แต่ละตำแหน่งทำหน้าที่ตอบคำถามเฉพาะมิติเพื่อเชื่อมโยงภาพรวมของคำทำนาย:"}
            </p>
            <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-white shadow-xs">
              <table className="w-full text-left text-xs font-serif-th border-collapse">
                <thead>
                  <tr className="border-b border-line bg-surface-mist text-[#5E5240]">
                    <th scope="col" className="py-2.5 px-3 font-mono font-bold w-12 text-center">#</th>
                    <th scope="col" className="py-2.5 px-3 font-bold w-36 sm:w-44">{isEnglish ? "Position Name" : "ชื่อตำแหน่ง"}</th>
                    <th scope="col" className="py-2.5 px-3 font-bold">{isEnglish ? "Divinatory Role & Meaning" : "คำถามที่ตำแหน่งนี้ตอบ / บทบาทการตีความ"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {spread.positions.map((pos, idx) => (
                    <tr key={idx} className="hover:bg-surface-mist/60 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-gold-ink text-center">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-ink align-top">{getPositionName(pos, isEnglish)}</td>
                      <td className="py-2.5 px-3 text-[#5E5240] leading-relaxed align-top">{getPositionMeaning(pos, isEnglish)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* How-to Steps */}
      <section>
        <h2 className="font-serif-th text-xl font-bold">
          {isEnglish ? "How to Read this Spread" : "วิธีอ่านผังนี้"}
        </h2>
        <ol className="mt-4 space-y-3">
          {howToSteps.map((step, idx) => (
            <li key={idx} className="flex items-start gap-3 font-serif-th">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-canvas">
                {idx + 1}
              </span>
              <div>
                <strong className="text-ink">{step.name}</strong>
                <p className="leading-relaxed text-muted">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQs */}
      <section>
        <h2 className="font-serif-th text-xl font-bold">
          {isEnglish ? "Frequently Asked Questions" : "คำถามที่พบบ่อย"}
        </h2>
        <div className="mt-4 space-y-3">
          {faqs.map((faq, idx) => (
            <details
              key={idx}
              className="rounded-lg border border-line bg-white p-4 font-serif-th"
            >
              <summary className="cursor-pointer font-bold text-ink">{faq.question}</summary>
              <p className="mt-2 leading-relaxed text-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section>
          <h2 className="font-serif-th text-xl font-bold">
            {isEnglish ? "Related Wisdom Articles" : "บทความที่เกี่ยวข้อง"}
          </h2>
          <ul className="mt-4 space-y-2">
            {relatedArticles.map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/blog/${a.slug}`}
                  className="font-serif-th text-gold underline-offset-2 hover:underline"
                >
                  {getArticleTitle(a, isEnglish)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Other Spreads */}
      <section>
        <h2 className="font-serif-th text-xl font-bold">
          {isEnglish ? "Explore Other Spreads" : "ผังอื่นที่น่าสนใจ"}
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {fallbackSpreads.map((s) => (
            <Link
              key={s.id}
              href={`/spreads/${s.id}`}
              className="rounded-lg border border-line bg-white p-4 transition-colors hover:border-gold"
            >
              <p className="font-serif-th font-bold text-ink">{getSpreadName(s, isEnglish)}</p>
              <p className="mt-1 font-serif-th text-xs text-muted">{getSpreadTagline(s, isEnglish)}</p>
            </Link>
          ))}
        </div>
        <Link
          href="/spreads"
          className="mt-4 inline-block font-serif-th text-sm text-gold-ink hover:underline"
        >
          {isEnglish ? "← View All 20 Tarot Spreads" : "← ดูคลังผังพยากรณ์ทั้งหมด"}
        </Link>
      </section>
    </div>
  );
};
