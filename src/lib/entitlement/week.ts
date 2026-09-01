/**
 * กุญแจสัปดาห์สำหรับโควตาเปิดไพ่ของสมาชิก
 * ---------------------------------------
 * ตัดสัปดาห์แบบ "ปฏิทิน เริ่มจันทร์ 00:00 เวลาไทย" (ENTITLEMENT_PLAN ข้อ 2)
 * ไม่ใช้เลขสัปดาห์ ISO เพราะมีกับดักคาบปีและไลบรารีคำนวณไม่ตรงกัน
 * ไทยเป็น UTC+7 คงที่ ไม่มี DST จึงบวกออฟเซ็ตตรง ๆ ได้อย่างปลอดภัย
 */

const BKK_OFFSET_MS = 7 * 60 * 60 * 1000;

/** คืนวันที่ของวันจันทร์ต้นสัปดาห์ตามเวลาไทย เช่น '2026-08-31' */
export function weekKey(now: Date = new Date()): string {
  const bkk = new Date(now.getTime() + BKK_OFFSET_MS);
  const daysSinceMonday = (bkk.getUTCDay() + 6) % 7; // อาทิตย์=0 → 6, จันทร์=1 → 0
  bkk.setUTCDate(bkk.getUTCDate() - daysSinceMonday);
  bkk.setUTCHours(0, 0, 0, 0);
  return bkk.toISOString().slice(0, 10);
}

/** เวลาที่โควตาจะรีเซ็ต = จันทร์ถัดไป 00:00 เวลาไทย (ISO string สำหรับส่งให้ UI) */
export function nextResetAt(now: Date = new Date()): string {
  const monday = new Date(weekKey(now) + "T00:00:00Z");
  monday.setUTCDate(monday.getUTCDate() + 7);
  return new Date(monday.getTime() - BKK_OFFSET_MS).toISOString();
}
