"use client";

import React, { useState, useMemo, useEffect } from "react";
// ลิงก์ภายในต้องอยู่ในต้นไม้ภาษาเดียวกับหน้าที่ผู้ใช้ยืนอยู่ — ดู src/components/ui/LocaleLink.tsx
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import dynamic from "next/dynamic";
import type { CardSummary } from "@/data/cards/summary";
import { CARD_KEYWORDS_EN } from "@/data/cards/keywords-en";
import { trackEvent } from "@/lib/analytics";
import { useLocale } from "@/lib/i18n";

import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { Ui2PageHero } from "@/components/ui2/Ui2PageHero";
import { Ui2Showcase, Ui2ShowcaseStarter, type Ui2ShowcaseSection } from "@/components/ui2/Ui2Showcase";
import { CardTile } from "@/components/encyclopedia/CardTile";
import { CardImage } from "@/components/card/CardImage";
import { ArrowIcon } from "@/components/ui/LineIcons";
interface CardsExplorerProps {
  cards: readonly CardSummary[];
}

/**
 * 5 หมวดของสำรับ = 5 หน้าต่างในโชว์เคส (ภาษาภาพเดียวกับ /spreads · เจ้าของ 2026-10-17)
 * เดิมเป็นแท็บกรองไพ่ + กริด 78 ใบก้อนเดียว ➔ ตอนนี้ทุกชุดมีหน้าต่างของตัวเอง เลื่อนดูต่อกันได้ รายชื่อซ้ายพากระโดด
 */
const GROUPS = [
  {
    id: "major",
    tone: 4,
    kicker: "Major Arcana",
    kickerTh: "ไพ่ชุดใหญ่",
    th: "ไพ่ชุดใหญ่",
    en: "Major Arcana",
    leadTh: "22 บทใหญ่ของชีวิต ตั้งแต่ก้าวแรกของคนเขลาจนถึงโลกที่สมบูรณ์",
    leadEn: "22 great chapters of life, from the Fool's first step to the completed World",
    starter: "major-00",
    starterTh: "เริ่มอ่านที่ใบแรกของการเดินทาง",
    starterEn: "Start with the first card of the journey",
  },
  {
    id: "wands",
    tone: 3,
    kicker: "Wands · Fire",
    kickerTh: "ไม้เท้า · ธาตุไฟ",
    th: "ไม้เท้า",
    en: "Wands",
    leadTh: "ธาตุไฟ ไฟในใจ ความกล้า การงาน และสิ่งที่อยากลงมือทำ",
    leadEn: "Fire: drive, courage, work and the things you want to make happen",
    starter: "wands-01",
    starterTh: "จุดเริ่มของธาตุไฟ",
    starterEn: "Where the fire begins",
  },
  {
    id: "cups",
    tone: 2,
    kicker: "Cups · Water",
    kickerTh: "ถ้วย · ธาตุน้ำ",
    th: "ถ้วย",
    en: "Cups",
    leadTh: "ธาตุน้ำ ความรัก ความรู้สึก และความสัมพันธ์รอบตัว",
    leadEn: "Water: love, feelings and the relationships around you",
    starter: "cups-01",
    starterTh: "จุดเริ่มของหัวใจ",
    starterEn: "Where the heart begins",
  },
  {
    id: "swords",
    tone: 7,
    kicker: "Swords · Air",
    kickerTh: "ดาบ · ธาตุลม",
    th: "ดาบ",
    en: "Swords",
    leadTh: "ธาตุลม ความคิด การตัดสินใจ และความจริงที่ต้องเผชิญ",
    leadEn: "Air: thoughts, decisions and the truths you have to face",
    starter: "swords-01",
    starterTh: "จุดเริ่มของความคิดที่ชัด",
    starterEn: "Where clear thinking begins",
  },
  {
    id: "pentacles",
    tone: 1,
    kicker: "Pentacles · Earth",
    kickerTh: "เหรียญ · ธาตุดิน",
    th: "เหรียญ",
    en: "Pentacles",
    leadTh: "ธาตุดิน เงิน งานที่จับต้องได้ สุขภาพ และความมั่นคง",
    leadEn: "Earth: money, tangible work, health and stability",
    starter: "pentacles-01",
    starterTh: "จุดเริ่มของความมั่นคง",
    starterEn: "Where stability begins",
  },
] as const;

