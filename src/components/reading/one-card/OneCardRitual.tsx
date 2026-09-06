"use client";

import React, { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { DECK } from "@/data/cards";
import type { TarotCard as TarotCardType } from "@/data/cards/types";
import { TarotCard } from "@/components/card/TarotCard";
import { soundManager } from "@/lib/utils/audio";
import { stepVariants } from "@/lib/motion";

const ShuffleRitual = dynamic(
  () => import("@/components/deck/ShuffleRitual").then((m) => m.ShuffleRitual),
  { ssr: false }
);

const InteractiveCardFan = dynamic(
  () => import("@/components/deck/InteractiveCardFan").then((m) => m.InteractiveCardFan),
  { ssr: false }
);

export interface OneCardRitualProps {
  spreadId: string;
  spreadName: string;
  deckLabel: string;
  intention?: string;
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
  intention = "",
  onRevealed,
  renderReading,
  recommendations,
  onReset,
  headerSlot,
  isEnglish = false,
}: OneCardRitualProps) {
  const [, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "shuffling" | "picking" | "ready" | "revealed">("idle");
  const [drawnCard, setDrawnCard] = useState<TarotCardType | null>(null);
  const [copied, setCopied] = useState(false);

  // เริ่มต้นขั้นตอนสับไพ่
  const handleStart = () => {
    soundManager.playShuffleSound();
    setStatus("shuffling");
  };

  // เมื่อสับไพ่ใน ShuffleRitual เสร็จสิ้น
  const handleShuffleComplete = (_clientSeed: string) => {
    const randomBuffer = new Uint32Array(2);
    if (typeof window !== "undefined" && window.crypto) {
      window.crypto.getRandomValues(randomBuffer);
    } else {
      randomBuffer[0] = Math.floor(Math.random() * 1000000);
    }

    const cardIndex = randomBuffer[0] % DECK.length;
    const card = DECK[cardIndex];

    // Rule 14: ห้ามกุไพ่ปลอมทุกใบใน 78 ใบเด็ดขาด
    if (!card) {
      throw new Error("ไม่พบข้อมูลไพ่ กรุณาโหลดใหม่อีกครั้ง");
    }

    startTransition(() => {
      setDrawnCard(card);
      setStatus("picking");
    });
  };

  // เมื่อผู้ใช้เลือกไพ่จากพัดไพ่ 78 ใบ
  const handlePickCard = (_fanIndex: number) => {
    soundManager.playCardSelectSound();
    setStatus("ready");
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
    const shareTitle = isEnglish
      ? `${spreadName}: ${drawnCard.nameEn}`
      : `${spreadName}: ไพ่ ${drawnCard.nameTh} (${drawnCard.nameEn})`;
    const shareText = isEnglish
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
      <AnimatePresence mode="wait">
        {/* Step 1: Idle — Header Slot & Altar Deck Stage */}
        {status === "idle" && (
          <motion.div
            key="idle"
            custom={1}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="space-y-6"
          >
            {headerSlot}

            <div className="altar-cloth p-6 sm:p-10 flex flex-col items-center justify-center space-y-6 text-center shadow-inner">
              <div
                className="cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95"
                onClick={handleStart}
              >
                <TarotCard
                  size="lg"
                  isRevealed={false}
                  isHighlighted={true}
                  positionLabel={deckLabel}
                />
              </div>

              <div className="space-y-3 max-w-md">
                <button
                  type="button"
                  onClick={handleStart}
                  className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 rounded-full bg-[#29261F] text-[#FAF7F2] font-serif-th text-sm font-bold shadow-[var(--shadow-raised)] hover:bg-[#A58A5C] active:scale-[0.98] transition-all cursor-pointer tracking-wide"
                >
                  {isEnglish ? "Begin Shuffling & Selection" : "เริ่มพิธีสับไพ่และเลือกไพ่"}
                </button>
                <p className="text-xs text-[#635B4E]">
                  {isEnglish
                    ? "Cryptographic Web Crypto API randomness · Provably Fair"
                    : "ระบบสุ่มรหัสลับ Web Crypto API ปราศจากการล็อกผล 100%"}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Shuffling — Authentic Interactive Ritual */}
        {status === "shuffling" && (
          <motion.div
            key="shuffling"
            custom={1}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="altar-cloth p-6 sm:p-10 flex flex-col items-center justify-center space-y-6 text-center"
          >
            <ShuffleRitual
              commitment={intention || spreadName}
              spreadName={spreadName}
              onShuffleComplete={handleShuffleComplete}
            />
          </motion.div>
        )}

        {/* Step 3: Picking — 78-Card Arc Fan Geometry */}
        {status === "picking" && (
          <motion.div
            key="picking"
            custom={1}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="altar-cloth p-4 sm:p-8 space-y-4 text-center"
          >
            <div className="space-y-1">
              <span className="text-xs font-serif-th font-semibold text-[#8F5C1A]">
                {isEnglish ? "Phase: Intuitive Selection" : "ขั้นตอน: เลือกไพ่ด้วยปัญญาญาณ"}
              </span>
              <h3 className="text-lg sm:text-xl font-serif-th font-bold text-[#29261F]">
                {isEnglish ? "Choose 1 Card Calling to You" : "แตะเลือกไพ่ 1 ใบที่เรียกหาคุณ"}
              </h3>
              <p className="text-xs text-[#635B4E]">
                {isEnglish
                  ? "Allow your inner intuition to guide your hand across the 78 cards"
                  : "ปล่อยให้สัญชาตญาณและความสงบภายในเป็นผู้นำทางหัวใจของคุณ"}
              </p>
            </div>

            <div className="py-2">
              <InteractiveCardFan
                totalCards={78}
                pickedIndices={[]}
                targetCount={1}
                currentPositionName={deckLabel}
                onPickCard={handlePickCard}
              />
            </div>
          </motion.div>
        )}

        {/* Step 4: Ready to Reveal */}
        {status === "ready" && drawnCard && (
          <motion.div
            key="ready"
            custom={1}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="altar-cloth p-8 sm:p-12 flex flex-col items-center justify-center space-y-5 text-center"
          >
            <div className="space-y-1">
              <span className="text-xs font-serif-th font-semibold text-[#8F5C1A]">
                {isEnglish ? "Phase: Sacred Revelation" : "ขั้นตอน: เปิดเผยสารพยากรณ์"}
              </span>
              <h3 className="text-lg sm:text-xl font-serif-th font-bold text-[#29261F]">
                {isEnglish ? "Your Card Awaits" : "ไพ่ตอบรับเจตจำนงของคุณแล้ว"}
              </h3>
              <p className="text-xs text-[#635B4E]">
                {isEnglish
                  ? "Tap the card to reveal your oracle message in full 3D"
                  : "แตะที่ตัวไพ่เพื่อพลิกเฉลยสารพยากรณ์แบบ 3D"}
              </p>
            </div>

            <div
              className="cursor-pointer py-3 transition-transform duration-300 hover:scale-105 active:scale-95"
              onClick={handleReveal}
            >
              <TarotCard
                size="lg"
                isRevealed={false}
                isHighlighted={true}
                positionLabel={isEnglish ? "Tap to reveal" : "แตะเพื่อพลิกไพ่"}
              />
            </div>
          </motion.div>
        )}

        {/* Step 5: Revealed — 3D Card Vitrine & Readings */}
        {status === "revealed" && drawnCard && (
          <motion.div
            key="revealed"
            custom={1}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="space-y-8 text-left"
          >
            {/* Museum Vitrine Stage: The 3D Card Display */}
            <div className="altar-cloth p-5 sm:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 shadow-inner">
              <div className="flex-shrink-0 py-1">
                <TarotCard
                  size="lg"
                  isRevealed={true}
                  card={drawnCard}
                  imageFull={true}
                  className="shadow-[var(--shadow-overlay)]"
                />
              </div>

              {/* Card Editorial Dossier */}
              <div className="space-y-3 flex-1 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#FFFFFF] border border-[#D5CEC2] text-xs font-serif-th font-semibold text-[#8F5C1A]">
                    {drawnCard.arcana === "major"
                      ? isEnglish
                        ? "Major Arcana"
                        : "Major Arcana (ชุดใหญ่)"
                      : isEnglish
                      ? "Minor Arcana"
                      : "Minor Arcana (ชุดเล็ก)"}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#FFFFFF] border border-[#D5CEC2] text-xs font-serif-th text-[#635B4E]">
                    {isEnglish ? `Element: ${drawnCard.element}` : `ธาตุ${drawnCard.element}`}
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl sm:text-3xl font-serif-th font-bold text-[#29261F] tracking-tight">
                    {drawnCard.nameTh} {drawnCard.nameEn && `(${drawnCard.nameEn})`}
                  </h2>
                  <p className="text-xs sm:text-sm font-serif-th text-[#8F5C1A] font-semibold tracking-wide">
                    {drawnCard.keywords?.upright?.join(" — ")}
                  </p>
                </div>

                {drawnCard.astrology && (
                  <p className="text-xs text-[#635B4E]">
                    {isEnglish
                      ? `Astrological Correspondence: ${drawnCard.astrology}`
                      : `ความสอดคล้องทางโหราศาสตร์: ${drawnCard.astrology}`}
                  </p>
                )}

                <div className="pt-1">
                  <Link
                    href={`/cards/${drawnCard.id}`}
                    className="text-xs font-serif-th font-semibold text-[#8F5C1A] hover:text-[#29261F] underline underline-offset-4 transition-colors"
                  >
                    {isEnglish
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
                className="w-full sm:w-auto px-6 py-3 rounded-full border border-[#D5CEC2] bg-[#FAF7F2] hover:bg-[#FFFFFF] text-xs sm:text-sm font-serif-th font-semibold text-[#29261F] shadow-[var(--shadow-raised)] transition-all cursor-pointer"
              >
                {isEnglish ? "← Draw Another Reading" : "← เริ่มเปิดไพ่อีกครั้ง"}
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#29261F] hover:bg-[#A58A5C] text-xs sm:text-sm font-serif-th font-semibold text-[#FAF7F2] shadow-[var(--shadow-raised)] transition-all cursor-pointer"
              >
                {copied
                  ? isEnglish
                    ? "Copied to Clipboard!"
                    : "คัดลอกข้อความแล้ว"
                  : isEnglish
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
