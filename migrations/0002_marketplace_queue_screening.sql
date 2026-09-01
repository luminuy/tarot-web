-- migrations/0002_marketplace_queue_screening.sql
-- Cloudflare D1 Migration for Reader Availability, Queue Tickets, Bookings & AI Screening (M5-M6)

CREATE TABLE IF NOT EXISTS reader_availability (
  id           TEXT PRIMARY KEY,
  reader_id    TEXT NOT NULL REFERENCES readers(id),
  mode         TEXT NOT NULL,          -- 'live' | 'scheduled'
  weekday      INTEGER,                -- 0-6 (scheduled) | NULL (live)
  start_min    INTEGER,                -- minutes from midnight (scheduled)
  end_min      INTEGER,
  slot_minutes INTEGER DEFAULT 30,
  timezone     TEXT NOT NULL DEFAULT 'Asia/Bangkok',
  is_open      INTEGER NOT NULL DEFAULT 0, -- live: reader toggle status
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_avail_reader ON reader_availability(reader_id);
CREATE INDEX IF NOT EXISTS idx_avail_open ON reader_availability(reader_id, is_open);

CREATE TABLE IF NOT EXISTS ai_screening (
  id               TEXT PRIMARY KEY,
  ticket_id        TEXT,
  verdict          TEXT NOT NULL,        -- 'pass' | 'block' | 'needs_review'
  category         TEXT,                 -- love|work|money|self|general
  urgency          TEXT,                 -- low|medium|high
  in_scope         INTEGER DEFAULT 1,    -- 1/0
  brief            TEXT,                 -- concise summary for reader
  suggested_spread TEXT,
  flags            TEXT DEFAULT '[]',    -- JSON array e.g. ["crisis","medical"]
  created_at       INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_screening_ticket ON ai_screening(ticket_id);

CREATE TABLE IF NOT EXISTS queue_tickets (
  id               TEXT PRIMARY KEY,
  reader_id        TEXT NOT NULL REFERENCES readers(id),
  kind             TEXT NOT NULL,        -- 'walkup' | 'booking'
  status           TEXT NOT NULL DEFAULT 'screening',
  -- screening -> waiting -> ready -> handed_off -> (cancelled | expired)
  position         INTEGER,              -- queue position for walkup
  slot_start       INTEGER,              -- timestamp for scheduled booking
  customer_ref     TEXT NOT NULL,        -- opaque client ID from localStorage
  nickname         TEXT,                 -- PDPA: customer nickname only
  question         TEXT,                 -- PDPA: temporary question context
  reading_snapshot TEXT,                 -- JSON string of drawn cards
  ai_screen_id     TEXT REFERENCES ai_screening(id),
  created_at       INTEGER NOT NULL,
  expires_at       INTEGER NOT NULL      -- auto-cleanup retention timestamp
);

CREATE INDEX IF NOT EXISTS idx_tickets_reader_status ON queue_tickets(reader_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_cust ON queue_tickets(customer_ref);
CREATE INDEX IF NOT EXISTS idx_tickets_expires ON queue_tickets(expires_at);

CREATE TABLE IF NOT EXISTS bookings (
  id          TEXT PRIMARY KEY,
  ticket_id   TEXT NOT NULL REFERENCES queue_tickets(id),
  reader_id   TEXT NOT NULL REFERENCES readers(id),
  slot_start  INTEGER NOT NULL,
  slot_end    INTEGER NOT NULL,
  status      TEXT NOT NULL DEFAULT 'confirmed', -- reserved|paid|confirmed|done|cancelled|no_show
  created_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bookings_reader ON bookings(reader_id, slot_start);
