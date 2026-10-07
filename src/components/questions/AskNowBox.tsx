"use client";

import React, { useState } from "react";
import { trackReflectionEvent } from "@/lib/stats/reflection-events";
import { queueQuestionPrefill, type QuestionPrefill } from "@/lib/reading/question-prefill";

/**
 * ✦ กล่อง "ถามเลยตอนนี้" ของหน้าคำถาม (REFLECTION_JOURNAL_PLAN 1.11)
 * คำถาม + ผังที่เหมาะตั้งไว้ให้แล้ว · แก้คำถามได้ · กดแล้วพาไปพิธีเปิดไพ่ `/read/<ผัง>` ที่เติมคำถามไว้ให้
 * island เล็กที่สุดเท่าที่ทำได้ (ไม่มีสำรับ/สารานุกรม) · โหลดแบบ `client:visible`
 */
export const AskNowBox: React.FC<{
  isEnglish: boolean;
  defaultQuestion: string;
  spreadId: string;
  spreadName: string;
  cardCount: number;
  category: QuestionPrefill["category"];
}> = ({ isEnglish, defaultQuestion, spreadId, spreadName, cardCount, category }) => {
  const [q, setQ] = useState(defaultQuestion);
  const L = (th: string, en: string) => (isEnglish ? en : th);

  const go = () => {
    const question = q.trim() || defaultQuestion;
    queueQuestionPrefill({ question, category, spreadId });
    trackReflectionEvent("question_ask_now");
    window.location.href = `${isEnglish ? "/en" : ""}/read/${spreadId}`;
  };

  return (
    <div className="altar-card-porcelain !rounded-2xl p-5 sm:p-7 space-y-4">
      <div className="space-y-1">
        <p className="text-[11px] sm:text-xs tracking-[0.2em] uppercase text-gold-ink font-serif-th">{L("ถามเลยตอนนี้", "Ask it now")}</p>
        <p className="text-sm sm:text-base font-serif-th text-ink-deep">
          {L(`ผัง${spreadName} · ${cardCount} ใบ · สับและเลือกไพ่ด้วยมือคุณเอง`, `${spreadName} · ${cardCount} ${cardCount === 1 ? "card" : "cards"} · you shuffle and pick the cards yourself`)}
        </p>
      </div>
      <label className="block space-y-1.5">
        <span className="text-xs font-serif-th text-muted">{L("คำถามของคุณ (แก้ได้)", "Your question (edit freely)")}</span>
        <textarea
          value={q}
          onChange={(e) => setQ(e.target.value)}
          maxLength={500}
          rows={2}
          className="w-full rounded-xl border border-line-interactive-warm bg-surface/80 px-3 py-2 text-sm font-serif-th text-ink-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
        />
      </label>
      <button
        type="button"
        onClick={go}
        className="tap-overlay-y min-h-[44px] inline-flex items-center px-6 rounded-full btn-gold-glass text-sm font-serif-th font-bold"
      >
        {L("เปิดไพ่ถามเรื่องนี้", "Draw cards for this question")}
      </button>
    </div>
  );
};
