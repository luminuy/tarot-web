import type { Metadata } from "next";
import { SPREADS } from "@/data/spreads";
import { SpreadsLibrary } from "@/components/spread/SpreadsLibrary";
import { OG_IMAGE_ALT, OG_IMAGE_URL, SITE_ORIGIN } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "ดูดวงไพ่ยิปซี 20 ผัง — 1, 3, 5, 10 ใบ ครบทุกแบบ ฟรี",
  description:
    "รวมผังดูดวงไพ่ยิปซี ไพ่ทาโรต์ 20 แบบ ตั้งแต่ไพ่ 1 ใบ 3 ใบ 5 ใบ ถึงเซลติกครอส 10 ใบ ครบทั้งรายวัน รายเดือน ความรัก การงาน การเงิน พร้อมภาพจัดวางจริงและความหมายทุกตำแหน่ง",
  alternates: {
    canonical: `${SITE_ORIGIN}/spreads`,
  },
  openGraph: {
    title: "ดูดวงไพ่ยิปซี 20 ผัง — 1, 3, 5, 10 ใบ ครบทุกแบบ ฟรี",
    description:
      "รวมผังดูดวงไพ่ยิปซี ไพ่ทาโรต์ 20 แบบ ตั้งแต่ไพ่ 1 ใบ 3 ใบ 5 ใบ ถึงเซลติกครอส 10 ใบ ครบทั้งรายวัน รายเดือน ความรัก การงาน การเงิน พร้อมภาพจัดวางจริงและความหมายทุกตำแหน่ง",
    url: `${SITE_ORIGIN}/spreads`,
    siteName: "SeerTarot",
    type: "website",
    images: [{ url: OG_IMAGE_URL, width: 1200, height: 630, alt: OG_IMAGE_ALT }],
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
        {/* Client Interactive Library with dynamic bilingual hero header */}
        <SpreadsLibrary spreads={SPREADS} />
      </div>
    </main>
  );
}
