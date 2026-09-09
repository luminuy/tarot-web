"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import type { TarotCard as TarotCardType } from "@/data/cards/types";
import { TarotCard } from "@/components/card/TarotCard";
import { soundManager } from "@/lib/utils/audio";
import { useLocale } from "@/lib/i18n";
import { resolveDisplayKeywords } from "@/lib/tarot/keywords";

// โหลดสำรับ "ไทยล้วน" — ไม่ลากคำทำนายอังกฤษ (≈126 KB gzip) เข้าบันเดิลหน้าไทย
let deckPromise: Promise<typeof import("@/data/cards/deck-th")> | null = null;
function getDeck() {
  if (!deckPromise) {
    deckPromise = import("@/data/cards/deck-th");
  }
  return deckPromise;
}

// เนื้อหาอังกฤษแยก chunk ต่างหาก โหลดเฉพาะตอน locale เป็น EN
let enrichPromise: Promise<typeof import("@/data/cards/en-enrich")> | null = null;
function getEnEnricher() {
  if (!enrichPromise) {
    enrichPromise = import("@/data/cards/en-enrich");
  }
  return enrichPromise;
}

const elementEnMap: Record<string, string> = {
  "ไฟ": "Fire",
  "น้ำ": "Water",
  "ลม": "Air",
  "ดิน": "Earth",
};

export interface OneCardRitualProps {
  spreadId: string;
  spreadName: string;
  deckLabel: string;
  intention?: string;
  drawButtonText?: string;
  onRevealed: (card: TarotCardType) => void;
  renderReading: (card: TarotCardType) => React.ReactNode;
  recommendations?: React.ReactNode;
  onReset?: () => void;
  headerSlot?: React.ReactNode;
  isEnglish?: boolean;
}

