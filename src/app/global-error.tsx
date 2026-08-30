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
      <body className="min-h-screen bg-[#07070b] text-[#f8f5ee] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#12111a] border border-[#e5c07b]/30 shadow-[0_0_50px_rgba(229,192,123,0.15)] text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#e5c07b]/10 border border-[#e5c07b]/40 flex items-center justify-center text-2xl text-[#e5c07b]">
            ✦
          </div>
          <h2 className="text-xl font-medium text-[#f8f5ee]">
            ระบบกำลังรีเฟรช กรุณารอสักครู่
          </h2>
          <button
            onClick={() => reset()}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#e5c07b] text-[#07070b] font-medium text-sm hover:brightness-110 transition-all cursor-pointer"
          >
            ✦ รีเฟรชหน้าเว็บ
          </button>
        </div>
      </body>
    </html>
  );
}
