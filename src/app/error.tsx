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
    <div className="min-h-screen bg-[#07070b] text-[#f8f5ee] flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-2xl bg-[#12111a] border border-[#e5c07b]/30 shadow-[0_0_50px_rgba(229,192,123,0.15)] text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#e5c07b]/10 border border-[#e5c07b]/40 flex items-center justify-center text-2xl text-[#e5c07b]">
          ✦
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-medium text-[#f8f5ee]">
            เกิดข้อผิดพลาดชั่วคราวในการแสดงผล
          </h2>
          <p className="text-xs text-[#9d9385] leading-relaxed">
            ระบบได้บันทึกข้อผิดพลาดไว้เรียบร้อยแล้ว คุณสามารถแตะปุ่มด้านล่างเพื่อเริ่มการทำงานใหม่
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#e5c07b] text-[#07070b] font-medium text-sm hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(229,192,123,0.3)] cursor-pointer"
          >
            ✦ ลองใหม่อีกครั้ง
          </button>
          <Link
            href="/"
            className="flex-1 py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-[#c8bfb0] font-medium text-sm hover:bg-white/10 hover:text-white transition-all text-center flex items-center justify-center"
          >
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}
