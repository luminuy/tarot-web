"use client";

import React, { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SPRING, TWEEN, useMotionSafe } from "@/lib/motion";

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
  const isMotionSafe = useMotionSafe();
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  // Focus trap & Esc listener
  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement as HTMLElement | null;

    // Body scroll lock
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab" && modalContainerRef.current) {
        const focusable = modalContainerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Initial focus on container or first interactive element
    requestAnimationFrame(() => {
      const focusable = modalContainerRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable) {
        focusable.focus();
      } else {
        modalContainerRef.current?.focus();
      }
    });

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, onClose]);

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
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={typeof title === "string" ? title : "หน้าต่างรายละเอียด"}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto overscroll-contain"
        >
          {/* Backdrop Scrim */}
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={TWEEN.fast}
            onClick={onClose}
            className="fixed inset-0 bg-[#2E211A]/50 backdrop-blur-[3px]"
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
            className={`relative z-10 w-full ${maxWidthClass} max-h-[90vh] flex flex-col bg-white border border-[#E4D8C4] rounded-2xl shadow-[var(--shadow-overlay)] text-[#2E211A] overflow-hidden focus:outline-none ${className}`}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-start justify-between p-6 pb-4 border-b border-[#E4D8C4]">
                <div>
                  {title && <h2 className="text-xl sm:text-2xl font-bold font-mystic-gold">{title}</h2>}
                  {description && <div className="mt-1 text-xs sm:text-sm text-[#6F5B4A]">{description}</div>}
                </div>
                {showCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="ปิดหน้าต่าง"
                    className="w-11 h-11 flex items-center justify-center rounded-md bg-[#F0E8DB] border border-[#E4D8C4] text-[#6F5B4A] hover:text-[#2E211A] hover:border-[#8F5C1A] hover:bg-[rgba(143,92,26,0.08)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A] cursor-pointer"
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
  );
};
