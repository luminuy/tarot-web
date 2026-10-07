-- migrations/0022_journal_v2.sql
-- สมุดดวงของฉัน v2 + พิธีเช้า-เย็น (REFLECTION_JOURNAL_PLAN_2026-10-05 หัวข้อ 1.3 · 1.4 · 1.9 · คลื่น 2)
--
-- เพิ่มคอลัมน์อย่างเดียว ไม่ย้ายข้อมูล — แถวเก่าได้ค่าเริ่มต้นที่ "ไม่ทำอะไร" ทุกช่อง
-- ใส่คอลัมน์ของคลื่น 3 (thread_id · checkin_at) มาพร้อมกันเลย เพื่อไม่ต้อง ALTER ตารางใหญ่อีกรอบ
--
--   pinned        — ปักหมุด ✦ (0/1)
--   tags_json     — แท็กส่วนตัว ≤ 5 ต่อบันทึก ≤ 24 ตัวอักษร (สคีมาอยู่ที่ journal.schema.ts ที่เดียว)
--   mood_before   — "ใจตอนนี้" ก่อนสับไพ่ 1..5 (สับสน · กังวล · เฉย ๆ · มีหวัง · มั่นใจ) หรือ NULL = ข้าม
--   mood_after    — "ใจตอนนี้" หลังอ่านจบ / รอบเย็นของพิธีประจำวัน
--   thread_id     — เส้นเรื่อง (คลื่น 3 · ยังไม่มีใครเขียน)
--   checkin_at    — นัดกลับมาเช็ก epoch ms (คลื่น 3 · ยังไม่มีใครเขียน)
--   share_with_ai — ผู้ใช้ยินยอมให้แม่หมอ AI อ่าน "บันทึก · ใจ · แท็ก" ของรายการนี้ (กติกาความเป็นส่วนตัวข้อ 1)
--                   ค่าเริ่มต้น 0 = ห้ามเข้า prompt ทุกกรณี
--   basis_json    — เฟรม `basis` ของคำอ่านรอบนั้น (ใช้/ไม่ใช้ประวัติ · คำถาม · รายละเอียด) — ไม่มีเนื้อหาส่วนตัว
--   ritual_kind   — 'morning' = บันทึกจากพิธีเช้าหน้า /daily · NULL = คำอ่านปกติ
--   ritual_json   — รายละเอียดพิธี {focus · morningNote · eveningNote · eveningAt} (ข้อความผู้ใช้ — ไม่เข้า prompt)
--
-- ⚠️ PDPA: ทุกช่องข้างบนไหลออกทาง `/api/account/export` ผ่าน mapRowToItem (journal.repo.ts)
--    และถูกลบพร้อมแถวตอนลบบัญชี (`deleteAllJournal`) — เพิ่มคอลัมน์ใหม่ต้องดูแลสองทางนี้เสมอ

ALTER TABLE reading_journal ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0;
ALTER TABLE reading_journal ADD COLUMN tags_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE reading_journal ADD COLUMN mood_before INTEGER;
ALTER TABLE reading_journal ADD COLUMN mood_after INTEGER;
ALTER TABLE reading_journal ADD COLUMN thread_id TEXT;
ALTER TABLE reading_journal ADD COLUMN checkin_at INTEGER;
ALTER TABLE reading_journal ADD COLUMN share_with_ai INTEGER NOT NULL DEFAULT 0;
ALTER TABLE reading_journal ADD COLUMN basis_json TEXT;
ALTER TABLE reading_journal ADD COLUMN ritual_kind TEXT;
ALTER TABLE reading_journal ADD COLUMN ritual_json TEXT;

CREATE INDEX IF NOT EXISTS idx_rj_user_thread ON reading_journal(user_id, thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_rj_checkin ON reading_journal(checkin_at) WHERE checkin_at IS NOT NULL;
-- หน้า /daily ถามหา "บันทึกพิธีเช้าล่าสุด" ของผู้ใช้ (รอบเย็น · streak ใจดี · สรุปสัปดาห์)
CREATE INDEX IF NOT EXISTS idx_rj_user_ritual ON reading_journal(user_id, ritual_kind, created_at) WHERE ritual_kind IS NOT NULL;
