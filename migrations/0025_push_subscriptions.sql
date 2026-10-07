-- migrations/0025_push_subscriptions.sql
-- Web Push แบบเลือกเปิดเอง (REFLECTION_JOURNAL_PLAN 1.10) — สมาชิกเท่านั้น (ลบตามบัญชีได้ตาม PDPA)
--
--   endpoint/p256dh/auth — subscription ของเบราว์เซอร์ (กุญแจสาธารณะ ไม่ใช่ความลับของผู้ใช้ แต่ผูกกับเครื่อง)
--   morning_hour         — เวลาเตือนพิธีเช้า (0–23 ตามเวลาไทย) · NULL = ไม่เตือนพิธีเช้า
--   checkins             — 1 = ส่งเตือน "นัดกลับมาเช็ก" ทางนี้ด้วย
--   last_morning_day     — วันที่ (YYYY-MM-DD เวลาไทย) ที่ส่งเตือนพิธีเช้าไปแล้ว กันส่งซ้ำในวันเดียว
--   fail_count           — ส่งไม่สำเร็จติดกันกี่ครั้ง (ครบ 5 = ลบทิ้ง) · 404/410 = ลบทันที
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL,
  endpoint         TEXT NOT NULL UNIQUE,
  p256dh           TEXT NOT NULL,
  auth             TEXT NOT NULL,
  lang             TEXT NOT NULL DEFAULT 'th',
  morning_hour     INTEGER,
  checkins         INTEGER NOT NULL DEFAULT 1,
  last_morning_day TEXT,
  fail_count       INTEGER NOT NULL DEFAULT 0,
  created_at       INTEGER NOT NULL,
  updated_at       INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_morning ON push_subscriptions(morning_hour) WHERE morning_hour IS NOT NULL;
