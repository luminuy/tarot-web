"use client";

import React from "react";
import { motion } from "motion/react";

export type RitualStep = "SPREAD_SELECT" | "INTENTION_SELECT" | "SHUFFLE" | "PICK_CARDS" | "READING" | "SUMMARY";

interface RitualStepProgressProps {
  currentStep: RitualStep;
  onStepClick?: (step: RitualStep) => void;
}

const STEPS: { id: RitualStep; title: string; num: number }[] = [
  { id: "SPREAD_SELECT", title: "เลือกผัง", num: 1 },
  { id: "INTENTION_SELECT", title: "ตั้งคำถาม", num: 2 },
  { id: "SHUFFLE", title: "สับไพ่", num: 3 },
  { id: "PICK_CARDS", title: "เลือกไพ่", num: 4 },
  { id: "READING", title: "คำทำนาย", num: 5 },
];

const getStepIndex = (step: RitualStep) => {
  if (step === "SPREAD_SELECT") return 0;
  if (step === "INTENTION_SELECT") return 1;
  if (step === "SHUFFLE") return 2;
  if (step === "PICK_CARDS") return 3;
  return 4; // READING or SUMMARY
};

export const RitualStepProgress: React.FC<RitualStepProgressProps> = ({ currentStep, onStepClick }) => {
  const currentIndex = getStepIndex(currentStep);

  return (
    <nav aria-label="ความคืบหน้าการดูดวง" className="w-full max-w-2xl mx-auto mb-10 px-2 select-none">
      <ol className="flex items-center justify-between relative list-none">
        {/* Background Connecting Rail */}
        <div className="absolute left-0 top-[14px] sm:top-4 w-full h-[1px] bg-[#E4D8C4] z-0" aria-hidden="true" />

        {/* Active Golden Progress Rail */}
        <motion.div
          className="absolute left-0 top-[14px] sm:top-4 h-[2px] bg-[#8F5C1A] z-0"
          aria-hidden="true"
          initial={false}
          animate={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />

        {/* Step Nodes */}
        {STEPS.map((step, idx) => {
          const isActive = idx === currentIndex;
          const isPassed = idx < currentIndex;
          // ย้อนกลับผ่าน stepper ได้จริงเฉพาะช่วงเลือกผัง/ตั้งคำถาม (ยังไม่เปิดเซสชัน server)
          // หลังจากนั้นให้ใช้ปุ่ม "ย้อนกลับ" ในแต่ละขั้นแทน — ตัด affordance ที่กดไม่ได้ทิ้ง
          const isClickable = isPassed && !!onStepClick && currentIndex <= 1;

          const dot = (
            <span
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-mono font-bold transition-all duration-300 ${
                isActive
                  ? "bg-[#8F5C1A] border-2 border-[#8F5C1A] text-white ring-4 ring-[rgba(143,92,26,0.15)]"
                  : isPassed
                    ? "bg-white border-2 border-[#8F5C1A] text-[#8F5C1A] font-bold"
                    : "bg-[#F0E8DB] border border-[#E4D8C4] text-[#6F5B4A]"
              }`}
            >
              {isPassed ? "✓" : step.num}
            </span>
          );

          /*
           * สถานะของแต่ละขั้นสื่อด้วย "รูปทรงของจุด" (ทองทึบ / ทองขอบพร้อม ✓ / ร่องเปล่า)
           * ไม่ใช่ด้วยการหรี่ตัวหนังสือ — ของเดิมใช้ /50 ได้คอนทราสต์ 2.05 ซึ่งอ่านไม่ออก
           * และขั้นที่ยังไม่ถึงคือข้อมูลที่ผู้ใช้ต้องอ่านได้ ไม่ใช่ปุ่มที่ถูกปิดใช้งาน
           */
          const label = (
            <span
              className={`text-[10px] sm:text-[11px] font-serif-th mt-1.5 transition-colors whitespace-nowrap ${
                isActive ? "font-bold text-[#2E211A]" : "text-[#6F5B4A]"
              }`}
            >
              {step.title}
            </span>
          );

          return (
            <li
              key={step.id}
              aria-current={isActive ? "step" : undefined}
              className="flex flex-col items-center relative z-10"
            >
              {isClickable ? (
                <button
                  type="button"
                  onClick={() => onStepClick?.(step.id)}
                  aria-label={`ย้อนกลับไปขั้นที่ ${step.num}: ${step.title}`}
                  className="flex flex-col items-center cursor-pointer group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6F1E9] hover:scale-110 transition-transform"
                >
                  {dot}
                  {label}
                </button>
              ) : (
                <div className="flex flex-col items-center cursor-default">
                  {dot}
                  {label}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
