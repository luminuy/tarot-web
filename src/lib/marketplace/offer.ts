/**
 * 🧾 ข้อมูลบริการปรึกษาแม่หมอตัวจริงที่แสดงบนหน้าเว็บ — แหล่งความจริงเดียว
 * ---------------------------------------------------------------------------
 * ไฟล์นี้ **ห้าม import ฐานข้อมูล** เพราะคอมโพเนนต์ฝั่งเบราว์เซอร์ (หน้าคิว · หน้ารวมแม่หมอ ·
 * หน้าต่างจองคิว) ใช้ร่วมกัน · ยอดที่เรียกเก็บจริงคำนวณจากค่านี้ใน `payments.repo.ts`
 * เดิมราคา "299 บาท (30 นาที)" ถูกพิมพ์ตายตัวไว้สามที่ แก้ราคาทีเดียวต้องไล่แก้สามไฟล์
 */

export const CONSULTATION_PRICE_THB = 299;
export const CONSULTATION_MINUTES = 30;

/** เพดานราคาที่แอดมินตั้งให้แม่หมอได้ (บาท) — กันพิมพ์ผิดหลักจนลูกค้าโดนตัดเงินผิด */
export const READER_PRICE_MIN_THB = 99;
export const READER_PRICE_MAX_THB = 5000;

/** ราคาจริงของแม่หมอคนนี้ (บาท) — ไม่ได้ตั้ง = ราคากลาง · ใช้ทั้งหน้าเว็บและตอนเรียกเก็บเงิน */
export function readerPriceThb(reader: { priceThb?: number | null } | null | undefined): number {
  const p = reader?.priceThb;
  return typeof p === "number" && p >= READER_PRICE_MIN_THB && p <= READER_PRICE_MAX_THB ? p : CONSULTATION_PRICE_THB;
}

/** ป้ายราคาแบบสั้นสำหรับหน้าเว็บ เช่น "299 บาท · 30 นาที" */
export const CONSULTATION_PRICE_LABEL = `${CONSULTATION_PRICE_THB} บาท · ${CONSULTATION_MINUTES} นาที`;

/** หมวดคำถามที่ AI คัดกรองให้ (ค่าใน DB เป็นอังกฤษ) ➔ คำไทยที่ผู้ใช้อ่าน */
const CATEGORY_LABEL_TH: Record<string, string> = {
  love: "ความรัก",
  work: "การงาน",
  money: "การเงิน",
  self: "ตัวเองและจิตใจ",
  general: "เรื่องทั่วไป",
};

export function questionCategoryLabel(category: string | null | undefined): string | null {
  if (!category) return null;
  return CATEGORY_LABEL_TH[category] ?? null;
}