export function OneCardRitual({
  spreadId: _spreadId,
  spreadName,
  deckLabel,
  intention: _intention = "",
  drawButtonText,
  onRevealed,
  renderReading,
  recommendations,
  onReset,
  headerSlot,
  isEnglish = false,
}: OneCardRitualProps) {
  const { isEnglish: localeIsEnglish } = useLocale();
  const isEn = isEnglish || localeIsEnglish;
  const [, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "ready" | "revealed">("idle");
  const [drawnCard, setDrawnCard] = useState<TarotCardType | null>(null);
  const [copied, setCopied] = useState(false);

  // Prefetch deck chunk in idle time so clicking draw is instantaneous
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if ("requestIdleCallback" in window) {
        (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => {
          getDeck();
        });
      } else {
        setTimeout(() => {
          getDeck();
        }, 800);
      }
    }
  }, []);

  // จังหวะที่ 1 ➔ จังหวะที่ 2: สุ่มไพ่ทันทีด้วย Web Crypto API โดยไม่ผ่านหน้าจอสับหรือพัดไพ่
  const handleDraw = async () => {
    soundManager.playCardSelectSound();

    const randomBuffer = new Uint32Array(2);
    if (typeof window !== "undefined" && window.crypto) {
      window.crypto.getRandomValues(randomBuffer);
    } else {
      randomBuffer[0] = Math.floor(Math.random() * 1000000);
    }

    const { DECK_TH } = await getDeck();
    const cardIndex = randomBuffer[0] % DECK_TH.length;
    const baseCard = DECK_TH[cardIndex];

    // Rule 14: Zero Fabricated Cards Policy — ห้ามกุไพ่ปลอมทุกใบใน 78 ใบเด็ดขาด
    if (!baseCard) {
      throw new Error("ไม่พบข้อมูลไพ่ กรุณาโหลดใหม่อีกครั้ง");
    }

    // เติมเนื้อหาอังกฤษเฉพาะตอนอยู่บนหน้า EN — หน้าไทยไม่ต้องจ่ายน้ำหนักก้อนนี้
    const card = isEn ? (await getEnEnricher()).enrichCardEn(baseCard) : baseCard;

    startTransition(() => {
      setDrawnCard(card);
      setStatus("ready");
    });
  };

  // เมื่อผู้ใช้แตะพลิกไพ่ 3D
  const handleReveal = () => {
    if (!drawnCard) return;
    soundManager.playCardFlipSound();
    setStatus("revealed");
    onRevealed(drawnCard);
  };

  // รีเซ็ตเพื่อเริ่มต้นการดูดวงใหม่
  const handleRestart = () => {
    soundManager.playMenuTapSound();
    setStatus("idle");
    setDrawnCard(null);
    setCopied(false);
    if (onReset) onReset();
  };

  // แชร์ผลการทำนาย
  const handleShare = () => {
    if (!drawnCard) return;
    const shareTitle = isEn
      ? `${spreadName}: ${drawnCard.nameEn}`
      : `${spreadName}: ไพ่ ${drawnCard.nameTh} (${drawnCard.nameEn})`;
    const shareText = isEn
      ? `My tarot reading: ${drawnCard.nameEn} — Free reading at ${typeof window !== "undefined" ? window.location.href : ""}`
      : `ผลดูดวงไพ่ 1 ใบ: ไพ่ ${drawnCard.nameTh} (${drawnCard.nameEn}) — เปิดไพ่ทำนายฟรีที่ ${typeof window !== "undefined" ? window.location.href : ""}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: shareTitle,
          text: shareText,
          url: window.location.href,
        })
        .catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="altar-panel rounded-2xl p-5 sm:p-8 space-y-8">
        {/* จังหวะที่ 1: เลือกหัวข้อ/สถานะ ➔ กดปุ่มเปิดไพ่ */}
        {status === "idle" && (
          <div key="idle" className="anim-step-in space-y-6">
            {headerSlot}

            <div className="pt-2 flex flex-col items-center justify-center space-y-3 text-center">
              <button
                type="button"
                onClick={handleDraw}
                className="w-full sm:w-auto px-10 py-3.5 sm:py-4 rounded-full bg-[#29261F] text-[#FAF7F2] font-serif-th text-sm sm:text-base font-bold shadow-raised hover:bg-[#A58A5C] active:scale-[0.98] transition cursor-pointer tracking-wide flex items-center justify-center gap-2"
              >
                <span>{drawButtonText || (isEn ? "Draw 1 Card" : "เปิดไพ่ 1 ใบ")}</span>
              </button>
              <p className="text-xs text-[#635B4E]">
                {isEn
                  ? "Cryptographic Web Crypto API randomness · Provably Fair"
                  : "ระบบสุ่มรหัสลับ Web Crypto API ปราศจากการล็อกผล 100%"}
              </p>
            </div>
          </div>
        )}

        {/* จังหวะที่ 2 (ขั้นแรก): ไพ่คว่ำหน้าบนแท่นบูชา ➔ ผู้ใช้แตะพลิกไพ่ 1 ครั้ง (คงกฎข้อ 4) */}
        {status === "ready" && drawnCard && (
          <div key="ready" className="anim-step-in altar-cloth p-8 sm:p-12 flex flex-col items-center justify-center space-y-6 text-center shadow-inner">
            {/* ป้ายระบุบริบท/สถานะเต็มความยาว ไม่ถูกตัดขอบ (แก้ปัญหา label ถูกตัดครึ่ง) */}
            <div className="space-y-2 max-w-lg mx-auto">
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#D5CEC2] bg-[#FFFFFF] text-xs sm:text-sm font-serif-th font-semibold text-[#8F5C1A] shadow-2xs">
                <span>{deckLabel}</span>
              </div>
              <h3 className="text-lg sm:text-2xl font-serif-th font-bold text-[#29261F] tracking-tight">
                {isEn ? "Your Sacred Card Awaits" : "ไพ่ตอบรับเจตจำนงของคุณแล้ว"}
              </h3>
              <p className="text-xs sm:text-sm text-[#635B4E]">
                {isEn
                  ? "Tap the card to reveal your oracle message in full 3D"
                  : "แตะที่ตัวไพ่เพื่อพลิกเฉลยสารพยากรณ์แบบ 3D"}
              </p>
            </div>

            {/* ไพ่ 3D คว่ำหน้า รอผู้ใช้แตะพลิก */}
            <div
              role="button"
              tabIndex={0}
              aria-label={isEn ? "Tap to reveal card" : "แตะเพื่อพลิกไพ่"}
              className="cursor-pointer py-2 transition-transform duration-300 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A] rounded-xl"
              onClick={handleReveal}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleReveal();
                }
              }}
            >
              <TarotCard
                size="lg"
                isRevealed={false}
                isHighlighted={true}
              />
            </div>

            <p className="text-xs text-[#A58A5C] font-serif-th font-semibold tracking-wide">
              {isEnglish ? "Touch card above to reveal" : "แตะที่ตัวไพ่ด้านบนเพื่อเปิดเผยคำทำนาย"}
            </p>
          </div>
        )}

        {/* Step 5: Revealed — 3D Card Vitrine & Readings */}
        {status === "revealed" && drawnCard && (
          <div key="revealed" className="anim-step-in space-y-8 text-left">
            {/* Museum Vitrine Stage: The 3D Card Display */}
            <div className="altar-cloth p-5 sm:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 shadow-inner">
              <div className="flex-shrink-0 py-1">
                <TarotCard
                  size="lg"
                  isRevealed={true}
                  card={drawnCard}
                  imageFull={true}
                  className="shadow-overlay"
                />
              </div>

              {/* Card Editorial Dossier */}
              <div className="space-y-3 flex-1 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#FFFFFF] border border-[#D5CEC2] text-xs font-serif-th font-semibold text-[#8F5C1A]">
                    {drawnCard.arcana === "major"
                      ? isEn
                        ? "Major Arcana"
                        : "Major Arcana (ชุดใหญ่)"
                      : isEn
                      ? "Minor Arcana"
                      : "Minor Arcana (ชุดเล็ก)"}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#FFFFFF] border border-[#D5CEC2] text-xs font-serif-th text-[#635B4E]">
                    {isEn ? `Element: ${elementEnMap[drawnCard.element] || drawnCard.element}` : `ธาตุ${drawnCard.element}`}
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl sm:text-3xl font-serif-th font-bold text-[#29261F] tracking-tight">
                    {isEn ? (drawnCard.nameEn || drawnCard.nameTh) : `${drawnCard.nameTh} ${drawnCard.nameEn ? `(${drawnCard.nameEn})` : ""}`}
                  </h2>
                  <p className="text-xs sm:text-sm font-serif-th text-[#8F5C1A] font-semibold tracking-wide">
                    {isEn
                      ? resolveDisplayKeywords({
                          cardId: drawnCard.id,
                          keywordsEn: drawnCard.keywordsEn,
                          isEnglish: true,
                        })
                          .slice(0, 4)
                          .join(" — ")
                      : drawnCard.keywords?.upright?.join(" — ")}
                  </p>
                </div>

                {drawnCard.astrology && (
                  <p className="text-xs text-[#635B4E]">
                    {isEn
                      ? `Astrological Correspondence: ${drawnCard.astrologyEn || drawnCard.astrology}`
                      : `ความสอดคล้องทางโหราศาสตร์: ${drawnCard.astrology}`}
                  </p>
                )}

                <div className="pt-1">
                  <Link
                    href={`/cards/${drawnCard.id}`}
                    className="text-xs font-serif-th font-semibold text-[#8F5C1A] hover:text-[#29261F] underline underline-offset-4 transition-colors"
                  >
                    {isEn
                      ? "Explore full symbolism and card meaning →"
                      : "เปิดคัมภีร์เจาะลึกความหมายไพ่ใบนี้ →"}
                  </Link>
                </div>
              </div>
            </div>

            {/* Custom Reading Content from Page */}
            {renderReading(drawnCard)}

            {/* Action Bar (Share & Restart) */}
            <div className="pt-4 border-t border-[#D5CEC2] flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleRestart}
                className="w-full sm:w-auto px-6 py-3 rounded-full border border-[#D5CEC2] bg-[#FAF7F2] hover:bg-[#FFFFFF] text-xs sm:text-sm font-serif-th font-semibold text-[#29261F] shadow-raised transition cursor-pointer"
              >
                {isEn ? "← Draw Another Reading" : "← เริ่มเปิดไพ่อีกครั้ง"}
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#29261F] hover:bg-[#A58A5C] text-xs sm:text-sm font-serif-th font-semibold text-[#FAF7F2] shadow-raised transition cursor-pointer"
              >
                {copied
                  ? isEn
                    ? "Copied to Clipboard!"
                    : "คัดลอกข้อความแล้ว"
                  : isEn
                  ? "Share Reading"
                  : "แชร์ผลทำนาย"}
              </button>
            </div>

            {/* Recommendations Section */}
            {recommendations && (
              <div className="pt-6 border-t border-[#D5CEC2]">
                {recommendations}
              </div>
            )}
          </div>
        )}
    </div>
  );
}
