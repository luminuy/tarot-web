import { getAppDB } from "@/lib/platform/db";

/**
 * โครงตารางของระบบสิทธิ์ — **แหล่งความจริงเดียว**
 *
 * ใช้ร่วมกัน 2 ที่ ห้ามคัดลอกไปเขียนซ้ำที่อื่น:
 *   1. ปุ่ม "เตรียมฐานข้อมูล" ใน `/admin` → `api/admin/entitlement/ops` (init_db)
 *   2. การซ่อมตัวเองเมื่อเจอ "no such table" ตอน runtime (`entitlement.ts`)
 *
 * ทุกคำสั่งเป็น `IF NOT EXISTS` จึงรันซ้ำได้ไม่จำกัดโดยไม่ทำข้อมูลเดิมเสีย
 * (ตรงกับ `migrations/0006_reading_entitlement.sql` ซึ่งเป็นตัวจริงตอน deploy)
 */
export const ENTITLEMENT_DDL_STATEMENTS: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS reading_usage (
     id TEXT PRIMARY KEY, user_id TEXT NOT NULL, reading_id TEXT NOT NULL,
     week_key TEXT NOT NULL, source TEXT NOT NULL, consumed_at INTEGER NOT NULL
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_ru_reading ON reading_usage(reading_id)`,
  `CREATE INDEX IF NOT EXISTS idx_ru_user_week ON reading_usage(user_id, week_key, source)`,
  `CREATE TABLE IF NOT EXISTS user_bonus (
     id TEXT PRIMARY KEY, user_id TEXT NOT NULL, granted INTEGER NOT NULL DEFAULT 0,
     reason TEXT NOT NULL, granted_at INTEGER NOT NULL
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_ub_user_reason ON user_bonus(user_id, reason)`,
  `CREATE INDEX IF NOT EXISTS idx_ub_user ON user_bonus(user_id)`,
];

/** รูปแบบเดิมสำหรับที่ที่ยังใช้ `exec()` ทีเดียวทั้งก้อน */
export const ENTITLEMENT_DDL = ENTITLEMENT_DDL_STATEMENTS.join(";\n") + ";";

/** สร้างตารางทั้งหมด (idempotent) — โยน error ต่อถ้าสร้างไม่สำเร็จจริง ๆ */
export async function ensureEntitlementSchema(): Promise<void> {
  const db = await getAppDB();
  for (const stmt of ENTITLEMENT_DDL_STATEMENTS) {
    await db.prepare(stmt).run();
  }
}

/** true ถ้าตารางนี้มีอยู่จริงบนฐานข้อมูล */
export async function entitlementTableExists(name: string): Promise<boolean> {
  try {
    const db = await getAppDB();
    const row = await db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`)
      .bind(name)
      .first<{ name: string }>();
    return !!row;
  } catch {
    return false;
  }
}
