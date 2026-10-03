import { getAppDB } from "@/lib/platform/db";
import { APP_TIME_ZONE } from "@/lib/time/bangkok";
import {
  canReschedule,
  decideCancellation,
  generateSlots,
  HOLD_MINUTES,
  MAX_RESCHEDULES,
  slotMs,
  slotRejection,
  bkkDateKey,
  BOOKING_HORIZON_DAYS,
  type SlotOptions,
  type CancelActor,
  type ScheduleRule,
  type SlotDay,
} from "@/lib/marketplace/booking-policy";
import { expireGatewayCharge, refundGatewayCharge } from "@/lib/marketplace/payment-gateway";
import { sendBookingCancelled, sendBookingConfirmed, sendBookingRescheduled } from "@/lib/marketplace/booking-mail";
import { getPaymentById, type PaymentRecord } from "@/lib/marketplace/payments.repo";
import { getQueueTicketById, ticketExpiresAt, type QueueTicket } from "@/lib/marketplace/queue.repo";

/**
 * 📅 ใบจอง (นัดล่วงหน้า + คิวสดที่จ่ายเงินแล้ว) — วงจรชีวิตทั้งหมดอยู่ไฟล์นี้ไฟล์เดียว
 * ===========================================================================
 *
 *   เลือกเวลา ➔ holdBooking (reserved · กันที่ 36 นาที) ➔ หน้าจ่ายเงิน Stripe (หมดอายุ 31 นาที)
 *            ➔ settleConsultationPayment (confirmed · ตั๋วเข้าคิว) ➔ แม่หมอเริ่มนัด ➔ done
 *                                    └➔ cancelConsultation / rescheduleBooking / markNoShow
 *
 * 🔒 หลักความรัดกุม
 * 1. **ฐานข้อมูลตัดสินการจองซ้อน** — unique index แบบมีเงื่อนไข (migrations/0020) ไม่ใช่ SELECT แล้ว INSERT
 * 2. **เงินเข้าแล้วต้องจบที่ "ได้นัด" หรือ "ได้เงินคืน" เสมอ** — ไม่มีทางที่ลูกค้าจ่ายแล้วค้างกลางทาง
 *    (ที่นั่งถูกคนอื่นจองไประหว่างรอ webhook · จ่ายซ้ำสองหน้า · ยกเลิกแล้วค่อยจ่าย ➔ คืนเงินอัตโนมัติ)
 * 3. **ทุกการเปลี่ยนสถานะมีเงื่อนไขสถานะเดิมใน WHERE** — สองคำขอแข่งกัน คำขอที่สองไม่มีผล (ไม่ใช่ทับกัน)
 * 4. **คืนเงินด้วยกุญแจกันซ้ำ** `refund_<paymentId>` — เรียกกี่ครั้งก็คืนครั้งเดียว
 */

export type BookingKind = "scheduled" | "walkup";
export type BookingStatus = "reserved" | "confirmed" | "done" | "cancelled" | "no_show" | "expired" | "paid";
export type RefundStatus = "refunded" | "none" | "failed";

export interface BookingRecord {
  id: string;
  ticketId: string;
  readerId: string;
  kind: BookingKind;
  slotStart: number;
  slotEnd: number;
  status: BookingStatus;
  holdExpiresAt: number | null;
  cancelledAt: number | null;
  cancelledBy: string | null;
  refundStatus: RefundStatus | null;
  rescheduleCount: number;
  createdAt: number;
  /** อีเมลติดต่อลูกค้า (PDPA — ใช้ส่งเรื่องนัดนี้เท่านั้น) */
  contactEmail: string | null;
}

interface RawBookingRow {
  id: string;
  ticket_id: string;
  reader_id: string;
  kind: string | null;
  slot_start: number;
  slot_end: number;
  status: string;
  hold_expires_at: number | null;
  cancelled_at: number | null;
  cancelled_by: string | null;
  refund_status: string | null;
  reschedule_count: number | null;
  created_at: number;
  contact_email?: string | null;
}

function mapBooking(row: RawBookingRow): BookingRecord {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    readerId: row.reader_id,
    kind: row.kind === "walkup" ? "walkup" : "scheduled",
    slotStart: Number(row.slot_start),
    slotEnd: Number(row.slot_end),
    status: row.status as BookingStatus,
    holdExpiresAt: row.hold_expires_at === null ? null : Number(row.hold_expires_at),
    cancelledAt: row.cancelled_at === null ? null : Number(row.cancelled_at),
    cancelledBy: row.cancelled_by,
    refundStatus: (row.refund_status as RefundStatus | null) ?? null,
    rescheduleCount: Number(row.reschedule_count ?? 0),
    createdAt: Number(row.created_at),
    contactEmail: row.contact_email ?? null,
  };
}

