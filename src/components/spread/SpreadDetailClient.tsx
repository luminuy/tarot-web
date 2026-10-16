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
import { mapLayout, MAP_CARD_ASPECT, MAP_CARD_MIN_PX } from "@/lib/tarot/spread-map-geometry";
import { useLocale } from "@/lib/i18n";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { Ui2Crumbs, Ui2SectionHead } from "@/components/ui2/Ui2PageHero";

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

  /*
   * v2 (เจ้าของ 2026-10-16 "สร้างใหม่เลย") — "พิมพ์เขียวผัง"
   * จอแรก: ข้อความ + ปุ่มเริ่มซ้าย · กระดานพิมพ์เขียวขวา (แตะไพ่ ➔ เห็นชื่อ/คำถามของตำแหน่งทันที แถวในตารางสว่างตาม)
   * v1: แผนผังเล็ก 260px กับตารางแยกกัน ต้องไล่เลขเอง · หัวหน้าใหญ่ดันแผนผังลงไปใต้จอ
   */
  /* หน้านี้เป็น HTML ล้วน (ไม่ hydrate · รอบ 97) — การแตะไพ่บนกระดานทำโดย `astro/scripts/spread-board.ts` (< 1 KB) */
  const active = 0;
  /** ชื่อตำแหน่งบางผังขึ้นต้นด้วยเลขอยู่แล้ว ("1. แก่นของเรื่อง") — ตัดออกเพราะมีป้ายเลขข้างหน้าแล้ว */
  const posLabel = (pos: (typeof spread.positions)[number]) => getPositionName(pos, isEnglish).replace(/^\d+\.\s*/, "");
  const map = mapLayout(spread.positions);
  const activePos = spread.positions[active];
  const tags = [
    `${spread.positions.length} ${isEnglish ? "cards" : "ใบ"}`,
    isEnglish ? categoryLabel : `หมวด${categoryLabel}`,
    standard ? (isEnglish ? "Standard spread" : "ผังมาตรฐาน") : (isEnglish ? "Grand spread" : "ผังพิเศษ"),
  ];

  return (
    <div className="v2-sd">
      <section className="v2-sd-top" aria-labelledby="sd-title">
        <div className="v2-sd-intro">
          <Ui2Crumbs
            crumbs={[
              { label: isEnglish ? "Home" : "หน้าแรก", href: "/" },
              { label: isEnglish ? "Spreads" : "คลังผังพยากรณ์", href: "/spreads" },
              { label: spreadName },
            ]}
          />
          <ul className="v2-sd-tags">
            {tags.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <h1 id="sd-title" className="v2-sd-title">
            {isEnglish ? spreadName : <ThaiPhrases>{spread.seoTitleTh ?? `ผัง${spread.nameTh}`}</ThaiPhrases>}
          </h1>
          <p className="v2-sd-tagline">
            <ThaiPhrases>{spreadTagline}</ThaiPhrases>
          </p>
          <p className="v2-sd-desc">
            <ThaiPhrases>{spreadDesc}</ThaiPhrases>
          </p>
          <div className="v2-sd-ctas">
            <Link href={`/read/${spread.id}`} className="ui2-btn v2-sd-go">
              {standard
                ? isEnglish
                  ? "Begin Reading with Spread"
                  : "เริ่มดูดวงด้วยผังนี้"
                : isEnglish
                  ? "Unlock Grand Spread"
                  : "เปิดผังพยากรณ์พิเศษนี้"}
            </Link>
            <a href="#sd-positions" className="ui2-btn-ghost">
              {isEnglish ? "See every position" : "ดูความหมายทุกตำแหน่ง"}
            </a>
          </div>
        </div>

        {/* กระดานพิมพ์เขียว */}
        <figure className="v2-sd-board">
          <div className="v2-sd-board-area" style={{ paddingBottom: `${(map.boxHeight * 100).toFixed(2)}%` }}>
            {spread.positions.map((pos, idx) => (
              <button
                key={idx}
                type="button"
                className="v2-sd-slot card-back-pattern"
                aria-pressed={active === idx}
                aria-label={`${idx + 1}. ${getPositionName(pos, isEnglish)}`}
                style={{
                  left: `${pos.x * 100}%`,
                  top: `${(((pos.y * map.yScale + map.offsetY) / map.boxHeight) * 100).toFixed(3)}%`,
                  width: `${(map.cardW * 100).toFixed(2)}%`,
                  minWidth: MAP_CARD_MIN_PX,
                  aspectRatio: `1 / ${MAP_CARD_ASPECT}`,
                  transform: `translate(-50%, -50%) rotate(${pos.rotate ?? 0}deg)`,
                }}
              >
                <span style={{ transform: `rotate(${-(pos.rotate ?? 0)}deg)` }}>{idx + 1}</span>
              </button>
            ))}
          </div>
          {activePos && (
            <figcaption className="v2-sd-cap" aria-live="polite">
              <span className="v2-sd-cap-n">{active + 1}</span>
              <span>
                <b>{posLabel(activePos)}</b>
                <small>{getPositionMeaning(activePos, isEnglish)}</small>
              </span>
            </figcaption>
          )}
        </figure>
      </section>

      {/* ตำแหน่งทั้งหมด — ตารางจริง (ด่าน SEO wave 4) จัดเป็นสมุดบัญชีทอง แถวที่เลือกบนกระดานสว่างตาม */}
      <section id="sd-positions" className="v2-sd-sec" aria-labelledby="sd-pos-h">
        <Ui2SectionHead
          n="01"
          word="Positions"
          id="sd-pos-h"
          title={isEnglish ? "Positional Roles & Interpretations" : `ตำแหน่งไพ่ทั้ง ${spread.positions.length} ใบและความหมาย`}
          lede={
            isEnglish
              ? "Each card role answers a specific dimension of your inquiry."
              : "แต่ละตำแหน่งตอบคำถามคนละมิติ แล้วเชื่อมกันเป็นภาพรวมของคำทำนาย"
          }
        />
        <div className="v2-sd-ledger">
          <table>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">{isEnglish ? "Position Name" : "ชื่อตำแหน่ง"}</th>
                <th scope="col">{isEnglish ? "Divinatory Role & Meaning" : "คำถามที่ตำแหน่งนี้ตอบ / บทบาทการตีความ"}</th>
              </tr>
            </thead>
            <tbody>
              {spread.positions.map((pos, idx) => (
                <tr key={idx} className={active === idx ? "is-active" : undefined}>
                  <td>
                    <span className="v2-sd-n">{idx + 1}</span>
                  </td>
                  <th scope="row">{posLabel(pos)}</th>
                  <td>{getPositionMeaning(pos, isEnglish)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="v2-sd-sec" aria-labelledby="sd-how-h">
        <Ui2SectionHead n="02" word="How to read" id="sd-how-h" title={isEnglish ? "How to Read this Spread" : "วิธีอ่านผังนี้"} />
        <ol className="v2-sd-steps">
          {howToSteps.map((step, idx) => (
            <li key={idx}>
              <span className="v2-sd-stepn" aria-hidden="true">
                {idx + 1}
              </span>
              <h3>{step.name}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="v2-sd-sec v2-sd-split">
        <div aria-labelledby="sd-faq-h">
          <Ui2SectionHead n="03" word="FAQ" id="sd-faq-h" title={isEnglish ? "Frequently Asked Questions" : "คำถามที่พบบ่อย"} />
          <div className="v2-sd-faq">
            {faqs.map((faq, idx) => (
              <details key={idx}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>

        {relatedArticles.length > 0 && (
          <div aria-labelledby="sd-art-h">
            <Ui2SectionHead n="04" word="Read more" id="sd-art-h" title={isEnglish ? "Related Wisdom Articles" : "บทความที่เกี่ยวข้อง"} />
            <ul className="v2-sd-articles">
              {relatedArticles.map((a) => (
                <li key={a.slug}>
                  <Link href={`/blog/${a.slug}`}>{getArticleTitle(a, isEnglish)}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="v2-sd-sec" aria-labelledby="sd-more-h">
        <Ui2SectionHead n={relatedArticles.length > 0 ? "05" : "04"} word="More spreads" id="sd-more-h" title={isEnglish ? "Explore Other Spreads" : "ผังอื่นที่น่าสนใจ"} />
        <ul className="v2-sd-more">
          {fallbackSpreads.map((s) => {
            const m = mapLayout(s.positions);
            return (
              <li key={s.id}>
                <Link href={`/spreads/${s.id}`} className="v2-sd-more-card">
                  <span className="v2-sd-mini" aria-hidden="true" style={{ paddingBottom: `${(m.boxHeight * 100).toFixed(2)}%` }}>
                    {s.positions.map((pos, i) => (
                      <span
                        key={i}
                        style={{
                          left: `${pos.x * 100}%`,
                          top: `${(((pos.y * m.yScale + m.offsetY) / m.boxHeight) * 100).toFixed(3)}%`,
                          width: `${(m.cardW * 100).toFixed(2)}%`,
                          aspectRatio: `1 / ${MAP_CARD_ASPECT}`,
                          transform: `translate(-50%, -50%) rotate(${pos.rotate ?? 0}deg)`,
                        }}
                      />
                    ))}
                  </span>
                  <b>{getSpreadName(s, isEnglish)}</b>
                  <small>{getSpreadTagline(s, isEnglish)}</small>
                </Link>
              </li>
            );
          })}
        </ul>
        <Link href="/spreads" className="v2-sd-all">
          {isEnglish ? "View all tarot spreads" : "ดูคลังผังพยากรณ์ทั้งหมด"}
        </Link>
      </section>
    </div>
  );
};