const groupOf = (card: CardSummary) => (card.arcana === "major" ? "major" : (card.suit ?? "major"));

/** ไพ่ลอยข้างหัวข้อ (ตกแต่ง · ไม่ใช่ผลสุ่ม) */
const HERO_CARDS = ["major-00", "major-19", "major-17", "major-10", "major-01", "major-21"] as const;

const ELEMENT_EN: Record<string, string> = {
  ไฟ: "Fire",
  น้ำ: "Water",
  ลม: "Air",
  ดิน: "Earth",
};

const SemanticSearchPanel = dynamic(
  () => import("./SemanticSearchPanel").then((m) => m.SemanticSearchPanel),
  { ssr: false, loading: () => null },
);

export const CardsExplorer: React.FC<CardsExplorerProps> = ({ cards }) => {
  const { isEnglish } = useLocale();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSemanticSearch, setShowSemanticSearch] = useState<boolean>(false);
  /** 📱 มือถือ: หมวดที่กดดูครบแล้ว (ปกติโชว์ 6 ใบแรกต่อหมวด · ใบที่เหลืออยู่ใน HTML ครบ ซ่อนด้วย CSS เท่านั้น) */
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());

  const query = searchQuery.toLowerCase().trim();
  const filteredCards = useMemo(() => {
    if (!query) return cards;
    return cards.filter((card) => {
      const element = card.element ? card.element.toLowerCase() : "";
      const elementEn = (card.element && ELEMENT_EN[card.element] ? ELEMENT_EN[card.element] : "").toLowerCase();
      const astro = card.astrology ? card.astrology.toLowerCase() : "";
      const keywords = [...card.keywords.upright, ...card.keywords.reversed].join(" ").toLowerCase();
      const kwEnObj = CARD_KEYWORDS_EN[card.id];
      const keywordsEn = kwEnObj ? [...kwEnObj.upright, ...kwEnObj.reversed].join(" ").toLowerCase() : "";
      return (
        card.nameTh.toLowerCase().includes(query) ||
        card.nameEn.toLowerCase().includes(query) ||
        keywords.includes(query) ||
        keywordsEn.includes(query) ||
        element.includes(query) ||
        elementEn.includes(query) ||
        astro.includes(query)
      );
    });
  }, [cards, query]);

  useEffect(() => {
    if (!query) return;
    const timer = setTimeout(() => {
      // ส่งแค่ความยาว ไม่ส่งข้อความที่พิมพ์ (A4-10 — คำสัญญาในแถบยินยอม)
      trackEvent("card_search", {
        query_len: query.length,
        results_count: filteredCards.length,
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [query, filteredCards.length]);

  const byId = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
  let tileIndex = 0;
  const sections: Ui2ShowcaseSection[] = GROUPS.map((g) => {
    const all = cards.filter((c) => groupOf(c) === g.id);
    const list = filteredCards.filter((c) => groupOf(c) === g.id);
    const clipped = !query && !expanded.has(g.id) && list.length > 6;
    const starter = byId.get(g.starter);
    return {
      id: `suit-${g.id}`,
      kicker: isEnglish ? g.kicker : g.kickerTh,
      title: isEnglish ? g.en : g.th,
      tone: g.tone,
      count: query ? list.length : all.length,
      hidden: list.length === 0,
      lead: <ThaiPhrases>{isEnglish ? g.leadEn : g.leadTh}</ThaiPhrases>,
      meta: query
        ? isEnglish
          ? `${list.length} of ${all.length} cards match`
          : `ตรงคำค้น ${list.length} จาก ${all.length} ใบ`
        : isEnglish
          ? `${all.length} cards · tap a card to read its meaning`
          : `${all.length} ใบ · แตะไพ่เพื่ออ่านความหมาย`,
      aside:
        starter && !query ? (
          <Ui2ShowcaseStarter
            kicker={isEnglish ? g.starterEn : g.starterTh}
            name={isEnglish ? starter.nameEn : starter.nameTh}
            action={
              <Link href={`/cards/${starter.id}`} prefetch={false}>
                {isEnglish ? "Read" : "อ่านความหมาย"}
              </Link>
            }
          />
        ) : undefined,
      children: (
        <div className="v3-grid-wrap">
          <div className={`v3-grid${clipped ? " is-clipped" : ""}`}>
            {list.map((card) => {
              const i = tileIndex++;
              // แถวแรกของหน้าต่างแรกคือผู้สมัคร LCP — ห้าม lazy (เบราว์เซอร์รู้จักภาพแรกช้าไปหนึ่งรอบเครือข่าย)
              return <CardTile key={card.id} card={card} isEnglish={isEnglish} eager={i < 5} priority={i === 0} />;
            })}
          </div>
          {clipped && (
            <p className="v3-more">
              <button
                type="button"
                onClick={() => setExpanded((prev) => new Set(prev).add(g.id))}
              >
                {isEnglish ? `Show all ${list.length} ${g.en}` : `ดู${g.th}ครบ ${list.length} ใบ`}
              </button>
            </p>
          )}
        </div>
      ),
    };
  });

  return (
    <div className="v3-cx">
      <Ui2PageHero
        crumbs={[{ label: isEnglish ? "Home" : "หน้าแรก", href: "/" }, { label: isEnglish ? "78 Card Meanings" : "ความหมายไพ่ 78 ใบ" }]}
        title=""
        titleNode={
          isEnglish ? (
            <>
              The Complete <span className="ui2-gold-night ui2-loop">78 Tarot Cards</span> &amp; Meanings
            </>
          ) : (
            <>
              <span className="tp">ความหมายไพ่ทาโร่ ไพ่ยิปซี</span>{" "}
              <span className="tp">
                ทั้ง <span className="ui2-gold-night ui2-loop">78 ใบ</span>
              </span>
            </>
          )
        }
        lede={
          <ThaiPhrases>
            {isEnglish
              ? "Every card of the 1909 Rider-Waite deck, upright and reversed, for love, work and money."
              : "ค้นหาความหมายและคำทำนายของไพ่ทาโรต์ 78 ใบ ครบทุกมิติความรัก การงาน และการเงิน"}
          </ThaiPhrases>
        }
        cards={HERO_CARDS}
      >
        <div className="v2-cx-search">
          <input
            type="search"
            aria-label={isEnglish ? "Search 78 tarot cards" : "ค้นหาไพ่ทาโรต์ 78 ใบ"}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isEnglish ? "Search card name or meaning" : "ค้นหาชื่อไพ่ หรือความหมาย"}
          />
          {searchQuery && (
            <button
              type="button"
              className="v2-cx-clear"
              onClick={() => {
                setSearchQuery("");
                setShowSemanticSearch(false);
              }}
              aria-label={isEnglish ? "Clear search" : "ล้างคำค้นหา"}
            />
          )}
        </div>
        <p className="v2-cx-try">
          <span>{isEnglish ? "Try" : "ลองค้น"}</span>
          {(isEnglish ? ["Love", "Money", "The Sun", "Fire", "New beginnings"] : ["ความรัก", "การเงิน", "The Sun", "ธาตุไฟ", "เริ่มต้นใหม่"]).map((q) => (
            <button key={q} type="button" onClick={() => setSearchQuery(q)} aria-pressed={searchQuery === q}>
              {q}
            </button>
          ))}
        </p>
      </Ui2PageHero>

      <Ui2Showcase
        label={isEnglish ? "Cards by suit" : "ไพ่แยกตามชุด"}
        sections={sections}
        before={
          query ? (
            <div className="v3-cx-status">
              <p role="status">
                {isEnglish ? (
                  <>
                    <b>{filteredCards.length}</b> of {cards.length} cards match
                  </>
                ) : (
                  <>
                    พบ <b>{filteredCards.length}</b> จาก {cards.length} ใบ
                  </>
                )}
              </p>
              {query.length >= 4 && (
                <button type="button" onClick={() => setShowSemanticSearch((prev) => !prev)} aria-pressed={showSemanticSearch}>
                  {showSemanticSearch
                    ? isEnglish
                      ? "Hide feeling search"
                      : "ซ่อนผลค้นหาด้วยความรู้สึก"
                    : isEnglish
                      ? "Search by feeling instead"
                      : "ค้นหาด้วยความรู้สึกแทน"}
                </button>
              )}
              {showSemanticSearch && query.length >= 2 && (
                <SemanticSearchPanel query={searchQuery} onClose={() => setShowSemanticSearch(false)} />
              )}
              {filteredCards.length === 0 && (
                <div className="v3-cx-empty">
                  <h2>
                    <ThaiPhrases>{isEnglish ? `No cards matching "${searchQuery}"` : `ไม่พบไพ่ที่ตรงกับ "${searchQuery}"`}</ThaiPhrases>
                  </h2>
                  <p>
                    {isEnglish
                      ? 'Try another word such as "Love", "The Sun", "Jupiter" or "Fire".'
                      : 'ลองคำอื่น เช่น "ความรัก", "The Sun", "ดาวพฤหัสบดี" หรือ "ธาตุไฟ"'}
                  </p>
                  <button type="button" onClick={() => setSearchQuery("")}>
                    {isEnglish ? "Clear search" : "ล้างคำค้นหา"}
                  </button>
                </div>
              )}
            </div>
          ) : undefined
        }
      />

      {/* คู่มือย่อย — ลิงก์ภายในที่บอทเห็น · v2 (เจ้าของ 2026-10-17 "ชิดเกินไป และยังไม่สวย"):
          เดิมสันหนังสือ 9 ก้อนเล็กชิดใต้หน้าต่างสุดท้าย ➔ ส่วนของตัวเองมีหัวกลาง เว้นจากหน้าต่าง · การ์ดกระดาษครีม
          ไพ่ประจำหมวดเอียงซ้าย (ภาพประกอบตามความหมายดั้งเดิม ไม่ใช่ผลสุ่ม) · ปุ่มวงกลมลูกศร */}
      <nav className="v2-cx-shelf" aria-labelledby="cx-shelf-title">
        <div className="v2-cx-shelf-head">
          <span className="v2-cx-shelf-kicker">{isEnglish ? "Go deeper" : "อ่านต่อแบบเจาะลึก"}</span>
          <h2 id="cx-shelf-title" className="v2-cx-shelf-k">
            <ThaiPhrases>{isEnglish ? "Dedicated guides & the master table" : "คู่มือเจาะลึกแต่ละหมวด และตารางสรุป"}</ThaiPhrases>
          </h2>
        </div>
        <ul>
          {[
            { href: "/cards/major", suit: "major", card: "major-21", th: "ไพ่ชุดใหญ่", en: "Major Arcana", n: "22" },
            { href: "/cards/minor", suit: "all", card: "cups-10", th: "ไพ่ชุดเล็ก", en: "Minor Arcana", n: "56" },
            { href: "/cards/wands", suit: "wands", card: "wands-01", th: "ไม้เท้า", en: "Wands", n: "14" },
            { href: "/cards/cups", suit: "cups", card: "cups-01", th: "ถ้วย", en: "Cups", n: "14" },
            { href: "/cards/swords", suit: "swords", card: "swords-01", th: "ดาบ", en: "Swords", n: "14" },
            { href: "/cards/pentacles", suit: "pentacles", card: "pentacles-01", th: "เหรียญ", en: "Pentacles", n: "14" },
            { href: "/cards/all", suit: "major", card: "major-10", th: "ตารางสรุป 78 ใบ", en: "Summary Table", n: "78" },
            { href: "/cards/birth-card", suit: "major", card: "major-19", th: "คำนวณไพ่ประจำตัว", en: "Birth Card Tool", n: "" },
            { href: "/cards/zodiac", suit: "major", card: "major-17", th: "ไพ่ประจำราศี", en: "Zodiac Cards", n: "12" },
          ].map((l) => (
            <li key={l.href}>
              <Link href={l.href} data-suit={l.suit} className="v2-cx-book">
                <span className="v2-cx-book-art" aria-hidden="true">
                  <CardImage cardId={l.card} alt="" thumb sizes="64px" loading="lazy" fetchPriority="low" />
                </span>
                <span className="v2-cx-book-txt">
                  <b>{isEnglish ? l.en : l.th}</b>
                  <small>{l.n ? (isEnglish ? `${l.n} cards` : `${l.n} ใบ`) : isEnglish ? "From your birthday" : "จากวันเกิดของคุณ"}</small>
                </span>
                <span className="v2-cx-book-go" aria-hidden="true">
                  <ArrowIcon className="w-[18px] h-[18px]" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};
