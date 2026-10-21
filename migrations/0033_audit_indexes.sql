-- migrations/0033_audit_indexes.sql
-- index สำหรับคำสั่งที่เดิมต้องอ่านทั้งตาราง (ผลตรวจ 2026-10-18 · A9-05)
-- D1 คิดเงินตามแถวที่อ่าน ไม่ใช่แถวที่ตอบกลับ — ไม่มี index = อ่านทั้งตารางทุกครั้งที่เรียก
--
-- - users(created_at, id): หน้ารายชื่อสมาชิกของแผงแอดมิน เรียงสมาชิกใหม่สุดก่อนแล้วแบ่งหน้า
-- - bookings(status, hold_expires_at): cron ปล่อยที่จองที่กันไว้แต่หมดเวลาจ่าย
-- - bookings(status, kind, slot_start): cron เตือนนัด/ปิดนัดที่เลยเวลา ค้นตามสถานะ + ชนิด + เวลานัด
--
-- ทุกบรรทัดเป็น IF NOT EXISTS — รันซ้ำได้ · ต้องตรงกับ src/lib/platform/db.ts (ฐานข้อมูลในเครื่อง)
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_status_hold ON bookings(status, hold_expires_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status_slot ON bookings(status, kind, slot_start);
