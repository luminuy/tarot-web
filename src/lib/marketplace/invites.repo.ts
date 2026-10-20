import { randomBytes } from "node:crypto";

import { SITE_ORIGIN } from "@/lib/config/site";
import { expireLapsedHold, releaseHold } from "@/lib/marketplace/booking.repo";
import { getQueueTicketById, type QueueTicket } from "@/lib/marketplace/queue.repo";
import { getAppDB } from "@/lib/platform/db";

/**
 * ✦ ลิงก์ห้องส่วนตัว (migrations/0032 · แผน CONSULT_FLOW_UX_PLAN คลื่น 7)
 * ---------------------------------------------------------------------------
 * แม่หมอคุยกับลูกค้าใน LINE อยู่แล้ว อยากส่งลิงก์ให้ลูกค้าแตะแล้วเข้าห้องได้เลยแบบลิงก์ห้องประชุมออนไลน์
 * ลิงก์นี้คือ "บัตรเชิญ" ให้ลูกค้าคนเดียวจ่ายเงินแล้วเข้าคิวของแม่หมอ — ใช้ได้แม้แม่หมอปิดคิวสดอยู่
 *
 * กติกา
 * - **จ่ายบนเว็บก่อนเข้าห้องเสมอ** (เจ้าของเคาะ 2026-10-12) — ลูกค้าจองผ่าน `POST /api/marketplace/tickets`
 *   เส้นเดียวกับการจองปกติ ราคา · การกันที่ · หน้าจ่ายเงิน · คืนเงิน · ห้องวิดีโอ จึงเป็นชุดเดียวกันทั้งหมด
 * - ลิงก์หนึ่งอัน = ลูกค้าหนึ่งคน: มีคนกำลังจ่ายอยู่ คนอื่นจ่ายซ้อนไม่ได้ · จ่ายแล้ว = ใช้แล้ว
 * - หมดอายุ 24 ชม. · แม่หมอยกเลิกได้ (ถ้ามีคนกำลังจ่ายอยู่ = ปล่อยที่ทันที เงินที่มาถึงทีหลังระบบคืนเอง)
 * - สถานะของลิงก์อ่านจากตั๋วที่ผูกอยู่ ไม่เก็บซ้ำ — จึงไม่มีวันที่สถานะสองที่ขัดกันเอง
 *
 * 🔒 `code` ไม่ใช่ตัวตนลูกค้า — แม่หมอเห็นลิงก์นี้ได้ (แม่หมอสร้างเอง) แต่ลิงก์ไม่ให้สิทธิ์อ่านตั๋วของใคร
 *    ลูกค้าได้คุกกี้ `customerRef` ของตัวเองตอนจ่าย เหมือนการจองปกติ (บทเรียน A2-13)
 */

const INVITE_TTL_HOURS = 24;
/** ลิงก์ที่ยังไม่มีใครใช้ต่อแม่หมอหนึ่งคน — กันกดสร้างรัว ๆ จนรายการรก */
export const MAX_OPEN_INVITES = 10;
export const INVITE_LABEL_MAX = 40;

/**
 * - `open` รอลูกค้าเปิดลิงก์ · `paying` ลูกค้ากำลังจ่าย · `paid` จ่ายแล้วรอแม่หมอรับเข้าห้อง
 * - `in_room` แม่หมอรับเข้าห้องแล้ว (กำลังคุย) · `done` คุยเสร็จแล้ว · `expired` หมดอายุ · `cancelled` แม่หมอยกเลิก
 */
export type InviteState = "open" | "paying" | "paid" | "in_room" | "done" | "expired" | "cancelled";

export interface ReaderInvite {
  id: string;
  code: string;
  readerId: string;
  /** ชื่อลูกค้าที่แม่หมอพิมพ์ไว้ (ไม่บังคับ) — เติมช่องชื่อให้ลูกค้าตอนเปิดลิงก์ */
  label: string | null;
  /** ตั๋วล่าสุดที่เกิดจากลิงก์นี้ */
  ticketId: string | null;
  createdAt: number;
  expiresAt: number;
  cancelledAt: number | null;
}

/** สิ่งที่แผงแม่หมอเห็น — ไม่มีตัวตนลูกค้า (`customerRef`) */
export interface InviteView {
  id: string;
  url: string;
  label: string | null;
  state: InviteState;
  /** ตั๋วของลิงก์นี้ (คิวของแม่หมอเอง) — แผงใช้ติดป้าย "ห้องส่วนตัว" ให้การ์ดคิว */
  ticketId: string | null;
  createdAt: number;
  expiresAt: number;
}

