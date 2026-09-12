"use client";

import React from "react";
import { useLocale } from "@/lib/i18n";

export type RitualStep = "SPREAD_SELECT" | "INTENTION_SELECT" | "SHUFFLE" | "PICK_CARDS" | "READING" | "SUMMARY";

interface RitualStepProgressProps {
  currentStep: RitualStep;
  onStepClick?: (step: RitualStep) => void;
}

/*
 * ⚠️ ทุกข้อความในคอมโพเนนต์นี้ต้องมีคู่ภาษาอังกฤษเสมอ (UX-17)
 * มันถูกใช้ในเส้นทาง /en ด้วย — ของเดิมมีแต่ไทยทั้ง title และ aria-label
 */
const STEPS: { id: RitualStep; title: string; titleEn: string; num: number }[] = [
  { id: "SPREAD_SELECT", title: "เลือกผัง", titleEn: "Choose Spread", num: 1 },
  { id: "INTENTION_SELECT", title: "ตั้งคำถาม", titleEn: "Set Intention", num: 2 },
  { id: "SHUFFLE", title: "สับไพ่", titleEn: "Shuffle", num: 3 },
  { id: "PICK_CARDS", title: "เลือกไพ่", titleEn: "Pick Cards", num: 4 },
  { id: "READING", title: "คำทำนาย", titleEn: "Reading", num: 5 },
];

const getStepIndex = (step: RitualStep) => {
  if (step === "SPREAD_SELECT") return 0;
  if (step === "INTENTION_SELECT") return 1;
  if (step === "SHUFFLE") return 2;
  if (step === "PICK_CARDS") return 3;
  return 4; // READING or SUMMARY
};

export const RitualStepProgress: React.FC<RitualStepProgressProps> = ({ currentStep, onStepClick }) => {
  const { isEnglish } = useLocale();
  const currentIndex = getStepIndex(currentStep);

  return (
    <nav aria-label={isEnglish ? "Reading ritual progress" : "ความคืบหน้าการดูดวง"} className="w-full max-w-2xl mx-auto mb-10 px-2 select-none">
      <ol className="flex items-center justify-between relative list-none">
        {/* Background Connecting Rail */}
        <div className="absolute left-0 top-[14px] sm:top-4 w-full h-[1px] bg-line-warm z-0" aria-hidden="true" />

        {/*
          * Active Golden Progress Rail
          *
          * ⚠️ ห้ามกลับไปอนิเมต `width` (ของเดิมใช้ motion อนิเมตเป็น %)
          * `width` เป็นคุณสมบัติที่ทำให้เบราว์เซอร์ต้องคำนวณ layout ใหม่ทุกเฟรม
          * ส่วน `transform: scaleX()` เบราว์เซอร์ยกไปให้ compositor ทำ ไม่แตะ layout เลย
          * ผลที่ตาเห็นเหมือนกันเป๊ะเพราะแถบนี้สูง 2px สีทึบสีเดียว การยืดจึงไม่ทำให้อะไรบิดเบี้ยว
          *
          * ได้ของแถมคือคอมโพเนนต์นี้เลิกพึ่ง `motion` ทั้งไฟล์ — แถบความคืบหน้าโผล่อยู่
          * ตลอดพิธีดูดวง แต่มันทำแค่ "ยืดแถบเดียว" ซึ่ง CSS transition ทำได้อยู่แล้ว
          *
          * เรนเดอร์แรกฝั่งเซิร์ฟเวอร์ได้ค่า transform ปลายทางไปด้วยกับ inline style
          * จึงไม่มีจังหวะกระพริบตอน hydrate (เทียบเท่า `initial={false}` ของเดิม)
          */}
        <div
          className="absolute left-0 top-[14px] sm:top-4 h-[2px] w-full origin-left bg-gold-ink z-0 transition-transform duration-400 ease-standard"
          aria-hidden="true"
          style={{ transform: `scaleX(${currentIndex / (STEPS.length - 1)})` }}
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
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[13px] sm:text-xs font-mono font-bold transition duration-300 ${
                isActive
                  ? "bg-gold-ink border-2 border-gold-ink text-white ring-4 ring-[rgba(143,92,26,0.15)]"
                  : isPassed
                    ? "bg-white border-2 border-gold-ink text-gold-ink font-bold"
                    : "bg-inset-warm border border-line-warm text-muted"
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
              className={`text-[13px] sm:text-[13px] font-serif-th mt-1.5 transition-colors whitespace-nowrap ${
                isActive ? "font-bold text-ink-deep" : "text-muted"
              }`}
            >
              {isEnglish ? step.titleEn : step.title}
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
                  aria-label={
                    isEnglish
                      ? `Back to step ${step.num}: ${step.titleEn}`
                      : `ย้อนกลับไปขั้นที่ ${step.num}: ${step.title}`
                  }
                  className="flex flex-col items-center cursor-pointer group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7F2] hover:scale-110 transition-transform"
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
