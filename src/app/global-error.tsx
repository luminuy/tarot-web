"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-[#FCF0E6] text-[#5A432F] flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full p-8 rounded-[1.618rem] bg-[#FFFFFF] border border-[#D6B48D] shadow-xl text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#FCF0E6] border border-[#D6B48D] flex items-center justify-center text-2xl text-[#CD9F5B] font-bold shadow-xs">
            ✦
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold font-serif-th text-[#5A432F]">
              เกิดข้อผิดพลาดชั่วคราวในการโหลดระบบ
            </h2>
            <p className="text-xs text-[#8C735D] leading-relaxed font-serif-th">
              แตะปุ่มด้านล่างเพื่อลองโหลดหน้าเว็บใหม่อีกครั้ง
            </p>
          </div>
          <button
            type="button"
            onClick={() => reset()}
            className="w-full py-3 px-4 rounded-xl bg-[#CD9F5B] hover:bg-[#B8853E] text-[#FDF7F0] font-bold text-sm font-serif-th active:scale-95 transition-all cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CD9F5B]"
          >
            ✦ ลองใหม่อีกครั้ง
          </button>
        </div>
      </body>
    </html>
  );
}
