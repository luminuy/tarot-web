"use client";

import React, { useState, useMemo } from "react";
// ลิงก์ภายในต้องอยู่ในต้นไม้ภาษาเดียวกับหน้าที่ผู้ใช้ยืนอยู่ — ดู src/components/ui/LocaleLink.tsx
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import type { CardSummary } from "@/data/cards/summary";
import { CardImage } from "@/components/card/CardImage";
import { CARD_KEYWORDS_EN } from "@/data/cards/keywords-en";
import { useLocale } from "@/lib/i18n";
import {
  AirElementIcon,
  CrownTabIcon,
  FireElementIcon,
  PentacleTabIcon,
  SparkleTabIcon,
  WaterElementIcon,
} from "@/components/ui/TarotArtIcons";

const TABS = [
  { id: "all", labelTh: "ทั้งหมด (78)", labelEn: "All (78)", count: 78, Icon: SparkleTabIcon },
  { id: "major", labelTh: "ชุดใหญ่ (22)", labelEn: "Major (22)", count: 22, Icon: CrownTabIcon },
  { id: "wands", labelTh: "ไม้เท้า (14)", labelEn: "Wands (14)", count: 14, Icon: FireElementIcon },
  { id: "cups", labelTh: "ถ้วย (14)", labelEn: "Cups (14)", count: 14, Icon: WaterElementIcon },
  { id: "swords", labelTh: "ดาบ (14)", labelEn: "Swords (14)", count: 14, Icon: AirElementIcon },
  { id: "pentacles", labelTh: "เหรียญ (14)", labelEn: "Pentacles (14)", count: 14, Icon: PentacleTabIcon },
];

const ELEMENT_EN: Record<string, string> = {
  ไฟ: "Fire",
  น้ำ: "Water",
  ลม: "Air",
  ดิน: "Earth",
};

interface AllCardsTableProps {
  cards: readonly CardSummary[];
}

