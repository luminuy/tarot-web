import { getAppDB } from "@/lib/platform/db";
import { nextResetAt, weekKey } from "@/lib/entitlement/week";

/**
 * แกนสิทธิ์การเปิดไพ่ — แหล่งความจริงเดียว (ENTITLEMENT_PLAN ข้อ 5)
 * ห้ามคำนวณสิทธิ์ที่อื่น · ห้ามคำนวณฝั่งเบราว์เซอร์
 *
 * ผู้เยี่ยมชม: 1 ครั้ง (คุกกี้จัดการนับจริง — PR C)
 * สมาชิก:     3 ครั้ง/สัปดาห์ + โบนัสก้อน (ไม่หมดอายุ) · ใช้โควตารายสัปดาห์ก่อน เก็บโบนัสไว้
 */

export const WEEKLY_LIMIT = 3;
export const GUEST_LIMIT = 1;
export const SIGNUP_BONUS = 3;
export const GRANDFATHER_BONUS = 10;

export type Viewer =
  | { kind: "guest"; gid: string; guestUsed: number }
  | { kind: "member"; userId: string };

export interface Entitlement {
  canStartReading: boolean;
  canChat: boolean;
  /** สิทธิ์เปิดไพ่ที่เหลือทั้งหมด (รายสัปดาห์ + โบนัส สำหรับสมาชิก / GUEST_LIMIT - used สำหรับผู้เยี่ยมชม) */
  remaining: number;
  /** เพดานต่อรอบ — ใช้แสดง "เหลือ x/limit" */
  limit: number;
  /** สมาชิกเท่านั้น */
  weeklyRemaining: number;
  /** สมาชิกเท่านั้น */
  bonusRemaining: number;
  /** ISO string เวลาโควตารายสัปดาห์รีเซ็ต (null สำหรับผู้เยี่ยมชม) */
  resetAt: string | null;
  reason?: "guest_used" | "weekly_exhausted" | "members_only";
  kind: "guest" | "member";
}

