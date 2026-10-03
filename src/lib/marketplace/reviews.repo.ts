import { getAppDB } from "@/lib/platform/db";

/**
 * ⭐ รีวิวแม่หมอ — เฉพาะ "ลูกค้าที่จ่ายเงินและคุยจบแล้ว" เท่านั้น หนึ่งการปรึกษารีวิวได้ครั้งเดียว
 * ---------------------------------------------------------------------------
 * ⚠️ ห้ามมีทางเขียนรีวิวจากที่อื่น (ไม่มีรีวิวตั้งต้น ไม่มีรีวิวจากแอดมิน) — รีวิวปลอมผิดกฎหมายคุ้มครองผู้บริโภค
 *    และทำให้ Google ลงโทษทั้งโดเมน · ด่าน `test-marketplace-readers` 18.x คุมเงื่อนไขนี้
 * แอดมินซ่อนรีวิวได้ (คำหยาบ · ข้อมูลส่วนตัว) แต่แก้ข้อความหรือคะแนนไม่ได้
 */

export const REVIEW_COMMENT_MAX = 500;

export interface ReaderReview {
  id: string;
  ticketId: string;
  readerId: string;
  rating: number;
  comment: string | null;
  nickname: string | null;
  hidden: boolean;
  createdAt: number;
}

interface RawReviewRow {
  id: string;
  ticket_id: string;
  reader_id: string;
  rating: number;
  comment: string | null;
  nickname: string | null;
  hidden: number;
  created_at: number;
}

function mapReview(r: RawReviewRow): ReaderReview {
  return {
    id: r.id,
    ticketId: r.ticket_id,
    readerId: r.reader_id,
    rating: Number(r.rating),
    comment: r.comment,
    nickname: r.nickname,
    hidden: Number(r.hidden) === 1,
    createdAt: Number(r.created_at),
  };
}

/** ชื่อที่แสดงบนรีวิว — ตัวแรกของชื่อเล่น + "***" (ไม่เปิดเผยชื่อเล่นเต็มต่อสาธารณะ) */
export function maskNickname(nickname: string | null | undefined): string {
  const first = (nickname || "").trim().charAt(0);
  return first ? `คุณ${first}***` : "ลูกค้า";
}

export async function getReviewByTicketId(ticketId: string): Promise<ReaderReview | null> {
  const db = await getAppDB();
  const row = await db.prepare("SELECT * FROM reader_reviews WHERE ticket_id = ? LIMIT 1").bind(ticketId).first<RawReviewRow>();
  return row ? mapReview(row) : null;
}

export type CreateReviewResult = { ok: true; review: ReaderReview } | { ok: false; error: string; status: 400 | 409 };

/**
 * บันทึกรีวิว — ผู้เรียกต้องตรวจความเป็นเจ้าของตั๋วมาก่อน (`isTicketOwner`) และตั๋วต้อง `handed_off` + จ่ายแล้ว
 * หนึ่งตั๋วรีวิวได้ครั้งเดียว: UNIQUE(ticket_id) ตัดสิน ไม่ใช่ SELECT ก่อน
 */
export async function createReview(input: {
  ticketId: string;
  readerId: string;
  rating: number;
  comment?: string | null;
  nickname?: string | null;
}): Promise<CreateReviewResult> {
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return { ok: false, error: "กรุณาให้คะแนน 1–5 ดาว", status: 400 };
  }
  const comment = (input.comment ?? "").trim().slice(0, REVIEW_COMMENT_MAX) || null;
  const db = await getAppDB();
  const review: ReaderReview = {
    id: `rev_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
    ticketId: input.ticketId,
    readerId: input.readerId,
    rating: input.rating,
    comment,
    nickname: input.nickname?.trim() || null,
    hidden: false,
    createdAt: Date.now(),
  };
  try {
    await db
      .prepare(
        "INSERT INTO reader_reviews (id, ticket_id, reader_id, rating, comment, nickname, hidden, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)"
      )
      .bind(review.id, review.ticketId, review.readerId, review.rating, review.comment, review.nickname, review.createdAt)
      .run();
  } catch (err) {
    if (/UNIQUE constraint failed|SQLITE_CONSTRAINT/i.test(String((err as Error)?.message ?? err))) {
      return { ok: false, error: "คุณรีวิวการปรึกษาครั้งนี้ไปแล้ว", status: 409 };
    }
    throw err;
  }
  return { ok: true, review };
}

export interface ReviewSummary {
  count: number;
  average: number | null;
  /** รีวิวล่าสุดที่มีข้อความ (ซ่อนชื่อเล่น) */
  latest: { id: string; rating: number; comment: string; name: string; createdAt: number }[];
}

export async function getReaderReviewSummary(readerId: string, limit = 6): Promise<ReviewSummary> {
  const db = await getAppDB();
  const agg = await db
    .prepare("SELECT COUNT(*) AS c, AVG(rating) AS a FROM reader_reviews WHERE reader_id = ? AND hidden = 0")
    .bind(readerId)
    .first<{ c: number; a: number | null }>();
  const { results } = await db
    .prepare(
      "SELECT * FROM reader_reviews WHERE reader_id = ? AND hidden = 0 AND comment IS NOT NULL ORDER BY created_at DESC LIMIT ?"
    )
    .bind(readerId, limit)
    .all<RawReviewRow>();
  const count = Number(agg?.c ?? 0);
  return {
    count,
    average: count > 0 && agg?.a != null ? Math.round(Number(agg.a) * 10) / 10 : null,
    latest: (results || []).map((r) => ({
      id: r.id,
      rating: Number(r.rating),
      comment: r.comment as string,
      name: maskNickname(r.nickname),
      createdAt: Number(r.created_at),
    })),
  };
}

/** สรุปคะแนนทุกแม่หมอในครั้งเดียว (หน้ารวมแม่หมอ) */
export async function getAllReaderRatings(): Promise<Map<string, { count: number; average: number }>> {
  const db = await getAppDB();
  const { results } = await db
    .prepare("SELECT reader_id, COUNT(*) AS c, AVG(rating) AS a FROM reader_reviews WHERE hidden = 0 GROUP BY reader_id")
    .all<{ reader_id: string; c: number; a: number }>();
  const out = new Map<string, { count: number; average: number }>();
  for (const r of results || []) out.set(r.reader_id, { count: Number(r.c), average: Math.round(Number(r.a) * 10) / 10 });
  return out;
}

export async function listRecentReviews(limit = 30): Promise<(ReaderReview & { readerName: string })[]> {
  const db = await getAppDB();
  const { results } = await db
    .prepare(
      "SELECT v.*, r.display_name FROM reader_reviews v JOIN readers r ON r.id = v.reader_id ORDER BY v.created_at DESC LIMIT ?"
    )
    .bind(limit)
    .all<RawReviewRow & { display_name: string }>();
  return (results || []).map((r) => ({ ...mapReview(r), readerName: r.display_name }));
}

export async function setReviewHidden(reviewId: string, hidden: boolean): Promise<boolean> {
  const db = await getAppDB();
  const res = await db.prepare("UPDATE reader_reviews SET hidden = ? WHERE id = ?").bind(hidden ? 1 : 0, reviewId).run();
  return (res.meta?.changes ?? 0) > 0;
}
