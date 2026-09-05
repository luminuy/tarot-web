"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { DECK } from "@/data/cards";
import type { TarotCard as TarotCardType } from "@/data/cards/types";
import { TarotCard } from "@/components/card/TarotCard";
import { soundManager } from "@/lib/utils/audio";
import { useLocale } from "@/lib/i18n";
import { saveReading } from "@/lib/utils/history";

type DailyFocus = "general" | "work" | "money" | "love" | "mind";

interface FocusTopic {
  id: DailyFocus;
  labelTh: string;
  labelEn: string;
  badge: string;
}

const FOCUS_TOPICS: FocusTopic[] = [
  { id: "general", labelTh: "พลังงานภาพรวม", labelEn: "Overall Energy", badge: "ภาพรวม" },
  { id: "work", labelTh: "การงาน & การตัดสินใจ", labelEn: "Career & Decisions", badge: "การงาน" },
  { id: "money", labelTh: "การเงิน & โชคลาภ", labelEn: "Finance & Fortune", badge: "การเงิน" },
  { id: "love", labelTh: "ความรัก & คนในใจ", labelEn: "Love & Bond", badge: "ความรัก" },
  { id: "mind", labelTh: "สติปัญญา & จิตวิญญาณ", labelEn: "Mind & Spirit", badge: "จิตวิญญาณ" },
];

