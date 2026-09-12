"use client";

import React, { useState } from "react";
import { BookQueueModal } from "@/components/marketplace/BookQueueModal";
import type { PublicReaderProfile } from "@/lib/marketplace/readers.repo";

interface ReaderDetailClientProps {
  reader: PublicReaderProfile;
  isLiveOpen: boolean;
}

export const ReaderDetailClient: React.FC<ReaderDetailClientProps> = ({ reader, isLiveOpen }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface border border-line-warm p-6 rounded-lg ">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif-th font-bold text-base text-ink-deep">
              พร้อมรับคำทำนายจาก {reader.displayName} แล้วหรือยัง?
            </h3>
            {isLiveOpen && (
              <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-ok bg-[#EBF3ED] px-2 py-0.5 rounded-full border border-line-warm">
                <span className="h-1.5 w-1.5 rounded-full bg-ok animate-pulse" />
                เปิดรับคิวสด
              </span>
            )}
          </div>
          <p className="text-xs text-muted mt-1 font-serif-th">
            ระบบ AI จะช่วยสรุปบรีฟคำถามและประเด็นสำคัญ เพื่อส่งต่อให้แม่หมอทันที
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gold-ink hover:bg-gold-ink-deep text-surface font-serif-th font-bold text-xs sm:text-sm transition shrink-0 cursor-pointer"
        >
          <span>เริ่มต้นขอคำปรึกษา / จองคิว</span>
          <span>→</span>
        </button>
      </div>

      <BookQueueModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        readerId={reader.id}
        readerName={reader.displayName}
        isLiveOpen={isLiveOpen}
      />
    </>
  );
};
