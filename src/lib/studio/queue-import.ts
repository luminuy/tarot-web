import { createHash } from "node:crypto";
import { getAppDB } from "@/lib/platform/db";
import { looksLikePromptInjection } from "@/lib/ai/prompt-guard";

/**
 * 📥 เริ่มคำอ่านในสตูดิโอจากคิว/นัดที่ลูกค้าจองผ่านเว็บ (REFLECTION_JOURNAL_PLAN 1.13 — "ลูกค้าจากคิวที่จองผ่านเว็บ")
 *  • เห็นเฉพาะตั๋วของแม่หมอคนนั้น ที่จ่าย/เข้าคิวแล้ว (ไม่รวมรอจ่าย · ยกเลิก · หมดอายุ) ย้อนหลัง 60 วัน
 *  • ลูกค้าคนเดิมจองซ้ำ ➔ ผูกกับลูกค้าคนเดิมในสตูดิโอ ด้วยแฮชของ (reader_id + customer_ref) — ไม่เก็บตัวอ้างอิงดิบ
 *    แม่หมอต่างคนได้แฮชต่างกัน จึงไม่มีใครเอาแฮชไปจับคู่ลูกค้าข้ามแม่หมอได้
 *  • ตั๋วหนึ่งใบเริ่มคำอ่านได้ครั้งเดียว (ดัชนี UNIQUE ใน 0027)
 *  • คำถามจากตั๋วที่มีคำสั่งแฝง ➔ ไม่เติมให้ (หมอพิมพ์เองได้)
 */

export const IMPORT_WINDOW_DAYS = 60;
const IMPORTABLE_STATUSES = ["waiting", "ready", "handed_off"] as const;
export const TICKET_ID = /^ticket_[0-9a-f]{16}$/;

export function customerSourceHash(readerId: string, customerRef: string): string {
  return createHash("sha256").update(`studio-client:${readerId}:${customerRef}`).digest("hex");
}

interface TicketRow {
  id: string;
  kind: string;
  status: string;
  nickname: string | null;
  question: string | null;
  customer_ref: string;
  slot_start: number | null;
  created_at: number;
}

export interface ImportableTicket {
  ticketId: string;
  kind: "walkup" | "booking";
  nickname: string | null;
  question: string | null;
  at: number;
  /** ลูกค้าคนนี้มีอยู่ในสตูดิโอแล้ว (จากการนำเข้าครั้งก่อน) */
  clientId: string | null;
  /** เริ่มคำอ่านจากตั๋วนี้ไปแล้ว */
  readingId: string | null;
}

const safeQuestion = (q: string | null) => {
  const t = q?.trim().slice(0, 500) || null;
  return t && !looksLikePromptInjection(t) ? t : null;
};

export async function listImportableTickets(readerId: string, now = Date.now()): Promise<ImportableTicket[]> {
  const db = await getAppDB();
  const since = now - IMPORT_WINDOW_DAYS * 86_400_000;
  const { results } = await db
    .prepare(
      `SELECT id, kind, status, nickname, question, customer_ref, slot_start, created_at FROM queue_tickets
       WHERE reader_id = ? AND status IN (${IMPORTABLE_STATUSES.map(() => "?").join(",")}) AND created_at >= ?
       ORDER BY COALESCE(slot_start, created_at) DESC LIMIT 50`,
    )
    .bind(readerId, ...IMPORTABLE_STATUSES, since)
    .all<TicketRow>();
  const rows = results || [];
  if (!rows.length) return [];
  const imported = await db
    .prepare(`SELECT id, source_ticket_id FROM reader_readings WHERE reader_id = ? AND source_ticket_id IN (${rows.map(() => "?").join(",")})`)
    .bind(readerId, ...rows.map((r) => r.id))
    .all<{ id: string; source_ticket_id: string }>();
  const readingByTicket = new Map((imported.results || []).map((x) => [x.source_ticket_id, x.id]));
  const hashes = [...new Set(rows.map((r) => customerSourceHash(readerId, r.customer_ref)))];
  const clients = await db
    .prepare(`SELECT id, source_customer_hash FROM reader_clients WHERE reader_id = ? AND source_customer_hash IN (${hashes.map(() => "?").join(",")})`)
    .bind(readerId, ...hashes)
    .all<{ id: string; source_customer_hash: string }>();
  const clientByHash = new Map((clients.results || []).map((x) => [x.source_customer_hash, x.id]));
  return rows.map((r) => ({
    ticketId: r.id,
    kind: r.kind === "booking" ? "booking" : "walkup",
    nickname: r.nickname?.trim().slice(0, 80) || null,
    question: safeQuestion(r.question),
    at: r.slot_start ?? r.created_at,
    clientId: clientByHash.get(customerSourceHash(readerId, r.customer_ref)) ?? null,
    readingId: readingByTicket.get(r.id) ?? null,
  }));
}

/** ตั๋วที่นำเข้าได้ของแม่หมอคนนี้ — ไม่ใช่ของตัวเอง/สถานะไม่เข้าเกณฑ์/เก่าเกิน = null */
export async function getImportableTicket(
  readerId: string,
  ticketId: string,
  now = Date.now(),
): Promise<{ ticketId: string; nickname: string | null; question: string | null; at: number; sourceCustomerHash: string } | null> {
  if (!TICKET_ID.test(ticketId)) return null;
  const db = await getAppDB();
  const r = await db
    .prepare(
      `SELECT id, kind, status, nickname, question, customer_ref, slot_start, created_at FROM queue_tickets
       WHERE id = ? AND reader_id = ? AND status IN (${IMPORTABLE_STATUSES.map(() => "?").join(",")}) AND created_at >= ?`,
    )
    .bind(ticketId, readerId, ...IMPORTABLE_STATUSES, now - IMPORT_WINDOW_DAYS * 86_400_000)
    .first<TicketRow>();
  if (!r) return null;
  return {
    ticketId: r.id,
    nickname: r.nickname?.trim().slice(0, 80) || null,
    question: safeQuestion(r.question),
    at: r.slot_start ?? r.created_at,
    sourceCustomerHash: customerSourceHash(readerId, r.customer_ref),
  };
}

export async function readingForTicket(readerId: string, ticketId: string): Promise<string | null> {
  const db = await getAppDB();
  const r = await db.prepare(`SELECT id FROM reader_readings WHERE reader_id = ? AND source_ticket_id = ?`).bind(readerId, ticketId).first<{ id: string }>();
  return r?.id ?? null;
}
