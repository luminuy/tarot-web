import { CUPS } from "./cups";
import { MAJOR_A } from "./major-a";
import { MAJOR_B } from "./major-b";
import { PENTACLES } from "./pentacles";
import { SWORDS } from "./swords";
import type { TarotCard } from "./types";
import { WANDS } from "./wands";

/**
 * สำรับ 78 ใบ "เนื้อหาไทยล้วน" — ไม่ผสมคำทำนายภาษาอังกฤษ
 *
 * ทำไมต้องมีไฟล์นี้: `./index.ts` ผสม `CARD_MEANINGS_EN` (≈126 KB gzip) เข้าไปในไพ่ทุกใบ
 * ตั้งแต่ตอนสร้าง `DECK` ทำให้ client ที่ import `@/data/cards` ได้คำทำนายอังกฤษติดไปด้วย
 * เสมอ แม้อยู่บนหน้าภาษาไทยที่ไม่ได้ใช้เลย (ทำให้ /daily · /love/1-card เกินงบบันเดิล)
 *
 * ฝั่ง client ที่ต้องการแค่จั่วไพ่ให้ import ไฟล์นี้ แล้วค่อยเติมภาษาอังกฤษด้วย
 * `./en-enrich` เฉพาะตอน locale เป็น EN
 *
 * ⚠️ **ลำดับต้องตรงกับ `DECK` ใน `./index.ts` เป๊ะ ๆ ห้ามสลับเด็ดขาด**
 * เพราะ cardIndex ถูกเก็บเป็นตัวเลขในฐานข้อมูล และใช้พิสูจน์ Provably Fair ย้อนหลัง
 * (มีด่าน `scripts/qa/test-cards.ts` ตรวจให้ว่าสองสำรับเรียงตรงกัน)
 */
export const DECK_TH: readonly TarotCard[] = Object.freeze([
  ...MAJOR_A,
  ...MAJOR_B,
  ...WANDS,
  ...CUPS,
  ...SWORDS,
  ...PENTACLES,
]);

export function cardThByIndex(index: number): TarotCard | undefined {
  return DECK_TH[index];
}
