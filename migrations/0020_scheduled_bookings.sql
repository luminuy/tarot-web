-- migrations/0020_scheduled_bookings.sql
-- ระบบนัดเวลาล่วงหน้า + จ่ายก่อนคุย (src/lib/marketplace/booking.repo.ts · booking-policy.ts)
--
-- ตาราง `bookings` มีตั้งแต่ 0002 แต่ไม่เคยใช้จริง (มีแค่เส้นจ่ายเงินที่ไม่มีหน้าเว็บเรียก)
-- รอบนี้ทำให้มันเป็น "ใบจอง" หนึ่งใบต่อหนึ่งตั๋วคิว:
--   reserved  = กันที่ไว้ระหว่างรอจ่ายเงิน (หมดเวลาที่ hold_expires_at)
--   confirmed = จ่ายแล้ว นัดยืนยัน
--   done / cancelled / no_show / expired = ปิดแล้ว
--
-- 🔒 กันจองซ้อน: unique index แบบมีเงื่อนไข — เวลาเดียวกันของแม่หมอคนเดียวกัน
--    มีใบจองที่ "ยังมีผล" ได้ใบเดียวเท่านั้น ฐานข้อมูลเป็นคนตัดสิน ไม่ใช่โค้ดที่ SELECT ก่อนแล้ว INSERT
--    (สองคนกดพร้อมกัน = คนหนึ่งได้ อีกคนโดน UNIQUE constraint ➔ ตอบ 409 "เวลานี้เพิ่งมีคนจอง")
--    คิวสด (`kind = 'walkup'`) ไม่มีเวลานัด จึงไม่อยู่ใน index นี้

ALTER TABLE bookings ADD COLUMN kind TEXT NOT NULL DEFAULT 'scheduled';   -- 'scheduled' | 'walkup'
ALTER TABLE bookings ADD COLUMN hold_expires_at INTEGER;                   -- ms · เฉพาะตอน reserved
ALTER TABLE bookings ADD COLUMN cancelled_at INTEGER;
ALTER TABLE bookings ADD COLUMN cancelled_by TEXT;                         -- 'customer' | 'reader' | 'system'
ALTER TABLE bookings ADD COLUMN refund_status TEXT;                        -- 'refunded' | 'none' | 'failed'
ALTER TABLE bookings ADD COLUMN reschedule_count INTEGER NOT NULL DEFAULT 0;
-- เงินรายการนี้ "ต้องคืน" แต่ยังคืนไม่สำเร็จ — webhook ที่ Stripe ยิงซ้ำ/แอดมินใช้ตามคืนต่อ
ALTER TABLE payments ADD COLUMN refund_due INTEGER NOT NULL DEFAULT 0;

-- แถวเก่า (ถ้ามี) มาจากเส้นจ่ายเงินของคิวสดที่ไม่เคยมีหน้าเว็บเรียก — ไม่ใช่นัดจริง
-- ต้องย้ายออกจากชุด "ยังมีผล" ก่อนสร้าง unique index ไม่งั้นแถวซ้ำเวลาจะทำให้ index สร้างไม่ได้
UPDATE bookings SET kind = 'walkup';
UPDATE bookings SET status = 'expired' WHERE status = 'reserved';

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_slot_active
  ON bookings(reader_id, slot_start)
  WHERE kind = 'scheduled' AND status IN ('reserved', 'confirmed');
CREATE INDEX IF NOT EXISTS idx_bookings_ticket ON bookings(ticket_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_ref ON payments(provider_ref);
CREATE INDEX IF NOT EXISTS idx_avail_reader_mode ON reader_availability(reader_id, mode);
