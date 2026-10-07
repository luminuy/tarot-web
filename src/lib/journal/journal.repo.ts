import { getAppDB } from "@/lib/platform/db";
import type { SavedReadingItem, SavedCardDetail, ReadingOutcome, ReadingMetaPatch } from "@/lib/utils/history";
import type { ReadingBasis } from "@/lib/tarot/explain-types";
import type { JournalRitual, RitualKind } from "@/lib/journal/journal-types";
import { normalizeTags } from "@/lib/journal/journal-types";
import { isMoodLevel } from "@/lib/journal/mood";
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
  // ── v2 (migrations/0022) — อาจไม่มีในฐานข้อมูลที่ยังไม่รัน migration ➔ อ่านแบบ optional ทุกช่อง ──
  pinned?: number | null;
  tags_json?: string | null;
  mood_before?: number | null;
  mood_after?: number | null;
  thread_id?: string | null;
  checkin_at?: number | null;
  share_with_ai?: number | null;
  basis_json?: string | null;
  ritual_kind?: string | null;
  ritual_json?: string | null;
}

/** JSON ของช่องเสริม (ไม่ใช่ไพ่) พังได้โดยไม่ทำให้ทั้งรายการเสีย — คืน undefined เงียบ ๆ */
function parseOptionalJson<T>(raw: string | null | undefined): T | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

/** ค่าที่เขียนลงคอลัมน์ v2 — ใช้ร่วมกันทั้งบันทึกเดี่ยวและนำเข้าเป็นชุด */
function v2Values(item: Partial<SavedReadingItem>) {
  const tags = normalizeTags(item.tags);
  return [
    item.pinned ? 1 : 0,
    JSON.stringify(tags),
    isMoodLevel(item.moodBefore) ? item.moodBefore : null,
    isMoodLevel(item.moodAfter) ? item.moodAfter : null,
    item.threadId || null,
    item.checkinAt ? new Date(item.checkinAt).getTime() || null : null,
    item.shareWithAi ? 1 : 0,
    item.basis ? JSON.stringify(item.basis) : null,
    item.ritualKind || null,
    item.ritual ? JSON.stringify(item.ritual) : null,
  ] as const;
}

const V2_COLUMNS =
  "pinned, tags_json, mood_before, mood_after, thread_id, checkin_at, share_with_ai, basis_json, ritual_kind, ritual_json";

