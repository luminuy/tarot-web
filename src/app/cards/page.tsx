import type { Metadata } from "next";
import { DECK } from "@/data/cards";
import { CardsExplorer } from "@/components/encyclopedia/CardsExplorer";
import { OG_IMAGE_ALT, OG_IMAGE_URL, SITE_ORIGIN } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "ความหมายไพ่ยิปซี ไพ่ทาโรต์ ครบ 78 ใบ (ชุดใหญ่ 22 + ชุดเล็ก 56)",
  description:
    "เปิดดูความหมายไพ่ยิปซี ไพ่ทาโรต์ ครบทั้ง 78 ใบ ชุดใหญ่ 22 ใบ และชุดเล็ก 56 ใบ พร้อมคำแปลไทย 5 มิติ ทั้งไพ่หัวตั้งและหัวกลับ โหราศาสตร์ ธาตุ และภาพต้นฉบับ 1909 Rider-Waite",
  alternates: {
    canonical: `${SITE_ORIGIN}/cards`,
  },
  openGraph: {
    title: "ความหมายไพ่ยิปซี ไพ่ทาโรต์ ครบ 78 ใบ (ชุดใหญ่ 22 + ชุดเล็ก 56)",
    description:
      "เปิดดูความหมายไพ่ยิปซี ไพ่ทาโรต์ ครบทั้ง 78 ใบ ชุดใหญ่ 22 ใบ และชุดเล็ก 56 ใบ พร้อมคำแปลไทย 5 มิติ ทั้งไพ่หัวตั้งและหัวกลับ โหราศาสตร์ ธาตุ และภาพต้นฉบับ 1909 Rider-Waite",
    url: `${SITE_ORIGIN}/cards`,
    siteName: "SeerTarot",
    type: "website",
    images: [{ url: OG_IMAGE_URL, width: 1200, height: 630, alt: OG_IMAGE_ALT }],
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
    <main className="min-h-screen bg-[#F3F0EA] text-[#29261F] p-4 sm:p-8 font-sans relative overflow-x-clip">
      {/* Schema.org Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }} />

      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        {/* Client Interactive Explorer with dynamic bilingual hero header */}
        <CardsExplorer cards={DECK} />
      </div>
    </main>
  );
}
