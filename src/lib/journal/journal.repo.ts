import { getAppDB } from "@/lib/platform/db";
import type { SavedReadingItem, SavedCardDetail, ReadingOutcome } from "@/lib/utils/history";
import { createHash } from "node:crypto";

export function computeContentHash(question: string, cards: SavedCardDetail[]): string {
  const cardKey = (cards || [])
    .map((c) => `${c.cardIndex}:${c.isReversed ? "rev" : "up"}`)
    .sort()
    .join(",");
  return createHash("sha256").update(`${question.trim()}|${cardKey}`).digest("hex");
}

interface RawJournalRow {
  id: string;
  user_id: string;
  content_hash: string;
  question: string;
  nickname: string | null;
  spread_id: string;
  spread_name: string;
  category: string;
  persona_id: string;
  persona_name: string;
  cards_json: string;
  summary: string;
  advice_json: string;
  timing: string | null;
  outcome: string;
  user_note: string | null;
  outcome_updated_at: number | null;
  created_at: number;
}

function mapRowToItem(row: RawJournalRow): SavedReadingItem {
  let cards: SavedCardDetail[] = [];
  try {
    cards = JSON.parse(row.cards_json);
  } catch {}

  let advice: string[] = [];
  try {
    advice = JSON.parse(row.advice_json);
  } catch {}

  return {
    id: row.id,
    date: new Date(row.created_at).toISOString(),
    nickname: row.nickname || undefined,
    question: row.question,
    spreadId: row.spread_id,
    spreadName: row.spread_name,
    category: row.category,
    personaId: row.persona_id,
    personaName: row.persona_name,
    cards,
    summary: row.summary,
    advice,
    timing: row.timing || undefined,
    outcome: (row.outcome as ReadingOutcome) || "PENDING",
    userNote: row.user_note || undefined,
    outcomeUpdatedAt: row.outcome_updated_at ? new Date(row.outcome_updated_at).toISOString() : undefined,
  };
}

/**
 * ดึงรายการบันทึกดูดวงทั้งหมดของผู้ใช้ (เรียงจากล่าสุดไปเก่าสุด)
 */
export async function listJournal(
  userId: string,
  opts?: { limit?: number; before?: number }
): Promise<SavedReadingItem[]> {
  const db = await getAppDB();
  const limit = Math.min(200, opts?.limit ?? 50);
  const before = opts?.before ?? Date.now() + 10000;

  const { results } = await db
    .prepare(
      `SELECT * FROM reading_journal
       WHERE user_id = ? AND created_at < ?
       ORDER BY created_at DESC
       LIMIT ?`
    )
    .bind(userId, before, limit)
    .all<RawJournalRow>();

  return (results || []).map(mapRowToItem);
}

/**
 * เพิ่มบันทึกการดูดวงใหม่ของผู้ใช้ (พร้อมระบบ Deduplication ป้องกันการบันทึกซ้ำ)
 */
export async function insertJournal(
  userId: string,
  item: Omit<SavedReadingItem, "id" | "date"> & { id?: string; date?: string }
): Promise<SavedReadingItem> {
  const db = await getAppDB();
  const id = item.id?.startsWith("rj_") ? item.id : `rj_${crypto.randomUUID()}`;
  const createdAt = item.date ? new Date(item.date).getTime() : Date.now();
  const contentHash = computeContentHash(item.question, item.cards);

  await db
    .prepare(
      `INSERT INTO reading_journal (
         id, user_id, content_hash, question, nickname, spread_id, spread_name,
         category, persona_id, persona_name, cards_json, summary, advice_json,
         timing, outcome, user_note, created_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, content_hash) DO NOTHING`
    )
    .bind(
      id,
      userId,
      contentHash,
      item.question,
      item.nickname || null,
      item.spreadId,
      item.spreadName,
      item.category,
      item.personaId,
      item.personaName,
      JSON.stringify(item.cards || []),
      item.summary || "",
      JSON.stringify(item.advice || []),
      item.timing || null,
      item.outcome || "PENDING",
      item.userNote || null,
      createdAt
    )
    .run();

  return {
    ...item,
    id,
    date: new Date(createdAt).toISOString(),
    outcome: item.outcome || "PENDING",
  };
}

/**
 * นำเข้าประวัติดูดวงจากเครื่อง (localStorage) ขึ้นเซิร์ฟเวอร์แบบ Batch
 */
export async function bulkImportJournal(
  userId: string,
  items: SavedReadingItem[]
): Promise<{ merged: number; skipped: number }> {
  let merged = 0;
  let skipped = 0;

  for (const item of items.slice(0, 200)) {
    try {
      await insertJournal(userId, item);
      merged++;
    } catch {
      skipped++;
    }
  }

  return { merged, skipped };
}

/**
 * อัปเดตผลลัพธ์ความเป็นจริงในชีวิต (Outcome) และบันทึกเพิ่มเติม
 */
export async function updateJournalOutcome(
  userId: string,
  id: string,
  outcome: ReadingOutcome,
  note?: string
): Promise<void> {
  const db = await getAppDB();
  const now = Date.now();

  await db
    .prepare(
      `UPDATE reading_journal
       SET outcome = ?, user_note = COALESCE(?, user_note), outcome_updated_at = ?
       WHERE id = ? AND user_id = ?`
    )
    .bind(outcome, note ?? null, now, id, userId)
    .run();
}

/**
 * ลบบันทึกการดูดวง 1 รายการ
 */
export async function deleteJournalItem(userId: string, id: string): Promise<void> {
  const db = await getAppDB();
  await db
    .prepare(`DELETE FROM reading_journal WHERE id = ? AND user_id = ?`)
    .bind(id, userId)
    .run();
}

/**
 * ลบประวัติดูดวงทั้งหมดของผู้ใช้ (เช่น ตอนขอลบบัญชี)
 */
export async function deleteAllJournal(userId: string): Promise<number> {
  const db = await getAppDB();
  const res = await db
    .prepare(`DELETE FROM reading_journal WHERE user_id = ?`)
    .bind(userId)
    .run();
  return res.meta?.changes ?? 0;
}

/**
 * นับจำนวนคำทำนายที่ยังรอติดตามผล (PENDING) และเกินจำนวนวันที่กำหนด
 */
export async function countPendingOlderThan(userId: string, days: number): Promise<number> {
  const db = await getAppDB();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  const row = await db
    .prepare(
      `SELECT COUNT(*) as count FROM reading_journal
       WHERE user_id = ? AND outcome = 'PENDING' AND created_at <= ?`
    )
    .bind(userId, cutoff)
    .first<{ count: number }>();

  return Number(row?.count ?? 0);
}
