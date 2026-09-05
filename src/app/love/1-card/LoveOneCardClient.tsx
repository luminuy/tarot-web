"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { DECK } from "@/data/cards";
import type { TarotCard as TarotCardType } from "@/data/cards/types";
import { TarotCard } from "@/components/card/TarotCard";
import { soundManager } from "@/lib/utils/audio";
import { useLocale } from "@/lib/i18n";
import { saveReading } from "@/lib/utils/history";

type RelationshipStatus = "single" | "situationship" | "coupled" | "breakup";

interface StatusOption {
  id: RelationshipStatus;
  titleTh: string;
  titleEn: string;
  descTh: string;
  descEn: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    id: "single",
    titleTh: "คนโสด",
    titleEn: "Single",
    descTh: "โสดสนิท เปิดใจหาคนใหม่ หรือค้นหาตนเอง",
    descEn: "Seeking new romance or self-discovery",
  },
  {
    id: "situationship",
    titleTh: "คนคุย / ไม่ชัดเจน",
    titleEn: "Situationship",
    descTh: "มีความรู้สึกดีๆ ให้กัน แต่สถานะยังคลุมเครือ",
    descEn: "Ambiguous feelings or unlabelled bond",
  },
  {
    id: "coupled",
    titleTh: "มีแฟน / มีคู่",
    titleEn: "Committed",
    descTh: "กำลังคบหาดูใจ มั่นคง หรือแต่งงาน",
    descEn: "In relationship or married life",
  },
  {
    id: "breakup",
    titleTh: "เพิ่งเลิกรา / คนเก่า",
    titleEn: "Ex / Healing",
    descTh: "ยังตัดใจไม่ขาด ลังเล หรือรอโอกาสปรับความเข้าใจ",
    descEn: "Healing heart or hope for reconciliation",
  },
];

