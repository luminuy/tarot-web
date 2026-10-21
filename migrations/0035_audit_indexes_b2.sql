-- migrations/0035_audit_indexes_b2.sql
-- index + คอลัมน์ที่รอบตรวจเต็ม 2026-10-20 (B2) พบว่าขาด — D1 คิดเงินตามแถวที่อ่าน ไม่ใช่แถวที่ตอบกลับ
--
-- B2-04 · ลำดับคิวสด (`QUEUE_ORDER_KEY` · ลูกค้าถามทุก 4 วิ · แผงแม่หมอทุก 5 วิ)
--   subquery `payments WHERE ticket_id = ? AND status = 'paid'` — ถ้าฐานไม่มีสถิติ ตัววางแผนเลือก idx_payments_status
--   แล้วอ่านรายการ paid ทั้งระบบต่อตั๋วหนึ่งใบ · index คู่นี้ตรงทั้งสองเงื่อนไข + ครอบ MIN(updated_at) จึงถูกเลือกเสมอ
-- B2-03 · รายการชำระเงินแอดมิน/แดชบอร์ดผู้บริหาร (เรียง/กรองตาม created_at) · หน้าคุณภาพ AI (reading_quality โต +1 แถวทุกคำอ่าน)
--   · cron นับ check-in ที่ส่งแล้ว (checkin_sent_at) — partial: ไม่เพิ่มต้นทุนเขียนของแถวส่วนใหญ่ที่ยังไม่ส่ง
-- B2-01 · cron หาสายที่แม่หมอไม่เข้า (`status = 'ready'`) ไม่มี index ขึ้นต้นด้วย status
--   · งานกวาดตั๋ว PDPA ไล่อ่านตั๋วที่จ่ายเงินแล้วทั้งประวัติซ้ำทุก 15 นาที ➔ จดว่าล้างข้อมูลส่วนบุคคลแล้ว (`pii_cleared_at`)
--     แล้วอ่านเฉพาะแถวที่ยังไม่ล้าง (partial index) — งานต่อรอบเท่ากับ "ตั๋วที่หมดอายุใหม่" ไม่โตตามประวัติ
-- B2-02 · หน้า /readers คำนวณคะแนนเฉลี่ยจากรีวิวทุกแถว — index ครอบ rating ไม่ต้องกลับไปอ่านแถวตาราง
--
-- ทุกคำสั่งรันซ้ำได้ (IF NOT EXISTS) ยกเว้น ALTER TABLE ซึ่ง wrangler รันครั้งเดียวตามระบบ migration อยู่แล้ว
-- ต้องตรงกับ src/lib/platform/db.ts (ฐานข้อมูลในเครื่อง)
ALTER TABLE queue_tickets ADD COLUMN pii_cleared_at INTEGER;
CREATE INDEX IF NOT EXISTS idx_tickets_pii_pending ON queue_tickets(expires_at) WHERE pii_cleared_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_status ON queue_tickets(status);
CREATE INDEX IF NOT EXISTS idx_payments_ticket_paid ON payments(ticket_id, status, updated_at);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status_created ON payments(status, created_at);
CREATE INDEX IF NOT EXISTS idx_rq_created ON reading_quality(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rj_checkin_sent ON reading_journal(checkin_sent_at) WHERE checkin_sent_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_reader_rating ON reader_reviews(reader_id, hidden, rating);
-- เก็บสถิติให้ตัววางแผน (D1 แนะนำให้รันหลังสร้าง index) — คำสั่งอื่นที่แผนขึ้นกับสถิติจะเลือก index ถูกตัว
PRAGMA optimize;
