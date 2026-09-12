"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { isEnglish } = useLocale();

  useEffect(() => {
    console.error("🚨 [Application Error Caught]:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-inset-warm text-ink-deep flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-lg bg-surface border border-line-warm shadow-overlay text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-inset-warm border border-line-warm flex items-center justify-center text-2xl text-gold-ink font-bold font-mono">!</div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold font-serif-th text-ink-deep">
            {isEnglish ? "Temporary Display Error" : "เกิดข้อผิดพลาดชั่วคราวในการแสดงผล"}
          </h2>
          <p className="text-xs text-muted leading-relaxed font-serif-th">
            {isEnglish
              ? "The sanctuary system has safely recorded this occurrence. You may retry or return to the main hall."
              : "ระบบได้บันทึกข้อผิดพลาดไว้เรียบร้อยแล้ว คุณสามารถแตะปุ่มด้านล่างเพื่อเริ่มการทำงานใหม่"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 py-3 px-4 rounded-full bg-gold-ink hover:bg-gold-ink-deep text-surface font-bold text-sm font-serif-th active:scale-95 transition cursor-pointer"
          >
            {isEnglish ? "Try Again" : "ลองใหม่อีกครั้ง"}
          </button>
          <Link
            href="/"
            className="flex-1 py-3 px-4 rounded-lg bg-inset-warm border border-line-warm text-ink-deep font-bold text-sm font-serif-th hover:bg-surface transition text-center flex items-center justify-center "
          >
            {isEnglish ? "Return to Sanctuary" : "กลับหน้าหลัก"}
          </Link>
        </div>
      </div>
    </div>
  );
}
