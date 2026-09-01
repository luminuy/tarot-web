-- 0006_email_auth.sql
-- Migration: เพิ่มฟิลด์สำหรับ Email/Password Authentication, Verification/Reset Tokens และ OAuth Identities

-- ขยาย users สำหรับ email/password (provider เพิ่มค่า 'email')
ALTER TABLE users ADD COLUMN email_lower     TEXT;
ALTER TABLE users ADD COLUMN password_hash   TEXT;
ALTER TABLE users ADD COLUMN email_verified  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN token_version   INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users(email_lower) WHERE email_lower IS NOT NULL;

-- ตารางจัดเก็บ Auth Tokens (Verification link & Password Reset link)
CREATE TABLE IF NOT EXISTS auth_tokens (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id),
  kind        TEXT NOT NULL,             -- 'verify' | 'reset'
  token_hash  TEXT NOT NULL,             -- sha256(rawToken) ป้องกันการรั่วไหล
  expires_at  INTEGER NOT NULL,
  used_at     INTEGER,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_authtok_hash ON auth_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_authtok_user ON auth_tokens(user_id, kind);

-- ตารางจัดเก็บ Identity ของ OAuth สำหรับการ Link หลาย Provider เข้ากับ User ID เดียว
CREATE TABLE IF NOT EXISTS oauth_identities (
  provider         TEXT NOT NULL,        -- 'google' | 'line'
  provider_user_id TEXT NOT NULL,        -- Google sub / LINE userId
  user_id          TEXT NOT NULL REFERENCES users(id),
  created_at       INTEGER NOT NULL,
  PRIMARY KEY (provider, provider_user_id)
);
CREATE INDEX IF NOT EXISTS idx_oauthid_user ON oauth_identities(user_id);
