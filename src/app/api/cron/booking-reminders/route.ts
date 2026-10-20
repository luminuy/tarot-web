import { NextResponse } from "next/server";

import { getNextAvailableSlot } from "@/lib/marketplace/booking.repo";
import { sendBookingReminder, sendWaitlistOpening } from "@/lib/marketplace/booking-mail";
import { bkkDateKey, reminderDue } from "@/lib/marketplace/booking-policy";
import { cleanupExpiredTickets } from "@/lib/marketplace/queue.repo";
import { getAppDB } from "@/lib/platform/db";
import { bumpEdgeCounter, edgeRateLimitKey, peekEdgeCounter } from "@/lib/security/edge-ratelimit";

export const runtime = "nodejs";

/**
 * POST /api/cron/booking-reminders — งานรอบของระบบจอง (ตัวจับเวลา: `.github/workflows/booking-reminders.yml` ตั้งไว้ทุก 15 นาที แต่รันจริงไม่สม่ำเสมอ)
 * ---------------------------------------------------------------------------
 * 1. เตือนนัดทางอีเมล — ก่อน 24 ชม. และเมื่อใกล้ถึงเวลา (`reminderDue` · หน้าต่างหลายชั่วโมง) · ส่งครั้งเดียวต่อชนิด (จองสิทธิ์ในฐานข้อมูล)
 * 2. แจ้งรายชื่อรอ — แม่หมอที่มีคนลงชื่อรอ และตอนนี้มีเวลาว่างแล้ว ➔ ส่งอีเมลแล้วลบชื่อทิ้ง (PDPA)
 * 3. เก็บกวาดที่กันไว้ที่หมดเวลาจ่าย — ปล่อยเวลาว่างกลับเข้าตารางแม้ไม่มีใครเปิดหน้าคิว
 * 4. ลบข้อมูลตั๋วที่หมดอายุ 7 วัน (PDPA · `cleanupExpiredTickets`) — แถวการเงินเก็บไว้ ล้างแค่ข้อมูลส่วนบุคคล
 *
 * 🔒 fail-closed แบบเดียวกับ daily-digest: ไม่มี/ไม่ตรง `CRON_SECRET` = 401 เปล่า
 * เพดานอีเมล: ต่อรอบ 40 ฉบับ และต่อวัน (เวลาไทย) 60 ฉบับ โดยรายชื่อรอได้ไม่เกิน 20 ฉบับ/วัน —
 * Resend แผนฟรี 100 ฉบับ/วันใช้ร่วมกับอีเมลยืนยันตัวตน/รีเซ็ตรหัสผ่าน/ยืนยันนัด จึงเว้นโควตาที่เหลือไว้ให้อีเมลเหล่านั้น
 * ตัวจับเวลารันห่างกว่าที่ตั้งได้หลายชั่วโมง — ทุกขั้นจึงทำจากสถานะในฐานข้อมูล ไม่พึ่งว่ารอบก่อนรันตรงเวลา
 */

