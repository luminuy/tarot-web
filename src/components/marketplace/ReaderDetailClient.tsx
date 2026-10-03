"use client";

import React, { useState } from "react";
import { BookQueueModal } from "@/components/marketplace/BookQueueModal";
import type { PublicReaderProfile } from "@/lib/marketplace/readers.repo";
import { CONSULTATION_MINUTES, CONSULTATION_PRICE_THB } from "@/lib/marketplace/offer";

interface ReaderDetailClientProps {
  reader: PublicReaderProfile;
  isLiveOpen: boolean;
}

/**
 * ✦ การ์ดจองคิว (ขวาของหน้าโปรไฟล์ · มือถือขึ้นต่อจากหัวโปรไฟล์)
 * ---------------------------------------------------------------------------
 * แบบการ์ดจองของเว็บระดับโลก: ราคา · สถานะตอนนี้ · ปุ่มหลักปุ่มเดียว · สามบรรทัดคลายกังวล
 *
 * ปุ่มเดียวตามสถานะจริง (ลดความซ้ำซ้อน — เดิมให้ผู้ใช้เลือก "คิวสด / จองล่วงหน้า" เองในหน้าต่าง):
 *   - แม่หมอเปิดรับคิวอยู่ ➔ "เข้าคิวตอนนี้" (`walkup`)
 *   - ยังไม่เปิด ➔ "ฝากคิวไว้" (`booking` — เข้าคิวรอ แม่หมอเรียกจากหน้าคอนโซลเมื่อเปิดรับ)
 */
export const ReaderDetailClient: React.FC<ReaderDetailClientProps> = ({ reader, isLiveOpen }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <section
        aria-label="จองคิวปรึกษา"
        className="altar-card-porcelain !rounded-2xl space-y-5 p-5 sm:p-6"
      >
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold text-ink-deep">{CONSULTATION_PRICE_THB}</span>
          <span className="text-sm font-semibold text-ink-deep">บาท</span>
          <span className="text-sm text-muted">/ {CONSULTATION_MINUTES} นาที</span>
        </div>

        <div
          className={`flex items-start gap-2.5 rounded-xl border p-3 text-[13px] leading-relaxed ${
            isLiveOpen ? "border-ok/30 bg-ok/10" : "border-line-warm bg-inset-warm"
          }`}
        >
          <span
            aria-hidden="true"
            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${isLiveOpen ? "bg-ok animate-pulse" : "bg-muted"}`}
          />
          <p className="text-ink">
            {isLiveOpen ? (
              <>
                <strong className="font-bold text-ok">เปิดรับคิวอยู่ตอนนี้</strong> · เข้าคิวแล้วรอเรียกได้เลย
              </>
            ) : (
              <>
                <strong className="font-bold text-ink-deep">ยังไม่เปิดรับคิว</strong> · ฝากคิวไว้ได้
                แม่หมอจะเรียกเมื่อเปิดรับ
              </>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="btn-gold-glass flex min-h-[52px] w-full items-center justify-center gap-2 px-6 text-base font-bold cursor-pointer active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink focus-visible:ring-offset-2"
        >
          {isLiveOpen ? "เข้าคิวตอนนี้" : "ฝากคิวไว้"}
          <span aria-hidden="true">→</span>
        </button>

        <ul className="space-y-2 text-[13px] text-muted">
          {[
            "ไม่ต้องสมัครสมาชิก",
            "ยกเลิกคิวได้ระหว่างรอ",
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

      <BookQueueModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        readerId={reader.id}
        readerName={reader.displayName}
        readerAvatarUrl={reader.avatarUrl}
        isLiveOpen={isLiveOpen}
      />
    </>
  );
};
