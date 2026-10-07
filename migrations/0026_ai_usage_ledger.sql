-- migrations/0026_ai_usage_ledger.sql
-- บัญชีต้นทุน AI ต่อผู้ใช้ต่อวัน (REFLECTION_JOURNAL_PLAN 1.14 · แทร็ก S)
--   subject — `u:<userId>` (สมาชิก · ลบตามบัญชีได้ตาม PDPA) หรือ `g:<แฮชของ subnet>` (ผู้เยี่ยมชม · ไม่เก็บ IP ดิบ)
--   day     — วัน UTC (ตัดรอบเดียวกับเพดานรวม `ai-budget.ts`)
--   นับจาก `usage` ที่ผู้ให้บริการส่งกลับ (ไม่มีให้ = ประมาณจากจำนวนอักขระ ÷ 3.5)
--   แถวเก่ากว่า 35 วันถูกกวาดทิ้งเป็นครั้งคราว
CREATE TABLE IF NOT EXISTS ai_usage_daily (
  day         TEXT NOT NULL,
  subject     TEXT NOT NULL,
  calls       INTEGER NOT NULL DEFAULT 0,
  tokens_in   INTEGER NOT NULL DEFAULT 0,
  tokens_out  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, subject)
);
CREATE INDEX IF NOT EXISTS idx_ai_usage_subject ON ai_usage_daily(subject, day);
