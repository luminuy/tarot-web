-- migrations/0027_reader_studio.sql
-- Reader Studio (REFLECTION_JOURNAL_PLAN 1.13 · แทร็ก R) — เครื่องมือทำคำอ่านให้ลูกค้าของแม่หมอเอง
-- ⚠️ PDPA: แม่หมอเป็น "ผู้ควบคุมข้อมูล" ลูกค้าของตัวเอง เว็บเป็น "ผู้ประมวลผล"
--    ใช้งานได้ต่อเมื่อแม่หมอยอมรับข้อตกลงการประมวลผลข้อมูล (dpa_version) แล้วเท่านั้น
--    ลบลูกค้าทั้งคน = ลบคำอ่านและลิงก์ของลูกค้านั้นทั้งหมด · ส่งออกได้รายลูกค้า
--    แม่หมอเห็นเฉพาะลูกค้าของตัวเอง (ทุกคำสั่งกรองด้วย reader_id)

CREATE TABLE IF NOT EXISTS reader_studio_settings (
  reader_id          TEXT PRIMARY KEY,
  brand_name         TEXT,
  logo_url           TEXT,
  brand_color        TEXT,
  contact_line       TEXT,
  show_ai_disclosure INTEGER NOT NULL DEFAULT 1,
  dpa_version        TEXT,
  dpa_accepted_at    INTEGER,
  updated_at         INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS reader_clients (
  id            TEXT PRIMARY KEY,
  reader_id     TEXT NOT NULL,
  display_name  TEXT NOT NULL,
  contact       TEXT,
  note          TEXT,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reader_clients_reader ON reader_clients(reader_id, updated_at DESC);

--   card_source    — 'fair' (สุ่มแบบ Provably Fair ของเว็บ: commitment/server_seed/client_seed) · 'manual' (กรอกจากสำรับจริงของหมอ — ไม่ผ่านการยืนยัน)
--   cards_json     — [{ order, cardIndex, isReversed }]
--   notes_json     — โน้ตของหมอรายตำแหน่ง { "<order>": "..." } + { "summary": "..." }
--   draft_json     — ร่างจาก AI (เก็บแยก ไม่ทับงานของหมอ)
--   body_json      — คำอ่านฉบับส่งจริง [{ key, text, origin: 'reader'|'ai'|'edited' }]
--   share_token_hash — SHA-256 ของโทเคนลิงก์ 128 บิต (ไม่เก็บโทเคนดิบ) · share_password_hash — ใส่รหัสได้
CREATE TABLE IF NOT EXISTS reader_readings (
  id                   TEXT PRIMARY KEY,
  reader_id            TEXT NOT NULL,
  client_id            TEXT,
  title                TEXT NOT NULL,
  question             TEXT,
  spread_id            TEXT NOT NULL,
  custom_spread_json   TEXT,
  card_source          TEXT,
  cards_json           TEXT,
  commitment           TEXT,
  server_seed          TEXT,
  client_seed          TEXT,
  notes_json           TEXT NOT NULL DEFAULT '{}',
  draft_json           TEXT,
  body_json            TEXT,
  show_ai_disclosure   INTEGER NOT NULL DEFAULT 1,
  status               TEXT NOT NULL DEFAULT 'draft',
  share_token_hash     TEXT UNIQUE,
  share_expires_at     INTEGER,
  share_password_hash  TEXT,
  share_revoked_at     INTEGER,
  view_count           INTEGER NOT NULL DEFAULT 0,
  sent_at              INTEGER,
  created_at           INTEGER NOT NULL,
  updated_at           INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reader_readings_reader ON reader_readings(reader_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_reader_readings_client ON reader_readings(client_id);

CREATE TABLE IF NOT EXISTS reader_templates (
  id          TEXT PRIMARY KEY,
  reader_id   TEXT NOT NULL,
  name        TEXT NOT NULL,
  intro       TEXT,
  closing     TEXT,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reader_templates_reader ON reader_templates(reader_id);
