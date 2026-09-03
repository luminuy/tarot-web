"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-[#F0E8DB] text-[#2E211A] flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full p-8 rounded-lg bg-[#FFFFFF] border border-[#E4D8C4] shadow-[var(--shadow-overlay)] text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#F0E8DB] border border-[#E4D8C4] flex items-center justify-center text-2xl text-[#8F5C1A] font-bold ">
            ✦
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold font-serif-th text-[#2E211A]">เกิดข้อผิดพลาดชั่วคราวในการโหลดระบบ</h2>
            <p className="text-xs text-[#6F5B4A] leading-relaxed font-serif-th">
              แตะปุ่มด้านล่างเพื่อลองโหลดหน้าเว็บใหม่อีกครั้ง
            </p>
          </div>
          <button
            type="button"
            onClick={() => reset()}
            className="w-full py-3 px-4 rounded-full bg-[#8F5C1A] hover:bg-[#74490F] text-[#FFFFFF] font-bold text-sm font-serif-th active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A]"
          >
            ✦ ลองใหม่อีกครั้ง
          </button>
        </div>
      </body>
    </html>
  );
}
