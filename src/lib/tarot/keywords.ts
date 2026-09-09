import { CARD_KEYWORDS_EN } from "@/data/cards/keywords-en";

/**
 * ตัวช่วยกลางสำหรับเลือก "คำสำคัญของไพ่" ให้ตรงภาษาที่ผู้ใช้เลือก
 *
 * ทำไมต้องมีไฟล์นี้: หน้าผลคำทำนายรับข้อมูลไพ่มาจากสองทาง
 *   1. `DrawnSlotCard.card` — ก้อนย่อจาก API/เซสชันที่เก็บไว้ มี `keywords` ไทยอย่างเดียว
 *   2. `cardByIndex()` — ไพ่เต็มจากสำรับ ซึ่งมี `keywordsEn` ครบ
 * ของเดิมโค้ดหยิบทางที่ 1 ก่อนเสมอ พอ `keywordsEn` ไม่มีก็ไหลไปใช้คำไทยแทน
 * ผู้ใช้โหมด EN จึงเห็นป้าย Key Themes เป็นภาษาไทย (บั๊กที่เจ้าของโปรเจกต์แจ้ง)
 *
 * ⚠️ กฎเหล็กข้อ 14: ที่นี่ไม่สร้างไพ่ใบใหม่และไม่เดาข้อมูลไพ่
 * เป็นเพียงการเปิดพจนานุกรมคำสำคัญด้วย `cardId` ของไพ่ใบที่จั่วได้จริงเท่านั้น
 * ถ้าเปิดไม่เจอจะคืนอาร์เรย์ว่าง (ซ่อนแถบคำสำคัญ) ไม่ใช่ตกกลับไปแสดงภาษาไทย
 */
export function resolveDisplayKeywords(opts: {
  cardId?: string | null;
  /** คำสำคัญไทย: รองรับทั้งอาร์เรย์แบน และอ็อบเจกต์ upright/reversed */
  keywords?: string[] | { upright?: string[]; reversed?: string[] } | null;
  keywordsEn?: { upright?: string[]; reversed?: string[] } | null;
  isReversed?: boolean;
  isEnglish: boolean;
}): string[] {
  const { cardId, keywords, keywordsEn, isReversed, isEnglish } = opts;

  if (isEnglish) {
    const en = keywordsEn || (cardId ? CARD_KEYWORDS_EN[cardId] : undefined);
    if (!en) return [];
    return (isReversed ? en.reversed : en.upright) || [];
  }

  if (Array.isArray(keywords)) return keywords;
  if (keywords && typeof keywords === "object") {
    return (isReversed ? keywords.reversed : keywords.upright) || [];
  }
  return [];
}
