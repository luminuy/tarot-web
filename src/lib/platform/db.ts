/**
 * ตัวกลางเข้าถึง Cloudflare D1 Database (Platform Access Layer for D1)
 * ----------------------------------------------------------------------
 * - บน Cloudflare Worker (production / opennextjs-cloudflare): คืน binding จริง (APP_DB)
 * - บน local dev / test: ใช้ node:sqlite (Node 22+) เก็บใน `.dev-marketplace.db`
 *   สร้างสคีมาจากไฟล์ใน `migrations/` ชุดเดียวกับ production
 */

// ตัวเข้าถึง Cloudflare context อยู่ที่ `cf.ts` ที่เดียว (เดิมมีสำเนาเหมือนกันเป๊ะอยู่ที่นี่ด้วย)
import { safelyGetCloudflareContext } from "@/lib/platform/cf";

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

/**
 * ฐานข้อมูลในเครื่องสร้างจากไฟล์ใน `migrations/` ชุดเดียวกับที่ `deploy.yml` รันใส่ D1 จริง (`npm run db:migrate`)
 * เดิมไฟล์นี้เขียนสคีมาซ้ำเองด้วยมือราว 150 คำสั่ง ซึ่งหลุดไป 9 index (ตรวจ 2026-10-24)
 * ด่านในเครื่องจึงรันบนสคีมาคนละชุดกับ production — ห้ามกลับไปเขียนสคีมาซ้ำในไฟล์นี้อีก
 * ตารางใหม่/คอลัมน์ใหม่ให้เพิ่มไฟล์ migration อย่างเดียว ฐานในเครื่องได้ตามไปเองตอนเปิดครั้งถัดไป
 */
const LOCAL_MIGRATIONS_DIR = "migrations";
/** ตารางจดว่า migration ไหนรันแล้ว — ชื่อและโครงเดียวกับที่ wrangler ใช้บน D1 */
const LOCAL_MIGRATIONS_TABLE = "d1_migrations";

type LocalSqlite = import("node:sqlite").DatabaseSync;

/** migration ในเครื่องล้ม = ต้องล้มดัง ๆ ให้เห็นในด่าน ไม่ถอยไปฐานจำลองที่คืนค่าว่างเงียบ ๆ */
class LocalMigrationError extends Error {}

/**
 * ฐานในเครื่องรุ่นก่อน (สร้างจากสคีมาเขียนมือ ยังไม่มีตาราง d1_migrations) รัน migration ทับไม่ได้
 * เพราะตารางมีอยู่แล้วและ ALTER เพิ่มคอลัมน์ซ้ำ — ผู้เรียกจะย้ายไฟล์ไปไว้ข้าง ๆ แล้วสร้างใหม่
 */
function isLegacyLocalDb(db: LocalSqlite): boolean {
  const ledger = db
    .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(LOCAL_MIGRATIONS_TABLE);
  if (ledger) return false;
  const row = db
    .prepare("SELECT count(*) AS n FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
    .get() as { n: number };
  return row.n > 0;
}

/**
 * รัน migration ที่ยังไม่เคยรันตามลำดับชื่อไฟล์ ไฟล์ละหนึ่งธุรกรรม (`BEGIN IMMEDIATE`)
 * ด่านหลายตัวเปิดไฟล์ฐานเดียวกันพร้อมกันได้ — ตัวที่ได้ล็อกก่อนรัน อีกตัวรอแล้วเห็นว่ารันแล้วจึงข้าม
 * ไฟล์ไหนล้ม = ถอยธุรกรรมแล้วโยน error พร้อมชื่อไฟล์ ไม่กลืนเงียบ
 */
function applyLocalMigrations(db: LocalSqlite, files: { name: string; sql: string }[]): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ${LOCAL_MIGRATIONS_TABLE} (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `);
  const isApplied = db.prepare(`SELECT 1 FROM ${LOCAL_MIGRATIONS_TABLE} WHERE name = ?`);
  const markApplied = db.prepare(`INSERT INTO ${LOCAL_MIGRATIONS_TABLE} (name) VALUES (?)`);
  for (const file of files) {
    if (isApplied.get(file.name)) continue;
    db.exec("BEGIN IMMEDIATE");
    try {
      if (!isApplied.get(file.name)) {
        db.exec(file.sql);
        markApplied.run(file.name);
      }
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      throw new LocalMigrationError(
        `migration ${file.name} รันในเครื่องไม่ผ่าน: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
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
    const fs = await import("node:fs");
    const dbPath = path.resolve(process.cwd(), ".dev-marketplace.db");
    const migrationsDir = path.resolve(process.cwd(), LOCAL_MIGRATIONS_DIR);
    if (!fs.existsSync(migrationsDir)) {
      throw new LocalMigrationError(`ไม่พบโฟลเดอร์ ${migrationsDir} — รันจากรากของรีโปเท่านั้น`);
    }
    const files = fs
      .readdirSync(migrationsDir)
      .filter((name) => name.endsWith(".sql"))
      .sort()
      .map((name) => ({ name, sql: fs.readFileSync(path.join(migrationsDir, name), "utf-8") }));
    if (files.length === 0) throw new LocalMigrationError(`ไม่พบไฟล์ migration ใน ${migrationsDir}`);

    const open = (): LocalSqlite => {
      const conn = new sqlite.DatabaseSync(dbPath);
      conn.exec("PRAGMA journal_mode = WAL;");
      conn.exec("PRAGMA busy_timeout = 5000;");
      return conn;
    };
    let db = open();
    if (isLegacyLocalDb(db)) {
      db.close();
      const aside = `${dbPath}.legacy-${Date.now()}`;
      for (const suffix of ["", "-wal", "-shm"]) {
        if (fs.existsSync(dbPath + suffix)) fs.renameSync(dbPath + suffix, aside + suffix);
      }
      console.warn(
        `[Platform DB] ฐานในเครื่องรุ่นเก่า (สคีมาเขียนมือ) ย้ายไปไว้ที่ ${path.basename(aside)} แล้วสร้างใหม่จาก migrations/`,
      );
      db = open();
    }
    applyLocalMigrations(db, files);

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
    if (err instanceof LocalMigrationError) throw err;
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

export const getDB = getAppDB;
