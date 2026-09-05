/**
 * ตัวเลขเพดานสิทธิ์ — ค่าคงที่ล้วน ไม่แตะฐานข้อมูล
 * -------------------------------------------------
 * แยกออกมาจาก `entitlement.ts` เพราะฝั่ง UI (client component) ต้องใช้ตัวเลขชุดเดียวกัน
 * แต่ห้ามลาก `getAppDB()` เข้า bundle ฝั่งเบราว์เซอร์
 *
 * ⚠️ ห้าม hardcode ตัวเลขสิทธิ์ซ้ำที่อื่นเด็ดขาด — ทั้งข้อความบนหน้าเว็บและ logic ฝั่ง server
 * ต้องอ้างจากไฟล์นี้ที่เดียว (บทเรียน: ข้อความ "สัปดาห์ละ 3 ครั้ง" ค้างอยู่ 4 จุดหลังเปลี่ยนเป็นรายวัน)
 */

/** ผู้เยี่ยมชมที่ยังไม่สมัคร: ทดลองฟรีได้กี่ครั้ง (ตลอดชีพ) */
export const GUEST_LIMIT = 1;

/** สมาชิก: เปิดไพ่ได้กี่ครั้งต่อวัน (รีเซ็ตเที่ยงคืนเวลาไทย) */
export const DAILY_LIMIT = 3;

/** compatibility alias — โค้ดเก่าบางจุดยังเรียกชื่อนี้ */
export const WEEKLY_LIMIT = DAILY_LIMIT;

/**
 * โบนัสก้อนที่แจกให้ตอนสมัครสมาชิกใหม่
 *
 * ⚠️ ตั้งเป็น 0 ตามคำสั่งเจ้าของโปรเจกต์ (2026-09-02): **ไม่ทำระบบโบนัสสะสมแจกฟรี**
 * สมาชิกได้สิทธิ์รายวันอย่างเดียว ส่วนตาราง `user_bonus` ยังใช้อยู่ —
 * แต่ใช้เก็บ "รอบที่เติมไว้" จากการซื้อแพ็กเกจเท่านั้น (ดู api/entitlement/checkout/confirm)
 */
export const SIGNUP_BONUS = 0;

/** โบนัสชดเชยผู้ใช้เดิมก่อนเปิดระบบสิทธิ์ */
export const GRANDFATHER_BONUS = 10;

/** ผังมาตรฐาน (10 ผัง) ที่เปิดให้สมาชิกทั่วไปและผู้เยี่ยมชมใช้ฟรี เพื่อลด bounce rate ตามแผน SEO */
export const STANDARD_SPREAD_IDS = new Set([
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

export function isStandardSpread(spreadId: string): boolean {
  return STANDARD_SPREAD_IDS.has(spreadId);
}

/** 2 ปรมาจารย์ลับที่สงวนไว้สำหรับผู้ถือสิทธิ์ญาณพยากรณ์พิเศษ (Paid / Credits / Unlimited) */
export const MASTER_PERSONA_IDS = new Set(["master", "mystic"]);

export function isMasterPersona(personaId: string): boolean {
  return MASTER_PERSONA_IDS.has(personaId);
}

