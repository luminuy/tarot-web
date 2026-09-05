"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SPRING } from "@/lib/motion";
import { useLocale } from "@/lib/i18n";

interface AccuracyRatingWidgetProps {
  personaId: string;
  readingId?: string;
}

const RATING_OPTIONS = [
  { score: 1, labelTh: "ไม่ตรง", labelEn: "Not resonant", symbol: "✦" },
  { score: 2, labelTh: "ตรงบ้าง", labelEn: "Somewhat", symbol: "✦✦" },
  { score: 3, labelTh: "ตรงพอใช้", labelEn: "Fair", symbol: "✦✦✦" },
  { score: 4, labelTh: "ตรงมาก", labelEn: "Very accurate", symbol: "✦✦✦✦" },
  { score: 5, labelTh: "ตรงเป๊ะ!", labelEn: "Spot on!", symbol: "✦✦✦✦✦" },
];

/** ประเมินความแม่นยำหลังอ่านไพ่ — ใช้เป็น A/B data สำหรับปรับ prompt */
export const AccuracyRatingWidget: React.FC<AccuracyRatingWidgetProps> = ({ personaId, readingId }) => {
  const { isEnglish } = useLocale();
  const [submitted, setSubmitted] = useState(false);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);

  const getScoreLabel = (score: number) => {
    const opt = RATING_OPTIONS.find((o) => o.score === score);
    return isEnglish ? opt?.labelEn : opt?.labelTh;
  };

  // ตรวจว่าเคยให้คะแนนการอ่านนี้ไปแล้วหรือยัง
  useEffect(() => {
    if (!readingId) return;
    try {
      const stored = localStorage.getItem(`rating_${readingId}`);
      if (stored) {
        setSubmitted(true);
        setSelectedScore(parseInt(stored, 10));
      }
    } catch {}
  }, [readingId]);

  const handleRate = (score: number) => {
    setSelectedScore(score);
    setSubmitted(true);

    // บันทึกลง localStorage เพื่อป้องกันให้คะแนนซ้ำ
    if (readingId) {
      try {
        localStorage.setItem(`rating_${readingId}`, score.toString());
      } catch {}
    }

    // บันทึก A/B persona accuracy data
    try {
      const key = "persona_ratings";
      const existing = JSON.parse(localStorage.getItem(key) || "[]") as Array<{
        personaId: string;
        score: number;
        readingId?: string;
        timestamp: string;
      }>;
      existing.push({
        personaId,
        score,
        readingId,
        timestamp: new Date().toISOString(),
      });
      // เก็บแค่ 500 รายการล่าสุด
      if (existing.length > 500) existing.splice(0, existing.length - 500);
      localStorage.setItem(key, JSON.stringify(existing));
    } catch {}
  };

  return (
    <AnimatePresence mode="wait">
      {submitted ? (
        <motion.div
          key="thank-you"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={SPRING.snappy}
          className="flex items-center justify-center gap-2 py-3 text-xs text-[#2E211A] font-serif-th bg-[#FFFFFF] border border-[#D9C8AC] rounded-lg px-4 my-2 "
        >
          <span className="text-[#8F5C1A]">✨</span>
          <span>
            {isEnglish ? "Thank you for your resonance feedback! " : "ขอบคุณสำหรับการให้คะแนน! "}
            {selectedScore !== null && (
              <span className="text-[#8F5C1A] font-bold">
                ({getScoreLabel(selectedScore)})
              </span>
            )}
          </span>
        </motion.div>
      ) : (
        <motion.div
          key="rating-buttons"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="flex flex-col items-center gap-2.5 py-3 my-2"
        >
          <span className="text-xs text-[#2E211A] font-serif-th font-semibold flex items-center gap-1.5">
            <span className="text-[#8F5C1A]">✦</span>
            <span>
              {isEnglish
                ? "Did this reading resonate with your situation?"
                : "คำทำนายครั้งนี้ตรงกับสถานการณ์จริงของคุณไหม?"}
            </span>
          </span>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {RATING_OPTIONS.map(({ score, labelTh, labelEn, symbol }) => {
              const label = isEnglish ? labelEn : labelTh;
              return (
                <button
                  key={score}
                  type="button"
                  onClick={() => handleRate(score)}
                  className="flex flex-col items-center gap-1 px-3.5 py-2 rounded-lg bg-[#FFFFFF] border border-[#D9C8AC] hover:border-[#8F5C1A] hover:bg-[#FAF7F2] transition-all cursor-pointer active:scale-95 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A]"
                  title={label}
                  aria-label={isEnglish ? `Rating: ${label}` : `ให้คะแนนระดับ: ${label}`}
                >
                  <span className="text-[13px] text-[#8F5C1A] font-mono group-hover:scale-115 transition-transform">
                    {symbol}
                  </span>
                  <span className="text-[13px] text-[#635B4E] group-hover:text-[#2E211A] font-serif-th font-medium transition-colors">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
