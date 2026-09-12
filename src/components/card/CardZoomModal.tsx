"use client";

import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TarotCard as TarotCardComponent } from "@/components/card/TarotCard";
import type { TarotCard } from "@/data/cards/types";
import { useLocale } from "@/lib/i18n";
import { useDialogBehavior } from "@/lib/use-dialog-behavior";

const elementEnMap: Record<string, string> = {
  "ไฟ": "Fire",
  "น้ำ": "Water",
  "ลม": "Air",
  "ดิน": "Earth",
};

interface CardZoomModalProps {
  card: TarotCard | null;
  positionName?: string;
  isReversed?: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export const CardZoomModal: React.FC<CardZoomModalProps> = ({
  card,
  positionName,
  isReversed = false,
  isOpen,
  onClose,
}) => {
  const { isEnglish } = useLocale();
  const [flipped, setFlipped] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  /*
   * 🪟 ก่อนหน้านี้หน้าต่างนี้ประกาศ `aria-modal="true"` ไว้ทั้งที่ไม่ได้กักโฟกัสจริง
   * ปิดด้วย Esc ไม่ได้ · หน้าหลังฉากยังเลื่อนได้ · ปิดแล้วโฟกัสไม่กลับที่เดิม (UX-08)
   * นี่คือหน้าต่างที่ผู้ใช้เปิดบ่อยที่สุดในพิธีกรรมเปิดไพ่
   */
  useDialogBehavior(isOpen && Boolean(card), onClose, panelRef);

  return (
    <AnimatePresence>
      {/* ⚠️ เงื่อนไข `isOpen` ต้องอยู่ **ข้างใน** `AnimatePresence` เท่านั้น (INC-0126 · กฎข้อ 9 ของด่าน test-motion-quality)
          ถ้าเขียน `if (!isOpen) return null` ไว้ข้างบน ตัว AnimatePresence จะหายไปพร้อมลูกในเฟรมเดียวกัน
          `exit` ที่เขียนไว้ข้างล่างจึงไม่มีวันทำงาน — หน้าต่างดับหายวับแทนที่จะค่อย ๆ จางไป
          ⚠️ `card` ต้องเช็กแยกจาก `isOpen` ตรงนี้ด้วย เพราะแผงข้างในอ่านค่าจากไพ่โดยตรง
             (ตอนปิด `zoomedCard` กลายเป็น null พร้อมกัน — AnimatePresence เก็บ element เดิมไว้เล่นขาออกให้เอง) */}
      {isOpen && card && (
      <motion.div
        key="card-zoom-scrim"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        role="dialog"
        aria-modal="true"
        aria-label={isEnglish ? `Zoom card ${card.nameEn || card.nameTh}` : `ซูมดูไพ่ ${card.nameTh} (${card.nameEn})`}
        onClick={onClose}
        className="fixed inset-0 z-60 flex items-center justify-center p-4 modal-scrim cursor-zoom-out"
      >
        <motion.div
          /*
           * ⚠️ **ห้ามใส่ `scale` ให้แผงโมดัลใบใหญ่** (INC-0128 · กฎเดียวกับที่ `ui/Modal.tsx` เขียนเตือนไว้)
           * การย่อ/ขยายบังคับให้เบราว์เซอร์ raster ตัวอักษรทั้งใบใหม่ทุกเฟรม
           * บนมือถือ (CPU ช้ากว่าเดสก์ท็อปหลายเท่า) เห็นเป็นอาการ "กระพริบ/กระตุก" ตอนเปิด
           * เลื่อนขึ้น + จาง ให้ผลทางสายตาใกล้เคียงกันแต่เบากว่ามาก
           */
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          ref={panelRef}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm max-h-[calc(100svh-2rem)] rounded-lg bg-surface border-2 border-line-warm shadow-overlay flex flex-col relative cursor-default overflow-hidden"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label={isEnglish ? "Close card zoom view" : "ปิดหน้าต่างซูมไพ่"}
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-inset-warm border border-line-warm text-ink-deep hover:bg-gold-ink hover:text-surface text-sm flex items-center justify-center transition cursor-pointer z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
          >
            ✕
          </button>

          {/* ชั้นเนื้อหาที่เลื่อนได้ — ไพ่ใบใหญ่ 353–408px ทำให้แผงสูงเกินจอเตี้ยจนตกขอบ (`min-h-0` จำเป็นสำหรับ flex item) */}
          <div className="flex flex-col items-center text-center space-y-4 min-h-0 overflow-y-auto overscroll-contain p-6">

          {/* Position Name Tag */}
          {positionName && (
            <span className="text-xs text-surface font-serif-th font-bold bg-gold-ink px-3 py-1 rounded-full ">
              {positionName}
            </span>
          )}

          {/* Large 3D Tarot Card Component */}
          <div className="w-52 h-[353px] sm:w-60 sm:h-[408px] py-2 flex items-center justify-center">
            <TarotCardComponent
              card={card}
              isReversed={isReversed}
              isRevealed={flipped}
              size="lg"
              imageFull
              className="w-full h-full shadow-overlay"
            />
          </div>

          {/* Card Meta & Details */}
          <div className="space-y-1 w-full">
            <h3 className="font-serif-th text-lg sm:text-xl font-bold font-mystic-gold">
              {isEnglish ? (card.nameEn || card.nameTh) : card.nameTh}
            </h3>
            <p className="text-xs text-muted font-mono">
              {isEnglish
                ? (isReversed ? "Reversed" : "Upright")
                : `${card.nameEn} · ${isReversed ? "กลับหัว (Reversed)" : "หัวตั้ง (Upright)"}`}
            </p>

            <div className="flex items-center justify-center gap-2 pt-2 flex-wrap text-[13px]">
              <span className="px-2.5 py-0.5 rounded-full bg-surface border border-line-warm text-gold-ink font-semibold">
                {isEnglish ? `Element: ${elementEnMap[card.element] || card.element}` : `ธาตุ: ${card.element}`}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-surface border border-line-warm text-ink-deep">
                {isEnglish ? (card.astrologyEn || card.astrology) : card.astrology}
              </span>
            </div>
          </div>

          {/* Flip Toggle Button */}
          <button
            type="button"
            onClick={() => setFlipped(!flipped)}
            className="w-full py-2.5 rounded-lg bg-surface border border-line-warm text-xs font-serif-th font-semibold text-ink-deep hover:bg-inset-warm transition cursor-pointer "
          >
            {isEnglish ? "Flip Card / View Back" : "พลิกดูหน้าไพ่ / หลังไพ่"}
          </button>

          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};