function isUniqueViolation(err: unknown): boolean {
  return /UNIQUE constraint failed|SQLITE_CONSTRAINT/i.test(String((err as Error)?.message ?? err));
}

/* ── ตารางรับนัดประจำสัปดาห์ ──────────────────────────────────────────────── */

export async function getScheduleRules(readerId: string): Promise<ScheduleRule[]> {
  const db = await getAppDB();
  const { results } = await db
    .prepare(
      "SELECT weekday, start_min, end_min FROM reader_availability WHERE reader_id = ? AND mode = 'scheduled' ORDER BY weekday, start_min"
    )
    .bind(readerId)
    .all<{ weekday: number; start_min: number; end_min: number }>();
  return (results || []).map((r) => ({
    weekday: Number(r.weekday),
    startMin: Number(r.start_min),
    endMin: Number(r.end_min),
  }));
}

/**
 * แทนที่ตารางทั้งชุด (แม่หมอกดบันทึกครั้งเดียวทั้งสัปดาห์)
 * นัดที่ยืนยันแล้วไม่ถูกแตะ — เปลี่ยนตารางมีผลกับเวลาว่างที่จะเปิดให้จองต่อจากนี้เท่านั้น
 */
export async function replaceScheduleRules(readerId: string, rules: ScheduleRule[]): Promise<void> {
  const db = await getAppDB();
  const now = Date.now();
  const statements = [
    db.prepare("DELETE FROM reader_availability WHERE reader_id = ? AND mode = 'scheduled'").bind(readerId),
    ...rules.map((r) =>
      db
        .prepare(
          `INSERT INTO reader_availability (
            id, reader_id, mode, weekday, start_min, end_min, slot_minutes, timezone, is_open, created_at, updated_at
          ) VALUES (?, ?, 'scheduled', ?, ?, ?, ?, ?, 1, ?, ?)`
        )
        .bind(
          `avail_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
          readerId,
          r.weekday,
          r.startMin,
          r.endMin,
          slotMs / 60000,
          APP_TIME_ZONE,
          now,
          now
        )
    ),
  ];
  if (db.batch) {
    // D1 batch = ธุรกรรมเดียว — ไม่มีช่วงที่ตารางว่างเปล่าให้คนเห็นระหว่างลบกับเขียนใหม่
    await db.batch(statements);
  } else {
    for (const s of statements) await s.run();
  }
}

/** เวลาที่ไม่ว่างแล้ว: นัดที่ยืนยัน + ที่ที่ยังกันไว้ (ยังไม่หมดเวลา) */
export async function listTakenSlots(readerId: string, nowMs: number): Promise<Set<number>> {
  const db = await getAppDB();
  const { results } = await db
    .prepare(
      `SELECT slot_start FROM bookings
        WHERE reader_id = ? AND kind = 'scheduled' AND slot_start >= ? AND slot_start <= ?
          AND (status = 'confirmed' OR (status = 'reserved' AND hold_expires_at >= ?))`
    )
    .bind(readerId, nowMs - slotMs, nowMs + (BOOKING_HORIZON_DAYS + 1) * 86_400_000, nowMs)
    .all<{ slot_start: number }>();
  return new Set((results || []).map((r) => Number(r.slot_start)));
}

/** วันหยุดรายวันของแม่หมอ (เฉพาะวันนี้เป็นต้นไป) */
export async function getBlockedDates(readerId: string, nowMs = Date.now()): Promise<string[]> {
  const db = await getAppDB();
  const { results } = await db
    .prepare("SELECT date_key FROM reader_blocked_dates WHERE reader_id = ? AND date_key >= ? ORDER BY date_key")
    .bind(readerId, bkkDateKey(nowMs))
    .all<{ date_key: string }>();
  return (results || []).map((r) => r.date_key);
}

/** แทนที่วันหยุดทั้งชุด (เฉพาะวันนี้เป็นต้นไป — วันที่ผ่านไปแล้วลบทิ้งด้วย ไม่ต้องเก็บ) */
export async function replaceBlockedDates(readerId: string, dates: string[]): Promise<void> {
  const db = await getAppDB();
  const now = Date.now();
  const statements = [
    db.prepare("DELETE FROM reader_blocked_dates WHERE reader_id = ?").bind(readerId),
    ...[...new Set(dates)].map((d) =>
      db
        .prepare("INSERT INTO reader_blocked_dates (reader_id, date_key, created_at) VALUES (?, ?, ?)")
        .bind(readerId, d, now)
    ),
  ];
  if (db.batch) await db.batch(statements);
  else for (const st of statements) await st.run();
}

/** ตั้งค่าที่มีผลกับเวลาว่าง: วันหยุด · เวลาพัก · เพดานต่อวัน */
export async function getSlotOptions(readerId: string, nowMs = Date.now()): Promise<SlotOptions> {
  const db = await getAppDB();
  const row = await db
    .prepare("SELECT buffer_min, daily_cap FROM readers WHERE id = ? LIMIT 1")
    .bind(readerId)
    .first<{ buffer_min: number | null; daily_cap: number | null }>();
  return {
    blockedDates: new Set(await getBlockedDates(readerId, nowMs)),
    bufferMin: Number(row?.buffer_min ?? 0) || 0,
    dailyCap: row?.daily_cap && row.daily_cap > 0 ? Number(row.daily_cap) : null,
  };
}

export async function getAvailableSlots(readerId: string, nowMs = Date.now()): Promise<SlotDay[]> {
  const rules = await getScheduleRules(readerId);
  if (rules.length === 0) return [];
  return generateSlots(rules, nowMs, await listTakenSlots(readerId, nowMs), await getSlotOptions(readerId, nowMs));
}

/**
 * ด่านฝั่งเซิร์ฟเวอร์ก่อนกันที่/เลื่อนนัด — ตาราง · วันหยุด · ช่องว่าง · เวลาพัก · เพดานต่อวัน
 * `ownSlot` = เวลานัดเดิมของคนที่กำลังเลื่อน (ไม่นับเป็นเวลาที่ชนตัวเอง)
 */
export async function checkSlotBookable(
  readerId: string,
  slotStart: number,
  nowMs = Date.now(),
  ownSlot?: number | null
): Promise<string | null> {
  const taken = await listTakenSlots(readerId, nowMs);
  if (ownSlot) taken.delete(ownSlot);
  return slotRejection(await getScheduleRules(readerId), nowMs, slotStart, taken, await getSlotOptions(readerId, nowMs));
}

/** เวลาว่างใกล้สุดของแม่หมอ (หน้าโปรไฟล์) — null = ยังไม่เปิดตาราง หรือเต็มทุกช่องใน 14 วัน */
export async function getNextAvailableSlot(readerId: string, nowMs = Date.now()): Promise<number | null> {
  const days = await getAvailableSlots(readerId, nowMs);
  return days[0]?.slots[0] ?? null;
}

/* ── ใบจอง ───────────────────────────────────────────────────────────────── */

export async function getBookingByTicketId(ticketId: string): Promise<BookingRecord | null> {
  const db = await getAppDB();
  const row = await db
    .prepare("SELECT * FROM bookings WHERE ticket_id = ? ORDER BY created_at DESC LIMIT 1")
    .bind(ticketId)
    .first<RawBookingRow>();
  return row ? mapBooking(row) : null;
}

export async function getBookingsByTicketIds(ticketIds: string[]): Promise<Map<string, BookingRecord>> {
  const out = new Map<string, BookingRecord>();
  if (ticketIds.length === 0) return out;
  const db = await getAppDB();
  const { results } = await db
    .prepare(`SELECT * FROM bookings WHERE ticket_id IN (${ticketIds.map(() => "?").join(",")}) ORDER BY created_at ASC`)
    .bind(...ticketIds)
    .all<RawBookingRow>();
  for (const row of results || []) out.set(row.ticket_id, mapBooking(row));
  return out;
}

export async function listPaymentsForTicket(ticketId: string): Promise<PaymentRecord[]> {
  const db = await getAppDB();
  const { results } = await db
    .prepare("SELECT id FROM payments WHERE ticket_id = ? ORDER BY created_at ASC")
    .bind(ticketId)
    .all<{ id: string }>();
  const out: PaymentRecord[] = [];
  for (const r of results || []) {
    const p = await getPaymentById(r.id);
    if (p) out.push(p);
  }
  return out;
}

export type HoldResult = { ok: true; booking: BookingRecord } | { ok: false; reason: "slot_taken" };

/**
 * กันที่ไว้ระหว่างรอจ่ายเงิน
 * - นัดล่วงหน้า: ปล่อยที่ที่หมดเวลากันแล้วของ "ช่องนี้" ก่อน แล้ว INSERT — unique index เป็นคนตัดสินคนชนะ
 * - คิวสด: ไม่มีเวลานัด (slot = ตอนนี้) และไม่อยู่ใน unique index
 */
export async function holdBooking(input: {
  ticketId: string;
  readerId: string;
  kind: BookingKind;
  slotStart: number;
  nowMs?: number;
  /** อีเมลสมาชิกที่ล็อกอินอยู่ (ถ้ามี) — อีเมลที่กรอกในหน้า Stripe จะมาแทนตอนเงินเข้า */
  contactEmail?: string | null;
}): Promise<HoldResult> {
  const db = await getAppDB();
  const now = input.nowMs ?? Date.now();
  if (input.kind === "scheduled") {
    await db
      .prepare(
        `UPDATE bookings SET status = 'expired'
          WHERE reader_id = ? AND slot_start = ? AND kind = 'scheduled' AND status = 'reserved' AND hold_expires_at < ?`
      )
      .bind(input.readerId, input.slotStart, now)
      .run();
  }
  const booking: BookingRecord = {
    id: `book_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
    ticketId: input.ticketId,
    readerId: input.readerId,
    kind: input.kind,
    slotStart: input.slotStart,
    slotEnd: input.slotStart + slotMs,
    status: "reserved",
    holdExpiresAt: now + HOLD_MINUTES * 60_000,
    cancelledAt: null,
    cancelledBy: null,
    refundStatus: null,
    rescheduleCount: 0,
    createdAt: now,
    contactEmail: input.contactEmail ?? null,
  };
  try {
    await db
      .prepare(
        `INSERT INTO bookings (id, ticket_id, reader_id, kind, slot_start, slot_end, status, hold_expires_at, reschedule_count, created_at, contact_email)
         VALUES (?, ?, ?, ?, ?, ?, 'reserved', ?, 0, ?, ?)`
      )
      .bind(
        booking.id,
        booking.ticketId,
        booking.readerId,
        booking.kind,
        booking.slotStart,
        booking.slotEnd,
        booking.holdExpiresAt,
        booking.createdAt,
        input.contactEmail ?? null
      )
      .run();
  } catch (err) {
    if (isUniqueViolation(err)) return { ok: false, reason: "slot_taken" };
    throw err;
  }
  return { ok: true, booking };
}

/** ปล่อยที่ที่กันไว้ทันที (สร้างหน้าจ่ายเงินไม่สำเร็จ / ลูกค้ายกเลิกก่อนจ่าย / หน้าจ่ายหมดอายุ) */
export async function releaseHold(ticketId: string, ticketStatus: "cancelled" | "expired", by: CancelActor | "system"): Promise<void> {
  const db = await getAppDB();
  const now = Date.now();
  await db
    .prepare(
      `UPDATE bookings SET status = ?, cancelled_at = ?, cancelled_by = ?
        WHERE ticket_id = ? AND status = 'reserved'`
    )
    .bind(ticketStatus === "cancelled" ? "cancelled" : "expired", now, by, ticketId)
    .run();
  await db
    .prepare("UPDATE queue_tickets SET status = ? WHERE id = ? AND status = 'pending_payment'")
    .bind(ticketStatus, ticketId)
    .run();
}

/**
 * ตั๋วที่รอจ่ายเงินจนเลยเวลากันที่ ➔ ปิดเป็น "หมดเวลา" (เรียกตอนอ่านตั๋ว — ไม่ต้องมี cron)
 * ถ้าเงินมาถึงทีหลังจริง settle จะพยายามจองคืนให้ ไม่ได้ก็คืนเงิน
 */
export async function expireLapsedHold(ticket: QueueTicket, nowMs = Date.now()): Promise<boolean> {
  if (ticket.status !== "pending_payment") return false;
  const booking = await getBookingByTicketId(ticket.id);
  if (!booking || booking.status !== "reserved" || (booking.holdExpiresAt ?? 0) >= nowMs) return false;
  await releaseHold(ticket.id, "expired", "system");
  return true;
}

/**
 * คืนเงินหนึ่งรายการ — ตั้งธง `refund_due` ก่อนยิง Stripe เสมอ
 * คืนไม่สำเร็จ ธงค้างไว้ให้ webhook รอบถัดไป (Stripe ยิงซ้ำเมื่อเราตอบ 500) หรือแอดมินตามคืนต่อ
 */
async function refundPaymentRecord(payment: PaymentRecord): Promise<boolean> {
  const db = await getAppDB();
  if (payment.status === "refunded") return true;
  await db.prepare("UPDATE payments SET refund_due = 1, updated_at = ? WHERE id = ?").bind(Date.now(), payment.id).run();
  const result = await refundGatewayCharge(payment.providerRef ?? "", `refund_${payment.id}`);
  if (!result.ok) return false;
  await db
    .prepare("UPDATE payments SET status = 'refunded', refund_due = 0, updated_at = ? WHERE id = ? AND status = 'paid'")
    .bind(Date.now(), payment.id)
    .run();
  return true;
}

async function isRefundDue(paymentId: string): Promise<boolean> {
  const db = await getAppDB();
  const row = await db
    .prepare("SELECT refund_due FROM payments WHERE id = ? LIMIT 1")
    .bind(paymentId)
    .first<{ refund_due: number }>();
  return Number(row?.refund_due ?? 0) === 1;
}

export type SettleState = "confirmed" | "already" | "refunded" | "refund_failed" | "not_found";

/**
 * ✅ จุดเดียวที่เปลี่ยน "เงินเข้า" เป็น "ได้นัด" — เรียกจาก webhook (ลายเซ็นผ่านแล้ว)
 * และจากปลายทางกลับจาก Stripe (เซิร์ฟเวอร์ถาม Stripe เองแล้วว่าจ่ายจริง)
 *
 * idempotent: แถว payments ถูก "จอง" ด้วย UPDATE ... WHERE status IN ('pending','failed')
 * คำขอที่สองที่มาพร้อมกันจะได้ changes = 0 แล้วตอบ `already` ไม่ทำซ้ำ
 */
export async function settleConsultationPayment(
  paymentId: string,
  opts: { webhookLog?: string; nowMs?: number; email?: string | null } = {}
): Promise<SettleState> {
  const db = await getAppDB();
  const now = opts.nowMs ?? Date.now();
  const payment = await getPaymentById(paymentId);
  if (!payment || !payment.ticketId) return "not_found";
  // รอบก่อนคืนเงินไม่สำเร็จ (Stripe ยิง webhook ซ้ำเพราะเราตอบ 500) ➔ ลองคืนอีกครั้ง
  if (payment.status === "paid" && (await isRefundDue(payment.id))) {
    const ok = await refundPaymentRecord(payment);
    if (ok && payment.bookingId) {
      await db
        .prepare("UPDATE bookings SET refund_status = 'refunded' WHERE id = ? AND refund_status = 'failed'")
        .bind(payment.bookingId)
        .run();
    }
    return ok ? "refunded" : "refund_failed";
  }
  if (payment.status === "paid" || payment.status === "refunded") return "already";

  const claim = await db
    .prepare(
      `UPDATE payments SET status = 'paid', webhook_log = COALESCE(?, webhook_log), updated_at = ?
        WHERE id = ? AND status IN ('pending', 'failed')`
    )
    .bind(opts.webhookLog ?? null, now, paymentId)
    .run();
  if ((claim.meta?.changes ?? 0) === 0) return "already";
  const paid: PaymentRecord = { ...payment, status: "paid" };
  // อีเมลที่ลูกค้ากรอกในหน้าจ่ายเงิน — ใช้ส่งยืนยัน/เตือนนัด/แจ้งคืนเงิน (ทับอีเมลบัญชีได้ เพราะเป็นอีเมลที่เขาเพิ่งพิมพ์เอง)
  if (opts.email && payment.bookingId) {
    await db.prepare("UPDATE bookings SET contact_email = ? WHERE id = ?").bind(opts.email, payment.bookingId).run();
  }

  const refund = async (reason: string): Promise<SettleState> => {
    console.warn("[Booking] เงินเข้าแต่ให้นัดไม่ได้ ➔ คืนเงินอัตโนมัติ", { paymentId, reason });
    const ok = await refundPaymentRecord(paid);
    await db
      .prepare(
        `UPDATE bookings SET refund_status = ? WHERE id = ? AND status IN ('cancelled', 'expired')`
      )
      .bind(ok ? "refunded" : "failed", payment.bookingId ?? "")
      .run();
    // จ่ายซ้ำ = นัดยังอยู่ ไม่ต้องบอกว่ายกเลิก · กรณีอื่นบอกลูกค้าว่าไม่ได้นัดแต่ได้เงินคืน
    if (reason !== "duplicate_payment" && payment.ticketId) {
      await sendBookingCancelled(payment.ticketId, "system", ok ? "refunded" : "failed");
    }
    return ok ? "refunded" : "refund_failed";
  };

  const ticket = await getQueueTicketById(payment.ticketId);
  const booking = await getBookingByTicketId(payment.ticketId);
  if (!ticket || !booking) return refund("missing_ticket_or_booking");
  // จ่ายซ้ำ (เปิดหน้าจ่ายสองหน้าแล้วจ่ายทั้งคู่) — ใบจองยืนยันไปแล้วด้วยรายการอื่น
  if (booking.status === "confirmed") return refund("duplicate_payment");
  if (ticket.status !== "pending_payment" && ticket.status !== "expired") return refund(`ticket_${ticket.status}`);
  if (booking.status !== "reserved" && booking.status !== "expired") return refund(`booking_${booking.status}`);

  try {
    const res = await db
      .prepare(
        `UPDATE bookings SET status = 'confirmed', hold_expires_at = NULL, cancelled_at = NULL, cancelled_by = NULL
          WHERE id = ? AND status IN ('reserved', 'expired')`
      )
      .bind(booking.id)
      .run();
    if ((res.meta?.changes ?? 0) === 0) return refund("booking_changed");
  } catch (err) {
    // ที่นั่งหลุดไปแล้ว (หน้าจ่ายเงินหมดเวลา แล้วมีคนอื่นจองช่องนี้) — unique index ไม่ยอมให้ซ้อน
    if (isUniqueViolation(err)) {
      await db
        .prepare("UPDATE bookings SET status = 'cancelled', cancelled_at = ?, cancelled_by = 'system' WHERE id = ?")
        .bind(now, booking.id)
        .run();
      await db.prepare("UPDATE queue_tickets SET status = 'cancelled' WHERE id = ?").bind(ticket.id).run();
      return refund("slot_lost");
    }
    throw err;
  }

  let position: number | null = null;
  if (ticket.kind === "walkup") {
    const row = await db
      .prepare(
        "SELECT COUNT(*) as count FROM queue_tickets WHERE reader_id = ? AND kind = 'walkup' AND status IN ('waiting', 'ready')"
      )
      .bind(ticket.readerId)
      .first<{ count: number }>();
    position = Number(row?.count ?? 0) + 1;
  }
  await db
    .prepare(
      `UPDATE queue_tickets SET status = 'waiting', position = ?, expires_at = ?
        WHERE id = ? AND status IN ('pending_payment', 'expired')`
    )
    .bind(position, ticketExpiresAt(now, booking.kind === "scheduled" ? booking.slotStart : null), ticket.id)
    .run();
  await sendBookingConfirmed(ticket.id);
  return "confirmed";
}

/** หน้าจ่ายเงินหมดอายุ/จ่ายไม่ผ่าน ➔ ปล่อยที่ทันที (ถ้าไม่มีรายการอื่นที่ยังรอจ่ายอยู่) */
export async function handleFailedConsultationPayment(paymentId: string, webhookLog?: string): Promise<void> {
  const db = await getAppDB();
  const payment = await getPaymentById(paymentId);
  if (!payment || payment.status !== "pending" || !payment.ticketId) return;
  await db
    .prepare("UPDATE payments SET status = 'failed', webhook_log = COALESCE(?, webhook_log), updated_at = ? WHERE id = ? AND status = 'pending'")
    .bind(webhookLog ?? null, Date.now(), paymentId)
    .run();
  const stillPending = await db
    .prepare("SELECT COUNT(*) as count FROM payments WHERE ticket_id = ? AND status = 'pending'")
    .bind(payment.ticketId)
    .first<{ count: number }>();
  if (Number(stillPending?.count ?? 0) === 0) await releaseHold(payment.ticketId, "expired", "system");
}

export interface CancelResult {
  ok: boolean;
  /** เหตุผลจาก `decideCancellation` (หรือ `changed` เมื่อสถานะเปลี่ยนไประหว่างทาง) */
  reason: string;
  refundStatus: RefundStatus | null;
}

/**
 * ยกเลิกคิว/นัด ตามนโยบาย (`decideCancellation`) พร้อมคืนเงินเมื่อเข้าเงื่อนไข
 * คืนเงินไม่สำเร็จ = การยกเลิกยังมีผล แต่บันทึก `refund_status = failed` ให้แอดมินตามคืนเอง
 */
export async function cancelConsultation(
  ticket: QueueTicket,
  actor: CancelActor,
  nowMs = Date.now()
): Promise<CancelResult> {
  const db = await getAppDB();
  const booking = await getBookingByTicketId(ticket.id);
  const payments = await listPaymentsForTicket(ticket.id);
  const paidPayment = payments.find((p) => p.status === "paid") ?? null;
  const decision = decideCancellation({
    actor,
    kind: ticket.kind,
    ticketStatus: ticket.status,
    paid: Boolean(paidPayment),
    slotStart: booking?.kind === "scheduled" ? booking.slotStart : null,
    nowMs,
  });
  if (!decision.allowed) return { ok: false, reason: decision.reason, refundStatus: null };

  const res = await db
    .prepare("UPDATE queue_tickets SET status = 'cancelled' WHERE id = ? AND status = ?")
    .bind(ticket.id, ticket.status)
    .run();
  if ((res.meta?.changes ?? 0) === 0) return { ok: false, reason: "changed", refundStatus: null };

  let refundStatus: RefundStatus | null = paidPayment ? "none" : null;
  if (decision.refund && paidPayment) {
    refundStatus = (await refundPaymentRecord(paidPayment)) ? "refunded" : "failed";
  }
  if (booking) {
    await db
      .prepare(
        `UPDATE bookings SET status = 'cancelled', cancelled_at = ?, cancelled_by = ?, refund_status = ?
          WHERE id = ? AND status IN ('reserved', 'confirmed', 'expired')`
      )
      .bind(nowMs, actor, refundStatus, booking.id)
      .run();
  }
  // หน้าจ่ายเงินที่ยังเปิดค้าง ➔ ปิดทิ้ง กันจ่ายเข้ามาหลังยกเลิก (ถ้าหลุดเข้ามาจริง settle จะคืนให้)
  await Promise.all(
    payments.filter((p) => p.status === "pending" && p.providerRef).map((p) => expireGatewayCharge(p.providerRef as string))
  );
  // แจ้งเฉพาะรายการที่จ่ายแล้ว (ยกเลิกก่อนจ่าย ไม่มีอะไรต้องบอก)
  if (paidPayment) await sendBookingCancelled(ticket.id, actor, refundStatus);
  return { ok: true, reason: decision.reason, refundStatus };
}

export type RescheduleResult = { ok: true; slotStart: number } | { ok: false; error: string; status: 400 | 409 };

/** เลื่อนนัด — ตรวจนโยบาย + ตาราง + ช่องว่างฝั่งเซิร์ฟเวอร์ แล้วให้ unique index ตัดสินการชนเป็นด่านสุดท้าย */
export async function rescheduleBooking(
  ticket: QueueTicket,
  newSlotStart: number,
  nowMs = Date.now()
): Promise<RescheduleResult> {
  const db = await getAppDB();
  const booking = await getBookingByTicketId(ticket.id);
  if (!booking || booking.kind !== "scheduled" || booking.status !== "confirmed") {
    return { ok: false, error: "นัดนี้เลื่อนไม่ได้", status: 400 };
  }
  if (
    !canReschedule({
      ticketStatus: ticket.status,
      slotStart: booking.slotStart,
      rescheduleCount: booking.rescheduleCount,
      nowMs,
    })
  ) {
    return { ok: false, error: `เลื่อนนัดได้ ${MAX_RESCHEDULES} ครั้ง และต้องเลื่อนก่อนเวลานัดอย่างน้อย 24 ชั่วโมง`, status: 400 };
  }
  if (newSlotStart === booking.slotStart) return { ok: false, error: "เลือกเวลาใหม่ที่ไม่ใช่เวลาเดิม", status: 400 };

  const rejection = await checkSlotBookable(ticket.readerId, newSlotStart, nowMs, booking.slotStart);
  if (rejection) return { ok: false, error: rejection, status: 409 };

  await db
    .prepare(
      `UPDATE bookings SET status = 'expired'
        WHERE reader_id = ? AND slot_start = ? AND kind = 'scheduled' AND status = 'reserved' AND hold_expires_at < ?`
    )
    .bind(ticket.readerId, newSlotStart, nowMs)
    .run();
  try {
    const res = await db
      .prepare(
        `UPDATE bookings SET slot_start = ?, slot_end = ?, reschedule_count = reschedule_count + 1
          WHERE id = ? AND status = 'confirmed' AND slot_start = ? AND reschedule_count < ?`
      )
      .bind(newSlotStart, newSlotStart + slotMs, booking.id, booking.slotStart, MAX_RESCHEDULES)
      .run();
    if ((res.meta?.changes ?? 0) === 0) return { ok: false, error: "นัดนี้เพิ่งถูกเปลี่ยน กรุณาโหลดหน้าใหม่", status: 409 };
  } catch (err) {
    if (isUniqueViolation(err)) return { ok: false, error: "เวลานี้เพิ่งมีคนจองไป กรุณาเลือกเวลาอื่น", status: 409 };
    throw err;
  }
  await db
    .prepare("UPDATE queue_tickets SET slot_start = ?, expires_at = ? WHERE id = ?")
    .bind(newSlotStart, ticketExpiresAt(nowMs, newSlotStart), ticket.id)
    .run();
  await db
    .prepare("UPDATE bookings SET reminder_24h_at = NULL, reminder_1h_at = NULL WHERE id = ?")
    .bind(booking.id)
    .run();
  await sendBookingRescheduled(ticket.id, booking.slotStart);
  return { ok: true, slotStart: newSlotStart };
}

/**
 * 🔒 จ่ายแล้วหรือยัง — ด่านเดียวที่ตัดสินว่าแม่หมอ "เริ่มคุย" กับตั๋วนี้ได้ไหม (เจ้าของสั่ง: ต้องจ่ายก่อนถึงจะได้คุย)
 * นับเฉพาะใบจองที่ยืนยันด้วยเงินจริงแล้ว (`confirmed` · หรือ `done` ของการคุยที่จบแล้ว)
 * ตั๋วยุคก่อนระบบจ่ายเงินไม่มีใบจอง ➔ ถือว่ายังไม่จ่าย
 */
export function isPaidBooking(booking: BookingRecord | null | undefined): boolean {
  return booking?.status === "confirmed" || booking?.status === "done";
}

/** แม่หมอปิดคิว (คุยเสร็จ) ➔ ใบจองเป็น done */
export async function completeBooking(ticketId: string): Promise<void> {
  const db = await getAppDB();
  await db.prepare("UPDATE bookings SET status = 'done' WHERE ticket_id = ? AND status = 'confirmed'").bind(ticketId).run();
}

/** แม่หมอแจ้งลูกค้าไม่มาตามนัด (หลังเวลานัด 15 นาที) ➔ ไม่คืนเงิน */
export async function markNoShow(ticket: QueueTicket, nowMs = Date.now()): Promise<boolean> {
  const db = await getAppDB();
  const res = await db
    .prepare("UPDATE queue_tickets SET status = 'expired' WHERE id = ? AND status IN ('waiting', 'ready')")
    .bind(ticket.id)
    .run();
  if ((res.meta?.changes ?? 0) === 0) return false;
  await db
    .prepare(
      "UPDATE bookings SET status = 'no_show', cancelled_at = ?, cancelled_by = 'reader', refund_status = 'none' WHERE ticket_id = ? AND status = 'confirmed'"
    )
    .bind(nowMs, ticket.id)
    .run();
  return true;
}

/* ── แผงแอดมิน: การจองและการเงิน ─────────────────────────────────────────── */

export interface AdminBookingRow {
  bookingId: string;
  ticketId: string;
  readerName: string;
  nickname: string | null;
  kind: BookingKind;
  slotStart: number | null;
  status: BookingStatus;
  ticketStatus: string;
  amountThb: number | null;
  paymentStatus: string | null;
  refundStatus: RefundStatus | null;
  refundDue: boolean;
  paymentId: string | null;
  createdAt: number;
}

/**
 * รายการจองล่าสุด + รายการที่ "ต้องคืนเงินแต่ยังคืนไม่สำเร็จ" (ขึ้นบนสุดเสมอ)
 * ไม่มีคำถาม/สรุป AI ของลูกค้าในรายการนี้ — แอดมินไม่จำเป็นต้องเห็น (PDPA: เท่าที่จำเป็น)
 */
export async function listAdminBookings(limit = 60): Promise<AdminBookingRow[]> {
  const db = await getAppDB();
  const { results } = await db
    .prepare(
      `SELECT b.id AS booking_id, b.ticket_id, b.kind, b.slot_start, b.status, b.refund_status, b.created_at,
              r.display_name, t.nickname, t.status AS ticket_status,
              p.id AS payment_id, p.amount_satang, p.status AS payment_status, p.refund_due
         FROM bookings b
         JOIN readers r ON r.id = b.reader_id
         LEFT JOIN queue_tickets t ON t.id = b.ticket_id
         LEFT JOIN payments p ON p.id = (
           SELECT id FROM payments WHERE booking_id = b.id ORDER BY (status = 'paid') DESC, created_at DESC LIMIT 1
         )
        WHERE b.status != 'expired' OR p.status IN ('paid', 'refunded')
        ORDER BY COALESCE(p.refund_due, 0) DESC, b.created_at DESC
        LIMIT ?`
    )
    .bind(limit)
    .all<{
      booking_id: string;
      ticket_id: string;
      kind: string | null;
      slot_start: number;
      status: string;
      refund_status: string | null;
      created_at: number;
      display_name: string;
      nickname: string | null;
      ticket_status: string | null;
      payment_id: string | null;
      amount_satang: number | null;
      payment_status: string | null;
      refund_due: number | null;
    }>();
  return (results || []).map((r) => ({
    bookingId: r.booking_id,
    ticketId: r.ticket_id,
    readerName: r.display_name,
    nickname: r.nickname,
    kind: r.kind === "walkup" ? "walkup" : "scheduled",
    slotStart: r.kind === "walkup" ? null : Number(r.slot_start),
    status: r.status as BookingStatus,
    ticketStatus: r.ticket_status ?? "-",
    amountThb: r.amount_satang ? Number(r.amount_satang) / 100 : null,
    paymentStatus: r.payment_status,
    refundStatus: (r.refund_status as RefundStatus | null) ?? null,
    refundDue: Number(r.refund_due ?? 0) === 1,
    paymentId: r.payment_id,
    createdAt: Number(r.created_at),
  }));
}

/** แอดมินกด "ลองคืนเงินอีกครั้ง" — คืนได้เฉพาะรายการที่ติดธง `refund_due` เท่านั้น */
export async function retryDueRefund(paymentId: string): Promise<"refunded" | "failed" | "not_due"> {
  const db = await getAppDB();
  const row = await db
    .prepare("SELECT refund_due FROM payments WHERE id = ? AND status = 'paid' LIMIT 1")
    .bind(paymentId)
    .first<{ refund_due: number }>();
  if (Number(row?.refund_due ?? 0) !== 1) return "not_due";
  const payment = await getPaymentById(paymentId);
  if (!payment) return "not_due";
  const ok = await refundPaymentRecord(payment);
  if (ok && payment.bookingId) {
    await db.prepare("UPDATE bookings SET refund_status = 'refunded' WHERE id = ?").bind(payment.bookingId).run();
  }
  return ok ? "refunded" : "failed";
}
