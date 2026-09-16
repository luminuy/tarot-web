-- migrations/0015_payments_owner.sql
-- T-07 + T-09: ผูกแถว `payments` เข้ากับเจ้าของบัญชี และปลดกุญแจนอกที่เป็นจริงไม่ได้
--
-- T-07 — ตาราง `payments` ไม่มีคอลัมน์ `user_id` เลย เส้นทางยืนยันการซื้อเครดิตจึงพิสูจน์ได้แค่
--        (1) เซสชันตรงกับ userId ที่ส่งมา และ (2) มีออร์เดอร์ที่จ่ายแล้วยอดเท่านี้
--        แต่ไม่มีอะไรพิสูจน์ว่าสองอย่างนี้คือคนเดียวกัน · `orderId` เดินทางใน query string
--        ไปหาเกตเวย์ จึงไปโผล่ใน log เกตเวย์ · Referer · ประวัติเบราว์เซอร์
--
-- T-09 — `booking_id TEXT NOT NULL REFERENCES bookings(id)` เป็นจริงไม่ได้สำหรับการซื้อเครดิต
--        เพราะเส้นทางนั้นเขียน `bookingId: orderId` โดยไม่สร้างแถว `bookings` เลย
--        วันนี้เงียบเพราะ D1 ยังไม่บังคับ FK — `PRAGMA foreign_key_check` รายงานแถวค้างอยู่แล้ววันนี้
--
-- ⚠️ ไฟล์นี้เป็น "สร้างตารางใหม่แล้วย้ายข้อมูล" ซึ่งเป็นทางเดียวที่ SQLite/D1 ถอด FK ได้
--    wrangler จดไว้ใน `d1_migrations` แล้วข้ามให้เองในรอบถัดไป (ดู deploy.yml)
--    **ห้ามรันไฟล์นี้ด้วยมือซ้ำ** — รอบที่สองจะคัดลอกข้อมูลกลับโดยที่ `user_id` เป็น NULL

ALTER TABLE payments RENAME TO payments_pre_0015;

CREATE TABLE payments (
  id            TEXT PRIMARY KEY,
  -- ไม่มี REFERENCES อีกต่อไป: แถวนี้เป็นได้ทั้งการจองแม่หมอ (มีแถว bookings)
  -- และการเติมเครดิต (ไม่มีแถว bookings) — ตัวแยกคือ `order_id`
  booking_id    TEXT,
  -- เลขคำสั่งซื้อของเส้นทางเติมเครดิต
  order_id      TEXT,
  -- เจ้าของรายการ — ด่านยืนยันการซื้อต้องเทียบกับคอลัมน์นี้ ไม่ใช่เชื่อ userId ที่ไคลเอนต์ส่งมา
  user_id       TEXT,
  ticket_id     TEXT,
  provider      TEXT NOT NULL DEFAULT 'omise',
  provider_ref  TEXT,
  amount_satang INTEGER NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'THB',
  status        TEXT NOT NULL DEFAULT 'pending',
  webhook_log   TEXT,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);

-- แถวเดิมของเส้นทางเติมเครดิตเก็บเลขออร์เดอร์ไว้ใน booking_id (ตามที่โค้ดเดิมเขียน)
-- จึงคัดลอกค่าเดียวกันลง order_id ให้ด้วย ส่วนแถวจองแม่หมอจะมี order_id เกินมาแบบไม่มีผล
INSERT INTO payments (
  id, booking_id, order_id, user_id, ticket_id, provider, provider_ref,
  amount_satang, currency, status, webhook_log, created_at, updated_at
)
SELECT id, booking_id, booking_id, NULL, ticket_id, provider, provider_ref,
       amount_satang, currency, status, webhook_log, created_at, updated_at
  FROM payments_pre_0015;

DROP TABLE payments_pre_0015;

CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_ticket ON payments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
