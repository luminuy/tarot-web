import React from "react";
import Link from "next/link";
import { listPublicApprovedReaders, type PublicReaderProfile } from "@/lib/marketplace/readers.repo";
import { ReadersDirectory } from "@/components/readers/ReadersDirectory";
import { MysticBackground } from "@/components/ui/MysticBackground";
import { SacredNavDropdown } from "@/components/ui/SacredNavDropdown";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ปรึกษาแม่หมอตัวจริง | Marketplace แม่หมอทาโรต์มืออาชีพ",
  description:
    "เลือกปรึกษาและดูดวงกับแม่หมอตัวจริงผู้เชี่ยวชาญศาสตร์ไพ่ทาโรต์ พร้อมระบบ AI ช่วยบรีฟคำถามและสรุปผังไพ่เบื้องต้น",
};

export default async function ReadersPage() {
  let readers: PublicReaderProfile[] = [];
  try {
    readers = await listPublicApprovedReaders();
  } catch (err) {
    console.error("[ReadersPage] Failed to fetch readers:", err);
  }

  return (
    <main className="min-h-screen bg-[#05040a] text-[#f5deaa] p-4 sm:p-8 font-sans selection:bg-[#ffd700]/30 selection:text-[#ffd700] relative overflow-hidden">
      {/* Floating Mystic Background Particles */}
      <MysticBackground />

      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        {/* Top Breadcrumbs & Dropdown */}
        <div className="flex items-center justify-between border-b border-[#e5c07b]/20 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#e5c07b] hover:text-[#ffd700] transition-colors py-1.5 px-3.5 rounded-2xl bg-[#130d24]/60 border border-[#e5c07b]/20 hover:border-[#e5c07b]/50 font-serif-th"
          >
            <span>←</span> กลับหน้าหลัก
          </Link>
          <SacredNavDropdown />
        </div>

        {/* Hero Header */}
        <div className="text-center space-y-2.5 py-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#e5c07b]/30 bg-[#130d24]/80 text-xs text-[#e5c07b] shadow-[0_0_15px_rgba(229,192,123,0.2)] font-serif-th">
            <span>✦</span> ตลาดรวมแม่หมอตัวจริง (Tarot Marketplace) <span>✦</span>
          </div>
          <h1 className="font-serif-th text-3xl sm:text-5xl font-bold font-mystic-gold tracking-wide">
            ปรึกษาแม่หมอตัวจริง
          </h1>
          <p className="text-xs sm:text-sm text-[#9c93b8] max-w-xl mx-auto leading-relaxed font-serif-th">
            เลือกแม่หมอที่มีความถนัดตรงกับเรื่องที่คุณต้องการคำปรึกษา พร้อมระบบ AI ช่วยสังเคราะห์บรีฟคำถามก่อนเริ่มสนทนา
          </p>
        </div>

        {/* Client Interactive Directory */}
        <ReadersDirectory initialReaders={readers} />
      </div>
    </main>
  );
}
