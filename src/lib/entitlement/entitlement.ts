import { getAppDB } from "@/lib/platform/db";
import { dayKey, nextResetAt, weekKey } from "@/lib/entitlement/week";
import { getDailyStreak, isDailyFreeReadingUsed, recordDailyReading, todayDateKey } from "@/lib/entitlement/daily";
import { DAILY_LIMIT, GUEST_LIMIT, SIGNUP_BONUS } from "@/lib/entitlement/limits";

/**
 * แกนสิทธิ์การเปิดไพ่ — แหล่งความจริงเดียว (ENTITLEMENT_PLAN ข้อ 5)
 * ห้ามคำนวณสิทธิ์ที่อื่น · ห้ามคำนวณฝั่งเบราว์เซอร์
 *
 * ผู้เยี่ยมชม (ยังไม่สมัคร): 1 ครั้ง เท่านั้น (ไม่ว่าจะเปิดผังใด)
 * สมาชิก (สมัครแล้ว):       3 ครั้ง/วัน (ไม่ว่าจะเปิดผังใด รีเซ็ตเที่ยงคืนเวลาไทย) + โบนัสก้อน (ไม่หมดอายุ)
 */

export {
  DAILY_LIMIT,
  WEEKLY_LIMIT,
  GUEST_LIMIT,
  SIGNUP_BONUS,
  GRANDFATHER_BONUS,
} from "@/lib/entitlement/limits";

export type Viewer =
  | { kind: "guest"; gid: string; guestUsed: number }
  | { kind: "member"; userId: string };

export interface Entitlement {
  canStartReading: boolean;
  canChat: boolean;
  /** สิทธิ์เปิดไพ่ที่เหลือทั้งหมด (รายวัน + โบนัส สำหรับสมาชิก / GUEST_LIMIT - used สำหรับผู้เยี่ยมชม) */
  remaining: number;
  /** เพดานต่อรอบ — ใช้แสดง "เหลือ x/limit" */
  limit: number;
  /** สมาชิกเท่านั้น (โควตารายวันคงเหลือ) */
  dailyRemaining: number;
  /** สมาชิกเท่านั้น (backward compat) */
  weeklyRemaining: number;
  /** สมาชิกเท่านั้น */
  bonusRemaining: number;
  /**
   * ผู้ใช้มีสิทธิ์จากการซื้อ (purchase_*) ที่ยังเหลือรอบอยู่หรือไม่
   * ใช้แยกจาก bonusRemaining ซึ่งรวมโบนัสฟรี (signup/grandfather) ด้วย
   * เฉพาะค่า true เท่านั้นที่ปลดล็อกผังใหญ่ + ปรมาจารย์ลับ
   */
  hasPaidCredits: boolean;
  /** ISO string เวลาโควตารายวันรีเซ็ต (null สำหรับผู้เยี่ยมชม) */
  resetAt: string | null;
  /** ไพ่ประจำวันฟรีของวันนี้ยังใช้ได้หรือไม่ */
  dailyFreeAvailable: boolean;
  /** จำนวนวันที่เปิดไพ่ประจำวันต่อเนื่อง */
  dailyStreak: number;
  reason?: "guest_used" | "daily_exhausted" | "weekly_exhausted" | "members_only";
  kind: "guest" | "member";
}

