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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-[#2a1a45]/80 to-[#1b122e]/80 border border-[#e5c07b]/30 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif-th font-bold text-base text-[#f5deaa]">
              พร้อมรับคำทำนายจาก {reader.displayName} แล้วหรือยัง?
            </h3>
            {isLiveOpen && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                เปิดรับคิวสด
              </span>
            )}
          </div>
          <p className="text-xs text-[#9c93b8] mt-1 font-serif-th">
            ระบบ AI จะช่วยสรุปบรีฟคำถามและประเด็นสำคัญ เพื่อส่งต่อให้แม่หมอทันที
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#e5c07b] to-[#ffd700] text-[#120f1d] font-serif-th font-bold text-xs sm:text-sm hover:shadow-[0_0_20px_rgba(229,192,123,0.4)] transition-all shrink-0 cursor-pointer"
        >
          <span>✦ เริ่มต้นขอคำปรึกษา / จองคิว</span>
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
