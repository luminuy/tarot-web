import type { Metadata } from "next";
import type { ReactNode } from "react";

import { PUBLIC_SPREADS } from "@/data/spreads";
import { SPREAD_TOPICS } from "@/data/spread-topics";
import { buildAlternates, localizedUrl } from "@/lib/config/site";
import { buildPageOgImage } from "@/lib/media/og-image";
import { localeHref } from "@/lib/i18n/paths";
import type { Locale } from "@/lib/i18n/types";

import { buildBreadcrumbJsonLd, buildOpenGraph, homeCrumb } from "../seo";
import { jsonLdScript } from "@/lib/seo/json-ld";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";

const PATH = "/spreads";

const COPY = {
  th: {
    title: "ดูดวงไพ่ยิปซี 26 ผัง — 1, 3, 5, 10 ใบ ครบทุกแบบ ฟรี",
    description:
      "รวมผังดูดวงไพ่ยิปซี 26 แบบ ตั้งแต่ไพ่ 1 ใบ ถึงเซลติกครอส 10 ใบ ทั้งความรัก การงาน การเงิน พร้อมภาพจัดวางจริงและความหมายทุกตำแหน่ง",
    collectionName: "คลัง 26 ผังพยากรณ์ไพ่ทาโรต์ยอดนิยม (Spreads Library)",
    collectionDescription:
      "รวบรวม 26 ผังพยากรณ์ไพ่ทาโรต์มาตรฐานสากล ความรัก การงาน การเงิน และผังใหญ่เจาะลึก 10 มิติ",
    crumb: "ผังพยากรณ์ 26 แบบ",
    directoryTitle: "สารบัญผังพยากรณ์ทั้งหมด",
    directoryLead:
      "รวมลิงก์ผังพยากรณ์ครบทั้ง 26 แบบไว้ที่เดียว กดเข้าไปอ่านความหมายรายตำแหน่งพร้อมภาพจัดวางจริงได้ทันที",
    topicsTitle: "ดูดวงไพ่ยิปซีแยกตามเรื่อง",
    shortcutsTitle: "ทางลัด",
    spreadsUnit: "ผัง",
    shortcuts: [
      { href: "/spreads/create", label: "ออกแบบผังของคุณเอง" },
      { href: "/questions", label: "คำถามที่คนถามไพ่บ่อย" },
      { href: "/cards", label: "ความหมายไพ่ทาโรต์ 78 ใบ" },
      { href: "/pick-a-card", label: "Pick a Card เลือกไพ่ตามใจ" },
    ],
  },
  en: {
    title: "26 Tarot Spreads: 1, 3, 5 & 10-Card Layouts (Free)",
    description:
      "26 tarot spreads in one place — from a single daily card to the 10-card Celtic Cross, each with real card positions and what they mean.",
    collectionName: "The Tarot Spreads Library — 26 Classic Layouts",
    collectionDescription:
      "A library of 26 standard tarot spreads for love, career, money, and deep life readings, including the full 10-position Celtic Cross.",
    crumb: "Tarot Spreads",
    directoryTitle: "Every Spread in the Library",
    directoryLead:
      "All 26 spreads in one list — open any of them for the real card layout and what each position means.",
    topicsTitle: "Tarot Spreads by Topic",
    shortcutsTitle: "Shortcuts",
    spreadsUnit: "spreads",
    shortcuts: [
      { href: "/spreads/create", label: "Design your own spread" },
      { href: "/questions", label: "Questions people ask most" },
      { href: "/cards", label: "All 78 tarot card meanings" },
      { href: "/pick-a-card", label: "Pick a Card" },
    ],
  },
} as const;

/** ลิงก์ในสารบัญผัง (ผังรายตัว + หมวด) ใช้หน้าตาเดียวกัน */
const DIRECTORY_LINK_CLASS = "ui2-sp-dir-link";

