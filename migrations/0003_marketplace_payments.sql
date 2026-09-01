-- migrations/0003_marketplace_payments.sql
-- Cloudflare D1 Migration for Payments & Revenue Payouts (M7)

CREATE TABLE IF NOT EXISTS payments (
  id            TEXT PRIMARY KEY,
  booking_id    TEXT NOT NULL REFERENCES bookings(id),
  ticket_id     TEXT REFERENCES queue_tickets(id),
  provider      TEXT NOT NULL DEFAULT 'omise', -- 'omise' | 'promptpay' | 'mock'
  provider_ref  TEXT,                          -- external charge id
  amount_satang INTEGER NOT NULL,              -- integer satang (100 satang = 1 THB)
  currency      TEXT NOT NULL DEFAULT 'THB',
  status        TEXT NOT NULL DEFAULT 'pending', -- pending | paid | failed | refunded
  webhook_log   TEXT,                          -- raw JSON webhook log
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_ticket ON payments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

CREATE TABLE IF NOT EXISTS payouts (
  id                TEXT PRIMARY KEY,
  reader_id         TEXT NOT NULL REFERENCES readers(id),
  period            TEXT NOT NULL,             -- YYYY-MM
  gross_satang      INTEGER NOT NULL,
  commission_satang INTEGER NOT NULL,
  net_satang        INTEGER NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending', -- pending | completed | cancelled
  created_at        INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payouts_reader ON payouts(reader_id, period);
