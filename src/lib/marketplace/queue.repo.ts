import { getAppDB } from "@/lib/platform/db";
import {
  getAIScreeningById,
  getAIScreeningsByIds,
  performAIScreening,
  type AIScreeningRecord,
} from "@/lib/marketplace/screening";

export type TicketKind = "walkup" | "booking";
export type TicketStatus =
  | "screening"
  | "waiting"
  | "ready"
  | "handed_off"
  | "cancelled"
  | "expired";

export interface QueueTicket {
  id: string;
  readerId: string;
  kind: TicketKind;
  status: TicketStatus;
  position: number | null;
  slotStart: number | null;
  customerRef: string;
  nickname: string | null;
  question: string | null;
  readingSnapshot: string | null;
  aiScreenId: string | null;
  createdAt: number;
  expiresAt: number;
  // Attached AI brief if available
  screening?: AIScreeningRecord | null;
}

interface RawTicketRow {
  id: string;
  reader_id: string;
  kind: string;
  status: string;
  position: number | null;
  slot_start: number | null;
  customer_ref: string;
  nickname: string | null;
  question: string | null;
  reading_snapshot: string | null;
  ai_screen_id: string | null;
  created_at: number;
  expires_at: number;
}

function mapRowToTicket(row: RawTicketRow): QueueTicket {
  return {
    id: row.id,
    readerId: row.reader_id,
    kind: (row.kind as TicketKind) || "walkup",
    status: (row.status as TicketStatus) || "screening",
    position: row.position,
    slotStart: row.slot_start,
    customerRef: row.customer_ref,
    nickname: row.nickname,
    question: row.question,
    readingSnapshot: row.reading_snapshot,
    aiScreenId: row.ai_screen_id,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

/**
 * ดึงสถานะ Live Queue ของแม่หมอ (เปิดรับคิวอยู่หรือไม่)
 */
export async function getReaderLiveAvailability(readerId: string): Promise<boolean> {
  const db = await getAppDB();
  const row = await db
    .prepare("SELECT is_open FROM reader_availability WHERE reader_id = ? AND mode = 'live' LIMIT 1")
    .bind(readerId)
    .first<{ is_open: number }>();

  return Boolean(row?.is_open);
}

/**
 * เปิด/ปิด Live Queue ของแม่หมอ
 */
export async function setReaderLiveAvailability(readerId: string, isOpen: boolean): Promise<void> {
  const db = await getAppDB();
  const now = Date.now();
  const isOpenInt = isOpen ? 1 : 0;

  const existing = await db
    .prepare("SELECT id FROM reader_availability WHERE reader_id = ? AND mode = 'live' LIMIT 1")
    .bind(readerId)
    .first<{ id: string }>();

  if (existing) {
    await db
      .prepare("UPDATE reader_availability SET is_open = ?, updated_at = ? WHERE id = ?")
      .bind(isOpenInt, now, existing.id)
      .run();
  } else {
    const id = `avail_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    await db
      .prepare(
        `INSERT INTO reader_availability (
          id, reader_id, mode, weekday, start_min, end_min, slot_minutes, timezone, is_open, created_at, updated_at
        ) VALUES (?, ?, 'live', NULL, NULL, NULL, 30, 'Asia/Bangkok', ?, ?, ?)`
      )
      .bind(id, readerId, isOpenInt, now, now)
      .run();
  }
}

export interface CreateQueueTicketInput {
  readerId: string;
  kind: TicketKind;
  customerRef: string;
  nickname: string;
  question: string;
  readingSnapshot?: string;
  slotStart?: number;
}

/**
 * สร้างตั๋วคิวพร้อม AI Screening อัตโนมัติ
 */
export async function createQueueTicket(input: CreateQueueTicketInput): Promise<QueueTicket> {
  const db = await getAppDB();
  const ticketId = `ticket_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const now = Date.now();
  const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days PDPA retention

  // 1. Run AI Screening First
  const screening = await performAIScreening({
    question: input.question,
    ticketId,
    drawnCardsSummary: input.readingSnapshot,
  });

  // If blocked by safety guardrails -> ticket cancelled immediately
  if (screening.verdict === "block") {
    const ticket: QueueTicket = {
      id: ticketId,
      readerId: input.readerId,
      kind: input.kind,
      status: "cancelled",
      position: null,
      slotStart: input.slotStart || null,
      customerRef: input.customerRef,
      nickname: input.nickname.trim(),
      question: input.question.trim(),
      readingSnapshot: input.readingSnapshot || null,
      aiScreenId: screening.id,
      createdAt: now,
      expiresAt,
      screening,
    };

    await db
      .prepare(
        `INSERT INTO queue_tickets (
          id, reader_id, kind, status, position, slot_start, customer_ref, nickname, question, reading_snapshot, ai_screen_id, created_at, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        ticket.id,
        ticket.readerId,
        ticket.kind,
        ticket.status,
        ticket.position,
        ticket.slotStart,
        ticket.customerRef,
        ticket.nickname,
        ticket.question,
        ticket.readingSnapshot,
        ticket.aiScreenId,
        ticket.createdAt,
        ticket.expiresAt
      )
      .run();

    return ticket;
  }

  // 2. Calculate Queue Position for walk-up
  let position = 1;
  if (input.kind === "walkup") {
    const countRow = await db
      .prepare(
        "SELECT COUNT(*) as count FROM queue_tickets WHERE reader_id = ? AND status IN ('waiting', 'ready')"
      )
      .bind(input.readerId)
      .first<{ count: number }>();
    position = (countRow?.count || 0) + 1;
  }

  const initialStatus: TicketStatus = "waiting";

  await db
    .prepare(
      `INSERT INTO queue_tickets (
        id, reader_id, kind, status, position, slot_start, customer_ref, nickname, question, reading_snapshot, ai_screen_id, created_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      ticketId,
      input.readerId,
      input.kind,
      initialStatus,
      position,
      input.slotStart || null,
      input.customerRef,
      input.nickname.trim(),
      input.question.trim(),
      input.readingSnapshot || null,
      screening.id,
      now,
      expiresAt
    )
    .run();

  const created = await getQueueTicketById(ticketId);
  if (!created) {
    throw new Error("Failed to retrieve created queue ticket");
  }
  return created;
}

/**
 * ดึงข้อมูลตั๋วคิวด้วย ID
 */
export async function getQueueTicketById(ticketId: string): Promise<QueueTicket | null> {
  const db = await getAppDB();
  const row = await db
    .prepare("SELECT * FROM queue_tickets WHERE id = ? LIMIT 1")
    .bind(ticketId)
    .first<RawTicketRow>();

  if (!row) return null;
  const ticket = mapRowToTicket(row);

  if (ticket.aiScreenId) {
    ticket.screening = await getAIScreeningById(ticket.aiScreenId);
  }

  return ticket;
}

/**
 * ดึงตั๋วคิวที่ยังเปิดใช้งานของลูกค้า
 */
export async function listActiveTicketsForCustomer(customerRef: string): Promise<QueueTicket[]> {
  const db = await getAppDB();
  const { results } = await db
    .prepare(
      "SELECT * FROM queue_tickets WHERE customer_ref = ? AND status IN ('screening', 'waiting', 'ready') ORDER BY created_at DESC"
    )
    .bind(customerRef)
    .all<RawTicketRow>();

  return (results || []).map(mapRowToTicket);
}

/**
 * ดึงตั๋วคิวทั้งหมดสำหรับ Reader Console
 */
export async function listReaderQueueTickets(
  readerId: string,
  options?: { status?: TicketStatus[] }
): Promise<QueueTicket[]> {
  const db = await getAppDB();
  const allowedStatuses = options?.status || ["waiting", "ready", "screening"];

  const placeholders = allowedStatuses.map(() => "?").join(",");
  const { results } = await db
    .prepare(
      `SELECT * FROM queue_tickets WHERE reader_id = ? AND status IN (${placeholders}) ORDER BY created_at ASC`
    )
    .bind(readerId, ...allowedStatuses)
    .all<RawTicketRow>();

  const tickets = (results || []).map(mapRowToTicket);

  // Attach screening briefs — อ่านครั้งเดียวทั้งชุด ไม่ใช่วนอ่านทีละใบ (N+1)
  const screeningIds = tickets.map((t) => t.aiScreenId).filter((v): v is string => Boolean(v));
  if (screeningIds.length > 0) {
    const briefs = await getAIScreeningsByIds(screeningIds);
    for (const t of tickets) {
      if (t.aiScreenId) t.screening = briefs.get(t.aiScreenId) ?? null;
    }
  }

  return tickets;
}

/**
 * อัปเดตสถานะตั๋วคิว (เช่น ready, handed_off, cancelled)
 */
export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus,
  readerId?: string
): Promise<QueueTicket | null> {
  const db = await getAppDB();

  let query = "UPDATE queue_tickets SET status = ? WHERE id = ?";
  const params: unknown[] = [status, ticketId];

  if (readerId) {
    query += " AND reader_id = ?";
    params.push(readerId);
  }

  const res = await db.prepare(query).bind(...params).run();
  if ((res.meta?.changes ?? 0) === 0) return null;

  return getQueueTicketById(ticketId);
}

/**
 * ยกเลิกตั๋วคิว
 */
export async function cancelQueueTicket(ticketId: string, customerRef?: string): Promise<boolean> {
  const db = await getAppDB();
  let query = "UPDATE queue_tickets SET status = 'cancelled' WHERE id = ?";
  const params: unknown[] = [ticketId];

  if (customerRef) {
    query += " AND customer_ref = ?";
    params.push(customerRef);
  }

  const res = await db.prepare(query).bind(...params).run();
  return (res.meta?.changes ?? 0) > 0;
}

/**
 * ลบตั๋วคิวที่หมดอายุแล้วออกจากฐานข้อมูล (PDPA 7-day auto-purge)
 */
export async function cleanupExpiredTickets(): Promise<number> {
  const db = await getAppDB();
  const now = Date.now();
  const res = await db.prepare("DELETE FROM queue_tickets WHERE expires_at < ?").bind(now).run();
  return res.meta?.changes ?? 0;
}
