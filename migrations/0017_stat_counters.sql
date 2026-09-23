-- migrations/0017_stat_counters.sql
-- A2-16 (ผลตรวจ 2026-09-23): ตัวนับสถิติของ /admin ต้องบวกแบบ atomic
--
-- เดิมเก็บเป็น JSON ก้อนเดียวบน KV (`app:stat:day:*` · `app:stat:all`) แบบ อ่าน ➔ บวก ➔ เขียน
-- หลาย isolate อ่านค่าเดิม (KV อ่านค้างได้ ~60 วินาที) แล้วเขียนทับกัน = lost update
-- ตัวเลขใน /admin (reading_completed · ai_cap_hit · entitlement_refund_failed ฯลฯ) ต่ำกว่าจริงแบบเงียบ
--
-- `day = 'all'` คือยอดสะสมตลอดกาล · ข้อมูลเก่าบน KV ยังถูกอ่านรวมเข้าไปด้วย (ดู src/lib/stats/read.ts)

CREATE TABLE IF NOT EXISTS stat_counters (
  day     TEXT NOT NULL,
  metric  TEXT NOT NULL,
  n       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, metric)
);
