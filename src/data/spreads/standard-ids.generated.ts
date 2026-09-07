/**
 * 🎯 STANDARD_SPREAD_IDS (Generated Constant)
 * ---------------------------------------------------------------------------
 * ผังมาตรฐาน 10 ผังที่เปิดให้สมาชิกทั่วไปและผู้เยี่ยมชมทดลองเปิดฟรี
 * แยกออกมาจาก `src/data/spreads.ts` (85 KB) เพื่อไม่ให้ client components
 * ที่ต้องการเพียง Set ของ ID ดึงข้อมูลผังทั้ง 25 แบบพร้อมพิกัดเข้าบันเดิล
 *
 * ⚠️ แหล่งความจริงยังอยู่ที่ SPREADS (guestAllowed: true) ตามกฎ INC-0005
 * มีด่านตรวจ scripts/qa/test-feature-gating.ts ยืนยันว่าค่าในไฟล์นี้ตรงกับ SPREADS 100%
 */

export const STANDARD_SPREAD_IDS: ReadonlySet<string> = new Set([
  "daily",
  "quick",
  "yes-no",
  "three-card",
  "situation-solution",
  "mind-body-spirit",
  "how-they-feel",
  "family",
  "luck",
  "study",
]);
