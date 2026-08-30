import React from "react";
import Link from "next/link";
import { DECK } from "@/data/cards";
import { CardsExplorer } from "@/components/encyclopedia/CardsExplorer";

export const metadata = {
  title: "คัมภีร์ไพ่ทาโรต์ 78 ใบ (1909 Rider-Waite-Smith) | สารานุกรมความหมายไพ่",
  description: "รวบรวมความหมายไพ่ทาโรต์ 78 ใบครบถ้วน ทั้ง Major Arcana และ Minor Arcana พร้อมคำแปลไทย 5 หมวด โหราศาสตร์ และธาตุ",
};

export default function CardsPage() {
  return (
    <main className="min-h-screen bg-[#05040a] text-[#f5deaa] p-4 sm:p-8 font-sans selection:bg-[#ffd700]/30 selection:text-[#ffd700]">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Breadcrumb Header */}
        <div className="flex items-center justify-between border-b border-[#e5c07b]/20 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#e5c07b] hover:text-[#ffd700] transition-colors"
          >
            <span>←</span> กลับสู่วิหารพยากรณ์
          </Link>
          <span className="text-xs font-mono text-[#9c93b8]">78 Cards Sacred Encyclopedia</span>
        </div>

        {/* Hero Header */}
        <div className="text-center space-y-2 py-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#e5c07b]/30 bg-[#130d24] text-[11px] text-[#e5c07b]">
            <span>✦</span> 1909 Original Rider-Waite-Smith <span>✦</span>
          </div>
          <h1 className="font-serif-th text-2xl sm:text-4xl font-bold font-mystic-gold">
            คัมภีร์ไพ่ทาโรต์ 78 ใบ
          </h1>
          <p className="text-xs sm:text-sm text-[#9c93b8] max-w-xl mx-auto">
            สำรวจความหมายลึกซึ้ง ธาตุ สัญลักษณ์ และข้อคิดเตือนใจของไพ่ทาโรต์ทั้ง 78 ใบ (แตะที่การ์ดเพื่อดูรายละเอียดรายใบ)
          </p>
        </div>

        {/* Client Interactive Explorer */}
        <CardsExplorer cards={DECK} />
      </div>
    </main>
  );
}
