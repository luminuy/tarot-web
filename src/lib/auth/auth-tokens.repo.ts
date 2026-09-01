import { createHash, randomBytes } from "node:crypto";
import { getAppDB } from "@/lib/platform/db";

export type AuthTokenKind = "verify" | "reset";

/**
 * แฮช Token ดิบด้วย SHA-256 ก่อนจัดเก็บลงฐานข้อมูล เพื่อความปลอดภัยสูงสุด
 */
function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

/**
 * ออก Token ใหม่สำหรับยืนยันอีเมลหรือรีเซ็ตรหัสผ่าน (Single-Use with TTL)
 * @returns Raw token string สำหรับส่งแนบไปในลิงก์อีเมล
 */
export async function issueToken(
  userId: string,
  kind: AuthTokenKind,
  ttlMs: number
): Promise<string> {
  const db = await getAppDB();
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(rawToken);
  const now = Date.now();
  const expiresAt = now + ttlMs;
  const tokenId = `at_${randomBytes(12).toString("hex")}`;

  await db
    .prepare(
      `INSERT INTO auth_tokens (id, user_id, kind, token_hash, expires_at, used_at, created_at)
       VALUES (?, ?, ?, ?, ?, NULL, ?)`
    )
    .bind(tokenId, userId, kind, tokenHash, expiresAt, now)
    .run();

  return rawToken;
}

/**
 * ตรวจสอบและใช้งาน Token (Consume Token แบบครั้งเดียวทิ้ง)
 * @returns Object ที่มี userId หาก Token ถูกต้องและยังไม่หมดอายุ มิฉะนั้นคืนค่า null
 */
export async function consumeToken(
  rawToken: string,
  kind: AuthTokenKind
): Promise<{ userId: string } | null> {
  if (!rawToken || typeof rawToken !== "string") {
    return null;
  }

  const db = await getAppDB();
  const tokenHash = hashToken(rawToken);
  const now = Date.now();

  const row = await db
    .prepare(
      `SELECT id, user_id, expires_at, used_at
       FROM auth_tokens
       WHERE token_hash = ? AND kind = ?
       LIMIT 1`
    )
    .bind(tokenHash, kind)
    .first<{ id: string; user_id: string; expires_at: number; used_at: number | null }>();

  if (!row) {
    return null;
  }

  // Token หมดอายุหรือถูกใช้ไปแล้ว
  if (row.used_at !== null || row.expires_at < now) {
    return null;
  }

  // ทำเครื่องหมายว่า Token ถูกใช้งานแล้วทันที
  await db
    .prepare(`UPDATE auth_tokens SET used_at = ? WHERE id = ?`)
    .bind(now, row.id)
    .run();

  return { userId: row.user_id };
}

/**
 * ยกเลิก Token ทั้งหมดของผู้ใช้ในประเภทที่ระบุ (เช่น เมื่อมีการขอรีเซ็ตใหม่หรือเปลี่ยนรหัสผ่านสำเร็จ)
 */
export async function invalidateUserTokens(
  userId: string,
  kind: AuthTokenKind
): Promise<void> {
  const db = await getAppDB();
  const now = Date.now();
  await db
    .prepare(
      `UPDATE auth_tokens
       SET used_at = ?
       WHERE user_id = ? AND kind = ? AND used_at IS NULL`
    )
    .bind(now, userId, kind)
    .run();
}
