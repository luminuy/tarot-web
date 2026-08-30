"use client";

import React from "react";
import { motion } from "motion/react";

export type RitualStep = "SPREAD_SELECT" | "INTENTION_SELECT" | "SHUFFLE" | "PICK_CARDS" | "READING" | "SUMMARY";

interface RitualStepProgressProps {
  currentStep: RitualStep;
  onStepClick?: (step: RitualStep) => void;
}

const STEPS: { id: RitualStep; title: string; num: number; icon: string }[] = [
  { id: "SPREAD_SELECT", title: "เลือกผัง", num: 1, icon: "🎴" },
  { id: "INTENTION_SELECT", title: "ตั้งคำถาม", num: 2, icon: "✍️" },
  { id: "SHUFFLE", title: "สับไพ่", num: 3, icon: "🔮" },
  { id: "PICK_CARDS", title: "เลือกไพ่", num: 4, icon: "✨" },
  { id: "READING", title: "คำทำนาย", num: 5, icon: "📜" },
];

export const RitualStepProgress: React.FC<RitualStepProgressProps> = ({
  currentStep,
  onStepClick,
}) => {
  const getStepIndex = (step: RitualStep) => {
    if (step === "SPREAD_SELECT") return 0;
    if (step === "INTENTION_SELECT") return 1;
    if (step === "SHUFFLE") return 2;
    if (step === "PICK_CARDS") return 3;
    return 4; // READING or SUMMARY
  };

  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 px-2 select-none">
      <div className="flex items-center justify-between relative">
        {/* Background Connecting Rail */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[1px] bg-[#e5c07b]/20 z-0" />
        
        {/* Active Golden Progress Rail */}
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-[#c59b27] via-[#f5deaa] to-[#e5c07b] shadow-[0_0_12px_rgba(229,192,123,0.8)] z-0"
          initial={false}
          animate={{
            width: `${(currentIndex / (STEPS.length - 1)) * 100}%`,
          }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />

        {/* Step Nodes */}
        {STEPS.map((step, idx) => {
          const isActive = idx === currentIndex;
          const isPassed = idx < currentIndex;
          const isClickable = isPassed && onStepClick && (currentStep === "INTENTION_SELECT" || currentStep === "SPREAD_SELECT");

          return (
            <div
              key={step.id}
              onClick={() => isClickable && onStepClick(step.id)}
              className={`flex flex-col items-center relative z-10 ${
                isClickable ? "cursor-pointer group" : ""
              }`}
            >
              <motion.div
                whileHover={isClickable ? { scale: 1.15 } : {}}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-mono font-bold transition-all duration-300 ${
                  isActive
                    ? "bg-[#05040a] border-2 border-[#e5c07b] text-[#f5deaa] ring-4 ring-[#e5c07b]/30 shadow-[0_0_20px_rgba(229,192,123,0.6)]"
                    : isPassed
                    ? "bg-[#c59b27] border border-[#f5deaa] text-[#05040a] shadow-[0_0_10px_rgba(229,192,123,0.4)]"
                    : "bg-[#0c071a] border border-[#e5c07b]/30 text-[#9c93b8]/60"
                }`}
              >
                {isPassed ? "✓" : step.num}
              </motion.div>

              <span
                className={`text-[10px] sm:text-[11px] font-serif-th mt-1.5 transition-colors whitespace-nowrap ${
                  isActive
                    ? "font-bold text-[#f5deaa] drop-shadow"
                    : isPassed
                    ? "text-[#e5c07b]/80"
                    : "text-[#9c93b8]/50"
                }`}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