export function LoveOneCardClient() {
  const { isEnglish } = useLocale();
  const [, startTransition] = useTransition();

  const [selectedStatus, setSelectedStatus] = useState<RelationshipStatus>("single");
  const [yourName, setYourName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [status, setStatus] = useState<"idle" | "shuffling" | "picking" | "ready" | "revealed">("idle");
  const [drawnCard, setDrawnCard] = useState<TarotCardType | null>(null);
  const [fairnessHash, setFairnessHash] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [savedToHistory, setSavedToHistory] = useState(false);

  // สุ่มไพ่ 1 ใบด้วย Web Crypto API ป้องกันการล็อกผล
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

      const hashString = `love-${Date.now()}-${randomBuffer[0]}-${card.id}`;
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
        const statusObj = STATUS_OPTIONS.find((s) => s.id === selectedStatus);
        saveReading({
          spreadId: "love-one",
          spreadName: isEnglish ? "Love Tarot (1 Card)" : "ดูดวงความรัก 1 ใบ",
          question: partnerName.trim()
            ? `ถามถึงความสัมพันธ์กับ: ${partnerName.trim()} (${statusObj?.titleTh})`
            : `ดูดวงความรัก: ${statusObj?.titleTh}`,
          category: "love",
          personaId: "seer",
          personaName: isEnglish ? "Seer Oracle" : "แม่หมอ AI",
          cards: [
            {
              order: 0,
              positionName: statusObj?.titleTh || "ไพ่ความรักประจำใจ",
              cardIndex: DECK.findIndex((c) => c.id === drawnCard.id),
              cardNameTh: drawnCard.nameTh,
              cardNameEn: drawnCard.nameEn,
              isReversed: false,
              element: drawnCard.element,
            },
          ],
          summary: drawnCard.meanings.love.upright,
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
    const statusObj = STATUS_OPTIONS.find((s) => s.id === selectedStatus);
    const textToShare = isEnglish
      ? `My Love Tarot Card (${statusObj?.titleEn}): ${drawnCard.nameEn} — Free reading at ${window.location.href}`
      : `ผลดูดวงความรัก 1 ใบ (${statusObj?.titleTh}): ไพ่ ${drawnCard.nameTh} (${drawnCard.nameEn}) — เปิดไพ่ทำนายรักฟรีที่ ${window.location.href}`;

    if (navigator.share) {
      navigator
        .share({
          title: isEnglish ? "Love Tarot Reading" : "ดูดวงความรัก 1 ใบ",
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

  // สร้างคำแนะนำเฉพาะตามสถานะความสัมพันธ์
  const getContextualLoveAdvice = (card: TarotCardType, relStatus: RelationshipStatus) => {
    const isPositive = card.yesNo === "yes";
    const isNeutral = card.yesNo === "maybe";

    switch (relStatus) {
      case "single":
        if (isPositive) {
          return "ออร่าเสน่ห์ของคุณกำลังเปล่งประกาย โลกกำลังจัดสรรคนที่มีระดับพลังงานและทัศนคติตรงกันเข้ามา ให้เปิดโอกาสตัวเองออกไปพบปะผู้คนใหม่ๆ อย่ายึดติดกับกรอบความรักเดิมๆ";
        }
        if (isNeutral) {
          return "ช่วงเวลานี้จักรวาลแนะนำให้รักและดูแลตัวเองเป็นอันดับแรก การเติมเต็มคุณค่าในใจจะดึงดูดคนที่ใช่เข้ามาในจังหวะชีวิตที่สมบูรณ์ที่สุด ไม่ต้องรีบร้อน";
        }
        return "หากมีอดีตที่ยังฝังใจหรือความกลัวการผิดหวัง ให้ใช้เวลานี้สะสางและเยียวยาใจตนเองก่อน การพร้อมอย่างแท้จริงจากภายในจะทำให้ความรักครั้งต่อไปงดงาม";

      case "situationship":
        if (isPositive) {
          return "ความรู้สึกระหว่างกันมีน้ำหนักจริงใจและมีทิศทางเติบโตได้ดี จังหวะนี้การเปิดอกพูดคุยถึงความรู้สึกอย่างตรงไปตรงมาและอ่อนโยนจะช่วยขยับสถานะให้ชัดเจนขึ้น";
        }
        if (isNeutral) {
          return "อีกฝ่ายยังมีความลังเลหรือติดเงื่อนไขส่วนตัวบางประการ อย่าเพิ่งเร่งรัดคำตอบจนสร้างความอึดอัด ให้สังเกตการกระทำมากกว่าคำพูด แล้วค่อยตัดสินใจก้าวต่อไป";
        }
        return "หากคุณรู้สึกเป็นฝ่ายพยายามอยู่คนเดียวหรือสถานะนี้ทำให้เสียพลังงานใจมากกว่าความสุข ไพ่แนะนำให้ถอยออกมาตั้งหลักและกำหนดขอบเขตความสัมพันธ์ให้ชัดเจน";

      case "coupled":
        if (isPositive) {
          return "ความสัมพันธ์อยู่ในเกณฑ์อบอุ่นและเข้าใจกันดี เป็นช่วงเวลาที่เหมาะสำหรับการวางแผนอนาคตร่วมกัน หรือเติมความหวานผ่านบทสนทนาที่ลึกซึ้งและการดูแลเอาใจใส่";
        }
        if (isNeutral) {
          return "อาจมีความเฉื่อยชาหรือความเคยชินเข้ามาบดบังความรู้สึก ลองหากิจกรรมใหม่ๆ ทำร่วมกัน และหมั่นรับฟังความรู้สึกของกันและกันโดยปราศจากการตัดสิน";
        }
        return "ระวังความตึงเครียดจากเรื่องภายนอก (งานหรือครอบครัว) เข้ามากระทบความสัมพันธ์ หากมีข้อขัดแย้งให้เลี่ยงการเอาชนะ แล้วหันมาสื่อสารด้วยความเมตตา";

      case "breakup":
        if (isPositive) {
          return "มีสัญญาณของการคลี่คลายหรือโอกาสได้กลับมาปรับความเข้าใจ หากต่างฝ่ายต่างได้บทเรียนและเติบโตขึ้น แต่ทั้งนี้ต้องพิจารณาความพร้อมของทั้งสองฝ่ายร่วมด้วย";
        }
        if (isNeutral) {
          return "ความรู้สึกยังคงตกค้างอยู่ในใจทั้งสองฝ่าย การให้เวลาเป็นเครื่องมือเยียวยาคือสิ่งที่ดีที่สุดในตอนนี้ อย่ายึดติดกับสิ่งที่ผ่านไปจนลืมมองความสุขตรงหน้า";
        }
        return "การปล่อยวางและการอภัยจะนำพาอิสรภาพและความสงบกลับคืนสู่หัวใจของคุณ ปิดฉากบทเรียนเพื่อเปิดรับสิ่งใหม่ที่คู่ควรกับความรักที่คุณมีให้";
    }
  };

  const currentStatusObj = STATUS_OPTIONS.find((s) => s.id === selectedStatus);

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
            <li>
              <Link href="/spreads/topic/love" className="hover:text-[#29261F] transition-colors">
                {isEnglish ? "Love Tarot" : "ดูดวงความรัก"}
              </Link>
            </li>
            <li aria-hidden="true" className="text-[#D5CEC2]">/</li>
            <li className="font-semibold text-[#29261F]" aria-current="page">
              {isEnglish ? "1 Card Reading" : "ไพ่ทาโรต์ 1 ใบ"}
            </li>
          </ol>
        </nav>

        {/* Hero Header */}
        <header className="text-center space-y-3 pt-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#D9C8AC] bg-[#FFFFFF] text-xs font-serif-th font-semibold text-[#8F5C1A] shadow-[var(--shadow-raised)]">
            <span>{isEnglish ? "Free Love Tarot Reading" : "เปิดไพ่ทาโรต์ความรักฟรี"}</span>
            <span className="text-[#D5CEC2]">·</span>
            <span>{isEnglish ? "Provably Fair 78 Cards" : "สำรับ 1909 แท้ 78 ใบ"}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-serif-th font-bold text-[#29261F] tracking-wide leading-snug sm:leading-normal [text-wrap:balance]">
            {isEnglish ? "Love Tarot 1 Card Reading" : "ดูดวงความรัก 1 ใบ ไขคำตอบสถานะหัวใจ"}
          </h1>

          <p className="text-xs sm:text-sm text-[#635B4E] max-w-xl mx-auto font-serif-th leading-relaxed [text-wrap:balance]">
            {isEnglish
              ? "Draw one card to reveal romantic energies, intentions, and clear guidance tailored to your current relationship status."
              : "ตั้งจิตสงบนึกถึงเรื่องหัวใจ เลือกสถานะความสัมพันธ์ของคุณ แล้วเปิดไพ่ 1 ใบเพื่อรับคำทำนายที่ตรงจุด โปร่งใส ไร้โฆษณาคั่น"}
          </p>
        </header>

        {/* Sacred Altar Panel */}
        <section
          aria-label="Altar ritual area"
          className="altar-panel rounded-2xl p-5 sm:p-8 space-y-6 relative overflow-hidden"
        >
          {/* Step 1: Relationship Status & Intention Form */}
          {status === "idle" && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="block text-xs uppercase tracking-wider font-serif-th font-semibold text-[#8F5C1A] text-center">
                  {isEnglish ? "Step 1: Select Your Current Love Status" : "ขั้นตอนที่ 1: เลือกสถานะความรักปัจจุบันของคุณ"}
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {STATUS_OPTIONS.map((opt) => {
                    const isSelected = selectedStatus === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          soundManager.playMenuTapSound();
                          setSelectedStatus(opt.id);
                        }}
                        className={`p-3.5 sm:p-4 rounded-xl text-left border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? "bg-[#FAF8F5] border-[#8F5C1A] shadow-[var(--shadow-raised)] text-[#171512]"
                            : "bg-[#FFFFFF] border-[#D9C8AC] hover:border-[#8F5C1A]/60 text-[#635B4E] hover:bg-[#FAF7F2]"
                        }`}
                      >
                        <div>
                          <div className="font-serif-th font-bold text-xs sm:text-sm text-[#29261F]">
                            {isEnglish ? opt.titleEn : opt.titleTh}
                          </div>
                          <div className="text-[11px] font-serif-th text-[#7A6F5D] mt-1 leading-snug line-clamp-2">
                            {isEnglish ? opt.descEn : opt.descTh}
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-end">
                          <span
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? "border-[#8F5C1A] bg-[#8F5C1A]"
                                : "border-[#D9C8AC] bg-transparent"
                            }`}
                          >
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Names & Intention Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto pt-1">
                <div>
                  <label className="block text-[11px] font-serif-th text-[#7A6F5D] mb-1">
                    ชื่อเล่นของคุณ
                  </label>
                  <input
                    type="text"
                    value={yourName}
                    onChange={(e) => setYourName(e.target.value)}
                    placeholder="เช่น แพรว, แบงค์"
                    className="w-full rounded-xl border border-[#D9C8AC] bg-[#FAF8F5] px-3.5 py-2 text-xs font-serif-th text-[#29261F] focus:border-[#8F5C1A] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-serif-th text-[#7A6F5D] mb-1">
                    ชื่อคนในใจ (หรือสิ่งที่กังวล)
                  </label>
                  <input
                    type="text"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    placeholder="เช่น คนคุย, คนรักเก่า"
                    className="w-full rounded-xl border border-[#D9C8AC] bg-[#FAF8F5] px-3.5 py-2 text-xs font-serif-th text-[#29261F] focus:border-[#8F5C1A] focus:outline-hidden"
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
                    positionLabel={`ดวงใจ: ${currentStatusObj?.titleTh}`}
                  />
                </div>

                <div className="space-y-2 text-center">
                  <button
                    type="button"
                    onClick={handleStartDraw}
                    className="px-8 py-3 rounded-full bg-[#29261F] text-[#FAF7F2] font-serif-th text-xs sm:text-sm font-bold shadow-[var(--shadow-raised)] hover:bg-[#A58A5C] active:scale-95 transition-all cursor-pointer"
                  >
                    {isEnglish ? "Shuffle 78 Cards & Connect Energy" : "เริ่มสับไพ่และดึงดูดพลังงานรัก"}
                  </button>
                  <p className="text-[11px] font-serif-th text-[#7A6F5D]">
                    {isEnglish
                      ? "Provably Fair Web Crypto RNG · No payment required"
                      : `ตั้งสมาธินึกถึง (${currentStatusObj?.titleTh}) สับไพ่ฟรี ไร้โฆษณาคั่น`}
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
                  ? "Aligning your romantic frequencies with the 78 archetypes..."
                  : "กำลังสับไพ่ 78 ใบเพื่อเชื่อมโยงกระแสจิตแห่งความรัก..."}
              </p>
            </div>
          )}

          {/* Step 3: Card Selection Fan */}
          {status === "picking" && (
            <div className="altar-cloth p-6 sm:p-8 space-y-6 text-center animate-in fade-in duration-300">
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wider font-serif-th font-semibold text-[#8F5C1A]">
                  {isEnglish ? "Step 2: Choose Your Love Oracle" : "ขั้นตอนที่ 2: เลือกหยิบไพ่ 1 ใบจากสำรับ"}
                </span>
                <p className="text-xs sm:text-sm font-serif-th text-[#635B4E]">
                  {isEnglish
                    ? "Tap the card that resonates with your heart."
                    : "ใช้สัญชาตญาณหัวใจแตะเลือกไพ่ 1 ใบที่ดึงดูดคุณ"}
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
                  {isEnglish ? "Step 3: Reveal Your Fate" : "ขั้นตอนที่ 3: แตะเพื่อเปิดคำทำนายรัก"}
                </span>
                <p className="text-xs sm:text-sm font-serif-th text-[#635B4E]">
                  {isEnglish ? "Tap the card to reveal your romantic truth." : "ไพ่ตอบรับพลังงานแล้ว แตะเพื่อพลิกดูคำทำนาย 3D"}
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
                      สถานะ: {currentStatusObj?.titleTh}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-[#FAF8F5] border border-[#D9C8AC] text-xs font-serif-th font-medium text-[#635B4E]">
                      {drawnCard.arcana === "major" ? "Major Arcana" : "Minor Arcana"} · ธาตุ{drawnCard.element}
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

                  <div className="pt-1 text-xs font-serif-th text-[#7A6F5D] flex items-center justify-center sm:justify-start gap-2">
                    <span>แนวโน้มชะตา:</span>
                    <span className="font-semibold text-[#29261F]">
                      {drawnCard.yesNo === "yes"
                        ? "เชิงบวก เกื้อหนุน (Yes)"
                        : drawnCard.yesNo === "no"
                        ? "ท้าทาย ควรระวัง (No)"
                        : "เป็นกลาง รอจังหวะ (Neutral)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Specific Interpretation (Porcelain Cards) */}
              <div className="space-y-4">
                {/* 1. แก่นสารความรักหลัก */}
                <div className="altar-card-porcelain p-5 rounded-xl space-y-1.5">
                  <div className="text-xs uppercase tracking-wider font-serif-th font-semibold text-[#8F5C1A]">
                    {isEnglish ? "Core Love Oracle" : "สารจากไพ่ถึงดวงใจของคุณ"}
                  </div>
                  <p className="text-xs sm:text-sm font-serif-th text-[#29261F] leading-relaxed">
                    {drawnCard.meanings.love.upright}
                  </p>
                </div>

                {/* 2. บทวิเคราะห์เจาะจงตามสถานะ */}
                <div className="p-5 rounded-xl bg-gradient-to-br from-[#FFFFFF] via-[#FAF6EE] to-[#F5EEDC] border border-[#8F5C1A]/30 space-y-1.5 shadow-xs">
                  <div className="text-xs uppercase tracking-wider font-serif-th font-semibold text-[#8F5C1A]">
                    {isEnglish
                      ? `Guidance for ${currentStatusObj?.titleEn}`
                      : `คำทำนายเฉพาะสำหรับสถานะ: ${currentStatusObj?.titleTh}`}
                  </div>
                  <p className="text-xs sm:text-sm font-serif-th text-[#29261F] leading-relaxed">
                    {getContextualLoveAdvice(drawnCard, selectedStatus)}
                  </p>
                </div>

                {/* 3. คำแนะนำ & ข้อควรระวัง */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="altar-card-porcelain p-4 sm:p-5 rounded-xl space-y-1">
                    <div className="text-xs font-serif-th font-bold text-[#29261F]">
                      คำแนะนำนำทางหัวใจ
                    </div>
                    <p className="text-xs font-serif-th text-[#635B4E] leading-relaxed">
                      {drawnCard.arcana === "major"
                        ? "ไพ่ชุดใหญ่เตือนว่าเรื่องนี้เป็นจุดเปลี่ยนสำคัญของชีวิต ให้ซื่อสัตย์กับหัวใจตนเองและมองการณ์ไกล"
                        : "ไพ่ชุดเล็กชี้ถึงพฤติกรรมในชีวิตประจำวัน การปรับเปลี่ยนท่าทีเล็กๆ น้อยๆ จะช่วยพลิกสถานการณ์ได้ทันที"}
                    </p>
                  </div>

                  <div className="altar-card-porcelain p-4 sm:p-5 rounded-xl space-y-1">
                    <div className="text-xs font-serif-th font-bold text-[#8F5C1A]">
                      ข้อควรระวังในความสัมพันธ์
                    </div>
                    <p className="text-xs font-serif-th text-[#635B4E] leading-relaxed">
                      หลีกเลี่ยงการใช้อารมณ์ตัดสิน หรือคาดเดาเจตนาของอีกฝ่ายไปเองโดยไม่ได้เปิดอกพูดคุยอย่างสันติ
                    </p>
                  </div>
                </div>
              </div>

              {/* Action & Internal Workflow */}
              <div className="space-y-6 pt-4 border-t border-[#D9C8AC]/40">
                <div className="flex flex-wrap items-center justify-center sm:justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-5 py-2.5 rounded-full border border-[#D9C8AC] bg-white hover:border-[#8F5C1A] text-[#29261F] text-xs font-serif-th font-semibold hover:bg-[#FAF7F2] transition-colors cursor-pointer shadow-xs"
                  >
                    {isEnglish ? "Change Status / Draw Again" : "เลือกสถานะใหม่ / เปิดใหม่อีกครั้ง"}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleShare}
                      className="px-6 py-2.5 rounded-full bg-[#29261F] hover:bg-[#A58A5C] text-[#FAF7F2] text-xs font-serif-th font-bold transition-colors cursor-pointer shadow-xs"
                    >
                      {copied
                        ? isEnglish
                          ? "Copied to Clipboard!"
                          : "คัดลอกคำทำนายแล้ว"
                        : isEnglish
                        ? "Share Reading"
                        : "แชร์ผลคำทำนาย"}
                    </button>

                    <Link
                      href={`/cards/${drawnCard.id}`}
                      className="px-5 py-2.5 rounded-full bg-[#EAE7E0] border border-[#D9C8AC] hover:bg-[#D5CEC2] text-[#29261F] text-xs font-serif-th font-semibold transition-colors shadow-xs"
                    >
                      {isEnglish ? "Card Details" : "อ่านความหมายไพ่ใบนี้"}
                    </Link>
                  </div>
                </div>

                {/* Deep Dive Upsell (QuickTopic Style) */}
                <div className="space-y-3 pt-2">
                  <div className="text-center sm:text-left space-y-1">
                    <h3 className="text-sm sm:text-base font-serif-th font-bold text-[#29261F]">
                      ต้องการคำตอบเรื่องความรักที่ละเอียดและลึกซึ้งยิ่งขึ้น?
                    </h3>
                    <p className="text-xs font-serif-th text-[#7A6F5D]">
                      การเปิดไพ่ 1 ใบให้คำตอบเบื้องต้น หากต้องการวิเคราะห์ใจเขาใจเราและอนาคตความสัมพันธ์ แนะนำผังเหล่านี้:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Link
                      href="/spreads/love"
                      className="group p-4 rounded-2xl border border-[#EADFD5] hover:border-[#C48464] bg-gradient-to-br from-[#FFFFFF] via-[#FDFBF9] to-[#F7EFE9] transition-all duration-300 hover:-translate-y-0.5 shadow-xs block"
                    >
                      <div className="text-[10px] font-serif-th font-semibold px-2 py-0.5 rounded-full border bg-[#FBF2EC] text-[#9E4E28] border-[#E8D0C3] inline-block mb-2">
                        5 Cards Spread
                      </div>
                      <div className="text-sm font-serif-th font-bold text-[#29261F] group-hover:text-[#8F5C1A] transition-colors">
                        ผังความรัก 5 ใบ
                      </div>
                      <p className="text-xs font-serif-th text-[#635B4E] leading-relaxed mt-1">
                        วิเคราะห์ใจคุณ ใจเขา ปัญหาที่ซ่อนอยู่ และแนวโน้มบทสรุป
                      </p>
                    </Link>

                    <Link
                      href="/spreads/love-six"
                      className="group p-4 rounded-2xl border border-[#EADFD5] hover:border-[#C48464] bg-gradient-to-br from-[#FFFFFF] via-[#FDFBF9] to-[#F7EFE9] transition-all duration-300 hover:-translate-y-0.5 shadow-xs block"
                    >
                      <div className="text-[10px] font-serif-th font-semibold px-2 py-0.5 rounded-full border bg-[#FBF2EC] text-[#9E4E28] border-[#E8D0C3] inline-block mb-2">
                        6 Cards Spread
                      </div>
                      <div className="text-sm font-serif-th font-bold text-[#29261F] group-hover:text-[#8F5C1A] transition-colors">
                        ผังความสัมพันธ์ 6 ใบ
                      </div>
                      <p className="text-xs font-serif-th text-[#635B4E] leading-relaxed mt-1">
                        เช็กความสมดุล ปัจจัยแวดล้อม และสิ่งเกื้อหนุนให้รักยั่งยืน
                      </p>
                    </Link>

                    <Link
                      href="/readers"
                      className="group p-4 rounded-2xl border border-[#D5CEC2] hover:border-[#8F5C1A] bg-[#FFFFFF] transition-all duration-300 hover:-translate-y-0.5 shadow-xs block"
                    >
                      <div className="text-[10px] font-serif-th font-semibold px-2 py-0.5 rounded-full border bg-[#EAE7E0] text-[#5E5240] border-[#D5CEC2] inline-block mb-2">
                        Personal Readers
                      </div>
                      <div className="text-sm font-serif-th font-bold text-[#29261F] group-hover:text-[#8F5C1A] transition-colors">
                        ปรึกษาแม่หมอตัวจริง
                      </div>
                      <p className="text-xs font-serif-th text-[#635B4E] leading-relaxed mt-1">
                        นัดหมายพูดคุยกับนักพยากรณ์มืออาชีพเพื่อเจาะลึกคำถามเฉพาะตัว
                      </p>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Informative Guidance & SEO Questions */}
        <section className="space-y-6 pt-4 border-t border-[#D9C8AC]/40">
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-serif-th font-bold text-[#29261F]">
              คำถามพบบ่อยเกี่ยวกับการดูดวงความรัก 1 ใบ
            </h2>
            <p className="text-xs sm:text-sm font-serif-th text-[#7A6F5D]">
              หลักการและข้อแนะนำเพื่อการอ่านไพ่ความรักที่แม่นยำที่สุด
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="altar-card-porcelain p-5 rounded-2xl space-y-2">
              <h3 className="text-xs font-serif-th font-bold text-[#8F5C1A] uppercase tracking-wider">
                1. เหมาะกับคำถามแบบไหน?
              </h3>
              <p className="text-xs font-serif-th text-[#5C5549] leading-relaxed">
                เหมาะอย่างยิ่งสำหรับคำถามที่ต้องการความชัดเจน กระชับ เช่น ตอนนี้ความสัมพันธ์เป็นอย่างไร หรือควรปฏิบัติตัวอย่างไรในจังหวะนี้
              </p>
            </div>

            <div className="altar-card-porcelain p-5 rounded-2xl space-y-2">
              <h3 className="text-xs font-serif-th font-bold text-[#8F5C1A] uppercase tracking-wider">
                2. ถามถึงคนคุยหรือคนเก่าได้ไหม?
              </h3>
              <p className="text-xs font-serif-th text-[#5C5549] leading-relaxed">
                ทำได้แน่นอน เพียงตั้งจิตนึกถึงชื่อและหน้าของเขาขณะสลับไพ่ และเลือกสถานะให้ตรงกับความเป็นจริง เพื่อให้คำทำนายปรับมิติได้ตรงจุด
              </p>
            </div>

            <div className="altar-card-porcelain p-5 rounded-2xl space-y-2">
              <h3 className="text-xs font-serif-th font-bold text-[#8F5C1A] uppercase tracking-wider">
                3. ถ้าผลทำนายออกมาท้าทาย?
              </h3>
              <p className="text-xs font-serif-th text-[#5C5549] leading-relaxed">
                ไพ่ทาโรต์เป็นเหมือนกระจกเตือนสติ หากไพ่ชี้ถึงอุปสรรค นั่นคือโอกาสให้คุณมีสติ ระวังคำพูด และปรับเปลี่ยนพฤติกรรมเพื่อหลีกเลี่ยงความขัดแย้ง
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
