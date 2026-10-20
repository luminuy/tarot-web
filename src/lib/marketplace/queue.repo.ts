import { getAppDB } from "@/lib/platform/db";
import { LIVE_PRESENCE_TIMEOUT_MINUTES } from "@/lib/marketplace/booking-policy";
import {
  getAIScreeningById,
  getAIScreeningsByIds,
  performAIScreening,
  type AIScreeningRecord,
} from "@/lib/marketplace/screening";

export type TicketKind = "walkup" | "booking";
export type TicketStatus =
  /** กันที่ไว้แล้ว รอจ่ายเงิน (migrations/0020) — แม่หมอยังไม่เห็นตั๋วนี้ */
  | "pending_payment"
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
  /** สมาชิกที่ล็อกอินตอนจอง (migrations/0021) — ใช้เปิด "นัดของฉัน" ข้ามเครื่อง */
  userId: string | null;
  /** เวลาที่ลูกค้ายินยอมโดยชัดแจ้งให้แม่หมอใช้ข้อมูลอ่อนไหวในคำถาม (ม.26 · migrations/0029) · null = ไม่ได้ยินยอม */
  sensitiveConsentAt: number | null;
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
  user_id?: string | null;
  sensitive_consent_at?: number | null;
}

/** ตั๋วฉบับส่งออกนอกเซิร์ฟเวอร์ — ไม่มี `customerRef` และ `userId` (ตัวตนของลูกค้า) */
export type PublicQueueTicket = Omit<QueueTicket, "customerRef" | "userId">;

/**
 * ⚠️ `customerRef` คือความลับแบบ bearer ของลูกค้า (ใครถือ = เป็นเจ้าของตั๋วทุกใบของคนนั้น)
 * ทุก response ที่ส่งตั๋วออกไป ต้องผ่านฟังก์ชันนี้ก่อนเสมอ — เดิมส่งทั้งแถว
 * แม่หมอจึงเห็น ref ของลูกค้าทุกคนในคิว แล้วเอาไปแลกเป็นคุกกี้อ่านคิวข้ามแม่หมอได้ (A2-13)
 */
export function toPublicTicket(ticket: QueueTicket): PublicQueueTicket {
  const { customerRef: _secret, userId: _user, ...rest } = ticket;
  void _secret;
  void _user;
  return rest;
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
    userId: row.user_id ?? null,
    sensitiveConsentAt: row.sensitive_consent_at ?? null,
  };
}

/** เห็นแผงแม่หมอล่าสุดหลังเวลานี้ = ยังอยู่ (คิวสดเปิดจริง) */
function presenceCutoff(nowMs: number): number {
  return nowMs - LIVE_PRESENCE_TIMEOUT_MINUTES * 60_000;
}

/** บันทึกเวลาที่เห็นแผงล่าสุดไม่ถี่กว่านาทีละครั้ง — แผงถามทุก 5 วินาที ไม่ต้องเขียนฐานข้อมูลทุกครั้ง */
const PRESENCE_WRITE_EVERY_MS = 60_000;

/**
 * สถานะคิวสดของแม่หมอ "ที่ลูกค้าเห็น" — สวิตช์เปิด **และ** เห็นแผงภายใน 15 นาที (migrations/0031)
 * ลืมปิดสวิตช์แล้วล็อกจอ/ปิดหน้า ➔ ถือว่าปิดเอง ลูกค้าไม่จ่ายแล้วรอเก้อ (แผน CONSULT_FLOW ข้อ 3.2)
 */
export async function getReaderLiveAvailability(readerId: string, nowMs = Date.now()): Promise<boolean> {
  const db = await getAppDB();
  const row = await db
    .prepare("SELECT is_open, last_seen_at FROM reader_availability WHERE reader_id = ? AND mode = 'live' LIMIT 1")
    .bind(readerId)
    .first<{ is_open: number; last_seen_at: number | null }>();

  return Boolean(row?.is_open) && Number(row?.last_seen_at ?? 0) >= presenceCutoff(nowMs);
}

/**
 * แม่หมอทุกคนที่เปิดรับคิวสดอยู่จริงตอนนี้ — อ่านครั้งเดียวทั้งชุด (หน้ารวมแม่หมอ ไม่วนอ่านทีละคน)
 */
export async function listLiveReaderIds(nowMs = Date.now()): Promise<Set<string>> {
  const db = await getAppDB();
  const { results } = await db
    .prepare("SELECT reader_id FROM reader_availability WHERE mode = 'live' AND is_open = 1 AND last_seen_at >= ?")
    .bind(presenceCutoff(nowMs))
    .all<{ reader_id: string }>();
  return new Set((results || []).map((r) => r.reader_id));
}

