import { getAppDB } from "@/lib/platform/db";

/**
 * 🧵 เส้นเรื่อง (Reading Threads) — REFLECTION_JOURNAL_PLAN 1.4 · migrations/0023
 * ผู้ใช้ผูกคำอ่านหลายครั้งเป็นเรื่องเดียวกันเอง (ไม่เดา) · ทุกคำสั่งกรองด้วย user_id เสมอ
 */

export interface JournalThread {
  id: string;
  title: string;
  status: "open" | "closed";
  closingNote?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  /** จำนวนคำอ่านในเรื่องนี้ (คำนวณตอนอ่าน) */
  entryCount?: number;
  lastEntryAt?: string;
}

interface Row {
  id: string;
  title: string;
  status: string;
  closing_note: string | null;
  created_at: number;
  updated_at: number;
  closed_at: number | null;
  entry_count?: number | null;
  last_entry_at?: number | null;
}

/** เพดานเรื่องที่เปิดพร้อมกัน — เส้นเรื่องคือสิ่งที่ "ติดตามอยู่" ไม่ใช่โฟลเดอร์เก็บของ */
export const MAX_OPEN_THREADS = 20;

function map(r: Row): JournalThread {
  return {
    id: r.id,
    title: r.title,
    status: r.status === "closed" ? "closed" : "open",
    closingNote: r.closing_note || undefined,
    createdAt: new Date(r.created_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
    closedAt: r.closed_at ? new Date(r.closed_at).toISOString() : undefined,
    entryCount: r.entry_count ?? 0,
    lastEntryAt: r.last_entry_at ? new Date(r.last_entry_at).toISOString() : undefined,
  };
}

export async function listThreads(userId: string, status?: "open" | "closed"): Promise<JournalThread[]> {
  const db = await getAppDB();
  const { results } = await db
    .prepare(
      `SELECT t.*, (SELECT COUNT(*) FROM reading_journal j WHERE j.user_id = t.user_id AND j.thread_id = t.id) AS entry_count,
              (SELECT MAX(created_at) FROM reading_journal j WHERE j.user_id = t.user_id AND j.thread_id = t.id) AS last_entry_at
       FROM journal_threads t
       WHERE t.user_id = ? ${status ? "AND t.status = ?" : ""}
       ORDER BY t.updated_at DESC
       LIMIT 100`
    )
    .bind(...(status ? [userId, status] : [userId]))
    .all<Row>();
  return (results || []).map(map);
}

export async function getThread(userId: string, id: string): Promise<JournalThread | null> {
  const db = await getAppDB();
  const row = await db.prepare(`SELECT * FROM journal_threads WHERE id = ? AND user_id = ?`).bind(id, userId).first<Row>();
  return row ? map(row) : null;
}

export async function countOpenThreads(userId: string): Promise<number> {
  const db = await getAppDB();
  const row = await db
    .prepare(`SELECT COUNT(*) AS n FROM journal_threads WHERE user_id = ? AND status = 'open'`)
    .bind(userId)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

export async function createThread(userId: string, title: string): Promise<JournalThread> {
  const db = await getAppDB();
  const now = Date.now();
  const id = `th_${crypto.randomUUID()}`;
  await db
    .prepare(`INSERT INTO journal_threads (id, user_id, title, status, created_at, updated_at) VALUES (?, ?, ?, 'open', ?, ?)`)
    .bind(id, userId, title, now, now)
    .run();
  return { id, title, status: "open", createdAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString(), entryCount: 0 };
}

export async function updateThread(
  userId: string,
  id: string,
  patch: { title?: string; status?: "open" | "closed"; closingNote?: string | null },
): Promise<boolean> {
  const db = await getAppDB();
  const sets: string[] = ["updated_at = ?"];
  const binds: unknown[] = [Date.now()];
  if (patch.title !== undefined) {
    sets.push("title = ?");
    binds.push(patch.title);
  }
  if (patch.status !== undefined) {
    sets.push("status = ?", "closed_at = ?");
    binds.push(patch.status, patch.status === "closed" ? Date.now() : null);
  }
  if (patch.closingNote !== undefined) {
    sets.push("closing_note = ?");
    binds.push(patch.closingNote || null);
  }
  const res = await db
    .prepare(`UPDATE journal_threads SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`)
    .bind(...binds, id, userId)
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

/** ขยับ "อัปเดตล่าสุด" ของเรื่องเมื่อมีคำอ่านใหม่ผูกเข้ามา (เรียงรายการเรื่องที่ติดตามอยู่) */
export async function touchThread(userId: string, id: string): Promise<void> {
  const db = await getAppDB();
  await db.prepare(`UPDATE journal_threads SET updated_at = ? WHERE id = ? AND user_id = ?`).bind(Date.now(), id, userId).run();
}

/** ลบเรื่อง — คำอ่านในเรื่องยังอยู่ แค่ถูกถอดออกจากเรื่อง */
export async function deleteThread(userId: string, id: string): Promise<boolean> {
  const db = await getAppDB();
  await db.prepare(`UPDATE reading_journal SET thread_id = NULL WHERE user_id = ? AND thread_id = ?`).bind(userId, id).run();
  const res = await db.prepare(`DELETE FROM journal_threads WHERE id = ? AND user_id = ?`).bind(id, userId).run();
  return (res.meta?.changes ?? 0) > 0;
}

export async function deleteAllThreads(userId: string): Promise<number> {
  const db = await getAppDB();
  const res = await db.prepare(`DELETE FROM journal_threads WHERE user_id = ?`).bind(userId).run();
  return res.meta?.changes ?? 0;
}
