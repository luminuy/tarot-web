"use client";

import { useState } from "react";
import Link from "next/link";
import { DECK } from "@/data/cards";
import type { TarotCard as TarotCardType } from "@/data/cards/types";
import { soundManager } from "@/lib/utils/audio";
import { useLocale } from "@/lib/i18n";
import { saveReading } from "@/lib/utils/history";
import { RitualHero } from "@/components/reading/one-card/RitualHero";
import { OneCardRitual } from "@/components/reading/one-card/OneCardRitual";

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

  const [selectedStatus, setSelectedStatus] = useState<RelationshipStatus>("single");
  const [yourName, setYourName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [copied, setCopied] = useState(false);
  const [savedToHistory, setSavedToHistory] = useState(false);

  const currentStatusObj = STATUS_OPTIONS.find((s) => s.id === selectedStatus);

  const getContextualLoveAdvice = (
    card: TarotCardType,
    relStatus: RelationshipStatus,
    en: boolean
  ) => {
    const isPositive = card.yesNo === "yes";
    const isNeutral = card.yesNo === "maybe";

    switch (relStatus) {
      case "single":
        if (isPositive) {
          return en
            ? "Your romantic aura is magnetic right now. The universe is aligning someone whose energy matches yours. Step out, embrace new encounters, and let go of past patterns."
            : "ออร่าเสน่ห์ของคุณกำลังเปล่งประกาย โลกกำลังจัดสรรคนที่มีระดับพลังงานและทัศนคติตรงกันเข้ามา ให้เปิดโอกาสตัวเองออกไปพบปะผู้คนใหม่ๆ อย่ายึดติดกับกรอบความรักเดิมๆ";
        }
        if (isNeutral) {
          return en
            ? "This is a sacred period for self-love. Deepening your connection with yourself will attract the right soul at the divine timing. There is no need to rush."
            : "ช่วงเวลานี้จักรวาลแนะนำให้รักและดูแลตัวเองเป็นอันดับแรก การเติมเต็มคุณค่าในใจจะดึงดูดคนที่ใช่เข้ามาในจังหวะชีวิตที่สมบูรณ์ที่สุด ไม่ต้องรีบร้อน";
        }
        return en
          ? "If lingering wounds or fears of heartbreak remain, take this time to heal and restore inner wholeness first. Readiness from within will bless your next romance."
          : "หากมีอดีตที่ยังฝังใจหรือความกลัวการผิดหวัง ให้ใช้เวลานี้สะสางและเยียวยาใจตนเองก่อน การพร้อมอย่างแท้จริงจากภายในจะทำให้ความรักครั้งต่อไปงดงาม";

      case "situationship":
        if (isPositive) {
          return en
            ? "The genuine connection between you two carries real weight and potential. An open, tender conversation about where you stand can bring meaningful clarity."
            : "ความรู้สึกระหว่างกันมีน้ำหนักจริงใจและมีทิศทางเติบโตได้ดี จังหวะนี้การเปิดอกพูดคุยถึงความรู้สึกอย่างตรงไปตรงมาและอ่อนโยนจะช่วยขยับสถานะให้ชัดเจนขึ้น";
        }
        if (isNeutral) {
          return en
            ? "The other party may be feeling hesitant or navigating personal complexities. Avoid pressuring for quick answers; observe deeds over words before choosing your step."
            : "อีกฝ่ายยังมีความลังเลหรือติดเงื่อนไขส่วนตัวบางประการ อย่าเพิ่งเร่งรัดคำตอบจนสร้างความอึดอัด ให้สังเกตการกระทำมากกว่าคำพูด แล้วค่อยตัดสินใจก้าวต่อไป";
        }
        return en
          ? "If you find yourself carrying the emotional weight alone, the cards gently advise stepping back and establishing clear, self-respecting boundaries."
          : "หากคุณรู้สึกเป็นฝ่ายพยายามอยู่คนเดียวหรือสถานะนี้ทำให้เสียพลังงานใจมากกว่าความสุข ไพ่แนะนำให้ถอยออกมาตั้งหลักและกำหนดขอบเขตความสัมพันธ์ให้ชัดเจน";

      case "coupled":
        if (isPositive) {
          return en
            ? "Your partnership is surrounded by warmth and understanding. It is a wonderful time to plan shared horizons or nurture intimacy through heartfelt presence."
            : "ความสัมพันธ์อยู่ในเกณฑ์อบอุ่นและเข้าใจกันดี เป็นช่วงเวลาที่เหมาะสำหรับการวางแผนอนาคตร่วมกัน หรือเติมความหวานผ่านบทสนทนาที่ลึกซึ้งและการดูแลเอาใจใส่";
        }
        if (isNeutral) {
          return en
            ? "Routine or complacency might be casting a gentle haze over the spark. Try novel shared experiences and practice listening without judgment."
            : "อาจมีความเฉื่อยชาหรือความเคยชินเข้ามาบดบังความรู้สึก ลองหากิจกรรมใหม่ๆ ทำร่วมกัน และหมั่นรับฟังความรู้สึกของกันและกันโดยปราศจากการตัดสิน";
        }
        return en
          ? "Be mindful of external pressures (work or family) spilling into your shared sanctuary. When friction arises, choose compassion over the desire to win."
          : "ระวังความตึงเครียดจากเรื่องภายนอก (งานหรือครอบครัว) เข้ามากระทบความสัมพันธ์ หากมีข้อขัดแย้งให้เลี่ยงการเอาชนะ แล้วหันมาสื่อสารด้วยความเมตตา";

      case "breakup":
        if (isPositive) {
          return en
            ? "Signs of easing tensions or a genuine opportunity to reconnect are emerging, provided both have integrated past lessons and grown."
            : "มีสัญญาณของการคลี่คลายหรือโอกาสได้กลับมาปรับความเข้าใจ หากต่างฝ่ายต่างได้บทเรียนและเติบโตขึ้น แต่ทั้งนี้ต้องพิจารณาความพร้อมของทั้งสองฝ่ายร่วมด้วย";
        }
        if (isNeutral) {
          return en
            ? "Unresolved emotions still linger on both sides. Allowing time to be your healer is the kindest path. Do not cling to yesterday at the cost of today."
            : "ความรู้สึกยังคงตกค้างอยู่ในใจทั้งสองฝ่าย การให้เวลาเป็นเครื่องมือเยียวยาคือสิ่งที่ดีที่สุดในตอนนี้ อย่ายึดติดกับสิ่งที่ผ่านไปจนลืมมองความสุขตรงหน้า";
        }
        return en
          ? "Forgiveness and letting go will restore serenity and freedom to your spirit. Closing this chapter honors the love you gave and opens space for true renewal."
          : "การปล่อยวางและการอภัยจะนำพาอิสรภาพและความสงบกลับคืนสู่หัวใจของคุณ ปิดฉากบทเรียนเพื่อเปิดรับสิ่งใหม่ที่คู่ควรกับความรักที่คุณมีให้";
    }
  };

  const handleRevealed = (card: TarotCardType) => {
    try {
      const statusObj = STATUS_OPTIONS.find((s) => s.id === selectedStatus);
      const cardIdx = DECK.findIndex((c) => c.id === card.id);
      saveReading({
        spreadId: "love-one",
        spreadName: isEnglish ? "Love Tarot (1 Card)" : "ดูดวงความรัก 1 ใบ",
        question: partnerName.trim()
          ? isEnglish
            ? `Asking about relationship with: ${partnerName.trim()} (${statusObj?.titleEn})`
            : `ถามถึงความสัมพันธ์กับ: ${partnerName.trim()} (${statusObj?.titleTh})`
          : isEnglish
          ? `Love Tarot: ${statusObj?.titleEn}`
          : `ดูดวงความรัก: ${statusObj?.titleTh}`,
        category: "love",
        personaId: "seer",
        personaName: isEnglish ? "Seer" : "ผู้หยั่งรู้",
        cards: [
          {
            order: 1,
            positionName: isEnglish
              ? statusObj?.titleEn || "Core Love"
              : statusObj?.titleTh || "ไพ่ความรักประจำใจ",
            cardIndex: cardIdx >= 0 ? cardIdx : 0,
            cardNameTh: card.nameTh,
            cardNameEn: card.nameEn,
            isReversed: false,
            element: card.element,
          },
        ],
        summary: card.meanings.love.upright,
      });
      setSavedToHistory(true);
    } catch {
      // Ignored
    }
  };

  const handleReset = () => {
    setSavedToHistory(false);
    setCopied(false);
  };

  const handleShare = (card: TarotCardType) => {
    const statusObj = STATUS_OPTIONS.find((s) => s.id === selectedStatus);
    const textToShare = isEnglish
      ? `My Love Tarot Card (${statusObj?.titleEn}): ${card.nameEn} — Free reading at ${typeof window !== "undefined" ? window.location.href : ""}`
      : `ผลดูดวงความรัก 1 ใบ (${statusObj?.titleTh}): ไพ่ ${card.nameTh} (${card.nameEn}) — เปิดไพ่ทำนายรักฟรีที่ ${typeof window !== "undefined" ? window.location.href : ""}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: isEnglish ? "Love Tarot Reading" : "ดูดวงความรัก 1 ใบ",
          text: textToShare,
          url: window.location.href,
        })
        .catch(() => {});
    } else if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(textToShare);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const breadcrumbs = [
    { label: isEnglish ? "Home" : "หน้าแรก", href: "/" },
    { label: isEnglish ? "Love Tarot" : "ดูดวงความรัก", href: "/spreads/topic/love" },
    { label: isEnglish ? "1 Card Reading" : "ไพ่ทาโรต์ 1 ใบ" },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <RitualHero
        breadcrumbs={breadcrumbs}
        badgeText={isEnglish ? "Provably Fair 78 Cards" : "สำรับ 1909 แท้ 78 ใบ"}
        title={isEnglish ? "Love Tarot 1 Card Reading" : "ดูดวงความรัก 1 ใบ ไขคำตอบสถานะหัวใจ"}
        tagline={
          isEnglish
            ? "Draw one card to reveal romantic energies, intentions, and clear guidance tailored to your current relationship status."
            : "ตั้งจิตสงบนึกถึงเรื่องหัวใจ เลือกสถานะความสัมพันธ์ของคุณ แล้วเปิดไพ่ 1 ใบเพื่อรับคำทำนายที่ตรงจุด โปร่งใส ไร้โฆษณาคั่น"
        }
      />

      {/* Main Ritual Panel */}
      <OneCardRitual
        spreadId="love-one"
        spreadName={isEnglish ? "Love Tarot (1 Card)" : "ดูดวงความรัก 1 ใบ"}
        deckLabel={isEnglish ? `Status: ${currentStatusObj?.titleEn}` : `สถานะ: ${currentStatusObj?.titleTh}`}
        drawButtonText={isEnglish ? "Draw Love Card" : "เปิดไพ่ทำนายความรัก"}
        intention={
          partnerName.trim()
            ? isEnglish
              ? `Regarding: ${partnerName.trim()}`
              : `ถามถึง: ${partnerName.trim()}`
            : ""
        }
        isEnglish={isEnglish}
        onRevealed={handleRevealed}
        onReset={handleReset}
        headerSlot={
          <div className="space-y-5">
            <div className="space-y-2.5">
              <label className="block text-xs uppercase tracking-wider font-serif-th font-semibold text-[#8F5C1A] text-center">
                {isEnglish
                  ? "Step 1: Select Your Current Love Status"
                  : "ขั้นตอนที่ 1: เลือกสถานะความรักปัจจุบันของคุณ"}
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-3.5">
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
                      className={`p-3.5 sm:p-4 rounded-2xl text-left border transition-all duration-200 flex flex-col justify-between cursor-pointer relative ${
                        isSelected
                          ? "altar-panel-active ring-1 ring-[#A58A5C] shadow-raised text-[#29261F]"
                          : "altar-card-porcelain hover:border-[#A58A5C]/60 text-[#635B4E] hover:shadow-xs"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-2">
                          <span className="text-[10px] sm:text-[11px] font-serif-th font-semibold px-2 py-0.5 rounded-full border bg-[#FFFFFF] border-[#D5CEC2] text-[#8F5C1A] shadow-2xs">
                            {isEnglish ? opt.titleEn : opt.titleTh}
                          </span>
                          <span
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
                              isSelected
                                ? "border-[#8F5C1A] bg-[#8F5C1A]"
                                : "border-[#D5CEC2] bg-transparent"
                            }`}
                          >
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                        </div>
                        <div className="font-serif-th font-bold text-xs sm:text-sm text-[#29261F] mt-1">
                          {isEnglish ? opt.titleEn : opt.titleTh}
                        </div>
                        <p className="text-[11px] font-sans text-[#635B4E] mt-1.5 leading-snug line-clamp-2">
                          {isEnglish ? opt.descEn : opt.descTh}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Names & Intention Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto pt-1">
              <div>
                <label className="block text-[11px] font-serif-th text-[#635B4E] mb-1">
                  {isEnglish ? "Your Nickname (Optional)" : "ชื่อเล่นของคุณ (ระบุหรือไม่ก็ได้)"}
                </label>
                <input
                  type="text"
                  value={yourName}
                  onChange={(e) => setYourName(e.target.value)}
                  placeholder={isEnglish ? "e.g. Alex" : "เช่น แพรว, แบงค์"}
                  className="w-full rounded-xl border border-[#D5CEC2] bg-[#FAF7F2] px-3.5 py-2 text-xs font-sans text-[#29261F] focus:border-[#A58A5C] focus:outline-hidden focus:ring-1 focus:ring-[#A58A5C] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] font-serif-th text-[#635B4E] mb-1">
                  {isEnglish ? "Person in Mind (Optional)" : "ชื่อคนในใจ (หรือสิ่งที่กังวล)"}
                </label>
                <input
                  type="text"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  placeholder={isEnglish ? "e.g. Crush, Ex" : "เช่น คนคุย, คนรักเก่า"}
                  className="w-full rounded-xl border border-[#D5CEC2] bg-[#FAF7F2] px-3.5 py-2 text-xs font-sans text-[#29261F] focus:border-[#A58A5C] focus:outline-hidden focus:ring-1 focus:ring-[#A58A5C] transition-colors"
                />
              </div>
            </div>
          </div>
        }
        renderReading={(card) => (
          <div className="space-y-6 text-left">
            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#EAE7E0] border border-[#D9C8AC] text-xs font-serif-th font-semibold text-[#8F5C1A]">
                {isEnglish ? `Status: ${currentStatusObj?.titleEn}` : `สถานะ: ${currentStatusObj?.titleTh}`}
              </span>
              <span className="px-3 py-1 rounded-full bg-[#FAF8F5] border border-[#D9C8AC] text-xs font-sans font-medium text-[#635B4E]">
                {card.arcana === "major" ? "Major Arcana" : "Minor Arcana"} · ธาตุ{card.element}
              </span>
              {savedToHistory && (
                <span className="px-3 py-1 rounded-full bg-[#EAF2EC] border border-[#9DC3A6] text-xs font-sans text-[#2D6A4F] font-semibold">
                  {isEnglish ? "Saved to Journal" : "บันทึกลงสมุดดูดวงแล้ว"}
                </span>
              )}
            </div>

            {/* Reading Breakdown in Porcelain Cards */}
            <div className="space-y-4">
              {/* 1. Core Love Oracle */}
              <div className="altar-card-porcelain p-5 rounded-xl space-y-1.5">
                <div className="text-xs uppercase tracking-wider font-serif-th font-semibold text-[#8F5C1A]">
                  {isEnglish ? "Core Love Oracle" : "สารจากไพ่ถึงดวงใจของคุณ"}
                </div>
                <p className="text-xs sm:text-sm font-sans text-[#29261F] leading-relaxed">
                  {isEnglish && card.meaningsEn?.love.upright
                    ? card.meaningsEn.love.upright
                    : card.meanings.love.upright}
                </p>
              </div>

              {/* 2. Status Specific Advice */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-[#FFFFFF] via-[#FAF6EE] to-[#F5EEDC] border border-[#8F5C1A]/30 space-y-1.5 shadow-xs">
                <div className="text-xs uppercase tracking-wider font-serif-th font-semibold text-[#8F5C1A]">
                  {isEnglish
                    ? `Guidance for ${currentStatusObj?.titleEn}`
                    : `คำทำนายเฉพาะสำหรับสถานะ: ${currentStatusObj?.titleTh}`}
                </div>
                <p className="text-xs sm:text-sm font-sans text-[#29261F] leading-relaxed">
                  {getContextualLoveAdvice(card, selectedStatus, isEnglish)}
                </p>
              </div>

              {/* 3. Guidance & Precautions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="altar-card-porcelain p-4 sm:p-5 rounded-xl space-y-1">
                  <div className="text-xs font-serif-th font-bold text-[#29261F]">
                    {isEnglish ? "Guiding Wisdom" : "คำแนะนำนำทางหัวใจ"}
                  </div>
                  <p className="text-xs font-sans text-[#635B4E] leading-relaxed">
                    {card.arcana === "major"
                      ? isEnglish
                        ? "As a Major Arcana, this card signals a pivotal spiritual lesson. Stay true to your heart and embrace the long-term journey."
                        : "ไพ่ชุดใหญ่เตือนว่าเรื่องนี้เป็นจุดเปลี่ยนสำคัญของชีวิต ให้ซื่อสัตย์กับหัวใจตนเองและมองการณ์ไกล"
                      : isEnglish
                      ? "A Minor Arcana card speaks to everyday choices and interactions. Small conscious shifts will promptly harmonise the atmosphere."
                      : "ไพ่ชุดเล็กชี้ถึงพฤติกรรมในชีวิตประจำวัน การปรับเปลี่ยนท่าทีเล็กๆ น้อยๆ จะช่วยพลิกสถานการณ์ได้ทันที"}
                  </p>
                </div>

                <div className="altar-card-porcelain p-4 sm:p-5 rounded-xl space-y-1">
                  <div className="text-xs font-serif-th font-bold text-[#8F5C1A]">
                    {isEnglish ? "Mindful Precaution" : "ข้อควรระวังในความสัมพันธ์"}
                  </div>
                  <p className="text-xs font-sans text-[#635B4E] leading-relaxed">
                    {isEnglish
                      ? "Avoid letting assumptions guide your reaction. Direct, compassionate communication resolves misunderstandings before they solidify."
                      : "หลีกเลี่ยงการใช้อารมณ์ตัดสิน หรือคาดเดาเจตนาของอีกฝ่ายไปเองโดยไม่ได้เปิดอกพูดคุยอย่างสันติ"}
                  </p>
                </div>
              </div>
            </div>

            {/* Card Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[#D9C8AC]/40">
              <button
                type="button"
                onClick={() => handleShare(card)}
                className="px-5 py-2 rounded-full bg-[#29261F] hover:bg-[#A58A5C] text-[#FAF7F2] text-xs font-serif-th font-bold transition-colors cursor-pointer shadow-xs"
              >
                {copied
                  ? isEnglish
                    ? "Copied to Clipboard"
                    : "คัดลอกคำทำนายแล้ว"
                  : isEnglish
                  ? "Share Reading"
                  : "แชร์ผลคำทำนาย"}
              </button>

              <Link
                href={`/cards/${card.id}`}
                className="px-5 py-2 rounded-full bg-[#EAE7E0] border border-[#D9C8AC] hover:bg-[#D5CEC2] text-[#29261F] text-xs font-serif-th font-semibold transition-colors shadow-xs"
              >
                {isEnglish ? "Card Meaning" : "อ่านความหมายไพ่ใบนี้"}
              </Link>
            </div>
          </div>
        )}
        recommendations={
          <div className="space-y-3 pt-4 border-t border-[#D9C8AC]/40">
            <div className="text-center sm:text-left space-y-1">
              <h3 className="text-sm sm:text-base font-serif-th font-bold text-[#29261F]">
                {isEnglish
                  ? "Seeking Deeper Clarity on Your Relationship?"
                  : "ต้องการคำตอบเรื่องความรักที่ละเอียดและลึกซึ้งยิ่งขึ้น?"}
              </h3>
              <p className="text-xs font-sans text-[#7A6F5D]">
                {isEnglish
                  ? "A 1-card oracle provides initial focus. For in-depth relationship dynamics and future timeline, explore these spreads:"
                  : "การเปิดไพ่ 1 ใบให้คำตอบเบื้องต้น หากต้องการวิเคราะห์ใจเขาใจเราและอนาคตความสัมพันธ์ แนะนำผังเหล่านี้:"}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                href="/spreads/love"
                className="group p-4 rounded-xl border border-[#D9C8AC] hover:border-[#8F5C1A] bg-[#FFFFFF] transition-all duration-300 hover:-translate-y-0.5 shadow-xs block"
              >
                <div className="text-[10px] font-serif-th font-semibold px-2 py-0.5 rounded-full border bg-[#FBF2EC] text-[#9E4E28] border-[#E8D0C3] inline-block mb-2">
                  5 Cards
                </div>
                <div className="text-sm font-serif-th font-bold text-[#29261F] group-hover:text-[#8F5C1A] transition-colors">
                  {isEnglish ? "5-Card Love Spread" : "ผังความรัก 5 ใบ"}
                </div>
                <p className="text-xs font-sans text-[#635B4E] leading-relaxed mt-1">
                  {isEnglish
                    ? "Deeply explore your feelings, their intentions, hidden obstacles, and the likely outcome."
                    : "วิเคราะห์ใจคุณ ใจเขา ปัญหาที่ซ่อนอยู่ และแนวโน้มบทสรุป"}
                </p>
              </Link>

              <Link
                href="/spreads/love-six"
                className="group p-4 rounded-xl border border-[#D9C8AC] hover:border-[#8F5C1A] bg-[#FFFFFF] transition-all duration-300 hover:-translate-y-0.5 shadow-xs block"
              >
                <div className="text-[10px] font-serif-th font-semibold px-2 py-0.5 rounded-full border bg-[#FBF2EC] text-[#9E4E28] border-[#E8D0C3] inline-block mb-2">
                  6 Cards
                </div>
                <div className="text-sm font-serif-th font-bold text-[#29261F] group-hover:text-[#8F5C1A] transition-colors">
                  {isEnglish ? "6-Card Relationship Spread" : "ผังความสัมพันธ์ 6 ใบ"}
                </div>
                <p className="text-xs font-sans text-[#635B4E] leading-relaxed mt-1">
                  {isEnglish
                    ? "Examine emotional balance, mutual influences, and supportive anchors for lasting union."
                    : "เช็กความสมดุล ปัจจัยแวดล้อม และสิ่งเกื้อหนุนให้รักยั่งยืน"}
                </p>
              </Link>

              <Link
                href="/readers"
                className="group p-4 rounded-xl border border-[#D9C8AC] hover:border-[#8F5C1A] bg-[#FFFFFF] transition-all duration-300 hover:-translate-y-0.5 shadow-xs block"
              >
                <div className="text-[10px] font-serif-th font-semibold px-2 py-0.5 rounded-full border bg-[#EAE7E0] text-[#5E5240] border-[#D5CEC2] inline-block mb-2">
                  Personal Readers
                </div>
                <div className="text-sm font-serif-th font-bold text-[#29261F] group-hover:text-[#8F5C1A] transition-colors">
                  {isEnglish ? "Consult Professional Readers" : "ปรึกษาแม่หมอตัวจริง"}
                </div>
                <p className="text-xs font-sans text-[#635B4E] leading-relaxed mt-1">
                  {isEnglish
                    ? "Schedule a 1-on-1 session with an experienced practitioner for bespoke inquiry."
                    : "นัดหมายพูดคุยกับนักพยากรณ์มืออาชีพเพื่อเจาะลึกคำถามเฉพาะตัว"}
                </p>
              </Link>
            </div>
          </div>
        }
      />
    </div>
  );
}
