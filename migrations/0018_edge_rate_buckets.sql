-- migrations/0018_edge_rate_buckets.sql
-- เพดานถี่ของเส้นทางเปิดไพ่/แชท/ภาพแชร์ (`src/lib/security/edge-ratelimit.ts`) ต้องนับแบบ atomic ข้าม isolate
--
-- เดิมเก็บถังบน KV แบบ อ่าน ➔ +1 ➔ เขียน — ปัญหาเดียวกับ auth_rate_buckets (0016):
--   1) ไม่ atomic: ยิงพร้อมกันหลาย isolate ทุกตัวอ่านเจอ count < max แล้วผ่านหมด
--   2) ทุกคำขอ = เขียน KV 1 ครั้ง ซึ่งโควตาฟรีมีแค่ 1,000 ครั้ง/วัน (คอขวดความจุทั้งเว็บ)
--
-- ตารางนี้ให้ `INSERT ... ON CONFLICT DO UPDATE ... RETURNING` นับและตัดสินในคำสั่งเดียว
-- แถวที่หมดอายุถูกเขียนทับเมื่อมีคำขอใหม่ และถูกกวาดทิ้งเป็นครั้งคราว

CREATE TABLE IF NOT EXISTS edge_rate_buckets (
  key       TEXT PRIMARY KEY,
  count     INTEGER NOT NULL,
  reset_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_edge_rate_reset ON edge_rate_buckets(reset_at);