interface RawInviteRow {
  id: string;
  code: string;
  reader_id: string;
  label: string | null;
  ticket_id: string | null;
  created_at: number;
  expires_at: number;
  cancelled_at: number | null;
}

function mapRow(row: RawInviteRow): ReaderInvite {
  return {
    id: row.id,
    code: row.code,
    readerId: row.reader_id,
    label: row.label,
    ticketId: row.ticket_id,
    createdAt: Number(row.created_at),
    expiresAt: Number(row.expires_at),
    cancelledAt: row.cancelled_at === null ? null : Number(row.cancelled_at),
  };
}

/** โดเมนหลักเสมอ — แผงแม่หมออาจเปิดผ่านโดเมนพรีวิว แต่ลิงก์ที่ส่งให้ลูกค้าต้องเป็นของจริง */
export function inviteUrl(code: string): string {
  return `${SITE_ORIGIN}/readers/room/${encodeURIComponent(code)}`;
}

/** รหัสในลิงก์ — 128 บิตแบบ base64url (22 ตัว) เดาไม่ได้ */
const CODE_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;

export function isInviteCode(value: string): boolean {
  return CODE_PATTERN.test(value);
}

/** ชื่อที่แม่หมอพิมพ์: ตัดช่องว่าง · ตัด "คุณ" นำหน้า (แผงเติม "คุณ" ให้เองอยู่แล้ว) · ว่าง = ไม่มี */
export function cleanInviteLabel(raw: string | null | undefined): string | null {
  const text = (raw ?? "").replace(/\s+/g, " ").trim().replace(/^คุณ\s*/, "").slice(0, INVITE_LABEL_MAX).trim();
  return text || null;
}

/** ตั๋วที่ผูกกับลิงก์ — เท่าที่ต้องใช้ตัดสินสถานะ */
export interface InviteTicketSnapshot {
  status: string;
  /** เวลากันที่ระหว่างรอจ่าย (`bookings.hold_expires_at` ของใบที่ยังกันอยู่) */
  holdExpiresAt: number | null;
}

/** สถานะของลิงก์ — คำนวณจากลิงก์ + ตั๋วที่ผูกอยู่ (ฟังก์ชันบริสุทธิ์ ใช้ทั้งแผงและด่านตรวจ) */
export function inviteState(
  invite: Pick<ReaderInvite, "expiresAt" | "cancelledAt">,
  ticket: InviteTicketSnapshot | null,
  nowMs: number,
): InviteState {
  if (invite.cancelledAt) return "cancelled";
  if (ticket) {
    if (ticket.status === "waiting") return "paid";
    // รับเข้าห้องแล้ว — แยกจาก "จ่ายแล้ว" ไม่งั้นแผงยังบอกให้กด "รับเข้าห้อง" ทั้งที่กำลังคุยอยู่
    if (ticket.status === "ready") return "in_room";
    if (ticket.status === "handed_off") return "done";
    // กำลังจ่ายจนเลยเวลากันที่ = ปล่อยมือแล้ว ลิงก์กลับมาว่าง (ตั๋วถูกปิดเป็นหมดเวลาเมื่อมีคนอ่าน)
    if (ticket.status === "pending_payment" && (ticket.holdExpiresAt ?? 0) >= nowMs) return "paying";
  }
  return invite.expiresAt <= nowMs ? "expired" : "open";
}

export type CreateInviteResult = { ok: true; invite: ReaderInvite } | { ok: false; reason: "too_many" };

export async function createInvite(readerId: string, label: string | null, nowMs = Date.now()): Promise<CreateInviteResult> {
  const db = await getAppDB();
  const open = await db
    .prepare(
      `SELECT COUNT(*) AS count FROM reader_invites
        WHERE reader_id = ? AND cancelled_at IS NULL AND ticket_id IS NULL AND expires_at > ?`
    )
    .bind(readerId, nowMs)
    .first<{ count: number }>();
  if (Number(open?.count ?? 0) >= MAX_OPEN_INVITES) return { ok: false, reason: "too_many" };

  const invite: ReaderInvite = {
    id: `inv_${randomBytes(8).toString("hex")}`,
    code: randomBytes(16).toString("base64url"),
    readerId,
    label: cleanInviteLabel(label),
    ticketId: null,
    createdAt: nowMs,
    expiresAt: nowMs + INVITE_TTL_HOURS * 60 * 60 * 1000,
    cancelledAt: null,
  };
  await db
    .prepare(
      `INSERT INTO reader_invites (id, code, reader_id, label, ticket_id, created_at, expires_at, cancelled_at)
       VALUES (?, ?, ?, ?, NULL, ?, ?, NULL)`
    )
    .bind(invite.id, invite.code, invite.readerId, invite.label, invite.createdAt, invite.expiresAt)
    .run();
  return { ok: true, invite };
}

