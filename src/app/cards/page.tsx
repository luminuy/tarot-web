import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { DECK } from "@/data/cards";
import { CardsExplorer } from "@/components/encyclopedia/CardsExplorer";
import { SacredNavDropdown } from "@/components/ui/SacredNavDropdown";
import { SITE_ORIGIN } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "คัมภีร์ไพ่ทาโรต์ 78 ใบ (1909 Rider-Waite-Smith) | สารานุกรมความหมายไพ่",
  description:
    "รวบรวมความหมายไพ่ทาโรต์ 78 ใบครบถ้วน ทั้ง Major Arcana และ Minor Arcana พร้อมคำแปลไทย 5 หมวด โหราศาสตร์ และธาตุ",
  alternates: {
    canonical: `${SITE_ORIGIN}/cards`,
  },
  openGraph: {
    title: "คัมภีร์ไพ่ทาโรต์ 78 ใบ (1909 Rider-Waite-Smith) | SeerTarot",
    description: "รวบรวมความหมายไพ่ทาโรต์ 78 ใบครบถ้วน พร้อมคำแปลไทย 5 มิติ โหราศาสตร์ และธาตุ",
    url: `${SITE_ORIGIN}/cards`,
    siteName: "SeerTarot",
    type: "website",
    images: [
      {
        url: "/cards/major-01.jpg",
        width: 825,
        height: 1429,
        alt: "สารานุกรมความหมายไพ่ทาโรต์ 78 ใบ 1909 Rider-Waite",
      },
    ],
  },
};

export default function CardsPage() {
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "คัมภีร์ไพ่ทาโรต์ 78 ใบ (1909 Rider-Waite-Smith)",
    description: "สารานุกรมความหมายไพ่ทาโรต์ครบ 78 ใบ ทั้ง Major Arcana และ Minor Arcana พร้อมคำแปลภาษาไทย 5 มิติ",
    url: `${SITE_ORIGIN}/cards`,
    inLanguage: "th",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: DECK.length,
      itemListElement: DECK.map((card, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `${card.nameTh} (${card.nameEn})`,
        url: `${SITE_ORIGIN}/cards/${card.id}`,
        image: `${SITE_ORIGIN}/cards/${card.image}`,
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
        name: "สารานุกรมไพ่ 78 ใบ",
        item: `${SITE_ORIGIN}/cards`,
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#F3F0EA] text-[#29261F] p-4 sm:p-8 font-sans relative overflow-hidden">
      {/* Schema.org Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
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
        <div className="text-center space-y-2.5 py-6">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-[#D5CEC2] bg-[#FFFFFF] text-xs text-[#A58A5C] font-serif-th font-bold shadow-xs">
            <span>✦</span> สารานุกรมความหมายไพ่ 78 ใบ <span>✦</span>
          </div>
          <h1 className="font-serif-th text-3xl sm:text-5xl font-bold text-[#29261F] tracking-wide">
            ความหมายไพ่ทาโรต์ทั้ง 78 ใบ
          </h1>
          <p className="text-xs sm:text-sm text-[#635B4E] max-w-xl mx-auto leading-relaxed font-serif-th">
            ดูคำแปลและความหมายของไพ่ทาโรต์ทั้ง 78 ใบ ทั้งความรัก การงาน การเงิน (แตะที่การ์ดเพื่อดูรายละเอียด)
          </p>
        </div>

        {/* Client Interactive Explorer */}
        <CardsExplorer cards={DECK} />
      </div>
    </main>
  );
}
