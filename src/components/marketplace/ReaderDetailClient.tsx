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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#FFFFFF] border border-[#D9C8AC] p-6 rounded-lg ">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif-th font-bold text-base text-[#2E211A]">
              พร้อมรับคำทำนายจาก {reader.displayName} แล้วหรือยัง?
            </h3>
            {isLiveOpen && (
              <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#3A7044] bg-[#EBF3ED] px-2 py-0.5 rounded-full border border-[#D9C8AC]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3A7044] animate-pulse" />
                เปิดรับคิวสด
              </span>
            )}
          </div>
          <p className="text-xs text-[#635B4E] mt-1 font-serif-th">
            ระบบ AI จะช่วยสรุปบรีฟคำถามและประเด็นสำคัญ เพื่อส่งต่อให้แม่หมอทันที
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#8F5C1A] hover:bg-[#74490F] text-[#FFFFFF] font-serif-th font-bold text-xs sm:text-sm transition-all shrink-0 cursor-pointer"
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
