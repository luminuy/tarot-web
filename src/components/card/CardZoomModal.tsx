"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TarotCard as TarotCardComponent } from "@/components/card/TarotCard";
import type { TarotCard } from "@/data/cards/types";

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
  const [flipped, setFlipped] = useState(true);

  if (!isOpen || !card) return null;

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`ซูมดูไพ่ ${card.nameTh} (${card.nameEn})`}
        onClick={onClose}
        className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[#5A432F]/40 backdrop-blur-md cursor-zoom-out"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm rounded-[1.618rem] bg-[#FDF7F0] border-2 border-[#D6B48D] p-6 shadow-2xl flex flex-col items-center text-center space-y-4 relative cursor-default"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างซูมไพ่"
            className="absolute top-4 right-4 w-11 h-11 rounded-2xl bg-[#FCF0E6] border border-[#D6B48D] text-[#5A432F] hover:bg-[#CD9F5B] hover:text-[#FDF7F0] text-sm flex items-center justify-center transition-all cursor-pointer z-10 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CD9F5B]"
          >
            ✕
          </button>

          {/* Position Name Tag */}
          {positionName && (
            <span className="text-xs text-[#FDF7F0] font-serif-th font-bold bg-[#CD9F5B] px-3 py-1 rounded-full shadow-xs">
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
              className="w-full h-full shadow-2xl"
            />
          </div>

          {/* Card Meta & Details */}
          <div className="space-y-1 w-full">
            <h3 className="font-serif-th text-lg sm:text-xl font-bold font-mystic-gold">
              {card.nameTh}
            </h3>
            <p className="text-xs text-[#8C735D] font-mono">
              {card.nameEn} · {isReversed ? "กลับหัว (Reversed)" : "หัวตั้ง (Upright)"}
            </p>

            <div className="flex items-center justify-center gap-2 pt-2 flex-wrap text-[11px]">
              <span className="px-2.5 py-0.5 rounded-full bg-[#FFFFFF] border border-[#D6B48D] text-[#CD9F5B] font-semibold">
                ธาตุ: {card.element}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#FFFFFF] border border-[#D6B48D] text-[#5A432F]">
                {card.astrology}
              </span>
            </div>
          </div>

          {/* Flip Toggle Button */}
          <button
            type="button"
            onClick={() => setFlipped(!flipped)}
            className="w-full py-2.5 rounded-xl bg-[#FFFFFF] border border-[#D6B48D] text-xs font-serif-th font-semibold text-[#5A432F] hover:bg-[#FCF0E6] transition-all cursor-pointer shadow-xs"
          >
            🔄 พลิกดูหน้าไพ่ / หลังไพ่
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
