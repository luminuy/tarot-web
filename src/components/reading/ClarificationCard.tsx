"use client";

import React from "react";
import type { Persona } from "@/data/personas";
import { CardImage } from "@/components/card/CardImage";
import { useLocale } from "@/lib/i18n";

interface ClarificationCardProps {
  question: string;
  answer: string;
  onAnswerChange: (val: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
  persona?: Persona;
  loading?: boolean;
}

export const ClarificationCard: React.FC<ClarificationCardProps> = ({
  question,
  answer,
  onAnswerChange,
  onSubmit,
  onSkip,
  persona,
  loading = false,
}) => {
  const { isEnglish } = useLocale();

  return (
    <div className="w-full max-w-2xl mx-auto rounded-xl border border-line-warm bg-surface-mist p-5 sm:p-7 space-y-4 shadow-xs">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-15 rounded-lg border-2 border-line-warm overflow-hidden flex-shrink-0 bg-surface">
          <CardImage
            image={persona?.cardImage || "major-02.jpg"}
            alt=""
            className="w-full h-full object-cover object-top contrast-[1.05] tarot-hd-card-image"
            sizes="40px"
          />
        </div>

        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs sm:text-sm font-serif-th font-bold font-mystic-gold">
              {isEnglish
                ? persona?.nameEn || persona?.nameTh || "Tarot Reader"
                : persona?.nameTh || "แม่หมอประจำวิหาร"}
            </span>
            <span className="text-[12px] text-muted font-serif-th">
              {isEnglish
                ? "· Deep Context Clarification"
                : "· สอบถามเพิ่มเติมก่อนสับไพ่"}
            </span>
          </div>

          <p className="text-sm sm:text-base font-serif-th font-medium text-ink leading-relaxed">
            "{question}"
          </p>
        </div>
      </div>

      <div className="space-y-2 pt-1">
        <textarea
            aria-label="คำตอบของคุณสำหรับคำถามจากแม่หมอ"
          rows={2}
          value={answer}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder={
            isEnglish
              ? "Share a brief answer (e.g. we parted 2 months ago, or choosing between 2 specific offers)..."
              : "พิมพ์คำตอบหรือเล่าเพิ่มเติมสั้น ๆ (เช่น เลิกรากันมา 2 เดือนแล้ว หรือ กำลังตัดสินใจระหว่าง 2 ตัวเลือก)..."
          }
          className="w-full p-3 sm:p-3.5 rounded-lg border border-line bg-surface text-xs sm:text-sm font-serif-th focus:outline-none focus:border-gold-ink text-ink placeholder:text-[#8C827A] resize-none leading-relaxed"
        />

        <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
          <p className="text-[11px] sm:text-xs text-muted font-serif-th">
            {isEnglish
              ? "Your answer deepens reading precision (skippable anytime)"
              : "คำตอบจะช่วยให้คำทำนายตรงจุดยิ่งขึ้น (กดข้ามได้เสมอ)"}
          </p>

          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            <button
              type="button"
              onClick={onSkip}
              disabled={loading}
              className="py-2 px-3.5 sm:px-4 rounded-full border border-line bg-inset text-xs font-serif-th text-ink hover:border-gold-ink hover:text-gold-ink transition-colors cursor-pointer disabled:opacity-50"
            >
              {isEnglish ? "Skip" : "ข้ามคำถามนี้"}
            </button>

            <button
              type="button"
              onClick={onSubmit}
              disabled={loading}
              className="py-2 px-4 sm:px-5 rounded-full bg-ink hover:bg-gold-ink text-canvas text-xs sm:text-sm font-bold font-serif-th transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {loading
                ? isEnglish
                  ? "Connecting..."
                  : "กำลังเริ่ม..."
                : isEnglish
                  ? "Answer & Shuffle"
                  : "ตอบและเริ่มสับไพ่"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
