import React from "react";
import Link from "next/link";
import { listPublicApprovedReaders, type PublicReaderProfile } from "@/lib/marketplace/readers.repo";
import { ReadersDirectory } from "@/components/readers/ReadersDirectory";
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
    <main className="min-h-screen bg-[#F6F1E9] text-[#2E211A] p-4 sm:p-8 font-sans relative overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        {/* Top Breadcrumbs & Dropdown */}
        <div className="flex items-center justify-between border-b border-[#E4D8C4]/40 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#2E211A] hover:text-[#8F5C1A] transition-colors py-1.5 px-3.5 rounded-lg bg-[#FFFFFF] border border-[#E4D8C4] hover:border-[#8F5C1A] font-serif-th"
          >
            <span>←</span> กลับหน้าหลัก
          </Link>
          <SacredNavDropdown />
        </div>

        {/* Hero Header */}
        <div className="text-center space-y-2.5 py-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#E4D8C4] bg-[#FFFFFF] text-xs text-[#8F5C1A] font-bold font-serif-th">
            <span>✦</span> ตลาดรวมแม่หมอตัวจริง (Tarot Marketplace) <span>✦</span>
          </div>
          <h1 className="font-serif-th text-3xl sm:text-5xl font-bold font-mystic-gold tracking-wide">
            ปรึกษาแม่หมอตัวจริง
          </h1>
          <p className="text-xs sm:text-sm text-[#6F5B4A] max-w-xl mx-auto leading-relaxed font-serif-th">
            เลือกแม่หมอที่มีความถนัดตรงกับเรื่องที่คุณต้องการคำปรึกษา พร้อมระบบ AI ช่วยสังเคราะห์บรีฟคำถามก่อนเริ่มสนทนา
          </p>
        </div>

        {/* Client Interactive Directory */}
        <ReadersDirectory initialReaders={readers} />
      </div>
    </main>
  );
}
