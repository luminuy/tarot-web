-- migrations/0024_custom_spreads.sql
-- ผังที่สมาชิกออกแบบเอง (REFLECTION_JOURNAL_PLAN 1.8 · คลื่น 5) — ลบตามบัญชีได้ตาม PDPA (src/lib/privacy/user-data.ts)
--
--   layout          — รหัสแม่แบบเรขาคณิต (src/lib/tarot/custom-spread.ts) ไม่เก็บพิกัดอิสระ
--   positions_json  — [{nameTh,nameEn?,meaning,meaningEn?}] ผ่าน validateCustomSpread แล้วเท่านั้น
--   share_slug      — NULL = ส่วนตัว · มีค่า = เปิดลิงก์แบ่งปัน /spreads/s/<slug> (แชร์แค่โครงผัง ไม่มีคำถาม/ไพ่/ผลอ่าน)
--   use_count       — เปิดไพ่ด้วยผังนี้กี่ครั้ง (เรียงผังที่ใช้บ่อยขึ้นก่อน)
CREATE TABLE IF NOT EXISTS custom_spreads (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  name            TEXT NOT NULL,
  layout          TEXT NOT NULL,
  positions_json  TEXT NOT NULL,
  share_slug      TEXT UNIQUE,
  use_count       INTEGER NOT NULL DEFAULT 0,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_custom_spreads_user ON custom_spreads(user_id, updated_at DESC);
