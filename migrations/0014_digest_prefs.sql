-- 0014_digest_prefs.sql: สมัครใจรับดวงประจำวันทางอีเมล (opt-in เท่านั้น · PDPA)
--
-- ⚠️ ค่าเริ่มต้นต้องเป็น 0 เสมอ — ความยินยอมรับข่าวสาร (marketing_consent) ที่ผู้ใช้เคยกดไว้
-- ไม่ใช่ความยินยอมรับอีเมลรายวัน คนละเรื่องกัน ห้าม backfill เป็น 1 ให้ใครทั้งสิ้น
--
-- ยังไม่มีคอลัมน์ของ LINE ในรอบนี้ — เจ้าของโครงการตัดสินใจ 2026-09-13 ว่า
-- "อีเมลอย่างเดียวไปก่อน ยังไม่เอา LINE" · ถ้าเปิด LINE วันหน้าให้เพิ่ม migration ใหม่
ALTER TABLE users ADD COLUMN digest_email        INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN digest_last_sent_at INTEGER;

-- คิวหาคนที่ต้องส่งวันนี้: WHERE digest_email = 1 AND marketing_consent = 1 AND deleted_at IS NULL
CREATE INDEX IF NOT EXISTS idx_users_digest ON users(digest_email, marketing_consent, deleted_at);

-- กันส่งซ้ำเมื่อตัวจับเวลาทำงานซ้อน (GitHub Actions ยิงซ้ำได้ตอน retry หรือกด workflow_dispatch)
-- PRIMARY KEY สามช่องคือกลไกกันซ้ำ — insert ชนแล้วข้าม ห้ามใช้ INSERT OR REPLACE เด็ดขาด
CREATE TABLE IF NOT EXISTS digest_log (
  user_id    TEXT NOT NULL,
  send_date  TEXT NOT NULL,            -- 'YYYY-MM-DD' โซนเวลาไทย
  channel    TEXT NOT NULL,            -- 'email' (สงวนช่องไว้เผื่อช่องทางอื่นในอนาคต)
  status     TEXT NOT NULL,            -- 'sent' | 'skipped' | 'failed'
  reason     TEXT,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, send_date, channel)
);
CREATE INDEX IF NOT EXISTS idx_digest_log_date ON digest_log(send_date, status);
