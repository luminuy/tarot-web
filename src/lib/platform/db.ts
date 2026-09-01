/**
 * ตัวกลางเข้าถึง Cloudflare D1 Database (Platform Access Layer for D1)
 * ----------------------------------------------------------------------
 * - บน Cloudflare Worker (production / opennextjs-cloudflare): คืน binding จริง (APP_DB)
 * - บน local dev / test: ใช้ node:sqlite (Node 22+) เก็บใน `.dev-marketplace.db`
 *   พร้อม auto-migrate ตาราง readers และ admin_audit
 */

export interface D1ExecResult {
  success: boolean;
  meta?: {
    changes: number;
    last_row_id?: number;
    duration?: number;
  };
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[]; success: boolean }>;
  run(): Promise<D1ExecResult>;
}

export interface AppDB {
  prepare(query: string): D1PreparedStatement;
  batch?(statements: D1PreparedStatement[]): Promise<unknown[]>;
  exec?(query: string): Promise<D1ExecResult>;
}

let cachedDB: AppDB | null = null;

async function safelyGetCloudflareContext() {
  try {
    const mod = await import("@opennextjs/cloudflare");
    if (typeof mod?.getCloudflareContext === "function") {
      return await mod.getCloudflareContext({ async: true });
    }
  } catch {
    // Dynamic import fails gracefully in local dev or standalone test runner
  }
  return null;
}

/**
 * สร้าง Local SQLite Adapter ด้วย node:sqlite สำหรับ Local Dev และ Automated Tests
 */
