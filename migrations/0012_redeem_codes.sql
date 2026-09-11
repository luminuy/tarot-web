-- 0012: ระบบรหัสแลกสิทธิ์ (Redeem Codes)
-- สำหรับแลกโควตาการเปิดไพ่และสิทธิ์พิเศษระดับพรีเมียม

CREATE TABLE IF NOT EXISTS redeem_codes (
  code           TEXT PRIMARY KEY,              -- เช่น 'VIP3-TAROT-2026' (uppercase)
  title          TEXT NOT NULL,                 -- ชื่อแคมเปญ / คำอธิบาย
  credits        INTEGER NOT NULL DEFAULT 3,    -- จำนวนรอบเปิดไพ่
  max_uses       INTEGER NOT NULL DEFAULT -1,   -- จำนวนครั้งที่ใช้ได้รวม (-1 = ไม่จำกัด)
  used_count     INTEGER NOT NULL DEFAULT 0,    -- จำนวนครั้งที่ถูกแลกไปแล้ว
  reason_prefix  TEXT NOT NULL DEFAULT 'purchase_redeem', -- ช่วยให้เข้าเงื่อนไข hasPaidCredits
  expires_at     INTEGER,                       -- epoch ms หรือ null ถ้าไม่หมดอายุ
  is_active      INTEGER NOT NULL DEFAULT 1,    -- 1 = ใช้งานได้, 0 = ปิดใช้งาน
  created_at     INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS redeem_redemptions (
  id             TEXT PRIMARY KEY,              -- 'rdm_<uuid>'
  code           TEXT NOT NULL REFERENCES redeem_codes(code),
  user_id        TEXT NOT NULL REFERENCES users(id),
  credits        INTEGER NOT NULL,
  redeemed_at    INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rdm_code_user ON redeem_redemptions(code, user_id);
CREATE INDEX IF NOT EXISTS idx_rdm_user ON redeem_redemptions(user_id);

-- Seed รหัสเริ่มต้นที่เปิดได้ทุกอย่าง 3 ครั้ง
INSERT OR IGNORE INTO redeem_codes (code, title, credits, max_uses, used_count, reason_prefix, expires_at, is_active, created_at)
VALUES 
  ('VIP3-TAROT-2026', 'สิทธิ์ญาณพยากรณ์พิเศษ 3 ครั้ง (เปิดได้ทุกผังและปรมาจารย์ลับ)', 3, -1, 0, 'purchase_redeem', NULL, 1, 1726000000000),
  ('SEER3PASS', 'สิทธิ์ญาณพยากรณ์พิเศษ 3 ครั้ง (เปิดได้ทุกผังและปรมาจารย์ลับ)', 3, -1, 0, 'purchase_redeem', NULL, 1, 1726000000000);
