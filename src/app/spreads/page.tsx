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
        url: "/cards/major-01.webp",
        width: 300,
        height: 520,
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
    <main className="min-h-screen bg-[#FAF7F2] text-[#2E211A] p-4 sm:p-8 font-sans relative overflow-hidden">
      {/* Schema.org Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(spreadsJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }} />

      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        {/* Top Breadcrumbs & Dropdown */}
        <div className="flex items-center justify-between border-b border-[#D9C8AC]/30 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#2E211A] hover:text-[#8F5C1A] transition-colors py-1.5 px-3.5 rounded-lg bg-[#FFFFFF] border border-[#D9C8AC] hover:border-[#8F5C1A] font-serif-th "
          >
            <span>←</span> กลับหน้าดูดวงหลัก
          </Link>
          <SacredNavDropdown />
        </div>

        {/* Hero Header */}
        <div className="text-center space-y-2.5 py-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#D9C8AC] bg-[#FFFFFF] text-xs text-[#8F5C1A] font-serif-th font-bold">
            <span>✦</span> 20 ผังการเปิดไพ่มาตรฐานสากล <span>✦</span>
          </div>
          <h1 className="font-serif-th text-3xl sm:text-5xl font-bold font-mystic-gold tracking-wide">
            ผังการเปิดไพ่ทาโรต์ 20 รูปแบบ
          </h1>
          <p className="text-xs sm:text-sm text-[#6F5B4A] max-w-xl mx-auto leading-relaxed font-serif-th">
            เลือกผังที่ตรงกับเรื่องที่คุณอยากรู้ (แตะเพื่อดูตัวอย่างการจัดวางและความหมายแต่ละตำแหน่ง)
          </p>
        </div>

        {/* Client Interactive Library */}
        <SpreadsLibrary spreads={SPREADS} />
      </div>
    </main>
  );
}
