"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

export interface ToastData {
  id?: string;
  type: "welcome" | "success" | "error" | "info";
  title: string;
  subtitle?: string;
  duration?: number; // ms (default: 4500ms)
}

export interface ToastNotificationProps {
  toast: ToastData | null;
  onClose: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toast, onClose }) => {
  const [isPaused, setIsPaused] = useState(false);
  const duration = toast?.duration ?? 4500;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const remainingTimeRef = useRef(duration);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (!toast) return;

    remainingTimeRef.current = toast.duration ?? 4500;
    startTimeRef.current = Date.now();
    setIsPaused(false);

    const startTimer = (ms: number) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onClose();
      }, ms);
    };

    startTimer(remainingTimeRef.current);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast, onClose]);

  const handleMouseEnter = () => {
    setIsPaused(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const elapsed = Date.now() - startTimeRef.current;
    remainingTimeRef.current = Math.max(500, remainingTimeRef.current - elapsed);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
    startTimeRef.current = Date.now();
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onClose();
    }, remainingTimeRef.current);
  };

  if (!toast) return null;

  const isError = toast.type === "error";

  return (
    <motion.aside
      key={toast.id || toast.title}
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
      }}
      exit={{
        opacity: 0,
        y: -10,
        scale: 0.97,
        transition: { duration: 0.12, ease: [0.4, 0, 1, 1] },
      }}
      style={{ willChange: "transform, opacity" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={`fixed top-18 sm:top-22 left-1/2 -translate-x-1/2 z-50 pointer-events-auto
 max-w-md w-[calc(100%-2rem)] sm:w-auto min-w-[320px] sm:min-w-[420px]
 rounded-lg p-3.5 sm:p-4 overflow-hidden
 transition-all duration-200
 ${
   isError
     ? "bg-[#FFFFFF] border border-[#A6392C] text-[#A6392C]"
     : "bg-[#FFFFFF] border border-[#D9C8AC] text-[#2E211A]"
 }`}
    >
      {/* Top ambient gold / ruby highlight */}
      <div
        className={`absolute inset-x-4 top-0 h-[1.5px] ${
          isError
            ? "bg-gradient-to-r from-transparent via-[#A6392C] to-transparent"
            : "bg-gradient-to-r from-transparent via-[#8F5C1A] to-transparent"
        }`}
      />

      <div className="flex items-center gap-3 relative z-10">
        {/* Talisman Icon */}
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-serif ${
            isError
              ? "bg-[#FCEEEA] border border-[#D9C8AC] text-[#A6392C]"
              : "bg-[#F3EDE2] border border-[#D9C8AC] text-[#8F5C1A]"
          }`}
        >
          {isError ? "✦" : "✨"}
        </div>

        {/* Content text */}
        <div className="flex-1 min-w-0 pr-1">
          <h4
            className={`text-sm font-semibold tracking-wide truncate ${isError ? "text-[#A6392C]" : "text-[#2E211A]"}`}
          >
            {toast.title}
          </h4>
          {toast.subtitle && (
            <p
              className={`text-xs font-serif-th leading-relaxed mt-0.5 line-clamp-2 ${
                isError ? "text-[#A6392C]" : "text-[#635B4E]"
              }`}
            >
              {toast.subtitle}
            </p>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="ปิดการแจ้งเตือน"
          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors cursor-pointer shrink-0 ${
            isError
              ? "text-[#A6392C] hover:text-[#A6392C] hover:bg-[#FCEEEA]"
              : "text-[#635B4E] hover:text-[#2E211A] hover:bg-[#F3EDE2]"
          }`}
        >
          ✕
        </button>
      </div>

      {/* Micro Progress Bar Countdown */}
      <div className="absolute bottom-0 inset-x-0 h-[2px] bg-[#F3EDE2] overflow-hidden">
        <motion.div
          key={toast.id || toast.title}
          initial={{ width: "100%" }}
          animate={{ width: isPaused ? undefined : "0%" }}
          transition={{ duration: duration / 1000, ease: "linear" }}
          className={`h-full ${isError ? "bg-[#A6392C]" : "bg-[#8F5C1A]"}`}
        />
      </div>
    </motion.aside>
  );
};
