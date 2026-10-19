import { NextResponse } from "next/server";
import { claimMorning, listMorningDue, recordPushResult } from "@/lib/push/push.repo";
import { sendWebPush, vapidConfigured } from "@/lib/push/webpush";
import { bangkokDayKey } from "@/lib/time/bangkok";
import { bangkokHour } from "@/lib/journal/ritual";
import { recordEvent } from "@/lib/stats/record";

export const runtime = "nodejs";

/**
 * POST /api/cron/push-reminders — เตือนพิธีเช้าตามชั่วโมงที่ผู้ใช้เลือกเอง (REFLECTION_JOURNAL_PLAN 1.9 · 1.10)
 * ตัวจับเวลา: `.github/workflows/push-reminders.yml` ทุกชั่วโมง · ความลับ CRON_SECRET · fail-closed
 * กันส่งซ้ำด้วย last_morning_day · ยังไม่ตั้ง VAPID = ไม่ทำอะไร (ตอบ 200 พร้อมเหตุผล)
 * เนื้อหาเป็นข้อความกลาง ๆ ไม่มีข้อมูลส่วนตัวใด ๆ
 *
 * A3-05: รอบที่ตั้งไว้ทุกชั่วโมงมาจริงไม่ครบ (ห่างกันได้หลายชั่วโมง) — แต่ละรอบจึงตามส่งชั่วโมงที่หลุดไป
 * ย้อนหลังไม่เกิน `CATCH_UP_HOURS` และวนดึงทีละชุดจนหมดคิว (ไม่ตัดคนเกิน 300 คนแรกทิ้งทุกวัน)
 */
const BATCH_SIZE = 300;
/** เพดานรวมต่อรอบ — กันรอบเดียววิ่งนานเกินเวลาที่แพลตฟอร์มให้ · ที่เหลือรอบถัดไปตามส่งต่อ (เรียงคนที่รอนานสุดก่อน) */
const MAX_PER_RUN = 900;
/** ส่งช้ากว่าเวลาที่ผู้ใช้เลือกได้ไม่เกินกี่ชั่วโมง */
const CATCH_UP_HOURS = 4;
/** เวลาทำงานต่อรอบ (มิลลิวินาที) — เหลือเผื่อก่อนเพดาน `--max-time` ของ workflow */
const RUN_BUDGET_MS = 120_000;

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const COPY = {
  th: { title: "พิธีเช้า 2 นาที", body: "เปิดไพ่ประจำวัน แล้วถามตัวเองสักข้อก่อนเริ่มวัน", url: "/daily?utm_source=push" },
  en: { title: "Your two-minute morning ritual", body: "Draw today's card and ask yourself one question before the day begins.", url: "/en/daily?utm_source=push" },
};

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const presented = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!secret || !presented || !timingSafeEqual(presented, secret)) return new NextResponse(null, { status: 401 });
  if (!vapidConfigured()) return NextResponse.json({ ok: true, skipped: "vapid_not_configured" });

  const hour = bangkokHour();
  const day = bangkokDayKey();
  const startedAt = Date.now();
  let scanned = 0;
  let sent = 0;
  let failed = 0;
  // วนดึงจนหมดคิว — แถวที่จองแล้วหลุดจากเงื่อนไขเอง · ชุดที่จองไม่ได้สักแถว (ที่เก็บล่ม) = หยุด ไม่วนซ้ำ
  while (scanned < MAX_PER_RUN && Date.now() - startedAt < RUN_BUDGET_MS) {
    const due = await listMorningDue(hour, day, Math.min(BATCH_SIZE, MAX_PER_RUN - scanned), CATCH_UP_HOURS);
    if (due.length === 0) break;
    scanned += due.length;
    let claimed = 0;
    for (const sub of due) {
      if (!(await claimMorning(sub.id, day).catch(() => false))) continue;
      claimed++;
      try {
        const res = await sendWebPush(sub, { ...COPY[sub.lang], tag: "morning-ritual" }, { ttl: 3 * 3600, urgency: "low" });
        await recordPushResult(sub.id, res);
        if (res.ok) sent++;
        else failed++;
      } catch {
        failed++;
        await recordPushResult(sub.id, { ok: false, gone: false }).catch(() => {});
      }
    }
    if (claimed === 0 || due.length < BATCH_SIZE) break;
  }
  if (sent > 0) recordEvent("push_morning_sent", sent);
  return NextResponse.json({ ok: true, hour, scanned, sent, failed });
}
