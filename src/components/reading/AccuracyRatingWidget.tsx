"use client";

import React, { useState, useEffect } from "react";

interface AccuracyRatingWidgetProps {
  personaId: string;
  readingId?: string;
}

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

  if (submitted) {
    return (
      <div className="flex items-center justify-center gap-2 py-2 text-xs text-[#e5c07b] font-serif-th">
        <span>✨</span>
        <span>
          ขอบคุณสำหรับการให้คะแนน!{" "}
          {selectedScore !== null && (
            <span className="text-[#f5deaa] font-bold">
              ({selectedScore === 1 ? "ไม่ตรง" : selectedScore === 2 ? "ตรงบ้าง" : selectedScore === 3 ? "ตรงพอใช้" : selectedScore === 4 ? "ตรงมาก" : "ตรงเป๊ะ!"})
            </span>
          )}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <span className="text-[10px] text-[#9c93b8] font-serif-th">
        คำทำนายครั้งนี้ตรงกับสถานการณ์จริงของคุณไหม?
      </span>
      <div className="flex items-center gap-1.5">
        {[
          { score: 1, label: "ไม่ตรง", emoji: "😕" },
          { score: 2, label: "ตรงบ้าง", emoji: "🤔" },
          { score: 3, label: "พอใช้", emoji: "😊" },
          { score: 4, label: "ตรงมาก", emoji: "😮" },
          { score: 5, label: "ตรงเป๊ะ!", emoji: "🤩" },
        ].map(({ score, label, emoji }) => (
          <button
            key={score}
            type="button"
            onClick={() => handleRate(score)}
            className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl bg-[#100b20] border border-[#e5c07b]/20 hover:border-[#e5c07b]/60 hover:bg-[#191230] transition-all cursor-pointer active:scale-90 group"
            title={label}
          >
            <span className="text-base group-hover:scale-110 transition-transform">{emoji}</span>
            <span className="text-[8px] text-[#9c93b8] group-hover:text-[#f5deaa] transition-colors">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