/** แผงแม่หมอเปิดอยู่ — บันทึกว่ายังอยู่ (เขียนจริงไม่เกินนาทีละครั้ง) */
export async function touchReaderPresence(readerId: string, nowMs = Date.now()): Promise<void> {
  const db = await getAppDB();
  await db
    .prepare(
      `UPDATE reader_availability SET last_seen_at = ?
        WHERE reader_id = ? AND mode = 'live' AND (last_seen_at IS NULL OR last_seen_at < ?)`
    )
    .bind(nowMs, readerId, nowMs - PRESENCE_WRITE_EVERY_MS)
    .run();
}

/**
 * เปิด/ปิด Live Queue ของแม่หมอ — เปิด = นับว่าอยู่ทันที (กดจากแผงเอง)
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
      .prepare("UPDATE reader_availability SET is_open = ?, updated_at = ?, last_seen_at = ? WHERE id = ?")
      .bind(isOpenInt, now, now, existing.id)
      .run();
  } else {
    const id = `avail_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    await db
      .prepare(
        `INSERT INTO reader_availability (
          id, reader_id, mode, weekday, start_min, end_min, slot_minutes, timezone, is_open, created_at, updated_at, last_seen_at
        ) VALUES (?, ?, 'live', NULL, NULL, NULL, 30, 'Asia/Bangkok', ?, ?, ?, ?)`
      )
      .bind(id, readerId, isOpenInt, now, now, now)
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
  /**
   * สถานะเริ่มต้นเมื่อผ่าน AI คัดกรอง — ค่าเริ่มต้น `waiting` (เข้าคิวทันที)
   * เส้นจองจริงส่ง `pending_payment`: ตั๋วจะเข้าคิวก็ต่อเมื่อจ่ายเงินแล้ว (`settleConsultationPayment`)
   */
  initialStatus?: Extract<TicketStatus, "waiting" | "pending_payment">;
  /** สมาชิกที่ล็อกอินอยู่ตอนจอง (ไม่บังคับ — จองแบบไม่สมัครได้เสมอ) */
  userId?: string | null;
  /** ลูกค้าติ๊กยินยอมโดยชัดแจ้งเรื่องข้อมูลอ่อนไหว (ม.26) — ช่องแยก ไม่บังคับ */
  sensitiveConsent?: boolean;
}

const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * วันลบตั๋ว (PDPA) — 7 วันหลังสร้าง หรือ 7 วันหลังเวลานัด แล้วแต่อันไหนช้ากว่า
 * ⚠️ นัดล่วงหน้าได้ไกล 14 วัน — ถ้านับจากวันสร้างอย่างเดียว ตั๋วจะถูกลบก่อนถึงวันนัด
 */
export function ticketExpiresAt(nowMs: number, slotStart?: number | null): number {
  return Math.max(nowMs + RETENTION_MS, (slotStart ?? 0) + RETENTION_MS);
}

/**
 * สร้างตั๋วคิวพร้อม AI Screening อัตโนมัติ
 */
