"use client";

import React, { useState } from "react";
import { BookQueueModal, type BookingMode } from "@/components/marketplace/BookQueueModal";
import type { PublicReaderProfile } from "@/lib/marketplace/readers.repo";
import { CONSULTATION_MINUTES, CONSULTATION_PRICE_THB } from "@/lib/marketplace/offer";
import { FREE_CANCEL_HOURS, formatTime, relativeDayLabel } from "@/lib/marketplace/booking-policy";

interface ReaderDetailClientProps {
  reader: PublicReaderProfile;
  isLiveOpen: boolean;
  /** เวลาว่างใกล้สุด (ms) — null = ยังไม่เปิดตารางนัด หรือเต็มทุกช่องใน 14 วัน */
  nextSlot: number | null;
  /** เวลาฝั่งเซิร์ฟเวอร์ตอน render — ใช้คำนวณ "วันนี้/พรุ่งนี้" ให้ HTML ตรงกันทั้งสองฝั่ง */
  nowMs: number;
}

/**
 * ✦ การ์ดจองคิว (ขวาของหน้าโปรไฟล์ · มือถือขึ้นต่อจากหัวโปรไฟล์)
 * ---------------------------------------------------------------------------
 * แบบการ์ดจองของเว็บระดับโลก: ราคา · สถานะตอนนี้ + เวลาว่างใกล้สุด · ปุ่มตามทางที่เปิดอยู่จริง · บรรทัดคลายกังวล
 *
 *   เปิดคิวสด + มีตาราง ➔ "คุยตอนนี้" (หลัก) + "นัดเวลาล่วงหน้า" (รอง)
 *   คิวสดอย่างเดียว     ➔ "เข้าคิวตอนนี้"
 *   ตารางอย่างเดียว     ➔ "เลือกเวลานัด"
 *   ไม่เปิดทั้งสองทาง   ➔ ไม่มีปุ่ม (บอกตรง ๆ ว่ายังไม่เปิดรับ ไม่ให้กดแล้วไปเจอทางตัน)
 */
export const ReaderDetailClient: React.FC<ReaderDetailClientProps> = ({ reader, isLiveOpen, nextSlot, nowMs }) => {
  const [openMode, setOpenMode] = useState<BookingMode | null>(null);
  const hasSchedule = nextSlot !== null;
  const nextLabel = nextSlot ? `${relativeDayLabel(nextSlot, nowMs)} ${formatTime(nextSlot)} น.` : null;

  const primaryClass =
    "btn-gold-glass flex min-h-[52px] w-full items-center justify-center gap-2 px-6 text-base font-bold cursor-pointer active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink focus-visible:ring-offset-2";
  const secondaryClass =
    "flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-line-interactive-warm bg-surface px-6 text-sm font-bold text-ink-deep transition-colors cursor-pointer hover:border-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink focus-visible:ring-offset-2";

  return (
    <>
      <section aria-label="จองคิวปรึกษา" className="altar-card-porcelain !rounded-2xl space-y-5 p-5 sm:p-6">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold text-ink-deep">{CONSULTATION_PRICE_THB}</span>
          <span className="text-sm font-semibold text-ink-deep">บาท</span>
          <span className="text-sm text-muted">/ {CONSULTATION_MINUTES} นาที</span>
        </div>

        <ul className="divide-y divide-line-warm/70 rounded-xl border border-line-warm text-[13px] leading-relaxed">
          <li className="flex items-start gap-2.5 p-3">
            <span
              aria-hidden="true"
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${isLiveOpen ? "bg-ok animate-pulse" : "bg-muted"}`}
            />
            <p className="text-ink">
              {isLiveOpen ? (
                <>
                  <strong className="font-bold text-ok">เปิดรับคิวสดอยู่</strong> · เข้าคิวแล้วรอเรียกได้เลย
                </>
              ) : (
                <>
                  <strong className="font-bold text-ink-deep">ตอนนี้ไม่ได้เปิดคิวสด</strong>
                </>
              )}
            </p>
          </li>
          <li className="flex items-start gap-2.5 p-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-4 w-4 shrink-0 text-gold-ink" aria-hidden="true">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M16 3v4M8 3v4M3 10h18" />
            </svg>
            <p className="text-ink">
              {nextLabel ? (
                <>
                  นัดล่วงหน้าได้ · ว่างใกล้สุด <strong className="font-bold text-ink-deep">{nextLabel}</strong>
                </>
              ) : (
                <span className="text-muted">ยังไม่เปิดตารางนัดล่วงหน้า</span>
              )}
            </p>
          </li>
        </ul>

        {isLiveOpen || hasSchedule ? (
          <div className="space-y-2.5">
            {isLiveOpen && (
              <button type="button" onClick={() => setOpenMode("walkup")} className={primaryClass}>
                {hasSchedule ? "คุยตอนนี้" : "เข้าคิวตอนนี้"}
                <span aria-hidden="true">→</span>
              </button>
            )}
            {hasSchedule && (
              <button
                type="button"
                onClick={() => setOpenMode("booking")}
                className={isLiveOpen ? secondaryClass : primaryClass}
              >
                {isLiveOpen ? "นัดเวลาล่วงหน้า" : "เลือกเวลานัด"}
                {!isLiveOpen && <span aria-hidden="true">→</span>}
              </button>
            )}
          </div>
        ) : (
          <p className="rounded-xl bg-inset-warm p-3.5 text-center text-[13px] leading-relaxed text-muted">
            แม่หมอยังไม่เปิดรับคิวและนัดในตอนนี้ ลองกลับมาใหม่ หรือดูแม่หมอท่านอื่น
          </p>
        )}

        <ul className="space-y-2 text-[13px] text-muted">
          {[
            `ยกเลิกก่อนนัด ${FREE_CANCEL_HOURS} ชม. คืนเงินเต็มจำนวน`,
            "ชำระก่อนคุย ผ่าน Stripe · บัตรหรือพร้อมเพย์",
            "คุยผ่านวิดีโอคอลในเว็บ หรือ LINE",
          ].map((line) => (
            <li key={line} className="flex items-center gap-2">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 shrink-0 text-ok"
                aria-hidden="true"
              >
                <path d="m5 12.5 4.5 4.5L19 7.5" />
              </svg>
              {line}
            </li>
          ))}
        </ul>
      </section>

      {openMode && (
        <BookQueueModal
          key={openMode}
          isOpen
          onClose={() => setOpenMode(null)}
          readerId={reader.id}
          readerName={reader.displayName}
          readerAvatarUrl={reader.avatarUrl}
          isLiveOpen={isLiveOpen}
          hasSchedule={hasSchedule}
          initialMode={openMode}
        />
      )}
    </>
  );
};
