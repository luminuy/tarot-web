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

const ELEMENT_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  ไฟ: { bg: "bg-gold-ink/10", text: "text-gold-ink", border: "border-gold-ink/30" },
  น้ำ: { bg: "bg-ink-soft/10", text: "text-muted", border: "border-ink-soft/30" },
  ลม: { bg: "bg-ink-soft/10", text: "text-muted", border: "border-ink-soft/30" },
  ดิน: { bg: "bg-ok/10", text: "text-ok", border: "border-ok/30" },
};

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
  }, [activeSuit, query]);

  return (
    <div className="space-y-6">
      {/* Controls Bar: Search & Filter Tabs */}
      <div className="rounded-2xl border border-line bg-surface p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <input
          aria-label={isEnglish ? "Search cards in table" : "ค้นหาไพ่ในตาราง"}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isEnglish ? "Search card name, keyword, element..." : "ค้นหาชื่อไพ่, คำสำคัญ, ธาตุ..."}
              className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface-warm text-xs sm:text-sm font-serif-th text-ink placeholder:text-muted/60 focus:outline-none focus:border-gold-ink focus:ring-1 focus:ring-gold-ink"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-serif-th text-muted hover:text-ink"
              >
                {isEnglish ? "Clear" : "ล้าง"}
              </button>
            )}
          </div>

          <div className="text-xs font-serif-th text-muted self-center sm:self-auto">
            {isEnglish ? (
              <>Showing <strong className="text-gold-ink">{filteredCards.length}</strong> of 78 cards</>
            ) : (
              <>แสดง <strong className="text-gold-ink">{filteredCards.length}</strong> จาก 78 ใบ</>
            )}
          </div>
        </div>

        {/* Suit Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {TABS.map((tab) => {
            const isActive = activeSuit === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSuit(tab.id)}
                className={`tap-overlay-y px-3 py-1.5 rounded-xl border text-xs font-serif-th font-bold shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? "border-gold-ink bg-ink text-canvas"
                    : "border-line bg-surface-warm text-muted hover:bg-surface hover:text-ink"
                }`}
              >
                <tab.Icon className="w-3.5 h-3.5" />
                <span>{isEnglish ? tab.labelEn : tab.labelTh}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Master 78-Card Table */}
      <div className="rounded-2xl border border-line bg-surface shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm font-serif-th">
            <thead>
              <tr className="border-b border-line bg-surface-warm text-ink">
                <th className="py-3 px-3 sm:px-4 font-bold w-12 text-center">#</th>
                <th className="py-3 px-2 sm:px-3 font-bold w-16 sm:w-20 text-center">{isEnglish ? "Card" : "ไพ่"}</th>
                <th className="py-3 px-3 sm:px-4 font-bold min-w-[140px] sm:min-w-[180px]">{isEnglish ? "Name" : "ชื่อไพ่"}</th>
                <th className="py-3 px-2 sm:px-3 font-bold min-w-[90px]">{isEnglish ? "Element" : "ธาตุ / ชุด"}</th>
                <th className="py-3 px-3 sm:px-4 font-bold min-w-[160px] sm:min-w-[200px]">{isEnglish ? "Upright Meaning" : "ความหมายหัวตั้ง"}</th>
                <th className="py-3 px-3 sm:px-4 font-bold min-w-[160px] sm:min-w-[200px]">{isEnglish ? "Reversed Meaning" : "ความหมายกลับหัว"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {filteredCards.map((card, idx) => {
                const elemStyle = ELEMENT_STYLES[card.element] || ELEMENT_STYLES["ไฟ"];
                const kwEn = CARD_KEYWORDS_EN[card.id];
                const uprightKws = isEnglish && kwEn?.upright?.length ? kwEn.upright : card.keywords.upright;
                const reversedKws = isEnglish && kwEn?.reversed?.length ? kwEn.reversed : card.keywords.reversed;

                return (
                  <tr
                    key={card.id}
                    style={{
                      contentVisibility: "auto",
                      containIntrinsicSize: "auto 60px",
                    }}
                    className="hover:bg-surface-warm/70 transition-colors group"
                  >
                    {/* Index */}
                    <td className="py-3 px-3 sm:px-4 text-center font-mono text-[11px] text-muted">
                      {idx + 1}
                    </td>

                    {/* Thumbnail */}
                    <td className="py-2.5 px-2 sm:px-3 text-center">
                      <Link
                        href={`/cards/${card.id}`}
                        /*
                         * ⚠️ ลิงก์นี้มี "ภาพย่อ" เป็นเนื้อหาชิ้นเดียว ไม่มีตัวหนังสือเลย
                         * ชื่อเรียก (accessible name) จึงต้องมาจาก aria-label ตรงนี้เท่านั้น
                         * ห้ามถอด aria-label ออกแล้วปล่อยให้ภาพข้างในเป็น alt="" พร้อมกัน
                         * เพราะลิงก์จะกลายเป็นลิงก์ไร้ชื่อ ผิด WCAG 2.4.4 (บทเรียน INC-0125)
                         */
                        aria-label={isEnglish ? card.nameEn : card.nameTh}
                        className="inline-block w-9 h-15 rounded overflow-hidden border border-line bg-inset hover:border-gold-ink transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-ink"
                      >
                        <CardImage
                          image={card.image}
                          cardId={card.id}
                          /* ชื่อไพ่ย้ายไปอยู่ที่ aria-label ของ <Link> ด้านบนแล้ว ไม่ใส่ซ้ำที่นี่ */
                          alt=""
                          className="w-full h-full object-cover"
                          sizes="36px"
                        />
                      </Link>
                    </td>

                    {/* Card Names */}
                    <td className="py-3 px-3 sm:px-4">
                      <Link
                        href={`/cards/${card.id}`}
                        className="group-hover:text-gold-ink transition-colors focus-visible:outline-none focus-visible:underline"
                      >
                        <span className="font-bold text-ink block text-xs sm:text-sm">
                          {isEnglish ? card.nameEn : card.nameTh}
                        </span>
                        <span className="text-[11px] font-mono text-muted block">
                          {isEnglish ? "" : card.nameEn}
                        </span>
                      </Link>
                    </td>

                    {/* Suit & Element */}
                    <td className="py-3 px-2 sm:px-3">
                      <span
                        className={`inline-block text-[11px] font-mono px-2 py-0.5 rounded border ${elemStyle.border} ${elemStyle.bg} ${elemStyle.text} font-bold`}
                      >
                        {isEnglish ? ELEMENT_EN[card.element] || card.element : `ธาตุ${card.element}`}
                      </span>
                    </td>

                    {/* Upright Keywords */}
                    <td className="py-3 px-3 sm:px-4">
                      <div className="flex flex-wrap gap-1">
                        {uprightKws.map((kw, i) => (
                          <span
                            key={i}
                            className="text-[11px] px-1.5 py-0.5 rounded bg-surface-warm text-ink border border-line"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Reversed Keywords */}
                    <td className="py-3 px-3 sm:px-4">
                      <div className="flex flex-wrap gap-1">
                        {reversedKws.map((kw, i) => (
                          <span
                            key={i}
                            className="text-[11px] px-1.5 py-0.5 rounded bg-surface-warm/60 text-muted border border-line/70"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty Search Result */}
        {filteredCards.length === 0 && (
          <div className="p-8 text-center text-xs sm:text-sm text-muted">
            {isEnglish ? `No cards matched "${query}"` : `ไม่พบไพ่ที่ตรงกับ "${query}"`}
          </div>
        )}
      </div>
    </div>
  );
};
