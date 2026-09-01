import { getAppDB } from "@/lib/platform/db";

export interface AppUser {
  id: string;
  provider: "google" | "line";
  email?: string | null;
  name: string;
  avatarUrl?: string | null;
  locale: string;
  marketingConsent: boolean;
  consentAt?: number | null;
  createdAt: number;
  lastSeenAt: number;
  deletedAt?: number | null;
}

interface RawUserRow {
  id: string;
  provider: string;
  email: string | null;
  name: string;
  avatar_url: string | null;
  locale: string;
  marketing_consent: number;
  consent_at: number | null;
  created_at: number;
  last_seen_at: number;
  deleted_at: number | null;
}

function mapRowToUser(row: RawUserRow): AppUser {
  return {
    id: row.id,
    provider: row.provider as "google" | "line",
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url,
    locale: row.locale || "th",
    marketingConsent: Number(row.marketing_consent) === 1,
    consentAt: row.consent_at,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
    deletedAt: row.deleted_at,
  };
}

/**
 * บันทึกหรืออัปเดตข้อมูลผู้ใช้เมื่อเข้าสู่ระบบ (OAuth Callback)
 */
export async function upsertUserOnLogin(p: {
  id: string;
  provider: "google" | "line";
  email?: string | null;
  name: string;
  avatarUrl?: string | null;
}): Promise<AppUser> {
  const db = await getAppDB();
  const now = Date.now();

  await db
    .prepare(
      `INSERT INTO users (id, provider, email, name, avatar_url, locale, marketing_consent, created_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?, 'th', 0, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         avatar_url = COALESCE(excluded.avatar_url, users.avatar_url),
         email = COALESCE(excluded.email, users.email),
         last_seen_at = excluded.last_seen_at,
         deleted_at = NULL`
    )
    .bind(p.id, p.provider, p.email || null, p.name, p.avatarUrl || null, now, now)
    .run();

  const user = await getUserById(p.id);
  if (!user) {
    throw new Error("ไม่สามารถดึงข้อมูลผู้ใช้หลังบันทึกได้");
  }
  return user;
}

/**
 * ดึงข้อมูลผู้ใช้ตาม ID (เฉพาะบัญชีที่ยังไม่ถูกลบ)
 */
export async function getUserById(id: string): Promise<AppUser | null> {
  const db = await getAppDB();
  const row = await db
    .prepare(`SELECT * FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1`)
    .bind(id)
    .first<RawUserRow>();

  return row ? mapRowToUser(row) : null;
}

/**
 * บันทึกความยินยอมรับการแจ้งเตือนและการตลาด (PDPA Consent)
 */
export async function setMarketingConsent(id: string, consent: boolean): Promise<void> {
  const db = await getAppDB();
  const now = Date.now();

  await db
    .prepare(
      `UPDATE users
       SET marketing_consent = ?, consent_at = ?
       WHERE id = ? AND deleted_at IS NULL`
    )
    .bind(consent ? 1 : 0, consent ? now : null, id)
    .run();
}

/**
 * ทำเครื่องหมายลบบัญชีผู้ใช้ (Soft Delete)
 */
export async function softDeleteUser(id: string): Promise<void> {
  const db = await getAppDB();
  const now = Date.now();

  await db
    .prepare(`UPDATE users SET deleted_at = ? WHERE id = ?`)
    .bind(now, id)
    .run();
}

/**
 * ดึงรายชื่อผู้ใช้ที่ให้ความยินยอมรับอีเมลและมีที่อยู่อีเมลสมบูรณ์
 */
export async function listConsentedUsersWithEmail(): Promise<AppUser[]> {
  const db = await getAppDB();
  const { results } = await db
    .prepare(
      `SELECT * FROM users
       WHERE marketing_consent = 1 AND email IS NOT NULL AND deleted_at IS NULL`
    )
    .all<RawUserRow>();

  return (results || []).map(mapRowToUser);
}
