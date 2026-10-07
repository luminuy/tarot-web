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
 */
const MAX_PER_RUN = 300;

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
  const due = await listMorningDue(hour, day, MAX_PER_RUN);
  let sent = 0;
  let failed = 0;
  for (const sub of due) {
    if (!(await claimMorning(sub.id, day).catch(() => false))) continue;
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
  if (sent > 0) recordEvent("push_morning_sent", sent);
  return NextResponse.json({ ok: true, hour, scanned: due.length, sent, failed });
}
