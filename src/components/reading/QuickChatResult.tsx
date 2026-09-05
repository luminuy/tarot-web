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
  onRetry,
}) => {
  const drawnCard = drawnCards[0];
  const cardData =
    drawnCard?.card ||
    (drawnCard && drawnCard.cardIndex !== undefined ? cardByIndex(drawnCard.cardIndex) : undefined);
  const cardReading = reading?.cards?.[0];

  const allCards = useMemo(() => {
    try {
      return drawnCards
        .map((d) => (d.cardIndex !== undefined ? cardByIndex(d.cardIndex) : (d.card as unknown as TarotCard)))
        .filter((c): c is TarotCard => !!c);
    } catch {
      return [];
    }
  }, [drawnCards]);

  return (
    <div className="w-full rounded-lg border border-[#D9C8AC] bg-[#FFFFFF] p-5 sm:p-7 flex flex-col justify-between space-y-6 relative overflow-hidden">
      {/* Oracle Guide Header & Streaming Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#D9C8AC]/30">
        <div className="flex items-center gap-3.5">
          {/* Authentic 1909 Tarot Card Persona Avatar */}
          <div
            className="w-10 h-15 rounded-lg border-2 overflow-hidden bg-[#F3EDE2] relative flex-shrink-0"
            style={{ borderColor: "#D9C8AC" }}
          >
            <CardImage
              image={`${persona.cardImage || (persona.id === "direct" ? "major-11.jpg" : persona.id === "mystic" ? "major-17.jpg" : "major-02.jpg")}`}
              alt={persona.nameTh}
              className="w-full h-full object-cover object-top filter contrast-[1.05] brightness-[1.02] tarot-hd-card-image"
              sizes="40px"
            />
            <div className="gold-foil-sheen absolute inset-0 opacity-20" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-serif-th text-base font-bold font-mystic-gold">{persona.nameTh}</h4>
              <span className="text-[11px] font-serif-th font-semibold bg-[#F3EDE2] text-[#8F5C1A] border border-[#D9C8AC] px-2 py-0.5 rounded-full">
                ทำนายด่วน 1 ใบ
              </span>
            </div>
            <p className="text-xs text-[#635B4E] mt-0.5">{persona.tagline}</p>
          </div>
        </div>

        {/* Live Status Pill */}
        {isStreaming ? (
          <span className="text-xs font-semibold bg-[#F3EDE2] text-[#2E211A] border border-[#D9C8AC] px-3.5 py-1.5 rounded-full flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8F5C1A] animate-ping" /> แม่หมอกำลังอ่านคำทำนาย...
          </span>
        ) : (
          <span className="text-xs font-semibold bg-[#EBF3ED] text-[#3A7044] border border-[#3A7044]/30 px-3.5 py-1.5 rounded-full flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3A7044]" /> อ่านคำทำนายครบถ้วนแล้ว
          </span>
        )}
      </div>

      {/* Error / Recovery Banner */}
      {errorMsg &&
        (() => {
          const isQuota = /สมัครสมาชิก|เติมรอบ|โควตา|สิทธิ์/.test(errorMsg);
          return (
            <div
              role="alert"
              aria-live="assertive"
              className="anim-page-transition p-4 rounded-lg bg-[#FFFFFF] border border-[#D9C8AC] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-2.5 text-xs sm:text-sm text-[#2E211A] font-serif-th">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-[#D9C8AC] text-[13px] text-[#8F5C1A]">
                  ✦
                </span>
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
              {onRetry && !isQuota && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="self-end sm:self-auto px-5 py-2 rounded-full bg-[#8F5C1A] hover:bg-[#74490F] text-[#FFFFFF] text-xs font-bold font-serif-th cursor-pointer active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap flex-shrink-0"
                >
                  <span>✦</span> {/โหลดใหม่อีกครั้ง|ไม่พบข้อมูล/.test(errorMsg) ? "โหลดใหม่อีกครั้ง" : "ลองอ่านใหม่"}
                </button>
              )}
            </div>
          );
        })()}

      {/* Zero Fabricated Cards Fallback (Rule 14) */}
      {!cardData && (
        <div className="p-4 rounded-lg bg-[#FCEEEA] border border-[#D9C8AC] text-center space-y-2.5 my-2">
          <p className="text-xs text-[#A6392C] font-serif-th">
            ไม่พบข้อมูลไพ่สำหรับตำแหน่งนี้ กรุณากดโหลดใหม่อีกครั้ง
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-4 py-1.5 rounded-full bg-[#8F5C1A] hover:bg-[#74490F] text-[#FFFFFF] text-xs font-bold font-serif-th shadow cursor-pointer active:scale-95 transition-all inline-flex items-center gap-1.5"
            >
              <span>✦</span> โหลดใหม่อีกครั้ง
            </button>
          )}
        </div>
      )}

      {/* MAIN RESULT SHOWCASE (ตรงแก่น ชัดเจน ไม่มีแท็บซับซ้อน) */}
      {cardData && (
        <div className="space-y-5">
          {/* Card Presentation Card */}
          <div className="anim-page-transition p-5 sm:p-6 rounded-lg bg-[#FAF7F2] border border-[#D9C8AC] space-y-4">
            {/* Card Identity Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#D9C8AC]/40">
              <div className="flex items-center gap-3.5">
                {/* 1909 Rider-Waite Authentic Thumbnail */}
                <div
                  className={`w-14 h-[95px] rounded-lg overflow-hidden border border-[#D9C8AC] flex-shrink-0 bg-[#FFFFFF] shadow-2xs ${
                    drawnCard?.isReversed ? "rotate-180" : ""
                  }`}
                >
                  {cardData.image ? (
                    <CardImage
                      image={cardData.image}
                      alt={cardData.nameTh || "Tarot"}
                      className="w-full h-full object-cover object-center tarot-card-enhance tarot-hd-card-image"
                      sizes="88px"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#F3EDE2] flex flex-col items-center justify-center text-center p-1 border border-dashed border-[#D9C8AC]">
                      <span className="text-[#8F5C1A] text-xs">✦</span>
                      <span className="text-xs text-[#635B4E] font-serif-th mt-0.5 leading-normal">ไม่พบข้อมูล</span>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[13px] text-[#8F5C1A] font-serif-th font-semibold">
                    ✦ คำทำนายด่วน: {drawnCard?.position.nameTh || "สารจากไพ่"}
                  </span>
                  <h3 className="font-serif-th text-lg sm:text-xl font-bold text-[#2E211A] mt-0.5">
                    {cardData.nameTh}{" "}
                    {cardData.nameEn && (
                      <span className="text-xs font-mono font-normal text-[#635B4E]">({cardData.nameEn})</span>
                    )}{" "}
                    <span className="text-xs font-serif-th font-semibold text-[#8F5C1A]">
                      {drawnCard?.isReversed ? "· ไพ่กลับหัว" : "· ไพ่หัวตั้ง"}
                    </span>
                  </h3>
                </div>
              </div>

              {/* Keywords */}
              {(() => {
                const keywords =
                  cardData.keywords && Array.isArray(cardData.keywords)
                    ? cardData.keywords
                    : cardData.keywords && typeof cardData.keywords === "object"
                      ? drawnCard?.isReversed
                        ? (cardData.keywords as any).reversed
                        : (cardData.keywords as any).upright
                      : [];

                return keywords && keywords.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                    {keywords.slice(0, 3).map((kw: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-xs text-[#2E211A] bg-[#FFFFFF] border border-[#D9C8AC] px-2.5 py-0.5 rounded-full font-serif-th"
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
                    <span className="text-[#8F5C1A]">✦</span>
                    <span>{cardReading.headline}</span>
                  </h4>
                ) : (
                  <h4 className="font-serif-th text-sm sm:text-base font-bold font-mystic-gold flex items-center gap-1.5">
                    <span className="text-[#8F5C1A]">✦</span>
                    <span>คำตอบและแนวโน้ม</span>
                  </h4>
                )}

                {cardReading?.reading && (
                  <TTSReaderButton
                    textToRead={`${cardReading.headline ? cardReading.headline + ". " : ""}${cardReading.reading}. ${
                      reading?.summary ? "สรุป: " + reading.summary : ""
                    }`}
                    personaId={persona.id}
                    className="ml-auto"
                  />
                )}
              </div>

              {/* Reading Body (สั้น คม ชัด ตรงประเด็น 2-3 ประโยค) */}
              {cardReading?.reading ? (
                <div
                  className="text-sm sm:text-base text-[#2E211A] leading-relaxed font-serif-th font-normal"
                  aria-live="polite"
                  aria-label="คำทำนายจากแม่หมอ"
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
                <p className="text-xs sm:text-sm text-[#635B4E] leading-relaxed font-serif-th italic">
                  {isStreaming
                    ? "แม่หมอกกำลังสัมผัสคลื่นพลังงานและเรียบเรียงคำตอบที่สั้นตรงประเด็น..."
                    : "รอการเปิดม่านพยากรณ์"}
                </p>
              )}

              {/* Core Summary if distinct from card reading */}
              {reading?.summary && reading.summary !== cardReading?.reading && (
                <div className="mt-3 p-3.5 rounded-lg bg-[#FFFFFF] border border-[#D9C8AC]/60 text-xs sm:text-sm font-serif-th text-[#2E211A] leading-relaxed">
                  <span className="font-bold text-[#8F5C1A]">สรุปตรงใจ: </span>
                  {reading.summary}
                </div>
              )}
            </div>

            {/* Actionable Advice (ไม่เกิน 2 ข้อ) */}
            {reading?.advice && reading.advice.length > 0 && (
              <div className="pt-3 border-t border-[#D9C8AC]/40 space-y-2">
                <h5 className="font-serif-th text-xs sm:text-sm font-bold text-[#2E211A] flex items-center gap-2">
                  <span className="text-[#8F5C1A]">✦</span> สิ่งที่ควรทำตอนนี้
                </h5>
                <ul className="space-y-1.5">
                  {reading.advice.slice(0, 2).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-[#2E211A] font-serif-th">
                      <span className="w-4 h-4 rounded-full bg-[#8F5C1A]/20 text-[#8F5C1A] font-bold flex items-center justify-center flex-shrink-0 text-[11px] mt-0.5">
                        ✓
                      </span>
                      <span className="leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* ⚡ DIRECT FAST-CHAT CTA BUTTON (ทางลัดคุยกับแม่หมอต่อทันที ไม่ต้องเลื่อนยาว)
              lg:hidden — จอ ≥lg มีการ์ดแชท sticky ฝั่งขวาอยู่แล้ว (TarotFlow.tsx aside) โชว์ซ้ำกันจะรก
              จอเล็กกว่า lg การ์ดฝั่งขวาตกไปอยู่ใต้บล็อกนี้ จึงยังต้องมีปุ่มลัดตรงนี้ */}
          {readingId && (
            <Link
              href="/reading/chat"
              className="group flex w-full items-center justify-between gap-3 rounded-xl border border-[#D9C8AC] bg-[#F3EDE2] hover:bg-[#FFFFFF] p-4 text-left transition-all hover:border-[#8F5C1A] hover:shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A] lg:hidden"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#8F5C1A] text-[#FFFFFF] text-sm shadow-2xs group-hover:scale-105 transition-transform">
                  ✦
                </span>
                <div>
                  <span className="block font-serif-th text-sm font-bold text-[#2E211A]">
                    มีคำถามเรื่องนี้ต่อไหม? แชทกับ{persona.nameTh}ได้ทันที
                  </span>
                  <span className="block font-serif-th text-xs text-[#635B4E] mt-0.5">
                    เปิดห้องแชทพิมพ์ถามข้อสงสัยเพิ่มเติมต่อจากไพ่ใบนี้ได้เลย
                  </span>
                </div>
              </div>
              <span className="flex items-center gap-1 font-serif-th text-xs font-bold text-[#8F5C1A] flex-shrink-0 group-hover:translate-x-1 transition-transform">
                <span>คุยต่อ</span>
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
            title="รายละเอียดเชิงลึก & ความโปร่งใส"
            hint="คำคมพลังใจ · สมดุลธาตุ · รหัสตรวจสอบ Provably Fair"
            icon="✨"
          >
            <div className="space-y-4 pt-1">
              {/* Sacred Oracle Mantra Card */}
              {allCards.length > 0 && (
                <OracleMantraCard cards={allCards} drawn={drawnCards} personaNameTh={persona.nameTh} />
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
              <div className="p-4 rounded-lg bg-[#FAF7F2] border border-[#D9C8AC] space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <h5 className="font-serif-th text-xs sm:text-sm font-bold text-[#2E211A] flex items-center gap-1.5">
                      <span className="text-[#8F5C1A]">✨</span> ปรึกษาแม่หมอตัวจริงเพิ่มเติม
                    </h5>
                    <p className="text-xs text-[#635B4E] font-serif-th leading-relaxed">
                      หากต้องการพูดคุยเจาะลึกเฉพาะบุคคล สามารถส่งต่อผลไพ่ใบนี้เพื่อปรึกษาแม่หมอผู้เชี่ยวชาญได้
                    </p>
                  </div>
                  <Link
                    href="/readers"
                    onClick={() => trackEvent("reader_consult_click", { source: "stream_end" })}
                    className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#8F5C1A] hover:bg-[#74490F] text-[#FFFFFF] font-serif-th font-bold text-xs hover:opacity-95 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <span>ปรึกษาแม่หมอตัวจริง</span>
                    <span>➔</span>
                  </Link>
                </div>
              </div>
            </div>
          </CollapsibleCard>
        </div>
      )}

      {/* AI Disclosure Note */}
      <div className="pt-3 border-t border-[#D9C8AC]/30">
        <p className="text-xs text-[#635B4E] leading-relaxed text-center font-serif-th max-w-2xl mx-auto">
          <span className="text-[#8F5C1A]">✦</span> คำทำนายนี้ประมวลผลด้วยระบบ AI จากหน้าไพ่ที่คุณเปิดจริง
          จัดทำขึ้นเพื่อเป็นแนวทางและข้อคิดในการดำเนินชีวิต
        </p>
      </div>
    </div>
  );
};
