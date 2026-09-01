-- 0004_users.sql: Consumer User Identity for Retention & Cross-Device Synchronization
CREATE TABLE IF NOT EXISTS users (
  id                TEXT PRIMARY KEY,          -- 'google_<sub>' | 'line_<userId>'
  provider          TEXT NOT NULL,             -- 'google' | 'line'
  email             TEXT,
  name              TEXT NOT NULL,
  avatar_url        TEXT,
  locale            TEXT NOT NULL DEFAULT 'th',
  marketing_consent INTEGER NOT NULL DEFAULT 0,
  consent_at        INTEGER,
  created_at        INTEGER NOT NULL,
  last_seen_at      INTEGER NOT NULL,
  deleted_at        INTEGER
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_consent ON users(marketing_consent, deleted_at);
