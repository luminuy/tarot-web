import { getAppDB } from "@/lib/platform/db";

export interface AppUser {
  id: string;
  provider: "google" | "line" | "email";
  email?: string | null;
  emailLower?: string | null;
  name: string;
  avatarUrl?: string | null;
  locale: string;
  marketingConsent: boolean;
  consentAt?: number | null;
  emailVerified: boolean;
  hasPassword: boolean;
  tokenVersion: number;
  createdAt: number;
  lastSeenAt: number;
  deletedAt?: number | null;
}

interface RawUserRow {
  id: string;
  provider: string;
  email: string | null;
  email_lower?: string | null;
  password_hash?: string | null;
  email_verified?: number | null;
  token_version?: number | null;
  name: string;
  avatar_url: string | null;
  locale: string;
  marketing_consent: number;
  consent_at: number | null;
  created_at: number;
  last_seen_at: number;
  deleted_at: number | null;
}

/**
 * ปรับรูปแบบอีเมลให้อยู่ในรูปแบบ lowercase และตัดช่องว่างหน้าหลัง
 */
export function normalizeEmail(email: string): string {
  return (email || "").trim().toLowerCase();
}

function mapRowToUser(row: RawUserRow): AppUser {
  return {
    id: row.id,
    provider: (row.provider as "google" | "line" | "email") || "google",
    email: row.email,
    emailLower: row.email_lower ?? (row.email ? normalizeEmail(row.email) : null),
    name: row.name,
    avatarUrl: row.avatar_url,
    locale: row.locale || "th",
    marketingConsent: Number(row.marketing_consent) === 1,
    consentAt: row.consent_at,
    emailVerified: Number(row.email_verified) === 1,
    hasPassword: Boolean(row.password_hash && row.password_hash.length > 0),
    tokenVersion: Number(row.token_version || 0),
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
  provider: "google" | "line" | "email";
  email?: string | null;
  name: string;
  avatarUrl?: string | null;
}): Promise<AppUser> {
  const db = await getAppDB();
  const now = Date.now();
  const emailLower = p.email ? normalizeEmail(p.email) : null;

  await db
    .prepare(
      `INSERT INTO users (id, provider, email, email_lower, name, avatar_url, locale, marketing_consent, email_verified, token_version, created_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?, ?, 'th', 0, 1, 0, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         avatar_url = COALESCE(excluded.avatar_url, users.avatar_url),
         email = COALESCE(excluded.email, users.email),
         email_lower = COALESCE(excluded.email_lower, users.email_lower),
         email_verified = 1,
         last_seen_at = excluded.last_seen_at,
         deleted_at = NULL`
    )
    .bind(p.id, p.provider, p.email || null, emailLower, p.name, p.avatarUrl || null, now, now)
    .run();

  const user = await getUserById(p.id);
  if (!user) {
    throw new Error("ไม่สามารถดึงข้อมูลผู้ใช้หลังบันทึกได้");
  }
  return user;
}

/**
 * สร้างผู้ใช้ใหม่สำหรับการสมัครผ่านอีเมลและรหัสผ่าน (Email Provider)
 */
