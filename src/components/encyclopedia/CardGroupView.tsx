"use client";

import React from "react";
// ลิงก์ภายในต้องอยู่ในต้นไม้ภาษาเดียวกับหน้าที่ผู้ใช้ยืนอยู่ — ดู src/components/ui/LocaleLink.tsx
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import type { CardSummary } from "@/data/cards/summary";
import type { CardGroupInfo } from "@/data/cards/group-seo";
import { useLocale } from "@/lib/i18n";
import { localizedUrl, SITE_ORIGIN } from "@/lib/config/site";
import { jsonLdScript } from "@/lib/seo/json-ld";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { Ui2PageHero } from "@/components/ui2/Ui2PageHero";
import { Ui2Showcase, type Ui2ShowcaseSection } from "@/components/ui2/Ui2Showcase";
import { CardTile } from "@/components/encyclopedia/CardTile";

interface CardGroupViewProps {
  groupInfo: CardGroupInfo;
  cards: readonly CardSummary[];
}

/** สลับไปหมวดอื่น (ชิปใต้หัวหน้า) */
const NAV_TABS = [
  { id: "all", href: "/cards", labelTh: "ไพ่ทั้งหมด", labelEn: "All 78", n: 78 },
  { id: "major", href: "/cards/major", labelTh: "ชุดใหญ่", labelEn: "Major", n: 22 },
  { id: "minor", href: "/cards/minor", labelTh: "ชุดเล็ก", labelEn: "Minor", n: 56 },
  { id: "wands", href: "/cards/wands", labelTh: "ไม้เท้า", labelEn: "Wands", n: 14 },
  { id: "cups", href: "/cards/cups", labelTh: "ถ้วย", labelEn: "Cups", n: 14 },
  { id: "swords", href: "/cards/swords", labelTh: "ดาบ", labelEn: "Swords", n: 14 },
  { id: "pentacles", href: "/cards/pentacles", labelTh: "เหรียญ", labelEn: "Pentacles", n: 14 },
  { id: "table", href: "/cards/all", labelTh: "ตารางสรุป", labelEn: "Summary table", n: 0 },
];

/** สีหมวด (ชุดเดียวกับหน้า /cards) */
const SUIT_TONE: Record<string, Ui2ShowcaseSection["tone"]> = { major: 4, wands: 3, cups: 2, swords: 7, pentacles: 1 };
const SUIT_NAME: Record<string, { th: string; en: string; kicker: string; kickerTh: string }> = {
  wands: { th: "ไม้เท้า", en: "Wands", kicker: "Wands · Fire", kickerTh: "ไม้เท้า · ธาตุไฟ" },
  cups: { th: "ถ้วย", en: "Cups", kicker: "Cups · Water", kickerTh: "ถ้วย · ธาตุน้ำ" },
  swords: { th: "ดาบ", en: "Swords", kicker: "Swords · Air", kickerTh: "ดาบ · ธาตุลม" },
  pentacles: { th: "เหรียญ", en: "Pentacles", kicker: "Pentacles · Earth", kickerTh: "เหรียญ · ธาตุดิน" },
};

interface Chapter {
  id: string;
  kicker: string;
  /** หัวเล็กบนหน้าไทย (หน้าไทยไม่ใช้หัวเล็กภาษาอังกฤษ · เจ้าของ 2026-10-21) */
  kickerTh: string;
  th: string;
  en: string;
  leadTh: string;
  leadEn: string;
  tone: Ui2ShowcaseSection["tone"];
  cards: readonly CardSummary[];
}

/**
 * แบ่งไพ่ของหมวดเป็นบท (หน้าต่างโชว์เคส · เจ้าของ 2026-10-17 "ทำแบบหน้าแรกกับหน้าผัง")
 * ชุดใหญ่ = การเดินทางของคนเขลา 3 องก์ · ชุดเล็ก = 4 ชุด · ชุดเดียว = ไพ่ตัวเลข + ไพ่ราชสำนัก
 */
