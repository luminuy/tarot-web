"use client";

import React from "react";
// ลิงก์ภายในต้องอยู่ในต้นไม้ภาษาเดียวกับหน้าที่ผู้ใช้ยืนอยู่ — ดู src/components/ui/LocaleLink.tsx
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import type { TarotCard } from "@/data/cards/types";
import { CARD_KEYWORDS_EN } from "@/data/cards/keywords-en";
import { CardImage } from "@/components/card/CardImage";
import { CardYesNoAnswer } from "./CardYesNoAnswer";
import { useLocale } from "@/lib/i18n";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";

export type CardNavRef = Pick<TarotCard, "id" | "image" | "nameTh" | "nameEn">;

interface CardDetailViewProps {
  card: TarotCard;
  /**
   * ไพ่ก่อนหน้า/ถัดไป — ใช้แค่ 4 ฟิลด์นี้จริง ๆ (ลิงก์ · ภาพย่อ · ชื่อสองภาษา)
   *
   * ⚠️ ห้ามขยายเป็น `TarotCard` เต็มใบ · หน้าที่เรนเดอร์ด้วย Astro ส่ง prop ชุดนี้
   *    ลงไปใน HTML เพื่อให้ island hydrate ได้ ถ้ารับทั้งใบ คำทำนายทั้ง 5 หมวด
   *    ของไพ่อีกสองใบจะถูกฝังลงหน้าไปด้วยโดยไม่มีใครได้อ่าน (โตขึ้นราว 12 KB/หน้า)
   */
  prevCard?: CardNavRef;
  nextCard?: CardNavRef;
  totalCards: number;
  currentIndex: number;
  /** ไพ่ที่พลังงานใกล้เคียง — Server Component ส่งเข้ามาเพื่อให้ลิงก์อยู่ใน HTML */
  related?: React.ReactNode;
}

const ELEMENT_EN: Record<string, string> = {
  ไฟ: "Fire",
  น้ำ: "Water",
  ลม: "Air",
  ดิน: "Earth",
};

