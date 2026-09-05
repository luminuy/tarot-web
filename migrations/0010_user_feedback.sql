-- 0010: ตารางจัดเก็บข้อเสนอแนะและคะแนนความพึงพอใจจากผู้ใช้ (User Feedback & Ratings)
-- ใช้สำหรับเก็บความคิดเห็น, ข้อเสนอแนะฟีเจอร์, และคะแนนความแม่นยำเพื่อนำไปวิเคราะห์และปรับปรุง prompt

CREATE TABLE IF NOT EXISTS user_feedback (
  id              TEXT PRIMARY KEY,
  rating          INTEGER,                 -- 1 - 5 ดาว (หรือ NULL ถ้าไม่ระบุ)
  category        TEXT NOT NULL,           -- 'accuracy' | 'feature_request' | 'bug' | 'general'
  comment         TEXT,                    -- ข้อความข้อเสนอแนะ
  reading_id      TEXT,                    -- รหัสการเปิดไพ่ (ถ้ามี)
  persona_id      TEXT,                    -- รหัสแม่หมอ (ถ้ามี)
  page_url        TEXT,                    -- หน้าที่ส่งฟีดแบค
  user_agent      TEXT,                    -- อุปกรณ์/เบราว์เซอร์
  created_at      INTEGER NOT NULL         -- Unix epoch ms
);

CREATE INDEX IF NOT EXISTS idx_uf_category ON user_feedback(category);
CREATE INDEX IF NOT EXISTS idx_uf_reading  ON user_feedback(reading_id);
CREATE INDEX IF NOT EXISTS idx_uf_persona  ON user_feedback(persona_id);
CREATE INDEX IF NOT EXISTS idx_uf_time     ON user_feedback(created_at);
