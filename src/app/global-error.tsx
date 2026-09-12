"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // ของเดิมรับ `error` มาแล้วทิ้งไปเฉย ๆ — เมื่อ layout ระดับรากพัง จึงไม่เหลือร่องรอยให้ตามเลย
  // `console.error` อยู่ใน exclude ของ compiler.removeConsole จึงรอดถึง production
  useEffect(() => {
    console.error("[global-error] root layout crashed:", error, error.digest);
  }, [error]);

  return (
    <html lang="th">
      <body className="min-h-screen bg-inset-warm text-ink-deep flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full p-8 rounded-lg bg-surface border border-line-warm shadow-overlay text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-inset-warm border border-line-warm flex items-center justify-center text-2xl text-gold-ink font-bold font-mono">!</div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold font-serif-th text-ink-deep">เกิดข้อผิดพลาดชั่วคราวในการโหลดระบบ</h2>
            <p className="text-xs text-muted leading-relaxed font-serif-th">
              แตะปุ่มด้านล่างเพื่อลองโหลดหน้าเว็บใหม่อีกครั้ง
            </p>
          </div>
          <button
            type="button"
            onClick={() => reset()}
            className="w-full py-3 px-4 rounded-full bg-gold-ink hover:bg-gold-ink-deep text-surface font-bold text-sm font-serif-th active:scale-95 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </body>
    </html>
  );
}
