import { NextResponse } from "next/server";
import { z } from "zod";

import { recordAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth/require-admin";
import { GRANDFATHER_BONUS, grantBonus } from "@/lib/entitlement/entitlement";
import { getAppDB } from "@/lib/platform/db";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * ปฏิบัติการ setup ระบบสิทธิ์ผ่านแผงแอดมิน — ไม่ต้องใช้ terminal (ENTITLEMENT_PLAN PR F/G)
 *   check_db           → มีตาราง reading_usage / user_bonus ไหม
 *   init_db            → สร้างตาราง (CREATE TABLE IF NOT EXISTS — idempotent)
 *   grandfather_preview→ นับผู้ใช้ที่จะได้โบนัสเปลี่ยนผ่าน
 *   grandfather_run    → ให้โบนัส 10 ครั้ง (idempotent · UNIQUE(user_id,"grandfather"))
 */
const Body = z.object({
  action: z.enum(["check_db", "init_db", "grandfather_preview", "grandfather_run"]),
  before: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const ENTITLEMENT_DDL = `
  CREATE TABLE IF NOT EXISTS reading_usage (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, reading_id TEXT NOT NULL,
    week_key TEXT NOT NULL, source TEXT NOT NULL, consumed_at INTEGER NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_ru_reading ON reading_usage(reading_id);
  CREATE INDEX IF NOT EXISTS idx_ru_user_week ON reading_usage(user_id, week_key, source);
  CREATE TABLE IF NOT EXISTS user_bonus (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, granted INTEGER NOT NULL DEFAULT 0,
    reason TEXT NOT NULL, granted_at INTEGER NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_ub_user_reason ON user_bonus(user_id, reason);
  CREATE INDEX IF NOT EXISTS idx_ub_user ON user_bonus(user_id);
`;

async function tableExists(db: Awaited<ReturnType<typeof getAppDB>>, name: string): Promise<boolean> {
  try {
    const row = await db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`)
      .bind(name)
      .first<{ name: string }>();
    return !!row;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง (ต้องมี action)" }, { status: 400 });
  }
  const { action, before } = parsed.data;
  const db = await getAppDB();

  if (action === "check_db") {
    const [ru, ub] = await Promise.all([
      tableExists(db, "reading_usage"),
      tableExists(db, "user_bonus"),
    ]);
    return NextResponse.json({ ready: ru && ub, reading_usage: ru, user_bonus: ub });
  }

  if (action === "init_db") {
    // รันทีละ statement — ปลอดภัยทั้ง D1 จริงและ local sqlite shim
    for (const stmt of ENTITLEMENT_DDL.split(";").map((x) => x.trim()).filter(Boolean)) {
      await db.prepare(stmt).run();
    }
    await recordAudit("entitlement_init_db");
    const ready =
      (await tableExists(db, "reading_usage")) && (await tableExists(db, "user_bonus"));
    return NextResponse.json({ ok: true, ready });
  }

  // grandfather
  if (!before) {
    return NextResponse.json({ error: "ต้องระบุวันตัด (before) รูปแบบ YYYY-MM-DD" }, { status: 400 });
  }
  if (!(await tableExists(db, "user_bonus"))) {
    return NextResponse.json({ error: "ยังไม่มีตาราง — กด 'เตรียมฐานข้อมูล' ก่อน" }, { status: 409 });
  }
  const cutoff = new Date(`${before}T00:00:00+07:00`).getTime();

  const { results } = await db
    .prepare(`SELECT id FROM users WHERE created_at < ? AND deleted_at IS NULL`)
    .bind(cutoff)
    .all<{ id: string }>();

  if (action === "grandfather_preview") {
    return NextResponse.json({ count: results.length, before });
  }

  // grandfather_run — ทำเป็น batch กัน timeout (idempotent รันซ้ำได้)
  const MAX = 4000;
  const batch = results.slice(0, MAX);
  for (const u of batch) {
    await grantBonus(u.id, GRANDFATHER_BONUS, "grandfather");
  }
  await recordAudit("entitlement_grandfather", `${batch.length} users · before ${before}`);
  return NextResponse.json({
    granted: batch.length,
    total: results.length,
    remaining: Math.max(0, results.length - batch.length),
  });
}