function chaptersOf(groupId: CardGroupInfo["id"], cards: readonly CardSummary[]): Chapter[] {
  if (groupId === "major") {
    const act = (from: number, to: number) => cards.filter((c) => c.number >= from && c.number <= to);
    return [
      { id: "act-1", kicker: "The Fool's Journey · I", kickerTh: "การเดินทางของคนเขลา 1", th: "องก์ 1 ก้าวออกสู่โลก", en: "Act I · Into the world", leadTh: "ไพ่ 0–7 คนเขลาเรียนรู้จากโลกภายนอก ครู พ่อแม่ ความรัก และชัยชนะแรก", leadEn: "Cards 0–7: the Fool learns from the outer world, teachers, family, love and a first victory", tone: 4, cards: act(0, 7) },
      { id: "act-2", kicker: "The Fool's Journey · II", kickerTh: "การเดินทางของคนเขลา 2", th: "องก์ 2 หันกลับมามองข้างใน", en: "Act II · Looking within", leadTh: "ไพ่ 8–14 แรงใจ ความเงียบ โชคชะตา และการปล่อยวาง", leadEn: "Cards 8–14: inner strength, solitude, fate and letting go", tone: 2, cards: act(8, 14) },
      { id: "act-3", kicker: "The Fool's Journey · III", kickerTh: "การเดินทางของคนเขลา 3", th: "องก์ 3 สู่ความสมบูรณ์", en: "Act III · Toward wholeness", leadTh: "ไพ่ 15–21 เงามืด การพังทลาย ความหวัง และโลกที่ครบรอบ", leadEn: "Cards 15–21: shadow, upheaval, hope and the completed world", tone: 5, cards: act(15, 21) },
    ];
  }
  if (groupId === "minor") {
    return (["wands", "cups", "swords", "pentacles"] as const).map((suit) => ({
      id: `suit-${suit}`,
      kicker: SUIT_NAME[suit].kicker,
      kickerTh: SUIT_NAME[suit].kickerTh,
      th: SUIT_NAME[suit].th,
      en: SUIT_NAME[suit].en,
      leadTh: "ไพ่ตัวเลข 1–10 และไพ่ราชสำนัก 4 ใบ",
      leadEn: "Ace to Ten, plus four court cards",
      tone: SUIT_TONE[suit],
      cards: cards.filter((c) => c.suit === suit),
    }));
  }
  const tone = SUIT_TONE[groupId] ?? 4;
  return [
    { id: "pips", kicker: "Ace to Ten", kickerTh: "ไพ่ตัวเลข", th: "ไพ่ตัวเลข 1–10", en: "Ace to Ten", leadTh: "เรื่องราวของธาตุนี้ตั้งแต่เมล็ดแรกจนถึงจุดสุดทาง", leadEn: "The story of this element from the first seed to its fullest", tone, cards: cards.filter((c) => c.number <= 10) },
    { id: "court", kicker: "Court Cards", kickerTh: "ไพ่ราชสำนัก", th: "ไพ่ราชสำนัก", en: "Court cards", leadTh: "เด็กรับใช้ อัศวิน ราชินี และราชา บุคลิกของคนหรือท่าทีของเรา", leadEn: "Page, Knight, Queen and King: people, or the stance you take", tone: 6, cards: cards.filter((c) => c.number > 10) },
  ];
}

