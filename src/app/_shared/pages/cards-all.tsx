import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RouteLink as Link } from "@/components/ui/RouteLink";

import { buildAlternates, localizedUrl } from "@/lib/config/site";
import { buildPageOgImage } from "@/lib/media/og-image";
import { localeHref } from "@/lib/i18n/paths";
import type { Locale } from "@/lib/i18n/types";

import { buildBreadcrumbJsonLd, buildOpenGraph, homeCrumb } from "../seo";
import { jsonLdScript } from "@/lib/seo/json-ld";
import { Ui2Crumbs } from "@/components/ui2/Ui2PageHero";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";

const PATH = "/cards/all";

const COPY = {
  th: {
    title: "ความหมายไพ่ยิปซี ไพ่ทาโร่ 78 ใบ ทั้งหมด ตารางเดียวจบ",
    description:
      "ตารางสรุปความหมายไพ่ยิปซี ไพ่ทาโร่ ครบ 78 ใบ ชุดใหญ่ 22 และชุดเล็ก 56 ใบ พร้อมชื่อไทย-อังกฤษ ธาตุ และคำสำคัญหัวตั้ง-กลับหัว ดูทีเดียวจบ",
    collectionName: "ตารางสรุปความหมายไพ่ยิปซี 78 ใบ ทั้งหมด ตารางเดียวจบ",
    collectionDescription:
      "คลังข้อมูลความหมายไพ่ทาโรต์ครบทั้ง 78 ใบ ทั้งชุดใหญ่และชุดเล็ก สรุปคำสำคัญหัวตั้งและหัวกลับพร้อมธาตุประจำไพ่",
    crumbCards: "คัมภีร์ไพ่ 78 ใบ",
    crumbHere: "ตารางสรุป 78 ใบ",
    badgeLeft: "ตารางสารานุกรมรวม",
    badgeRight: "ครบ 78 ใบ จบในหน้าเดียว",
    lede: "ตารางสรุปความหมายไพ่ทาโร่ (ไพ่ยิปซี) 1909 Rider-Waite-Smith ครบทั้ง 78 ใบ ประกอบด้วยไพ่ชุดใหญ่ 22 ใบ (Major Arcana) และไพ่ชุดเล็ก 56 ใบ (Minor Arcana: ไม้เท้า, ถ้วย, ดาบ, เหรียญ) พร้อมคำสำคัญหัวตั้ง คำสำคัญกลับหัว และธาตุประจำไพ่ สามารถใช้ค้นหาได้ทันที หรือกดเข้าไปอ่านบทความเจาะลึก 5 มิติของแต่ละใบ",
    chips: [
      { href: "/cards/major", label: "เจาะลึกชุดใหญ่ 22 ใบ" },
      { href: "/cards/minor", label: "เจาะลึกชุดเล็ก 56 ใบ" },
      { href: "/cards/wands", label: "ไม้เท้า (ธาตุไฟ)" },
      { href: "/cards/cups", label: "ถ้วย (ธาตุน้ำ)" },
      { href: "/cards/swords", label: "ดาบ (ธาตุลม)" },
      { href: "/cards/pentacles", label: "เหรียญ (ธาตุดิน)" },
    ],
  },
  en: {
    title: "All 78 Tarot Cards: Complete Meanings in One Table",
    description:
      "One reference table for all 78 tarot cards — 22 Major and 56 Minor Arcana — with names, elements, and upright and reversed keywords.",
    collectionName: "All 78 Tarot Card Meanings in One Table",
    collectionDescription:
      "A complete quick-reference table of all 78 tarot cards, Major and Minor Arcana, with upright and reversed keywords and each card's element.",
    crumbCards: "Tarot Card Meanings",
    crumbHere: "All 78 Cards Table",
    badgeLeft: "Complete reference table",
    badgeRight: "All 78 cards on one page",
    lede: "A single quick-reference table for the complete 1909 Rider-Waite-Smith deck: 22 Major Arcana cards and 56 Minor Arcana cards across Wands, Cups, Swords, and Pentacles. Each row shows the card's element plus its upright and reversed keywords — search the table directly, or open any card for the full five-dimension reading.",
    chips: [
      { href: "/cards/major", label: "Major Arcana (22 cards)" },
      { href: "/cards/minor", label: "Minor Arcana (56 cards)" },
      { href: "/cards/wands", label: "Wands (Fire)" },
      { href: "/cards/cups", label: "Cups (Water)" },
      { href: "/cards/swords", label: "Swords (Air)" },
      { href: "/cards/pentacles", label: "Pentacles (Earth)" },
    ],
  },
} as const;

export function buildCardsAllMetadata(locale: Locale): Metadata {
  const copy = COPY[locale];
  const isEnglish = locale === "en";
  const ogImages = buildPageOgImage({
    title: isEnglish ? "All 78 Tarot Cards Meanings" : "ความหมายไพ่ยิปซี 78 ใบ ทั้งหมด",
    eyebrow: isEnglish ? "QUICK REFERENCE TABLE" : "ตารางสรุป 78 ใบ จบในหน้าเดียว",
    cardImage: "major-00.jpg",
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

/** `table` ถูกส่งเข้ามาจากข้างนอก — เหตุผลเดียวกับ `explorer` ใน cards-index.tsx */
export function CardsAllBody({ locale, table }: { locale: Locale; table: ReactNode }) {
  const copy = COPY[locale];
  const href = (path: string) => localeHref(path, locale);

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: copy.collectionName,
    description: copy.collectionDescription,
    url: localizedUrl(PATH, locale),
    inLanguage: locale,
  };

  const breadcrumbsJsonLd = buildBreadcrumbJsonLd(locale, [
    homeCrumb(locale),
    { name: copy.crumbCards, path: "/cards" },
    { name: copy.crumbHere, path: PATH },
  ]);

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen text-ink p-4 sm:p-8 font-sans relative overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbsJsonLd) }} />

      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        {/* v2 — หัวสั้นชิดซ้าย ให้ตารางขึ้นเร็ว (v1 หัวใหญ่ + ไพ่ลอยดันตารางลงจอที่สอง) */}
        <header className="v2-ca-head">
          <Ui2Crumbs
            crumbs={[
              { label: homeCrumb(locale).name, href: "/" },
              { label: copy.crumbCards, href: "/cards" },
              { label: copy.crumbHere },
            ]}
          />
          <h1 className="v2-ca-title">
            <ThaiPhrases>{copy.title}</ThaiPhrases>
          </h1>
          <p className="v2-ca-lede">
            <ThaiPhrases>{copy.lede}</ThaiPhrases>
          </p>
          <nav className="v2-ca-chips" aria-label={copy.crumbCards}>
            {copy.chips.map((chip) => (
              <Link key={chip.href} href={href(chip.href)}>
                {chip.label}
              </Link>
            ))}
          </nav>
        </header>

        {/* Interactive Master Table — แถบสีอ่อนแบ่งจากหัวหน้าแบบหน้าแรก (`page-band`) · ห่อ div เพราะ <astro-island> เป็น display:contents */}
        <div>{table}</div>
      </div>
    </main>
  );
}
