"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * 🪟 พฤติกรรมมาตรฐานของ "หน้าต่างลอย" ทุกบานในเว็บนี้ (UX-08)
 * ---------------------------------------------------------------------------
 * ตรวจจริงเมื่อ 2026-09-11 พบว่ามีหน้าต่างลอย 7 บาน แต่มีแค่ 2 บาน
 * (`Modal.tsx` กับ `AuthModal.tsx`) ที่ทำเรื่องพวกนี้ครบ ส่วนอีก 5 บาน
 * (`ShareModal` · `CardZoomModal` · `TarotEncyclopediaModal` · `ReadingHistoryModal`
 * · แผงยืนยันใน `QuickFortunePicker`) **ประกาศ `aria-modal="true"` ไว้ทั้งที่ไม่ได้กักโฟกัสจริง**
 * ซึ่งสำหรับ screen reader แย่กว่าไม่ประกาศเลย เพราะมันสัญญาสิ่งที่ทำไม่ได้
 *
 * โค้ดในไฟล์นี้ **ยกมาจาก `Modal.tsx` ทั้งก้อนโดยไม่เขียนใหม่** เพราะคอมเมนต์ด้านล่าง
 * บันทึกกับดักที่เคยทำให้เกิดบั๊กจริงมาแล้ว 3 อาการ — เขียนใหม่ = เสี่ยงเหยียบซ้ำ
 *
 * ⚠️ **deps ของ effect ต้องมีแค่ `isOpen` เท่านั้น** — เคยมี `onClose` อยู่ด้วยแล้วเกิด 3 อาการพร้อมกัน:
 *   1. หน้าเว็บเลื่อนไม่ได้ถาวรหลังปิดโมดัล — `originalOverflow` ถูกจับใหม่ทุกรอบ
 *      รอบที่ 2 เป็นต้นไปจับได้ค่า "hidden" cleanup ครั้งสุดท้ายจึงคืนค่า "hidden" กลับไป
 *   2. โฟกัสถูกดึงกลับไปที่ปุ่มปิดทุกครั้งที่พิมพ์ — rAF ตั้งโฟกัสใหม่ทุกรอบที่ effect รัน
 *      (ฟอร์มแก้ไขแม่หมอในแผงแอดมินพิมพ์ได้ทีละตัวอักษร)
 *   3. `previousActiveElement` ถูกเขียนทับด้วย element ที่อยู่ "ในโมดัล" คืนโฟกัสผิดที่
 *
 * เก็บ `onClose` ล่าสุดไว้ใน ref แทน เพราะผู้เรียกเกือบทุกที่ส่ง arrow function ใหม่ทุกเรนเดอร์
 * (`onClose={() => setOpen(false)}`) ถ้าใส่ไว้ใน deps → effect เปิด/ปิดใหม่ทุกครั้งที่พ่อเรนเดอร์
 *
 * ⚠️ มีด่าน CI `test-modal-lifecycle` คุมกฎ deps ข้อนี้อยู่ — อย่าแก้ให้ผ่านด้วยการปิดด่าน
 */

/** ตัวเลือกที่ถือว่า "โฟกัสได้" — ชุดเดียวกับที่ `Modal.tsx` ใช้มาแต่เดิม */
const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export interface DialogBehaviorOptions {
  /** ปิดการล็อกการเลื่อนหน้า — ใช้กับแผงที่ไม่ได้คลุมเต็มจอ */
  lockScroll?: boolean;
  /** ปิดการย้ายโฟกัสเข้าไปในหน้าต่างตอนเปิด — ใช้เมื่อผู้เรียกจัดการโฟกัสเอง */
  autoFocus?: boolean;
}

/**
 * ทำให้ element ที่ `containerRef` ชี้อยู่มีพฤติกรรมของ dialog ครบ 4 อย่าง:
 * ปิดด้วย Esc · กักโฟกัสไม่ให้หลุดไปหลังฉาก · ล็อกไม่ให้หน้าหลังเลื่อน · คืนโฟกัสให้ที่เดิมตอนปิด
 *
 * @example
 * const panelRef = useRef<HTMLDivElement>(null);
 * useDialogBehavior(isOpen, onClose, panelRef);
 */
export function useDialogBehavior(
  isOpen: boolean,
  onClose: () => void,
  containerRef: RefObject<HTMLElement | null>,
  { lockScroll = true, autoFocus = true }: DialogBehaviorOptions = {}
) {
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement as HTMLElement | null;

    const originalOverflow = document.body.style.overflow;
    if (lockScroll) document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key === "Tab" && containerRef.current) {
        const focusable =
          containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
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

    const focusRafId = autoFocus
      ? requestAnimationFrame(() => {
          const focusable =
            containerRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
          if (focusable) {
            focusable.focus();
          } else {
            containerRef.current?.focus();
          }
        })
      : 0;

    return () => {
      if (focusRafId) cancelAnimationFrame(focusRafId);
      if (lockScroll) document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
}
