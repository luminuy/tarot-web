import type { Metadata } from "next";

import { DECK_SUMMARY } from "@/data/cards";
import { CardsExplorer } from "@/components/encyclopedia/CardsExplorer";
import { buildAlternates, localizedUrl, SITE_ORIGIN } from "@/lib/config/site";
import type { Locale } from "@/lib/i18n/types";

import { buildBreadcrumbJsonLd, buildOpenGraph, homeCrumb } from "../seo";

const PATH = "/cards";

const COPY = {
  th: {
    title: "ความหมายไพ่ยิปซี ไพ่ทาโรต์ ครบ 78 ใบ (ชุดใหญ่ 22 + ชุดเล็ก 56)",
    description:
      "เปิดดูความหมายไพ่ยิปซี ไพ่ทาโรต์ ครบทั้ง 78 ใบ ชุดใหญ่ 22 ใบ และชุดเล็ก 56 ใบ พร้อมคำแปลไทย 5 มิติ ทั้งไพ่หัวตั้งและหัวกลับ โหราศาสตร์ ธาตุ และภาพต้นฉบับ 1909 Rider-Waite",
    collectionName: "คัมภีร์ไพ่ทาโรต์ 78 ใบ (1909 Rider-Waite-Smith)",
    collectionDescription:
      "สารานุกรมความหมายไพ่ทาโรต์ครบ 78 ใบ ทั้ง Major Arcana และ Minor Arcana พร้อมคำแปลภาษาไทย 5 มิติ",
    crumb: "สารานุกรมไพ่ 78 ใบ",
  },
  en: {
    title: "Tarot Card Meanings: All 78 Cards (22 Major + 56 Minor Arcana)",
    description:
      "Browse every one of the 78 tarot card meanings — 22 Major Arcana and 56 Minor Arcana — with upright and reversed readings across five life areas, plus astrology, element, and the original 1909 Rider-Waite artwork.",
    collectionName: "The Complete 78-Card Tarot Encyclopedia (1909 Rider-Waite-Smith)",
    collectionDescription:
      "A complete reference for all 78 tarot cards, Major and Minor Arcana alike, with upright and reversed meanings across five life areas.",
    crumb: "78-Card Encyclopedia",
  },
} as const;

export function buildCardsIndexMetadata(locale: Locale): Metadata {
  const copy = COPY[locale];
  return {
    title: copy.title,
    description: copy.description,
    alternates: buildAlternates(PATH, { locale, englishTwin: true }),
    openGraph: buildOpenGraph(locale, { title: copy.title, description: copy.description, path: PATH }),
  };
}

export function CardsIndexBody({ locale }: { locale: Locale }) {
  const copy = COPY[locale];

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: copy.collectionName,
    description: copy.collectionDescription,
    url: localizedUrl(PATH, locale),
    inLanguage: locale,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: DECK_SUMMARY.length,
      itemListElement: DECK_SUMMARY.map((card, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: locale === "en" ? card.nameEn : `${card.nameTh} (${card.nameEn})`,
        url: localizedUrl(`/cards/${card.id}`, locale),
        image: `${SITE_ORIGIN}/cards/${card.image}`,
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }} />

      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        {/* Client Interactive Explorer with dynamic bilingual hero header */}
        <CardsExplorer cards={DECK_SUMMARY} />
      </div>
    </main>
  );
}
