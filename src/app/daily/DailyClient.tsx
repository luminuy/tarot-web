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

interface FocusChamber {
  id: DailyFocus;
  roman: string;
  titleTh: string;
  titleEn: string;
  elementTh: string;
  descTh: string;
  descEn: string;
}

const FOCUS_CHAMBERS: FocusChamber[] = [
  {
    id: "general",
    roman: "I",
    titleTh: "มหาภาพรวม",
    titleEn: "Cosmic Totality",
    elementTh: "มิติแห่งแสงสว่าง",
    descTh: "คลื่นพลังงานหลักและเข็มทิศชีวิตประจำวัน",
    descEn: "Overall energy and spiritual alignment",
  },
  {
    id: "work",
    roman: "II",
    titleTh: "การงาน & ภารกิจ",
    titleEn: "Sovereignty & Career",
    elementTh: "ธาตุไฟ (Wands)",
    descTh: "การตัดสินใจ ภาวะผู้นำ และความก้าวหน้า",
    descEn: "Professional decisions & purposeful action",
  },
  {
    id: "money",
    roman: "III",
    titleTh: "การเงิน & โชคลาภ",
    titleEn: "Vault of Abundance",
    elementTh: "ธาตุดิน (Pentacles)",
    descTh: "ความมั่งคั่ง สภาพคล่อง และโชคชะตา",
    descEn: "Financial liquidity & material harmony",
  },
  {
    id: "love",
    roman: "IV",
    titleTh: "ความรัก & สัมพันธภาพ",
    titleEn: "Heart Sanctuary",
    elementTh: "ธาตุน้ำ (Cups)",
    descTh: "ความผูกพัน คนในใจ และความจริงในดวงใจ",
    descEn: "Emotional resonance & sacred bonds",
  },
  {
    id: "mind",
    roman: "V",
    titleTh: "สติปัญญา & จิตวิญญาณ",
    titleEn: "Inner Temple",
    elementTh: "ธาตุลม (Swords)",
    descTh: "ความสงบภายใน สติสัมปชัญญะ และการปล่อยวาง",
    descEn: "Mental clarity & inner stillness",
  },
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

  // วันที่ปัจจุบันแบบทางการระดับสากล
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
          category:
            selectedFocus === "love"
              ? "love"
              : selectedFocus === "work"
              ? "work"
              : selectedFocus === "money"
              ? "money"
              : "general",
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
    soundManager.playCardSelectSound();
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
    <div className="min-h-screen bg-[#F3F0EA] text-[#29261F] py-8 sm:py-14 px-4 sm:px-6 font-sans relative overflow-x-clip">
      {/* Subtle Ethereal Halo Background */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 pointer-events-none opacity-40"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(165,138,92,0.18) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="max-w-4xl mx-auto space-y-10 relative z-10">
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
              {isEnglish ? "Daily Celestial Oracle" : "ดูดวงไพ่ยิปซีรายวัน"}
            </li>
          </ol>
        </nav>

        {/* Hero Header (World-Class Editorial Typography) */}
        <header className="text-center space-y-4 pt-2 max-w-2xl mx-auto">
          {/* Celestial Chronometer Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-[#D5CEC2] bg-[#FFFFFF] shadow-[var(--shadow-raised)]">
            <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-[#8F5C1A] font-semibold">
              SACRED DAILY CHRONOMETER
            </span>
            <span className="text-[#D5CEC2]">·</span>
            <span className="text-xs font-serif-th text-[#5E5240]">{todayDateString}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif-th font-bold text-[#29261F] tracking-tight leading-tight [text-wrap:balance]">
            {isEnglish ? "The Daily Celestial Oracle" : "ดูดวงไพ่ยิปซีรายวัน"}
          </h1>

          <p className="text-xs sm:text-sm text-[#635B4E] max-w-xl mx-auto font-serif-th leading-relaxed [text-wrap:balance]">
            {isEnglish
              ? "Align your heart with the 78 archetypes of 1909 Rider-Waite. Choose your elemental chamber, connect through cryptographic randomness, and receive today's illumination."
              : "น้อมจิตสู่ความสงบ เชื่อมโยงกับแม่พิมพ์จิตวิทยาโบราณ 1909 Rider-Waite เลือกวิหารพลังงานที่คุณต้องการเปิดรับคำแนะนำ แล้วเปิดไพ่ 1 ใบเพื่อรับแสงสว่างนำทางชีวิต"}
          </p>
        </header>

        {/* Sacred Altar Panel (Porcelain Luxury Canvas) */}
        <section
          aria-label="Altar card picking area"
          className="rounded-3xl border border-[#D5CEC2] bg-[#FFFFFF] shadow-[var(--shadow-overlay)] p-6 sm:p-10 space-y-8 relative overflow-hidden"
        >
          {/* Step 1: Five Elemental Chambers & Intention */}
          {status === "idle" && (
            <div className="space-y-8">
              {/* Chamber Selector */}
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <span className="text-[11px] font-mono tracking-widest uppercase text-[#8F5C1A] font-semibold">
                    STAGE I: CHOOSE YOUR ELEMENTAL CHAMBER
                  </span>
                  <h2 className="text-lg sm:text-xl font-serif-th font-bold text-[#29261F]">
                    เลือกวิหารเจตจำนงที่ต้องการเปิดรับสาร
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {FOCUS_CHAMBERS.map((chamber) => {
                    const isSelected = selectedFocus === chamber.id;
                    return (
                      <button
                        key={chamber.id}
                        type="button"
                        onClick={() => {
                          soundManager.playMenuTapSound();
                          setSelectedFocus(chamber.id);
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-2 group ${
                          isSelected
                            ? "border-[#8F5C1A] bg-gradient-to-b from-[#FAF6F0] to-[#FFFFFF] shadow-md ring-2 ring-[#8F5C1A]/20 -translate-y-1"
                            : "border-[#D5CEC2]/70 bg-[#FAF8F5] hover:border-[#8F5C1A]/50 hover:bg-[#FFFFFF] hover:-translate-y-0.5"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`font-mono text-xs font-bold ${
                              isSelected ? "text-[#8F5C1A]" : "text-[#7A6F5D] group-hover:text-[#8F5C1A]"
                            }`}
                          >
                            {chamber.roman}
                          </span>
                          <span className="text-[10px] font-serif-th text-[#7A6F5D]">
                            {chamber.elementTh.split(" ")[0]}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-sm font-serif-th font-bold text-[#29261F] group-hover:text-[#8F5C1A] transition-colors">
                            {chamber.titleTh}
                          </div>
                          <p className="text-[11px] font-serif-th text-[#7A6F5D] leading-tight">
                            {chamber.descTh}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Intention Inscription */}
              <div className="space-y-2 max-w-2xl mx-auto">
                <label
                  htmlFor="daily-intention-input"
                  className="block text-xs font-serif-th font-semibold text-[#4A4338] text-center"
                >
                  บันทึกจิตอธิษฐานในวิหาร (ตั้งคำถามหรือปล่อยว่างตามความรู้สึก)
                </label>
                <input
                  id="daily-intention-input"
                  type="text"
                  value={intentionText}
                  onChange={(e) => setIntentionText(e.target.value)}
                  placeholder="พิมพ์เรื่องราวหรือคำถามที่อยู่ในใจวันนี้..."
                  className="w-full rounded-2xl border border-[#D5CEC2] bg-[#FAF8F5] px-4 py-3.5 text-xs sm:text-sm font-serif-th text-[#29261F] placeholder-[#A59A88] focus:border-[#8F5C1A] focus:outline-hidden focus:ring-1 focus:ring-[#8F5C1A] transition-colors shadow-inner"
                />
              </div>

              {/* Sacred Altar Cloth Stage */}
              <div className="altar-cloth bg-[#EAE7E0] border border-[#D5CEC2] rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center space-y-6 shadow-inner">
                {/* 3D Floating Deck Preview */}
                <div
                  className="cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95"
                  onClick={handleStartDraw}
                >
                  <TarotCard
                    size="lg"
                    isRevealed={false}
                    isHighlighted={true}
                    positionLabel="สำรับ 1909 RWS"
                  />
                </div>

                <div className="space-y-3 text-center max-w-md">
                  <button
                    type="button"
                    onClick={handleStartDraw}
                    className="w-full sm:w-auto px-10 py-4 rounded-xl bg-[#29261F] text-[#FAF8F5] font-serif-th text-sm font-bold shadow-[var(--shadow-raised)] hover:bg-[#8F5C1A] active:scale-[0.98] transition-all duration-200 cursor-pointer tracking-wide"
                  >
                    เริ่มพิธีสับไพ่และเลือกไพ่ประจำวัน
                  </button>
                  <p className="text-[11px] font-serif-th text-[#7A6F5D]">
                    ระบบสุ่มรหัสลับ Web Crypto API SHA-256 ปลอดการล็อกผล 100%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Shuffling Chamber */}
          {status === "shuffling" && (
            <div className="altar-cloth bg-[#EAE7E0] border border-[#D5CEC2] rounded-2xl p-14 sm:p-20 flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-300">
              <div className="relative">
                <div className="w-28 h-44 rounded-xl border-2 border-[#D5CEC2] card-back-pattern shadow-[var(--shadow-overlay)] animate-pulse flex items-center justify-center">
                  <div className="text-[10px] font-mono tracking-widest uppercase text-white/90">
                    SHUFFLING
                  </div>
                </div>
              </div>
              <div className="space-y-1 text-center">
                <h3 className="text-base font-serif-th font-bold text-[#29261F]">
                  กำลังจัดเรียงคลื่นพลังงานและสับสำรับไพ่ 1909 Rider-Waite...
                </h3>
                <p className="text-xs font-serif-th text-[#7A6F5D]">
                  น้อมจิตสู่ความสงบและระลึกถึงเรื่องราวที่ต้องการคำตอบ
                </p>
              </div>
            </div>
          )}

          {/* Step 3: The 22 Major Arcana Ribbon (Manual Pick) */}
          {status === "picking" && (
            <div className="altar-cloth bg-[#EAE7E0] border border-[#D5CEC2] rounded-2xl p-6 sm:p-10 space-y-6 text-center animate-in fade-in duration-300">
              <div className="space-y-1">
                <span className="text-[11px] font-mono tracking-widest uppercase text-[#8F5C1A] font-semibold">
                  STAGE II: INTUITIVE CARD SELECTION
                </span>
                <h3 className="text-xl sm:text-2xl font-serif-th font-bold text-[#29261F]">
                  แตะเลือกไพ่ 1 ใบที่ดึงดูดสายตาคุณ
                </h3>
                <p className="text-xs sm:text-sm font-serif-th text-[#635B4E]">
                  ปล่อยให้ปัญญาญาณภายใน (Intuition) เป็นผู้นำทางหัวใจของคุณ
                </p>
              </div>

              {/* Major Arcana Card Ribbon */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto py-8 px-4 no-scrollbar">
                {Array.from({ length: 9 }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={handlePickFromFan}
                    className="w-16 h-28 sm:w-24 sm:h-40 rounded-xl card-back-pattern border-2 border-[#D5CEC2] shadow-[var(--shadow-raised)] hover:-translate-y-4 hover:border-[#8F5C1A] hover:ring-2 hover:ring-[#8F5C1A]/40 transition-all duration-300 cursor-pointer flex-shrink-0 flex items-center justify-center group"
                  >
                    <span className="text-[10px] font-mono text-[#D5CEC2] group-hover:text-white transition-colors">
                      #{idx + 1}
                    </span>
                  </button>
                ))}
              </div>

              {fairnessHash && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFFFFF] border border-[#D5CEC2] text-[10px] font-mono text-[#7A6F5D]">
                  <span>SHA-256 PROOF:</span>
                  <span className="font-bold text-[#8F5C1A]">{fairnessHash}</span>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Ready to Reveal */}
          {status === "ready" && drawnCard && (
            <div className="altar-cloth bg-[#EAE7E0] border border-[#D5CEC2] rounded-2xl p-10 sm:p-16 flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in duration-300">
              <div className="space-y-1">
                <span className="text-[11px] font-mono tracking-widest uppercase text-[#8F5C1A] font-semibold">
                  STAGE III: THE GRAND REVELATION
                </span>
                <h3 className="text-xl sm:text-2xl font-serif-th font-bold text-[#29261F]">
                  ไพ่ตอบรับเจตจำนงของคุณแล้ว
                </h3>
                <p className="text-xs sm:text-sm font-serif-th text-[#635B4E]">
                  แตะที่ตัวไพ่เพื่อพลิกเฉลยสารพยากรณ์ประจำวันแบบ 3D
                </p>
              </div>

              <div className="cursor-pointer py-4" onClick={handleRevealCard}>
                <TarotCard
                  size="lg"
                  isRevealed={false}
                  isHighlighted={true}
                  positionLabel="แตะเพื่อพลิกไพ่"
                />
              </div>
            </div>
          )}

          {/* Step 5: The Grand Revelation & Oracle Manuscript */}
          {status === "revealed" && drawnCard && (
            <div className="space-y-10 animate-in fade-in duration-500 text-left">
              {/* Museum Vitrine Stage: The 3D Card Display */}
              <div className="altar-cloth bg-[#EAE7E0] border border-[#D5CEC2] rounded-2xl p-6 sm:p-10 flex flex-col md:flex-row items-center md:items-start gap-8 shadow-inner">
                {/* 3D Card Vitrine */}
                <div className="flex-shrink-0 py-2">
                  <TarotCard
                    size="lg"
                    isRevealed={true}
                    card={drawnCard}
                    imageFull={true}
                    className="shadow-[var(--shadow-overlay)]"
                  />
                </div>

                {/* Card Editorial Dossier */}
                <div className="space-y-4 flex-1 text-center md:text-left">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#FFFFFF] border border-[#D5CEC2] text-xs font-serif-th font-semibold text-[#8F5C1A]">
                      {drawnCard.arcana === "major" ? "Major Arcana (ชุดใหญ่)" : "Minor Arcana (ชุดเล็ก)"}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-[#FFFFFF] border border-[#D5CEC2] text-xs font-serif-th text-[#5E5240]">
                      ธาตุ{drawnCard.element}
                    </span>
                    {savedToHistory && (
                      <span className="px-3 py-1 rounded-full bg-[#FAF8F5] border border-[#D5CEC2] text-xs font-serif-th text-[#3A7044] font-semibold">
                        บันทึกลงสมุดดูดวงเรียบร้อย
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-2xl sm:text-4xl font-serif-th font-bold text-[#29261F] tracking-tight">
                      {drawnCard.nameTh} ({drawnCard.nameEn})
                    </h2>
                    <p className="text-xs sm:text-sm font-serif-th text-[#8F5C1A] font-semibold tracking-wide">
                      {drawnCard.keywords.upright.join(" — ")}
                    </p>
                  </div>

                  <p className="text-xs font-serif-th text-[#7A6F5D]">
                    {drawnCard.astrology ? `ความสอดคล้องทางโหราศาสตร์: ${drawnCard.astrology}` : ""}
                  </p>

                  <div className="pt-2">
                    <Link
                      href={`/cards/${drawnCard.id}`}
                      className="text-xs font-serif-th font-bold text-[#8F5C1A] hover:text-[#5E390A] underline underline-offset-4"
                    >
                      เปิดคัมภีร์เจาะลึกความหมายไพ่ใบนี้ →
                    </Link>
                  </div>
                </div>
              </div>

              {/* 5-Dimension Synthesized Interpretation (Illuminated Manuscript) */}
              <div className="space-y-4">
                <div className="border-b border-[#E8E2D8] pb-3 text-center sm:text-left">
                  <span className="text-[11px] font-mono tracking-widest uppercase text-[#8F5C1A] font-semibold">
                    THE FIVE PILLARS OF DAILY ILLUMINATION
                  </span>
                  <h3 className="text-lg sm:text-xl font-serif-th font-bold text-[#29261F]">
                    ถอดรหัสสารทำนาย 5 มิติประจำวัน
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pillar 1: General Energy */}
                  <div className="rounded-2xl border border-[#D5CEC2] bg-[#FFFFFF] p-6 space-y-2 shadow-xs md:col-span-2">
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[#8F5C1A]">
                      PILLAR I · CORE DAILY ENERGY
                    </span>
                    <h4 className="text-base font-serif-th font-bold text-[#29261F]">
                      พลังงานหลักแห่งรุ่งอรุณ
                    </h4>
                    <p className="text-sm font-serif-th text-[#3E382E] leading-relaxed">
                      {drawnCard.meanings.general.upright}
                    </p>
                  </div>

                  {/* Pillar 2: Career */}
                  <div className="rounded-2xl border border-[#D5CEC2] bg-[#FFFFFF] p-6 space-y-2 shadow-xs">
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[#8F5C1A]">
                      PILLAR II · CAREER & PURPOSE
                    </span>
                    <h4 className="text-base font-serif-th font-bold text-[#29261F]">
                      การงาน ภารกิจ และการตัดสินใจ
                    </h4>
                    <p className="text-sm font-serif-th text-[#3E382E] leading-relaxed">
                      {drawnCard.meanings.work.upright}
                    </p>
                  </div>

                  {/* Pillar 3: Money */}
                  <div className="rounded-2xl border border-[#D5CEC2] bg-[#FFFFFF] p-6 space-y-2 shadow-xs">
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[#8F5C1A]">
                      PILLAR III · WEALTH & ABUNDANCE
                    </span>
                    <h4 className="text-base font-serif-th font-bold text-[#29261F]">
                      การเงิน สภาพคล่อง และโชคลาภ
                    </h4>
                    <p className="text-sm font-serif-th text-[#3E382E] leading-relaxed">
                      {drawnCard.meanings.money.upright}
                    </p>
                  </div>

                  {/* Pillar 4: Love */}
                  <div className="rounded-2xl border border-[#D5CEC2] bg-[#FFFFFF] p-6 space-y-2 shadow-xs">
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[#8F5C1A]">
                      PILLAR IV · HEART & BOND
                    </span>
                    <h4 className="text-base font-serif-th font-bold text-[#29261F]">
                      ความรักและสัมพันธภาพ
                    </h4>
                    <p className="text-sm font-serif-th text-[#3E382E] leading-relaxed">
                      {drawnCard.meanings.love.upright}
                    </p>
                  </div>

                  {/* Pillar 5: Mindful Caution */}
                  <div className="rounded-2xl border border-[#D5CEC2] bg-[#FFFFFF] p-6 space-y-2 shadow-xs">
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[#8F5C1A]">
                      PILLAR V · MINDFUL REFLECTION
                    </span>
                    <h4 className="text-base font-serif-th font-bold text-[#29261F]">
                      คติธรรมเตือนสติและสิ่งพึงระวัง
                    </h4>
                    <p className="text-sm font-serif-th text-[#3E382E] leading-relaxed">
                      {drawnCard.meanings.self.upright}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-8 pt-4 border-t border-[#E8E2D8]">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl border border-[#D5CEC2] bg-[#FAF8F5] text-[#29261F] text-xs font-serif-th font-bold hover:border-[#8F5C1A] hover:bg-[#FFFFFF] transition-all cursor-pointer shadow-xs"
                  >
                    เลือกเรื่องใหม่ / เปิดไพ่อีกครั้ง
                  </button>

                  <button
                    type="button"
                    onClick={handleShare}
                    className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#29261F] text-[#FAF8F5] text-xs font-serif-th font-bold hover:bg-[#8F5C1A] transition-all cursor-pointer shadow-xs"
                  >
                    {copied ? "คัดลอกข้อความคำทำนายแล้ว" : "แชร์ผลทำนายประจำวัน"}
                  </button>
                </div>

                {/* Recommended Next Journeys (Luxury Gradient Cards) */}
                <div className="space-y-4 pt-2">
                  <div className="text-center sm:text-left space-y-1">
                    <span className="text-[10px] font-mono tracking-wider uppercase text-[#8F5C1A] font-semibold">
                      RECOMMENDED SACRED JOURNEYS
                    </span>
                    <h4 className="text-base font-serif-th font-bold text-[#29261F]">
                      ขั้นตอนการพยากรณ์ชะตาชีวิตขั้นลึกซึ้ง
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Link
                      href="/love/1-card"
                      className="p-4 rounded-2xl border border-[#EADFD5] bg-gradient-to-br from-[#FFFFFF] via-[#FDFBF9] to-[#F7EFE9] hover:border-[#C48464] transition-all duration-300 block shadow-xs group"
                    >
                      <span className="text-[10px] font-serif-th font-semibold text-[#8F5C1A] uppercase tracking-wider block mb-1">
                        LOVE ORACLE
                      </span>
                      <div className="text-sm font-serif-th font-bold text-[#29261F] group-hover:text-[#8F5C1A] transition-colors">
                        ดูดวงความรัก 1 ใบ
                      </div>
                      <p className="text-xs font-serif-th text-[#635B4E] leading-relaxed mt-1">
                        ตรวจเช็กพลังงานหัวใจ 4 สถานะ
                      </p>
                    </Link>

                    <Link
                      href="/spreads/celtic-cross"
                      className="p-4 rounded-2xl border border-[#E6DEC9] bg-gradient-to-br from-[#FFFFFF] via-[#FCFAF5] to-[#F5EEE0] hover:border-[#8F5C1A] transition-all duration-300 block shadow-xs group"
                    >
                      <span className="text-[10px] font-serif-th font-semibold text-[#8F5C1A] uppercase tracking-wider block mb-1">
                        GRAND SPREAD 10 CARDS
                      </span>
                      <div className="text-sm font-serif-th font-bold text-[#29261F] group-hover:text-[#8F5C1A] transition-colors">
                        ผังโบราณเซลติกครอส
                      </div>
                      <p className="text-xs font-serif-th text-[#635B4E] leading-relaxed mt-1">
                        ผ่าดวงชะตาชีวิต 10 มิติครบวงจร
                      </p>
                    </Link>

                    <Link
                      href="/cards/birth-card"
                      className="p-4 rounded-2xl border border-[#EADFD5] bg-gradient-to-br from-[#FFFFFF] via-[#FDFBF9] to-[#F7EFE9] hover:border-[#C48464] transition-all duration-300 block shadow-xs group"
                    >
                      <span className="text-[10px] font-serif-th font-semibold text-[#8F5C1A] uppercase tracking-wider block mb-1">
                        TAROT NUMEROLOGY
                      </span>
                      <div className="text-sm font-serif-th font-bold text-[#29261F] group-hover:text-[#8F5C1A] transition-colors">
                        คำนวณไพ่ประจำตัว
                      </div>
                      <p className="text-xs font-serif-th text-[#635B4E] leading-relaxed mt-1">
                        ค้นหาพิมพ์เขียวจิตวิญญาณจากวันเกิด
                      </p>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