async function memberUsage(userId: string): Promise<{ weeklyUsed: number; bonusGranted: number; bonusUsed: number }> {
  const db = await getAppDB();
  const wk = weekKey();

  const [weeklyRow, bonusGrantRow, bonusUsedRow] = await Promise.all([
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM reading_usage WHERE user_id = ? AND week_key = ? AND source = 'weekly'`,
      )
      .bind(userId, wk)
      .first<{ n: number }>(),
    db
      .prepare(`SELECT COALESCE(SUM(granted), 0) AS n FROM user_bonus WHERE user_id = ?`)
      .bind(userId)
      .first<{ n: number }>(),
    db
      .prepare(`SELECT COUNT(*) AS n FROM reading_usage WHERE user_id = ? AND source = 'bonus'`)
      .bind(userId)
      .first<{ n: number }>(),
  ]);

  return {
    weeklyUsed: Number(weeklyRow?.n ?? 0),
    bonusGranted: Number(bonusGrantRow?.n ?? 0),
    bonusUsed: Number(bonusUsedRow?.n ?? 0),
  };
}

export async function getEntitlement(v: Viewer): Promise<Entitlement> {
  if (v.kind === "guest") {
    const used = Math.max(0, v.guestUsed);
    const remaining = Math.max(0, GUEST_LIMIT - used);
    return {
      kind: "guest",
      canStartReading: remaining > 0,
      canChat: false,
      remaining,
      limit: GUEST_LIMIT,
      weeklyRemaining: 0,
      bonusRemaining: 0,
      resetAt: null,
      reason: remaining > 0 ? undefined : "guest_used",
    };
  }

  const { weeklyUsed, bonusGranted, bonusUsed } = await memberUsage(v.userId);
  const weeklyRemaining = Math.max(0, WEEKLY_LIMIT - weeklyUsed);
  const bonusRemaining = Math.max(0, bonusGranted - bonusUsed);
  const remaining = weeklyRemaining + bonusRemaining;

  return {
    kind: "member",
    canStartReading: remaining > 0,
    canChat: true,
    remaining,
    limit: WEEKLY_LIMIT,
    weeklyRemaining,
    bonusRemaining,
    resetAt: nextResetAt(),
    reason: remaining > 0 ? undefined : "weekly_exhausted",
  };
}

/**
 * หักสิทธิ์การเปิดไพ่ 1 ครั้ง — คืน false ถ้าหักไม่ได้ (สิทธิ์หมด)
 * กันหักซ้ำด้วย UNIQUE(reading_id): กดรัว/รีทราย/สองแท็บ ก็หักครั้งเดียว
 */
export async function consumeReading(v: Viewer, readingId: string): Promise<boolean> {
  if (v.kind === "guest") {
    // การนับจริงของผู้เยี่ยมชมอยู่ที่คุกกี้ (PR C) — ที่นี่แค่ตรวจว่ายังมีสิทธิ์
    return v.guestUsed < GUEST_LIMIT;
  }

  const db = await getAppDB();

  // fast path: เคยหัก reading นี้แล้ว → ผ่าน ไม่ทำอะไรต่อ (ลด noise จากการกดรัว/รีทราย)
  // UNIQUE(reading_id) ยังเป็นตัวกันจริงสำหรับ race ที่สอดแทรกระหว่าง check นี้กับ insert
  const already = await db
    .prepare(`SELECT 1 AS x FROM reading_usage WHERE reading_id = ? LIMIT 1`)
    .bind(readingId)
    .first<{ x: number }>()
    .catch(() => null);
  if (already) return true;

  const ent = await getEntitlement(v);
  if (!ent.canStartReading) return false;

  // ใช้โควตารายสัปดาห์ก่อน เก็บโบนัสไว้ให้นานที่สุด
  const source = ent.weeklyRemaining > 0 ? "weekly" : "bonus";

  try {
    await db
      .prepare(
        `INSERT INTO reading_usage (id, user_id, reading_id, week_key, source, consumed_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(`ru_${crypto.randomUUID()}`, v.userId, readingId, weekKey(), source, Date.now())
      .run();
    return true;
  } catch {
    // ชน UNIQUE(reading_id) = เคยหักไปแล้ว → ถือว่าผ่าน ไม่หักซ้ำ
    return true;
  }
}

/**
 * คืนสิทธิ์เมื่อ AI ล้มเหลว — ต้องเรียกทุกเส้นทางที่ error ใน read route
 * ปลอดภัยเมื่อไม่มีแถว (ผู้เยี่ยมชม หรือหักไม่สำเร็จ) — เป็น no-op
 */
export async function refundReading(readingId: string): Promise<void> {
  try {
    const db = await getAppDB();
    await db.prepare(`DELETE FROM reading_usage WHERE reading_id = ?`).bind(readingId).run();
  } catch {
    // best-effort
  }
}

/**
 * ให้โบนัสก้อนแก่ผู้ใช้ — idempotent ต่อ reason (ให้ซ้ำเหตุผลเดิมไม่ได้)
 */
export async function grantBonus(userId: string, n: number, reason: string): Promise<void> {
  if (!userId || n <= 0) return;
  try {
    const db = await getAppDB();
    await db
      .prepare(
        `INSERT INTO user_bonus (id, user_id, granted, reason, granted_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(user_id, reason) DO NOTHING`,
      )
      .bind(`ub_${crypto.randomUUID()}`, userId, Math.floor(n), reason, Date.now())
      .run();
  } catch (err) {
    console.error("[entitlement] grantBonus failed:", err);
  }
}

/** ให้โบนัสสมัครใหม่ — เรียกครั้งเดียวตอนสร้างผู้ใช้ (idempotent ปลอดภัยถ้าเรียกซ้ำ) */
export async function grantSignupBonus(userId: string): Promise<void> {
  await grantBonus(userId, SIGNUP_BONUS, "signup");
}

/** ลบข้อมูลสิทธิ์ทั้งหมดของผู้ใช้ (เรียกจาก softDeleteUser — PDPA) */
export async function purgeEntitlementData(userId: string): Promise<void> {
  const db = await getAppDB();
  await db.prepare(`DELETE FROM reading_usage WHERE user_id = ?`).bind(userId).run();
  await db.prepare(`DELETE FROM user_bonus WHERE user_id = ?`).bind(userId).run();
}
