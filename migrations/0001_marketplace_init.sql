-- migrations/0001_marketplace_init.sql
-- Cloudflare D1 Migration for Tarot Marketplace Readers (M4)

CREATE TABLE IF NOT EXISTS readers (
  id             TEXT PRIMARY KEY,
  display_name   TEXT NOT NULL,
  bio            TEXT NOT NULL DEFAULT '',
  avatar_url     TEXT,
  specialties    TEXT NOT NULL DEFAULT '[]',
  line_url       TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending',
  commission_pct INTEGER NOT NULL DEFAULT 20,
  session_secret TEXT NOT NULL,
  created_at     INTEGER NOT NULL,
  updated_at     INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_readers_status ON readers(status);
CREATE INDEX IF NOT EXISTS idx_readers_created ON readers(created_at DESC);

CREATE TABLE IF NOT EXISTS admin_audit (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  ts         INTEGER NOT NULL,
  actor      TEXT NOT NULL,
  action     TEXT NOT NULL,
  detail     TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_ts ON admin_audit(ts DESC);
