import { KEY, kvListKeys } from "@/lib/platform/kv-store";
import { getAppKV } from "@/lib/platform/cf";
import { getAppDB } from "@/lib/platform/db";

/**
 * Audit log ของการกระทำในแผงแอดมิน — append-only บนตาราง D1 `admin_audit` (migrations/0001)
 *
 * ⚠️ ทำไมไม่เก็บบน KV แล้ว (A1-10 · ผลตรวจ 2026-09-23)
 * เดิมเก็บคีย์ `app:audit:<ts>` บน KV แล้วอ่าน 1,000 คีย์แรกมาตัดท้าย — แต่ KV list คืนคีย์
 * จาก **เก่าไปใหม่** และหยุดที่ 1,000 ตัว เมื่อมีเกินพัน (ผู้โจมตีเดารหัสแอดมินจากหลาย IP
 * ก็ทำให้เกินได้เอง เพราะทุกครั้งที่ผิดถูกบันทึก) แผงแอดมินจะเห็นแต่ของเก่า
 * เหตุการณ์ใหม่ทั้งหมด — ล็อกอินสำเร็จ แก้รหัสแลกสิทธิ์ — มองไม่เห็นเลย
 * D1 เรียง `ts DESC` ได้ตรง ๆ จึงได้ของใหม่สุดเสมอ
 *
 * ⚠️ ห้ามบันทึก PII หรือค่า secret — เก็บแค่ว่า "ใคร (admin)" ทำ "อะไร" "เมื่อไร"
 */

export interface AuditEntry {
  ts: number;
  action: string;
  detail?: string;
}

const RETENTION_MS = 180 * 24 * 60 * 60 * 1000;

export async function recordAudit(action: string, detail?: string): Promise<void> {
  const ts = Date.now();
  const trimmed = detail?.slice(0, 500);
  try {
    const db = await getAppDB();
    await db
      .prepare(`INSERT INTO admin_audit (ts, actor, action, detail) VALUES (?, 'admin', ?, ?)`)
      .bind(ts, action, trimmed ?? null)
      .run();
    // เก็บ 180 วันเท่าเดิม — กวาดของเก่าเป็นครั้งคราว (ราว 1 ใน 50 ครั้ง)
    if (Math.random() < 0.02) {
      await db.prepare(`DELETE FROM admin_audit WHERE ts < ?`).bind(ts - RETENTION_MS).run();
    }
  } catch {
    // audit ล้มเหลวไม่ควรบล็อกการทำงานหลัก
  }
}

/** ของเก่าที่ยังค้างบน KV ก่อนย้าย (หมดอายุเองภายใน 180 วัน) — อ่านเสริมเท่านั้น */
async function listLegacyKvAudit(): Promise<AuditEntry[]> {
  try {
    const keys = await kvListKeys(KEY.auditPrefix(), 1000);
    if (keys.length === 0) return [];
    const kv = await getAppKV();
    const raws = await Promise.all(keys.map((k) => kv.get(k).catch(() => null)));
    const out: AuditEntry[] = [];
    for (const raw of raws) {
      if (!raw) continue;
      try {
        out.push(JSON.parse(raw) as AuditEntry);
      } catch {
        /* skip */
      }
    }
    return out;
  } catch {
    return [];
  }
}

export async function listAudit(limit = 100): Promise<AuditEntry[]> {
  let rows: AuditEntry[] = [];
  try {
    const db = await getAppDB();
    const res = await db
      .prepare(`SELECT ts, action, detail FROM admin_audit ORDER BY ts DESC, id DESC LIMIT ?`)
      .bind(limit)
      .all<{ ts: number; action: string; detail: string | null }>();
    rows = res.results.map((r) => ({ ts: Number(r.ts), action: r.action, detail: r.detail ?? undefined }));
  } catch {
    // D1 ใช้ไม่ได้ — ยังเห็นของเก่าจาก KV ด้านล่าง
  }
  const legacy = rows.length < limit ? await listLegacyKvAudit() : [];
  return [...rows, ...legacy].sort((a, b) => b.ts - a.ts).slice(0, limit);
}
