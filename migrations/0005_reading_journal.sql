-- 0005_reading_journal.sql: Server-backed Tarot Reading Journal for Cross-Device Synchronization
CREATE TABLE IF NOT EXISTS reading_journal (
  id                 TEXT PRIMARY KEY,          -- 'rj_<uuid>'
  user_id            TEXT NOT NULL REFERENCES users(id),
  content_hash       TEXT NOT NULL,             -- sha256(question|sorted(cardIndex:rev))
  question           TEXT NOT NULL,
  nickname           TEXT,
  spread_id          TEXT NOT NULL,
  spread_name        TEXT NOT NULL,
  category           TEXT NOT NULL,
  persona_id         TEXT NOT NULL,
  persona_name       TEXT NOT NULL,
  cards_json         TEXT NOT NULL,             -- SavedCardDetail[]
  summary            TEXT NOT NULL DEFAULT '',
  advice_json        TEXT NOT NULL DEFAULT '[]',
  timing             TEXT,
  outcome            TEXT NOT NULL DEFAULT 'PENDING',
  user_note          TEXT,
  outcome_updated_at INTEGER,
  created_at         INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rj_user_hash ON reading_journal(user_id, content_hash);
CREATE INDEX IF NOT EXISTS idx_rj_user_created ON reading_journal(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rj_pending ON reading_journal(user_id, outcome, created_at);