export function DailyClient() {
  const { isEnglish } = useLocale();
  const [, startTransition] = useTransition();

  const [selectedFocus, setSelectedFocus] = useState<DailyFocus>("general");
  const [intentionText, setIntentionText] = useState("");
  const [status, setStatus] = useState<"idle" | "shuffling" | "picking" | "ready" | "revealed">("idle");
  const [drawnCard, setDrawnCard] = useState<TarotCardType | null>(null);
  const [fairnessHash, setFairnessHash] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [savedToHistory, setSavedToHistory] = useState(false);

  // วันที่ปัจจุบันแบบไทย
  const todayDateString = new Intl.DateTimeFormat(isEnglish ? "en-US" : "th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  // สลับไพ่ด้วย Web Crypto API
  const handleStartDraw = () => {
    soundManager.playShuffleSound();
    setStatus("shuffling");

    setTimeout(() => {
      const randomBuffer = new Uint32Array(2);
      if (typeof window !== "undefined" && window.crypto) {
        window.crypto.getRandomValues(randomBuffer);
      }
      const cardIndex = randomBuffer[0] % DECK.length;
      const card = DECK[cardIndex];

      const hashString = `daily-${Date.now()}-${randomBuffer[0]}-${card.id}`;
      setFairnessHash(
        Array.from(new Uint8Array(new TextEncoder().encode(hashString)))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
          .slice(0, 16)
      );

      startTransition(() => {
        setDrawnCard(card);
        setStatus("picking");
      });
    }, 1100);
  };

  const handlePickFromFan = () => {
    soundManager.playCardSelectSound();
    setStatus("ready");
  };

  const handleRevealCard = () => {
    soundManager.playCardFlipSound();
    setStatus("revealed");

    if (drawnCard) {
      try {
        saveReading({
          spreadId: "daily-one",
          spreadName: isEnglish ? "Daily Tarot (1 Card)" : "ไพ่ยิปซีรายวัน (1 ใบ)",
          question: intentionText.trim() || (isEnglish ? "Daily Energy Reading" : "ดูดวงพลังงานประจำวัน"),
          category: selectedFocus === "love" ? "love" : selectedFocus === "work" ? "work" : selectedFocus === "money" ? "money" : "general",
          personaId: "seer",
          personaName: isEnglish ? "Seer Oracle" : "แม่หมอ AI",
          cards: [
            {
              order: 0,
              positionName: isEnglish ? "Daily Card" : "ไพ่ประจำวัน",
              cardIndex: DECK.findIndex((c) => c.id === drawnCard.id),
              cardNameTh: drawnCard.nameTh,
              cardNameEn: drawnCard.nameEn,
              isReversed: false,
              element: drawnCard.element,
            },
          ],
          summary: drawnCard.meanings.general.upright,
        });
        setSavedToHistory(true);
      } catch {
        // Ignored
      }
    }
  };

  const handleReset = () => {
    soundManager.playMenuTapSound();
    setStatus("idle");
    setDrawnCard(null);
    setCopied(false);
    setSavedToHistory(false);
  };

  const handleShare = () => {
    if (!drawnCard) return;
    const textToShare = isEnglish
      ? `My Daily Tarot: ${drawnCard.nameEn} — Free reading at ${window.location.href}`
      : `ไพ่ยิปซีประจำวันของฉัน: ${drawnCard.nameTh} (${drawnCard.nameEn}) — เปิดไพ่ประจำวันฟรีที่ ${window.location.href}`;

    if (navigator.share) {
      navigator
        .share({
          title: isEnglish ? "Daily Tarot Reading" : "ดูดวงไพ่ยิปซีรายวัน",
          text: textToShare,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(textToShare);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F0EA] text-[#29261F] py-6 sm:py-10 px-4 sm:px-6 font-sans relative overflow-x-clip">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="text-xs font-serif-th text-[#7A6F5D]">
          <ol className="flex items-center gap-2 flex-wrap">
            <li>
              <Link href="/" className="hover:text-[#29261F] transition-colors">
                {isEnglish ? "Home" : "หน้าแรก"}
              </Link>
            </li>
            <li aria-hidden="true" className="text-[#D5CEC2]">/</li>
            <li className="font-semibold text-[#29261F]" aria-current="page">
              {isEnglish ? "Daily Tarot" : "ดูดวงไพ่ยิปซีรายวัน"}
            </li>
          </ol>
        </nav>

        {/* Hero Header matching TarotFlow */}
        <header className="text-center space-y-3 pt-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#D9C8AC] bg-[#FFFFFF] text-xs font-serif-th font-semibold text-[#8F5C1A] shadow-[var(--shadow-raised)]">
            <span>{todayDateString}</span>
            <span className="text-[#D5CEC2]">·</span>
            <span>{isEnglish ? "1909 Rider-Waite" : "สำรับ 1909 แท้ 78 ใบ"}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-serif-th font-bold text-[#29261F] tracking-wide leading-snug sm:leading-normal [text-wrap:balance]">
            {isEnglish ? "Interactive Daily Tarot Oracle" : "ดูดวงไพ่ยิปซีรายวัน นำทางชีวิตวันนี้"}
          </h1>

          <p className="text-xs sm:text-sm text-[#635B4E] max-w-xl mx-auto font-serif-th leading-relaxed [text-wrap:balance]">
            {isEnglish
              ? "Center your awareness, focus on your focus area today, and draw your card with provably fair Web Crypto randomness."
              : "ตั้งจิตให้สงบ เลือกประเด็นที่ต้องการแนวทางวันนี้ แล้วแตะเปิดไพ่ 1 ใบเพื่อรับข้อคิดเตือนสติและพลังงานนำทางชีวิต"}
          </p>
        </header>

        {/* Sacred Altar Panel (Matching Homepage Altar Cloth & Altar Panel) */}
        <section
          aria-label="Altar card picking area"
          className="altar-panel rounded-2xl p-5 sm:p-8 space-y-6 relative overflow-hidden"
        >
          {/* Step 1: Intention & Focus Setting */}
          {status === "idle" && (
            <div className="space-y-6">
              <div className="space-y-3 max-w-xl mx-auto text-center">
                <label className="block text-xs uppercase tracking-wider font-serif-th font-semibold text-[#8F5C1A]">
                  {isEnglish ? "Select Today's Intention Focus" : "1. เลือกเรื่องที่ต้องการเปิดรับพลังงานวันนี้"}
                </label>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {FOCUS_TOPICS.map((topic) => {
                    const isSelected = selectedFocus === topic.id;
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => {
                          soundManager.playMenuTapSound();
                          setSelectedFocus(topic.id);
                        }}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-serif-th font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#29261F] text-[#FAF7F2] shadow-[var(--shadow-raised)]"
                            : "bg-[#FFFFFF] border border-[#D9C8AC] text-[#635B4E] hover:border-[#8F5C1A] hover:bg-[#FAF7F2]"
                        }`}
                      >
                        {isEnglish ? topic.labelEn : topic.labelTh}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <input
                    type="text"
                    value={intentionText}
                    onChange={(e) => setIntentionText(e.target.value)}
                    placeholder={
                      isEnglish
                        ? "Optional: Enter your specific question or thought for today..."
                        : "ตั้งจิตอธิษฐาน: พิมพ์เรื่องหรือคำถามที่อยู่ในใจวันนี้ (หรือไม่ระบุก็ได้)..."
                    }
                    className="w-full rounded-xl border border-[#D9C8AC] bg-[#FAF8F5] px-4 py-2.5 text-xs sm:text-sm font-serif-th text-[#29261F] placeholder-[#A59A88] focus:border-[#8F5C1A] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Central Altar Cloth & Deck Display */}
              <div className="altar-cloth p-6 sm:p-10 flex flex-col items-center justify-center space-y-6">
                <div className="cursor-pointer" onClick={handleStartDraw}>
                  <TarotCard
                    size="lg"
                    isRevealed={false}
                    isHighlighted={true}
                    positionLabel="ไพ่ประจำวันนี้"
                  />
                </div>

                <div className="space-y-2 text-center">
                  <button
                    type="button"
                    onClick={handleStartDraw}
                    className="px-8 py-3 rounded-full bg-[#29261F] text-[#FAF7F2] font-serif-th text-xs sm:text-sm font-bold shadow-[var(--shadow-raised)] hover:bg-[#A58A5C] active:scale-95 transition-all cursor-pointer"
                  >
                    {isEnglish ? "Shuffle 78 Cards & Connect" : "สับไพ่และเลือกไพ่ประจำวัน"}
                  </button>
                  <p className="text-[11px] font-serif-th text-[#7A6F5D]">
                    {isEnglish
                      ? "Provably Fair Web Crypto RNG · Pure 1909 Rider-Waite Smith"
                      : "สับไพ่ 78 ใบด้วยอัลกอริทึมเข้ารหัสสุ่มแท้ ไม่มีการล็อกผล 100%"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Shuffling Animation */}
          {status === "shuffling" && (
            <div className="altar-cloth p-12 sm:p-16 flex flex-col items-center justify-center space-y-4">
              <div className="w-24 h-40 rounded-lg border-2 border-[#8F5C1A] card-back-pattern shadow-[var(--shadow-overlay)] animate-pulse flex items-center justify-center">
                <span className="text-xs font-serif-th text-[#FFFFFF] tracking-wider uppercase">
                  {isEnglish ? "Shuffling..." : "กำลังสับไพ่..."}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-serif-th text-[#635B4E] animate-pulse">
                {isEnglish
                  ? "Aligning your daily energy with the 78 sacred archetypes..."
                  : "กำลังสับไพ่ 78 ใบเพื่อเชื่อมโยงกระแสพลังงานของคุณ..."}
              </p>
            </div>
          )}

          {/* Step 3: Card Fan Arc (Manual Self-Reveal) */}
          {status === "picking" && (
            <div className="altar-cloth p-6 sm:p-8 space-y-6 text-center animate-in fade-in duration-300">
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wider font-serif-th font-semibold text-[#8F5C1A]">
                  {isEnglish ? "Step 2: Choose Your Card" : "ขั้นตอนที่ 2: เลือกหยิบไพ่ 1 ใบจากสำรับ"}
                </span>
                <p className="text-xs sm:text-sm font-serif-th text-[#635B4E]">
                  {isEnglish
                    ? "Use your intuition and tap the card that calls to you."
                    : "ใช้สมาธิสัมผัส แล้วแตะเลือกไพ่ใบที่ดึงดูดใจคุณมากที่สุด"}
                </p>
              </div>

              {/* Fanned Arc with Sacred Card Back Pattern */}
              <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 overflow-x-auto py-6 px-2 no-scrollbar">
                {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={handlePickFromFan}
                    className="w-14 h-24 sm:w-20 sm:h-34 rounded-lg card-back-pattern border-2 border-[#D9C8AC] shadow-[var(--shadow-raised)] hover:-translate-y-3 hover:border-[#8F5C1A] hover:ring-2 hover:ring-[#8F5C1A]/40 transition-all duration-200 cursor-pointer flex-shrink-0 flex items-center justify-center group"
                  >
                    <span className="text-[10px] font-mono text-[#D9C8AC] group-hover:text-white">
                      #{idx + 1}
                    </span>
                  </button>
                ))}
              </div>

              {fairnessHash && (
                <p className="text-[10px] font-mono text-[#7A6F5D]">
                  Proof Seed: {fairnessHash}
                </p>
              )}
            </div>
          )}

          {/* Step 4: Ready to Flip */}
          {status === "ready" && drawnCard && (
            <div className="altar-cloth p-8 sm:p-12 flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in duration-300">
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wider font-serif-th font-semibold text-[#8F5C1A]">
                  {isEnglish ? "Step 3: Reveal Today's Oracle" : "ขั้นตอนที่ 3: แตะเพื่อเปิดคำทำนาย"}
                </span>
                <p className="text-xs sm:text-sm font-serif-th text-[#635B4E]">
                  {isEnglish ? "Tap the card to reveal your truth." : "ไพ่ตอบรับสมาธิของคุณแล้ว แตะเพื่อพลิกไพ่ 3D"}
                </p>
              </div>

              <div className="cursor-pointer" onClick={handleRevealCard}>
                <TarotCard
                  size="lg"
                  isRevealed={false}
                  isHighlighted={true}
                  positionLabel="แตะเพื่อพลิกไพ่"
                />
              </div>
            </div>
          )}

          {/* Step 5: Revealed Reading */}
          {status === "revealed" && drawnCard && (
            <div className="space-y-8 animate-in fade-in duration-500 text-left">
              {/* Card Meta & Header Display with TarotCard */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-[#D9C8AC]/40 pb-6">
                <div className="flex-shrink-0">
                  <TarotCard
                    size="md"
                    isRevealed={true}
                    card={drawnCard}
                    imageFull={true}
                  />
                </div>

                <div className="space-y-3 flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#EAE7E0] border border-[#D9C8AC] text-xs font-serif-th font-semibold text-[#8F5C1A]">
                      {drawnCard.arcana === "major" ? "Major Arcana (ชุดใหญ่)" : "Minor Arcana (ชุดเล็ก)"}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-[#FAF8F5] border border-[#D9C8AC] text-xs font-serif-th text-[#635B4E]">
                      ธาตุ{drawnCard.element}
                    </span>
                    {savedToHistory && (
                      <span className="px-3 py-1 rounded-full bg-[#EAF2EC] border border-[#9DC3A6] text-xs font-serif-th text-[#2D6A4F] font-semibold">
                        บันทึกลงสมุดดูดวงแล้ว
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-serif-th font-bold text-[#29261F]">
                    {drawnCard.nameTh} ({drawnCard.nameEn})
                  </h2>

                  <p className="text-xs sm:text-sm font-serif-th text-[#8F5C1A] font-semibold">
                    {drawnCard.keywords.upright.join(" • ")}
                  </p>

                  <p className="text-xs font-serif-th text-[#7A6F5D]">
                    {drawnCard.astrology ? `ความเชื่อมโยง: ${drawnCard.astrology}` : ""}
                  </p>
                </div>
              </div>

              {/* 5-Dimension Synthesized Interpretation (Porcelain Cards) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pillar 1: General Energy */}
                <div className="altar-card-porcelain p-5 rounded-xl space-y-1.5 md:col-span-2">
                  <h3 className="text-xs font-serif-th font-bold uppercase tracking-wider text-[#8F5C1A]">
                    {isEnglish ? "Daily Core Energy" : "พลังงานหลักประจำวัน"}
                  </h3>
                  <p className="text-sm font-serif-th text-[#29261F] leading-relaxed">
                    {drawnCard.meanings.general.upright}
                  </p>
                </div>

                {/* Pillar 2: Career */}
                <div className="altar-card-porcelain p-5 rounded-xl space-y-1.5">
                  <h3 className="text-xs font-serif-th font-bold uppercase tracking-wider text-[#8F5C1A]">
                    {isEnglish ? "Work & Career" : "การงานและการตัดสินใจ"}
                  </h3>
                  <p className="text-sm font-serif-th text-[#29261F] leading-relaxed">
                    {drawnCard.meanings.work.upright}
                  </p>
                </div>

                {/* Pillar 3: Money */}
                <div className="altar-card-porcelain p-5 rounded-xl space-y-1.5">
                  <h3 className="text-xs font-serif-th font-bold uppercase tracking-wider text-[#8F5C1A]">
                    {isEnglish ? "Finance & Fortune" : "การเงินและสภาพคล่อง"}
                  </h3>
                  <p className="text-sm font-serif-th text-[#29261F] leading-relaxed">
                    {drawnCard.meanings.money.upright}
                  </p>
                </div>

                {/* Pillar 4: Love */}
                <div className="altar-card-porcelain p-5 rounded-xl space-y-1.5">
                  <h3 className="text-xs font-serif-th font-bold uppercase tracking-wider text-[#8F5C1A]">
                    {isEnglish ? "Love & Bond" : "ความรักและความรู้สึก"}
                  </h3>
                  <p className="text-sm font-serif-th text-[#29261F] leading-relaxed">
                    {drawnCard.meanings.love.upright}
                  </p>
                </div>

                {/* Pillar 5: Mindful Caution */}
                <div className="altar-card-porcelain p-5 rounded-xl space-y-1.5">
                  <h3 className="text-xs font-serif-th font-bold uppercase tracking-wider text-[#8F5C1A]">
                    {isEnglish ? "Daily Mindful Reflection" : "ข้อคิดเตือนสติประจำวัน"}
                  </h3>
                  <p className="text-sm font-serif-th text-[#29261F] leading-relaxed">
                    {drawnCard.meanings.self.upright}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-6 pt-4 border-t border-[#D9C8AC]/40">
                <div className="flex flex-wrap items-center justify-center sm:justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-5 py-2.5 rounded-full border border-[#D9C8AC] bg-white text-[#29261F] text-xs font-serif-th font-semibold hover:border-[#8F5C1A] hover:bg-[#FAF7F2] transition-colors cursor-pointer shadow-xs"
                  >
                    {isEnglish ? "Draw Again / Reset" : "สลับเรื่อง / เปิดใหม่อีกครั้ง"}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleShare}
                      className="px-6 py-2.5 rounded-full bg-[#29261F] text-[#FAF7F2] text-xs font-serif-th font-bold hover:bg-[#A58A5C] transition-colors cursor-pointer shadow-xs"
                    >
                      {copied
                        ? isEnglish
                          ? "Copied to Clipboard!"
                          : "คัดลอกข้อความแล้ว"
                        : isEnglish
                        ? "Share Reading"
                        : "แชร์ผลทำนายวันนี้"}
                    </button>

                    <Link
                      href={`/cards/${drawnCard.id}`}
                      className="px-5 py-2.5 rounded-full bg-[#EAE7E0] border border-[#D9C8AC] text-[#29261F] text-xs font-serif-th font-semibold hover:bg-[#D5CEC2] transition-colors shadow-xs"
                    >
                      {isEnglish ? "Full Card Meaning" : "อ่านความหมายไพ่ใบนี้ฉบับเต็ม"}
                    </Link>
                  </div>
                </div>

                {/* Internal Workflow Cards (QuickTopic Style) */}
                <div className="space-y-3 pt-2">
                  <div className="text-center sm:text-left space-y-1">
                    <h3 className="text-sm sm:text-base font-serif-th font-bold text-[#29261F]">
                      ต้องการคำตอบที่ครอบคลุมและลึกซึ้งยิ่งขึ้น?
                    </h3>
                    <p className="text-xs font-serif-th text-[#7A6F5D]">
                      การเปิดไพ่ 1 ใบให้ข้อคิดประจำวัน หากต้องการวิเคราะห์เรื่องเฉพาะเจาะจง แนะนำผังเหล่านี้:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Link
                      href="/spreads/topic/love"
                      className="group p-4 rounded-2xl border border-[#EADFD5] hover:border-[#C48464] bg-gradient-to-br from-[#FFFFFF] via-[#FDFBF9] to-[#F7EFE9] transition-all duration-300 hover:-translate-y-0.5 shadow-xs block"
                    >
                      <div className="text-[10px] font-serif-th font-semibold px-2 py-0.5 rounded-full border bg-[#FBF2EC] text-[#9E4E28] border-[#E8D0C3] inline-block mb-2">
                        ยอดนิยม
                      </div>
                      <div className="text-sm font-serif-th font-bold text-[#29261F] group-hover:text-[#8F5C1A] transition-colors">
                        ผังดูดวงความรักเจาะลึก
                      </div>
                      <p className="text-xs font-serif-th text-[#635B4E] leading-relaxed mt-1">
                        ตรวจเช็กใจเขาใจเราและแนวโน้มความสัมพันธ์ 5-6 ใบ
                      </p>
                    </Link>

                    <Link
                      href="/spreads/celtic-cross"
                      className="group p-4 rounded-2xl border border-[#E6DEC9] hover:border-[#8F5C1A] bg-gradient-to-br from-[#FFFFFF] via-[#FCFAF5] to-[#F5EEE0] transition-all duration-300 hover:-translate-y-0.5 shadow-xs block"
                    >
                      <div className="text-[10px] font-serif-th font-semibold px-2 py-0.5 rounded-full border bg-[#F6EFE0] text-[#8F5C1A] border-[#E2D4BE] inline-block mb-2">
                        ผังโบราณ 10 ใบ
                      </div>
                      <div className="text-sm font-serif-th font-bold text-[#29261F] group-hover:text-[#8F5C1A] transition-colors">
                        ผังเซลติกครอส (Celtic Cross)
                      </div>
                      <p className="text-xs font-serif-th text-[#635B4E] leading-relaxed mt-1">
                        วิเคราะห์ภาพรวมชีวิต อดีต ปัจจุบัน อนาคต และจิตใต้สำนึก
                      </p>
                    </Link>

                    <Link
                      href="/readers"
                      className="group p-4 rounded-2xl border border-[#D5CEC2] hover:border-[#8F5C1A] bg-[#FFFFFF] transition-all duration-300 hover:-translate-y-0.5 shadow-xs block"
                    >
                      <div className="text-[10px] font-serif-th font-semibold px-2 py-0.5 rounded-full border bg-[#EAE7E0] text-[#5E5240] border-[#D5CEC2] inline-block mb-2">
                        แม่หมอตัวจริง
                      </div>
                      <div className="text-sm font-serif-th font-bold text-[#29261F] group-hover:text-[#8F5C1A] transition-colors">
                        ปรึกษานักพยากรณ์มืออาชีพ
                      </div>
                      <p className="text-xs font-serif-th text-[#635B4E] leading-relaxed mt-1">
                        นัดหมายพูดคุยส่วนตัวเพื่อตอบคำถามเฉพาะบุคคล
                      </p>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Informative Guidance & Educational Questions */}
        <section className="space-y-6 pt-4 border-t border-[#D9C8AC]/40">
          <div className="space-y-2 text-center max-w-xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-serif-th font-bold text-[#29261F]">
              ข้อควรรู้เกี่ยวกับการดูดวงไพ่ยิปซีรายวัน
            </h2>
            <p className="text-xs sm:text-sm font-serif-th text-[#7A6F5D]">
              แนวทางและหลักการเพื่อการเปิดรับพลังงานไพ่ทาโรต์อย่างมีสติ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="altar-card-porcelain p-5 rounded-2xl space-y-2">
              <h3 className="text-xs font-serif-th font-bold text-[#8F5C1A] uppercase tracking-wider">
                1. ควรดูเวลาไหนดีที่สุด?
              </h3>
              <p className="text-xs font-serif-th text-[#5C5549] leading-relaxed">
                ช่วงเวลาเช้าหลังตื่นนอน หรือก่อนเริ่มภารกิจประจำวัน เป็นช่วงที่จิตสงบที่สุด เหมาะสำหรับการตั้งสมาธิและเปิดรับสติเตือนใจ
              </p>
            </div>

            <div className="altar-card-porcelain p-5 rounded-2xl space-y-2">
              <h3 className="text-xs font-serif-th font-bold text-[#8F5C1A] uppercase tracking-wider">
                2. เปิดซ้ำในวันเดียวกันได้ไหม?
              </h3>
              <p className="text-xs font-serif-th text-[#5C5549] leading-relaxed">
                ไม่แนะนำให้เปิดไพ่รายวันซ้ำหลายรอบในวันเดียวกัน เพราะจะทำให้จิตใจสับสน หากมีคำถามเฉพาะ แนะนำให้ใช้ผัง 3 ใบ หรือผัง 10 ใบ
              </p>
            </div>

            <div className="altar-card-porcelain p-5 rounded-2xl space-y-2">
              <h3 className="text-xs font-serif-th font-bold text-[#8F5C1A] uppercase tracking-wider">
                3. ความแม่นยำและเจตจำนงเสรี
              </h3>
              <p className="text-xs font-serif-th text-[#5C5549] leading-relaxed">
                ไพ่ทาโรต์เป็นกระจกสะท้อนพลังงานและแนวโน้ม อนาคตที่แท้จริงถูกกำหนดด้วยการกระทำและการตัดสินใจอย่างมีสติของคุณเอง
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
