-- migrations/0023_journal_threads.sql
-- เส้นเรื่อง (Reading Threads) + นัดกลับมาเช็ก (REFLECTION_JOURNAL_PLAN 1.4 · คลื่น 3)
--
-- ผู้ใช้เลือกเองว่าคำอ่านไหนเป็น "เรื่องเดียวกัน" (ไม่เดาด้วย AI/เวกเตอร์ — ไม่ส่งคำถามส่วนตัวออกนอกระบบ)
-- reading_journal.thread_id / checkin_at เพิ่มไว้แล้วใน 0022 — ไฟล์นี้เพิ่มตารางเรื่อง + ธงว่าส่งเตือนแล้ว
--
--   title        — ชื่อเรื่องที่ผู้ใช้ตั้งเอง (≤ 60) · ใช้ในอีเมล/การแจ้งเตือนแทนคำถามเต็ม (กติกาความเป็นส่วนตัวข้อ 5)
--   status       — open | closed ("เรื่องนี้จบแล้ว")
--   closing_note — บทสรุปปิดเรื่องที่ผู้ใช้เขียนเอง (ไม่เข้า prompt เว้นแต่ยินยอมรายบันทึก)
--
-- ⚠️ PDPA: ส่งออกทาง /api/account/export และลบทั้งหมดตอนลบบัญชี (journal.repo · threads.repo)

CREATE TABLE IF NOT EXISTS journal_threads (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  title         TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'open',
  closing_note  TEXT,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL,
  closed_at     INTEGER
);
CREATE INDEX IF NOT EXISTS idx_jt_user_status ON journal_threads(user_id, status, updated_at DESC);

-- ส่งเตือน "นัดกลับมาเช็ก" แล้วเมื่อไหร่ — กันส่งซ้ำ (NULL = ยังไม่ส่ง)
ALTER TABLE reading_journal ADD COLUMN checkin_sent_at INTEGER;
CREATE INDEX IF NOT EXISTS idx_rj_checkin_due ON reading_journal(checkin_at, checkin_sent_at) WHERE checkin_at IS NOT NULL;
