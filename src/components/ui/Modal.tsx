"use client";

import React, { useEffect, useRef, useState } from "react";
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

/**
 * ✦ หน้าต่างลอยกลางของเว็บ — ขาเข้า/ขาออกทำด้วย **CSS keyframes ล้วน** ไม่ใช้ `motion`
 * ---------------------------------------------------------------------------
 * ⚠️ **ห้ามเอา `motion` กลับเข้ามาที่ไฟล์นี้เด็ดขาด** (INC-0128 · บทเรียนเดียวกับ `AuthModal`)
 *
 * เหตุผลที่วัดมาแล้วตอนรื้อหน้าต่างเข้าสู่ระบบ:
 *   1. `motion` คือ chunk 40 KB gzip ที่ต้องโหลด + คอมไพล์ให้จบก่อนหน้าต่างจะโผล่ได้สักพิกเซล
 *      บนมือถือที่ CPU ช้ากว่าเดสก์ท็อป 4–6 เท่า ช่วงนี้คือ "แตะแล้วจอนิ่งไปครู่หนึ่ง
 *      แล้วค่อยเด้งพรึ่บ" — วัดได้ว่ามีเฟรมยาว 150–182 ms คาอยู่ตรงนั้น
 *      และแม้รอบที่ chunk อยู่ในแคชแล้วก็ยังเหลือเฟรม 98–164 ms
 *   2. อนิเมชันฝั่ง JS ต้องจอง/คืนเลเยอร์ compositor เองทุกครั้ง จังหวะจอง-คืนนี่เอง
 *      ที่ผู้ใช้เห็นเป็น "แสงวาบ/กระพริบ" บนมือถือบางรุ่น · CSS keyframes ที่แตะแค่
 *      `opacity`/`transform` เบราว์เซอร์ยกให้ compositor ทำตั้งแต่ต้นจนจบ ไม่มีจังหวะสลับ
 *   3. ของแถม: ผู้เรียกทุกรายไม่ต้องห่อ `withMotionScope()` อีกต่อไป
 *      chunk ที่ต้องโหลดตอนกดจึงเหลือแค่โค้ดของหน้าต่างเอง
 *
 * ถ้าจะแก้จังหวะ ให้แก้ที่คีย์เฟรมใน `globals.css` (`.anim-scrim-*` / `.anim-modal-*`)
 * ⚠️ `CLOSE_ANIM_MS` ต้องเท่ากับความยาวของ `.anim-scrim-out` / `.anim-modal-sink` เสมอ
 *    ถ้าไม่เท่า หน้าต่างจะหายวับก่อนอนิเมชันจบ (INC-0126 ในรูปแบบใหม่)
 * ⚠️ ห้ามใส่ `scale` ให้แผง — บังคับ re-raster ตัวอักษรทั้งใบทุกเฟรม (ด่านกฎ 11 คุมอยู่)
 * ⚠️ เพดานความสูงต้องเป็น `svh` เท่านั้น ห้าม `vh`/`dvh` (ด่านกฎ 12 คุมอยู่)
 */
const CLOSE_ANIM_MS = 170;

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
  const modalContainerRef = useRef<HTMLDivElement>(null);

  /*
   * ค้างแผงไว้บนจอจนกว่าอนิเมชันขาออกจะเล่นจบ — บทบาทเดียวกับที่ `AnimatePresence`
   * เคยทำให้ ต่างกันตรงไม่ต้องลากไลบรารีมาด้วย
   */
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setIsClosing(false);
      setIsMounted(true);
      return;
    }
    if (!isMounted || closeTimerRef.current) return;
    setIsClosing(true);
    closeTimerRef.current = setTimeout(() => {
      setIsMounted(false);
      setIsClosing(false);
      closeTimerRef.current = null;
    }, CLOSE_ANIM_MS);
  }, [isOpen, isMounted]);

  useEffect(
    () => () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    },
    []
  );

  /*
   * 🪟 พฤติกรรม dialog ทั้งชุด (Esc · focus trap · scroll lock · คืนโฟกัส)
   * ย้ายไปอยู่ใน `useDialogBehavior` แล้ว เพื่อให้หน้าต่างลอยอีก 5 บานที่ไม่ได้ใช้
   * คอมโพเนนต์นี้ได้พฤติกรรมชุดเดียวกันโดยไม่ต้องคัดลอกโค้ด (UX-08)
   *
   * ⚠️ ส่ง `isOpen` ไม่ใช่ `isMounted` — การปลดล็อกการเลื่อนหน้าและคืนโฟกัสต้องเกิด
   * ตั้งแต่วินาทีที่ผู้ใช้สั่งปิด ไม่ใช่รออีก 170 ms ให้อนิเมชันขาออกเล่นจบ
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

  if (!isMounted) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === "string" ? title : isEnglish ? "Details dialog" : "หน้าต่างรายละเอียด"}
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 sm:p-6 overflow-y-auto overscroll-contain"
    >
      {/* Backdrop Scrim */}
      <div
        onClick={onClose}
        className={`fixed inset-0 modal-scrim ${isClosing ? "anim-scrim-out" : "anim-scrim-in"}`}
      />

      {/* Modal Dialog Card */}
      <div
        ref={modalContainerRef}
        tabIndex={-1}
        className={`relative z-10 w-full ${maxWidthClass} max-h-[90svh] flex flex-col bg-white border border-line-warm rounded-lg shadow-overlay text-ink-deep overflow-hidden focus:outline-none ${
          isClosing ? "anim-modal-sink" : "anim-modal-rise"
        } ${className}`}
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
      </div>
    </div>
  );
};
