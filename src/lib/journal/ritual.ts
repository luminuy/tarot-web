/**
 * ✦ ตรรกะพิธีเช้า-เย็น (REFLECTION_JOURNAL_PLAN 1.9) — ฟังก์ชันบริสุทธิ์ ทดสอบได้ ไม่แตะเครือข่าย
 *
 * streak แบบใจดี: นับ "วันที่กลับมาทบทวน" (มีบันทึกพิธีเช้า) ต่อเนื่องย้อนหลัง
 *  • ยังไม่ได้ทำวันนี้ ➔ เริ่มนับจากเมื่อวาน (ยังไม่ถือว่าขาด — วันยังไม่จบ)
 *  • พักได้สัปดาห์ละ 1 วัน (นับเป็นช่วง 7 วันย้อนจากวันเริ่มนับ) โดยไม่รีเซ็ต — ไม่สร้างความรู้สึกผิด
 *  • ขาดเกินโควตาพักของช่วงนั้น ➔ หยุดนับ
 * ⚠️ แยกจาก streak การเปิดไพ่ประจำวันของเซิร์ฟเวอร์ (`/api/daily/checkin`) ซึ่งผูกกับระบบสิทธิ์ — ห้ามรวมกัน
 */
import { APP_TIME_ZONE } from "@/lib/time/bangkok";

const DAY_MS = 86_400_000;

function addDays(dayKey: string, delta: number): string {
  const t = Date.parse(`${dayKey}T00:00:00Z`) + delta * DAY_MS;
  return new Date(t).toISOString().slice(0, 10);
}

export interface ReflectionStreak {
  /** จำนวนวันที่มาทบทวนจริงในสายต่อเนื่อง */
  days: number;
  /** วันพักที่ใช้ไปในช่วง 7 วันล่าสุด */
  restUsedThisWeek: number;
  doneToday: boolean;
}

export function reflectionStreak(ritualDays: Iterable<string>, todayKey: string, restPerWeek = 1): ReflectionStreak {
  const set = new Set(ritualDays);
  const doneToday = set.has(todayKey);
  let cursor = doneToday ? todayKey : addDays(todayKey, -1);
  let days = 0;
  let offset = 0; // นับวันที่ไล่ย้อนไปแล้ว — ใช้แบ่งช่วงสัปดาห์
  const restsByWeek = new Map<number, number>();
  // วันพักนับเป็น "ใช้แล้ว" ก็ต่อเมื่อเจอวันที่มาทบทวนถัดจากมัน — ช่องว่างปลายสายไม่ใช่วันพัก
  let pendingRestWeek: number | null = null;
  // ไล่ย้อนไม่เกิน 3 ปี (กันวนไม่รู้จบ)
  for (let guard = 0; guard < 1100; guard++) {
    const week = Math.floor(offset / 7);
    if (set.has(cursor)) {
      if (pendingRestWeek !== null) {
        restsByWeek.set(pendingRestWeek, (restsByWeek.get(pendingRestWeek) ?? 0) + 1);
        pendingRestWeek = null;
      }
      days++;
    } else {
      const used = restsByWeek.get(week) ?? 0;
      // ยังไม่เคยนับสักวัน · ขาดสองวันติด · ใช้วันพักของสัปดาห์นี้หมดแล้ว ➔ จบสาย
      if (days === 0 || pendingRestWeek !== null || used >= restPerWeek) break;
      pendingRestWeek = week;
    }
    cursor = addDays(cursor, -1);
    offset++;
  }
  return { days, restUsedThisWeek: restsByWeek.get(0) ?? 0, doneToday };
}

/** ช่วงเวลาของวันตามเวลาไทย — ใช้เลือกว่าจะชวน "เช็กอินเย็นนี้" หรือยัง */
export function bangkokHour(now: Date = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: APP_TIME_ZONE, hour: "2-digit", hour12: false }).format(now)) % 24;
}
