"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("🚨 [Application Error Caught]:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F3EDE2] text-[#2E211A] flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-lg bg-[#FFFFFF] border border-[#D9C8AC] shadow-[var(--shadow-overlay)] text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#F3EDE2] border border-[#D9C8AC] flex items-center justify-center text-2xl text-[#8F5C1A] font-bold ">
          ✦
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold font-serif-th text-[#2E211A]">เกิดข้อผิดพลาดชั่วคราวในการแสดงผล</h2>
          <p className="text-xs text-[#6F5B4A] leading-relaxed font-serif-th">
            ระบบได้บันทึกข้อผิดพลาดไว้เรียบร้อยแล้ว คุณสามารถแตะปุ่มด้านล่างเพื่อเริ่มการทำงานใหม่
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 py-3 px-4 rounded-full bg-[#8F5C1A] hover:bg-[#74490F] text-[#FFFFFF] font-bold text-sm font-serif-th active:scale-95 transition-all cursor-pointer"
          >
            ✦ ลองใหม่อีกครั้ง
          </button>
          <Link
            href="/"
            className="flex-1 py-3 px-4 rounded-lg bg-[#F3EDE2] border border-[#D9C8AC] text-[#2E211A] font-bold text-sm font-serif-th hover:bg-[#FFFFFF] transition-all text-center flex items-center justify-center "
          >
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}
