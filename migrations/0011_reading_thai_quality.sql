-- 0011: คะแนนคุณภาพภาษาไทยของคำอ่าน (HANDOFF_AI_ACCURACY_THAI B-01)
-- ที่มา: `language.ts` กันได้แค่ "ไม่ใช่ภาษาต่างด้าว" แต่ไม่มีด่านไหนตรวจ "ภาษาไทยถูกต้อง" เลย
-- คำอ่านที่เขียน "นะค่ะ" "เเสงสว่าง" "ค่อยๆ" ผ่านทุกด่านเดิมได้สบาย ๆ
-- สองคอลัมน์นี้ทำให้ตอบได้ด้วยข้อมูลว่า "โมเดลตัวไหนภาษาไทยแย่จริง" แทนการเดา
--
-- ⚠️ D1 ไม่รองรับ ADD COLUMN IF NOT EXISTS — ถ้ารันซ้ำจะได้ duplicate column error
--    ซึ่งปลอดภัย ข้ามได้เลย (ตารางมีคอลัมน์ครบแล้ว)

ALTER TABLE reading_quality ADD COLUMN thai_score INTEGER;
ALTER TABLE reading_quality ADD COLUMN thai_issue_codes TEXT;
ALTER TABLE reading_quality ADD COLUMN thai_fix_count INTEGER;

CREATE INDEX IF NOT EXISTS idx_rq_thai ON reading_quality(thai_score, created_at);
