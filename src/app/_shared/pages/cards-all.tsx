import type { Metadata } from "next";
import Link from "next/link";

import { CARD_SUMMARIES } from "@/data/cards/summary";
import { AllCardsTable } from "@/components/encyclopedia/AllCardsTable";
import { buildAlternates, localizedUrl } from "@/lib/config/site";
import { localeHref } from "@/lib/i18n/paths";
import type { Locale } from "@/lib/i18n/types";

import { buildBreadcrumbJsonLd, buildOpenGraph, homeCrumb } from "../seo";

const PATH = "/cards/all";

const COPY = {
  th: {
    title: "ความหมายไพ่ยิปซี 78 ใบ ทั้งหมด สรุปครบทุกใบ ตารางเดียวจบ",
    description:
      "ตารางสรุปความหมายไพ่ยิปซี ไพ่ทาโรต์ ครบทั้ง 78 ใบ ทั้งชุดใหญ่ 22 ใบ และชุดเล็ก 56 ใบ 4 ดอก พร้อมชื่อไทย-อังกฤษ ธาตุ และคำสำคัญหัวตั้ง-กลับหัว ดูทีเดียวจบ 1909 Rider-Waite",
    collectionName: "ตารางสรุปความหมายไพ่ยิปซี 78 ใบ ทั้งหมด ตารางเดียวจบ",
    collectionDescription:
      "คลังข้อมูลความหมายไพ่ทาโรต์ครบทั้ง 78 ใบ ทั้งชุดใหญ่และชุดเล็ก สรุปคำสำคัญหัวตั้งและหัวกลับพร้อมธาตุประจำไพ่",
    crumbCards: "คัมภีร์ไพ่ 78 ใบ",
    crumbHere: "ตารางสรุป 78 ใบ",
    badgeLeft: "ตารางสารานุกรมรวม",
    badgeRight: "ครบ 78 ใบ จบในหน้าเดียว",
    lede: "ตารางสรุปความหมายไพ่ทาโรต์ 1909 Rider-Waite-Smith ครบทั้ง 78 ใบ ประกอบด้วยไพ่ชุดใหญ่ 22 ใบ (Major Arcana) และไพ่ชุดเล็ก 56 ใบ (Minor Arcana: ไม้เท้า, ถ้วย, ดาบ, เหรียญ) พร้อมคำสำคัญหัวตั้ง คำสำคัญกลับหัว และธาตุประจำไพ่ สามารถใช้ค้นหาได้ทันที หรือกดเข้าไปอ่านบทความเจาะลึก 5 มิติของแต่ละใบ",
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
      "A single reference table for all 78 tarot cards — 22 Major Arcana and 56 Minor Arcana across the four suits — with English and Thai names, elements, and upright and reversed keywords. Original 1909 Rider-Waite.",
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
  return {
    title: copy.title,
    description: copy.description,
    alternates: buildAlternates(PATH, { locale, englishTwin: true }),
    openGraph: buildOpenGraph(locale, { title: copy.title, description: copy.description, path: PATH }),
  };
}

export function CardsAllBody({ locale }: { locale: Locale }) {
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
    <main className="min-h-screen bg-[#F3F0EA] text-[#29261F] p-4 sm:p-8 font-sans relative overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }} />

      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        {/* Breadcrumb Bar */}
        <nav aria-label="Breadcrumb" className="text-xs font-serif-th text-[#635B4E]">
          <ol className="flex items-center gap-1.5 flex-wrap">
            <li>
              <Link href={href("/")} className="hover:text-[#8F5C1A] transition-colors">
                {homeCrumb(locale).name}
              </Link>
            </li>
            <li aria-hidden="true" className="text-[#A58A5C]">/</li>
            <li>
              <Link href={href("/cards")} className="hover:text-[#8F5C1A] transition-colors">
                {copy.crumbCards}
              </Link>
            </li>
            <li aria-hidden="true" className="text-[#A58A5C]">/</li>
            <li aria-current="page" className="font-bold text-[#29261F]">
              {copy.crumbHere}
            </li>
          </ol>
        </nav>

        {/* Hero Header */}
        <header className="rounded-2xl border border-[#D5CEC2] bg-[#FFFFFF] p-6 sm:p-8 shadow-xs space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#A58A5C]/40 bg-[#FAF7F2] text-[#8F5C1A] text-xs font-serif-th font-bold">
            <span>{copy.badgeLeft}</span>
            <span className="w-1 h-1 rounded-full bg-[#A58A5C]" />
            <span>{copy.badgeRight}</span>
          </div>

          <h1 className="font-serif-th text-2xl sm:text-3xl font-bold text-[#29261F]">{copy.title}</h1>

          <p className="font-serif-th text-xs sm:text-sm text-[#635B4E] leading-relaxed max-w-3xl">{copy.lede}</p>

          <div className="pt-2 flex flex-wrap gap-2 text-xs font-serif-th">
            {copy.chips.map((chip) => (
              <Link
                key={chip.href}
                href={href(chip.href)}
                className="px-3 py-1 rounded-lg border border-[#D5CEC2] bg-[#FAF7F2] hover:bg-[#FFFFFF] text-[#29261F]"
              >
                {chip.label}
              </Link>
            ))}
          </div>
        </header>

        {/* Interactive Master Table */}
        <AllCardsTable cards={CARD_SUMMARIES} />
      </div>
    </main>
  );
}
