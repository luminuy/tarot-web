import React from "react";
import Link from "next/link";
import { SPREADS } from "@/data/spreads";
import { SpreadsLibrary } from "@/components/spread/SpreadsLibrary";

export const metadata = {
  title: "คลัง 20 ผังพยากรณ์ไพ่ทาโรต์ยอดนิยม | Spreads Library",
  description: "รวบรวม 20 ผังพยากรณ์ไพ่ทาโรต์มาตรฐานสากล ความรัก การงาน การเงิน และผังใหญ่เจาะลึก 10 มิติ พร้อมภาพไดอะแกรมการจัดวางจริง",
};

export default function SpreadsPage() {
  return (
    <main className="min-h-screen bg-[#05040a] text-[#f5deaa] p-4 sm:p-8 font-sans selection:bg-[#ffd700]/30 selection:text-[#ffd700]">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Breadcrumbs */}
        <div className="flex items-center justify-between border-b border-[#e5c07b]/20 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#e5c07b] hover:text-[#ffd700] transition-colors"
          >
            <span>←</span> กลับสู่วิหารพยากรณ์
          </Link>
          <span className="text-xs font-mono text-[#9c93b8]">20 Authentic Spreads</span>
        </div>

        {/* Hero Header */}
        <div className="text-center space-y-2 py-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#e5c07b]/30 bg-[#130d24] text-[11px] text-[#e5c07b]">
            <span>✦</span> Sacred Geometry Formations <span>✦</span>
          </div>
          <h1 className="font-serif-th text-2xl sm:text-4xl font-bold font-mystic-gold">
            คลัง 20 ผังพยากรณ์ยอดนิยม
          </h1>
          <p className="text-xs sm:text-sm text-[#9c93b8] max-w-xl mx-auto">
            เลือกผังพยากรณ์ที่ตอบโจทย์คำถามในใจของคุณ (แตะเพื่อดูไดอะแกรมการวางไพ่และความหมายแต่ละตำแหน่ง)
          </p>
        </div>

        {/* Client Interactive Library */}
        <SpreadsLibrary spreads={SPREADS} />
      </div>
    </main>
  );
}
