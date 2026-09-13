import { NextResponse } from "next/server";

import { getDailyStreak, recordDailyReading, todayDateKey } from "@/lib/entitlement/daily";
import { getViewer } from "@/lib/entitlement/viewer";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { recordEvent } from "@/lib/stats/record";

export const runtime = "nodejs";

/**
 * POST /api/daily/checkin — บันทึก "วันนี้เปิดไพ่ประจำวันแล้ว" แล้วคืนจำนวนวันต่อเนื่อง
 * ---------------------------------------------------------------------------------
 * ⚠️ ทำไมต้องมีเส้นนี้ (ของเดิมพังเงียบมาตลอด):
 * `recordDailyReading()` ถูกเรียกที่เดียวคือใน `consumeReading()` และเรียกเฉพาะตอน
 * `spreadId === "daily"` ซึ่งเกิดได้จากผังในหน้าแรกเท่านั้น — แต่หน้า `/daily`
 * (ประตูหลักของคำค้น "ดูดวงไพ่ยิปซีรายวัน") ใช้ `OneCardRitual` ที่สุ่มไพ่ในเบราว์เซอร์
 * ล้วน ไม่เคยแตะเซิร์ฟเวอร์สักครั้ง ตาราง `daily_readings` ของคนกลุ่มนี้จึงว่างเปล่า
 * และ `getDailyStreak()` คืน 0 ให้ทุกคนตลอดกาล
 *
 * เส้นนี้ **ไม่หักโควตา ไม่แตะ `reading_usage`** — ไพ่ประจำวันเปิดฟรีเหมือนเดิมทุกประการ
 * หน้าที่เดียวคือประทับตราว่า "วันนี้มาแล้ว" เพื่อให้ habit loop ทำงานได้จริง
 *
 * กันยิงรัว: `daily_readings` มี UNIQUE(user_key, date_key) + `ON CONFLICT DO NOTHING`
 * ยิงซ้ำกี่ครั้งในวันเดียวกันก็ได้แถวเดียว จึงไม่ต้องมีตัวนับ rate limit แยก
 */
export async function POST(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json(
      { error: "ไม่อนุญาตให้เข้าถึง API จากภายนอก (Unauthorized Origin)" },
      { status: 403 },
    );
  }

  const viewer = await getViewer(request);
  const userKey = viewer.kind === "member" ? viewer.userId : `guest_${viewer.gid}`;

  // ผู้เยี่ยมชมที่ยังไม่มีคุกกี้จะได้ gid เดียวกันหมดคือ "anon" — ถ้าบันทึกจะกลายเป็น
  // แถวกองกลางที่ทุกคนใช้ร่วมกัน แล้วคืน streak ของคนอื่นให้คนที่เพิ่งเข้ามาครั้งแรก
  if (viewer.kind === "guest" && viewer.gid === "anon") {
    return NextResponse.json({ ok: true, streak: 0, dateKey: todayDateKey() });
  }

  try {
    const { streak } = await recordDailyReading(userKey, `daily_${todayDateKey()}`);
    recordEvent("daily_checkin");
    return NextResponse.json({ ok: true, streak, dateKey: todayDateKey() });
  } catch {
    // D1 ล่ม = แค่ไม่ได้ป้ายต่อเนื่อง ห้ามทำให้หน้าเปิดไพ่พัง — คืน streak 0 แล้วให้ UI ซ่อนป้ายไป
    const streak = await getDailyStreak(userKey).catch(() => 0);
    return NextResponse.json({ ok: false, streak, dateKey: todayDateKey() });
  }
}
