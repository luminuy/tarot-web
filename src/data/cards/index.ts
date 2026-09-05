import { CUPS } from "./cups";
import { MAJOR_A } from "./major-a";
import { MAJOR_B } from "./major-b";
import { PENTACLES } from "./pentacles";
import { SWORDS } from "./swords";
import type { TarotCard } from "./types";
import { WANDS } from "./wands";

import { CARD_KEYWORDS_EN } from "./keywords-en";
import { CARD_MEANINGS_EN } from "./meanings-en";

/**
 * สำรับไพ่ 78 ใบ
 *
 * **ลำดับในอาร์เรย์นี้คือ cardIndex ที่ใช้จั่วไพ่ และห้ามเปลี่ยนเด็ดขาด**
 * เพราะผลการเปิดไพ่ในอดีตถูกเก็บเป็นตัวเลข index ไว้ในฐานข้อมูล
 * ถ้าสลับลำดับ การเปิดไพ่เก่าทุกครั้งจะกลายเป็นไพ่คนละใบ
 * และหลักฐานความสุ่มที่เคยให้ผู้ใช้ตรวจไว้จะพิสูจน์ไม่ได้อีกต่อไป
 *
 *   0-21  Major Arcana
 *   22-35 Wands
 *   36-49 Cups
 *   50-63 Swords
 *   64-77 Pentacles
 */
export const DECK: readonly TarotCard[] = Object.freeze(
  [
    ...MAJOR_A,
    ...MAJOR_B,
    ...WANDS,
    ...CUPS,
    ...SWORDS,
    ...PENTACLES,
  ].map((card) => {
    const enData = CARD_MEANINGS_EN[card.id];
    const enKeywords = CARD_KEYWORDS_EN[card.id];
    return {
      ...card,
      keywordsEn: enKeywords || card.keywordsEn,
      meaningsEn: enData?.meanings,
      astrologyEn: enData?.astrology,
      numerologyEn: enData?.numerology,
    };
  })
);

export const DECK_SIZE = DECK.length;

export const ALL_CARDS = DECK;
export const TOTAL_CARDS = DECK_SIZE;

const BY_ID = new Map(DECK.map((card) => [card.id, card]));

export function cardById(id?: string | null): TarotCard | undefined {
  if (!id) return undefined;
  const direct = BY_ID.get(id);
  if (direct) return direct;
  // กรณีระบุ id เป็นตัวเลข เช่น "1", "6", "21" ให้ fallback หาจาก major หรือ index
  if (/^\d+$/.test(id)) {
    const num = parseInt(id, 10);
    if (num >= 0 && num <= 21) {
      const pad = String(num).padStart(2, "0");
      const major = BY_ID.get(`major-${pad}`);
      if (major) return major;
    }
    return cardByIndex(num);
  }
  return undefined;
}

export function cardByIndex(index?: number | null): TarotCard | undefined {
  if (index === null || index === undefined) return undefined;
  if (typeof index !== "number" || !Number.isInteger(index)) return undefined;
  if (index >= 0 && index < DECK.length) {
    return DECK[index];
  }
  return undefined;
}

export type { TarotCard } from "./types";

