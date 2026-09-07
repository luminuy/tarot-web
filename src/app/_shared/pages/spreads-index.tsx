import type { Metadata } from "next";

import { SPREADS } from "@/data/spreads";
import { SpreadsLibrary } from "@/components/spread/SpreadsLibrary";
import { buildAlternates, localizedUrl } from "@/lib/config/site";
import { buildPageOgImage } from "@/lib/media/og-image";
import type { Locale } from "@/lib/i18n/types";

import { buildBreadcrumbJsonLd, buildOpenGraph, homeCrumb } from "../seo";

const PATH = "/spreads";

const COPY = {
  th: {
    title: "ดูดวงไพ่ยิปซี 25 ผัง — 1, 3, 5, 10 ใบ ครบทุกแบบ ฟรี",
    description:
      "รวมผังดูดวงไพ่ยิปซี ไพ่ทาโรต์ 25 แบบ ตั้งแต่ไพ่ 1 ใบ 3 ใบ 5 ใบ ถึงเซลติกครอส 10 ใบ ครบทั้งรายวัน รายเดือน ความรัก การงาน การเงิน พร้อมภาพจัดวางจริงและความหมายทุกตำแหน่ง",
    collectionName: "คลัง 25 ผังพยากรณ์ไพ่ทาโรต์ยอดนิยม (Spreads Library)",
    collectionDescription:
      "รวบรวม 25 ผังพยากรณ์ไพ่ทาโรต์มาตรฐานสากล ความรัก การงาน การเงิน และผังใหญ่เจาะลึก 10 มิติ",
    crumb: "ผังพยากรณ์ 25 แบบ",
  },
  en: {
    title: "25 Tarot Spreads: 1, 3, 5 & 10-Card Layouts (Free)",
    description:
      "Every tarot spread in one place — 25 layouts from a single daily card to the 10-card Celtic Cross, covering love, career, money, and life direction, each with the real card positions and what every position means.",
    collectionName: "The Tarot Spreads Library — 25 Classic Layouts",
    collectionDescription:
      "A library of 25 standard tarot spreads for love, career, money, and deep life readings, including the full 10-position Celtic Cross.",
    crumb: "Tarot Spreads",
  },
} as const;

export function buildSpreadsIndexMetadata(locale: Locale): Metadata {
  const copy = COPY[locale];
  const isEnglish = locale === "en";
  const ogImages = buildPageOgImage({
    title: isEnglish ? "Tarot Spreads Library: 25 Classic Layouts" : "ผังการเปิดไพ่ทาโรต์ 25 แบบ",
    eyebrow: isEnglish ? "SPREADS DIRECTORY" : "คู่มือผังพยากรณ์",
    cardImage: "major-01.jpg",
    alt: copy.title,
  });

  return {
    title: copy.title,
    description: copy.description,
    alternates: buildAlternates(PATH, { locale, englishTwin: true }),
    openGraph: buildOpenGraph(locale, { title: copy.title, description: copy.description, path: PATH, images: ogImages }),
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.description,
      images: [ogImages[0].url],
    },
  };
}

export function SpreadsIndexBody({ locale }: { locale: Locale }) {
  const copy = COPY[locale];
  const isEnglish = locale === "en";

  const spreadsJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: copy.collectionName,
    description: copy.collectionDescription,
    url: localizedUrl(PATH, locale),
    inLanguage: locale,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: SPREADS.length,
      itemListElement: SPREADS.map((spread, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: isEnglish ? spread.nameEn : spread.nameTh,
        description: isEnglish ? spread.descriptionEn : spread.description,
        url: localizedUrl(`/spreads/${spread.id}`, locale),
      })),
    },
  };

  const breadcrumbsJsonLd = buildBreadcrumbJsonLd(locale, [
    homeCrumb(locale),
    { name: copy.crumb, path: PATH },
  ]);

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