export const CardGroupView: React.FC<CardGroupViewProps> = ({ groupInfo, cards }) => {
  const { isEnglish } = useLocale();
  const intro = isEnglish ? groupInfo.introContentEn : groupInfo.introContentTh;
  // ⚠️ URL ใน JSON-LD ต้องตรงภาษาของหน้า (A6-07) — เดิมหน้าอังกฤษ 6 หน้าชี้ URL ไทยทั้งหมด
  //    (url ≠ canonical · breadcrumb ใน SERP อังกฤษพาไปหน้าไทย) · ภาพไพ่ไม่มีภาษา ใช้ SITE_ORIGIN ได้
  const locale = isEnglish ? "en" : "th";
  const currentUrl = localizedUrl(`/cards/${groupInfo.id}`, locale);

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: isEnglish ? groupInfo.nameEn : groupInfo.seoTitleTh,
    description: isEnglish ? groupInfo.heroTaglineEn : groupInfo.descriptionTh,
    url: currentUrl,
    inLanguage: isEnglish ? "en" : "th",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: cards.length,
      itemListElement: cards.map((card, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: isEnglish ? card.nameEn : `${card.nameTh} (${card.nameEn})`,
        url: localizedUrl(`/cards/${card.id}`, locale),
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
        name: isEnglish ? "Home" : "หน้าแรก",
        item: localizedUrl("/", locale),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: isEnglish ? "Tarot Encyclopedia" : "คัมภีร์ไพ่ 78 ใบ",
        item: localizedUrl("/cards", locale),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: isEnglish ? groupInfo.nameEn : groupInfo.nameTh,
        item: currentUrl,
      },
    ],
  };

  const groupSuit = ["major", "wands", "cups", "swords", "pentacles"].includes(groupInfo.id) ? groupInfo.id : "all";

  const chapters = chaptersOf(groupInfo.id, cards);
  let tileIndex = 0;
  const sections: Ui2ShowcaseSection[] = [
    ...chapters.map((ch) => ({
      id: ch.id,
      kicker: isEnglish ? ch.kicker : ch.kickerTh,
      title: isEnglish ? ch.en : ch.th,
      tone: ch.tone,
      count: ch.cards.length,
      lead: <ThaiPhrases>{isEnglish ? ch.leadEn : ch.leadTh}</ThaiPhrases>,
      meta: isEnglish ? `${ch.cards.length} cards · tap a card to read its meaning` : `${ch.cards.length} ใบ · แตะไพ่เพื่ออ่านความหมาย`,
      children: (
        <div className="v3-grid-wrap">
          <div className="v3-grid">
            {ch.cards.map((card) => {
              const i = tileIndex++;
              return <CardTile key={card.id} card={card} isEnglish={isEnglish} eager={i < 5} priority={i === 0} />;
            })}
          </div>
        </div>
      ),
    })),
    {
      id: "guide",
      kicker: isEnglish ? "Guide" : "คู่มือ",
      title: isEnglish ? `About ${groupInfo.nameEn}` : `รู้จัก${groupInfo.nameTh}`,
      short: isEnglish ? "Guide" : "คู่มืออ่าน",
      tone: 6,
      children: (
        <div className="v2-cg-intro">
          <div className="v2-cg-prose">
            {intro.paragraphs.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>
          <ul className="v2-cg-highlights">
            {intro.highlights.map((h, idx) => (
              <li key={idx}>
                <h3>
                  <ThaiPhrases>{h.title}</ThaiPhrases>
                </h3>
                <p>{h.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
  ];

  return (
    <div className="v3-cg" data-suit={groupSuit}>
      {/* Schema.org Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbsJsonLd) }} />

      {/* v3 (เจ้าของ 2026-10-17 "ทำแบบหน้าแรกกับหน้าผัง"): ไพ่จริงของหมวดนี้ลอยรอบหัวข้อ ➔ ชิปสลับหมวด ➔ บทของหมวดเป็นหน้าต่าง */}
      <Ui2PageHero
        crumbs={[
          { label: isEnglish ? "Home" : "หน้าแรก", href: "/" },
          { label: isEnglish ? "Tarot Encyclopedia" : "คัมภีร์ไพ่ 78 ใบ", href: "/cards" },
          { label: isEnglish ? groupInfo.nameEn : groupInfo.nameTh },
        ]}
        title={isEnglish ? groupInfo.nameEn : groupInfo.seoTitleTh}
        lede={<ThaiPhrases>{isEnglish ? groupInfo.heroTaglineEn : groupInfo.heroTaglineTh}</ThaiPhrases>}
        trust={[
          isEnglish ? `${cards.length} cards` : `${cards.length} ใบ`,
          ...(groupInfo.elementTh ? [isEnglish ? `${groupInfo.elementEn} element` : `ธาตุ${groupInfo.elementTh}`] : []),
          isEnglish ? "1909 Rider-Waite-Smith" : "ภาพต้นฉบับ 1909 Rider-Waite",
        ]}
        cards={heroCards(cards)}
      >
        <nav className="v3-cg-switch" aria-label={isEnglish ? "Browse deck categories" : "เลือกหมวดหมู่ไพ่"}>
          {NAV_TABS.map((tab) => (
            <Link key={tab.id} href={tab.href} aria-current={tab.id === groupInfo.id ? "page" : undefined}>
              {isEnglish ? tab.labelEn : tab.labelTh}
              {tab.n > 0 && <span className="ui2-num">{tab.n}</span>}
            </Link>
          ))}
        </nav>
      </Ui2PageHero>

      <Ui2Showcase label={isEnglish ? `${groupInfo.nameEn} by chapter` : `${groupInfo.nameTh}แยกเป็นบท`} sections={sections} />
    </div>
  );
};

/** ไพ่ลอยรอบหัวข้อ = ไพ่จริงของหมวดนี้ 6 ใบ (กระจายทั้งหมวด ไม่ใช่ 6 ใบแรกติดกัน) */
function heroCards(cards: readonly CardSummary[]): string[] {
  if (cards.length <= 6) return cards.map((c) => c.id);
  const step = cards.length / 6;
  return Array.from({ length: 6 }, (_, i) => cards[Math.floor(i * step)].id);
}
