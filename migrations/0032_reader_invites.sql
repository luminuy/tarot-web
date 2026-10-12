-- migrations/0032_reader_invites.sql
-- ลิงก์ห้องส่วนตัว — แม่หมอสร้างลิงก์ให้ลูกค้าคนเดียว ส่งทาง LINE แบบลิงก์ห้องประชุมออนไลน์
-- (docs/plans/CONSULT_FLOW_UX_PLAN_2026-10-11.md คลื่น 7 · เจ้าของเคาะ 2026-10-12: จ่ายบนเว็บก่อนเข้าห้อง)
--
-- ลูกค้าแตะลิงก์ ➔ ใส่ชื่อ ➔ จ่ายผ่านระบบจ่ายเงินเดิม ➔ เข้าคิวของแม่หมอ ➔ แม่หมอกด "รับเข้าห้อง" ➔ วิดีโอคอล
-- - ใช้ได้แม้แม่หมอปิดคิวสดอยู่ (แม่หมอเชิญเอง) · จ่ายได้ครั้งเดียว · หมดอายุ 24 ชม. · แม่หมอยกเลิกได้
-- - `code` คือความลับใน URL (สุ่ม 128 บิต) ไว้เปิดหน้าจ่ายเงินของห้องนี้เท่านั้น — ไม่ใช่ตัวตนลูกค้า
--   แลกเป็นคุกกี้ customerRef ไม่ได้ (ลูกค้าได้คุกกี้ของตัวเองตอนจ่าย เหมือนการจองปกติ)
-- - `label` = ชื่อลูกค้าที่แม่หมอพิมพ์ไว้ (ไม่บังคับ) ใช้เติมช่องชื่อให้ลูกค้า · ลบทิ้งพร้อมแถวหลังหมดอายุ 7 วัน
-- - `ticket_id` = ตั๋วล่าสุดที่เกิดจากลิงก์นี้ · สถานะลิงก์ (รอเปิด/กำลังจ่าย/จ่ายแล้ว) อ่านจากตั๋ว ไม่เก็บซ้ำ
--   ไม่ใส่ FK ไป queue_tickets โดยตั้งใจ — ตั๋วถูกลบตาม PDPA ได้ก่อนแถวนี้
CREATE TABLE IF NOT EXISTS reader_invites (
  id           TEXT PRIMARY KEY,
  code         TEXT NOT NULL UNIQUE,
  reader_id    TEXT NOT NULL REFERENCES readers(id),
  label        TEXT,
  ticket_id    TEXT,
  created_at   INTEGER NOT NULL,
  expires_at   INTEGER NOT NULL,
  cancelled_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_reader_invites_reader ON reader_invites(reader_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reader_invites_ticket ON reader_invites(ticket_id);
