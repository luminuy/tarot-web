/**
 * src/lib/entitlement/daily.ts
 * จัดการการเปิดไพ่ประจำวัน (Daily Tarot Habit Loop & Streak Tracking)
 * ไพ่ประจำวัน (ผัง 1 ใบ) เปิดฟรี 1 ครั้ง/วัน ไม่กินโควตารายสัปดาห์
 */

import { getAppDB } from "@/lib/platform/db";

const THAI_OFFSET_MS = 7 * 60 * 60 * 1000;

export function todayDateKey(now: Date = new Date()): string {
  const thaiTime = new Date(now.getTime() + THAI_OFFSET_MS);
  const year = thaiTime.getUTCFullYear();
  const month = String(thaiTime.getUTCMonth() + 1).padStart(2, "0");
  const day = String(thaiTime.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function yesterdayDateKey(now: Date = new Date()): string {
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return todayDateKey(yesterday);
}

/**
 * ตรวจสอบว่าผู้ใช้นี้ได้ใช้สิทธิ์เปิดไพ่ประจำวันฟรีของวันนี้ไปแล้วหรือยัง
 */
export async function isDailyFreeReadingUsed(userKey: string, dateKey: string = todayDateKey()): Promise<boolean> {
  if (!userKey) return false;
  try {
    const db = await getAppDB();
    const row = await db
      .prepare(`SELECT 1 AS x FROM daily_readings WHERE user_key = ? AND date_key = ? LIMIT 1`)
      .bind(userKey, dateKey)
      .first<{ x: number }>();
    return Boolean(row?.x);
  } catch {
    return false;
  }
}

/**
 * บันทึกการเปิดไพ่ประจำวันและคืนค่า streak การเปิดต่อเนื่อง
 */
export async function recordDailyReading(
  userKey: string,
  readingId: string,
  dateKey: string = todayDateKey()
): Promise<{ streak: number }> {
  if (!userKey || !readingId) return { streak: 1 };
  const db = await getAppDB();
  const now = Date.now();

  try {
    await db
      .prepare(
        `INSERT INTO daily_readings (id, user_key, date_key, reading_id, created_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(user_key, date_key) DO NOTHING`
      )
      .bind(`dr_${crypto.randomUUID()}`, userKey, dateKey, readingId, now)
      .run();
  } catch (err) {
    console.warn("[Daily Readings Record Warning]:", err);
  }

  const streak = await getDailyStreak(userKey);
  return { streak };
}

/**
 * คำนวณจำนวนวันที่เปิดไพ่ประจำวันต่อเนื่อง (Streak)
 */
export async function getDailyStreak(userKey: string): Promise<number> {
  if (!userKey) return 0;
  try {
    const db = await getAppDB();
    const rows = await db
      .prepare(
        `SELECT date_key FROM daily_readings WHERE user_key = ? ORDER BY date_key DESC LIMIT 60`
      )
      .bind(userKey)
      .all<{ date_key: string }>();

    const dateList = (rows?.results || []).map((r) => r.date_key);
    if (dateList.length === 0) return 0;

    const today = todayDateKey();
    const yesterday = yesterdayDateKey();

    // Streak ต้องมีวันของวันนี้ หรืออย่างน้อยที่สุดคือเมื่อวาน
    let currentCheck = dateList[0];
    if (currentCheck !== today && currentCheck !== yesterday) {
      return 0;
    }

    let streak = 0;
    let expectedDate = currentCheck;

    for (const d of dateList) {
      if (d === expectedDate) {
        streak++;
        // ถอยไป 1 วัน
        const parts = expectedDate.split("-").map(Number);
        const prev = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] - 1));
        const py = prev.getUTCFullYear();
        const pm = String(prev.getUTCMonth() + 1).padStart(2, "0");
        const pd = String(prev.getUTCDate()).padStart(2, "0");
        expectedDate = `${py}-${pm}-${pd}`;
      } else {
        break;
      }
    }

    return streak;
  } catch {
    return 0;
  }
}