export async function createQueueTicket(input: CreateQueueTicketInput): Promise<QueueTicket> {
  const db = await getAppDB();
  const ticketId = `ticket_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const now = Date.now();
  const expiresAt = ticketExpiresAt(now, input.slotStart);
  const sensitiveConsentAt = input.sensitiveConsent === true ? now : null;
  // ลูกค้าจากลิงก์ห้องส่วนตัวเว้นคำถามได้ (คุยกับแม่หมอใน LINE มาแล้ว/เล่าในห้องแทน) — เก็บเป็น NULL
  const question = input.question.trim() || null;

  // 1. Run AI Screening First — ไม่มีคำถาม = ไม่มีอะไรให้คัดกรอง (ไม่เรียก AI เปล่า ๆ)
  const screening = question
    ? await performAIScreening({
        question,
        ticketId,
        drawnCardsSummary: input.readingSnapshot,
      })
    : null;

  // If blocked by safety guardrails -> ticket cancelled immediately
  if (screening?.verdict === "block") {
    const ticket: QueueTicket = {
      id: ticketId,
      readerId: input.readerId,
      kind: input.kind,
      status: "cancelled",
      position: null,
      slotStart: input.slotStart || null,
      customerRef: input.customerRef,
      nickname: input.nickname.trim(),
      question,
      readingSnapshot: input.readingSnapshot || null,
      aiScreenId: screening.id,
      createdAt: now,
      expiresAt,
      userId: input.userId ?? null,
      sensitiveConsentAt,
      screening,
    };

    await db
      .prepare(
        `INSERT INTO queue_tickets (
          id, reader_id, kind, status, position, slot_start, customer_ref, nickname, question, reading_snapshot, ai_screen_id, created_at, expires_at, user_id, sensitive_consent_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
        ticket.expiresAt,
        ticket.userId,
        ticket.sensitiveConsentAt
      )
      .run();

    return ticket;
  }

  const initialStatus: TicketStatus = input.initialStatus ?? "waiting";

  // 2. Calculate Queue Position for walk-up (ตั๋วที่ยังไม่จ่ายยังไม่มีลำดับ — ได้ลำดับตอนจ่ายสำเร็จ)
  let position: number | null = initialStatus === "waiting" ? 1 : null;
  if (input.kind === "walkup" && initialStatus === "waiting") {
    const countRow = await db
      .prepare(
        "SELECT COUNT(*) as count FROM queue_tickets WHERE reader_id = ? AND status IN ('waiting', 'ready')"
      )
      .bind(input.readerId)
      .first<{ count: number }>();
    position = (countRow?.count || 0) + 1;
  }

  await db
    .prepare(
      `INSERT INTO queue_tickets (
        id, reader_id, kind, status, position, slot_start, customer_ref, nickname, question, reading_snapshot, ai_screen_id, created_at, expires_at, user_id, sensitive_consent_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
      question,
      input.readingSnapshot || null,
      screening?.id ?? null,
      now,
      expiresAt,
      input.userId ?? null,
      sensitiveConsentAt
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
      "SELECT * FROM queue_tickets WHERE customer_ref = ? AND status IN ('pending_payment', 'screening', 'waiting', 'ready') ORDER BY created_at DESC"
    )
    .bind(customerRef)
    .all<RawTicketRow>();

  return (results || []).map(mapRowToTicket);
}

/**
 * "นัดของฉัน" — ตั๋วของลูกค้าคนนี้ทั้งที่ยังไม่จบและที่จบแล้ว (ตั๋วถูกลบตาม PDPA เองหลังครบอายุ)
 * จับคู่ได้สองทาง: คุกกี้ของเบราว์เซอร์นี้ (`customerRef`) หรือบัญชีที่ล็อกอิน (`userId` — ทุกเครื่อง)
 */
export async function listTicketsForOwner(owner: { customerRef?: string | null; userId?: string | null }): Promise<QueueTicket[]> {
  if (!owner.customerRef && !owner.userId) return [];
  const db = await getAppDB();
  const { results } = await db
    .prepare(
      `SELECT * FROM queue_tickets
        WHERE (customer_ref = ? OR (user_id IS NOT NULL AND user_id = ?))
        ORDER BY COALESCE(slot_start, created_at) DESC
        LIMIT 50`
    )
    .bind(owner.customerRef ?? "", owner.userId ?? "")
    .all<RawTicketRow>();
  return (results || []).map(mapRowToTicket);
}

/**
 * ลำดับคิวสด = ลำดับเวลาที่จ่ายเงินสำเร็จ (ยังไม่จ่าย ➔ เวลาสร้างตั๋ว) · เสมอกันตัดด้วย id
 * ใช้เกณฑ์เดียวกันทั้งหน้าลูกค้า (`liveQueuePosition`) และแผงแม่หมอ (`listReaderQueueTickets`)
 */
const QUEUE_ORDER_KEY = `COALESCE((SELECT MIN(p.updated_at) FROM payments p WHERE p.ticket_id = t.id AND p.status = 'paid'), t.created_at)`;

/**
 * "คิวที่ N" ของคิวสด คำนวณตอนอ่านทุกครั้ง — ขยับเองเมื่อคนข้างหน้าคุยเสร็จ/ยกเลิก และไม่ซ้ำกัน
 * (ค่า `position` ในแถวเป็นแค่ตัวเลขตอนจ่ายเงิน ไม่ใช้แสดงผลแล้ว) · ไม่ใช่คิวสดที่กำลังรอ = คืนค่าเดิม
 */
export async function liveQueuePosition(ticket: QueueTicket): Promise<number | null> {
  if (ticket.kind !== "walkup" || (ticket.status !== "waiting" && ticket.status !== "ready")) return ticket.position;
  const db = await getAppDB();
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS count FROM queue_tickets t, (SELECT ${QUEUE_ORDER_KEY} AS k FROM queue_tickets t WHERE t.id = ?) me
        WHERE t.reader_id = ? AND t.kind = 'walkup' AND t.status IN ('waiting', 'ready') AND t.id != ?
          AND (${QUEUE_ORDER_KEY} < me.k OR (${QUEUE_ORDER_KEY} = me.k AND t.id < ?))`
    )
    .bind(ticket.id, ticket.readerId, ticket.id, ticket.id)
    .first<{ count: number }>();
  return Number(row?.count ?? 0) + 1;
}