export const AllCardsTable: React.FC<AllCardsTableProps> = ({ cards }) => {
  const { isEnglish } = useLocale();
  const [activeSuit, setActiveSuit] = useState<string>("all");
  const [query, setQuery] = useState<string>("");

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      // Suit filter
      if (activeSuit === "major" && card.arcana !== "major") return false;
      if (activeSuit === "wands" && card.suit !== "wands") return false;
      if (activeSuit === "cups" && card.suit !== "cups") return false;
      if (activeSuit === "swords" && card.suit !== "swords") return false;
      if (activeSuit === "pentacles" && card.suit !== "pentacles") return false;

      // Query filter
      if (!query.trim()) return true;
      const q = query.toLowerCase().trim();
      const kwEn = CARD_KEYWORDS_EN[card.id];
      const allKws = [
        ...card.keywords.upright,
        ...card.keywords.reversed,
        ...(kwEn?.upright || []),
        ...(kwEn?.reversed || []),
      ].join(" ").toLowerCase();

      return (
        card.nameTh.toLowerCase().includes(q) ||
        card.nameEn.toLowerCase().includes(q) ||
        card.id.toLowerCase().includes(q) ||
        card.element.toLowerCase().includes(q) ||
        allKws.includes(q)
      );
    });
  }, [cards, activeSuit, query]);

  const groupOf = (card: CardSummary) => (card.arcana === "major" ? "major" : (card.suit ?? "major"));
  const showGroups = activeSuit === "all" && !query.trim();

  /*
   * v2 (เจ้าของ 2026-10-16 "สร้างใหม่เลย") — แผ่นอ้างอิงไพ่ 78 ใบ
   * แถบค้นหา + ชุดไพ่ติดจอ · แถวจัดกลุ่มตามชุดมีแถบหัวสีธาตุ (v1 ตารางยาว 78 แถวไม่มีจุดพัก)
   * มือถือ: แถวกลายเป็นการ์ดสองบรรทัด ไม่ต้องเลื่อนตารางแนวนอน
   */
  return (
    <div className="v2-ca">
      <div className="v2-ca-bar">
        <div className="v2-ca-search">
          <input
            aria-label={isEnglish ? "Search cards in table" : "ค้นหาไพ่ในตาราง"}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isEnglish ? "Search card name, keyword, element..." : "ค้นหาชื่อไพ่, คำสำคัญ, ธาตุ..."}
          />
          {query && (
            <button type="button" onClick={() => setQuery("")}>
              {isEnglish ? "Clear" : "ล้าง"}
            </button>
          )}
        </div>
        <div className="v2-ca-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              data-suit={tab.id}
              onClick={() => setActiveSuit(tab.id)}
              aria-pressed={activeSuit === tab.id}
              className="v2-ca-tab"
            >
              <tab.Icon className="v2-ca-tab-ic" />
              <span>{isEnglish ? tab.labelEn : tab.labelTh}</span>
            </button>
          ))}
        </div>
        <p className="v2-ca-count" role="status">
          {isEnglish ? (
            <>
              Showing <b>{filteredCards.length}</b> of 78 cards
            </>
          ) : (
            <>
              แสดง <b>{filteredCards.length}</b> จาก 78 ใบ
            </>
          )}
        </p>
      </div>

      <div className="v2-ca-sheet">
        <table className="v2-ca-table">
          <thead>
            <tr>
              <th className="is-n">#</th>
              <th className="is-img">{isEnglish ? "Card" : "ไพ่"}</th>
              <th>{isEnglish ? "Name" : "ชื่อไพ่"}</th>
              <th>{isEnglish ? "Element" : "ธาตุ / ชุด"}</th>
              <th>{isEnglish ? "Upright Meaning" : "ความหมายหัวตั้ง"}</th>
              <th>{isEnglish ? "Reversed Meaning" : "ความหมายกลับหัว"}</th>
            </tr>
          </thead>
          <tbody>
            {filteredCards.map((card, idx) => {
              const kwEn = CARD_KEYWORDS_EN[card.id];
              const uprightKws = isEnglish && kwEn?.upright?.length ? kwEn.upright : card.keywords.upright;
              const reversedKws = isEnglish && kwEn?.reversed?.length ? kwEn.reversed : card.keywords.reversed;
              const g = groupOf(card);
              const newGroup = showGroups && (idx === 0 || groupOf(filteredCards[idx - 1]) !== g);
              const tab = TABS.find((t) => t.id === g);
              return (
                <React.Fragment key={card.id}>
                  {newGroup && tab && (
                    <tr className="v2-ca-group" data-suit={g}>
                      <th colSpan={6} scope="colgroup">
                        <tab.Icon className="v2-ca-tab-ic" />
                        {isEnglish ? tab.labelEn : tab.labelTh}
                      </th>
                    </tr>
                  )}
                  <tr className="v2-ca-row" data-suit={g}>
                    <td className="is-n">{idx + 1}</td>
                    <td className="is-img">
                      <Link
                        href={`/cards/${card.id}`}
                        /* ⚠️ ลิงก์ภาพย่อไม่มีตัวหนังสือ — ชื่อเรียกมาจาก aria-label เท่านั้น (INC-0125 · WCAG 2.4.4) */
                        aria-label={isEnglish ? card.nameEn : card.nameTh}
                        className="v2-ca-thumb"
                      >
                        <CardImage image={card.image} cardId={card.id} alt="" className="w-full h-full object-cover" sizes="44px" />
                      </Link>
                    </td>
                    <td className="is-name">
                      <Link href={`/cards/${card.id}`}>
                        <b>{isEnglish ? card.nameEn : card.nameTh}</b>
                        {!isEnglish && <small>{card.nameEn}</small>}
                      </Link>
                    </td>
                    <td className="is-el">
                      <span>{isEnglish ? ELEMENT_EN[card.element] || card.element : `ธาตุ${card.element}`}</span>
                    </td>
                    <td className="is-up">
                      <span className="v2-ca-k">{isEnglish ? "Upright" : "หัวตั้ง"}</span>
                      {uprightKws.map((kw, i) => (
                        <span key={i} className="v2-ca-kw">
                          {kw}
                        </span>
                      ))}
                    </td>
                    <td className="is-rev">
                      <span className="v2-ca-k">{isEnglish ? "Reversed" : "กลับหัว"}</span>
                      {reversedKws.map((kw, i) => (
                        <span key={i} className="v2-ca-kw">
                          {kw}
                        </span>
                      ))}
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        {filteredCards.length === 0 && (
          <p className="v2-ca-empty">{isEnglish ? `No cards matched "${query}"` : `ไม่พบไพ่ที่ตรงกับ "${query}"`}</p>
        )}
      </div>
    </div>
  );
};
