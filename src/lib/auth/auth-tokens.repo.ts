import { createHash, randomBytes } from "node:crypto";
import { getAppDB } from "@/lib/platform/db";
import { getWaitUntil } from "@/lib/platform/cf";

export type AuthTokenKind = "verify" | "reset";

/** เก็บ token ที่หมดอายุไว้ต่ออีก 1 วันก่อนลบ (กันแข่งเวลากับ consume ที่กำลังทำงาน) */
const CLEANUP_GRACE_MS = 24 * 60 * 60 * 1000;

/**
 * ลบ auth_tokens ที่หมดอายุแล้ว (bounded batch) — ไม่มี cron จึงเรียกแบบ lazy
 * จาก `issueToken` ~5% ของครั้ง ผ่าน `waitUntil` (ไม่บล็อกผู้ใช้)
 * export ไว้ให้ endpoint แอดมิน/สคริปต์เรียกตรงได้ด้วย
 */
export async function pruneExpiredAuthTokens(limit = 200): Promise<number> {
  const db = await getAppDB();
  const cutoff = Date.now() - CLEANUP_GRACE_MS;
  const res = await db
    .prepare(
      `DELETE FROM auth_tokens
       WHERE id IN (SELECT id FROM auth_tokens WHERE expires_at < ? LIMIT ?)`,
    )
    .bind(cutoff, limit)
    .run();
  return (res.meta as { changes?: number } | undefined)?.changes ?? 0;
}

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

  // เก็บกวาด token หมดอายุแบบ lazy (~5% ของครั้ง · ไม่บล็อกผู้ใช้)
  if (Math.random() < 0.05) {
    try {
      const waitUntil = await getWaitUntil();
      waitUntil(
        pruneExpiredAuthTokens().catch((e) =>
          console.warn("[auth-tokens] lazy prune ล้มเหลว:", e),
        ),
      );
    } catch {
      /* ไม่มี exec context ก็ข้าม */
    }
  }

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
