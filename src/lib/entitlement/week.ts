/**
 * กุญแจสัปดาห์สำหรับโควตาเปิดไพ่ของสมาชิก
 * ---------------------------------------
 * ตัดสัปดาห์แบบ "ปฏิทิน เริ่มจันทร์ 00:00 เวลาไทย" (ENTITLEMENT_PLAN ข้อ 2)
 * ไม่ใช้เลขสัปดาห์ ISO เพราะมีกับดักคาบปีและไลบรารีคำนวณไม่ตรงกัน
 * ไทยเป็น UTC+7 คงที่ ไม่มี DST จึงบวกออฟเซ็ตตรง ๆ ได้อย่างปลอดภัย
 */

const BKK_OFFSET_MS = 7 * 60 * 60 * 1000;

/** คืนวันที่ของวันนี้ตามเวลาไทย เช่น '2026-09-01' */
export function dayKey(now: Date = new Date()): string {
  const bkk = new Date(now.getTime() + BKK_OFFSET_MS);
  return bkk.toISOString().slice(0, 10);
}

/** คืนวันที่ของวันจันทร์ต้นสัปดาห์ตามเวลาไทย เช่น '2026-08-31' (compat) */
export function weekKey(now: Date = new Date()): string {
  const bkk = new Date(now.getTime() + BKK_OFFSET_MS);
  const daysSinceMonday = (bkk.getUTCDay() + 6) % 7; // อาทิตย์=0 → 6, จันทร์=1 → 0
  bkk.setUTCDate(bkk.getUTCDate() - daysSinceMonday);
  bkk.setUTCHours(0, 0, 0, 0);
  return bkk.toISOString().slice(0, 10);
}

/** เวลาที่โควตารายวันจะรีเซ็ต = เที่ยงคืนถัดไป 00:00 เวลาไทย (ISO string สำหรับส่งให้ UI) */
export function nextResetAt(now: Date = new Date()): string {
  const today = dayKey(now);
  const tomorrow = new Date(new Date(`${today}T00:00:00+07:00`).getTime() + 24 * 60 * 60 * 1000);
  return tomorrow.toISOString();
}
