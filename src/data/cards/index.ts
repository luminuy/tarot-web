import { CUPS } from "./cups";
import { MAJOR_A } from "./major-a";
import { MAJOR_B } from "./major-b";
import { PENTACLES } from "./pentacles";
import { SWORDS } from "./swords";
import type { TarotCard } from "./types";
import { WANDS } from "./wands";

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
export const DECK: readonly TarotCard[] = Object.freeze([
  ...MAJOR_A,
  ...MAJOR_B,
  ...WANDS,
  ...CUPS,
  ...SWORDS,
  ...PENTACLES,
]);

export const DECK_SIZE = DECK.length;

export const ALL_CARDS = DECK;
export const TOTAL_CARDS = DECK_SIZE;

const BY_ID = new Map(DECK.map((card) => [card.id, card]));

export function cardById(id?: string | null): TarotCard | undefined {
  if (!id) return undefined;
  return BY_ID.get(id);
}

export function cardByIndex(index?: number | null): TarotCard {
  if (index === null || index === undefined) return DECK[0];
  const num = typeof index === "number" ? index : Number(index);
  if (!isNaN(num) && num >= 0 && num < DECK.length) {
    return DECK[num];
  }
  return DECK[0];
}

export type { TarotCard } from "./types";

