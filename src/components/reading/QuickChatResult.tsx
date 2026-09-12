"use client";

import React, { useMemo } from "react";
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

export interface QuickChatResultProps {
  reading?: Partial<Reading> | null;
  persona: Persona;
  isStreaming: boolean;
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

export const QuickChatResult: React.FC<QuickChatResultProps> = ({
  reading,
  persona,
  isStreaming,
  drawnCards,
  readingId,
  proof,
  errorMsg,
  question,
  nickname,
  onRetry,
}) => {
  const { isEnglish } = useLocale();
  const drawnCard = drawnCards[0];
  // ไพ่เต็มจากสำรับมาก่อน (มีฟิลด์ภาษาอังกฤษครบ) แล้วค่อยตกมาที่ก้อนย่อจากเซสชัน
  const cardData =
    (drawnCard && drawnCard.cardIndex !== undefined ? cardByIndex(drawnCard.cardIndex) : undefined) ||
    drawnCard?.card;
  const cardReading = reading?.cards?.[0];
  const showCoreSummary = !!reading?.summary && reading.summary !== cardReading?.reading;

  const allCards = useMemo(() => {
    try {
      return drawnCards
        .map((d) => (d.cardIndex !== undefined ? cardByIndex(d.cardIndex) : (d.card as unknown as TarotCard)))
        .filter((c): c is TarotCard => !!c);
    } catch {
      return [];
    }
  }, [drawnCards]);

  const personaName = isEnglish ? (persona.nameEn || persona.nameTh) : persona.nameTh;
  const personaTagline = isEnglish ? (persona.taglineEn || persona.tagline) : persona.tagline;

  return (
    <div className="w-full rounded-lg border border-line-warm bg-surface p-5 sm:p-7 flex flex-col justify-between space-y-6 relative overflow-hidden">
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
              <h4 className="font-serif-th text-base font-bold font-mystic-gold">{personaName}</h4>
              <span className="text-[11px] font-serif-th font-semibold bg-inset-warm text-gold-ink border border-line-warm px-2 py-0.5 rounded-full">
                {isEnglish ? "Quick 1-Card" : "ทำนายด่วน 1 ใบ"}
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5">{personaTagline}</p>
          </div>
        </div>

        {/* Live Status Pill */}
        {isStreaming ? (
          <span className="text-xs font-semibold bg-inset-warm text-ink-deep border border-line-warm px-3.5 py-1.5 rounded-full flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gold-ink animate-ping" />{" "}
            {isEnglish ? "Oracle is channeling the tarot..." : "แม่หมอกำลังอ่านคำทำนาย..."}
          </span>
        ) : (
          <span className="text-xs font-semibold bg-[#EBF3ED] text-ok border border-ok/30 px-3.5 py-1.5 rounded-full flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-ok" />{" "}
            {isEnglish ? "Interpretation complete" : "อ่านคำทำนายครบถ้วนแล้ว"}
          </span>
        )}
      </div>

      {/* Error / Recovery Banner */}
      {errorMsg &&
        (() => {
          const isQuota = /สมัครสมาชิก|เติมรอบ|โควตา|สิทธิ์|quota|member/i.test(errorMsg);
          return (
            <div
              role="alert"
              aria-live="assertive"
              className="anim-page-transition p-4 rounded-lg bg-surface border border-line-warm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-2.5 text-xs sm:text-sm text-ink-deep font-serif-th">
                
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
              {onRetry && !isQuota && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="self-end sm:self-auto px-5 py-2 rounded-full bg-gold-ink hover:bg-gold-ink-deep text-surface text-xs font-bold font-serif-th cursor-pointer active:scale-95 transition flex items-center gap-1.5 whitespace-nowrap flex-shrink-0"
                >
                  
                  {isEnglish
                    ? /reload|not found/i.test(errorMsg)
                      ? "Reload Reading"
                      : "Retry Reading"
                    : /โหลดใหม่อีกครั้ง|ไม่พบข้อมูล/.test(errorMsg)
                      ? "โหลดใหม่อีกครั้ง"
                      : "ลองอ่านใหม่"}
                </button>
              )}
            </div>
          );
        })()}

      {/* Zero Fabricated Cards Fallback (Rule 14) */}
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
              className="px-4 py-1.5 rounded-full bg-gold-ink hover:bg-gold-ink-deep text-surface text-xs font-bold font-serif-th shadow cursor-pointer active:scale-95 transition inline-flex items-center gap-1.5"
            >
              {isEnglish ? "Reload Reading" : "โหลดใหม่อีกครั้ง"}
            </button>
          )}
        </div>
      )}

      {/* MAIN RESULT SHOWCASE (ตรงแก่น ชัดเจน ไม่มีแท็บซับซ้อน) */}
      {cardData && (
        <div className="space-y-5">
          {/* Querent Sacred Question Banner */}
          {question && (
            <div className="anim-page-transition p-4 rounded-xl bg-surface-warm border border-line-warm space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-gold-ink font-serif-th font-semibold">
                <span className="flex items-center gap-1.5">
                  <span>{isEnglish ? "Your Sacred Question" : "คำถามที่คุณตั้งจิตถาม"}</span>
                </span>
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

          {/* ★ อ่านก่อนใคร: สรุปตรงใจจากแม่หมอ — ยกขึ้นมานำหน้าทุกหัวข้อ ให้เด่นชัดที่สุด */}
          {showCoreSummary && (
            <div className="anim-page-transition relative overflow-hidden rounded-2xl border-2 border-[#C8A261] bg-gradient-to-br from-surface via-[#FDFBF7] to-[#F7EFE1] p-5 sm:p-6 shadow-[0_6px_28px_rgba(143,92,26,0.14)]">
              {/* Editorial Luxury Top Gold Accent Bar */}
              <div
                aria-hidden="true"
                className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-gold-ink via-[#E2C38A] to-gold-ink"
              />

              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="space-y-1.5">
                  <span className="block text-[11px] font-serif-th font-bold uppercase tracking-[0.18em] text-gold-ink/80">
                    {isEnglish ? "Read this first" : "อ่านสรุปนี้ก่อน"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-ink/10 border border-gold-ink/30 text-gold-ink font-serif-th font-bold text-sm tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-ink" />
                    {isEnglish ? "Core Oracle Insight" : "สรุปตรงใจจากแม่หมอ"}
                  </span>
                </div>
                <TTSReaderButton
                  textToRead={`${isEnglish ? "Core Insight: " : "สรุปตรงใจ: "}${reading!.summary}`}
                  personaId={persona.id}
                  className="flex-shrink-0 text-xs py-1 px-2.5 bg-surface hover:bg-surface-warm border border-line-warm shadow-xs"
                />
              </div>

              <div className="pl-3 sm:pl-4 border-l-2 border-gold-ink/50">
                <p className="text-[15px] sm:text-lg font-serif-th text-ink-deep font-medium leading-relaxed [text-wrap:pretty]">
                  {reading!.summary}
                </p>
              </div>

              <p className="mt-3 text-[11px] font-serif-th text-gold-ink/70">
                {isEnglish
                  ? "Full card interpretation and guidance follow below."
                  : "รายละเอียดไพ่และคำแนะนำแบบเต็มอยู่ด้านล่างนี้"}
              </p>
            </div>
          )}

          {/* Card Presentation Card */}
          <div className="anim-page-transition p-5 sm:p-6 rounded-lg bg-surface-warm border border-line-warm space-y-4">
            {/* Card Identity Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-line-warm/40">
              <div className="flex items-center gap-3.5">
                {/* 1909 Rider-Waite Authentic Thumbnail */}
                <div
                  className={`w-14 h-[95px] rounded-lg overflow-hidden border border-line-warm flex-shrink-0 bg-surface shadow-2xs ${
                    drawnCard?.isReversed ? "rotate-180" : ""
                  }`}
                >
                  {cardData.image ? (
                    <CardImage
                      image={cardData.image}
                      /* ภาพประกอบล้วน — ข้อความข้าง ๆ บอกชื่อเดียวกันอยู่แล้ว (INC-0125) — <h3> ข้างภาพพิมพ์ชื่อไพ่ใบเดียวกันอยู่แล้ว */
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
                        ? `Quick Reading: ${drawnCard?.position.nameEn || drawnCard?.position.nameTh || "Oracle Message"}`
                        : `คำทำนายด่วน: ${drawnCard?.position.nameTh || "สารจากไพ่"}`}
                  </span>
                  <h3 className="font-serif-th text-lg sm:text-xl font-bold text-ink-deep mt-0.5">
                    {isEnglish ? (cardData.nameEn || cardData.nameTh) : cardData.nameTh}{" "}
                    {!isEnglish && cardData.nameEn && (
                      <span className="text-xs font-mono font-normal text-muted">({cardData.nameEn})</span>
                    )}{" "}
                    <span className="text-xs font-serif-th font-semibold text-gold-ink">
                      {drawnCard?.isReversed
                        ? (isEnglish ? "· Reversed" : "· ไพ่กลับหัว")
                        : (isEnglish ? "· Upright" : "· ไพ่หัวตั้ง")}
                    </span>
                  </h3>
                </div>
              </div>

              {/* Keywords */}
              {(() => {
                const keywords = resolveDisplayKeywords({
                  cardId: cardData?.id,
                  keywords: cardData?.keywords,
                  keywordsEn: (cardData as any)?.keywordsEn,
                  isReversed: drawnCard?.isReversed,
                  isEnglish,
                });

                return keywords.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                    {keywords.slice(0, 3).map((kw: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-xs text-ink-deep bg-surface border border-line-warm px-2.5 py-0.5 rounded-full font-serif-th"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                ) : null;
              })()}
            </div>

            {/* Core Interpretation & Headline */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                {cardReading?.headline ? (
                  <h4 className="font-serif-th text-sm sm:text-base font-bold font-mystic-gold flex items-center gap-1.5">
                    
                    <span>{cardReading.headline}</span>
                  </h4>
                ) : (
                  <h4 className="font-serif-th text-sm sm:text-base font-bold font-mystic-gold flex items-center gap-1.5">
                    
                    <span>{isEnglish ? "Core Answer & Trajectory" : "คำตอบและแนวโน้ม"}</span>
                  </h4>
                )}

                {cardReading?.reading && (
                  <TTSReaderButton
                    textToRead={`${cardReading.headline ? cardReading.headline + ". " : ""}${cardReading.reading}. ${
                      reading?.summary ? (isEnglish ? "Summary: " : "สรุป: ") + reading.summary : ""
                    }`}
                    personaId={persona.id}
                    className="ml-auto"
                  />
                )}
              </div>

              {/* Reading Body (สั้น คม ชัด ตรงประเด็น 2-3 ประโยค) */}
              {cardReading?.reading ? (
                <div
                  className="text-sm sm:text-base text-ink-deep leading-relaxed font-serif-th font-normal"
                  aria-live="polite"
                  aria-label={isEnglish ? "Oracle reading" : "คำทำนายจากแม่หมอ"}
                >
                  {isStreaming ? (
                    cardReading.reading.split(" ").map((word, i) => (
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
                  ) : (
                    <p>{cardReading.reading}</p>
                  )}
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-muted leading-relaxed font-serif-th italic">
                  {isStreaming
                    ? (isEnglish
                        ? "The oracle is attuning to the energetic currents to formulate a clear, direct answer..."
                        : "แม่หมอกำลังสัมผัสคลื่นพลังงานและเรียบเรียงคำตอบที่สั้นตรงประเด็น...")
                    : (isEnglish ? "Awaiting oracle revelation" : "รอการเปิดม่านพยากรณ์")}
                </p>
              )}

            </div>

            {/* Actionable Advice (ไม่เกิน 2 ข้อ) */}
            {reading?.advice && reading.advice.length > 0 && (
              <div className="pt-3 border-t border-line-warm/40 space-y-2">
                <h5 className="font-serif-th text-xs sm:text-sm font-bold text-ink-deep flex items-center gap-2">
                   {isEnglish ? "What to Do Now" : "สิ่งที่ควรทำตอนนี้"}
                </h5>
                <ul className="space-y-1.5">
                  {reading.advice.slice(0, 2).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-ink-deep font-serif-th">
                      <span className="w-4 h-4 rounded-full bg-gold-ink/20 text-gold-ink font-bold flex items-center justify-center flex-shrink-0 text-[11px] mt-0.5">
                        ✓
                      </span>
                      <span className="leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* ⚡ DIRECT FAST-CHAT CTA BUTTON */}
          {readingId && (
            <Link
              href="/reading/chat"
              className="group relative overflow-hidden flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-line-warm bg-gradient-to-r from-inset-warm via-surface-warm to-inset-warm hover:bg-surface p-4 text-left transition hover:border-gold-ink hover:shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink active:scale-[0.99] lg:hidden"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gold-ink text-surface text-sm shadow-sm group-hover:scale-105 group-hover:bg-gold-ink-deep transition font-sans font-bold">
                  ➔
                </span>
                <div>
                  <span className="block font-serif-th text-sm font-bold text-ink-deep">
                    {isEnglish
                      ? `Have further inquiries? Converse with ${personaName} now`
                      : `มีคำถามเรื่องนี้ต่อไหม? แชทกับ${persona.nameTh}ได้ทันที`}
                  </span>
                  <span className="block font-serif-th text-xs text-muted mt-0.5">
                    {isEnglish
                      ? "Open interactive chat to explore this card and its implications directly."
                      : "เปิดห้องแชทพิมพ์ถามข้อสงสัยเพิ่มเติมต่อจากไพ่ใบนี้ได้เลย"}
                  </span>
                </div>
              </div>
              <span className="flex items-center gap-1 font-serif-th text-xs font-bold text-gold-ink px-2.5 py-1 rounded-full bg-gold-ink/10 border border-gold-ink/20 flex-shrink-0 group-hover:translate-x-0.5 transition-transform">
                <span>{isEnglish ? "Continue Chat" : "คุยต่อ"}</span>
                <span>➔</span>
              </span>
            </Link>
          )}

          {/* Accuracy Rating Widget (Uncollapsed - feedback loop หลัก) */}
          {!isStreaming && reading?.summary && (
            <div className="pt-2">
              <AccuracyRatingWidget personaId={persona.id} readingId={readingId || undefined} />
            </div>
          )}

          {/* ── ส่วนรอง: ยุบไว้ใน Accordion เพื่อความกระชับ ผู้ใช้แตะเปิดเองได้ ── */}
          <CollapsibleCard
            title={isEnglish ? "In-Depth Insights & Verification" : "รายละเอียดเชิงลึก & ความโปร่งใส"}
            hint={isEnglish ? "Oracle Wisdom · Elemental Balance · Provably Fair Audit" : "คำคมพลังใจ · สมดุลธาตุ · รหัสตรวจสอบ Provably Fair"}
            
          >
            <div className="space-y-4 pt-1">
              {/* Sacred Oracle Mantra Card */}
              {allCards.length > 0 && (
                <OracleMantraCard cards={allCards} drawn={drawnCards} personaNameTh={personaName} />
              )}

              {/* Elemental Balance 4-Elements Analysis */}
              {allCards.length > 0 && (
                <ElementalBalanceWidget cards={allCards} drawn={drawnCards} />
              )}

              {/* Provably-Fair Independent Mathematical Verification */}
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
              <div className="p-4 rounded-lg bg-surface-warm border border-line-warm space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <h5 className="font-serif-th text-xs sm:text-sm font-bold text-ink-deep flex items-center gap-1.5">
                      
                      {isEnglish ? "Consult a Certified Human Master" : "ปรึกษาแม่หมอตัวจริงเพิ่มเติม"}
                    </h5>
                    <p className="text-xs text-muted font-serif-th leading-relaxed">
                      {isEnglish
                        ? "If you seek deep personal clarity, forward your drawn card directly for a private session."
                        : "หากต้องการพูดคุยเจาะลึกเฉพาะบุคคล สามารถส่งต่อผลไพ่ใบนี้เพื่อปรึกษาแม่หมอผู้เชี่ยวชาญได้"}
                    </p>
                  </div>
                  <Link
                    href="/readers"
                    onClick={() => trackEvent("reader_consult_click", { source: "stream_end" })}
                    className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-gold-ink hover:bg-gold-ink-deep text-surface font-serif-th font-bold text-xs hover:opacity-95 active:scale-95 transition cursor-pointer whitespace-nowrap"
                  >
                    <span>{isEnglish ? "Consult Human Reader" : "ปรึกษาแม่หมอตัวจริง"}</span>
                    <span>➔</span>
                  </Link>
                </div>
              </div>
            </div>
          </CollapsibleCard>
        </div>
      )}

      {/* AI Disclosure Note */}
      <div className="pt-3 border-t border-line-warm/30">
        <p className="text-xs text-muted leading-relaxed text-center font-serif-th max-w-2xl mx-auto">
          {" "}
          {isEnglish
            ? "This reading is synthesized with AI from your authentic drawn card. Intended for reflection, introspection, and personal guidance."
            : "คำทำนายนี้ประมวลผลด้วยระบบ AI จากหน้าไพ่ที่คุณเปิดจริง จัดทำขึ้นเพื่อเป็นแนวทางและข้อคิดในการดำเนินชีวิต"}
        </p>
      </div>
    </div>
  );
};
