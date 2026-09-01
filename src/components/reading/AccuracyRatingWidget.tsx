"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SPRING } from "@/lib/motion";

interface AccuracyRatingWidgetProps {
  personaId: string;
  readingId?: string;
}

const RATING_OPTIONS = [
  { score: 1, label: "ไม่ตรง", symbol: "✦" },
  { score: 2, label: "ตรงบ้าง", symbol: "✦✦" },
  { score: 3, label: "ตรงพอใช้", symbol: "✦✦✦" },
  { score: 4, label: "ตรงมาก", symbol: "✦✦✦✦" },
  { score: 5, label: "ตรงเป๊ะ!", symbol: "✦✦✦✦✦" },
];

/** ประเมินความแม่นยำหลังอ่านไพ่ — ใช้เป็น A/B data สำหรับปรับ prompt */
export const AccuracyRatingWidget: React.FC<AccuracyRatingWidgetProps> = ({
  personaId,
  readingId,
}) => {
  const [submitted, setSubmitted] = useState(false);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);

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
          className="flex items-center justify-center gap-2 py-3 text-xs text-[#e5c07b] font-serif-th bg-[#140d28]/60 border border-[#e5c07b]/25 rounded-2xl px-4 my-2"
        >
          <span>✨</span>
          <span>
            ขอบคุณสำหรับการให้คะแนน!{" "}
            {selectedScore !== null && (
              <span className="text-[#f5deaa] font-bold">
                ({selectedScore === 1 ? "ไม่ตรง" : selectedScore === 2 ? "ตรงบ้าง" : selectedScore === 3 ? "ตรงพอใช้" : selectedScore === 4 ? "ตรงมาก" : "ตรงเป๊ะ!"})
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
          className="flex flex-col items-center gap-2 py-3 my-2"
        >
          <span className="text-[11px] text-[#9c93b8] font-serif-th flex items-center gap-1.5">
            <span className="text-[#e5c07b]">✦</span>
            <span>คำทำนายครั้งนี้ตรงกับสถานการณ์จริงของคุณไหม?</span>
          </span>
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {RATING_OPTIONS.map(({ score, label, symbol }) => (
              <button
                key={score}
                type="button"
                onClick={() => handleRate(score)}
                className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl bg-[#100b20] border border-[#e5c07b]/25 hover:border-[#ffd700] hover:bg-[#191230] hover:shadow-[0_0_15px_rgba(229,192,123,0.3)] transition-all cursor-pointer active:scale-95 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd700]"
                title={label}
                aria-label={`ให้คะแนนระดับ: ${label}`}
              >
                <span className="text-[10px] text-[#ffd700] font-mono group-hover:scale-110 transition-transform">
                  {symbol}
                </span>
                <span className="text-[9px] text-[#9c93b8] group-hover:text-[#f5deaa] font-serif-th transition-colors">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