export async function createEmailUser(p: {
  email: string;
  name: string;
  passwordHash: string;
}): Promise<AppUser> {
  const db = await getAppDB();
  const now = Date.now();
  const emailLower = normalizeEmail(p.email);
  const id = `email_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;

  await db
    .prepare(
      `INSERT INTO users (id, provider, email, email_lower, password_hash, name, avatar_url, locale, marketing_consent, email_verified, token_version, created_at, last_seen_at)
       VALUES (?, 'email', ?, ?, ?, ?, NULL, 'th', 0, 0, 0, ?, ?)`
    )
    .bind(id, p.email.trim(), emailLower, p.passwordHash, p.name.trim(), now, now)
    .run();

  const user = await getUserById(id);
  if (!user) {
    throw new Error("ไม่สามารถสร้างบัญชีผู้ใช้ใหม่ด้วยอีเมลได้");
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
 * ดึงข้อมูลผู้ใช้ตามอีเมล (case-insensitive lookup, เฉพาะบัญชีที่ยังไม่ถูกลบ)
 */
export async function getUserByEmail(email: string): Promise<AppUser | null> {
  const db = await getAppDB();
  const emailLower = normalizeEmail(email);
  const row = await db
    .prepare(
      `SELECT * FROM users
       WHERE (email_lower = ? OR lower(email) = ?) AND deleted_at IS NULL
       LIMIT 1`
    )
    .bind(emailLower, emailLower)
    .first<RawUserRow>();

  return row ? mapRowToUser(row) : null;
}

/**
 * ดึงผู้ใช้ตามอีเมล **รวมบัญชีที่ถูกลบไปแล้ว (soft delete)**
 *
 * ⚠️ จำเป็นเพราะ `UNIQUE INDEX idx_users_email_lower` ไม่สนใจ `deleted_at`
 * แถวที่ถูกลบยังจองอีเมลนั้นไว้ในดัชนีอยู่ · ถ้าเช็กด้วย `getUserByEmail()` (ซึ่งกรอง
 * `deleted_at IS NULL` ทิ้ง) จะไม่เห็นแถวนั้น แล้วไป INSERT ทับจนชน unique
 * → throw → ผู้ใช้เห็นแค่ "ไม่สามารถสร้างบัญชีได้ในขณะนี้" และสมัครไม่ได้อีกเลยตลอดกาล
 */
export async function getUserByEmailIncludingDeleted(email: string): Promise<AppUser | null> {
  const db = await getAppDB();
  const emailLower = normalizeEmail(email);
  const row = await db
    .prepare(
      `SELECT * FROM users
       WHERE email_lower = ? OR lower(email) = ?
       LIMIT 1`
    )
    .bind(emailLower, emailLower)
    .first<RawUserRow>();

  return row ? mapRowToUser(row) : null;
}

/**
 * คืนชีพบัญชีที่ถูกลบไปแล้ว เมื่อเจ้าของกลับมาสมัครด้วยอีเมลเดิม
 *
 * ใช้ id เดิมโดยตั้งใจ — โบนัสสมัครใหม่ผูกกับ `(user_id, reason)` แบบ idempotent
 * ถ้าสร้าง id ใหม่ทุกครั้งจะกลายเป็นช่องให้ลบบัญชีแล้วสมัครใหม่วนรับโบนัสไม่รู้จบ
 * (ฝั่ง OAuth ก็คืนชีพด้วย `deleted_at = NULL` ใน upsertUserOnLogin อยู่แล้ว — ทำให้ตรงกัน)
 */
export async function reviveEmailUser(p: {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
}): Promise<AppUser> {
  const db = await getAppDB();
  const now = Date.now();
  const emailLower = normalizeEmail(p.email);

  await db
    .prepare(
      `UPDATE users
       SET deleted_at = NULL,
           provider = 'email',
           email = ?,
           email_lower = ?,
           name = ?,
           password_hash = ?,
           email_verified = 0,
           token_version = token_version + 1,
           last_seen_at = ?
       WHERE id = ?`
    )
    .bind(p.email.trim(), emailLower, p.name.trim(), p.passwordHash, now, p.id)
    .run();

  const user = await getUserById(p.id);
  if (!user) {
    throw new Error("ไม่สามารถคืนชีพบัญชีผู้ใช้ได้");
  }
  return user;
}

/**
 * ดึงรหัสผ่านแฮชของผู้ใช้สำหรับการตรวจสอบความถูกต้อง (Internal Auth Only)
 */
export async function getUserPasswordHash(id: string): Promise<string | null> {
  const db = await getAppDB();
  const row = await db
    .prepare(`SELECT password_hash FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1`)
    .bind(id)
    .first<{ password_hash: string | null }>();

  return row?.password_hash ?? null;
}

/**
 * อัปเดตรหัสผ่านแฮชและเพิ่ม token_version เพื่อให้ Session เก่าหมดอายุ
 */
export async function setPasswordHash(userId: string, hash: string): Promise<void> {
  const db = await getAppDB();
  const now = Date.now();
  await db
    .prepare(
      `UPDATE users
       SET password_hash = ?, token_version = token_version + 1, last_seen_at = ?
       WHERE id = ? AND deleted_at IS NULL`
    )
    .bind(hash, now, userId)
    .run();
}

/**
 * ทำเครื่องหมายว่าอีเมลได้รับการยืนยันแล้ว
 */
export async function markEmailVerified(userId: string): Promise<void> {
  const db = await getAppDB();
  await db
    .prepare(`UPDATE users SET email_verified = 1 WHERE id = ? AND deleted_at IS NULL`)
    .bind(userId)
    .run();
}

/**
 * 🛡️ ยึดคืนบัญชีอีเมลที่ยัง **ไม่เคยยืนยันอีเมล** ให้เจ้าของตัวจริงที่ล็อกอินผ่าน OAuth
 * ---------------------------------------------------------------------------
 * กันช่องโหว่ "จองบัญชีล่วงหน้า" (pre-account hijacking):
 * ผู้โจมตีสมัครด้วยอีเมลของเหยื่อพร้อมรหัสผ่านที่ตัวเองรู้ (ระบบยังไม่บังคับยืนยันอีเมล)
 * ต่อมาเหยื่อกด "เข้าสู่ระบบด้วย Google" ซึ่งพิสูจน์แล้วว่าเป็นเจ้าของอีเมลจริง
 * ถ้าเราผูก identity เข้ากับแถวเดิมเฉย ๆ เหยื่อจะเดินเข้าไปอยู่ในบัญชีของผู้โจมตี
 * และผู้โจมตียังเข้าได้ด้วยรหัสผ่านเดิม → อ่านสมุดบันทึกดวง/ส่งออกข้อมูลของเหยื่อได้
 *
 * เมื่อ OAuth ยืนยันความเป็นเจ้าของอีเมลแล้ว จึงต้อง:
 *   1. ล้างรหัสผ่านเดิมทิ้ง (ผู้โจมตีเข้าด้วยรหัสผ่านไม่ได้อีก)
 *   2. เพิ่ม token_version (เตะเซสชันเดิมของผู้โจมตีออกทั้งหมดทันที)
 *   3. ทำเครื่องหมายว่าอีเมลยืนยันแล้ว (ผู้ให้บริการ OAuth ยืนยันให้)
 * คืนค่า token_version ใหม่ เพื่อให้ผู้เรียกออกเซสชันด้วยเลขที่ถูกต้อง
 */
export async function reclaimUnverifiedEmailAccount(userId: string): Promise<number> {
  const db = await getAppDB();
  await db
    .prepare(
      `UPDATE users
       SET password_hash = NULL, email_verified = 1, token_version = token_version + 1, last_seen_at = ?
       WHERE id = ? AND deleted_at IS NULL`
    )
    .bind(Date.now(), userId)
    .run();

  return getTokenVersion(userId);
}

/**
 * ดึง token_version ของผู้ใช้
 */
export async function getTokenVersion(userId: string): Promise<number> {
  const db = await getAppDB();
  const row = await db
    .prepare(`SELECT token_version FROM users WHERE id = ? LIMIT 1`)
    .bind(userId)
    .first<{ token_version: number }>();

  return row?.token_version ?? 0;
}

/**
 * อัปเดตเวลาเข้าใช้งานล่าสุด
 */
export async function touchLastSeen(id: string): Promise<void> {
  const db = await getAppDB();
  await db
    .prepare(`UPDATE users SET last_seen_at = ? WHERE id = ?`)
    .bind(Date.now(), id)
    .run();
}

/**
 * ค้นหา User ID ที่ผูกไว้กับ OAuth Identity
 */
export async function findUserIdByOAuth(
  provider: "google" | "line",
  providerUserId: string
): Promise<string | null> {
  const db = await getAppDB();
  const row = await db
    .prepare(
      `SELECT user_id FROM oauth_identities
       WHERE provider = ? AND provider_user_id = ?
       LIMIT 1`
    )
    .bind(provider, providerUserId)
    .first<{ user_id: string }>();

  return row?.user_id ?? null;
}

/**
 * ผูก OAuth Identity เข้ากับ User ID
 */
export async function linkOAuthIdentity(
  provider: "google" | "line",
  providerUserId: string,
  userId: string
): Promise<void> {
  const db = await getAppDB();
  const now = Date.now();
  await db
    .prepare(
      `INSERT INTO oauth_identities (provider, provider_user_id, user_id, created_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(provider, provider_user_id) DO UPDATE SET user_id = excluded.user_id`
    )
    .bind(provider, providerUserId, userId, now)
    .run();
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
 * + ลบข้อมูลสิทธิ์การเปิดไพ่ทั้งหมด (reading_usage / user_bonus) ตาม PDPA
 */
export async function softDeleteUser(id: string): Promise<void> {
  const db = await getAppDB();
  const now = Date.now();

  await db
    .prepare(`UPDATE users SET deleted_at = ? WHERE id = ?`)
    .bind(now, id)
    .run();

  try {
    const { purgeEntitlementData } = await import("@/lib/entitlement/entitlement");
    await purgeEntitlementData(id);
  } catch (err) {
    console.error("[users.repo] purgeEntitlementData failed on softDelete:", err);
  }
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
