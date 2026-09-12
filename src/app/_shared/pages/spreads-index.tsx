import type { Metadata } from "next";

import { SPREADS } from "@/data/spreads";
import { SpreadsLibrary } from "@/components/spread/SpreadsLibrary";
import { buildAlternates, localizedUrl } from "@/lib/config/site";
import { buildPageOgImage } from "@/lib/media/og-image";
import { localeHref } from "@/lib/i18n/paths";
import type { Locale } from "@/lib/i18n/types";

import { buildBreadcrumbJsonLd, buildOpenGraph, homeCrumb } from "../seo";

const PATH = "/spreads";

const COPY = {
  th: {
    title: "ดูดวงไพ่ยิปซี 25 ผัง — 1, 3, 5, 10 ใบ ครบทุกแบบ ฟรี",
    description:
      "รวมผังดูดวงไพ่ยิปซี 25 แบบ ตั้งแต่ไพ่ 1 ใบ ถึงเซลติกครอส 10 ใบ ทั้งความรัก การงาน การเงิน พร้อมภาพจัดวางจริงและความหมายทุกตำแหน่ง",
    collectionName: "คลัง 25 ผังพยากรณ์ไพ่ทาโรต์ยอดนิยม (Spreads Library)",
    collectionDescription:
      "รวบรวม 25 ผังพยากรณ์ไพ่ทาโรต์มาตรฐานสากล ความรัก การงาน การเงิน และผังใหญ่เจาะลึก 10 มิติ",
    crumb: "ผังพยากรณ์ 25 แบบ",
    directoryTitle: "สารบัญผังพยากรณ์ทั้งหมด",
    directoryLead:
      "รวมลิงก์ผังพยากรณ์ครบทั้ง 25 แบบไว้ที่เดียว กดเข้าไปอ่านความหมายรายตำแหน่งพร้อมภาพจัดวางจริงได้ทันที",
  },
  en: {
    title: "25 Tarot Spreads: 1, 3, 5 & 10-Card Layouts (Free)",
    description:
      "25 tarot spreads in one place — from a single daily card to the 10-card Celtic Cross, each with real card positions and what they mean.",
    collectionName: "The Tarot Spreads Library — 25 Classic Layouts",
    collectionDescription:
      "A library of 25 standard tarot spreads for love, career, money, and deep life readings, including the full 10-position Celtic Cross.",
    crumb: "Tarot Spreads",
    directoryTitle: "Every Spread in the Library",
    directoryLead:
      "All 25 spreads in one list — open any of them for the real card layout and what each position means.",
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
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#F3F0EA] text-[#29261F] p-4 sm:p-8 font-sans relative overflow-x-clip">
      {/* Schema.org Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(spreadsJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }} />

      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        {/* Client Interactive Library with dynamic bilingual hero header */}
        <SpreadsLibrary spreads={SPREADS} />

        {/*
          🔗 สารบัญผังฝั่งเซิร์ฟเวอร์ — ห้ามลบ (เหตุผลอยู่ตรงนี้)
          -------------------------------------------------------------------
          `SpreadsLibrary` เป็น client component ที่เปิดมาด้วยแท็บ "ยอดนิยมแนะนำ"
          ➔ HTML ที่เซิร์ฟเวอร์ส่งออกไปมีลิงก์ผังแค่ 7 จาก 25 เส้น ที่เหลือโผล่
          ต่อเมื่อผู้ใช้กดแท็บเท่านั้น

          ผลจริงที่วัดได้ (GSC 2026-09-04): ผัง 21 จาก 25 หน้าติดสถานะ
          "พบแล้ว - ยังไม่ได้จัดทำดัชนี" โดยคอลัมน์ Crawl ขึ้นว่า **ไม่เคยถูกคลานเลย**
          และมี 4 หน้าที่ไม่มีลิงก์ภายในจากหน้าไทยหน้าไหนเลยสักเส้น (กำพร้าจริง ๆ):
          `/spreads/weekly` · `/spreads/monthly` · `/spreads/monthly-ten` · `/spreads/year-ahead`

          บล็อกนี้แก้ที่ต้นเหตุ — ให้ทุกผังมีลิงก์ `<a href>` ใน HTML ดิบเสมอ
          โดยไม่แตะพฤติกรรมแท็บของ `SpreadsLibrary` เลย
        */}
        <nav
          aria-label={copy.directoryTitle}
          className="rounded-2xl border border-[#E4DED2] bg-[#FAF7F2] px-5 py-6 sm:px-7 sm:py-7"
        >
          <h2 className="text-base sm:text-lg font-serif-th font-bold text-[#29261F]">{copy.directoryTitle}</h2>
          <p className="mt-1.5 text-xs sm:text-sm text-[#635B4E] leading-relaxed">{copy.directoryLead}</p>
          <ul className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2.5">
            {SPREADS.map((spread) => (
              <li key={spread.id}>
                <a
                  href={localeHref(`/spreads/${spread.id}`, locale)}
                  className="text-xs sm:text-sm text-[#5E5240] hover:text-[#8F5C1A] underline decoration-[#E4DED2] underline-offset-4 transition-colors"
                >
                  {isEnglish ? spread.nameEn : spread.nameTh}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </main>
  );
}
