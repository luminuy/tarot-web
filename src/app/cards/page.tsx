import React from "react";
import Link from "next/link";
import { DECK } from "@/data/cards";
import { CardsExplorer } from "@/components/encyclopedia/CardsExplorer";
import { MysticAltarCanvas } from "@/components/ui/MysticAltarCanvas";

export const metadata = {
  title: "คัมภีร์ไพ่ทาโรต์ 78 ใบ (1909 Rider-Waite-Smith) | สารานุกรมความหมายไพ่",
  description: "รวบรวมความหมายไพ่ทาโรต์ 78 ใบครบถ้วน ทั้ง Major Arcana และ Minor Arcana พร้อมคำแปลไทย 5 หมวด โหราศาสตร์ และธาตุ",
};

export default function CardsPage() {
  return (
    <main className="min-h-screen bg-[#05040a] text-[#f5deaa] p-4 sm:p-8 font-sans selection:bg-[#ffd700]/30 selection:text-[#ffd700] relative overflow-hidden">
      {/* Floating Celestial Mystic Particles Background */}
      <MysticAltarCanvas />

      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        {/* Top Breadcrumb Header */}
        <div className="flex items-center justify-between border-b border-[#e5c07b]/20 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#e5c07b] hover:text-[#ffd700] transition-colors py-1 px-3 rounded-full bg-[#130d24]/60 border border-[#e5c07b]/20 hover:border-[#e5c07b]/50"
          >
            <span>←</span> กลับสู่วิหารพยากรณ์
          </Link>
          <span className="text-xs font-mono text-[#9c93b8]">78 Cards Sacred Encyclopedia</span>
        </div>

        {/* Hero Header */}
        <div className="text-center space-y-2.5 py-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#e5c07b]/30 bg-[#130d24]/80 text-xs text-[#e5c07b] shadow-[0_0_15px_rgba(229,192,123,0.2)]">
            <span>✦</span> 1909 Original Rider-Waite-Smith <span>✦</span>
          </div>
          <h1 className="font-serif-th text-3xl sm:text-5xl font-bold font-mystic-gold tracking-wide">
            คัมภีร์ไพ่ทาโรต์ 78 ใบ
          </h1>
          <p className="text-xs sm:text-sm text-[#9c93b8] max-w-xl mx-auto leading-relaxed">
            สำรวจความหมายลึกซึ้ง ธาตุ สัญลักษณ์ และข้อคิดเตือนใจของไพ่ทาโรต์ทั้ง 78 ใบ (แตะที่การ์ดเพื่อดูรายละเอียดรายใบ)
          </p>
        </div>

        {/* Client Interactive Explorer */}
        <CardsExplorer cards={DECK} />
      </div>
    </main>
  );
}