function mapRowToItem(row: RawJournalRow): SavedReadingItem {
  /*
   * 🃏 กฎเหล็กข้อ 14 · T-47 — JSON ที่พังต้องไม่กลายเป็น "การอ่านที่ไม่มีไพ่"
   * ของเดิม `try { JSON.parse } catch {}` ทำให้ผู้ใช้เห็นการอ่านในอดีตที่ดูเหมือนไม่มีไพ่เลย
   * โดยไม่มีปุ่มโหลดใหม่ ซึ่งขัดกับเจตนารมณ์ของกฎข้อ 14 ตรง ๆ (ข้อมูลหาย = ต้องบอก ไม่ใช่เดา)
   */
  let corrupted = false;

  let cards: SavedCardDetail[] = [];
  try {
    const parsed = JSON.parse(row.cards_json);
    if (Array.isArray(parsed) && parsed.length > 0) {
      cards = parsed;
    } else {
      corrupted = true;
    }
  } catch {
    corrupted = true;
  }

  let advice: string[] = [];
  try {
    advice = JSON.parse(row.advice_json);
  } catch {
    corrupted = true;
  }

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
    pinned: row.pinned === 1 || undefined,
    tags: (() => {
      const t = normalizeTags(parseOptionalJson<string[]>(row.tags_json));
      return t.length > 0 ? t : undefined;
    })(),
    moodBefore: isMoodLevel(row.mood_before) ? row.mood_before : undefined,
    moodAfter: isMoodLevel(row.mood_after) ? row.mood_after : undefined,
    threadId: row.thread_id || undefined,
    checkinAt: row.checkin_at ? new Date(row.checkin_at).toISOString() : undefined,
    shareWithAi: row.share_with_ai === 1 || undefined,
    basis: parseOptionalJson<ReadingBasis>(row.basis_json),
    ritualKind: row.ritual_kind === "morning" || row.ritual_kind === "evening" ? (row.ritual_kind as RitualKind) : undefined,
    ritual: parseOptionalJson<JournalRitual>(row.ritual_json),
    ...(corrupted ? { corrupted: true } : {}),
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
  // ⚠️ ต้องมีขอบล่างด้วย ไม่ใช่แค่ Math.min — `?limit=-1` ทำให้ได้ `LIMIT -1`
  // ซึ่งใน SQLite แปลว่า "ไม่จำกัด" คืนสมุดบันทึกทั้งเล่มพร้อม cards_json ในครั้งเดียว
  const rawLimit = Number(opts?.limit);
  const limit = Number.isFinite(rawLimit) ? Math.min(200, Math.max(1, Math.floor(rawLimit))) : 50;
  const rawBefore = Number(opts?.before);
  const before = Number.isFinite(rawBefore) && rawBefore > 0 ? rawBefore : Date.now() + 10000;

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
 * สมุดบันทึก "ทั้งเล่ม" สำหรับส่งออกข้อมูลตาม PDPA เท่านั้น (A1-04)
 * ⚠️ `listJournal` มีเพดาน 200 แถวเพื่อหน้าจอ — ใช้กับการส่งออกแล้วผู้ใช้ที่เปิดไพ่เกิน 200 ครั้ง
 *    ได้สำเนาข้อมูลไม่ครบ (และไฟล์รายงานยอดผิด) ซึ่งขัดสิทธิ์ขอสำเนาข้อมูล
 *    เส้นส่งออกมีเพดานถี่อยู่แล้ว (5 ครั้ง/5 นาที) จึงอ่านทั้งเล่มได้
 */
export async function listAllJournalForExport(userId: string): Promise<SavedReadingItem[]> {
  const db = await getAppDB();
  const { results } = await db
    .prepare(`SELECT * FROM reading_journal WHERE user_id = ? ORDER BY created_at DESC`)
    .bind(userId)
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
         timing, outcome, user_note, created_at, ${V2_COLUMNS}
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      createdAt,
      ...v2Values(item)
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
const IMPORT_MAX_ITEMS = 200;
/** จำนวนคำสั่งต่อ 1 batch — เผื่อเพดานขนาด payload ของ D1 ไว้ */
const IMPORT_BATCH_SIZE = 50;

export async function bulkImportJournal(
  userId: string,
  items: SavedReadingItem[]
): Promise<{ merged: number; skipped: number }> {
  const slice = items.slice(0, IMPORT_MAX_ITEMS);
  if (slice.length === 0) return { merged: 0, skipped: 0 };

  const db = await getAppDB();

  // รวมคำสั่งเป็นชุดเดียวด้วย `db.batch()` แทนการ await ทีละแถว
  // ---------------------------------------------------------------------------
  // ของเดิมวน `await insertJournal()` ทีละรายการ = ยิง D1 ได้ถึง 200 รอบต่อการนำเข้า
  // 1 ครั้ง (แต่ละรอบมี network roundtrip ของตัวเอง) ผู้ใช้ที่มีประวัติเยอะจึงรอนาน
  // และเปลืองโควตา D1 โดยไม่จำเป็น
  //
  // ปลอดภัยที่จะรวมเพราะทุกคำสั่งเป็น INSERT อิสระที่มี `ON CONFLICT DO NOTHING`
  // อยู่แล้ว — รายการซ้ำจึงไม่ throw และไม่ทำให้ทั้ง batch ล้ม
  // (ต่างจาก `consumeReading()` ที่คำสั่งชั้นถัดไปขึ้นกับผลของชั้นก่อน จึงรวมไม่ได้)
  const statements = slice.map((item) => {
    const id = item.id?.startsWith("rj_") ? item.id : `rj_${crypto.randomUUID()}`;
    const createdAt = item.date ? new Date(item.date).getTime() : Date.now();
    return db
      .prepare(
        `INSERT INTO reading_journal (
           id, user_id, content_hash, question, nickname, spread_id, spread_name,
           category, persona_id, persona_name, cards_json, summary, advice_json,
           timing, outcome, user_note, created_at, ${V2_COLUMNS}
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id, content_hash) DO NOTHING`
      )
      .bind(
        id,
        userId,
        computeContentHash(item.question, item.cards),
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
        createdAt,
        ...v2Values(item)
      );
  });

  // สภาพแวดล้อมทดสอบบางตัวใช้ DB stub ที่ไม่มี `batch()` — ถอยไปเขียนทีละแถวให้ทำงานได้เหมือนเดิม
  if (typeof db.batch !== "function") {
    let merged = 0;
    let skipped = 0;
    for (const item of slice) {
      try {
        await insertJournal(userId, item);
        merged++;
      } catch {
        skipped++;
      }
    }
    return { merged, skipped };
  }

  let merged = 0;
  for (let i = 0; i < statements.length; i += IMPORT_BATCH_SIZE) {
    const chunk = statements.slice(i, i + IMPORT_BATCH_SIZE);
    try {
      const results = (await db.batch(chunk)) as Array<{ meta?: { changes?: number } }>;
      for (const r of results) {
        if ((r?.meta?.changes ?? 0) > 0) merged++;
      }
    } catch {
      // ทั้งชุดล้ม (เช่น ตารางหาย) — นับเป็น skipped ทั้งชุด ไม่ให้ทั้งคำขอพัง
    }
  }

  return { merged, skipped: slice.length - merged };
}

/**
 * อัปเดตผลลัพธ์ความเป็นจริงในชีวิต (Outcome) และบันทึกเพิ่มเติม
 */
export async function updateJournalOutcome(
  userId: string,
  id: string,
  outcome: ReadingOutcome,
  note?: string
): Promise<boolean> {
  const db = await getAppDB();
  const now = Date.now();

  // ⚠️ ต้องคืนผลว่าแตะแถวได้จริงไหม — ของเดิมคืน void เสมอ ปลายทางจึงตอบ success
  // แม้จะไม่มีแถวไหนตรงเลย (เกิดขึ้นจริงเมื่อ id ฝั่งเครื่องกับฝั่งเซิร์ฟเวอร์ไม่ตรงกัน)
  const res = await db
    .prepare(
      `UPDATE reading_journal
       SET outcome = ?, user_note = COALESCE(?, user_note), outcome_updated_at = ?
       WHERE id = ? AND user_id = ?`
    )
    .bind(outcome, note ?? null, now, id, userId)
    .run();

  return (res.meta?.changes ?? 0) > 0;
}

/**
 * ✦ แก้ช่องเสริมของบันทึก (สมุดดวง v2) — ปักหมุด · แท็ก · ใจตอนนี้ · ยินยอมให้ AI อ่าน · บันทึกพิธี · ผลจริง
 * ---------------------------------------------------------------------------
 * แก้เฉพาะช่องที่ส่งมา (`undefined` = ไม่แตะ · `null` ของใจ = ล้างค่า) ด้วย UPDATE ครั้งเดียว
 * ⚠️ ไม่มีทางแก้คำถาม/ไพ่/คำอ่านได้จากที่นี่ — คำอ่านในอดีตต้องตรงกับที่สุ่มได้จริง (Provably Fair)
 * `ritual` ผสานกับของเดิม (อ่านก่อนเขียน) เพราะเช้ากับเย็นเขียนคนละรอบ
 */
export async function updateJournalMeta(userId: string, id: string, patch: ReadingMetaPatch): Promise<boolean> {
  const db = await getAppDB();
  const sets: string[] = [];
  const binds: unknown[] = [];
  const set = (col: string, value: unknown) => {
    sets.push(`${col} = ?`);
    binds.push(value);
  };

  if (patch.outcome !== undefined) {
    set("outcome", patch.outcome);
    set("outcome_updated_at", Date.now());
  }
  if (patch.userNote !== undefined) set("user_note", patch.userNote || null);
  if (patch.pinned !== undefined) set("pinned", patch.pinned ? 1 : 0);
  if (patch.tags !== undefined) set("tags_json", JSON.stringify(normalizeTags(patch.tags)));
  if (patch.moodBefore !== undefined) set("mood_before", isMoodLevel(patch.moodBefore) ? patch.moodBefore : null);
  if (patch.moodAfter !== undefined) set("mood_after", isMoodLevel(patch.moodAfter) ? patch.moodAfter : null);
  if (patch.shareWithAi !== undefined) set("share_with_ai", patch.shareWithAi ? 1 : 0);
  if (patch.threadId !== undefined) set("thread_id", patch.threadId || null);
  if (patch.checkinAt !== undefined) {
    set("checkin_at", patch.checkinAt ? new Date(patch.checkinAt).getTime() || null : null);
    set("checkin_sent_at", null); // นัดใหม่ = ส่งเตือนใหม่ได้อีกครั้ง
  }
  if (patch.ritual !== undefined) {
    const row = await db
      .prepare(`SELECT ritual_json FROM reading_journal WHERE id = ? AND user_id = ?`)
      .bind(id, userId)
      .first<{ ritual_json: string | null }>();
    if (!row) return false;
    const merged = { ...(parseOptionalJson<JournalRitual>(row.ritual_json) ?? {}), ...patch.ritual };
    set("ritual_json", JSON.stringify(merged));
  }
  if (sets.length === 0) return false;

  const res = await db
    .prepare(`UPDATE reading_journal SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`)
    .bind(...binds, id, userId)
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

/**
 * ✦ ค้นสมุดฝั่งเซิร์ฟเวอร์ — ใช้เมื่อเกิน 200 รายการที่หน้าจอโหลดไว้ (ในเครื่องค้นไม่ถึง)
 * ค้นในคำถาม · ชื่อผัง · บันทึก · แท็ก · ชื่อไพ่ (อยู่ใน cards_json) ด้วย LIKE
 * ⚠️ ผู้เรียกต้องผ่านเพดานถี่ก่อน — LIKE '%x%' สแกนทั้งแถวของผู้ใช้คนนั้น (ดัชนี user_id จำกัดขอบเขตไว้)
 * ⚠️ escape `%` `_` `\` ของผู้ใช้ — ไม่งั้นค้น "50%" ได้ทุกแถว
 */
export async function searchJournal(userId: string, query: string, limit = 50): Promise<SavedReadingItem[]> {
  const db = await getAppDB();
  const needle = `%${query.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const { results } = await db
    .prepare(
      `SELECT * FROM reading_journal
       WHERE user_id = ?1 AND (
         question LIKE ?2 ESCAPE '\\' OR spread_name LIKE ?2 ESCAPE '\\' OR
         user_note LIKE ?2 ESCAPE '\\' OR tags_json LIKE ?2 ESCAPE '\\' OR cards_json LIKE ?2 ESCAPE '\\'
       )
       ORDER BY created_at DESC
       LIMIT ?3`
    )
    .bind(userId, needle, Math.min(100, Math.max(1, limit)))
    .all<RawJournalRow>();
  return (results || []).map(mapRowToItem);
}

/**
 * ลบบันทึกการดูดวง 1 รายการ
 */
export async function deleteJournalItem(userId: string, id: string): Promise<boolean> {
  const db = await getAppDB();
  const res = await db
    .prepare(`DELETE FROM reading_journal WHERE id = ? AND user_id = ?`)
    .bind(id, userId)
    .run();

  return (res.meta?.changes ?? 0) > 0;
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

/** คำอ่านในเส้นเรื่องเดียวกัน (เก่า ➔ ใหม่) — ใช้กับหน้าเส้นเวลาและความทรงจำแม่หมอตามเรื่อง */
export async function listThreadEntries(userId: string, threadId: string, limit = 50): Promise<SavedReadingItem[]> {
  const db = await getAppDB();
  const { results } = await db
    .prepare(
      `SELECT * FROM reading_journal WHERE user_id = ? AND thread_id = ?
       ORDER BY created_at DESC LIMIT ?`
    )
    .bind(userId, threadId, Math.min(100, Math.max(1, limit)))
    .all<RawJournalRow>();
  return (results || []).map(mapRowToItem).reverse();
}

export interface DueCheckin {
  id: string;
  userId: string;
  createdAt: number;
  checkinAt: number;
  threadId: string | null;
  cardsJson: string;
}

/** นัดกลับมาเช็กที่ถึงเวลาแล้วและยังไม่ได้ส่งเตือน · ผลจริงยังเป็น PENDING เท่านั้น (บันทึกแล้วไม่ต้องเตือน) */
export async function listDueCheckins(now: number, limit: number): Promise<DueCheckin[]> {
  const db = await getAppDB();
  const { results } = await db
    .prepare(
      `SELECT id, user_id, created_at, checkin_at, thread_id, cards_json FROM reading_journal
       WHERE checkin_at IS NOT NULL AND checkin_at <= ? AND checkin_sent_at IS NULL AND outcome = 'PENDING'
       ORDER BY checkin_at ASC LIMIT ?`
    )
    .bind(now, limit)
    .all<{ id: string; user_id: string; created_at: number; checkin_at: number; thread_id: string | null; cards_json: string }>();
  return (results || []).map((r) => ({
    id: r.id,
    userId: r.user_id,
    createdAt: r.created_at,
    checkinAt: r.checkin_at,
    threadId: r.thread_id,
    cardsJson: r.cards_json,
  }));
}

/** จองการส่งเตือน (กันส่งซ้ำเมื่อ cron ทำงานซ้อน) — true = รอบนี้เป็นคนส่ง */
export async function claimCheckin(id: string, now: number): Promise<boolean> {
  const db = await getAppDB();
  const res = await db
    .prepare(`UPDATE reading_journal SET checkin_sent_at = ? WHERE id = ? AND checkin_sent_at IS NULL`)
    .bind(now, id)
    .run();
  return (res.meta?.changes ?? 0) > 0;
}