/**
 * ดึงตั๋วคิวทั้งหมดสำหรับ Reader Console — เรียงตามลำดับคิวสด (`QUEUE_ORDER_KEY`) · เลขคิวคำนวณใหม่ทุกครั้ง
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
      `SELECT t.* FROM queue_tickets t WHERE t.reader_id = ? AND t.status IN (${placeholders})
        ORDER BY ${QUEUE_ORDER_KEY} ASC, t.id ASC`
    )
    .bind(readerId, ...allowedStatuses)
    .all<RawTicketRow>();

  const tickets = (results || []).map(mapRowToTicket);
  let walkupRank = 0;
  for (const t of tickets) {
    if (t.kind === "walkup" && (t.status === "waiting" || t.status === "ready")) t.position = ++walkupRank;
  }

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

/** ตั๋วนี้มีเงินจริงผ่านมือ (จ่ายแล้ว/คืนแล้ว/ค้างคืน) — แถวการเงินต้องเก็บไว้เป็นหลักฐานบัญชีและยอดโอนแม่หมอ */
const TICKET_HAS_MONEY = `EXISTS (SELECT 1 FROM payments p WHERE p.ticket_id = t.id
  AND (p.status IN ('paid', 'refunded') OR COALESCE(p.refund_due, 0) = 1))`;
/** ยังมีเงินที่ต้องคืนลูกค้าค้างอยู่ — ยังไม่แตะจนกว่าเรื่องเงินจะปิด (แอดมินอาจต้องใช้ข้อมูลติดต่อ) */
const TICKET_REFUND_OPEN = `EXISTS (SELECT 1 FROM payments p WHERE p.ticket_id = t.id AND COALESCE(p.refund_due, 0) = 1)`;

/**
 * 🧹 ลบข้อมูลตั๋วคิวที่หมดอายุแล้ว (PDPA — 7 วันหลังนัด · `ticketExpiresAt`)
 * ---------------------------------------------------------------------------
 * เรียกจากงานรอบ `/api/cron/booking-reminders` · ทำซ้ำได้ไม่มีผลข้างเคียง
 *   • ตั๋วที่ไม่มีเงินผ่านมือ (หมดเวลาจ่าย/ยกเลิกก่อนจ่าย) ➔ ลบทั้งแถวพร้อมข้อมูลที่ผูกอยู่
 *   • ตั๋วที่มีเงินผ่านมือ ➔ เก็บแถว `queue_tickets`/`bookings`/`payments` ไว้ (หลักฐานการเงิน · ยอดโอนแม่หมอ)
 *     แต่ล้างข้อมูลส่วนบุคคลออก: ชื่อเล่น · คำถาม · ไพ่ที่เปิด · ผลคัดกรอง AI · ห้องวิดีโอ · อีเมลติดต่อ
 *   • ตั๋วที่ยังค้างคืนเงินลูกค้า ➔ รอจนเรื่องเงินปิดก่อน
 *   • ผลคัดกรอง AI ที่ตั๋วหายไปแล้ว (แถวกำพร้า) ➔ ลบ
 * คืนจำนวนตั๋วที่ลบ + ล้างข้อมูลในรอบนี้
 */
