"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { STAGGER, DUR, EASE } from "@/lib/motion";
import type { Reading } from "@/lib/schema/reading";
import type { Persona } from "@/data/personas";
import type { DrawnSlotCard } from "@/components/spread/SpreadBoard";
import { cardByIndex, type TarotCard } from "@/data/cards";
import { ElementalBalanceWidget } from "@/components/reading/ElementalBalanceWidget";
import { OracleMantraCard } from "@/components/reading/OracleMantraCard";
import { trackEvent } from "@/lib/analytics";
import { AccuracyRatingWidget } from "./AccuracyRatingWidget";
import { ProvablyFairPanel } from "./ProvablyFairPanel";
import { CollapsibleCard } from "./CollapsibleCard";
import { CardImage } from "@/components/card/CardImage";
import { TTSReaderButton } from "./TTSReaderButton";
import { useLocale } from "@/lib/i18n";
import { resolveDisplayKeywords } from "@/lib/tarot/keywords";

interface StreamReaderProps {
  reading?: Partial<Reading> | null;
  persona: Persona;
  isStreaming: boolean;
  activeCardIndex: number;
  onSelectCardIndex: (index: number) => void;
  drawnCards: DrawnSlotCard[];
  readingId?: string | null;
  proof?: {
    serverSeed?: string;
    clientSeed?: string;
    commitment?: string;
    pickedIndices?: number[];
    deckSize?: number;
  };
  errorMsg?: string | null;
  question?: string;
  nickname?: string;
  onRetry?: () => void;
}

