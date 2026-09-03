"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { STAGGER, DUR, EASE } from "@/lib/motion";
import type { Reading } from "@/lib/schema/reading";
import type { Persona } from "@/data/personas";
import type { DrawnSlotCard } from "@/components/spread/SpreadBoard";
import { cardByIndex, type TarotCard } from "@/data/cards";
import { ElementalBalanceWidget } from "@/components/reading/ElementalBalanceWidget";
import { OracleMantraCard } from "@/components/reading/OracleMantraCard";
import { soundManager } from "@/lib/utils/audio";
import { trackEvent } from "@/lib/analytics";
import { ASK_ORACLE_SECTION_ID } from "./FollowUpChat";
import { AccuracyRatingWidget } from "./AccuracyRatingWidget";
import { ProvablyFairPanel } from "./ProvablyFairPanel";
import { CollapsibleCard } from "./CollapsibleCard";
import { CardImage } from "@/components/card/CardImage";
import { TTSReaderButton } from "./TTSReaderButton";

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
  onRetry,
}) => {
  const [activeTab, setActiveTab] = useState<"card" | "summary">("card");
  const [isSpeakingVoice, setIsSpeakingVoice] = useState(false);

  const handleToggleVoice = (textToSpeak: string) => {
    if (isSpeakingVoice) {
      soundManager.stopSpeaking();
      setIsSpeakingVoice(false);
    } else {
      const ok = soundManager.speakProphecy(
        textToSpeak,
        persona.id,
        () => setIsSpeakingVoice(false),
        () => setIsSpeakingVoice(false)
      );
      if (ok) setIsSpeakingVoice(true);
    }
  };

  // เลื่อนลงไปห้องคุยกับแม่หมอ (ส่วนแยกด้านล่าง) — เคารพ prefers-reduced-motion
  const scrollToAskOracle = () => {
    const el = typeof document !== "undefined" ? document.getElementById(ASK_ORACLE_SECTION_ID) : null;
    if (!el) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };

  const activeDrawnCard = drawnCards.find((d) => d.order === activeCardIndex);
  const cardData =
    activeDrawnCard?.card ||
    (activeDrawnCard && activeDrawnCard.cardIndex !== undefined
      ? cardByIndex(activeDrawnCard.cardIndex)
      : undefined);
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
    <div className="w-full rounded-3xl border border-[#e5c07b]/35 bg-gradient-to-b from-[#140d28]/95 via-[#0a0714]/95 to-[#05040a]/95 p-5 sm:p-7 shadow-[0_0_50px_rgba(0,0,0,0.85)] flex flex-col justify-between space-y-6 relative overflow-hidden">
      {/* Background Sacred Geometric Aura */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-radial from-[#e5c07b]/10 via-transparent to-transparent pointer-events-none blur-2xl" />

      {/* Oracle Guide Header & Streaming Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#e5c07b]/20">
        <div className="flex items-center gap-3.5">
          {/* Authentic 1909 Tarot Card Persona Avatar */}
          <div
            className="w-10 h-15 rounded-lg border-2 overflow-hidden shadow-[0_0_20px_rgba(229,192,123,0.45)] bg-[#07050d] relative flex-shrink-0"
            style={{ borderColor: persona.accent || "#e5c07b" }}
          >
            <CardImage
              image={`${persona.cardImage || (persona.id === "direct" ? "major-11.jpg" : persona.id === "mystic" ? "major-17.jpg" : "major-02.jpg")}`}
              alt={persona.nameTh}
              className="w-full h-full object-cover object-top tarot-card-enhance contrast-[1.04] brightness-[1.02] tarot-hd-card-image"
              sizes="40px"
            />
            <div className="gold-foil-sheen absolute inset-0 opacity-30" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-serif-th text-base font-bold font-mystic-gold">
                {persona.nameTh}
              </h4>
            </div>
            <p className="text-xs text-[#cfc8e2]/80 mt-0.5">{persona.tagline}</p>
          </div>
        </div>

        {/* Live Status Pill */}
        {isStreaming ? (
          <span className="text-xs font-semibold bg-[#e5c07b]/15 text-[#f5deaa] border border-[#e5c07b]/40 px-3.5 py-1.5 rounded-full flex items-center gap-2 animate-pulse shadow">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e5c07b]" /> แม่หมอกำลังอ่านคำทำนาย...
          </span>
        ) : (
          <span className="text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> อ่านคำทำนายครบถ้วนแล้ว
          </span>
        )}
      </div>

      {/* World-Class Chamber Navigation Tabs */}
      <div
        role="tablist"
        aria-label="ส่วนแสดงผลคำทำนาย"
        className="flex items-center gap-2 border-b border-[#e5c07b]/15 pb-2 overflow-x-auto no-scrollbar"
      >
        <button
          type="button"
          role="tab"
          id="chamber-tab-card"
          aria-selected={activeTab === "card"}
          aria-controls="chamber-panel-card"
          onClick={() => setActiveTab("card")}
          className={`px-4 py-2 rounded-xl text-xs font-serif-th font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CD9F5B] ${
            activeTab === "card"
              ? "bg-[#CD9F5B] text-[#FDF7F0] shadow-xs"
              : "bg-[#FCF0E6] text-[#5A432F] hover:text-[#CD9F5B] border border-[#D6B48D]"
          }`}
        >
          <span className="text-[11px]">✦</span>
          <span>อ่านรายใบ ({activeCardIndex + 1}/{totalCards})</span>
        </button>

        <button
          type="button"
          role="tab"
          id="chamber-tab-summary"
          aria-selected={activeTab === "summary"}
          aria-controls="chamber-panel-summary"
          onClick={() => setActiveTab("summary")}
          className={`px-4 py-2 rounded-xl text-xs font-serif-th font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CD9F5B] ${
            activeTab === "summary"
              ? "bg-[#CD9F5B] text-[#FDF7F0] shadow-xs"
              : "bg-[#FCF0E6] text-[#5A432F] hover:text-[#CD9F5B] border border-[#D6B48D]"
          }`}
        >
          <span className="text-[#CD9F5B]">✨</span>
          <span>สรุปภาพรวม & คำแนะนำ</span>
        </button>

      </div>

      {/* ทางลัดลงไปห้องคุยกับแม่หมอ */}
      {readingId && (
        <button
          type="button"
          onClick={scrollToAskOracle}
          className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-[#D6B48D] bg-[#FCF0E6] px-4 py-3 text-left transition-all hover:border-[#CD9F5B] hover:bg-[#FFFFFF] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CD9F5B]"
        >
          <span className="min-w-0">
            <span className="block font-serif-th text-xs font-bold text-[#5A432F] sm:text-sm">
              <span className="mr-1.5 text-[#CD9F5B]">✦</span> มีอะไรอยากถามแม่หมอต่อไหม
            </span>
            <span className="mt-0.5 block font-serif-th text-[11px] leading-relaxed text-[#8C735D]">
              พิมพ์ถามเจาะลึกต่อกับแม่หมอได้ทันที แตะเพื่อเริ่มพิมพ์คุยได้เลย
            </span>
          </span>
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[#D6B48D] text-[#CD9F5B] transition-transform group-hover:translate-y-0.5">
            ↓
          </span>
        </button>
      )}

      {/* Error / Recovery Banner — โทนทองอุ่น ไม่ใช่แดงตกใจ · ซ่อนปุ่มลองใหม่เมื่อเป็นเรื่องโควตา */}
      {errorMsg && (() => {
        const isQuota = /สมัครสมาชิก|เติมรอบ|โควตา|สิทธิ์/.test(errorMsg);
        return (
          <div
            role="alert"
            aria-live="assertive"
            className="anim-page-transition p-4 rounded-2xl bg-[#1c1330]/96 border border-[#e5c07b]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg"
          >
            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-[#f5deaa] font-serif-th">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-[#e5c07b]/60 text-[10px] text-[#ffd700]">
                ✦
              </span>
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
            {onRetry && !isQuota && (
              <button
                type="button"
                onClick={onRetry}
                className="self-end sm:self-auto px-5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f7e7b4] to-[#c59b27] text-[#0a0715] text-xs font-bold font-serif-th shadow hover:opacity-95 cursor-pointer active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap flex-shrink-0"
              >
                <span>✦</span> {/โหลดใหม่อีกครั้ง|ไม่พบข้อมูล/.test(errorMsg) ? "โหลดใหม่อีกครั้ง" : "ลองอ่านใหม่"}
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
                className={`px-3 py-1.5 rounded-xl text-xs font-serif-th font-semibold transition-all cursor-pointer flex max-w-full items-center gap-1.5 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CD9F5B] ${
                  activeCardIndex === d.order
                    ? "bg-[#CD9F5B] text-[#FDF7F0] font-bold shadow-xs"
                    : "bg-[#FCF0E6] text-[#5A432F] hover:bg-[#FFFFFF] border border-[#D6B48D]"
                }`}
              >
                <span className="whitespace-nowrap">ใบที่ {i + 1}</span>
                {(() => {
                  const card = d.card || (d.cardIndex !== undefined ? cardByIndex(d.cardIndex) : undefined);
                  return card ? (
                    <span className="min-w-0 truncate text-[10px] font-normal opacity-80">
                      ({card.nameTh})
                    </span>
                  ) : null;
                })()}
              </button>
            ))}
          </div>

          {/* Active Card Interpretation Showcase */}
          <div
            key={activeCardIndex}
            className="anim-page-transition p-5 sm:p-6 rounded-2xl bg-[#FFFFFF] border border-[#D6B48D] shadow-xs space-y-4"
          >
            {/* Position & Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#D6B48D]/30">
              <div className="flex items-center gap-3.5">
                {/* Real 1909 Rider-Waite Thumbnail */}
                <div className={`w-14 h-[95px] rounded-lg overflow-hidden border border-[#D6B48D] flex-shrink-0 shadow-xs ${activeDrawnCard?.isReversed ? "rotate-180" : ""}`}>
                  {cardData?.image ? (
                    <CardImage
                      image={cardData.image}
                      alt={cardData?.nameTh || "Tarot"}
                      className="w-full h-full object-cover object-center tarot-card-enhance tarot-hd-card-image"
                      sizes="88px"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#FCF0E6] flex flex-col items-center justify-center text-center p-1 border border-dashed border-[#D6B48D]">
                      <span className="text-[#CD9F5B] text-xs">✦</span>
                      <span className="text-[9px] text-[#8C735D] font-serif-th mt-0.5 leading-tight">ไม่พบข้อมูล</span>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-widest text-[#CD9F5B] font-mono font-semibold">
                    ✦ ตำแหน่งที่ {activeCardIndex + 1}: {activeDrawnCard?.position.nameTh || "ตำแหน่งพลังงาน"}
                  </span>
                  <h4 className="font-serif-th text-lg sm:text-xl font-bold text-[#5A432F] mt-0.5">
                    {cardData ? (
                      <>
                        {cardData.nameTh}{" "}
                        {cardData.nameEn && (
                          <span className="text-xs font-mono font-normal text-[#8C735D]">
                            ({cardData.nameEn})
                          </span>
                        )}{" "}
                        <span className="text-xs font-serif-th font-semibold text-[#CD9F5B]">
                          {activeDrawnCard?.isReversed ? "· ไพ่กลับหัว (Reversed)" : "· ไพ่ตรง (Upright)"}
                        </span>
                      </>
                    ) : (
                      <span className="text-rose-700 text-sm font-normal">
                        ไม่พบข้อมูลไพ่ (กรุณากดโหลดใหม่อีกครั้ง)
                      </span>
                    )}
                  </h4>
                </div>
              </div>

              {/* Elemental & Meaning Tag */}
              {activeDrawnCard?.position.meaning && (
                <span className="text-[10px] text-[#5A432F] bg-[#E4C09F]/25 border border-[#D6B48D] px-2.5 py-1 rounded-full font-serif-th self-start sm:self-auto">
                  {activeDrawnCard.position.meaning}
                </span>
              )}
            </div>

            {/* Keywords */}
            {(() => {
              const keywords =
                cardData?.keywords && Array.isArray(cardData.keywords)
                  ? cardData.keywords
                  : cardData?.keywords && typeof cardData.keywords === "object"
                  ? (activeDrawnCard?.isReversed ? (cardData.keywords as any).reversed : (cardData.keywords as any).upright)
                  : [];

              return keywords && keywords.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-[#8C735D] font-mono">คีย์เวิร์ด:</span>
                  {keywords.map((kw: string, idx: number) => (
                    <span
                      key={idx}
                      className="text-[10px] text-[#5A432F] bg-[#FCF0E6] border border-[#D6B48D] px-2 py-0.5 rounded-md"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              ) : null;
            })()}

            {/* If card data could not be found, show reload prompt instead of fake reading */}
            {!cardData && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-center space-y-2.5 my-2">
                <p className="text-xs text-rose-800 font-serif-th">
                  ไม่พบข้อมูลไพ่สำหรับตำแหน่งนี้ กรุณากดโหลดใหม่อีกครั้ง
                </p>
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="px-4 py-1.5 rounded-lg bg-[#CD9F5B] hover:bg-[#B8853E] text-[#FDF7F0] text-xs font-bold font-serif-th shadow cursor-pointer active:scale-95 transition-all inline-flex items-center gap-1.5"
                  >
                    <span>✦</span> โหลดใหม่อีกครั้ง
                  </button>
                )}
              </div>
            )}

            {/* Interpretation Body */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between gap-2">
                {activeCardReading?.headline && (
                  <h5 className="font-serif-th text-sm font-bold text-[#5A432F]">
                    ✦ {activeCardReading.headline}
                  </h5>
                )}
                {activeCardReading?.reading && (
                  <TTSReaderButton
                    textToRead={`${activeCardReading.headline ? activeCardReading.headline + ". " : ""}${activeCardReading.reading}`}
                    personaId={persona.id}
                    className="ml-auto"
                  />
                )}
              </div>

              {/* P1-M3: Word-by-word oracle streaming animation */}
              {activeCardReading?.reading ? (
                <p
                  key={`oracle-${activeCardIndex}`}
                  className="text-xs sm:text-sm text-[#5A432F] leading-relaxed font-serif-th font-normal"
                  aria-live="polite"
                  aria-label="คำทำนายจากแม่หมอ"
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
                <p className="text-xs sm:text-sm text-[#cfc8e2]/60 leading-relaxed font-serif-th font-normal italic">
                  {isStreaming
                    ? "แม่หมอกำลังสัมผัสคลื่นพลังงานและเรียบเรียงคำทำนายของไพ่ใบนี้..."
                    : "รอการเปิดม่านพยากรณ์"}
                </p>
              )}
            </div>

            {/* Next / Prev Card Navigation Arrows */}
            <div className="flex items-center justify-between pt-3 border-t border-[#e5c07b]/15 text-xs">
              <button
                type="button"
                onClick={() => onSelectCardIndex(Math.max(0, activeCardIndex - 1))}
                disabled={activeCardIndex === 0}
                className={`px-3 py-1.5 rounded-lg border flex items-center gap-1 transition-all ${
                  activeCardIndex > 0
                    ? "border-[#e5c07b]/40 text-[#f5deaa] hover:bg-[#140b24] cursor-pointer"
                    : "border-transparent text-[#9c93b8]/30 cursor-not-allowed"
                }`}
              >
                <span>← ใบก่อนหน้า</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectCardIndex(Math.min(totalCards - 1, activeCardIndex + 1))}
                disabled={activeCardIndex === totalCards - 1}
                className={`px-3 py-1.5 rounded-lg border flex items-center gap-1 transition-all ${
                  activeCardIndex < totalCards - 1
                    ? "border-[#e5c07b]/40 text-[#f5deaa] hover:bg-[#140b24] cursor-pointer"
                    : "border-transparent text-[#9c93b8]/30 cursor-not-allowed"
                }`}
              >
                <span>ใบถัดไป →</span>
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
            <div className="p-4 rounded-2xl bg-[#FCF0E6] border border-[#D6B48D] text-xs sm:text-sm text-[#5A432F] font-serif-th leading-relaxed italic">
              “{reading.opening}”
            </div>
          )}

          {/* Connections */}
          {reading?.connections && (
            <div className="p-5 rounded-2xl bg-[#FDF7F0] border border-[#D6B48D] space-y-1.5 shadow-xs">
              <h5 className="font-serif-th text-xs sm:text-sm font-bold text-[#5A432F] flex items-center gap-2">
                <span className="text-[#CD9F5B]">✨</span> ความเชื่อมโยงของไพ่ทั้งชุด
              </h5>
              <p className="text-xs sm:text-sm text-[#5A432F] leading-relaxed">
                {reading.connections}
              </p>
            </div>
          )}

          {/* Core Summary */}
          {reading?.summary && (
            <div className="p-5 rounded-2xl bg-[#FFFFFF] border-2 border-[#CD9F5B] space-y-2 shadow-sm">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h5 className="font-serif-th text-sm sm:text-base font-bold font-mystic-gold flex items-center gap-2">
                  <span className="text-[#CD9F5B]">✦</span> บทสรุปคำทำนายและแนวโน้ม
                </h5>
                <div className="flex items-center gap-2">
                  {reading.yesNoAnswer && (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#CD9F5B] text-[#FDF7F0]">
                      คำตอบ: {reading.yesNoAnswer}
                    </span>
                  )}
                  <TTSReaderButton
                    textToRead={`บทสรุปคำทำนายและแนวโน้ม. ${reading.summary || ""}. ${
                      reading.advice ? "คำแนะนำคือ " + reading.advice.join(", ") : ""
                    }`}
                    personaId={persona.id}
                  />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-[#5A432F] font-serif-th leading-relaxed">
                {reading.summary}
              </p>
              {reading.timing && (
                <p className="text-xs text-[#CD9F5B] pt-1 font-mono font-semibold">
                  ✦ ช่วงเวลา: {reading.timing}
                </p>
              )}
            </div>
          )}

          {/* Actionable Advice Checklist */}
          {reading?.advice && reading.advice.length > 0 && (
            <div className="p-5 rounded-2xl bg-[#FCF0E6] border border-[#D6B48D] space-y-2.5">
              <h5 className="font-serif-th text-xs sm:text-sm font-bold text-[#5A432F] flex items-center gap-2">
                <span className="text-[#CD9F5B]">✦</span> คำแนะนำและสิ่งที่ควรทำ
              </h5>
              <ul className="space-y-2">
                {reading.advice.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-[#5A432F]">
                    <span className="w-4 h-4 rounded-full bg-[#CD9F5B]/20 text-[#CD9F5B] font-bold flex items-center justify-center flex-shrink-0 text-[10px] mt-0.5">
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
              title="คำคมพลังใจศักดิ์สิทธิ์"
              hint="ข้อคิดนำทางที่กลั่นจากไพ่ทั้งชุด"
              icon="✨"
            >
              <OracleMantraCard cards={allCards} drawn={drawnCards} personaNameTh={persona.nameTh} />
            </CollapsibleCard>
          )}

          {/* Elemental Balance 4-Elements Analysis */}
          {allCards.length > 0 && (
            <CollapsibleCard
              title="สมดุลพลังงาน 4 ธาตุในผัง"
              hint="วิเคราะห์คลื่นพลังงาน ไฟ · น้ำ · ลม · ดิน"
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
          <div className="p-5 rounded-2xl bg-gradient-to-r from-[#1b1236] via-[#120a26] to-[#1b1236] border border-[#e5c07b]/40 shadow-2xl space-y-3 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400">✨</span>
                  <h4 className="font-serif-th text-xs sm:text-sm font-bold text-[#f5deaa]">
                    ต้องการคำปรึกษาเจาะลึกเฉพาะบุคคลเพิ่มเติม?
                  </h4>
                </div>
                <p className="text-[11px] sm:text-xs text-[#b8aed4] leading-relaxed font-serif-th">
                  ปรึกษาแม่หมอตัวจริงตัวเป็นๆ พร้อมส่งต่อผังไพ่ชุดนี้ให้อัตโนมัติ เพื่อสนทนาเจาะลึกผ่าน LINE ส่วนตัว
                </p>
              </div>

              <Link
                href="/readers"
                onClick={() => trackEvent("reader_consult_click", { source: "stream_end" })}
                className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f7e7b4] to-[#c59b27] text-[#0a0715] font-serif-th font-bold text-xs shadow-lg hover:opacity-95 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                <span>ปรึกษาแม่หมอตัวจริง</span>
                <span>➔</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* AI Disclosure Banner — ต้องแสดงเสมอ ห้ามซ่อน */}
      <div className="mt-4 pt-3 border-t border-[#e5c07b]/15 space-y-3">
        <p className="text-[10px] text-[#9c93b8] leading-relaxed text-center font-serif-th">
          🤖 คำอ่านนี้สร้างโดยปัญญาประดิษฐ์ (AI) จากไพ่ที่คุณเปิดจริง มีไว้เพื่อการใคร่ครวญและความบันเทิง
          ไม่ใช่คำแนะนำทางการแพทย์ กฎหมาย หรือการเงิน การตัดสินใจทุกอย่างยังเป็นของคุณเสมอ
        </p>

        {/* Accuracy Rating — A/B data collection */}
        {!isStreaming && reading?.summary && (
          <AccuracyRatingWidget personaId={persona.id} readingId={readingId || undefined} />
        )}
      </div>
    </div>
  );
};
