"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/lib/i18n";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import {
  PICK_A_CARD_TOPICS,
  type PickACardPile,
} from "@/data/pick-a-card";
import { TarotCard } from "@/components/card/TarotCard";
import { CardImage } from "@/components/card/CardImage";
import { soundManager } from "@/lib/utils/audio";
import { copyToClipboard } from "@/lib/utils/clipboard";
// สลับว่ารอบนี้กองไหนถือคำทำนายชุดไหน — กันไพ่ซ้ำเมื่อเลือกกองเดิมซ้ำ (INC-0198b)
import { drawContentOrder } from "@/lib/pick-a-card/draw-order";

export function PickACardClient() {
  const { isEnglish } = useLocale();

  // Active topic
  const [selectedTopicId, setSelectedTopicId] = useState<string>(PICK_A_CARD_TOPICS[0].id);
  const activeTopic =
    PICK_A_CARD_TOPICS.find((t) => t.id === selectedTopicId) || PICK_A_CARD_TOPICS[0];

  /**
   * ลำดับว่า "ช่องกองที่ N ถือคำทำนายชุดไหน" — เริ่มที่ลำดับตรงเพื่อให้ HTML ที่เสิร์ฟจากขอบ
   * ตรงกับรอบแรกของ hydration แล้วค่อยจั่วใหม่ใน useEffect (ฝั่งเบราว์เซอร์เท่านั้น)
   */
  const [contentOrder, setContentOrder] = useState<number[]>(() =>
    activeTopic.piles.map((_, index) => index)
  );

  // Selected pile within topic — เก็บ "ช่อง" ที่ผู้ใช้เลือก (ตัวตนของกอง/คริสตัล)
  const [selectedPileId, setSelectedPileId] = useState<string | null>(null);
  const slotIndex = activeTopic.piles.findIndex((p) => p.id === selectedPileId);

  /** ตัวตนของกองที่เลือก (เลข · ชื่อคริสตัล) */
  const selectedSlot: PickACardPile | null = slotIndex >= 0 ? activeTopic.piles[slotIndex] : null;
  /** ไพ่ 3 ใบ + คำทำนายของรอบนี้ — สลับทุกครั้งที่กลับมาหน้าเลือกกอง */
  const selectedPile: PickACardPile | null =
    slotIndex >= 0 ? activeTopic.piles[contentOrder[slotIndex] ?? slotIndex] : null;

  /** จั่วลำดับใหม่ทุกครั้งที่กลับมายืนหน้าเลือกกอง (รวมตอนเปิดหน้าครั้งแรก) */
  const reshuffle = () => {
    setContentOrder((prev) => drawContentOrder(activeTopic.piles.length, prev));
  };

  useEffect(() => {
    reshuffle();
    // จั่วใหม่เมื่อเปลี่ยนหัวข้อด้วย — คนละสำรับคนละคำทำนาย
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTopic.id]);

  // Revealed card indices in current pile (0, 1, 2)
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);

  // Sync with URL query parameter if provided on client
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const topicParam = params.get("topic");
      if (topicParam) {
        const matched = PICK_A_CARD_TOPICS.find(
          (t) => t.id === topicParam || t.slug === topicParam
        );
        if (matched) {
          setSelectedTopicId(matched.id);
        }
      }
    }
  }, []);

  const handleSelectTopic = (topicId: string) => {
    soundManager.playCardSelectSound();
    setSelectedTopicId(topicId);
    setSelectedPileId(null);
    setRevealedIndices(new Set());
  };

  const handleSelectPile = (pile: PickACardPile) => {
    soundManager.playCardSelectSound();
    setSelectedPileId(pile.id);
    setRevealedIndices(new Set());
  };

  const handleRevealCard = (index: number) => {
    soundManager.playCardFlipSound();
    setRevealedIndices((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  };

  const handleRevealAll = () => {
    soundManager.playCardFlipSound();
    setRevealedIndices(new Set([0, 1, 2]));
  };

  const handleResetPile = () => {
    soundManager.playCardSelectSound();
    setSelectedPileId(null);
    setRevealedIndices(new Set());
    // สลับสำรับใหม่ทุกครั้งที่ถอยกลับมาเลือกกอง — กองเดิมจะไม่ให้ไพ่ชุดเดิมซ้ำ
    reshuffle();
  };

  const handleCopyReading = async () => {
    if (!selectedPile || !selectedSlot) return;
    const reading = isEnglish ? selectedPile.readingEn : selectedPile.readingTh;
    const crystal = isEnglish ? selectedSlot.crystalEn : selectedSlot.crystalTh;
    const topic = isEnglish ? activeTopic.titleEn : activeTopic.titleTh;
    const pileLabel = isEnglish ? `Pile ${selectedSlot.number}` : `กองที่ ${selectedSlot.number}`;

    const textToCopy = `SeerTarot · Pick A Card (${topic})\n${pileLabel}: ${crystal}\n\n${reading.theme}\n\n${reading.overview}\n\nคำแนะนำ: ${reading.oracleAdvice}\n\nข้อคิดเตือนใจ: "${reading.affirmation}"\n\nเปิดไพ่พยากรณ์: https://seertarot.net/pick-a-card`;

    const ok = await copyToClipboard(textToCopy);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  };

  const crystalColorMap: Record<number, { bg: string; border: string; text: string; dot: string }> = {
    1: { bg: "bg-rose-950/20", border: "border-rose-300/40", text: "text-rose-200", dot: "bg-rose-300" },
    2: { bg: "bg-purple-950/20", border: "border-purple-300/40", text: "text-purple-200", dot: "bg-purple-300" },
    3: { bg: "bg-amber-950/20", border: "border-amber-300/40", text: "text-amber-200", dot: "bg-amber-300" },
    4: { bg: "bg-blue-950/20", border: "border-blue-300/40", text: "text-blue-200", dot: "bg-blue-300" },
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      {/* ── 1. Topic Navigation Tabs ── */}
      <nav aria-label={isEnglish ? "Pick A Card Topics" : "หัวข้อเลือกกองไพ่"} className="space-y-3">
        <div className="flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-line" />
          <span className="text-[10.5px] font-mono uppercase tracking-[0.22em] text-muted whitespace-nowrap">
            {isEnglish ? "Select Sacred Topic" : "เลือกหัวข้อพยากรณ์"}
          </span>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-line" />
        </div>

        {/* การ์ดหัวข้อพร้อมภาพไพ่ 1909 RWS ประจำหัวข้อ — ภาษาเดียวกับลิ้นชักนำทางทั้งเว็บ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {PICK_A_CARD_TOPICS.map((topic) => {
            const isActive = topic.id === activeTopic.id;
            return (
              <button
                key={topic.id}
                onClick={() => handleSelectTopic(topic.id)}
                className={`group relative flex items-center gap-2.5 min-h-[44px] p-2 sm:p-2.5 rounded-xl text-left border transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold ${
                  isActive
                    ? "bg-surface border-gold shadow-xs"
                    : "bg-inset/50 hover:bg-inset border-line/60 hover:border-line"
                }`}
                aria-pressed={isActive}
              >
                <span
                  className={`relative w-[30px] h-[48px] sm:w-[34px] sm:h-[54px] rounded-[5px] overflow-hidden border shrink-0 bg-canvas transition-colors ${
                    isActive ? "border-gold/70" : "border-line/70 group-hover:border-gold/50"
                  }`}
                >
                  <CardImage
                    cardId={topic.coverCardId}
                    alt=""
                    sizes="34px"
                    loading="lazy"
                    className={`w-full h-full object-cover transition-[filter,opacity] duration-200 ${
                      isActive ? "" : "opacity-70 saturate-[0.85] group-hover:opacity-100"
                    }`}
                  />
                </span>

                <span className="min-w-0 flex-1">
                  <span
                    className={`text-[12.5px] sm:text-[13px] font-serif-th leading-[1.7] line-clamp-2 transition-colors ${
                      isActive ? "font-bold text-gold-ink" : "font-semibold text-ink group-hover:text-gold-ink"
                    }`}
                  >
                    {isEnglish ? topic.titleEn : topic.titleTh}
                  </span>
                  <span className="block text-[10.5px] font-mono uppercase tracking-[0.14em] text-muted mt-0.5">
                    {isEnglish ? "4 Piles" : "4 กองไพ่"}
                  </span>
                </span>

                {isActive && (
                  <span
                    className="absolute -top-px left-3 right-3 h-[2px] rounded-full bg-gradient-to-r from-transparent via-gold to-transparent"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── 2. Current Topic Header ── */}
      <header className="text-center max-w-2xl mx-auto space-y-2.5">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif-th font-bold text-ink leading-tight">
          {isEnglish ? activeTopic.titleEn : activeTopic.titleTh}
        </h1>
        <p className="text-sm sm:text-base font-serif-th text-muted leading-relaxed">
          {isEnglish ? activeTopic.descriptionEn : activeTopic.descriptionTh}
        </p>
      </header>

      {/* ── 3. Main Altar: 4 Piles View vs. Revealed Pile View ── */}
      {!selectedPile ? (
        <section
          aria-label={isEnglish ? "Card Piles Altar" : "แท่นบูชาเลือกกองไพ่"}
          className="space-y-6 pt-2"
        >
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-inset border border-line text-xs font-serif-th text-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" aria-hidden="true" />
              <span>
                {isEnglish
                  ? "Choose 1 of 4 piles that resonates strongest with you"
                  : "เลือก 1 ใน 4 กองไพ่ที่ดึงดูดสายตาและจิตใจคุณมากที่สุด"}
              </span>
            </div>
            <p className="mt-2 text-[11.5px] font-serif-th text-muted leading-[1.7]">
              {isEnglish
                ? "Every time you step back and choose again, the piles are shuffled anew."
                : "ทุกครั้งที่ย้อนกลับมาเลือกใหม่ ไพ่ในแต่ละกองจะถูกสับใหม่ ไม่ซ้ำรอบที่แล้ว"}
            </p>
          </div>

          {/* 4 Sacred Piles Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {activeTopic.piles.map((pile) => {
              const styling = crystalColorMap[pile.number] || crystalColorMap[1];
              return (
                <div
                  key={pile.id}
                  onClick={() => handleSelectPile(pile)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelectPile(pile);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="group relative flex flex-col items-center text-center p-4 sm:p-5 rounded-2xl bg-surface/80 hover:bg-surface border border-line/80 hover:border-gold transition-colors duration-200 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  aria-label={
                    isEnglish
                      ? `Select Pile ${pile.number}: ${pile.crystalEn}`
                      : `เลือกกองที่ ${pile.number}: ${pile.crystalTh}`
                  }
                >
                  {/* Number & Crystal Badge */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-inset border border-line text-[11px] font-mono font-medium text-ink mb-4 group-hover:border-gold/60 transition-colors">
                    <span className={`w-1.5 h-1.5 rounded-full ${styling.dot}`} aria-hidden="true" />
                    <span>{isEnglish ? `Pile ${pile.number}` : `กองที่ ${pile.number}`}</span>
                  </div>

                  {/*
                    3D Stacked Deck — ใช้หลังไพ่ชุดเดียวกับทั้งเว็บ (`.card-back-pattern`)
                    ⛔ ห้ามวาดหลังไพ่ขึ้นมาใหม่เอง: เดิมกองนี้ใช้ `bg-[#1e1b18]` + ตัวหนังสือ
                    "SEER 1909 / TAROT" ซึ่งไม่ใช่หลังไพ่ของบ้านนี้ (เจ้าของทักว่า "หลังไพ่ไม่เหมือนเรา")
                    ลายจริงอยู่ที่ `.card-back-pattern` ใน globals.css — ตัวเดียวกับ TarotCard.tsx
                  */}
                  <div className="relative w-28 h-44 sm:w-32 sm:h-48 my-2 flex items-center justify-center">
                    {/* Background Stack Layers */}
                    <div
                      className="absolute inset-0 rounded-lg card-back-pattern border-2 border-line-warm/40 transform translate-x-2 translate-y-2 opacity-45"
                      aria-hidden="true"
                    />
                    <div
                      className="absolute inset-0 rounded-lg card-back-pattern border-2 border-line-warm/50 transform translate-x-1 translate-y-1 opacity-70"
                      aria-hidden="true"
                    />
                    {/* Top Card Back — ลายเดียวกับไพ่คว่ำหน้าทุกใบในเว็บ */}
                    <div className="relative w-full h-full rounded-lg card-back-pattern border-2 border-line-warm/60 p-3 flex flex-col items-center justify-between shadow-md group-hover:scale-105 transition-transform duration-200">
                      <div className="w-full flex justify-center items-center opacity-85">
                        <span className="text-[9px] sm:text-[10px] font-serif-th text-surface tracking-[0.18em] uppercase font-bold whitespace-nowrap">
                          Sacred Oracle
                        </span>
                      </div>
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-line-warm bg-ink-deep/90 flex items-center justify-center text-sm font-serif-th font-bold text-surface">
                        {pile.number}
                      </div>
                      <div className="w-full flex justify-center items-center opacity-60">
                        <div className="w-12 h-0.5 bg-inset-warm/60 rounded-full" />
                      </div>
                    </div>
                  </div>

                  {/* Crystal Title & Meaning */}
                  <div className="mt-3 space-y-1 w-full">
                    <h2 className="text-sm sm:text-base font-serif-th font-bold text-ink group-hover:text-gold-ink transition-colors line-clamp-1">
                      {isEnglish ? pile.crystalEn : pile.crystalTh}
                    </h2>
                    <p className="text-xs font-serif-th text-muted leading-relaxed line-clamp-2">
                      {isEnglish ? pile.crystalDescEn : pile.crystalDescTh}
                    </p>
                  </div>

                  {/* Tap affordance */}
                  <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-mono text-gold-ink group-hover:underline">
                    <span>{isEnglish ? "TAP TO REVEAL" : "แตะเพื่อเปิดคำทำนาย"}</span>
                    <span aria-hidden="true">→</span>
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        /* ── 4. Selected Pile & 3-Card Reveal Altar ── */
        <section
          aria-label={isEnglish ? "Revealed Pile Altar" : "แท่นเปิดไพ่ประจำกอง"}
          className="space-y-8"
        >
          {/* Top Bar for Selected Pile */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-surface border border-line">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-inset border border-line flex items-center justify-center text-base font-bold font-serif-th text-gold-ink">
                {selectedSlot?.number}
              </div>
              <div>
                <div className="text-xs font-mono text-muted uppercase tracking-wider">
                  {isEnglish ? `PILE ${selectedSlot?.number}` : `กองที่ ${selectedSlot?.number}`}
                </div>
                <div className="text-base font-serif-th font-bold text-ink leading-[1.7]">
                  {isEnglish ? selectedSlot?.crystalEn : selectedSlot?.crystalTh}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={handleRevealAll}
                className="flex-1 sm:flex-initial min-h-[44px] px-4 py-2 rounded-xl bg-inset hover:bg-inset/80 border border-line text-xs font-serif-th text-ink transition-colors cursor-pointer"
              >
                {isEnglish ? "Reveal All Cards" : "เปิดไพ่ทั้งหมด"}
              </button>
              <button
                onClick={handleResetPile}
                className="flex-1 sm:flex-initial min-h-[44px] px-4 py-2 rounded-xl bg-surface hover:bg-inset border border-line text-xs font-serif-th text-muted hover:text-ink transition-colors cursor-pointer"
              >
                {isEnglish ? "Choose Another Pile" : "เลือกกองอื่น"}
              </button>
            </div>
          </div>

          {/* 3 Authentic Rider-Waite Cards (Manual Reveal) */}
          <div className="space-y-3">
            <div className="text-center text-xs font-serif-th text-muted">
              {isEnglish
                ? "Tap each card to flip and unveil its hidden guidance"
                : "แตะที่ตัวไพ่เพื่อพลิกดูหน้าไพ่และคำทำนายทีละใบ"}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 justify-items-center">
              {selectedPile.cards.map((item, idx) => {
                const isFlipped = revealedIndices.has(idx);
                const positionLabel = isEnglish ? item.positionEn : item.positionTh;

                return (
                  <div
                    key={`${selectedPile.id}-card-${idx}`}
                    className="flex flex-col items-center space-y-2.5 w-full max-w-[220px]"
                  >
                    {/* Position Label Tag */}
                    <div className="px-3 py-1 rounded-full bg-inset border border-line text-[11.5px] font-serif-th text-muted font-medium text-center truncate w-full">
                      {positionLabel}
                    </div>

                    {/* 3D Tarot Card */}
                    <div className="w-[140px] h-[238px] sm:w-[150px] sm:h-[255px]">
                      <TarotCard
                        card={{ id: item.cardId }}
                        isReversed={item.isReversed}
                        isRevealed={isFlipped}
                        onClick={() => handleRevealCard(idx)}
                        size="responsive"
                        className="w-full h-full"
                        imageSizes="(min-width: 640px) 150px, 140px"
                      />
                    </div>

                    {/* Hint text if not flipped */}
                    {!isFlipped && (
                      <span className="text-[11px] font-mono text-muted/80 animate-pulse">
                        {isEnglish ? "TAP TO FLIP" : "แตะเพื่อเปิด"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 5. Detailed Reading Interpretation ── */}
          {revealedIndices.size > 0 && (
            <article
              aria-label={isEnglish ? "Card Pile Reading" : "คำทำนายประจำกองไพ่"}
              className="p-5 sm:p-8 rounded-2xl bg-surface border border-line space-y-6 shadow-sm"
            >
              {/* Reading Theme Header */}
              <div className="border-b border-line pb-4 space-y-1.5">
                <span className="text-[11px] font-mono text-gold-ink uppercase tracking-wider">
                  {isEnglish ? "CORE ENERGY" : "พลังงานหลักประจำกอง"}
                </span>
                <h2 className="text-xl sm:text-2xl font-serif-th font-bold text-ink leading-snug">
                  {isEnglish ? selectedPile.readingEn.theme : selectedPile.readingTh.theme}
                </h2>
                <p className="text-sm sm:text-base font-serif-th text-muted leading-relaxed pt-1">
                  {isEnglish ? selectedPile.readingEn.overview : selectedPile.readingTh.overview}
                </p>
              </div>

              {/* 3 Dimensional Breakdown */}
              <div className="space-y-4">
                {revealedIndices.has(0) && (
                  <div className="p-4 rounded-xl bg-inset/50 border border-line/60 space-y-1">
                    <h3 className="text-xs font-mono text-gold-ink uppercase tracking-wider">
                      {isEnglish
                        ? `1. ${selectedPile.cards[0].positionEn}`
                        : `1. ${selectedPile.cards[0].positionTh}`}
                    </h3>
                    <p className="text-xs sm:text-sm font-serif-th text-ink leading-relaxed">
                      {isEnglish
                        ? selectedPile.readingEn.currentSituation
                        : selectedPile.readingTh.currentSituation}
                    </p>
                  </div>
                )}

                {revealedIndices.has(1) && (
                  <div className="p-4 rounded-xl bg-inset/50 border border-line/60 space-y-1">
                    <h3 className="text-xs font-mono text-gold-ink uppercase tracking-wider">
                      {isEnglish
                        ? `2. ${selectedPile.cards[1].positionEn}`
                        : `2. ${selectedPile.cards[1].positionTh}`}
                    </h3>
                    <p className="text-xs sm:text-sm font-serif-th text-ink leading-relaxed">
                      {isEnglish
                        ? selectedPile.readingEn.hiddenLayer
                        : selectedPile.readingTh.hiddenLayer}
                    </p>
                  </div>
                )}

                {revealedIndices.has(2) && (
                  <div className="p-4 rounded-xl bg-inset/50 border border-line/60 space-y-1">
                    <h3 className="text-xs font-mono text-gold-ink uppercase tracking-wider">
                      {isEnglish
                        ? `3. ${selectedPile.cards[2].positionEn}`
                        : `3. ${selectedPile.cards[2].positionTh}`}
                    </h3>
                    <p className="text-xs sm:text-sm font-serif-th text-ink leading-relaxed">
                      {isEnglish
                        ? selectedPile.readingEn.oracleAdvice
                        : selectedPile.readingTh.oracleAdvice}
                    </p>
                  </div>
                )}
              </div>

              {/* Affirmation Frame */}
              {revealedIndices.size === 3 && (
                <div className="p-4 sm:p-5 rounded-xl bg-surface border-2 border-line-warm/60 text-center space-y-1.5">
                  <div className="text-[10.5px] font-mono text-gold-ink uppercase tracking-[0.18em]">
                    {isEnglish ? "AFFIRMATION FOR YOUR SOUL" : "ข้อคิดเตือนใจประจำกองไพ่"}
                  </div>
                  <p className="text-sm sm:text-base font-serif-th italic font-medium text-ink">
                    “{isEnglish ? selectedPile.readingEn.affirmation : selectedPile.readingTh.affirmation}”
                  </p>
                </div>
              )}

              {/* Action Buttons & Deep Link CTA */}
              <div className="pt-4 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  onClick={handleCopyReading}
                  className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-inset hover:bg-inset/80 border border-line text-xs font-serif-th text-ink transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-4 h-4 text-muted"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>
                    {copied
                      ? isEnglish
                        ? "Copied to Clipboard!"
                        : "คัดลอกคำทำนายแล้ว"
                      : isEnglish
                        ? "Copy Reading"
                        : "คัดลอกคำทำนาย"}
                  </span>
                </button>

                <Link
                  href={`/?spread=${selectedPile.targetSpreadId}`}
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-surface-dark text-canvas border border-line text-xs sm:text-sm font-serif-th font-semibold hover:border-gold transition-colors flex items-center justify-center gap-2"
                >
                  <span>
                    {isEnglish
                      ? "Consult AI Oracle for Deep Spread"
                      : "เปิดไพ่เจาะลึกเต็มรูปแบบกับแม่หมอ AI"}
                  </span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          )}
        </section>
      )}
    </div>
  );
}
