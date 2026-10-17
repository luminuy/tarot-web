import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";

import { PUBLIC_SPREADS } from "@/data/spreads";
import { SPREAD_TOPICS } from "@/data/spread-topics";
import { buildAlternates, localizedUrl } from "@/lib/config/site";
import { buildPageOgImage } from "@/lib/media/og-image";
import { localeHref } from "@/lib/i18n/paths";
import type { Locale } from "@/lib/i18n/types";

import { buildBreadcrumbJsonLd, buildOpenGraph, homeCrumb } from "../seo";
import { jsonLdScript } from "@/lib/seo/json-ld";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { CardImage } from "@/components/card/CardImage";
import { SPREAD_SHELVES } from "@/data/spread-shelves";
import { isStandardSpread } from "@/lib/entitlement/limits";
import { ArrowIcon } from "@/components/ui/LineIcons";

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
    premium: "ผังพิเศษ",
    topicsLead: "เลือกจากเรื่องที่อยู่ในใจ แล้วดูผังที่เหมาะกับเรื่องนั้นทั้งหมด",
    shortcutsLead: "เครื่องมืออื่นในวิหารที่ช่วยให้อ่านไพ่ได้ลึกขึ้น",
    shortcuts: [
      { href: "/spreads/create", label: "ออกแบบผังของคุณเอง", note: "เลือกจำนวนใบ แล้วตั้งความหมายแต่ละตำแหน่งเอง", card: "major-01" },
      { href: "/questions", label: "คำถามที่คนถามไพ่บ่อย", note: "คำถามยอดนิยม พร้อมผังที่เหมาะกับแต่ละคำถาม", card: "major-02" },
      { href: "/cards", label: "ความหมายไพ่ทาโรต์ 78 ใบ", note: "สารานุกรมไพ่ครบทั้งสำรับ 1909 ทุกด้านของชีวิต", card: "major-21" },
      { href: "/pick-a-card", label: "Pick a Card เลือกไพ่ตามใจ", note: "เลือกกองไพ่ตามความรู้สึก แล้วเปิดอ่านคำทำนายของกอง", card: "major-17" },
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
    premium: "Premium spread",
    topicsLead: "Start from what is on your mind and see every spread that fits it.",
    shortcutsLead: "More tools in the sanctuary for a deeper reading.",
    shortcuts: [
      { href: "/spreads/create", label: "Design your own spread", note: "Choose how many cards and name each position yourself", card: "major-01" },
      { href: "/questions", label: "Questions people ask most", note: "Popular questions, each with the spread that fits", card: "major-02" },
      { href: "/cards", label: "All 78 tarot card meanings", note: "The full 1909 deck, every area of life", card: "major-21" },
      { href: "/pick-a-card", label: "Pick a Card", note: "Choose the pile that calls to you and read its message", card: "major-17" },
    ],
  },
} as const;

/** ลิงก์ในสารบัญผัง (ผังรายตัว + หมวด) ใช้หน้าตาเดียวกัน */
const DIRECTORY_LINK_CLASS = "ui2-sp-dir-link";

/** ภาพไพ่ประจำหมวดเรื่อง (ภาพประกอบ ไม่ใช่ผลการเปิดไพ่) */
const TOPIC_CARD: Record<string, string> = {
  love: "major-06",
  career: "major-07",
  money: "pentacles-01",
  health: "major-14",
  family: "cups-10",
  study: "pentacles-08",
};

/** แยกท้าย "(ไพ่ N ใบ)" / "(N Cards)" ออกเป็นป้ายจาง — ข้อความลิงก์รวมยังเป็นชื่อเต็มเหมือนเดิม (ที่ Google เห็น) */
function splitCount(name: string): [string, string | null] {
  const m = name.match(/^(.*?)\s*(\((?:ไพ่\s*\d+\s*ใบ|\d+\s*Cards?)\))\s*$/u);
  return m ? [m[1], m[2]] : [name, null];
}

