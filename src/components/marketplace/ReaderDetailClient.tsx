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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#FDF7F0] border border-[#D6B48D] p-6 rounded-[1.618rem] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif-th font-bold text-base text-[#5A432F]">
              พร้อมรับคำทำนายจาก {reader.displayName} แล้วหรือยัง?
            </h3>
            {isLiveOpen && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                เปิดรับคิวสด
              </span>
            )}
          </div>
          <p className="text-xs text-[#8C735D] mt-1 font-serif-th">
            ระบบ AI จะช่วยสรุปบรีฟคำถามและประเด็นสำคัญ เพื่อส่งต่อให้แม่หมอทันที
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#CD9F5B] hover:bg-[#B8853E] text-[#FDF7F0] font-serif-th font-bold text-xs sm:text-sm shadow-xs transition-all shrink-0 cursor-pointer"
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
