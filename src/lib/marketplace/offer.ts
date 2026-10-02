/**
 * 🧾 ข้อมูลบริการปรึกษาแม่หมอตัวจริงที่แสดงบนหน้าเว็บ — แหล่งความจริงเดียว
 * ---------------------------------------------------------------------------
 * ไฟล์นี้ **ห้าม import ฐานข้อมูล** เพราะคอมโพเนนต์ฝั่งเบราว์เซอร์ (หน้าคิว · หน้ารวมแม่หมอ ·
 * หน้าต่างจองคิว) ใช้ร่วมกัน · ยอดที่เรียกเก็บจริงคำนวณจากค่านี้ใน `payments.repo.ts`
 * เดิมราคา "299 บาท (30 นาที)" ถูกพิมพ์ตายตัวไว้สามที่ แก้ราคาทีเดียวต้องไล่แก้สามไฟล์
 */

export const CONSULTATION_PRICE_THB = 299;
export const CONSULTATION_MINUTES = 30;

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
