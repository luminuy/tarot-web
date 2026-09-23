-- migrations/0016_auth_rate_buckets.sql
-- A1-02 (ผลตรวจ 2026-09-23): ถังกันเดารหัสผ่านต้องนับแบบ atomic
--
-- เดิมเก็บถังไว้ใน KV แบบ อ่าน ➔ +1 ➔ เขียน ซึ่งไม่ atomic และ KV รับเขียนคีย์เดียวได้
-- 1 ครั้ง/วินาที (ที่เกินถูกกลืนเงียบ) · ยิงพร้อมกัน 200 คำขอไป /api/admin/login
-- ทุกตัวอ่านเจอ count < 8 แล้วผ่านหมด = เดารหัสแอดมินได้หลายร้อยครั้งต่อรอบ
--
-- ตารางนี้ให้ `INSERT ... ON CONFLICT DO UPDATE ... RETURNING` นับและตัดสินในคำสั่งเดียว
-- แถวที่หมดอายุถูกเขียนทับเมื่อมีคำขอใหม่ และถูกกวาดทิ้งโดย `pruneAuthRateBuckets`

CREATE TABLE IF NOT EXISTS auth_rate_buckets (
  key       TEXT PRIMARY KEY,
  count     INTEGER NOT NULL,
  reset_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_rate_reset ON auth_rate_buckets(reset_at);
