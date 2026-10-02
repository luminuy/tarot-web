-- migrations/0019_call_sessions.sql
-- ห้องวิดีโอคอลตัวต่อตัว ลูกค้า ↔ แม่หมอ (src/lib/marketplace/call.repo.ts)
--
-- ภาพและเสียงไม่ผ่านเซิร์ฟเวอร์เรา — วิ่งผ่าน Cloudflare TURN (บังคับ relay เพื่อซ่อน IP ของทั้งสองฝั่ง)
-- ตารางนี้เก็บแค่ "ใบนัดเชื่อมสาย" (SDP offer/answer) ให้สองเบราว์เซอร์แลกกัน
--   • หนึ่งตั๋วคิว = หนึ่งแถว · `round` เพิ่มทุกครั้งที่ต่อสายใหม่ (ลูกค้าส่ง offer ใหม่ แม่หมอตอบใหม่)
--   • `*_turn_user` = ชื่อผู้ใช้ TURN ที่ออกให้ เก็บไว้เพื่อสั่งเพิกถอนตอนวางสาย
--   • ไม่มีการบันทึกภาพ เสียง หรือข้อความสนทนาใด ๆ
--   • ลบตามตั๋วคิว (PDPA 7 วัน — cleanupExpiredTickets)

CREATE TABLE IF NOT EXISTS call_sessions (
  ticket_id          TEXT PRIMARY KEY REFERENCES queue_tickets(id),
  round              INTEGER NOT NULL DEFAULT 1,
  offer_sdp          TEXT,
  answer_sdp         TEXT,
  customer_seen_at   INTEGER,
  reader_seen_at     INTEGER,
  customer_turn_user TEXT,
  reader_turn_user   TEXT,
  ended_at           INTEGER,
  ended_by           TEXT,                 -- 'customer' | 'reader'
  created_at         INTEGER NOT NULL,
  updated_at         INTEGER NOT NULL
);
