"use client";

import React from "react";
import Link from "next/link";
import type { TarotCard } from "@/data/cards/types";
import type { CardGroupInfo } from "@/data/cards/group-seo";
import { CardImage } from "@/components/card/CardImage";
import { CARD_KEYWORDS_EN } from "@/data/cards/keywords-en";
import { useLocale } from "@/lib/i18n";
import { SITE_ORIGIN } from "@/lib/config/site";
import {
  AirElementIcon,
  CrownTabIcon,
  FireElementIcon,
  PentacleTabIcon,
  SparkleTabIcon,
  WaterElementIcon,
} from "@/components/ui/TarotArtIcons";

interface CardGroupViewProps {
  groupInfo: CardGroupInfo;
  cards: readonly TarotCard[];
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

const ELEMENT_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  ไฟ: { bg: "bg-[#8F5C1A]/10", text: "text-[#8F5C1A]", border: "border-[#8F5C1A]/30" },
  น้ำ: { bg: "bg-[#6F5B4A]/10", text: "text-[#635B4E]", border: "border-[#6F5B4A]/30" },
  ลม: { bg: "bg-[#6F5B4A]/10", text: "text-[#635B4E]", border: "border-[#6F5B4A]/30" },
  ดิน: { bg: "bg-[#3A7044]/10", text: "text-[#3A7044]", border: "border-[#3A7044]/30" },
};

const ELEMENT_EN: Record<string, string> = {
  ไฟ: "Fire",
  น้ำ: "Water",
  ลม: "Air",
  ดิน: "Earth",
};