export const StreamReader: React.FC<StreamReaderProps> = ({
  reading,
  persona,
  isStreaming,
  activeCardIndex,
  onSelectCardIndex,
  drawnCards,
  readingId,
  proof,
  errorMsg,
  question,
  nickname,
  onRetry,
}) => {
  const { isEnglish } = useLocale();
  const [activeTab, setActiveTab] = useState<"card" | "summary">("card");
  // การอ่านออกเสียงย้ายไปอยู่ใน <TTSReaderButton /> ทั้งหมดแล้ว
  // (ของเดิมเหลือ state + handler ค้างไว้ที่นี่โดยไม่มีปุ่มไหนเรียกใช้)

  const activeDrawnCard = drawnCards.find((d) => d.order === activeCardIndex);
  // ไพ่เต็มจากสำรับมาก่อนเสมอ (มีฟิลด์ภาษาอังกฤษครบ) แล้วค่อยตกมาที่ก้อนย่อจากเซสชัน
  // ของเดิมสลับลำดับกัน ทำให้โหมด EN ได้ก้อนย่อที่มีแต่ภาษาไทย — ตรงกับ `allCards` ด้านล่างแล้ว
  const cardData =
    (activeDrawnCard && activeDrawnCard.cardIndex !== undefined
      ? cardByIndex(activeDrawnCard.cardIndex)
      : undefined) || activeDrawnCard?.card;
  const activeCardReading = reading?.cards?.find((c) => c.position === activeCardIndex);

  const allCards = useMemo(() => {
    try {
      return drawnCards
        .map((d) => (d.cardIndex !== undefined ? cardByIndex(d.cardIndex) : (d.card as unknown as TarotCard)))
        .filter((c): c is TarotCard => !!c);
    } catch {
      return [];
    }
  }, [drawnCards]);

  const totalCards = drawnCards.length;

  return (
    <div className="w-full rounded-lg border border-line-warm bg-surface p-5 sm:p-7 flex flex-col justify-between space-y-6 relative overflow-hidden">
      {/* Background Sacred Geometric Aura */}

      {/* Oracle Guide Header & Streaming Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-line-warm/30">
        <div className="flex items-center gap-3.5">
          {/* Authentic 1909 Tarot Card Persona Avatar */}
          <div
            className="w-10 h-15 rounded-lg border-2 overflow-hidden bg-inset-warm relative flex-shrink-0"
            style={{ borderColor: "#D9C8AC" }}
          >
            <CardImage
              image={`${persona.cardImage || (persona.id === "direct" ? "major-11.jpg" : persona.id === "mystic" ? "major-17.jpg" : "major-02.jpg")}`}
              /* ภาพประกอบล้วน — ข้อความข้าง ๆ บอกชื่อเดียวกันอยู่แล้ว (INC-0125) — <h4> ข้างภาพพิมพ์ชื่อแม่หมออยู่แล้ว */
              alt=""
              className="w-full h-full object-cover object-top filter contrast-[1.05] brightness-[1.02] tarot-hd-card-image"
              sizes="40px"
            />
            <div className="gold-foil-sheen absolute inset-0 opacity-20" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-serif-th text-base font-bold font-mystic-gold">{isEnglish ? (persona.nameEn || persona.nameTh) : persona.nameTh}</h4>
            </div>
            <p className="text-xs text-muted mt-0.5">{isEnglish ? (persona.taglineEn || persona.tagline) : persona.tagline}</p>
          </div>
        </div>

        {/* Live Status Pill */}
        {isStreaming ? (
          <span className="text-xs font-semibold bg-inset-warm text-ink-deep border border-line-warm px-3.5 py-1.5 rounded-full flex items-center gap-2 ">
            <span className="w-2.5 h-2.5 rounded-full bg-gold-ink animate-ping" /> {isEnglish ? "Oracle is channeling the tarot..." : "แม่หมอกำลังอ่านคำทำนาย..."}
          </span>
        ) : (
          <span className="text-xs font-semibold bg-[#EBF3ED] text-ok border border-ok/30 px-3.5 py-1.5 rounded-full flex items-center gap-2 ">
            <span className="w-2 h-2 rounded-full bg-[#EBF3ED]" /> {isEnglish ? "Interpretation complete" : "อ่านคำทำนายครบถ้วนแล้ว"}
          </span>
        )}
      </div>

      {/* Querent Sacred Question Banner */}
      {question && (
        <div className="anim-page-transition p-4 rounded-xl bg-surface-warm border border-line-warm space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-gold-ink font-serif-th font-semibold">
            <span>{isEnglish ? "Your Sacred Question" : "คำถามที่คุณตั้งจิตถาม"}</span>
            {nickname && (
              <span className="text-muted font-normal">
                {isEnglish ? `Querent: ${nickname}` : `ผู้รับคำทำนาย: ${nickname}`}
              </span>
            )}
          </div>
          <p className="text-sm sm:text-base font-serif-th text-ink-deep font-medium leading-relaxed italic">
            “{question}”
          </p>
        </div>
      )}

      {/* World-Class Chamber Navigation Tabs */}
      <div
        role="tablist"
        aria-label={isEnglish ? "Tarot interpretation sections" : "ส่วนแสดงผลคำทำนาย"}
        className="flex items-center gap-2 border-b border-line-warm/30 pb-2 overflow-x-auto no-scrollbar"
      >
        <button
          type="button"
          role="tab"
          id="chamber-tab-card"
          aria-selected={activeTab === "card"}
          aria-controls="chamber-panel-card"
          onClick={() => setActiveTab("card")}
          className={`tap-overlay-y px-4 py-2 rounded-lg text-xs font-serif-th font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink ${
            activeTab === "card"
              ? "bg-gold-ink text-surface"
              : "bg-inset-warm text-ink-deep hover:text-gold-ink border border-line-warm"
          }`}
        >
          
          <span>
            {isEnglish ? `Card Analysis (${activeCardIndex + 1}/${totalCards})` : `อ่านรายใบ (${activeCardIndex + 1}/${totalCards})`}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          id="chamber-tab-summary"
          aria-selected={activeTab === "summary"}
          aria-controls="chamber-panel-summary"
          onClick={() => setActiveTab("summary")}
          className={`tap-overlay-y px-4 py-2 rounded-lg text-xs font-serif-th font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink ${
            activeTab === "summary"
              ? "bg-gold-ink text-surface"
              : "bg-inset-warm text-ink-deep hover:text-gold-ink border border-line-warm"
          }`}
        >
          
          <span>{isEnglish ? "Overview & Guidance" : "สรุปภาพรวม & คำแนะนำ"}</span>
        </button>
      </div>

      {/* ทางลัดเปิดห้องแชทเต็มจอกับแม่หมอ (หน้า /reading/chat) */}
      {readingId && (
        <Link
          href="/reading/chat"
          className="group flex w-full items-center justify-between gap-3 rounded-lg border border-line-warm bg-inset-warm px-4 py-3 text-left transition hover:border-gold-ink hover:bg-surface cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
        >
          <span className="min-w-0">
            <span className="block font-serif-th text-xs font-bold text-ink-deep sm:text-sm [text-wrap:balance]">
              {isEnglish ? "Have more questions for your reader?" : "มีอะไรอยากถามแม่หมอต่อไหม"}
            </span>
            <span className="mt-0.5 block font-serif-th text-[13px] leading-relaxed text-muted [text-wrap:pretty]">
              {isEnglish
                ? "Open full-screen interactive consultation to delve deeper into these drawn cards."
                : "เปิดห้องแชทเต็มจอ พิมพ์ถามเจาะลึกต่อกับแม่หมอได้ทันที"}
            </span>
          </span>
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-line-warm text-gold-ink transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      )}

      {/* Error / Recovery Banner — โทนทองอุ่น ไม่ใช่แดงตกใจ · ซ่อนปุ่มลองใหม่เมื่อเป็นเรื่องโควตา */}
      {errorMsg &&
        (() => {
          const isQuota = /สมัครสมาชิก|เติมรอบ|โควตา|สิทธิ์|quota|credit|member/i.test(errorMsg);
          return (
            <div
              role="alert"
              aria-live="assertive"
              className="anim-page-transition p-4 rounded-lg bg-surface border border-line-warm flex flex-col sm:flex-row sm:items-center justify-between gap-3 "
            >
              <div className="flex items-start gap-2.5 text-xs sm:text-sm text-ink-deep font-serif-th">
                
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
              {onRetry && !isQuota && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="tap-overlay-y self-end sm:self-auto px-5 py-2 rounded-full bg-gold-ink hover:bg-gold-ink-deep text-surface text-xs font-bold font-serif-th cursor-pointer active:scale-95 transition flex items-center gap-1.5 whitespace-nowrap flex-shrink-0"
                >
                  {isEnglish ? (/reload|not found/i.test(errorMsg) ? "Reload Reading" : "Retry Reading") : (/โหลดใหม่อีกครั้ง|ไม่พบข้อมูล/.test(errorMsg) ? "โหลดใหม่อีกครั้ง" : "ลองอ่านใหม่")}
                </button>
              )}
            </div>
          );
        })()}

      {/* TAB 1: CARD-BY-CARD INSPECTION VIEW */}
      {activeTab === "card" && (
        <div className="space-y-5">
          {/* Card Selector Pills — ตัดบรรทัดลงมา (flex-wrap) ไม่ใช่เลื่อนแนวนอน
              เพราะผังใหญ่ ๆ ปุ่มใบท้าย ๆ จะหลุดออกนอกกรอบจนกดไม่ถึง (คำร้องเจ้าของโปรเจกต์) */}
          <div className="flex flex-wrap items-center gap-1.5 pb-1">
            {drawnCards.map((d, i) => (
              <button
                key={d.order}
                type="button"
                aria-pressed={activeCardIndex === d.order}
                onClick={() => onSelectCardIndex(d.order)}
                className={`tap-overlay-y px-3 py-1.5 rounded-lg text-xs font-serif-th font-semibold transition cursor-pointer flex max-w-full items-center gap-1.5 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink ${
                  activeCardIndex === d.order
                    ? "bg-gold-ink text-surface font-bold"
                    : "bg-inset-warm text-ink-deep hover:bg-surface border border-line-warm"
                }`}
              >
                <span className="whitespace-nowrap">{isEnglish ? `Card ${i + 1}` : `ใบที่ ${i + 1}`}</span>
                {(() => {
                  const card = d.card || (d.cardIndex !== undefined ? cardByIndex(d.cardIndex) : undefined);
                  return card ? (
                    <span className="min-w-0 truncate text-[13px] font-normal opacity-80">
                      ({isEnglish ? (card.nameEn || card.nameTh) : card.nameTh})
                    </span>
                  ) : null;
                })()}
              </button>
            ))}
          </div>

          {/* Active Card Interpretation Showcase */}
          <div
            key={activeCardIndex}
            className="anim-page-transition p-5 sm:p-6 rounded-lg bg-surface border border-line-warm space-y-4"
          >
            {/* Position & Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-line-warm/30">
              <div className="flex items-center gap-3.5">
                {/* Real 1909 Rider-Waite Thumbnail */}
                <div
                  className={`w-14 h-[95px] rounded-lg overflow-hidden border border-line-warm flex-shrink-0 ${activeDrawnCard?.isReversed ? "rotate-180" : ""}`}
                >
                  {cardData?.image ? (
                    <CardImage
                      image={cardData.image}
                      /* ภาพประกอบล้วน — ข้อความข้าง ๆ บอกชื่อเดียวกันอยู่แล้ว (INC-0125) — <h4> ข้างภาพพิมพ์ชื่อไพ่ใบเดียวกันอยู่แล้ว */
                      alt=""
                      className="w-full h-full object-cover object-center tarot-card-enhance tarot-hd-card-image"
                      sizes="88px"
                    />
                  ) : (
                    <div className="w-full h-full bg-inset-warm flex flex-col items-center justify-center text-center p-1 border border-dashed border-line-warm">
                      
                      <span className="text-xs text-muted font-serif-th mt-0.5 leading-normal">
                        {isEnglish ? "Not Found" : "ไม่พบข้อมูล"}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[13px] text-gold-ink font-serif-th font-semibold">
                    {
isEnglish
                        ? `Position ${activeCardIndex + 1}: ${activeDrawnCard?.position.nameEn || activeDrawnCard?.position.nameTh || "Energy Point"}`
                        : `ตำแหน่งที่ ${activeCardIndex + 1}: ${activeDrawnCard?.position.nameTh || "ตำแหน่งพลังงาน"}`}
                  </span>
                  <h4 className="font-serif-th text-lg sm:text-xl font-bold text-ink-deep mt-0.5">
                    {cardData ? (
                      <>
                        {isEnglish ? (cardData.nameEn || cardData.nameTh) : cardData.nameTh}{" "}
                        {!isEnglish && cardData.nameEn && (
                          <span className="text-xs font-mono font-normal text-muted">({cardData.nameEn})</span>
                        )}{" "}
                        <span className="text-xs font-serif-th font-semibold text-gold-ink">
                          {activeDrawnCard?.isReversed
                            ? (isEnglish ? "· Reversed" : "· ไพ่กลับหัว")
                            : (isEnglish ? "· Upright" : "· ไพ่หัวตั้ง")}
                        </span>
                      </>
                    ) : (
                      <span className="text-err text-sm font-normal">
                        {isEnglish ? "Card data not found (Please reload)" : "ไม่พบข้อมูลไพ่ (กรุณากดโหลดใหม่อีกครั้ง)"}
                      </span>
                    )}
                  </h4>
                </div>
              </div>

              {/* Elemental & Meaning Tag */}
              {(activeDrawnCard?.position.meaningEn || activeDrawnCard?.position.meaning) && (
                <span className="text-[13px] text-ink-deep bg-inset-warm/25 border border-line-warm px-2.5 py-1 rounded-full font-serif-th self-start sm:self-auto">
                  {isEnglish
                    ? (activeDrawnCard.position.meaningEn || activeDrawnCard.position.meaning)
                    : (activeDrawnCard.position.meaning || activeDrawnCard.position.meaningEn)}
                </span>
              )}
            </div>

            {/* Keywords */}
            {(() => {
              const keywords = resolveDisplayKeywords({
                cardId: cardData?.id,
                keywords: cardData?.keywords,
                keywordsEn: (cardData as any)?.keywordsEn,
                isReversed: activeDrawnCard?.isReversed,
                isEnglish,
              });

              return keywords.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[13px] text-muted font-serif-th font-semibold">
                    {isEnglish ? "Key Themes:" : "ความหมายหลัก:"}
                  </span>
                  {keywords.map((kw: string, idx: number) => (
                    <span
                      key={idx}
                      className="text-[13px] text-ink-deep bg-inset-warm border border-line-warm px-2 py-0.5 rounded"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              ) : null;
            })()}

            {/* If card data could not be found, show reload prompt instead of fake reading */}
            {!cardData && (
              <div className="p-4 rounded-lg bg-err-wash border border-line-warm text-center space-y-2.5 my-2">
                <p className="text-xs text-err font-serif-th">
                  {isEnglish
                    ? "Card data for this position could not be found. Please reload."
                    : "ไม่พบข้อมูลไพ่สำหรับตำแหน่งนี้ กรุณากดโหลดใหม่อีกครั้ง"}
                </p>
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="tap-overlay-y px-4 py-1.5 rounded-full bg-gold-ink hover:bg-gold-ink-deep text-surface text-xs font-bold font-serif-th shadow cursor-pointer active:scale-95 transition inline-flex items-center gap-1.5"
                  >
                    {isEnglish ? "Reload Reading" : "โหลดใหม่อีกครั้ง"}
                  </button>
                )}
              </div>
            )}

            {/* Interpretation Body */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between gap-2">
                {activeCardReading?.headline && (
                  <h5 className="font-serif-th text-sm font-bold text-ink-deep">{activeCardReading.headline}</h5>
                )}
                {activeCardReading?.reading && (
                  <TTSReaderButton
                    textToRead={`${activeCardReading.headline ? activeCardReading.headline + ". " : ""}${activeCardReading.reading}`}
                    personaId={persona.id}
                    className="ml-auto"
                  />
                )}
              </div>
              {activeCardReading?.visualAnchor && (
                <p className="text-[11px] sm:text-xs text-[#8C7A6B] font-serif-th italic tracking-wide">
                  {isEnglish ? "Card Visual: " : "ภาพบนหน้าไพ่: "}{activeCardReading.visualAnchor}
                </p>
              )}

              {/* P1-M3: Word-by-word oracle streaming animation */}
              {activeCardReading?.reading ? (
                <p
                  key={`oracle-${activeCardIndex}`}
                  className="text-xs sm:text-sm text-ink-deep leading-relaxed font-serif-th font-normal"
                  aria-live="polite"
                  aria-label={isEnglish ? "Oracle's interpretation" : "คำทำนายจากแม่หมอ"}
                >
                  {isStreaming
                    ? activeCardReading.reading.split(" ").map((word, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: DUR.fast,
                            ease: EASE.out,
                            delay: i * STAGGER.tight,
                          }}
                          className="inline-block mr-[0.25em]"
                        >
                          {word}
                        </motion.span>
                      ))
                    : activeCardReading.reading}
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-muted leading-relaxed font-serif-th font-normal italic">
                  {isStreaming
                    ? (isEnglish
                        ? "The oracle is attuning to the energetic currents of this card..."
                        : "แม่หมอกำลังสัมผัสคลื่นพลังงานและเรียบเรียงคำทำนายของไพ่ใบนี้...")
                    : (isEnglish ? "Awaiting oracle revelation" : "รอการเปิดม่านพยากรณ์")}
                </p>
              )}
            </div>

            {/* Next / Prev Card Navigation Arrows */}
            <div className="flex items-center justify-between pt-3 border-t border-line-warm/30 text-xs">
              <button
                type="button"
                onClick={() => onSelectCardIndex(Math.max(0, activeCardIndex - 1))}
                disabled={activeCardIndex === 0}
                className={`tap-overlay-y px-3 py-1.5 rounded-lg border flex items-center gap-1 transition ${
                  activeCardIndex > 0
                    ? "border-line-warm bg-surface text-ink-deep hover:bg-surface-warm hover:border-gold-ink cursor-pointer"
                    : "border-transparent text-muted cursor-not-allowed"
                }`}
              >
                <span>{isEnglish ? "← Previous Card" : "← ใบก่อนหน้า"}</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectCardIndex(Math.min(totalCards - 1, activeCardIndex + 1))}
                disabled={activeCardIndex === totalCards - 1}
                className={`tap-overlay-y px-3 py-1.5 rounded-lg border flex items-center gap-1 transition ${
                  activeCardIndex < totalCards - 1
                    ? "border-line-warm bg-surface text-ink-deep hover:bg-surface-warm hover:border-gold-ink cursor-pointer"
                    : "border-transparent text-muted cursor-not-allowed"
                }`}
              >
                <span>{isEnglish ? "Next Card →" : "ใบถัดไป →"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OVERVIEW & ACTIONABLE SUMMARY */}
      {activeTab === "summary" && (
        <div className="space-y-4">
          {/* Opening Greeting */}
          {reading?.opening && (
            <div className="p-4 rounded-lg bg-inset-warm border border-line-warm text-xs sm:text-sm text-ink-deep font-serif-th leading-relaxed italic">
              “{reading.opening}”
            </div>
          )}

          {/* Connections */}
          {reading?.connections && (
            <div className="p-5 rounded-lg bg-surface border border-line-warm space-y-1.5 ">
              <h5 className="font-serif-th text-xs sm:text-sm font-bold text-ink-deep flex items-center gap-2">
                 {isEnglish ? "Spread Synergy & Resonance" : "ความเชื่อมโยงของไพ่ทั้งชุด"}
              </h5>
              <p className="text-xs sm:text-sm text-ink-deep leading-relaxed">{reading.connections}</p>
            </div>
          )}

          {/* Core Summary */}
          {reading?.summary && (
            <div className="relative overflow-hidden rounded-2xl border-2 border-[#C8A261] bg-gradient-to-br from-surface via-[#FDFBF7] to-[#F7EFE1] p-5 shadow-[0_4px_24px_rgba(143,92,26,0.10)] space-y-3">
              {/* Editorial Luxury Top Gold Accent Bar */}
              <div
                aria-hidden="true"
                className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-ink via-[#E2C38A] to-gold-ink"
              />

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-ink/10 border border-gold-ink/30 text-gold-ink font-serif-th font-bold text-xs tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-ink" />
                    {isEnglish ? "Executive Summary & Trajectory" : "สรุปตรงใจและแนวโน้ม"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {reading.yesNoAnswer && (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-gold-ink text-surface">
                      {isEnglish ? `Answer: ${reading.yesNoAnswer}` : `คำตอบ: ${reading.yesNoAnswer}`}
                    </span>
                  )}
                  <TTSReaderButton
                    textToRead={`${isEnglish ? "Executive Summary and Guidance. " : "บทสรุปคำทำนายและแนวโน้ม. "}${reading.summary || ""}. ${
                      reading.advice ? (isEnglish ? "Actionable guidance: " : "คำแนะนำคือ ") + reading.advice.join(", ") : ""
                    }`}
                    personaId={persona.id}
                    className="text-xs py-1 px-2.5 bg-surface hover:bg-surface-warm border border-line-warm shadow-xs"
                  />
                </div>
              </div>
              <div className="pl-3 sm:pl-4 border-l-2 border-gold-ink/50">
                <p className="text-sm sm:text-[15px] font-serif-th text-ink-deep font-medium leading-relaxed [text-wrap:pretty]">
                  {reading.summary}
                </p>
              </div>
              {reading.timing && (
                <p className="text-xs text-gold-ink pt-1 font-mono font-semibold">
                  {isEnglish ? "Timing: " : "ช่วงเวลา: "}{reading.timing}
                </p>
              )}
            </div>
          )}

          {/* Actionable Advice Checklist */}
          {reading?.advice && reading.advice.length > 0 && (
            <div className="p-5 rounded-lg bg-inset-warm border border-line-warm space-y-2.5">
              <h5 className="font-serif-th text-xs sm:text-sm font-bold text-ink-deep flex items-center gap-2">
                {isEnglish ? "Actionable Guidance & Next Steps" : "คำแนะนำและสิ่งที่ควรทำ"}
              </h5>
              <ul className="space-y-2">
                {reading.advice.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-ink-deep">
                    <span className="w-4 h-4 rounded-full bg-gold-ink/20 text-gold-ink font-bold flex items-center justify-center flex-shrink-0 text-[13px] mt-0.5">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── ส่วนรอง: ยุบไว้เพื่อไม่ให้หน้ายาวเกินไป ผู้ใช้แตะเปิดเอง ── */}

          {/* Sacred Oracle Mantra Card */}
          {allCards.length > 0 && (
            <CollapsibleCard
              title={isEnglish ? "Sacred Oracle Wisdom" : "คำคมพลังใจศักดิ์สิทธิ์"}
              hint={isEnglish ? "Core guiding wisdom synthesized from the spread" : "ข้อคิดนำทางที่กลั่นจากไพ่ทั้งชุด"}
              
            >
              <OracleMantraCard cards={allCards} drawn={drawnCards} personaNameTh={isEnglish ? (persona.nameEn || persona.nameTh) : persona.nameTh} />
            </CollapsibleCard>
          )}

          {/* Elemental Balance 4-Elements Analysis */}
          {allCards.length > 0 && (
            <CollapsibleCard
              title={isEnglish ? "Elemental Balance Analysis" : "สมดุลพลังงาน 4 ธาตุในผัง"}
              hint={isEnglish ? "Energy current breakdown: Fire · Water · Air · Earth" : "วิเคราะห์คลื่นพลังงาน ไฟ · น้ำ · ลม · ดิน"}
            >
              <ElementalBalanceWidget cards={allCards} drawn={drawnCards} />
            </CollapsibleCard>
          )}

          {/* Provably-Fair Independent Mathematical Verification (ยุบในตัวเอง) */}
          <ProvablyFairPanel
            commitment={proof?.commitment ?? ""}
            proof={proof}
            drawn={drawnCards.map((c) => ({
              order: c.order,
              cardIndex: c.cardIndex !== undefined ? c.cardIndex : 0,
              isReversed: !!c.isReversed,
            }))}
          />

          {/* Real Human Reader Marketplace Consultation CTA */}
          <div className="p-5 rounded-lg bg-inset-warm border border-line-warm space-y-3 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  
                  <h4 className="font-serif-th text-xs sm:text-sm font-bold text-ink-deep [text-wrap:balance]">
                    {isEnglish ? "Seek In-Depth Personal Consultation?" : "ต้องการคำปรึกษาเจาะลึกเฉพาะบุคคลเพิ่มเติม?"}
                  </h4>
                </div>
                <p className="text-[13px] sm:text-xs text-muted leading-relaxed font-serif-th [text-wrap:pretty]">
                  {isEnglish
                    ? "Consult a certified human tarot master 1-on-1. Send your drawn spread directly to continue the dialogue in private."
                    : "ปรึกษาแม่หมอผู้เชี่ยวชาญแบบตัวต่อตัว พร้อมส่งต่อผลการเปิดไพ่ชุดนี้เพื่อพูดคุยเจาะลึกผ่าน LINE ส่วนตัวได้ทันที"}
                </p>
              </div>

              <Link
                href="/readers"
                onClick={() => trackEvent("reader_consult_click", { source: "stream_end" })}
                className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-gold-ink hover:bg-gold-ink-deep text-surface font-serif-th font-bold text-xs hover:opacity-95 active:scale-95 transition cursor-pointer whitespace-nowrap"
              >
                <span>{isEnglish ? "Consult Human Reader" : "ปรึกษาแม่หมอตัวจริง"}</span>
                <span>➔</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* AI Disclosure Note & Accuracy Rating */}
      <div className="mt-4 pt-3 border-t border-line-warm/30 space-y-2">
        <p className="text-[13px] text-muted leading-relaxed text-center font-serif-th max-w-2xl mx-auto [text-wrap:balance]">
          {isEnglish
            ? "This reading is synthesized with AI from your authentic drawn cards. Provided for reflection, introspection, and spiritual guidance."
            : "คำทำนายนี้ประมวลผลด้วยระบบ AI จากหน้าไพ่ที่คุณเปิดจริง จัดทำขึ้นเพื่อเป็นแนวทางและข้อคิดในการดำเนินชีวิต"}
        </p>

        {/* Accuracy Rating — A/B data collection */}
        {!isStreaming && reading?.summary && (
          <AccuracyRatingWidget personaId={persona.id} readingId={readingId || undefined} />
        )}
      </div>
    </div>
  );
};