export async function getInviteByCode(code: string): Promise<ReaderInvite | null> {
  if (!isInviteCode(code)) return null;
  const db = await getAppDB();
  const row = await db.prepare("SELECT * FROM reader_invites WHERE code = ? LIMIT 1").bind(code).first<RawInviteRow>();
  return row ? mapRow(row) : null;
}

/** ตั๋วใบนี้มาจากลิงก์ห้องส่วนตัวไหม — หน้าคิวของลูกค้าใช้เลือกข้อความ */
export async function isInviteTicket(ticketId: string): Promise<boolean> {
  const db = await getAppDB();
  const row = await db.prepare("SELECT id FROM reader_invites WHERE ticket_id = ? LIMIT 1").bind(ticketId).first<{ id: string }>();
  return Boolean(row);
}

/**
 * ลิงก์ที่แผงแม่หมอควรเห็น: ยังไม่ยกเลิก · ยังไม่คุยเสร็จ · (ยังไม่หมดอายุ หรือมีตั๋วที่ยังไม่จบ) · ใหม่สุดก่อน
 */
export async function listReaderInvites(readerId: string, nowMs = Date.now()): Promise<InviteView[]> {
  const db = await getAppDB();
  const { results } = await db
    .prepare(
      `SELECT i.*, t.status AS ticket_status,
              (SELECT b.hold_expires_at FROM bookings b
                WHERE b.ticket_id = i.ticket_id AND b.status = 'reserved'
                ORDER BY b.created_at DESC LIMIT 1) AS hold_expires_at
         FROM reader_invites i
         LEFT JOIN queue_tickets t ON t.id = i.ticket_id
        WHERE i.reader_id = ? AND i.cancelled_at IS NULL
          AND (i.expires_at > ? OR t.status IN ('pending_payment', 'waiting', 'ready'))
        ORDER BY i.created_at DESC
        LIMIT 20`
    )
    .bind(readerId, nowMs)
    .all<RawInviteRow & { ticket_status: string | null; hold_expires_at: number | null }>();

  const views: InviteView[] = [];
  for (const row of results || []) {
    const invite = mapRow(row);
    const ticket = row.ticket_status
      ? { status: row.ticket_status, holdExpiresAt: row.hold_expires_at === null ? null : Number(row.hold_expires_at) }
      : null;
    const state = inviteState(invite, ticket, nowMs);
    // แผงโชว์เฉพาะลิงก์ที่ยังมีอะไรให้ทำ — คุยเสร็จ/หมดอายุ/ยกเลิกแล้วไม่ต้องรกรายการ "ลิงก์ห้องที่ยังใช้ได้"
    if (state === "expired" || state === "cancelled" || state === "done") continue;
    views.push({
      id: invite.id,
      url: inviteUrl(invite.code),
      label: invite.label,
      state,
      ticketId: invite.ticketId,
      createdAt: invite.createdAt,
      expiresAt: invite.expiresAt,
    });
  }
  return views;
}

export type InviteClaim =
  | { kind: "new"; invite: ReaderInvite }
  /** ลูกค้าคนนี้ใช้ลิงก์นี้ไปแล้ว (รอจ่าย/จ่ายแล้ว) ➔ พากลับไปหน้าคิวของเขา ไม่สร้างตั๋วซ้ำ */
  | { kind: "own"; ticketId: string }
  | { kind: "refused"; status: 404 | 409 | 410; code: string; error: string };

/**
 * ตัดสินว่าลูกค้าคนนี้ใช้ลิงก์ได้ไหม (ก่อนสร้างตั๋ว — ด่านถูก ๆ ก่อนเรียก AI คัดกรอง/เปิดหน้าจ่ายเงิน)
 * `ownerRef` = คุกกี้ลูกค้าของเบราว์เซอร์นี้ (ถ้ามี) · ห้ามรับค่าจาก body
 */
