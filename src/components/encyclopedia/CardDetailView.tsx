"use client";

import React from "react";
// ลิงก์ภายในต้องอยู่ในต้นไม้ภาษาเดียวกับหน้าที่ผู้ใช้ยืนอยู่ — ดู src/components/ui/LocaleLink.tsx
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import type { TarotCard } from "@/data/cards/types";
import { CARD_KEYWORDS_EN } from "@/data/cards/keywords-en";
import { CardImage } from "@/components/card/CardImage";
import { CardYesNoAnswer } from "./CardYesNoAnswer";
import { useLocale } from "@/lib/i18n";

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

const ELEMENT_CONFIG: Record<string, { border: string; glow: string; text: string; bg: string; icon: string }> = {
  ไฟ: {
    border: "border-gold-ink/40",
    glow: "rgba(143, 92, 26, 0.12)",
    text: "text-gold-ink",
    bg: "bg-gold-ink/15",
    icon: "•",
  },
  น้ำ: {
    border: "border-ink-soft/40",
    glow: "rgba(143, 92, 26, 0.12)",
    text: "text-muted",
    bg: "bg-ink-soft/15",
    icon: "•",
  },
  ลม: {
    border: "border-ink-soft/40",
    glow: "rgba(143, 92, 26, 0.12)",
    text: "text-muted",
    bg: "bg-ink-soft/15",
    icon: "•",
  },
  ดิน: {
    border: "border-ok/40",
    glow: "rgba(143, 92, 26, 0.12)",
    text: "text-ok",
    bg: "bg-ok/15",
    icon: "•",
  },
};

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
  const elem = ELEMENT_CONFIG[card.element] || ELEMENT_CONFIG["ไฟ"];
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
    { id: "general" as const, nameTh: "ภาพรวมและเส้นทางชีวิต", nameEn: "Life Overview & Archetypal Journey", icon: "•", color: "#8F5C1A" },
    { id: "love" as const, nameTh: "ความรักและคนในใจ", nameEn: "Love & Relationships", icon: "•", color: "#A6392C" },
    { id: "work" as const, nameTh: "การงานและโครงการ", nameEn: "Career & Ambitions", icon: "•", color: "#6F5B4A" },
    { id: "money" as const, nameTh: "การเงินและโชคลาภ", nameEn: "Finances & Abundance", icon: "◆", color: "#3A7044" },
    { id: "self" as const, nameTh: "จิตวิทยาและการเติบโตภายใน", nameEn: "Psychology & Inner Growth", icon: "•", color: "#6F5B4A" },
  ];

  return (
      <div
        data-card-detail=""
        data-orientation="upright"
        data-card-id={card.id}
        /* ⚠️ ค่าที่ส่งให้สถิติต้องเป็น "ภาษาของหน้าที่ผู้ใช้ยืนอยู่" เสมอ
           ตอนแรกเขียนเป็น `card.nameTh` / `card.element` ตรง ๆ แล้วด่านภาษาอังกฤษจับได้ทันที
           ว่ามีอักษรไทยหลุดเข้า HTML ของหน้าอังกฤษ (แม้จะอยู่ในแอตทริบิวต์ก็ตาม)
           `card_id` เป็นกุญแจที่ไม่ขึ้นกับภาษาอยู่แล้ว รายงานจึงยังรวมสองภาษาเข้าด้วยกันได้ */
        data-card-name={isEnglish ? card.nameEn : card.nameTh}
        data-card-element={isEnglish ? ELEMENT_EN[card.element] || card.element : card.element}
        className="space-y-8 w-full max-w-5xl mx-auto relative z-10"
      >
      {/* Top Header Bar — Card Counter */}
      <div className="flex items-center justify-end border-b border-line/40 pb-4 text-xs font-mono">
        <span className="text-muted">
          {isEnglish ? "Card " : "ลำดับที่ "}<strong className="text-gold">{currentIndex + 1}</strong> / {totalCards}
        </span>
      </div>

      {/* Main Showcase Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Column: 3D Showcase Card & Orientation Controller */}
        <div className="md:col-span-5 lg:col-span-4 flex flex-col items-center space-y-5">
          {/* 3D Sacred Card Container */}
          <div className="relative group">
            {/* ใส่คลาสอนิเมชันเฉพาะหลัง mount — เรนเดอร์แรกฝั่งเซิร์ฟเวอร์ต้องออกมา
                ที่สถานะปลายทางเสมอ ไม่งั้นภาพไพ่ซึ่งเป็น LCP ของหน้าถูกส่งไปแบบ opacity 0 */}
            <div className="altar-panel relative w-64 sm:w-72 aspect-[7/12] !rounded-xl overflow-hidden p-1.5">
              <div className="glass-tile relative w-full h-full !rounded-lg overflow-hidden">
                <div className="w-full h-full card-orientation-flip">
                  <CardImage
                    image={card.image}
                    cardId={card.id}
                    alt={
                      isEnglish
                        ? `${card.nameEn} tarot card face \u2014 1909 Rider-Waite`
                        : `ภาพหน้าไพ่ ${card.nameTh} (${card.nameEn}) 1909 Rider-Waite`
                    }
                    className="w-full h-full object-cover tarot-card-enhance tarot-hd-card-image"
                    /* กรอบจริงคือ w-64 / sm:w-72 = 256 / 288 CSS px — เดิมประกาศ 400/600px
                       ทำให้เบราว์เซอร์เลือกไฟล์ใหญ่เกินความจำเป็นไปหนึ่งขั้น */
                    sizes="(min-width: 640px) 288px, 256px"
                    loading="eager"
                    fetchPriority="high"
                  />
                </div>
                <div className="gold-foil-sheen absolute inset-0 opacity-15 group-hover:opacity-30 transition-opacity pointer-events-none" />

                {/* Top Floating Badge */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                  <span className="text-[13px] font-mono font-bold px-2 py-0.5 rounded bg-gold-ink text-white">
                    {card.arcana === "major" ? `Major #${card.number}` : card.suit?.toUpperCase()}
                  </span>
                  <span
                    className={`text-[13px] font-mono px-2 py-0.5 rounded border ${elem.border} ${elem.bg} ${elem.text} font-bold`}
                  >
                    {elem.icon} {isEnglish ? ELEMENT_EN[card.element] || card.element : card.element}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Upright / Reversed Orientation Switcher */}
          <div className="glass-chip flex items-center justify-center p-1 w-full max-w-xs select-none">
            <button
              type="button"
              data-orientation-set="upright"
              aria-pressed="true"
              className="orientation-tab tap-overlay-y flex-1 py-2 text-xs font-serif-th font-bold rounded-full transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isEnglish ? "Upright (Standard)" : "ไพ่หัวตั้ง (ปกติ)"}
            </button>
            <button
              type="button"
              data-orientation-set="reversed"
              aria-pressed="false"
              className="orientation-tab tap-overlay-y flex-1 py-2 text-xs font-serif-th font-bold rounded-full transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span aria-hidden="true">↻</span> {isEnglish ? "Reversed" : "ไพ่หัวกลับ"}
            </button>
          </div>

          {/* Astrological & Numerological Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono">
            <span className={`px-3 py-1 rounded-full border ${elem.border} ${elem.bg} ${elem.text} font-bold`}>
              {isEnglish ? `Element: ${ELEMENT_EN[card.element] || card.element}` : `ธาตุ${card.element}`}
            </span>
            {card.astrology && (
              <span className="glass-chip px-3 py-1 text-ink">
                {isEnglish && card.astrologyEn ? card.astrologyEn : card.astrology}
              </span>
            )}
            {card.yesNo && (
              <span
                className={`px-3 py-1 rounded-full border font-bold ${
                  card.yesNo === "yes"
                    ? "border-ok/40 bg-[#EBF3ED] text-ok"
                    : card.yesNo === "no"
                      ? "border-err/40 bg-err-wash text-err"
                      : "border-line bg-inset text-gold"
                }`}
              >
                Yes/No: {isEnglish ? (card.yesNo === "yes" ? "Yes" : card.yesNo === "no" ? "No" : "Uncertain") : (card.yesNo === "yes" ? "ใช่ (Yes)" : card.yesNo === "no" ? "ไม่ใช่ (No)" : "ไม่แน่ชัด (Maybe)")}
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Titles, Keywords & Categorized Deep Meanings */}
        <div className="md:col-span-7 lg:col-span-8 space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-gold-ink">
              <span className="glass-chip px-2.5 py-0.5 font-semibold uppercase text-ink">
                {card.arcana === "major" ? "Major Arcana" : `${card.suit} Suit`}
              </span>
              {!isEnglish && card.nameEn && (
                <>
                  <span className="text-muted">|</span>
                  <span className="text-ink font-sans tracking-wide">{card.nameEn}</span>
                </>
              )}
            </div>
            <h1 className="font-serif-th text-3xl sm:text-4xl lg:text-5xl font-bold text-ink leading-tight [text-wrap:balance]">
              {isEnglish ? card.nameEn : card.nameTh}
            </h1>
            <p className="text-xs sm:text-sm text-muted leading-relaxed pt-1 font-serif-th [text-wrap:pretty]">
              {isEnglish && card.numerologyEn ? card.numerologyEn : card.numerology}
            </p>
          </div>

          {/* Keywords Ribbon — มีครบทั้งสองหัวไพ่ใน HTML · CSS ซ่อนฝั่งที่ไม่ได้เลือก */}
          {orientations.map((o) => (
            <div key={o.key} data-when={o.key} className="space-y-2">
              <h2 className="text-[13px] font-mono text-gold-ink uppercase tracking-wider flex items-center gap-1.5 font-bold">
                {o.headingKeywords}
              </h2>
              <div className="flex flex-wrap gap-2">
                {keywordsByOrientation[o.key].map((kw, i) => (
                  <span
                    key={i}
                    className="glass-chip text-xs px-3 py-1.5 text-ink font-serif-th font-semibold"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {/* คำตอบ ใช่/ไม่ใช่ (Yes / No) — พยากรณ์เชิงฟันธงจากข้อมูล 1909 RWS */}
          <CardYesNoAnswer card={card} isEnglish={isEnglish} />

          {/* 5 Categorized Meanings List — ทั้งสองหัวไพ่อยู่ใน HTML ครบ
              (ของเดิมเรนเดอร์เฉพาะหัวที่เลือกอยู่ ความหมาย "หัวกลับ" ของไพ่ทั้ง 78 ใบ
               จึงไม่เคยถูกเครื่องมือค้นหาเห็นเลยสักครั้ง) */}
          {orientations.map((o) => (
            <div key={o.key} data-when={o.key} className="space-y-3.5 pt-2">
              <h2 className="font-serif-th text-base font-bold text-ink flex items-center gap-2">
                {o.headingMeanings}
              </h2>

              <div className="space-y-3">
                {categories.map((cat) => {
                  const interp = isEnglish && card.meaningsEn ? card.meaningsEn[cat.id] : card.meanings[cat.id];
                  const text = o.key === "upright" ? interp?.upright : interp?.reversed;

                  return (
                    <div
                      key={cat.id}
                      className="altar-card-porcelain p-4 sm:p-5 space-y-2 group"
                    >
                      <div className="flex items-center gap-2">
                        <span style={{ color: cat.color }} className="text-sm">
                          {cat.icon}
                        </span>
                        <h3 className="font-serif-th text-xs sm:text-sm font-bold text-ink">{isEnglish ? cat.nameEn : cat.nameTh}</h3>
                      </div>
                      <p className="font-serif-th text-xs sm:text-sm text-ink leading-relaxed pl-4 border-l-2 border-line group-hover:border-gold transition-colors [text-wrap:pretty]">
                        {text || (isEnglish ? "Archetypal insight gathering in progress" : "กำลังรวบรวมคำแปลมิตินี้")}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Action Button: Start Tarot Ritual with this Card */}
          <div className="pt-4 flex items-center gap-4 flex-wrap">
            <Link
              href={
                card.suit === "cups" || card.id === "major-06"
                  ? "/?spread=how-they-feel"
                  : card.suit === "wands" || card.suit === "pentacles"
                    ? "/?spread=career"
                    : "/?spread=three-card"
              }
              className="btn-gold-glass px-7 py-3 text-xs sm:text-sm font-serif-th font-bold flex items-center gap-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-ink"
            >
              {isEnglish ? "Open Interactive Tarot Reading" : "เปิดไพ่พยากรณ์จริงกับแม่หมอ AI"}
            </Link>
            <Link
              href="/spreads"
              className="text-xs sm:text-sm font-serif-th text-muted hover:text-gold-ink transition underline underline-offset-4"
            >
              {isEnglish ? "Explore 25 Spreads →" : "เลือกผังพยากรณ์ (25 แบบ) →"}
            </Link>
          </div>
        </div>
      </div>

      {/* ไพ่ที่พลังงานใกล้เคียง — Server Component ส่งเข้ามาเพื่อให้ลิงก์อยู่ใน HTML ทันที */}
      {related}

      {/* Bottom Previous / Next Card Navigation Bar */}
      <div className="pt-8 border-t border-line/40 flex items-center justify-between gap-4">
        {prevCard ? (
          <Link
            href={`/cards/${prevCard.id}`}
            className="altar-card-porcelain flex items-center gap-3 p-3.5 !rounded-xl group max-w-[48%]"
          >
            <div className="glass-tile w-9 h-14 !rounded-lg overflow-hidden flex-shrink-0">
              <CardImage
                image={prevCard.image}
                cardId={prevCard.id}
                alt=""
                className="w-full h-full object-cover tarot-hd-card-image"
                sizes="36px"
              />
            </div>
            <div className="text-left overflow-hidden">
              <span className="text-[13px] font-mono text-muted block">
                {isEnglish ? "← Previous Card" : "← ใบก่อนหน้า"}
              </span>
              <span className="font-serif-th text-xs sm:text-sm font-bold text-ink group-hover:text-gold-ink truncate block">
                {isEnglish ? prevCard.nameEn : prevCard.nameTh}
              </span>
            </div>
          </Link>
        ) : (
          <div />
        )}

        {nextCard ? (
          <Link
            href={`/cards/${nextCard.id}`}
            className="altar-card-porcelain flex items-center gap-3 p-3.5 !rounded-xl group max-w-[48%] text-right"
          >
            <div className="text-right overflow-hidden">
              <span className="text-[13px] font-mono text-muted block">
                {isEnglish ? "Next Card →" : "ใบถัดไป →"}
              </span>
              <span className="font-serif-th text-xs sm:text-sm font-bold text-ink group-hover:text-gold-ink truncate block">
                {isEnglish ? nextCard.nameEn : nextCard.nameTh}
              </span>
            </div>
            <div className="glass-tile w-9 h-14 !rounded-lg overflow-hidden flex-shrink-0">
              <CardImage
                image={nextCard.image}
                cardId={nextCard.id}
                alt=""
                className="w-full h-full object-cover tarot-hd-card-image"
                sizes="36px"
              />
            </div>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
};
