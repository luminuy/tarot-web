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
            className="fixed inset-0 bg-[#05040a]/85 backdrop-blur-md"
          />

          {/* Modal Dialog Card */}
          <motion.div
            key="modal-content"
            ref={modalContainerRef}
            tabIndex={-1}
            initial={isMotionSafe ? { opacity: 0, scale: 0.95, y: 16 } : { opacity: 0 }}
            animate={isMotionSafe ? { opacity: 1, scale: 1, y: 0 } : { opacity: 1 }}
            exit={isMotionSafe ? { opacity: 0, scale: 0.96, y: 12 } : { opacity: 0 }}
            transition={isMotionSafe ? SPRING.modal : TWEEN.fast}
            className={`relative z-10 w-full ${maxWidthClass} max-h-[90vh] flex flex-col bg-gradient-to-b from-[#191230]/95 via-[#100b20]/98 to-[#0a0714] border border-[#e5c07b]/30 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] backdrop-blur-xl overflow-hidden focus:outline-none ${className}`}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-start justify-between p-6 pb-4 border-b border-[#e5c07b]/15">
                <div>
                  {title && <h2 className="text-xl sm:text-2xl font-bold font-mystic-gold">{title}</h2>}
                  {description && <div className="mt-1 text-xs sm:text-sm text-[#9c93b8]">{description}</div>}
                </div>
                {showCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="ปิดหน้าต่าง"
                    className="w-11 h-11 flex items-center justify-center rounded-2xl bg-[#100b20]/80 border border-[#e5c07b]/20 text-[#9c93b8] hover:text-[#ffd700] hover:border-[#ffd700]/50 hover:bg-[#191230] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd700] cursor-pointer"
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
