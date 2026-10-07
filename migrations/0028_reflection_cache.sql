-- migrations/0028_reflection_cache.sql
-- แคช "สิ่งที่สมุดของคุณสะท้อน" (REFLECTION_JOURNAL_PLAN 1.5 · คลื่น 4)
-- กุญแจ = แฮชของ (ผู้ใช้ · ขอบเขต · รหัส+เวลาแก้ล่าสุดของทุกบันทึกในขอบเขต) — บันทึกไม่เปลี่ยน = ไม่เรียก AI ซ้ำ
-- เก็บเฉพาะผลที่ผ่านด่านตรวจอ้างอิงแล้ว · ลบตามเมื่อลบบัญชี (ทะเบียน lib/privacy/user-data.ts)
CREATE TABLE IF NOT EXISTS reflection_cache (
  cache_key   TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  lang        TEXT NOT NULL,
  result_json TEXT NOT NULL,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reflection_cache_user ON reflection_cache(user_id, created_at);