export function buildSpreadsIndexMetadata(locale: Locale): Metadata {
  const copy = COPY[locale];
  const isEnglish = locale === "en";
  const ogImages = buildPageOgImage({
    title: isEnglish ? "Tarot Spreads Library: 26 Classic Layouts" : "ผังการเปิดไพ่ทาโรต์ 26 แบบ",
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

/** `library` = island ของคลังผัง ส่งเข้ามาจากข้างนอก (เหตุผลเดียวกับ `explorer` ใน cards-index.tsx) */
export function SpreadsIndexBody({ locale, library }: { locale: Locale; library: ReactNode }) {
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
      numberOfItems: PUBLIC_SPREADS.length,
      itemListElement: PUBLIC_SPREADS.map((spread, index) => ({
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
    <main id="main-content" tabIndex={-1} className="ui2-sp-main min-h-screen font-sans relative overflow-x-clip px-4 sm:px-8">
      {/* Schema.org Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(spreadsJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbsJsonLd) }} />

      <div className="relative z-10">
        {/* Client Interactive Library with dynamic bilingual hero header */}
        {library}

        {/*
          🔗 สารบัญผังฝั่งเซิร์ฟเวอร์ — ห้ามลบ (เหตุผลอยู่ตรงนี้)
          -------------------------------------------------------------------
          เดิม `SpreadsLibrary` เป็น client component ที่เปิดมาด้วยแท็บ "ยอดนิยมแนะนำ"
          ➔ HTML ที่เซิร์ฟเวอร์ส่งออกไปมีลิงก์ผังแค่ 7 จาก 25 เส้น ที่เหลือโผล่
          ต่อเมื่อผู้ใช้กดแท็บเท่านั้น

          📌 อัปเดต 2026-09-17 (R-02): คลังผังเลิก hydrate แล้ว การ์ดทั้ง 26 ใบถูกเรนเดอร์
          เป็น HTML ตั้งแต่ตอนบิลด์ ➔ ทุกผังมีลิงก์ในหน้าอยู่แล้วโดยไม่ต้องพึ่งบล็อกนี้
          **แต่ยังเก็บบล็อกนี้ไว้**: มันคือรายการเดียวที่ลิงก์ครบ 26 เส้นแบบไม่ขึ้นกับแท็บ
          (การ์ดที่อยู่นอกแท็บที่เปิดอยู่ถูกซ่อนด้วย `hidden` ซึ่งบอตบางตัวข้าม)

          ผลจริงที่วัดได้ (GSC 2026-09-04): ผัง 21 จาก 25 หน้าติดสถานะ
          "พบแล้ว - ยังไม่ได้จัดทำดัชนี" โดยคอลัมน์ Crawl ขึ้นว่า **ไม่เคยถูกคลานเลย**
          และมี 4 หน้าที่ไม่มีลิงก์ภายในจากหน้าไทยหน้าไหนเลยสักเส้น (กำพร้าจริง ๆ):
          `/spreads/weekly` · `/spreads/monthly` · `/spreads/monthly-ten` · `/spreads/year-ahead`

          บล็อกนี้แก้ที่ต้นเหตุ — ให้ทุกผังมีลิงก์ `<a href>` ใน HTML ดิบเสมอ
          โดยไม่แตะพฤติกรรมแท็บของ `SpreadsLibrary` เลย
        */}
        {/* UI 2.0: สารบัญอยู่บนพื้นกลางคืนผืนเดียวกับหมวดไพ่ (แผน UI_2_0_SPREADS หัวข้อ 3 ข้อ 5) */}
        <section className="ui2-sec ui2-night ui2-sp-dir" data-ui2-dark="">
        <nav aria-label={copy.directoryTitle} className="ui2-wrap">
          <h2 className="ui2-h2 ui2-sp-dir-h2"><ThaiPhrases>{copy.directoryTitle}</ThaiPhrases></h2>
          <p className="ui2-lede mt-1.5">{copy.directoryLead}</p>
          <ul className="ui2-sp-dir-list ui2-sp-dir-spreads">
            {PUBLIC_SPREADS.map((spread) => (
              <li key={spread.id}>
                <a
                  href={localeHref(`/spreads/${spread.id}`, locale)}
                  className={DIRECTORY_LINK_CLASS}
                >
                  {isEnglish ? spread.nameEn : spread.nameTh}
                </a>
              </li>
            ))}
          </ul>

          {/* 🔗 หน้าหมวด `/spreads/topic/*` 6 หน้า — เดิมไม่มีลิงก์จากหน้าไหนเลย (มีแค่ใน sitemap)
              GSC 2026-09-27: 4 จาก 6 หน้าขึ้นว่า "Google ไม่รู้จัก URL" · ห้ามลบ */}
          <h2 className="ui2-h2 ui2-sp-dir-h2 ui2-sp-dir-gap"><ThaiPhrases>{copy.topicsTitle}</ThaiPhrases></h2>
          <ul className="ui2-sp-dir-list ui2-sp-dir-topics">
            {Object.values(SPREAD_TOPICS).map((topic) => (
              <li key={topic.slug}>
                <a
                  href={localeHref(`/spreads/topic/${topic.slug}`, locale)}
                  className={`${DIRECTORY_LINK_CLASS} ui2-sp-dir-topic`}
                >
                  <span>{isEnglish ? topic.nameEn : topic.titleTh}</span>
                  <span className="ui2-sp-dir-count">
                    <span className="ui2-num">{topic.spreadIds.length}</span> {copy.spreadsUnit}
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <h2 className="ui2-h2 ui2-sp-dir-h2 ui2-sp-dir-gap"><ThaiPhrases>{copy.shortcutsTitle}</ThaiPhrases></h2>
          <ul className="ui2-sp-dir-list ui2-sp-dir-shortcuts">
            {copy.shortcuts.map((item) => (
              <li key={item.href}>
                <a href={localeHref(item.href, locale)} className="ui2-btn-ghost">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        </section>
      </div>
    </main>
  );
}
