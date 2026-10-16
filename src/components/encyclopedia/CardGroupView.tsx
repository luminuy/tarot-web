"use client";

import React from "react";
// ลิงก์ภายในต้องอยู่ในต้นไม้ภาษาเดียวกับหน้าที่ผู้ใช้ยืนอยู่ — ดู src/components/ui/LocaleLink.tsx
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import type { CardSummary } from "@/data/cards/summary";
import type { CardGroupInfo } from "@/data/cards/group-seo";
import { CardImage } from "@/components/card/CardImage";
import { CARD_KEYWORDS_EN } from "@/data/cards/keywords-en";
import { useLocale } from "@/lib/i18n";
import { localizedUrl, SITE_ORIGIN } from "@/lib/config/site";
import {
  AirElementIcon,
  CrownTabIcon,
  FireElementIcon,
  PentacleTabIcon,
  SparkleTabIcon,
  WaterElementIcon,
} from "@/components/ui/TarotArtIcons";
import { jsonLdScript } from "@/lib/seo/json-ld";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { Ui2Crumbs } from "@/components/ui2/Ui2PageHero";

interface CardGroupViewProps {
  groupInfo: CardGroupInfo;
  cards: readonly CardSummary[];
}

const NAV_TABS = [
  { id: "all", href: "/cards", labelTh: "ไพ่ทั้งหมด (78)", labelEn: "All 78 Cards", Icon: SparkleTabIcon },
  { id: "major", href: "/cards/major", labelTh: "ชุดใหญ่ (22)", labelEn: "Major Arcana (22)", Icon: CrownTabIcon },
  { id: "minor", href: "/cards/minor", labelTh: "ชุดเล็ก (56)", labelEn: "Minor Arcana (56)", Icon: SparkleTabIcon },
  { id: "wands", href: "/cards/wands", labelTh: "ไม้เท้า (14)", labelEn: "Wands (14)", Icon: FireElementIcon },
  { id: "cups", href: "/cards/cups", labelTh: "ถ้วย (14)", labelEn: "Cups (14)", Icon: WaterElementIcon },
  { id: "swords", href: "/cards/swords", labelTh: "ดาบ (14)", labelEn: "Swords (14)", Icon: AirElementIcon },
  { id: "pentacles", href: "/cards/pentacles", labelTh: "เหรียญ (14)", labelEn: "Pentacles (14)", Icon: PentacleTabIcon },
  { id: "table", href: "/cards/all", labelTh: "ตารางสรุป", labelEn: "Summary Table", Icon: SparkleTabIcon },
];

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

  return (
    <div className="v2-cg space-y-8" data-suit={groupSuit}>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbsJsonLd) }}
      />

      {/*
        v2 (เจ้าของ 2026-10-16 "สร้างใหม่เลย") — ห้องธาตุ: หัวหน้าเรืองสีธาตุของชุด + พัดไพ่จริงของชุดนั้น
        แถบสลับหมวดสีธาตุ ➔ กริดไพ่ขึ้นก่อน (v1 ให้อ่านบทนำยาวก่อนถึงไพ่) ➔ บทนำ + 3 จุดเด่นย้ายไปท้าย
      */}
      <header className="v2-cg-head">
        <div className="v2-cg-text">
          <Ui2Crumbs
            crumbs={[
              { label: isEnglish ? "Home" : "หน้าแรก", href: "/" },
              { label: isEnglish ? "Tarot Encyclopedia" : "คัมภีร์ไพ่ 78 ใบ", href: "/cards" },
              { label: isEnglish ? groupInfo.nameEn : groupInfo.nameTh },
            ]}
          />
          <h1 className="v2-cg-title">
            <ThaiPhrases>{isEnglish ? groupInfo.nameEn : groupInfo.seoTitleTh}</ThaiPhrases>
          </h1>
          <p className="v2-cg-lede">
            <ThaiPhrases>{isEnglish ? groupInfo.heroTaglineEn : groupInfo.heroTaglineTh}</ThaiPhrases>
          </p>
          <ul className="v2-cg-facts">
            <li>
              <b>{cards.length}</b> {isEnglish ? "cards" : "ใบ"}
            </li>
            {groupInfo.elementTh && <li>{isEnglish ? `${groupInfo.elementEn} element` : `ธาตุ${groupInfo.elementTh}`}</li>}
            <li>{isEnglish ? "1909 Rider-Waite-Smith" : "ภาพต้นฉบับ 1909 Rider-Waite"}</li>
          </ul>
        </div>
        <span className="v2-cg-fan" aria-hidden="true">
          {cards.slice(0, 5).map((c, i) => (
            <span key={c.id} className={`v2-cg-fan-card v2-cg-fan-${i + 1}`}>
              <CardImage cardId={c.id} image={c.image} alt="" thumb sizes="(min-width: 1024px) 150px, 90px" loading={i < 3 ? "eager" : "lazy"} />
            </span>
          ))}
        </span>
      </header>

      <nav className="v2-cg-switch" aria-label={isEnglish ? "Browse Deck Categories" : "เลือกหมวดหมู่ไพ่"}>
        {NAV_TABS.map((tab) => {
          const isActive = tab.id === groupInfo.id;
          const suit = ["major", "wands", "cups", "swords", "pentacles"].includes(tab.id) ? tab.id : "all";
          return (
            <Link key={tab.id} href={tab.href} data-suit={suit} aria-current={isActive ? "page" : undefined}>
              <tab.Icon className="v2-cg-switch-ic" />
              {isEnglish ? tab.labelEn : tab.labelTh}
            </Link>
          );
        })}
      </nav>

      {/* Cards Grid */}
      <section aria-label={isEnglish ? groupInfo.nameEn : groupInfo.nameTh} className="v2-cg-grid page-band page-band-tint space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif-th text-base font-bold text-ink"><ThaiPhrases>
            {isEnglish ? `All ${cards.length} Cards in this Group` : `รายชื่อไพ่ทั้งหมด ${cards.length} ใบ ในหมวดนี้`}
          </ThaiPhrases></h2>
          <span className="font-serif-th text-xs text-muted">
            {isEnglish ? "1909 Rider-Waite-Smith" : "ภาพต้นฉบับ 1909 Rider-Waite"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {cards.map((card) => {
            return (
              <Link
                key={card.id}
                href={`/cards/${card.id}`}
                prefetch={false}
                /* ⚡ `card-tile-cv` = กลไกข้ามการวาดของนอกจอที่ปลอดภัยแล้ว (INC-0174)
                   ความสูงที่จองไว้คำนวณจากความกว้างจอด้วย calc(vw) ต่อ breakpoint ไม่ใช่ตัวเลขเดา
                   ใช้ได้เพราะแถวคีย์เวิร์ดด้านล่างถูกล็อกความสูงแล้ว การ์ดทุกใบจึงสูงเท่ากัน
                   ห้ามแก้สัดส่วนภาพ/ระยะห่างของการ์ดโดยไม่อัปเดตสูตรใน globals.css — ด่าน
                   `test-card-tile-height.ts` จะตกทันทีถ้าของที่สูตรพึ่งพาถูกแก้ (กริด · gap · padding · สัดส่วนภาพ) */
                className="card-tile-cv altar-card-porcelain !rounded-xl p-3 flex flex-col justify-between group cursor-pointer relative overflow-hidden transform-gpu hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
              >
                {/* Card Artwork */}
                <div className="glass-tile relative aspect-[7/12] w-full !rounded-lg overflow-hidden mb-2.5">
                  <CardImage
                    image={card.image}
                    cardId={card.id}
                    /* ภาพประกอบล้วน — <h3> ใต้ภาพในลิงก์เดียวกันพิมพ์ชื่อไพ่อยู่แล้ว ลิงก์จึงมีชื่อเรียกครบ (INC-0125) */
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 tarot-hd-card-image"
                    sizes="(min-width: 1024px) 152px, (min-width: 768px) 136px, (min-width: 640px) 156px, 38vw"
                  />

                  {/* Top Badge: Number / Arcana & Element */}
                  <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
                    <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-gold-ink text-white">
                      {card.arcana === "major" ? `#${card.number}` : card.suit?.toUpperCase().slice(0, 1)}
                    </span>
                    {/* ป้ายธาตุบนภาพไพ่ถอดออก — ทับรายละเอียดหน้าไพ่ (เจ้าของทักที่หน้าไพ่รายใบ · ตามแก้ให้เหมือนกันทั้งเว็บ) */}
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-ink/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-xs font-serif-th font-bold text-canvas">
                      {isEnglish ? "View Meaning" : "อ่านความหมาย"}
                    </span>
                  </div>
                </div>

                {/* Card Info */}
                <div className="text-center space-y-1">
                  <span className="text-[11px] font-mono text-muted block truncate">
                    {isEnglish ? "" : card.nameEn}
                  </span>
                  <h3 className="font-serif-th text-xs sm:text-sm font-bold text-ink group-hover:text-gold-ink transition-colors truncate">
                    {isEnglish ? card.nameEn : card.nameTh}
                  </h3>

                  {/* Top 2 Keywords */}
                  {/* ⚠️ ความสูงคงที่ 2 บรรทัดโดยตั้งใจ (INC-0174 · ISSUE-048)
                      คีย์เวิร์ดบางใบยาวจนตกบรรทัดที่สอง บางใบไม่ตก ความสูงการ์ดจึงต่างกัน 31px
                      ซึ่งทำให้กลไกข้ามการวาดเดาความสูงไม่ได้และหน้าจอกระตุกตอนเลื่อน
                      ล็อกไว้ที่ 2 บรรทัดเสมอ ➔ การ์ดทุกใบสูงเท่ากันที่ทุกความกว้างจอ
                      (ด่าน `test-card-tile-height.ts` เฝ้าข้อนี้อยู่ ห้ามถอดความสูงคงที่ออก) */}
                  <div className="flex flex-wrap items-start justify-center gap-1 pt-1 h-[3.8125rem] overflow-hidden">
                    {(() => {
                      const kwEnList = CARD_KEYWORDS_EN[card.id]?.upright;
                      const displayKws =
                        isEnglish && kwEnList && kwEnList.length > 0
                          ? kwEnList.slice(0, 2)
                          : card.keywords.upright.slice(0, 2);
                      return displayKws.map((kw, i) => (
                        <span
                          key={i}
                          className="text-[11px] font-serif-th px-1.5 py-0.5 rounded-full bg-surface-warm text-ink border border-line truncate max-w-full"
                        >
                          {kw}
                        </span>
                      ));
                    })()}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* บทนำ (≥ 300 คำ) + 3 จุดเด่น — เนื้อหาเดิมครบ ย้ายมาท้ายกริด */}
      <section className="v2-cg-intro" aria-labelledby="cg-intro-h">
        <h2 id="cg-intro-h" className="v2-cg-h2">
          <ThaiPhrases>{isEnglish ? `About ${groupInfo.nameEn}` : `รู้จัก${groupInfo.nameTh}`}</ThaiPhrases>
        </h2>
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
      </section>
    </div>
  );
};