async function memberUsage(userId: string): Promise<{ dailyUsed: number; bonusGranted: number; bonusUsed: number; paidGranted: number }> {
  const db = await getAppDB();
  const dk = todayDateKey();
  const wk = weekKey();

  const [dailyRow, bonusGrantRow, bonusUsedRow, paidGrantRow] = await Promise.all([
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM reading_usage WHERE user_id = ? AND (week_key = ? OR (week_key = ? AND source = 'daily')) AND source != 'bonus'`,
      )
      .bind(userId, dk, wk)
      .first<{ n: number }>(),
    db
      .prepare(`SELECT COALESCE(SUM(granted), 0) AS n FROM user_bonus WHERE user_id = ?`)
      .bind(userId)
      .first<{ n: number }>(),
    db
      .prepare(`SELECT COUNT(*) AS n FROM reading_usage WHERE user_id = ? AND source = 'bonus'`)
      .bind(userId)
      .first<{ n: number }>(),
    db
      .prepare(`SELECT COALESCE(SUM(granted), 0) AS n FROM user_bonus WHERE user_id = ? AND reason LIKE 'purchase_%'`)
      .bind(userId)
      .first<{ n: number }>(),
  ]);

  return {
    dailyUsed: Number(dailyRow?.n ?? 0),
    bonusGranted: Number(bonusGrantRow?.n ?? 0),
    bonusUsed: Number(bonusUsedRow?.n ?? 0),
    paidGranted: Number(paidGrantRow?.n ?? 0),
  };
}

export async function getEntitlement(v: Viewer): Promise<Entitlement> {
  const userKey = v.kind === "member" ? v.userId : `guest_${v.gid}`;
  const [dailyUsed, dailyStreak] = await Promise.all([
    isDailyFreeReadingUsed(userKey),
    getDailyStreak(userKey),
  ]);
  const dailyFreeAvailable = !dailyUsed;

  if (v.kind === "guest") {
    const used = Math.max(0, v.guestUsed);
    const remaining = Math.max(0, GUEST_LIMIT - used);
    return {
      kind: "guest",
      canStartReading: remaining > 0,
      canChat: false,
      remaining,
      limit: GUEST_LIMIT,
      dailyRemaining: 0,
      weeklyRemaining: 0,
      bonusRemaining: 0,
      hasPaidCredits: false,
      resetAt: null,
      dailyFreeAvailable,
      dailyStreak,
      reason: remaining > 0 ? undefined : "guest_used",
    };
  }

  const { dailyUsed: usedToday, bonusGranted, bonusUsed, paidGranted } = await memberUsage(v.userId);
  const dailyRemaining = Math.max(0, DAILY_LIMIT - usedToday);
  const bonusRemaining = Math.max(0, bonusGranted - bonusUsed);
  const remaining = dailyRemaining + bonusRemaining;
  // ผู้ใช้ถือสิทธิ์พรีเมียมก็ต่อเมื่อเคยซื้อ (purchase_*) และยอดซื้อยังไม่ถูกใช้หมด
  // bonusUsed กินจาก signup/grandfather ก่อน เหลือจึงกิน paid → ถ้า paidGranted > max(0, bonusUsed - freeGranted) แสดงว่ายังเหลือ
  const freeGranted = Math.max(0, bonusGranted - paidGranted);
  const paidRemaining = Math.max(0, paidGranted - Math.max(0, bonusUsed - freeGranted));
  const hasPaidCredits = paidRemaining > 0;

  return {
    kind: "member",
    canStartReading: remaining > 0,
    canChat: true,
    remaining,
    limit: DAILY_LIMIT,
    dailyRemaining,
    weeklyRemaining: dailyRemaining,
    bonusRemaining,
    hasPaidCredits,
    resetAt: nextResetAt(),
    dailyFreeAvailable,
    dailyStreak,
    reason: remaining > 0 ? undefined : "daily_exhausted",
  };
}

/**
 * หักสิทธิ์การเปิดไพ่ 1 ครั้ง — คืน false ถ้าหักไม่ได้ (สิทธิ์หมด)
 * - ผู้เยี่ยมชม: ได้ 1 ครั้งตลอดชีพ (นับผ่าน signed guest ticket & cookie)
 * - สมาชิก: ได้ 3 ครั้งต่อวัน (ตัดตามวันไทย) + ใช้โควตาโบนัสเมื่อโควตารายวันหมด
 * - กันหักซ้ำด้วย UNIQUE(reading_id): กดรัว/รีทราย/สองแท็บ ก็หักครั้งเดียว
 */
export async function consumeReading(
  v: Viewer,
  readingId: string,
  spreadId?: string
): Promise<boolean> {
  const userKey = v.kind === "member" ? v.userId : `guest_${v.gid}`;

  // บันทึก streak สำหรับผัง daily
  if (spreadId === "daily") {
    await recordDailyReading(userKey, readingId).catch(() => {});
  }

  if (v.kind === "guest") {
    // การนับจริงของผู้เยี่ยมชมอยู่ที่คุกกี้ (PR C) — ที่นี่แค่ตรวจว่ายังมีสิทธิ์
    return v.guestUsed < GUEST_LIMIT;
  }

  const db = await getAppDB();

  // fast path: เคยหัก reading นี้แล้ว → ผ่าน ไม่ทำอะไรต่อ
  const already = await db
    .prepare(`SELECT 1 AS x FROM reading_usage WHERE reading_id = ? LIMIT 1`)
    .bind(readingId)
    .first<{ x: number }>()
    .catch(() => null);
  if (already) return true;

  const ent = await getEntitlement(v);
  if (!ent.canStartReading && ent.remaining <= 0) return false;

  // ใช้โควตารายวันก่อน เก็บโบนัสไว้ให้นานที่สุด
  const source = ent.dailyRemaining > 0 ? "daily" : "bonus";
  const dk = todayDateKey();

  try {
    await db
      .prepare(
        `INSERT INTO reading_usage (id, user_id, reading_id, week_key, source, consumed_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(`ru_${crypto.randomUUID()}`, v.userId, readingId, dk, source, Date.now())
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