async function createLocalSQLiteDB(): Promise<AppDB> {
  const g = globalThis as { __tarot_d1_shim__?: AppDB };
  if (g.__tarot_d1_shim__) return g.__tarot_d1_shim__;

  try {
    const sqlite = await import("node:sqlite");
    const path = await import("node:path");
    const dbPath = path.resolve(process.cwd(), ".dev-marketplace.db");
    const db = new sqlite.DatabaseSync(dbPath);

    // Auto-migrate local sqlite schema
    db.exec(`
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

      CREATE TABLE IF NOT EXISTS reader_availability (
        id           TEXT PRIMARY KEY,
        reader_id    TEXT NOT NULL REFERENCES readers(id),
        mode         TEXT NOT NULL,
        weekday      INTEGER,
        start_min    INTEGER,
        end_min      INTEGER,
        slot_minutes INTEGER DEFAULT 30,
        timezone     TEXT NOT NULL DEFAULT 'Asia/Bangkok',
        is_open      INTEGER NOT NULL DEFAULT 0,
        created_at   INTEGER NOT NULL,
        updated_at   INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_avail_reader ON reader_availability(reader_id);

      CREATE TABLE IF NOT EXISTS ai_screening (
        id               TEXT PRIMARY KEY,
        ticket_id        TEXT,
        verdict          TEXT NOT NULL,
        category         TEXT,
        urgency          TEXT,
        in_scope         INTEGER DEFAULT 1,
        brief            TEXT,
        suggested_spread TEXT,
        flags            TEXT DEFAULT '[]',
        created_at       INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_screening_ticket ON ai_screening(ticket_id);

      CREATE TABLE IF NOT EXISTS queue_tickets (
        id               TEXT PRIMARY KEY,
        reader_id        TEXT NOT NULL REFERENCES readers(id),
        kind             TEXT NOT NULL,
        status           TEXT NOT NULL DEFAULT 'screening',
        position         INTEGER,
        slot_start       INTEGER,
        customer_ref     TEXT NOT NULL,
        nickname         TEXT,
        question         TEXT,
        reading_snapshot TEXT,
        ai_screen_id     TEXT REFERENCES ai_screening(id),
        created_at       INTEGER NOT NULL,
        expires_at       INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_tickets_reader_status ON queue_tickets(reader_id, status);
      CREATE INDEX IF NOT EXISTS idx_tickets_cust ON queue_tickets(customer_ref);

      CREATE TABLE IF NOT EXISTS bookings (
        id          TEXT PRIMARY KEY,
        ticket_id   TEXT NOT NULL REFERENCES queue_tickets(id),
        reader_id   TEXT NOT NULL REFERENCES readers(id),
        slot_start  INTEGER NOT NULL,
        slot_end    INTEGER NOT NULL,
        status      TEXT NOT NULL DEFAULT 'confirmed',
        created_at  INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_bookings_reader ON bookings(reader_id, slot_start);

      CREATE TABLE IF NOT EXISTS payments (
        id            TEXT PRIMARY KEY,
        booking_id    TEXT NOT NULL REFERENCES bookings(id),
        ticket_id     TEXT REFERENCES queue_tickets(id),
        provider      TEXT NOT NULL DEFAULT 'omise',
        provider_ref  TEXT,
        amount_satang INTEGER NOT NULL,
        currency      TEXT NOT NULL DEFAULT 'THB',
        status        TEXT NOT NULL DEFAULT 'pending',
        webhook_log   TEXT,
        created_at    INTEGER NOT NULL,
        updated_at    INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
      CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

      CREATE TABLE IF NOT EXISTS payouts (
        id                TEXT PRIMARY KEY,
        reader_id         TEXT NOT NULL REFERENCES readers(id),
        period            TEXT NOT NULL,
        gross_satang      INTEGER NOT NULL,
        commission_satang INTEGER NOT NULL,
        net_satang        INTEGER NOT NULL,
        status            TEXT NOT NULL DEFAULT 'pending',
        created_at        INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_payouts_reader ON payouts(reader_id, period);

      CREATE TABLE IF NOT EXISTS users (
        id                TEXT PRIMARY KEY,
        provider          TEXT NOT NULL,
        email             TEXT,
        email_lower       TEXT,
        password_hash     TEXT,
        email_verified    INTEGER NOT NULL DEFAULT 0,
        token_version     INTEGER NOT NULL DEFAULT 0,
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

      CREATE TABLE IF NOT EXISTS auth_tokens (
        id          TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL REFERENCES users(id),
        kind        TEXT NOT NULL,
        token_hash  TEXT NOT NULL,
        expires_at  INTEGER NOT NULL,
        used_at     INTEGER,
        created_at  INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_authtok_hash ON auth_tokens(token_hash);
      CREATE INDEX IF NOT EXISTS idx_authtok_user ON auth_tokens(user_id, kind);

      CREATE TABLE IF NOT EXISTS oauth_identities (
        provider         TEXT NOT NULL,
        provider_user_id TEXT NOT NULL,
        user_id          TEXT NOT NULL REFERENCES users(id),
        created_at       INTEGER NOT NULL,
        PRIMARY KEY (provider, provider_user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_oauthid_user ON oauth_identities(user_id);

      CREATE TABLE IF NOT EXISTS reading_journal (
        id                 TEXT PRIMARY KEY,
        user_id            TEXT NOT NULL REFERENCES users(id),
        content_hash       TEXT NOT NULL,
        question           TEXT NOT NULL,
        nickname           TEXT,
        spread_id          TEXT NOT NULL,
        spread_name        TEXT NOT NULL,
        category           TEXT NOT NULL,
        persona_id         TEXT NOT NULL,
        persona_name       TEXT NOT NULL,
        cards_json         TEXT NOT NULL,
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
    `);

    // Safe Alter & Index for local SQLite migration
    const safeExec = (sql: string) => {
      try {
        db.exec(sql);
      } catch {
        // Ignore errors if already present or column exists
      }
    };
    safeExec("ALTER TABLE users ADD COLUMN email_lower TEXT");
    safeExec("ALTER TABLE users ADD COLUMN password_hash TEXT");
    safeExec("ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0");
    safeExec("ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0");
    safeExec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users(email_lower) WHERE email_lower IS NOT NULL");


    const adapter: AppDB = {
      prepare(query: string) {
        let boundParams: unknown[] = [];
        return {
          bind(...values: unknown[]) {
            boundParams = values;
            return this;
          },
          async first<T = unknown>(colName?: string): Promise<T | null> {
            try {
              const stmt = db.prepare(query);
              const row = (stmt.get as (...args: unknown[]) => Record<string, unknown> | undefined)(...boundParams);
              if (!row) return null;
              if (colName) return (row[colName] as T) ?? null;
              return row as unknown as T;
            } catch (err) {
              console.error("[LocalSQLite Error in first()]", err, "Query:", query, "Params:", boundParams);
              throw err;
            }
          },
          async all<T = unknown>(): Promise<{ results: T[]; success: boolean }> {
            try {
              const stmt = db.prepare(query);
              const rows = (stmt.all as (...args: unknown[]) => unknown[])(...boundParams) as T[];
              return { results: rows, success: true };
            } catch (err) {
              console.error("[LocalSQLite Error in all()]", err, "Query:", query, "Params:", boundParams);
              throw err;
            }
          },
          async run(): Promise<D1ExecResult> {
            try {
              const stmt = db.prepare(query);
              const res = (stmt.run as (...args: unknown[]) => { changes?: number; lastInsertRowid?: number })(...boundParams);
              return {
                success: true,
                meta: {
                  changes: typeof res.changes === "number" ? res.changes : 0,
                  last_row_id: typeof res.lastInsertRowid === "number" ? Number(res.lastInsertRowid) : undefined,
                },
              };
            } catch (err) {
              console.error("[LocalSQLite Error in run()]", err, "Query:", query, "Params:", boundParams);
              throw err;
            }
          },
        };
      },
      async exec(query: string): Promise<D1ExecResult> {
        db.exec(query);
        return { success: true };
      },
    };

    g.__tarot_d1_shim__ = adapter;
    return adapter;
  } catch (err) {
    console.warn("[Platform DB] Failed to init node:sqlite, using memory mock fallback:", err);
    // In-memory fallback if node:sqlite fails
    return createMemoryDBFallback();
  }
}

/** Fallback memory DB in case sqlite fails to load */
function createMemoryDBFallback(): AppDB {
  return {
    prepare(_query: string) {
      return {
        bind(..._values: unknown[]) { return this; },
        async first<T = unknown>(): Promise<T | null> { return null; },
        async all<T = unknown>(): Promise<{ results: T[]; success: boolean }> { return { results: [], success: true }; },
        async run(): Promise<D1ExecResult> { return { success: true, meta: { changes: 0 } }; },
      };
    },
  };
}

/**
 * ดึง AppDB (Cloudflare D1 binding หรือ Local SQLite adapter)
 */
export async function getAppDB(): Promise<AppDB> {
  if (cachedDB) return cachedDB;

  try {
    const ctx = await safelyGetCloudflareContext();
    if (ctx) {
      const env = ctx.env as Record<string, unknown>;
      const binding = env.APP_DB;
      if (binding && typeof (binding as AppDB).prepare === "function") {
        cachedDB = binding as AppDB;
        return cachedDB;
      }
    }
  } catch {
    // No Cloudflare context (dev/test)
  }

  cachedDB = await createLocalSQLiteDB();
  return cachedDB;
}
