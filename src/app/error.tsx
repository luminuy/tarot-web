"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("🚨 [Application Error Caught]:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FCF0E6] text-[#5A432F] flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-[1.618rem] bg-[#FFFFFF] border border-[#D6B48D] shadow-xl text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#FCF0E6] border border-[#D6B48D] flex items-center justify-center text-2xl text-[#CD9F5B] font-bold shadow-xs">
          ✦
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold font-serif-th text-[#5A432F]">
            เกิดข้อผิดพลาดชั่วคราวในการแสดงผล
          </h2>
          <p className="text-xs text-[#8C735D] leading-relaxed font-serif-th">
            ระบบได้บันทึกข้อผิดพลาดไว้เรียบร้อยแล้ว คุณสามารถแตะปุ่มด้านล่างเพื่อเริ่มการทำงานใหม่
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 py-3 px-4 rounded-xl bg-[#CD9F5B] hover:bg-[#B8853E] text-[#FDF7F0] font-bold text-sm font-serif-th active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            ✦ ลองใหม่อีกครั้ง
          </button>
          <Link
            href="/"
            className="flex-1 py-3 px-4 rounded-xl bg-[#FCF0E6] border border-[#D6B48D] text-[#5A432F] font-bold text-sm font-serif-th hover:bg-[#FFFFFF] transition-all text-center flex items-center justify-center shadow-xs"
          >
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}
