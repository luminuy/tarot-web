import { getAppDB } from "@/lib/platform/db";
import type { CustomPositionInput, CustomSpreadInput, LayoutId } from "@/lib/tarot/custom-spread";

/** ✦ ผังที่สมาชิกออกแบบเอง (migrations/0024) — ทุกคำสั่งที่ผู้ใช้เรียกกรองด้วย user_id */

/** เพดานผังต่อบัญชี — พอสำหรับคนใช้จริง และกันตารางบวมจากสคริปต์ */
export const CUSTOM_SPREADS_PER_USER = 20;

export interface StoredCustomSpread extends CustomSpreadInput {
  id: string;
  shareSlug: string | null;
  useCount: number;
  createdAt: number;
  updatedAt: number;
}

interface Row {
  id: string;
  user_id: string;
  name: string;
  layout: string;
  positions_json: string;
  share_slug: string | null;
  use_count: number;
  created_at: number;
  updated_at: number;
}

function parsePositions(json: string): CustomPositionInput[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? (v as CustomPositionInput[]) : [];
  } catch {
    return [];
  }
}

const map = (r: Row): StoredCustomSpread => ({
  id: r.id,
  name: r.name,
  layout: r.layout as LayoutId,
  positions: parsePositions(r.positions_json),
  shareSlug: r.share_slug,
  useCount: r.use_count,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

/** เก็บเฉพาะฟิลด์ที่รู้จัก — กันข้อมูลแปลกปลอมจากหน้าเว็บติดลงฐานข้อมูล */
function cleanPositions(ps: CustomPositionInput[]): CustomPositionInput[] {
  return ps.map((p) => ({
    nameTh: p.nameTh.trim(),
    ...(p.nameEn?.trim() ? { nameEn: p.nameEn.trim() } : {}),
    meaning: p.meaning.trim(),
    ...(p.meaningEn?.trim() ? { meaningEn: p.meaningEn.trim() } : {}),
  }));
}

export async function listCustomSpreads(userId: string): Promise<StoredCustomSpread[]> {
  const db = await getAppDB();
  const { results } = await db
    .prepare(`SELECT * FROM custom_spreads WHERE user_id = ? ORDER BY use_count DESC, updated_at DESC LIMIT ?`)
    .bind(userId, CUSTOM_SPREADS_PER_USER)
    .all<Row>();
  return (results || []).map(map);
}

export async function getCustomSpread(userId: string, id: string): Promise<StoredCustomSpread | null> {
  const db = await getAppDB();
  const row = await db.prepare(`SELECT * FROM custom_spreads WHERE id = ? AND user_id = ?`).bind(id, userId).first<Row>();
  return row ? map(row) : null;
}

/** ลิงก์แบ่งปัน — คืนแค่โครงผัง (ชื่อ/แม่แบบ/ตำแหน่ง) ไม่มีเจ้าของ ไม่มีสถิติ */
export async function getSharedCustomSpread(slug: string): Promise<CustomSpreadInput | null> {
  const db = await getAppDB();
  const row = await db.prepare(`SELECT * FROM custom_spreads WHERE share_slug = ?`).bind(slug).first<Row>();
  if (!row) return null;
  const s = map(row);
  return { name: s.name, layout: s.layout, positions: s.positions };
}

export async function countCustomSpreads(userId: string): Promise<number> {
  const db = await getAppDB();
  const row = await db.prepare(`SELECT COUNT(*) AS n FROM custom_spreads WHERE user_id = ?`).bind(userId).first<{ n: number }>();
  return row?.n ?? 0;
}

/** คืน null เมื่อเต็มเพดาน */
export async function createCustomSpread(userId: string, input: CustomSpreadInput): Promise<StoredCustomSpread | null> {
  if ((await countCustomSpreads(userId)) >= CUSTOM_SPREADS_PER_USER) return null;
  const db = await getAppDB();
  const now = Date.now();
  const id = `cs_${crypto.randomUUID()}`;
  const positions = cleanPositions(input.positions);
  await db
    .prepare(
      `INSERT INTO custom_spreads (id, user_id, name, layout, positions_json, share_slug, use_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NULL, 0, ?, ?)`
    )
    .bind(id, userId, input.name.trim(), input.layout, JSON.stringify(positions), now, now)
    .run();
  return { id, name: input.name.trim(), layout: input.layout, positions, shareSlug: null, useCount: 0, createdAt: now, updatedAt: now };
}

export async function updateCustomSpread(userId: string, id: string, input: CustomSpreadInput): Promise<boolean> {
  const db = await getAppDB();
  const res = await db
    .prepare(`UPDATE custom_spreads SET name = ?, layout = ?, positions_json = ?, updated_at = ? WHERE id = ? AND user_id = ?`)
    .bind(input.name.trim(), input.layout, JSON.stringify(cleanPositions(input.positions)), Date.now(), id, userId)
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

/** เปิด/ปิดลิงก์แบ่งปัน — เปิดใหม่ได้ slug ใหม่เสมอ (ลิงก์เก่าที่เคยหลุดไปใช้ไม่ได้อีก) */
export async function setCustomSpreadSharing(userId: string, id: string, share: boolean): Promise<string | null | undefined> {
  const db = await getAppDB();
  const slug = share ? crypto.randomUUID().replace(/-/g, "").slice(0, 12) : null;
  const res = await db
    .prepare(`UPDATE custom_spreads SET share_slug = ?, updated_at = ? WHERE id = ? AND user_id = ?`)
    .bind(slug, Date.now(), id, userId)
    .run();
  return (res.meta?.changes ?? 0) > 0 ? slug : undefined;
}

export async function deleteCustomSpread(userId: string, id: string): Promise<boolean> {
  const db = await getAppDB();
  const res = await db.prepare(`DELETE FROM custom_spreads WHERE id = ? AND user_id = ?`).bind(id, userId).run();
  return (res.meta?.changes ?? 0) > 0;
}

export async function markCustomSpreadUsed(userId: string, id: string): Promise<void> {
  const db = await getAppDB();
  await db.prepare(`UPDATE custom_spreads SET use_count = use_count + 1 WHERE id = ? AND user_id = ?`).bind(id, userId).run();
}

export async function deleteAllCustomSpreads(userId: string): Promise<number> {
  const db = await getAppDB();
  const res = await db.prepare(`DELETE FROM custom_spreads WHERE user_id = ?`).bind(userId).run();
  return res.meta?.changes ?? 0;
}
