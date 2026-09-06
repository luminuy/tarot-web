"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TarotCard as TarotCardComponent } from "@/components/card/TarotCard";
import type { TarotCard } from "@/data/cards/types";
import { useLocale } from "@/lib/i18n";

const elementEnMap: Record<string, string> = {
  "ไฟ": "Fire",
  "น้ำ": "Water",
  "ลม": "Air",
  "ดิน": "Earth",
};

interface CardZoomModalProps {
  card: TarotCard | null;
  positionName?: string;
  isReversed?: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export const CardZoomModal: React.FC<CardZoomModalProps> = ({
  card,
  positionName,
  isReversed = false,
  isOpen,
  onClose,
}) => {
  const { isEnglish } = useLocale();
  const [flipped, setFlipped] = useState(true);

  if (!isOpen || !card) return null;

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEnglish ? `Zoom card ${card.nameEn || card.nameTh}` : `ซูมดูไพ่ ${card.nameTh} (${card.nameEn})`}
        onClick={onClose}
        className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[#2E211A]/50 backdrop-blur-[3px] cursor-zoom-out"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm rounded-lg bg-[#FFFFFF] border-2 border-[#D9C8AC] p-6 shadow-overlay flex flex-col items-center text-center space-y-4 relative cursor-default"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label={isEnglish ? "Close card zoom view" : "ปิดหน้าต่างซูมไพ่"}
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-[#F3EDE2] border border-[#D9C8AC] text-[#2E211A] hover:bg-[#8F5C1A] hover:text-[#FFFFFF] text-sm flex items-center justify-center transition-all cursor-pointer z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A]"
          >
            ✕
          </button>

          {/* Position Name Tag */}
          {positionName && (
            <span className="text-xs text-[#FFFFFF] font-serif-th font-bold bg-[#8F5C1A] px-3 py-1 rounded-full ">
              {positionName}
            </span>
          )}

          {/* Large 3D Tarot Card Component */}
          <div className="w-52 h-[353px] sm:w-60 sm:h-[408px] py-2 flex items-center justify-center">
            <TarotCardComponent
              card={card}
              isReversed={isReversed}
              isRevealed={flipped}
              size="lg"
              imageFull
              className="w-full h-full shadow-overlay"
            />
          </div>

          {/* Card Meta & Details */}
          <div className="space-y-1 w-full">
            <h3 className="font-serif-th text-lg sm:text-xl font-bold font-mystic-gold">
              {isEnglish ? (card.nameEn || card.nameTh) : card.nameTh}
            </h3>
            <p className="text-xs text-[#635B4E] font-mono">
              {isEnglish
                ? (isReversed ? "Reversed" : "Upright")
                : `${card.nameEn} · ${isReversed ? "กลับหัว (Reversed)" : "หัวตั้ง (Upright)"}`}
            </p>

            <div className="flex items-center justify-center gap-2 pt-2 flex-wrap text-[13px]">
              <span className="px-2.5 py-0.5 rounded-full bg-[#FFFFFF] border border-[#D9C8AC] text-[#8F5C1A] font-semibold">
                {isEnglish ? `Element: ${elementEnMap[card.element] || card.element}` : `ธาตุ: ${card.element}`}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#FFFFFF] border border-[#D9C8AC] text-[#2E211A]">
                {isEnglish ? (card.astrologyEn || card.astrology) : card.astrology}
              </span>
            </div>
          </div>

          {/* Flip Toggle Button */}
          <button
            type="button"
            onClick={() => setFlipped(!flipped)}
            className="w-full py-2.5 rounded-lg bg-[#FFFFFF] border border-[#D9C8AC] text-xs font-serif-th font-semibold text-[#2E211A] hover:bg-[#F3EDE2] transition-all cursor-pointer "
          >
            {isEnglish ? "Flip Card / View Back" : "พลิกดูหน้าไพ่ / หลังไพ่"}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
