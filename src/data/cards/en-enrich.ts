import { CARD_KEYWORDS_EN } from "./keywords-en";
import { CARD_MEANINGS_EN } from "./meanings-en";
import type { TarotCard } from "./types";

/**
 * เติมเนื้อหาภาษาอังกฤษให้ไพ่ใบเดียว — โหลดแยกเป็น chunk ต่างหาก
 * ฝั่ง client เรียกไฟล์นี้เฉพาะตอน locale เป็น EN เท่านั้น
 * ตรรกะการผสมตรงกับ `DECK` ใน `./index.ts` ทุกฟิลด์
 */
export function enrichCardEn(card: TarotCard): TarotCard {
  const enData = CARD_MEANINGS_EN[card.id];
  const enKeywords = CARD_KEYWORDS_EN[card.id];
  return {
    ...card,
    keywordsEn: enKeywords || card.keywordsEn,
    meaningsEn: enData?.meanings,
    astrologyEn: enData?.astrology,
    numerologyEn: enData?.numerology,
  };
}