/** ป้ายเลข + คำอังกฤษเอียง แบบหัวหมวดผังด้านบน */
function SectionBadge({ n, word }: { n: string; word: string }) {
  return (
    <span className="ui2-sp-badge ui2-sp-badge-gold">
      <span className="ui2-num">{n}</span>
      <span className="ui2-accent">{word}</span>
    </span>
  );
}

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
        {/* UI 2.0: สารบัญ · แยกตามเรื่อง · ทางลัด บนพื้นกลางคืนผืนเดียวกับหมวดไพ่ (แผน UI_2_0_SPREADS หัวข้อ 3 ข้อ 5)
            รอบออกแบบเพิ่ม (เจ้าของ "ทำทั้ง 4 เลยขอสวย ๆ"): สารบัญจัด 6 กลุ่มตามหมวด · การ์ดภาพไพ่ต่อเรื่อง · กล่องทางลัดใหญ่ · ป้ายเลขแบบหมวดผัง */}
        <section className="ui2-sec ui2-night ui2-sp-dir" data-ui2-dark="">
        <nav aria-label={copy.directoryTitle} className="ui2-wrap">
          <span className="ui2-sp-rule" aria-hidden="true" />
          <div className="ui2-sp-dir-head">
            <SectionBadge n="07" word="Directory" />
            <h2 className="ui2-h2 ui2-sp-dir-h2"><ThaiPhrases>{copy.directoryTitle}</ThaiPhrases></h2>
            <p className="ui2-lede">{copy.directoryLead}</p>
          </div>
          <div className="ui2-sp-dir-groups">
            {SPREAD_SHELVES.map((shelf) => {
              const items = shelf.ids
                .map((id) => PUBLIC_SPREADS.find((s) => s.id === id))
                .filter((s): s is (typeof PUBLIC_SPREADS)[number] => !!s);
              return (
                <div
                  key={shelf.key}
                  className="ui2-sp-dir-group"
                  style={{ "--cat": `var(--ui2-note-${shelf.tone})` } as CSSProperties}
                >
                  <p className="ui2-sp-dir-group-h">
                    <span className="ui2-sp-jump-dot" aria-hidden="true" />
                    {isEnglish ? shelf.nameEn : shelf.nameTh}
                    <span className="ui2-sp-dir-group-n ui2-num">{items.length}</span>
                  </p>
                  <ul className="ui2-sp-dir-list">
                    {items.map((spread) => {
                      const [name, count] = splitCount(isEnglish ? spread.nameEn : spread.nameTh);
                      return (
                        <li key={spread.id}>
                          <a href={localeHref(`/spreads/${spread.id}`, locale)} className={DIRECTORY_LINK_CLASS}>
                            <span className="ui2-sp-dir-name">{name}</span>
                            {count && (
                              <>
                                {" "}
                                <span className="ui2-sp-dir-n">{count}</span>
                              </>
                            )}
                            {!isStandardSpread(spread.id) && (
                              <span className="ui2-sp-dir-lock" title={copy.premium} aria-hidden="true">
                                <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.7">
                                  <rect x="3.2" y="7" width="9.6" height="6.8" rx="1.6" />
                                  <path d="M5.4 7V5.2a2.6 2.6 0 0 1 5.2 0V7" strokeLinecap="round" />
                                </svg>
                              </span>
                            )}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* 🔗 หน้าหมวด `/spreads/topic/*` 6 หน้า — เดิมไม่มีลิงก์จากหน้าไหนเลย (มีแค่ใน sitemap)
              GSC 2026-09-27: 4 จาก 6 หน้าขึ้นว่า "Google ไม่รู้จัก URL" · ห้ามลบ */}
          <span className="ui2-sp-rule" aria-hidden="true" />
          <div className="ui2-sp-dir-head">
            <SectionBadge n="08" word="By topic" />
            <h2 className="ui2-h2 ui2-sp-dir-h2"><ThaiPhrases>{copy.topicsTitle}</ThaiPhrases></h2>
            <p className="ui2-lede">{copy.topicsLead}</p>
          </div>
          <ul className="ui2-sp-topics">
            {Object.values(SPREAD_TOPICS).map((topic) => (
              <li key={topic.slug}>
                <a href={localeHref(`/spreads/topic/${topic.slug}`, locale)} className="ui2-sp-topic">
                  <span className="ui2-sp-topic-art" aria-hidden="true">
                    <CardImage cardId={TOPIC_CARD[topic.slug] ?? "major-00"} alt="" thumb sizes="64px" loading="lazy" fetchPriority="low" />
                  </span>
                  <span className="ui2-sp-topic-body">
                    <span className="ui2-sp-topic-name">{isEnglish ? topic.nameEn : topic.titleTh}</span>
                    <span className="ui2-sp-topic-note">{isEnglish ? (topic.taglineEn ?? topic.tagline) : topic.tagline}</span>
                    <span className="ui2-sp-topic-n">
                      <span className="ui2-num">{topic.spreadIds.length}</span> {copy.spreadsUnit}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <span className="ui2-sp-rule" aria-hidden="true" />
          <div className="ui2-sp-dir-head">
            <SectionBadge n="09" word="Shortcuts" />
            <h2 className="ui2-h2 ui2-sp-dir-h2"><ThaiPhrases>{copy.shortcutsTitle}</ThaiPhrases></h2>
            <p className="ui2-lede">{copy.shortcutsLead}</p>
          </div>
          <ul className="ui2-sp-tiles">
            {copy.shortcuts.map((item) => (
              <li key={item.href}>
                <a href={localeHref(item.href, locale)} className="ui2-sp-tile">
                  <span className="ui2-sp-tile-art" aria-hidden="true">
                    <CardImage cardId={item.card} alt="" thumb sizes="80px" loading="lazy" fetchPriority="low" />
                  </span>
                  <span className="ui2-sp-tile-name">{item.label}</span>
                  <span className="ui2-sp-tile-note">{item.note}</span>
                  <span className="ui2-sp-tile-go" aria-hidden="true">
                    <ArrowIcon className="w-[18px] h-[18px]" />
                  </span>
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