export const CardDetailView: React.FC<CardDetailViewProps> = ({
  card,
  prevCard,
  nextCard,
  totalCards,
  currentIndex,
  related,
}) => {
  const { isEnglish } = useLocale();

  /*
   * 🔇 หน้านี้ "ไม่ hydrate" แล้ว — ทั้ง 174 หน้าเคยโหลด React 184 KB เพียงเพื่อสวิตช์
   * หัวตั้ง/หัวกลับสองปุ่ม · ตอนนี้เรนเดอร์เนื้อหาทั้งสองหัวไพ่ลง HTML แล้วสลับด้วย
   * แอตทริบิวต์ `data-orientation` บนกล่องนอกสุด (CSS ซ่อนอีกฝั่ง) โดยสคริปต์
   * `astro/scripts/card-orientation.ts` ขนาดไม่ถึง 1 KB
   *
   * ผลพลอยได้ที่สำคัญ: ความหมาย "ไพ่หัวกลับ" ของทั้ง 78 ใบ **ไม่เคยอยู่ใน HTML มาก่อนเลย**
   * (เรนเดอร์เฉพาะหัวที่เลือกอยู่) Google จึงไม่เคยเห็น — ตอนนี้เห็นครบทั้งสองหัว
   *
   * ⚠️ ห้ามใส่ `useState` กลับเข้ามาเพื่อสลับหัวไพ่ — มันจะลาก React กลับมาทั้งก้อน
   */
  const kwEn = CARD_KEYWORDS_EN[card.id];
  const keywordsByOrientation = {
    upright: isEnglish && kwEn ? kwEn.upright : card.keywords.upright,
    reversed: isEnglish && kwEn ? kwEn.reversed : card.keywords.reversed,
  } as const;
  const orientations = [
    {
      key: "upright" as const,
      headingKeywords: isEnglish ? "Symbols & Keywords (Upright)" : "สัญลักษณ์และคีย์เวิร์ด (ไพ่หัวตั้ง)",
      headingMeanings: isEnglish ? "5 Dimensions of Meaning (Upright)" : "ความหมายและการทำนาย 5 ด้าน (หัวตั้ง)",
    },
    {
      key: "reversed" as const,
      headingKeywords: isEnglish ? "Symbols & Keywords (Reversed)" : "สัญลักษณ์และคีย์เวิร์ด (ไพ่หัวกลับ)",
      headingMeanings: isEnglish ? "5 Dimensions of Meaning (Reversed)" : "ความหมายและการทำนาย 5 ด้าน (หัวกลับ)",
    },
  ];

  const categories = [
    { id: "general" as const, nameTh: "ภาพรวมและเส้นทางชีวิต", nameEn: "Life overview", icon: "", color: "#8F5C1A" },
    { id: "love" as const, nameTh: "ความรักและคนในใจ", nameEn: "Love & Relationships", icon: "", color: "#A6392C" },
    { id: "work" as const, nameTh: "การงานและโครงการ", nameEn: "Career & Ambitions", icon: "", color: "#6F5B4A" },
    { id: "money" as const, nameTh: "การเงินและโชคลาภ", nameEn: "Finances & Abundance", icon: "", color: "#3A7044" },
    { id: "self" as const, nameTh: "จิตวิทยาและการเติบโตภายใน", nameEn: "Psychology & Inner Growth", icon: "", color: "#6F5B4A" },
  ];

  /* ผังที่ปุ่มเปิดไพ่พาไป — ปุ่มหลักกับแถบติดล่างจอต้องไปที่เดียวกัน */
  const readHref =
    card.suit === "cups" || card.id === "major-06"
      ? "/read/how-they-feel"
      : card.suit === "wands" || card.suit === "pentacles"
        ? "/read/career"
        : "/read/three-card";

  const yesNoLabel = card.yesNo
    ? isEnglish
      ? card.yesNo === "yes"
        ? "Yes"
        : card.yesNo === "no"
          ? "No"
          : "Uncertain"
      : card.yesNo === "yes"
        ? "ใช่ (Yes)"
        : card.yesNo === "no"
          ? "ไม่ใช่ (No)"
          : "ไม่แน่ชัด (Maybe)"
    : null;
  const facts: Array<{ k: string; v: string; tone?: string }> = [
    {
      k: isEnglish ? "Arcana" : "สำรับ",
      v: card.arcana === "major" ? `Major Arcana · #${card.number}` : `${card.suit} Suit`,
    },
    { k: isEnglish ? "Element" : "ธาตุ", v: isEnglish ? ELEMENT_EN[card.element] || card.element : `ธาตุ${card.element}` },
    ...(card.astrology ? [{ k: isEnglish ? "Astrology" : "โหราศาสตร์", v: isEnglish && card.astrologyEn ? card.astrologyEn : card.astrology }] : []),
    ...(yesNoLabel ? [{ k: "Yes/No", v: yesNoLabel, tone: card.yesNo }] : []),
  ];

  /*
   * v2 (เจ้าของ 2026-10-16 "สร้างใหม่เลย") — เวทีไพ่แบบพิพิธภัณฑ์
   * คอม: ชื่อไพ่ซ้าย · ไพ่ใบใหญ่บนแท่นกลาง · ป้ายข้อมูลขวา ➔ แถบคีย์เวิร์ด ➔ ใช่/ไม่ใช่ ➔ ห้องความหมาย 5 ห้อง (สีประจำเรื่อง)
   * มือถือ: ชื่อ ➔ ไพ่ ➔ สวิตช์หัวตั้ง/หัวกลับ ➔ ป้ายข้อมูล
   * ⚠️ คงตะขอของ `astro/scripts/card-orientation.ts` ครบ: data-card-detail · data-orientation · data-orientation-set · data-when · data-read-cta · data-read-sticky
   */
  return (
    <div
      data-card-detail=""
      data-orientation="upright"
      data-card-id={card.id}
      data-card-name={isEnglish ? card.nameEn : card.nameTh}
      data-card-element={isEnglish ? ELEMENT_EN[card.element] || card.element : card.element}
      data-suit={card.arcana === "major" ? "major" : (card.suit ?? "major")}
      className="v2-cd w-full relative z-10"
    >
      <section className="v2-cd-stage">
        <div className="v2-cd-name">
          <p className="v2-cd-eyebrow">
            <span>{card.arcana === "major" ? `Major Arcana · ${card.number}` : `${card.suit} Suit`}</span>
            <span className="v2-cd-count">
              {currentIndex + 1} / {totalCards}
            </span>
          </p>
          <h1 className="v2-cd-title">
            <ThaiPhrases>{isEnglish ? card.nameEn : card.nameTh}</ThaiPhrases>
          </h1>
          {!isEnglish && card.nameEn && <p className="v2-cd-en">{card.nameEn}</p>}
          <p className="v2-cd-lede">{isEnglish && card.numerologyEn ? card.numerologyEn : card.numerology}</p>
        </div>

        <div className="v2-cd-center">
          <div className="ui2-cd-stage relative group">
            <span className="ui2-cd-rays" aria-hidden="true" />
            <span className="ui2-cd-plinth" aria-hidden="true" />
            <div className="altar-panel relative w-64 sm:w-72 aspect-[7/12] !rounded-xl overflow-hidden p-1.5">
              <div className="glass-tile relative w-full h-full !rounded-lg overflow-hidden">
                <div className="w-full h-full card-orientation-flip">
                  <CardImage
                    image={card.image}
                    cardId={card.id}
                    alt={
                      isEnglish
                        ? `${card.nameEn} tarot card face — 1909 Rider-Waite`
                        : `ภาพหน้าไพ่ ${card.nameTh} (${card.nameEn}) 1909 Rider-Waite`
                    }
                    className="w-full h-full object-cover tarot-card-enhance tarot-hd-card-image"
                    sizes="(min-width: 640px) 288px, 256px"
                    loading="eager"
                    fetchPriority="high"
                  />
                </div>
                <div className="gold-foil-sheen absolute inset-0 opacity-15 group-hover:opacity-30 transition-opacity pointer-events-none" />
              </div>
            </div>
          </div>

          {/* สวิตช์หัวตั้ง/หัวกลับ — ใหญ่ กดง่าย (v1 ชิปเล็ก 12px) */}
          <div className="v2-cd-flip" role="group" aria-label={isEnglish ? "Card orientation" : "ทิศของไพ่"}>
            <button type="button" data-orientation-set="upright" aria-pressed="true" className="orientation-tab v2-cd-flip-btn">
              {isEnglish ? "Upright" : "ไพ่หัวตั้ง"}
            </button>
            <button type="button" data-orientation-set="reversed" aria-pressed="false" className="orientation-tab v2-cd-flip-btn">
              {isEnglish ? "Reversed" : "ไพ่หัวกลับ"}
            </button>
          </div>
        </div>

        {/* ป้ายข้อมูลแบบพิพิธภัณฑ์ */}
        <aside className="v2-cd-placard" aria-label={isEnglish ? "Card facts" : "ข้อมูลไพ่"}>
          <dl>
            {facts.map((f) => (
              <div key={f.k} data-tone={f.tone}>
                <dt>{f.k}</dt>
                <dd>{f.v}</dd>
              </div>
            ))}
          </dl>
          <Link href={readHref} data-read-cta="" className="ui2-btn v2-cd-go">
            {isEnglish ? "Open Interactive Tarot Reading" : "เปิดไพ่พยากรณ์จริงกับแม่หมอ AI"}
          </Link>
          <Link href="/spreads" className="v2-cd-sub">
            {isEnglish ? "Explore 26 Spreads" : "เลือกผังพยากรณ์ (26 แบบ)"}
          </Link>
        </aside>
      </section>

      {/* คีย์เวิร์ด — ทั้งสองหัวไพ่อยู่ใน HTML · CSS ซ่อนฝั่งที่ไม่ได้เลือก */}
      {orientations.map((o) => (
        <div key={o.key} data-when={o.key} className="v2-cd-kw">
          <h2>{o.headingKeywords}</h2>
          <ul>
            {keywordsByOrientation[o.key].map((kw, i) => (
              <li key={i}>{kw}</li>
            ))}
          </ul>
        </div>
      ))}

      <div className="v2-cd-yesno">
        <CardYesNoAnswer card={card} isEnglish={isEnglish} />
      </div>

      {/* ห้องความหมาย 5 ห้อง — ทั้งสองหัวไพ่อยู่ใน HTML ครบ (SEO) */}
      {orientations.map((o) => (
        <section key={o.key} data-when={o.key} className="v2-cd-rooms">
          <h2 className="v2-cd-h2">
            <ThaiPhrases>{o.headingMeanings}</ThaiPhrases>
          </h2>
          <div className="v2-cd-room-grid">
            {categories.map((cat) => {
              const interp = isEnglish && card.meaningsEn ? card.meaningsEn[cat.id] : card.meanings[cat.id];
              const text = o.key === "upright" ? interp?.upright : interp?.reversed;
              return (
                <article key={cat.id} className="v2-cd-room" data-room={cat.id}>
                  <h3>
                    <ThaiPhrases>{isEnglish ? cat.nameEn : cat.nameTh}</ThaiPhrases>
                  </h3>
                  <p>{text || (isEnglish ? "This meaning is still being written" : "กำลังรวบรวมคำแปลมิตินี้")}</p>
                </article>
              );
            })}
          </div>
        </section>
      ))}

      {/* ถามไพ่ใบนี้ */}
      <section className="v2-cd-ask">
        <div>
          <p className="v2-cd-ask-k">{isEnglish ? "Your turn" : "ถึงตาคุณ"}</p>
          <h2>
            <ThaiPhrases>{isEnglish ? `Ask ${card.nameEn} your question` : `ไพ่${card.nameTh}ตอบเรื่องของคุณได้`}</ThaiPhrases>
          </h2>
          <p>{isEnglish ? "Shuffle and pick them yourself" : "สับและเลือกไพ่ด้วยมือคุณเอง"}</p>
        </div>
        <Link href={readHref} className="ui2-btn v2-cd-go">
          {isEnglish ? "Draw now" : "เปิดไพ่เลย"}
        </Link>
      </section>

      {related}

      {/* ใบก่อนหน้า / ถัดไป */}
      <nav className="v2-cd-nav" aria-label={isEnglish ? "Previous and next card" : "ไพ่ใบก่อนหน้าและถัดไป"}>
        {prevCard ? (
          <Link href={`/cards/${prevCard.id}`} className="v2-cd-nav-a is-prev">
            <span className="v2-cd-nav-img">
              <CardImage image={prevCard.image} cardId={prevCard.id} alt="" className="w-full h-full object-cover tarot-hd-card-image" sizes="56px" />
            </span>
            <span>
              <small>{isEnglish ? "Previous Card" : "ใบก่อนหน้า"}</small>
              <b>{isEnglish ? prevCard.nameEn : prevCard.nameTh}</b>
            </span>
          </Link>
        ) : (
          <span />
        )}
        {nextCard ? (
          <Link href={`/cards/${nextCard.id}`} className="v2-cd-nav-a is-next">
            <span>
              <small>{isEnglish ? "Next Card" : "ใบถัดไป"}</small>
              <b>{isEnglish ? nextCard.nameEn : nextCard.nameTh}</b>
            </span>
            <span className="v2-cd-nav-img">
              <CardImage image={nextCard.image} cardId={nextCard.id} alt="" className="w-full h-full object-cover tarot-hd-card-image" sizes="56px" />
            </span>
          </Link>
        ) : (
          <span />
        )}
      </nav>

      {/* แถบ "เปิดไพ่เลย" ติดล่างจอ (มือถือ) — สคริปต์ card-orientation.ts สลับ data-visible */}
      <div
        data-read-sticky=""
        data-visible="false"
        inert
        className="lg:hidden fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 flex items-center gap-3 rounded-2xl border border-line bg-surface py-2.5 pl-3 pr-2.5 shadow-[0_12px_32px_-12px_rgba(42,38,31,0.35)] translate-y-[160%] opacity-0 transition-[transform,opacity] duration-300 data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100 motion-reduce:transition-none print:hidden"
      >
        <span className="relative block w-[30px] h-12 shrink-0 overflow-hidden rounded-[4px] border border-line">
          <CardImage image={card.image} cardId={card.id} alt="" sizes="30px" thumb loading="lazy" className="w-full h-full object-cover" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-serif-th text-[13.5px] font-bold leading-snug text-ink">
            {isEnglish ? `Ask ${card.nameEn} your question` : `ไพ่${card.nameTh}ตอบเรื่องของคุณได้`}
          </span>
          <span className="block text-[11.5px] leading-snug text-muted">
            {isEnglish ? "Shuffle and pick them yourself" : "สับและเลือกไพ่ด้วยมือคุณเอง"}
          </span>
        </span>
        <Link
          href={readHref}
          className="btn-gold-glass shrink-0 whitespace-nowrap px-4 py-2.5 text-[13px] font-serif-th font-bold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-ink"
        >
          {isEnglish ? "Draw now" : "เปิดไพ่เลย"}
        </Link>
      </div>
    </div>
  );
};