export const CardGroupView: React.FC<CardGroupViewProps> = ({ groupInfo, cards }) => {
  const { isEnglish } = useLocale();
  const intro = isEnglish ? groupInfo.introContentEn : groupInfo.introContentTh;
  const currentUrl = `${SITE_ORIGIN}/cards/${groupInfo.id}`;

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
        name: `${card.nameTh} (${card.nameEn})`,
        url: `${SITE_ORIGIN}/cards/${card.id}`,
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
        item: SITE_ORIGIN,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: isEnglish ? "Tarot Encyclopedia" : "คัมภีร์ไพ่ 78 ใบ",
        item: `${SITE_ORIGIN}/cards`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: isEnglish ? groupInfo.nameEn : groupInfo.nameTh,
        item: currentUrl,
      },
    ],
  };

  return (
    <div className="space-y-8">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />

      {/* Breadcrumb Bar */}
      <nav aria-label="Breadcrumb" className="text-xs font-serif-th text-[#635B4E]">
        <ol className="flex items-center gap-1.5 flex-wrap">
          <li>
            <Link href="/" className="hover:text-[#8F5C1A] transition-colors">
              {isEnglish ? "Home" : "หน้าแรก"}
            </Link>
          </li>
          <li aria-hidden="true" className="text-[#A58A5C]">/</li>
          <li>
            <Link href="/cards" className="hover:text-[#8F5C1A] transition-colors">
              {isEnglish ? "Tarot Encyclopedia" : "คัมภีร์ไพ่ 78 ใบ"}
            </Link>
          </li>
          <li aria-hidden="true" className="text-[#A58A5C]">/</li>
          <li aria-current="page" className="font-bold text-[#29261F]">
            {isEnglish ? groupInfo.nameEn : groupInfo.nameTh}
          </li>
        </ol>
      </nav>

      {/* Header & Editorial Hero */}
      <header className="rounded-2xl border border-[#D5CEC2] bg-[#FFFFFF] p-6 sm:p-10 shadow-xs relative overflow-hidden">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#A58A5C]/40 bg-[#FAF7F2] text-[#8F5C1A] text-xs font-serif-th font-bold">
            <span>{isEnglish ? "Tarot Compendium" : "คัมภีร์ไพ่ยิปซี 1909"}</span>
            <span className="w-1 h-1 rounded-full bg-[#A58A5C]" />
            <span>{cards.length} {isEnglish ? "Cards" : "ใบ"}</span>
            {groupInfo.elementTh && (
              <>
                <span className="w-1 h-1 rounded-full bg-[#A58A5C]" />
                <span>ธาตุ{isEnglish ? groupInfo.elementEn : groupInfo.elementTh}</span>
              </>
            )}
          </div>

          <h1 className="font-serif-th text-2xl sm:text-3xl lg:text-4xl font-bold text-[#29261F] leading-snug">
            {isEnglish ? groupInfo.nameEn : groupInfo.seoTitleTh}
          </h1>

          <p className="font-serif-th text-sm sm:text-base text-[#635B4E] leading-relaxed">
            {isEnglish ? groupInfo.heroTaglineEn : groupInfo.heroTaglineTh}
          </p>

          {/* Editorial Prose Introduction (≥300 words) */}
          <div className="pt-4 border-t border-[#D5CEC2]/60 space-y-3.5 text-xs sm:text-sm text-[#29261F] font-serif-th leading-relaxed">
            {intro.paragraphs.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>

          {/* 3 Strategic Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
            {intro.highlights.map((h, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-[#D5CEC2] bg-[#FAF7F2] space-y-1"
              >
                <h2 className="font-serif-th text-xs font-bold text-[#8F5C1A]">
                  {h.title}
                </h2>
                <p className="font-serif-th text-[11px] text-[#635B4E] leading-normal">
                  {h.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Group Navigation Bar */}
      <div className="space-y-2">
        <h2 className="font-serif-th text-xs font-bold text-[#635B4E] uppercase tracking-wider">
          {isEnglish ? "Browse Deck Categories" : "เลือกหมวดหมู่ไพ่"}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {NAV_TABS.map((tab) => {
            const isActive = tab.id === groupInfo.id;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`p-2.5 rounded-xl border text-center transition-all duration-200 flex flex-col items-center justify-center gap-1 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#A58A5C] ${
                  isActive
                    ? "border-2 border-[#A58A5C] bg-[#FFFFFF] shadow-xs"
                    : "border border-[#D5CEC2] bg-[#FAF7F2] hover:border-[#A58A5C] hover:bg-[#FFFFFF]"
                }`}
              >
                <tab.Icon className={`w-4 h-4 ${isActive ? "text-[#8F5C1A]" : "text-[#A58A5C]"}`} />
                <span
                  className={`font-serif-th text-xs font-bold block truncate max-w-full ${
                    isActive ? "text-[#8F5C1A]" : "text-[#29261F] group-hover:text-[#8F5C1A]"
                  }`}
                >
                  {isEnglish ? tab.labelEn : tab.labelTh}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Cards Grid */}
      <section aria-label={isEnglish ? groupInfo.nameEn : groupInfo.nameTh} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif-th text-base font-bold text-[#29261F]">
            {isEnglish ? `All ${cards.length} Cards in this Group` : `รายชื่อไพ่ทั้งหมด ${cards.length} ใบ ในหมวดนี้`}
          </h2>
          <span className="font-serif-th text-xs text-[#635B4E]">
            {isEnglish ? "1909 Rider-Waite-Smith" : "ภาพต้นฉบับ 1909 Rider-Waite"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {cards.map((card) => {
            const elemStyle = ELEMENT_STYLES[card.element] || ELEMENT_STYLES["ไฟ"];
            return (
              <Link
                key={card.id}
                href={`/cards/${card.id}`}
                prefetch={false}
                className="rounded-xl border border-[#D5CEC2] bg-[#FFFFFF] p-3 flex flex-col justify-between hover:border-[#A58A5C] transition-all duration-300 group cursor-pointer relative overflow-hidden transform-gpu hover:-translate-y-1 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A]"
              >
                {/* Card Artwork */}
                <div className="relative aspect-[7/12] w-full rounded-lg overflow-hidden border border-[#D5CEC2] bg-[#EAE7E0] mb-2.5">
                  <CardImage
                    image={card.image}
                    cardId={card.id}
                    alt={`ไพ่ ${card.nameTh} (${card.nameEn})`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 tarot-hd-card-image"
                    sizes="(min-width: 1024px) 160px, (min-width: 768px) 170px, (min-width: 640px) 190px, 45vw"
                  />

                  {/* Top Badge: Number / Arcana & Element */}
                  <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
                    <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#29261F] text-[#F3F0EA] border border-[#D5CEC2]">
                      {card.arcana === "major" ? `#${card.number}` : card.suit?.toUpperCase().slice(0, 1)}
                    </span>
                    <span
                      className={`text-[11px] font-mono px-1.5 py-0.5 rounded border ${elemStyle.border} ${elemStyle.bg} ${elemStyle.text} font-bold`}
                    >
                      {isEnglish ? ELEMENT_EN[card.element] || card.element : card.element}
                    </span>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-[#29261F]/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-xs font-serif-th font-bold text-[#F3F0EA]">
                      {isEnglish ? "View Meaning" : "อ่านความหมาย"}
                    </span>
                  </div>
                </div>

                {/* Card Info */}
                <div className="text-center space-y-1">
                  <span className="text-[11px] font-mono text-[#635B4E] block truncate">
                    {isEnglish ? card.nameTh : card.nameEn}
                  </span>
                  <h3 className="font-serif-th text-xs sm:text-sm font-bold text-[#29261F] group-hover:text-[#8F5C1A] transition-colors truncate">
                    {isEnglish ? card.nameEn : card.nameTh}
                  </h3>

                  {/* Top 2 Keywords */}
                  <div className="flex flex-wrap items-center justify-center gap-1 pt-1">
                    {(() => {
                      const kwEnList = CARD_KEYWORDS_EN[card.id]?.upright;
                      const displayKws =
                        isEnglish && kwEnList && kwEnList.length > 0
                          ? kwEnList.slice(0, 2)
                          : card.keywords.upright.slice(0, 2);
                      return displayKws.map((kw, i) => (
                        <span
                          key={i}
                          className="text-[11px] font-serif-th px-1.5 py-0.5 rounded-full bg-[#FAF7F2] text-[#29261F] border border-[#D5CEC2] truncate max-w-full"
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
    </div>
  );
};
