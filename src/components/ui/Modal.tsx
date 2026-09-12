"use client";

import React, { useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AppMotionProvider } from "@/components/providers/AppMotionProvider";
import { SPRING, TWEEN, useMotionSafe } from "@/lib/motion";
import { useLocale } from "@/lib/i18n";
import { useDialogBehavior } from "@/lib/use-dialog-behavior";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  className?: string;
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "2xl",
  className = "",
  showCloseButton = true,
}) => {
  const { isEnglish } = useLocale();
  const isMotionSafe = useMotionSafe();
  const modalContainerRef = useRef<HTMLDivElement>(null);

  /*
   * 🪟 พฤติกรรม dialog ทั้งชุด (Esc · focus trap · scroll lock · คืนโฟกัส)
   * ย้ายไปอยู่ใน `useDialogBehavior` แล้ว เพื่อให้หน้าต่างลอยอีก 5 บานที่ไม่ได้ใช้
   * คอมโพเนนต์นี้ได้พฤติกรรมชุดเดียวกันโดยไม่ต้องคัดลอกโค้ด (UX-08)
   *
   * ⚠️ กับดักเรื่อง deps ที่เคยทำให้เกิดบั๊ก 3 อาการ ถูกย้ายไปเขียนไว้ที่หัวไฟล์ของ hook
   * อ่านที่นั่นก่อนแก้ hook เสมอ
   */
  useDialogBehavior(isOpen, onClose, modalContainerRef);

  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
  }[maxWidth];

  return (
    <AppMotionProvider>
      <AnimatePresence>
        {isOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === "string" ? title : isEnglish ? "Details dialog" : "หน้าต่างรายละเอียด"}
            className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 sm:p-6 overflow-y-auto overscroll-contain"
          >
            {/* Backdrop Scrim */}
            <motion.div
              key="modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={TWEEN.fast}
              onClick={onClose}
              className="fixed inset-0 modal-scrim"
            />

            {/* Modal Dialog Card */}
            <motion.div
              key="modal-content"
              ref={modalContainerRef}
              tabIndex={-1}
              /*
               * ไม่ใช้ scale กับการ์ดโมดัลใบใหญ่ — การย่อ/ขยายบังคับให้เบราว์เซอร์
               * วาดตัวอักษรทั้งใบใหม่ทุกเฟรม (re-raster) ทำให้ตอนเปิดกระตุกเห็นชัด
               * เลื่อนขึ้น + จาง ให้ผลทางสายตาใกล้เคียงกันแต่เบากว่ามาก
               */
              initial={isMotionSafe ? { opacity: 0, y: 14 } : { opacity: 0 }}
              animate={isMotionSafe ? { opacity: 1, y: 0 } : { opacity: 1 }}
              exit={isMotionSafe ? { opacity: 0, y: 10 } : { opacity: 0 }}
              transition={isMotionSafe ? SPRING.modal : TWEEN.fast}
              className={`relative z-10 w-full ${maxWidthClass} max-h-[90svh] flex flex-col bg-white border border-line-warm rounded-lg shadow-overlay text-ink-deep overflow-hidden focus:outline-none ${className}`}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-start justify-between p-6 pb-4 border-b border-line-warm">
                  <div>
                    {title && <h2 className="text-xl sm:text-2xl font-bold font-mystic-gold">{title}</h2>}
                    {description && <div className="mt-1 text-xs sm:text-sm text-muted">{description}</div>}
                  </div>
                  {showCloseButton && (
                    <button
                      type="button"
                      onClick={onClose}
                      aria-label={isEnglish ? "Close dialog" : "ปิดหน้าต่าง"}
                      className="w-11 h-11 flex items-center justify-center rounded bg-inset-warm border border-line-warm text-muted hover:text-ink-deep hover:border-gold-ink hover:bg-[rgba(143,92,26,0.08)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6">{children}</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppMotionProvider>
  );
};
