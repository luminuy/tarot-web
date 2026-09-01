"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { STAGGER, DUR, EASE } from "@/lib/motion";
import type { Reading } from "@/lib/schema/reading";
import type { Persona } from "@/data/personas";
import type { DrawnSlotCard } from "@/components/spread/SpreadBoard";
import { cardByIndex, type TarotCard } from "@/data/cards";
import { ElementalBalanceWidget } from "@/components/reading/ElementalBalanceWidget";
import { OracleMantraCard } from "@/components/reading/OracleMantraCard";
import { soundManager } from "@/lib/utils/audio";
import { FollowUpChat } from "./FollowUpChat";
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
  sessionToken?: string | null;
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
  sessionToken,
  proof,
  errorMsg,
  onRetry,
}) => {
  const [activeTab, setActiveTab] = useState<"card" | "summary" | "chat">("card");
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
    <div className="w-full rounded-3xl border border-[#e5c07b]/35 bg-gradient-to-b from-[#140d28]/95 via-[#0a0714]/95 to-[#05040a]/95 backdrop-blur-2xl p-5 sm:p-7 shadow-[0_0_50px_rgba(0,0,0,0.85)] flex flex-col justify-between space-y-6 relative overflow-hidden">
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
              className="w-full h-full object-cover object-top filter contrast-[1.04] brightness-[1.02] tarot-hd-card-image"
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
          className={`px-4 py-2 rounded-xl text-xs font-serif-th font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd700] ${
            activeTab === "card"
              ? "bg-gradient-to-r from-[#c59b27] via-[#f5deaa] to-[#e5c07b] text-[#05040a] shadow-[0_0_15px_rgba(229,192,123,0.4)]"
              : "bg-[#100b20] text-[#9c93b8] hover:text-[#f5deaa] border border-[#e5c07b]/20"
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
          className={`px-4 py-2 rounded-xl text-xs font-serif-th font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd700] ${
            activeTab === "summary"
              ? "bg-gradient-to-r from-[#c59b27] via-[#f5deaa] to-[#e5c07b] text-[#05040a] shadow-[0_0_15px_rgba(229,192,123,0.4)]"
              : "bg-[#100b20] text-[#9c93b8] hover:text-[#f5deaa] border border-[#e5c07b]/20"
          }`}
        >
          <span className="text-[#e5c07b]">✨</span>
          <span>สรุปภาพรวม & คำแนะนำ</span>
        </button>

        {readingId && (
          <button
            type="button"
            role="tab"
            id="chamber-tab-chat"
            aria-selected={activeTab === "chat"}
            aria-controls="chamber-panel-chat"
            onClick={() => setActiveTab("chat")}
            className={`px-4 py-2 rounded-xl text-xs font-serif-th font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd700] ${
              activeTab === "chat"
                ? "bg-gradient-to-r from-[#c59b27] via-[#f5deaa] to-[#e5c07b] text-[#05040a] shadow-[0_0_15px_rgba(229,192,123,0.4)]"
                : "bg-[#100b20] text-[#9c93b8] hover:text-[#f5deaa] border border-[#e5c07b]/20"
            }`}
          >
            <span className="text-[#e5c07b]">✦</span>
            <span>ถามแม่หมอต่อ</span>
          </button>
        )}
      </div>

      {/* Error / Recovery Banner */}
      {errorMsg && (
        <div
          role="alert"
          aria-live="assertive"
          className="anim-page-transition p-4 rounded-2xl bg-rose-950/90 border border-rose-600/50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg"
        >
          <div className="text-xs sm:text-sm text-rose-200 font-serif-th text-center sm:text-left">
            <span>✦ </span>
            <span>{errorMsg}</span>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f7e7b4] to-[#c59b27] text-[#0a0715] text-xs font-bold font-serif-th shadow hover:opacity-95 cursor-pointer active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap flex-shrink-0"
            >
              <span>✦</span> ลองอ่านใหม่อีกครั้ง (Retry)
            </button>
          )}
        </div>
      )}

      {/* TAB 1: CARD-BY-CARD INSPECTION VIEW */}
      {activeTab === "card" && (
        <div className="space-y-5">
          {/* Card Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {drawnCards.map((d, i) => (
              <button
                key={d.order}
                type="button"
                onClick={() => onSelectCardIndex(d.order)}
                className={`px-3 py-1.5 rounded-xl text-xs font-serif-th font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 select-none ${
                  activeCardIndex === d.order
                    ? "bg-[#e5c07b] text-[#05040a] font-bold shadow-md"
                    : "bg-[#100b20] text-[#9c93b8] hover:text-[#f5deaa] border border-[#e5c07b]/20"
                }`}
              >
                <span>ใบที่ {i + 1}</span>
                {(() => {
                  const card = d.card || (d.cardIndex !== undefined ? cardByIndex(d.cardIndex) : undefined);
                  return card ? <span className="text-[10px] opacity-80 font-normal">({card.nameTh})</span> : null;
                })()}
              </button>
            ))}
          </div>

          {/* Active Card Interpretation Showcase */}
          <div
            key={activeCardIndex}
            className="anim-page-transition p-5 sm:p-6 rounded-2xl bg-[#090614] border border-[#e5c07b]/30 shadow-inner space-y-4"
          >
            {/* Position & Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#e5c07b]/15">
              <div className="flex items-center gap-3.5">
                {/* Real 1909 Rider-Waite Thumbnail */}
                <div className={`w-14 h-[95px] rounded-lg overflow-hidden border border-[#e5c07b]/60 flex-shrink-0 shadow-md ${activeDrawnCard?.isReversed ? "rotate-180" : ""}`}>
                  <CardImage
                    image={cardData?.image || "major-00.jpg"}
                    alt={cardData?.nameTh || "Tarot"}
                    className="w-full h-full object-cover object-center filter contrast-[1.08] saturate-[1.08] brightness-[1.03] tarot-hd-card-image"
                    sizes="88px"
                  />
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-widest text-[#e5c07b] font-mono font-semibold">
                    ✦ ตำแหน่งที่ {activeCardIndex + 1}: {activeDrawnCard?.position.nameTh || "ตำแหน่งพลังงาน"}
                  </span>
                  <h4 className="font-serif-th text-lg sm:text-xl font-bold text-[#f5deaa] mt-0.5">
                    {cardData?.nameTh || `ไพ่ใบที่ ${activeCardIndex + 1}`}{" "}
                    {cardData?.nameEn && (
                      <span className="text-xs font-mono font-normal text-[#9c93b8]">
                        ({cardData.nameEn})
                      </span>
                    )}{" "}
                    <span className="text-xs font-serif-th font-semibold text-[#e5c07b]">
                      {activeDrawnCard?.isReversed ? "· ไพ่กลับหัว (Reversed)" : "· ไพ่ตรง (Upright)"}
                    </span>
                  </h4>
                </div>
              </div>

              {/* Elemental & Meaning Tag */}
              {activeDrawnCard?.position.meaning && (
                <span className="text-[10px] text-[#e5c07b] bg-[#e5c07b]/10 border border-[#e5c07b]/25 px-2.5 py-1 rounded-full font-serif-th self-start sm:self-auto">
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
                  <span className="text-[10px] text-[#9c93b8] font-mono">คีย์เวิร์ด:</span>
                  {keywords.map((kw: string, idx: number) => (
                    <span
                      key={idx}
                      className="text-[10px] text-[#f5deaa] bg-white/5 border border-white/10 px-2 py-0.5 rounded-md"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              ) : null;
            })()}

            {/* Interpretation Body */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between gap-2">
                {activeCardReading?.headline && (
                  <h5 className="font-serif-th text-sm font-bold text-[#e5c07b]">
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
                  className="text-xs sm:text-sm text-[#cfc8e2] leading-relaxed font-serif-th font-normal"
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
            <div className="p-4 rounded-2xl bg-[#090614] border border-[#e5c07b]/25 text-xs sm:text-sm text-[#f5deaa] font-serif-th leading-relaxed italic">
              “{reading.opening}”
            </div>
          )}

          {/* Connections */}
          {reading?.connections && (
            <div className="p-5 rounded-2xl bg-[#110a22] border border-[#8b5cf6]/40 space-y-1.5 shadow-lg">
              <h5 className="font-serif-th text-xs sm:text-sm font-bold text-[#e5c07b] flex items-center gap-2">
                <span>✨</span> ความเชื่อมโยงของไพ่ทั้งชุด
              </h5>
              <p className="text-xs sm:text-sm text-[#cfc8e2] leading-relaxed">
                {reading.connections}
              </p>
            </div>
          )}

          {/* Core Summary */}
          {reading?.summary && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1c1338] to-[#0d071a] border-2 border-[#e5c07b]/50 space-y-2 shadow-xl">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h5 className="font-serif-th text-sm sm:text-base font-bold font-mystic-gold flex items-center gap-2">
                  <span>✦</span> บทสรุปคำทำนายและแนวโน้ม
                </h5>
                <div className="flex items-center gap-2">
                  {reading.yesNoAnswer && (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#e5c07b] text-[#05040a]">
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
              <p className="text-xs sm:text-sm text-[#f5deaa] font-serif-th leading-relaxed">
                {reading.summary}
              </p>
              {reading.timing && (
                <p className="text-xs text-[#e5c07b] pt-1 font-mono">
                  ✦ ช่วงเวลา: {reading.timing}
                </p>
              )}
            </div>
          )}

          {/* Actionable Advice Checklist */}
          {reading?.advice && reading.advice.length > 0 && (
            <div className="p-5 rounded-2xl bg-[#090614] border border-[#e5c07b]/25 space-y-2.5">
              <h5 className="font-serif-th text-xs sm:text-sm font-bold text-[#e5c07b] flex items-center gap-2">
                <span>✦</span> คำแนะนำและสิ่งที่ควรทำ
              </h5>
              <ul className="space-y-2">
                {reading.advice.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-[#cfc8e2]">
                    <span className="w-4 h-4 rounded-full bg-[#e5c07b]/20 text-[#e5c07b] flex items-center justify-center flex-shrink-0 text-[10px] mt-0.5">
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
        </div>
      )}

      {/* TAB 3: FOLLOW-UP CHAT */}
      {activeTab === "chat" && readingId && (
        <div className="pt-2">
          <FollowUpChat
            readingId={readingId}
            persona={persona}
            sessionToken={sessionToken}
            readingSnapshot={{
              summary: reading?.summary,
              personaId: persona.id,
              drawn: drawnCards.map((d) => ({
                order: d.order,
                cardIndex: d.cardIndex !== undefined ? d.cardIndex : 0,
                isReversed: !!d.isReversed,
              })),
            }}
          />
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
