/**
 * 🃏 แผนผังภาพไพ่ประกอบสำหรับ OpenGraph Social Share
 * -----------------------------------------------------------------
 * ไพ่ที่ใช้เป็น "ภาพประกอบตกแต่งตามหมวดหมู่" (Editorial Art) บนภาพแชร์ของแต่ละหมวด
 *
 * ⚠️ ตามกฎเหล็กข้อ 14 (Zero Fabricated Cards):
 * ไพ่ในตารางนี้ **ไม่ใช่ผลการเปิดไพ่** และห้ามนำไปแสดงในบริบทที่ทำให้ผู้ใช้เข้าใจ
 * ว่าเป็นไพ่ที่ตัวเองเปิดได้เด็ดขาด ใช้ได้เฉพาะเป็นภาพประกอบของหน้าเนื้อหา
 * ที่ไม่มีการสุ่มไพ่เท่านั้น (บทความ, คู่มือผัง, สารานุกรม, หน้าหมวดหมู่)
 *
 * ⚠️ ห้ามสุ่มไพ่ตอน runtime เด็ดขาด เพราะจะทำให้ URL เปลี่ยนไปมา
 * เผาผลาญโควตา Cloudinary และรูปพรีวิวบนโซเชียลไม่คงที่
 */

export const OG_CARD_ART: Record<string, string> = {
  // หมวดหมู่ชีวิต & บทความ
  love: "cups-02.jpg",
  career: "wands-08.jpg",
  work: "wands-08.jpg",
  money: "pentacles-10.jpg",
  study: "pentacles-08.jpg",
  family: "cups-10.jpg",
  health: "major-14.jpg",
  spreads: "major-01.jpg",
  cards: "major-00.jpg",
  wisdom: "major-09.jpg",
  self: "major-09.jpg",
  general: "major-01.jpg",

  // หมวดหมู่ไพ่ & ดอกไพ่
  major: "major-00.jpg",
  minor: "wands-01.jpg",
  wands: "wands-01.jpg",
  cups: "cups-01.jpg",
  swords: "swords-01.jpg",
  pentacles: "pentacles-01.jpg",
};

/**
 * ดึงชื่อไฟล์ภาพไพ่ 1909 ตามรหัสหมวดหมู่
 * หากไม่พบหมวดหมู่ที่ระบุ จะ fallback เป็น The Sun (major-19.jpg)
 */
export function getCategoryCardImage(category?: string | null): string {
  if (!category) return "major-19.jpg";
  const key = category.toLowerCase().trim();
  return OG_CARD_ART[key] || "major-19.jpg";
}
