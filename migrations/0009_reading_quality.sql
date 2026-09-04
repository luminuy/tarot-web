-- 0009: บริบทตอนสร้างคำอ่าน สำหรับวัดคุณภาพ AI (AI_INTELLIGENCE_PLAN งานที่ 0 / W1.1)
-- แยกตาราง ไม่ยัดใน reading_journal เพราะ:
--  - reading_journal คือ "ของผู้ใช้" (ต้องลบตามเมื่อขอลบบัญชี ตาม PDPA)
--  - ตารางนี้คือ "สถิติระบบ" ไม่ผูกตัวตน เก็บต่อได้หลังผู้ใช้ลบบัญชี

CREATE TABLE IF NOT EXISTS reading_quality (
  reading_id      TEXT PRIMARY KEY,
  provider        TEXT NOT NULL,           -- 'groq' | 'gemini'
  model           TEXT NOT NULL,
  persona_id      TEXT NOT NULL,
  spread_id       TEXT NOT NULL,
  card_count      INTEGER NOT NULL,
  category        TEXT NOT NULL,
  prompt_version  TEXT NOT NULL,           -- หัวใจของการเทียบก่อน/หลัง
  elapsed_ms      INTEGER,
  output_tokens   INTEGER,
  had_failover    INTEGER NOT NULL DEFAULT 0,
  consistency_ok  INTEGER,                 -- เติมโดย W1.3 (1 = ผ่าน, 0 = ไม่ผ่าน)
  judge_score     INTEGER,                 -- คะแนนจาก LLM judge 1-5
  outcome         TEXT,                    -- คัดลอกมาตอนผู้ใช้ให้คะแนน
  created_at      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rq_version  ON reading_quality(prompt_version, created_at);
CREATE INDEX IF NOT EXISTS idx_rq_provider ON reading_quality(provider, model);
CREATE INDEX IF NOT EXISTS idx_rq_persona  ON reading_quality(persona_id, spread_id);
