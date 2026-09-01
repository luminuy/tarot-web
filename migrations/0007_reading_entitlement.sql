-- 0007: สิทธิ์การเปิดไพ่รายสัปดาห์ + โบนัส (Reading Entitlement)
-- อ้างอิงแผน docs/ENTITLEMENT_PLAN.md ข้อ 4
-- (แผนเดิมเขียน "0006" แต่ 0006 ถูกใช้โดย email_auth ไปแล้ว จึงเลื่อนเป็น 0007)

-- หนึ่งแถว = หนึ่งการเปิดไพ่ที่หักสิทธิ์แล้ว
-- เก็บเป็นแถวต่อครั้งแทนตัวเลขนับ เพราะ: ตรวจย้อนหลังได้ · คืนสิทธิ์ได้ตรงรายการ · ทำสถิติได้
CREATE TABLE IF NOT EXISTS reading_usage (
  id          TEXT PRIMARY KEY,          -- 'ru_<uuid>'
  user_id     TEXT NOT NULL REFERENCES users(id),
  reading_id  TEXT NOT NULL,
  week_key    TEXT NOT NULL,             -- '2026-08-31' = วันจันทร์ต้นสัปดาห์ เวลาไทย
  source      TEXT NOT NULL,             -- 'weekly' | 'bonus'
  consumed_at INTEGER NOT NULL
);

-- หัวใจของความถูกต้อง: กดรัว รีทราย หรือเปิดสองแท็บ ก็หักได้ครั้งเดียว (พึ่ง unique constraint)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ru_reading ON reading_usage(reading_id);
CREATE INDEX IF NOT EXISTS idx_ru_user_week ON reading_usage(user_id, week_key, source);

-- โบนัสที่ให้เป็นก้อน ไม่ผูกกับสัปดาห์ ไม่หมดอายุ
-- แผนเดิมใช้ user_id เป็น PK (แถวเดียว) — เปลี่ยนเป็นหลายแถว + unique(user_id, reason)
-- เพื่อให้ grantBonus idempotent ต่อเหตุผล (signup / grandfather / support ให้ครั้งเดียวต่อเหตุผล)
-- และตรวจย้อนหลังได้ว่าโบนัสก้อนไหนมาจากอะไร — ตรงหลักการเดียวกับ reading_usage
CREATE TABLE IF NOT EXISTS user_bonus (
  id         TEXT PRIMARY KEY,           -- 'ub_<uuid>'
  user_id    TEXT NOT NULL REFERENCES users(id),
  granted    INTEGER NOT NULL DEFAULT 0,
  reason     TEXT NOT NULL,              -- 'signup' | 'grandfather' | 'support'
  granted_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ub_user_reason ON user_bonus(user_id, reason);
CREATE INDEX IF NOT EXISTS idx_ub_user ON user_bonus(user_id);
