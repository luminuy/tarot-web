"use client";

import React, { useId } from "react";
import { MOOD_OPTIONS, type MoodLevel } from "@/lib/journal/mood";

/**
 * ✦ "ใจตอนนี้" แตะเดียว 5 ระดับ (REFLECTION_JOURNAL_PLAN 1.3)
 * ---------------------------------------------------------------------------
 * จุดสี + คำสั้น ไม่ใช้อิโมจิ (กฎเหล็กข้อ 2) · แตะซ้ำที่เดิม = ยกเลิก (ข้ามได้เสมอ ไม่บังคับ)
 * เป็นกลุ่มปุ่มแบบ radio — ใช้คีย์บอร์ด/โปรแกรมอ่านหน้าจอได้ · ปุ่มสูง ≥ 44px บนมือถือ
 * ⚠️ ไฟล์นี้ถูก import ในเปลือกหน้าแรก (TarotFlow) — ห้ามลาก motion/สำรับ/ไลบรารีหนักเข้ามา
 */
export const MoodPicker: React.FC<{
  value: MoodLevel | null | undefined;
  onChange: (level: MoodLevel | null) => void;
  isEnglish: boolean;
  label: string;
  hint?: string;
  compact?: boolean;
}> = ({ value, onChange, isEnglish, label, hint, compact }) => {
  const id = useId();
  return (
    <div className={`w-full ${compact ? "" : "max-w-2xl mx-auto"} space-y-2`}>
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <p id={`${id}-l`} className="text-xs sm:text-[13px] font-serif-th font-semibold text-ink-deep">
          {label}
        </p>
        {hint && <p className="text-[11px] sm:text-xs text-muted font-serif-th">{hint}</p>}
      </div>
      <div role="radiogroup" aria-labelledby={`${id}-l`} className="flex flex-wrap gap-1.5 sm:gap-2">
        {MOOD_OPTIONS.map((opt) => {
          const selected = value === opt.level;
          return (
            <button
              key={opt.level}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(selected ? null : opt.level)}
              className={`tap-overlay-y min-h-[44px] inline-flex items-center gap-1.5 px-3 sm:px-3.5 rounded-full border text-xs sm:text-[13px] font-serif-th transition-colors duration-150 cursor-pointer ${
                selected
                  ? "bg-surface border-gold-ink text-ink-deep font-semibold shadow-sm"
                  : "glass-chip border-line-warm text-ink-deep hover:border-gold-ink"
              }`}
            >
              <span
                aria-hidden="true"
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: opt.color, boxShadow: selected ? `0 0 0 3px ${opt.color}33` : undefined }}
              />
              {isEnglish ? opt.en : opt.th}
            </button>
          );
        })}
      </div>
    </div>
  );
};
