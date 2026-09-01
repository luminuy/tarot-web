#!/usr/bin/env tsx
/**
 * ให้โบนัสเปลี่ยนผ่าน (grandfather) แก่ผู้ใช้ที่สมัครก่อนวันเปิดระบบสิทธิ์
 * ENTITLEMENT_PLAN PR F · ข้อ 7,10 — รันครั้งเดียวก่อนเปิดธง `entitlement.enabled`
 *
 *   npm run entitlement:grandfather -- --before 2026-09-15          (dSMS: local sqlite)
 *   npm run entitlement:grandfather -- --before 2026-09-15 --remote (ผ่าน wrangler d1 remote)
 *
 * idempotent: `grantBonus(user, 10, "grandfather")` มี UNIQUE(user_id, reason) → รันซ้ำไม่เพิ่ม
 */

import { GRANDFATHER_BONUS, grantBonus } from "../src/lib/entitlement/entitlement";
import { getAppDB } from "../src/lib/platform/db";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const before = arg("before");
  if (!before || !/^\d{4}-\d{2}-\d{2}$/.test(before)) {
    console.error("❌ ต้องระบุ --before YYYY-MM-DD (วันตัดโบนัส)");
    process.exit(1);
  }
  const cutoff = new Date(`${before}T00:00:00+07:00`).getTime();
  const dry = process.argv.includes("--dry-run");

  const db = await getAppDB();
  const { results } = await db
    .prepare(`SELECT id, created_at FROM users WHERE created_at < ? AND deleted_at IS NULL`)
    .bind(cutoff)
    .all<{ id: string; created_at: number }>();

  console.log(`พบผู้ใช้ ${results.length} คนที่สมัครก่อน ${before} (${new Date(cutoff).toISOString()})`);
  if (dry) {
    console.log("(--dry-run) ไม่เขียนอะไร");
    return;
  }

  let done = 0;
  for (const u of results) {
    await grantBonus(u.id, GRANDFATHER_BONUS, "grandfather");
    done++;
    if (done % 50 === 0) console.log(`  ${done}/${results.length}…`);
  }
  console.log(`✅ ให้โบนัส ${GRANDFATHER_BONUS} ครั้งแก่ ${done} คน (idempotent — รันซ้ำได้)`);
}

main().catch((err) => {
  console.error("❌ ล้มเหลว:", err);
  process.exit(1);
});
