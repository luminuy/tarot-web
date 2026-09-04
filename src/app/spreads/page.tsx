import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { SPREADS } from "@/data/spreads";
import { SpreadsLibrary } from "@/components/spread/SpreadsLibrary";
import { SacredNavDropdown } from "@/components/ui/SacredNavDropdown";
import { SITE_ORIGIN } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "คลัง 20 ผังพยากรณ์ไพ่ทาโรต์ยอดนิยม | Spreads Library",
  description:
    "รวบรวม 20 ผังพยากรณ์ไพ่ทาโรต์มาตรฐานสากล ความรัก การงาน การเงิน และผังใหญ่เจาะลึก 10 มิติ พร้อมภาพไดอะแกรมการจัดวางจริง",
  alternates: {
    canonical: `${SITE_ORIGIN}/spreads`,
  },
  openGraph: {
    title: "คลัง 20 ผังพยากรณ์ไพ่ทาโรต์ยอดนิยม | SeerTarot",
    description: "รวบรวม 20 ผังพยากรณ์มาตรฐานสากล ความรัก การงาน การเงิน พร้อมภาพจัดวางจริง",
    url: `${SITE_ORIGIN}/spreads`,
    siteName: "SeerTarot",
    type: "website",
    images: [
      {
        url: "/cards/major-01.jpg",
        width: 825,
        height: 1429,
        alt: "20 ผังพยากรณ์ไพ่ทาโรต์มาตรฐานสากล",
      },
    ],
  },
};

export default function SpreadsPage() {
  const spreadsJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "คลัง 20 ผังพยากรณ์ไพ่ทาโรต์ยอดนิยม (Spreads Library)",
    description: "รวบรวม 20 ผังพยากรณ์ไพ่ทาโรต์มาตรฐานสากล ความรัก การงาน การเงิน และผังใหญ่เจาะลึก 10 มิติ",
    url: `${SITE_ORIGIN}/spreads`,
    inLanguage: "th",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: SPREADS.length,
      itemListElement: SPREADS.map((spread, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: spread.nameTh,
        description: spread.description,
        url: `${SITE_ORIGIN}/spreads`,
      })),
    },
  };

  const breadcrumbsJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "หน้าแรก",
        item: SITE_ORIGIN,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "ผังพยากรณ์ 20 แบบ",
        item: `${SITE_ORIGIN}/spreads`,
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#F3F0EA] text-[#29261F] p-4 sm:p-8 font-sans relative overflow-x-clip">
      {/* Schema.org Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(spreadsJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }} />

      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        {/* Top Breadcrumbs & Dropdown */}
        <div className="flex items-center justify-between border-b border-[#D5CEC2]/40 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#29261F] hover:text-[#A58A5C] transition-colors py-2 px-4 rounded-full bg-[#FFFFFF] border border-[#D5CEC2] hover:border-[#A58A5C] font-serif-th shadow-xs"
          >
            <span>←</span> กลับหน้าดูดวงหลัก
          </Link>
          <SacredNavDropdown />
        </div>

        {/* Hero Header */}
        <div className="text-center space-y-4 sm:space-y-5 py-6 sm:py-8">
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D5CEC2] bg-[#FFFFFF] text-xs text-[#A58A5C] font-serif-th font-bold shadow-xs">
              <span>✦</span> 20 ผังการเปิดไพ่มาตรฐานสากล <span>✦</span>
            </span>
          </div>
          <h1 className="font-serif-th text-3xl sm:text-5xl font-bold text-[#29261F] tracking-wide leading-normal sm:leading-tight pt-1 [text-wrap:balance]">
            ผังการเปิดไพ่ทาโรต์ 20 รูปแบบ
          </h1>
          <p className="text-xs sm:text-sm text-[#635B4E] max-w-2xl mx-auto leading-relaxed font-serif-th [text-wrap:balance]">
            เลือกผังที่ตรงกับเรื่องที่คุณอยากรู้ พร้อมดูตัวอย่างการจัดวางและความหมายของแต่ละตำแหน่ง
          </p>
        </div>

        {/* Client Interactive Library */}
        <SpreadsLibrary spreads={SPREADS} />
      </div>
    </main>
  );
}