export async function resolveInviteClaim(
  code: string,
  readerId: string,
  ownerRef: string | null,
  ownerUserId: string | null,
  nowMs = Date.now(),
): Promise<InviteClaim> {
  const invite = await getInviteByCode(code);
  if (!invite || invite.readerId !== readerId) {
    return { kind: "refused", status: 404, code: "invite_invalid", error: "ไม่พบลิงก์ห้องนี้ ขอลิงก์ใหม่จากแม่หมอได้เลย" };
  }
  if (invite.cancelledAt) {
    return { kind: "refused", status: 410, code: "invite_cancelled", error: "แม่หมอยกเลิกลิงก์ห้องนี้แล้ว ขอลิงก์ใหม่จากแม่หมอได้เลย" };
  }

  let previous: QueueTicket | null = invite.ticketId ? await getQueueTicketById(invite.ticketId) : null;
  // รอจ่ายจนเลยเวลากันที่ ➔ ปิดเป็นหมดเวลาให้ตรงนี้เลย ลิงก์จะได้ว่างให้ใช้ต่อ
  if (previous && (await expireLapsedHold(previous, nowMs))) previous = await getQueueTicketById(previous.id);
  if (previous) {
    const isOwner =
      (ownerRef !== null && previous.customerRef === ownerRef) ||
      (ownerUserId !== null && previous.userId !== null && previous.userId === ownerUserId);
    const active = ["pending_payment", "waiting", "ready", "handed_off"].includes(previous.status);
    if (active && isOwner) return { kind: "own", ticketId: previous.id };
    if (previous.status === "pending_payment") {
      return {
        kind: "refused",
        status: 409,
        code: "invite_busy",
        error: "มีคนกำลังชำระเงินผ่านลิงก์นี้อยู่ ถ้าไม่ใช่คุณ ทักแม่หมอขอลิงก์ใหม่ได้เลย",
      };
    }
    if (active) {
      return {
        kind: "refused",
        status: 410,
        code: "invite_used",
        error: "ลิงก์ห้องนี้มีคนใช้ไปแล้ว ถ้าคุณจ่ายแล้ว เปิด \"ลิงก์นัดของคุณ\" จากอีเมลยืนยัน หรือทักแม่หมอได้เลย",
      };
    }
    // ตั๋วเดิมถูกยกเลิก/หมดเวลา (เช่น ยกเลิกระหว่างรอแล้วได้เงินคืน) ➔ ลิงก์ใช้ต่อได้ถ้ายังไม่หมดอายุ
  }
  if (invite.expiresAt <= nowMs) {
    return { kind: "refused", status: 410, code: "invite_expired", error: "ลิงก์ห้องนี้หมดอายุแล้ว ขอลิงก์ใหม่จากแม่หมอได้เลย" };
  }
  return { kind: "new", invite };
}

/**
 * ผูกตั๋วใหม่กับลิงก์แบบ compare-and-swap — คนที่สองที่กดจ่ายพร้อมกันได้ false (แล้วต้องปล่อยตั๋วของตัวเอง)
 */
export async function attachInviteTicket(inviteId: string, expectedTicketId: string | null, ticketId: string): Promise<boolean> {
  const db = await getAppDB();
  const res = await db
    .prepare("UPDATE reader_invites SET ticket_id = ? WHERE id = ? AND cancelled_at IS NULL AND ticket_id IS ?")
    .bind(ticketId, inviteId, expectedTicketId)
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

export type CancelInviteResult = { ok: true; releasedTicketId: string | null } | { ok: false; reason: "not_found" | "paid" };

/**
 * แม่หมอยกเลิกลิงก์ — ลูกค้าที่จ่ายแล้วยกเลิกที่นี่ไม่ได้ (ต้องยกเลิกที่การ์ดคิว ซึ่งคืนเงินให้ตามนโยบาย)
 * มีคนกำลังจ่ายอยู่ ➔ ปล่อยที่ทันที: ถ้าเงินมาถึงทีหลัง `settleConsultationPayment` เห็นตั๋วถูกยกเลิกแล้วจะคืนเงินเอง
 */
export async function cancelInvite(readerId: string, inviteId: string, nowMs = Date.now()): Promise<CancelInviteResult> {
  const db = await getAppDB();
  const row = await db
    .prepare("SELECT * FROM reader_invites WHERE id = ? AND reader_id = ? LIMIT 1")
    .bind(inviteId, readerId)
    .first<RawInviteRow>();
  if (!row || row.cancelled_at) return { ok: false, reason: "not_found" };
  const ticket = row.ticket_id ? await getQueueTicketById(row.ticket_id) : null;
  if (ticket && (ticket.status === "waiting" || ticket.status === "ready")) return { ok: false, reason: "paid" };

  const res = await db
    .prepare("UPDATE reader_invites SET cancelled_at = ? WHERE id = ? AND reader_id = ? AND cancelled_at IS NULL")
    .bind(nowMs, inviteId, readerId)
    .run();
  if ((res.meta?.changes ?? 0) === 0) return { ok: false, reason: "not_found" };
  if (ticket?.status === "pending_payment") {
    await releaseHold(ticket.id, "cancelled", "reader");
    return { ok: true, releasedTicketId: ticket.id };
  }
  return { ok: true, releasedTicketId: null };
}
