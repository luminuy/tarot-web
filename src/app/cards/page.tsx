import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { DECK } from "@/data/cards";
import { CardsExplorer } from "@/components/encyclopedia/CardsExplorer";
import { MysticBackground } from "@/components/ui/MysticBackground";
import { SacredNavDropdown } from "@/components/ui/SacredNavDropdown";
import { SITE_ORIGIN } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "คัมภีร์ไพ่ทาโรต์ 78 ใบ (1909 Rider-Waite-Smith) | สารานุกรมความหมายไพ่",
  description: "รวบรวมความหมายไพ่ทาโรต์ 78 ใบครบถ้วน ทั้ง Major Arcana และ Minor Arcana พร้อมคำแปลไทย 5 หมวด โหราศาสตร์ และธาตุ",
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
        url: "/cards/major-01.webp",
        width: 300,
        height: 520,
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
    <main className="min-h-screen bg-[#05040a] text-[#f5deaa] p-4 sm:p-8 font-sans selection:bg-[#ffd700]/30 selection:text-[#ffd700] relative overflow-hidden">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />

      {/* Floating Celestial Mystic Particles Background */}
      <MysticBackground />

      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        {/* Top Breadcrumbs & Dropdown */}
        <div className="flex items-center justify-between border-b border-[#e5c07b]/20 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#e5c07b] hover:text-[#ffd700] transition-colors py-1.5 px-3.5 rounded-2xl bg-[#130d24]/60 border border-[#e5c07b]/20 hover:border-[#e5c07b]/50 font-serif-th"
          >
            <span>←</span> กลับหน้าดูดวงหลัก
          </Link>
          <SacredNavDropdown />
        </div>

        {/* Hero Header */}
        <div className="text-center space-y-2.5 py-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#e5c07b]/30 bg-[#130d24]/80 text-xs text-[#e5c07b] shadow-[0_0_15px_rgba(229,192,123,0.2)] font-serif-th">
            <span>✦</span> สารานุกรมความหมายไพ่ 78 ใบ <span>✦</span>
          </div>
          <h1 className="font-serif-th text-3xl sm:text-5xl font-bold font-mystic-gold tracking-wide">
            ความหมายไพ่ทาโรต์ทั้ง 78 ใบ
          </h1>
          <p className="text-xs sm:text-sm text-[#9c93b8] max-w-xl mx-auto leading-relaxed font-serif-th">
            ดูคำแปลและความหมายของไพ่ทาโรต์ทั้ง 78 ใบ ทั้งความรัก การงาน การเงิน (แตะที่การ์ดเพื่อดูรายละเอียด)
          </p>
        </div>

        {/* Client Interactive Explorer */}
        <CardsExplorer cards={DECK} />
      </div>
    </main>
  );
}