export async function cleanupExpiredTickets(): Promise<number> {
  const db = await getAppDB();
  const now = Date.now();
  /*
   * ⚡ B2-01: อ่านเฉพาะตั๋วที่ "ยังไม่เคยล้าง" (`pii_cleared_at IS NULL` · partial index idx_tickets_pii_pending)
   * ตั๋วที่จ่ายเงินแล้วถูกเก็บไว้ตลอดไป (หลักฐานบัญชี) — เดิมทุกรอบ (ทุก 15 นาที) ไล่อ่านตั๋วจ่ายแล้วทั้งประวัติซ้ำ 10 คำสั่ง
   * ทั้งที่ล้างไปตั้งแต่รอบแรกแล้ว ➔ งานต่อรอบโตตามจำนวนตั๋วสะสมไม่มีเพดาน · ตอนนี้เท่ากับตั๋วที่หมดอายุใหม่เท่านั้น
   */
  const dropIds = `SELECT t.id FROM queue_tickets t WHERE t.expires_at < ? AND t.pii_cleared_at IS NULL AND NOT ${TICKET_HAS_MONEY}`;
  const scrubIds = `SELECT t.id FROM queue_tickets t WHERE t.expires_at < ? AND t.pii_cleared_at IS NULL AND ${TICKET_HAS_MONEY} AND NOT ${TICKET_REFUND_OPEN}`;

  // ── ตั๋วที่ไม่มีเงินผ่านมือ: ลบทั้งชุด (ปลด ai_screen_id ก่อน — กรณีเปิด PRAGMA foreign_keys)
  await db.prepare(`UPDATE queue_tickets SET ai_screen_id = NULL WHERE id IN (${dropIds})`).bind(now).run();
  await db.prepare(`DELETE FROM ai_screening WHERE ticket_id IN (${dropIds})`).bind(now).run();
  // 📹 ห้องวิดีโอคอลของตั๋วนั้น (migrations/0019) — ต้องลบก่อนตั๋ว เพราะอ้าง FK ถึงกัน
  await db.prepare(`DELETE FROM call_sessions WHERE ticket_id IN (${dropIds})`).bind(now).run();
  await db.prepare(`DELETE FROM payments WHERE ticket_id IN (${dropIds})`).bind(now).run();
  await db.prepare(`DELETE FROM bookings WHERE ticket_id IN (${dropIds})`).bind(now).run();
  const dropped = await db.prepare(`DELETE FROM queue_tickets WHERE id IN (${dropIds})`).bind(now).run();

  // ── ตั๋วที่มีเงินผ่านมือ: เก็บแถวการเงิน ล้างข้อมูลส่วนบุคคล
  // ⚠️ ลำดับสำคัญ: ล้างตารางที่ผูกอยู่ "ก่อน" แล้วค่อยประทับ `pii_cleared_at` ที่ตัวตั๋วเป็นคำสั่งสุดท้าย
  //    (ประทับก่อน = scrubIds ของคำสั่งถัดไปว่างทันที อีเมลติดต่อ/ห้องวิดีโอจะไม่ถูกล้าง)
  //    ปลด ai_screen_id ก่อนลบผลคัดกรอง — กรณีเปิด PRAGMA foreign_keys (เหมือนฝั่งลบทั้งแถวด้านบน)
  await db.prepare(`UPDATE queue_tickets SET ai_screen_id = NULL WHERE ai_screen_id IS NOT NULL AND id IN (${scrubIds})`).bind(now).run();
  await db.prepare(`DELETE FROM ai_screening WHERE ticket_id IN (${scrubIds})`).bind(now).run();
  await db.prepare(`DELETE FROM call_sessions WHERE ticket_id IN (${scrubIds})`).bind(now).run();
  await db
    .prepare(`UPDATE bookings SET contact_email = NULL WHERE contact_email IS NOT NULL AND ticket_id IN (${scrubIds})`)
    .bind(now)
    .run();
  const scrubbed = await db
    .prepare(
      `UPDATE queue_tickets SET nickname = '', question = '', reading_snapshot = NULL, ai_screen_id = NULL, pii_cleared_at = ?
        WHERE id IN (${scrubIds})`
    )
    .bind(now, now)
    .run();

  // ── ผลคัดกรอง AI ที่ไม่มีตั๋วแล้ว (เช่นตั๋วถูกลบไปตามแม่หมอ) — เว้นแถวที่เพิ่งสร้าง (ตั๋วอาจกำลังถูกสร้างตามมา)
  await db
    .prepare(
      "DELETE FROM ai_screening WHERE ticket_id IS NOT NULL AND created_at < ? AND ticket_id NOT IN (SELECT id FROM queue_tickets)"
    )
    .bind(now - 60 * 60 * 1000)
    .run();

  // ✦ ลิงก์ห้องส่วนตัว (migrations/0032) มีชื่อลูกค้าที่แม่หมอพิมพ์ไว้ — ลบหลังลิงก์หมดอายุ 7 วัน
  //   แยก try: ฐานข้อมูลเก่าที่ยังไม่มีตารางต้องไม่ทำให้การลบตั๋วข้างบนนับผิด
  try {
    await db.prepare("DELETE FROM reader_invites WHERE expires_at < ?").bind(now - RETENTION_MS).run();
  } catch {
    // ignore if table not yet created
  }
  return (dropped.meta?.changes ?? 0) + (scrubbed.meta?.changes ?? 0);
}
