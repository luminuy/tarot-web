/**
 * 🔖 เวอร์ชันของ prompt ที่ใช้สร้างคำอ่าน
 * ⚠️ ต้องขึ้นเลขทุกครั้งที่แก้ SYSTEM_CORE_KNOWLEDGE, buildReadingMessage(),
 * ตัวอย่างมาตรฐาน หรือโมดูลวิเคราะห์ 7 ตัว — ไม่งั้นสถิติก่อน/หลังจะปนกันจนอ่านไม่ออก
 * รูปแบบ: <YYYYMMDD>-<ลำดับในวัน>
 */
export const PROMPT_VERSION = "20260911-2";

/**
 * 🔒 ลายนิ้วมือของ `SYSTEM_CORE_KNOWLEDGE` ที่ปักหมุดคู่กับ `PROMPT_VERSION` ข้างบน
 * ---------------------------------------------------------------------------
 * ที่มา: ด่านเดิมใน `scripts/qa/test-reading-quality.ts` คำนวณ hash แล้วเช็กแค่ว่า
 * `hash.length === 8` ➔ **เป็นด่านหลอกที่ตกไม่ได้เลย** ใครแก้ prompt โดยลืมขึ้นเวอร์ชัน
 * สถิติก่อน/หลังของ `reading_quality` จะปนกันเงียบ ๆ โดยไม่มีอะไรเตือน
 * (HANDOFF_AI_ACCURACY_THAI ช่องว่าง G-10)
 *
 * ตอนนี้ด่านนั้นเทียบกับค่าที่ปักหมุดไว้ตรงนี้จริง ๆ:
 *   แก้ `SYSTEM_CORE_KNOWLEDGE` แม้แต่ตัวอักษรเดียว ➔ `npm run repo:verify` **ตก**
 *   จนกว่าจะขึ้น `PROMPT_VERSION` และปักหมุด hash ใหม่พร้อมกัน
 *
 * วิธีอัปเดตเมื่อแก้ prompt โดยตั้งใจ:
 *   1. ขึ้น `PROMPT_VERSION` เป็นวันที่วันนี้
 *   2. รัน `npx tsx scripts/qa/test-reading-quality.ts` — ด่านจะพิมพ์ hash ใหม่ให้
 *   3. วาง hash ใหม่ลงตรงนี้
 *
 * คำนวณด้วย: sha256(SYSTEM_CORE_KNOWLEDGE) 16 ตัวอักษรแรก
 */
export const PROMPT_CORE_HASH = "8ec0c9b9c10c05ed";
