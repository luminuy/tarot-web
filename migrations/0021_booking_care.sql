-- migrations/0021_booking_care.sql
-- ระบบจองรอบสอง "ดูแลลูกค้าครบวงจร" (เจ้าของสั่ง 2026-10-03: ทำทุกข้อให้ได้มาตรฐานเว็บจองระดับโลก)
--
--   bookings.contact_email     — อีเมลที่ลูกค้าใช้จ่ายเงิน (จาก Stripe) ใช้ส่งยืนยัน/เตือนนัด/แจ้งคืนเงิน
--   bookings.*_at              — กันส่งซ้ำ: ทุกอีเมล "จองสิทธิ์" ด้วย UPDATE ... WHERE x IS NULL ก่อนส่ง
--   queue_tickets.user_id      — ลูกค้าที่ล็อกอินอยู่ ➔ เห็น "นัดของฉัน" ได้ทุกเครื่อง
--   readers.notify_email       — แม่หมอรับแจ้งเตือนนัดใหม่/ยกเลิกทางอีเมล
--   readers.price_thb          — ค่าปรึกษาต่อครั้งของแม่หมอแต่ละคน (NULL = ราคากลาง)
--   readers.buffer_min / daily_cap — เวลาพักระหว่างนัด / เพดานนัดต่อวัน
--   reader_blocked_dates       — วันหยุดรายวัน (ทับตารางประจำสัปดาห์)
--   reader_reviews             — รีวิวจริงหลังคุยเสร็จ (หนึ่งตั๋วรีวิวได้ครั้งเดียว)
--   booking_waitlist           — "แจ้งเตือนฉันเมื่อมีเวลาว่าง"
-- ⚠️ อีเมลทุกช่องเป็นข้อมูลส่วนบุคคล (PDPA) — ลบพร้อมตั๋ว/แจ้งแล้วลบทิ้ง ไม่เอาไปทำการตลาด

ALTER TABLE bookings ADD COLUMN contact_email TEXT;
ALTER TABLE bookings ADD COLUMN confirm_email_at INTEGER;
ALTER TABLE bookings ADD COLUMN reminder_24h_at INTEGER;
ALTER TABLE bookings ADD COLUMN reminder_1h_at INTEGER;

ALTER TABLE queue_tickets ADD COLUMN user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_tickets_user ON queue_tickets(user_id);

ALTER TABLE readers ADD COLUMN notify_email TEXT;
ALTER TABLE readers ADD COLUMN price_thb INTEGER;
ALTER TABLE readers ADD COLUMN buffer_min INTEGER NOT NULL DEFAULT 0;
ALTER TABLE readers ADD COLUMN daily_cap INTEGER;

CREATE TABLE IF NOT EXISTS reader_blocked_dates (
  reader_id  TEXT NOT NULL REFERENCES readers(id),
  date_key   TEXT NOT NULL,              -- YYYY-MM-DD เวลาไทย
  created_at INTEGER NOT NULL,
  PRIMARY KEY (reader_id, date_key)
);

CREATE TABLE IF NOT EXISTS reader_reviews (
  id         TEXT PRIMARY KEY,
  ticket_id  TEXT NOT NULL UNIQUE,        -- หนึ่งการปรึกษา = หนึ่งรีวิว (ไม่ผูก FK: ตั๋วถูกลบตาม PDPA แต่รีวิวอยู่ต่อ)
  reader_id  TEXT NOT NULL REFERENCES readers(id),
  rating     INTEGER NOT NULL,            -- 1–5
  comment    TEXT,
  nickname   TEXT,
  hidden     INTEGER NOT NULL DEFAULT 0,  -- แอดมินซ่อนได้ (คำหยาบ/ข้อมูลส่วนตัว)
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reviews_reader ON reader_reviews(reader_id, hidden, created_at DESC);

CREATE TABLE IF NOT EXISTS booking_waitlist (
  id         TEXT PRIMARY KEY,
  reader_id  TEXT NOT NULL REFERENCES readers(id),
  email      TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE (reader_id, email)
);