const MAX_EMAILS_PER_RUN = 40;
const MAX_EMAILS_PER_DAY = 60;
const MAX_WAITLIST_EMAILS_PER_DAY = 20;
const DAY_SEC = 86_400;
const HOUR = 3_600_000;

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const presented = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!secret || !presented || !timingSafeEqual(presented, secret)) {
    return new NextResponse(null, { status: 401 });
  }

  const db = await getAppDB();
  const now = Date.now();
  // ตัวนับอีเมลรายวันข้ามรอบ (D1) — คีย์ผูกกับวันที่ไทย หน้าต่าง 1 วันจึงไม่ล้นข้ามวัน
  const day = bkkDateKey(now);
  const dayKey = edgeRateLimitKey("mail:booking-cron:day", day);
  const waitlistDayKey = edgeRateLimitKey("mail:booking-waitlist:day", day);
  const sentToday = await peekEdgeCounter(dayKey, DAY_SEC);
  let budget = Math.max(0, Math.min(MAX_EMAILS_PER_RUN, MAX_EMAILS_PER_DAY - sentToday));
  let waitlistBudget = Math.max(0, MAX_WAITLIST_EMAILS_PER_DAY - (await peekEdgeCounter(waitlistDayKey, DAY_SEC)));
  const countSent = async (waitlist: boolean) => {
    budget--;
    await bumpEdgeCounter(dayKey, DAY_SEC);
    if (waitlist) {
      waitlistBudget--;
      await bumpEdgeCounter(waitlistDayKey, DAY_SEC);
    }
  };
  const summary = { reminders24h: 0, reminders1h: 0, waitlist: 0, holdsReleased: 0, purged: 0 };

  // 3 ก่อน — ปล่อยที่ที่หมดเวลาจ่ายเงิน (ตั๋วยังรอจ่าย ➔ หมดเวลา)
  const lapsed = await db
    .prepare("SELECT ticket_id FROM bookings WHERE status = 'reserved' AND hold_expires_at < ? LIMIT 200")
    .bind(now)
    .all<{ ticket_id: string }>();
  for (const row of lapsed.results || []) {
    await db
      .prepare("UPDATE bookings SET status = 'expired', cancelled_at = ?, cancelled_by = 'system' WHERE ticket_id = ? AND status = 'reserved'")
      .bind(now, row.ticket_id)
      .run();
    await db.prepare("UPDATE queue_tickets SET status = 'expired' WHERE id = ? AND status = 'pending_payment'").bind(row.ticket_id).run();
    summary.holdsReleased++;
  }

  // 1. เตือนนัด — นัดที่ยืนยันแล้ว ตั๋วยังรออยู่ มีอีเมล และยังไม่ได้เตือนชนิดนั้น
  const upcoming = await db
    .prepare(
      `SELECT b.ticket_id, b.slot_start, b.created_at, b.reminder_24h_at, b.reminder_1h_at
         FROM bookings b JOIN queue_tickets t ON t.id = b.ticket_id
        WHERE b.kind = 'scheduled' AND b.status = 'confirmed' AND t.status = 'waiting'
          AND b.contact_email IS NOT NULL AND b.slot_start > ? AND b.slot_start <= ?
        ORDER BY b.slot_start ASC LIMIT 200`
    )
    .bind(now, now + 25 * HOUR)
    .all<{ ticket_id: string; slot_start: number; created_at: number; reminder_24h_at: number | null; reminder_1h_at: number | null }>();
  for (const b of upcoming.results || []) {
    if (budget <= 0) break;
    const kind = reminderDue(Number(b.slot_start), Number(b.created_at), now);
    if (!kind) continue;
    if (kind === "24h" && b.reminder_24h_at) continue;
    if (kind === "1h" && b.reminder_1h_at) continue;
    if (await sendBookingReminder(b.ticket_id, kind)) {
      await countSent(false);
      if (kind === "24h") summary.reminders24h++;
      else summary.reminders1h++;
    }
  }

  // 2. รายชื่อรอเวลาว่าง
  const waiting = await db
    .prepare(
      `SELECT w.reader_id, r.display_name FROM booking_waitlist w JOIN readers r ON r.id = w.reader_id
        WHERE r.status = 'approved' GROUP BY w.reader_id, r.display_name LIMIT 50`
    )
    .all<{ reader_id: string; display_name: string }>();
  for (const reader of waiting.results || []) {
    if (budget <= 0 || waitlistBudget <= 0) break;
    const next = await getNextAvailableSlot(reader.reader_id, now);
    if (!next) continue;
    const entries = await db
      .prepare("SELECT id, email FROM booking_waitlist WHERE reader_id = ? ORDER BY created_at ASC LIMIT ?")
      .bind(reader.reader_id, Math.min(budget, waitlistBudget))
      .all<{ id: string; email: string }>();
    for (const entry of entries.results || []) {
      // ลบก่อนส่ง — ส่งพลาดก็ไม่วนส่งซ้ำทุก 15 นาที (ลูกค้ายังลงชื่อใหม่เองได้)
      const del = await db.prepare("DELETE FROM booking_waitlist WHERE id = ?").bind(entry.id).run();
      if ((del.meta?.changes ?? 0) === 0) continue;
      if (await sendWaitlistOpening(entry.email, reader.reader_id, reader.display_name, next)) summary.waitlist++;
      await countSent(true);
    }
  }

  // 4. ลบข้อมูลตั๋วที่หมดอายุ — ล้มก็ไม่ทำให้งานเตือนนัดข้างบนเสียผล (รอบหน้าทำต่อเอง)
  try {
    summary.purged = await cleanupExpiredTickets();
  } catch (err) {
    console.error("[cron booking-reminders] cleanupExpiredTickets failed", err);
  }

  return NextResponse.json({ ok: true, ...summary });
}
