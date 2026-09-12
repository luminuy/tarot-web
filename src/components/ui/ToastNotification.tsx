"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n";

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

/**
 * ✦ แถบแจ้งเตือน — โมชั่นเป็น CSS ล้วน ไม่ใช้ `motion` แล้ว
 * ---------------------------------------------------------------------------
 * คอมโพเนนต์นี้ถูกเรนเดอร์จาก `TarotFlow` ตรง ๆ (ไม่ได้อยู่หลัง `next/dynamic`)
 * ลำพัง `import { motion }` บรรทัดเดียวจึงลากไลบรารี 40 KB (gzip) เข้าบันเดิล
 * **ตั้งต้น** ของหน้าแรกทั้งไทยและอังกฤษ เพื่อใช้แค่ fade + เลื่อนขึ้น 16px
 *
 * ⚠️ ขาออกต้องจัดการเอง — เดิมพึ่ง `<AnimatePresence>` ของตัวแม่คอยหน่วง unmount ให้
 * ตอนนี้ตัวมันเองถือสถานะ `closing` แล้วค่อยเรียก `onClose()` เมื่อคีย์เฟรมขาออกจบ
 * (`onAnimationEnd`) · มี `closedRef` กันเรียกซ้ำ เพราะทั้งกดปุ่มปิดและหมดเวลา
 * ต่างก็เข้าเส้นเดียวกัน และ `onAnimationEnd` ยังถูกยิงจากคีย์เฟรมของลูกด้วย
 */
export const ToastNotification: React.FC<ToastNotificationProps> = ({ toast, onClose }) => {
  const { isEnglish } = useLocale();
  const [isPaused, setIsPaused] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const duration = toast?.duration ?? 4500;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const remainingTimeRef = useRef(duration);
  const startTimeRef = useRef(Date.now());
  const closedRef = useRef(false);

  /** เริ่มเล่นขาออก — ตัวจริงจะถูกถอดออกเมื่อคีย์เฟรมจบ */
  const beginClose = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsClosing(true);
  }, []);

  useEffect(() => {
    if (!toast) return;

    closedRef.current = false;
    remainingTimeRef.current = toast.duration ?? 4500;
    startTimeRef.current = Date.now();
    setIsPaused(false);
    setIsClosing(false);

    const startTimer = (ms: number) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(beginClose, ms);
    };

    startTimer(remainingTimeRef.current);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast, beginClose]);

  const handleMouseEnter = () => {
    if (closedRef.current) return;
    setIsPaused(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const elapsed = Date.now() - startTimeRef.current;
    remainingTimeRef.current = Math.max(500, remainingTimeRef.current - elapsed);
  };

  const handleMouseLeave = () => {
    if (closedRef.current) return;
    setIsPaused(false);
    startTimeRef.current = Date.now();
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(beginClose, remainingTimeRef.current);
  };

  if (!toast) return null;

  const isError = toast.type === "error";

  return (
    <aside
      key={toast.id || toast.title}
      onAnimationEnd={(e) => {
        // คีย์เฟรมของแถบนับถอยหลัง (ลูก) ก็ bubble ขึ้นมาถึงตรงนี้ด้วย
        // จึงต้องเช็กว่าเป็นคีย์เฟรมขาออกของตัวเองจริง ๆ ก่อนถอดตัวออก
        if (e.animationName.includes("toastOut")) onClose();
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={`${isClosing ? "anim-toast-out" : "anim-toast-in"}
 fixed top-18 sm:top-22 left-1/2 -translate-x-1/2 z-50 pointer-events-auto
 max-w-md w-[calc(100%-2rem)] sm:w-auto min-w-[320px] sm:min-w-[420px]
 rounded-lg p-3.5 sm:p-4 overflow-hidden
 ${
   isError
     ? "bg-surface border border-err text-err"
     : "bg-surface border border-line-warm text-ink-deep"
 }`}
    >
      {/* Top ambient gold / ruby highlight */}
      <div
        className={`absolute inset-x-4 top-0 h-[1.5px] ${
          isError
            ? "bg-gradient-to-r from-transparent via-err to-transparent"
            : "bg-gradient-to-r from-transparent via-gold-ink to-transparent"
        }`}
      />

      <div className="flex items-center gap-3 relative z-10">
        {/* Talisman Icon */}
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-serif ${
            isError
              ? "bg-err-wash border border-line-warm text-err"
              : "bg-inset-warm border border-line-warm text-gold-ink"
          }`}
        >
          {isError ? "!" : "✓"}
        </div>

        {/* Content text */}
        <div className="flex-1 min-w-0 pr-1">
          <h4
            className={`text-sm font-semibold tracking-wide truncate ${isError ? "text-err" : "text-ink-deep"}`}
          >
            {toast.title}
          </h4>
          {toast.subtitle && (
            <p
              className={`text-xs font-serif-th leading-relaxed mt-0.5 line-clamp-2 ${
                isError ? "text-err" : "text-muted"
              }`}
            >
              {toast.subtitle}
            </p>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={beginClose}
          aria-label={isEnglish ? "Dismiss notification" : "ปิดการแจ้งเตือน"}
          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors cursor-pointer shrink-0 ${
            isError
              ? "text-err hover:text-err hover:bg-err-wash"
              : "text-muted hover:text-ink-deep hover:bg-inset-warm"
          }`}
        >
          ✕
        </button>
      </div>

      {/* Micro Progress Bar Countdown */}
      <div className="absolute bottom-0 inset-x-0 h-[2px] bg-inset-warm overflow-hidden">
        {/* scaleX แทน width — width ทำให้เบราว์เซอร์คำนวณ layout ใหม่ทุกเฟรมตลอด 3-5 วินาที
            ส่วน transform วิ่งบน compositor ไม่แตะ main thread เลย (กล่องแม่มี overflow-hidden อยู่แล้ว) */}
        <div
          key={toast.id || toast.title}
          data-paused={isPaused ? "true" : "false"}
          style={{ "--toast-duration": `${duration}ms` } as React.CSSProperties}
          className={`anim-toast-countdown h-full w-full ${isError ? "bg-err" : "bg-gold-ink"}`}
        />
      </div>
    </aside>
  );
};
