import { getAppDB } from "@/lib/platform/db";
import { dayKey, nextResetAt, weekKey } from "@/lib/entitlement/week";
import { getDailyStreak, isDailyFreeReadingUsed, recordDailyReading, todayDateKey } from "@/lib/entitlement/daily";
import { DAILY_LIMIT, GUEST_LIMIT, SIGNUP_BONUS } from "@/lib/entitlement/limits";
import { recordEvent } from "@/lib/stats/record";

/**
 * นโยบายเมื่อ **ฐานข้อมูลสิทธิ์ล่ม** (ตารางหาย / D1 throttle / schema ไม่ตรง)
 *
 * ต้องเป็นการตัดสินใจที่เขียนไว้ชัด ๆ ตรงนี้ ไม่ใช่ผลพลอยได้ของ `try/catch`
 * (บทเรียน: ENTITLEMENT_PLAN §11 — ของเดิม `catch { return true }` เหมาว่า error
 *  ทุกชนิดคือการชน UNIQUE ทำให้ error จริงกลายเป็น "เปิดไพ่ฟรี" แบบไม่มีร่องรอย)
 *
 * - `"allow"` — ปล่อยให้เปิดไพ่ต่อไปโดยไม่หักสิทธิ์
 * - `"deny"`  — ปิดกั้นไว้ก่อน
 *
 * **เลือก `"allow"` เพราะ:** ต้นทุนถูกคุมด้วย `AI_DAILY_CALL_CAP` ซึ่งเป็นเพดานแยก
 * ที่ทำงานอยู่แล้ว ความเสียหายด้านเงินจึงมีขอบเขตจำกัดอยู่ดี · ขณะที่การ `deny`
 * จะบล็อก **เฉพาะสมาชิก** (ผู้เยี่ยมชมนับด้วยคุกกี้ ไม่แตะ D1) ซึ่งคือคนที่สมัครแล้ว
 * — ลงโทษผู้ใช้ที่ดีที่สุดเพราะระบบเราเองพัง
 *
 * เปลี่ยนเป็น `"deny"` ได้ด้วยการแก้บรรทัดเดียว ถ้าวันหนึ่งต้นทุนสำคัญกว่าประสบการณ์ผู้ใช้
 */
const DB_FAILURE_POLICY: "allow" | "deny" = "allow";

/** true เฉพาะเมื่อ error คือการชน UNIQUE/constraint จริง ๆ (= เคยหักสิทธิ์ไปแล้ว) */
function isUniqueViolation(e: unknown): boolean {
  const msg = String((e as { message?: unknown })?.message ?? e ?? "");
  return /unique|constraint/i.test(msg);
}

/** true เมื่อ error คือ "ตารางไม่มีอยู่" — เคสเดียวที่ซ่อมตัวเองได้ */
function isMissingTable(e: unknown): boolean {
  const msg = String((e as { message?: unknown })?.message ?? e ?? "");
  return /no such table|no such column|does not exist/i.test(msg);
}

/**
 * ซ่อมตัวเองเมื่อตารางสิทธิ์หาย — สร้างตารางจาก DDL ชุดเดียวกับปุ่มในแอดมิน
 *
 * ทำไมต้องมี: `deploy.yml` รัน migrations ให้อยู่แล้ว แต่ยังมีทางที่ตารางหายได้
 * (สร้าง D1 ใหม่ · สลับฐานข้อมูล · migration ล้มเงียบ) และเป็นความล้มเหลวแบบ
 * **ค้างยาว** ไม่หายเอง — ต่างจาก D1 ล่มชั่วคราวที่เดี๋ยวก็กลับมา
 * ถ้าไม่ซ่อม ระบบจะปล่อยให้เปิดไพ่ฟรีไปเรื่อย ๆ จนกว่าจะมีคนสังเกตเห็น metric
 *
 * กันยิงรัว: ลองแค่ครั้งเดียวต่อ isolate · DDL เป็น `IF NOT EXISTS` ทั้งหมด
 * จึงปลอดภัยแม้หลาย isolate ยิงพร้อมกัน
 */
let selfHealAttempted = false;

async function trySelfHeal(): Promise<boolean> {
  if (selfHealAttempted) return false;
  selfHealAttempted = true;
  try {
    const { ensureEntitlementSchema } = await import("@/lib/entitlement/schema");
    await ensureEntitlementSchema();
    recordEvent("entitlement_db_selfheal");
    console.warn("[entitlement] ตารางหาย — สร้างใหม่อัตโนมัติสำเร็จ");
    return true;
  } catch (e) {
    recordEvent("entitlement_db_selfheal_failed");
    console.error("[entitlement] ซ่อมตารางอัตโนมัติไม่สำเร็จ", e);
    return false;
  }
}

/**
 * บันทึกว่าฐานข้อมูลสิทธิ์ล่ม แล้วคืนค่าตามนโยบาย
 * metric `entitlement_db_error` โผล่ในการ์ด "สถิติระบบสิทธิ์" ของ `/admin`
 * — ถ้าเห็นตัวเลขนี้ขึ้น แปลว่าโควตาไม่ได้ถูกบังคับจริงในช่วงนั้น ต้องรีบดู
 */
function onDbFailure(where: string, e: unknown): boolean {
  recordEvent("entitlement_db_error");
  console.error(`[entitlement] DB ล่มที่ ${where} — ใช้นโยบาย ${DB_FAILURE_POLICY}`, e);
  return DB_FAILURE_POLICY === "allow";
}

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
      // ⚠️ `week_key` ของแถวยุคปัจจุบันเก็บ "วันไทยของวันที่เปิดไพ่" ไม่ใช่วันจันทร์ต้นสัปดาห์
      // (ดู consumeReading ที่ bind `dk`) — ชื่อคอลัมน์เป็นมรดกจากยุคโควตารายสัปดาห์
      // เงื่อนไขเดิมเขียนว่า `(week_key = dk OR (week_key = wk AND source = 'daily'))`
      // ซึ่งพังทุกวันจันทร์: วันจันทร์ dk == wk แถวที่เปิดวันจันทร์จึงติดเงื่อนไขที่สอง
      // ไปตลอดทั้งสัปดาห์ ทำให้สมาชิกที่ใช้โควตาวันจันทร์หมด ถูกล็อกยาวถึงวันอาทิตย์
      // แถวมรดกจริง ๆ ใช้ source = 'weekly' (ดู migrations/0007) ไม่ใช่ 'daily'
      .prepare(
        `SELECT COUNT(*) AS n FROM reading_usage
          WHERE user_id = ?
            AND (
              (source = 'weekly' AND week_key = ?)
              OR (source NOT IN ('weekly', 'bonus') AND week_key = ?)
            )`,
      )
      .bind(userId, wk, dk)
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

  // D1 ล่มตรงนี้ = อ่านยอดใช้ไม่ได้ · ของเดิม throw ทะลุไปทำให้ `/api/entitlement`
  // ตอบ 500 แล้ว QuotaBadge/หน้าเว็บพังทั้งหน้า — ให้ degrade ตามนโยบายแทน
  let usage: Awaited<ReturnType<typeof memberUsage>>;
  try {
    usage = await memberUsage(v.userId);
  } catch (firstErr) {
    // ตารางหาย → สร้างแล้วอ่านใหม่ · ตารางเพิ่งสร้างจะว่างเปล่า = ยอดใช้ 0 ซึ่งถูกต้อง
    if (isMissingTable(firstErr) && (await trySelfHeal())) {
      try {
        usage = await memberUsage(v.userId);
        const { dailyUsed: u2, bonusGranted: bg2, bonusUsed: bu2, paidGranted: pg2 } = usage;
        return buildMemberEntitlement(u2, bg2, bu2, pg2, dailyFreeAvailable, dailyStreak);
      } catch {
        /* ซ่อมแล้วยังอ่านไม่ได้ → ตกไปใช้ค่า degrade ด้านล่าง */
      }
    }
    const allow = onDbFailure("getEntitlement/memberUsage", firstErr);
    return {
      kind: "member",
      canStartReading: allow,
      canChat: true,
      remaining: allow ? DAILY_LIMIT : 0,
      limit: DAILY_LIMIT,
      dailyRemaining: allow ? DAILY_LIMIT : 0,
      weeklyRemaining: allow ? DAILY_LIMIT : 0,
      bonusRemaining: 0,
      hasPaidCredits: false,
      resetAt: nextResetAt(),
      dailyFreeAvailable,
      dailyStreak,
      reason: allow ? undefined : "daily_exhausted",
    };
  }
  const { dailyUsed: usedToday, bonusGranted, bonusUsed, paidGranted } = usage;
  return buildMemberEntitlement(usedToday, bonusGranted, bonusUsed, paidGranted, dailyFreeAvailable, dailyStreak);
}

/** ประกอบสิทธิ์ของสมาชิกจากยอดที่อ่านมา — แยกไว้เพราะเรียกจาก 2 ทาง (ปกติ / หลังซ่อมตาราง) */
function buildMemberEntitlement(
  usedToday: number,
  bonusGranted: number,
  bonusUsed: number,
  paidGranted: number,
  dailyFreeAvailable: boolean,
  dailyStreak: number,
): Entitlement {
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

  // อ่านยอดคงเหลือ — ถ้า D1 ล่มตรงนี้ ของเดิมจะ throw ทะลุออกไปเป็น 500
  let ent: Entitlement;
  try {
    ent = await getEntitlement(v);
  } catch (e) {
    return onDbFailure("consumeReading/getEntitlement", e);
  }
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
  } catch (e) {
    // แยกให้ชัด: ชน UNIQUE(reading_id) = เคยหักไปแล้วจริง ๆ → ผ่าน ไม่หักซ้ำ
    if (isUniqueViolation(e)) return true;

    // ตารางหาย = ซ่อมได้ → สร้างตารางแล้วหักใหม่อีกครั้งเดียว
    // (ถ้าสำเร็จ ผู้ใช้ถูกหักสิทธิ์ถูกต้องตามจริง ไม่ได้ของฟรีเพราะระบบพัง)
    if (isMissingTable(e) && (await trySelfHeal())) {
      try {
        await db
          .prepare(
            `INSERT INTO reading_usage (id, user_id, reading_id, week_key, source, consumed_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
          )
          .bind(`ru_${crypto.randomUUID()}`, v.userId, readingId, dk, source, Date.now())
          .run();
        return true;
      } catch (retryErr) {
        if (isUniqueViolation(retryErr)) return true;
        return onDbFailure("consumeReading/insert-after-heal", retryErr);
      }
    }

    // error อื่น (throttle / schema drift) = โควตาไม่ได้ถูกบันทึก
    // ห้ามกลืนเงียบเหมือนของเดิม — ยิง metric แล้วตัดสินตามนโยบายที่ประกาศไว้
    return onDbFailure("consumeReading/insert", e);
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
  } catch (e) {
    // คืนสิทธิ์ไม่สำเร็จ = ผู้ใช้เสียสิทธิ์ทั้งที่ระบบเราพัง — ห้ามเงียบ
    // ไม่ throw ต่อ เพราะจุดเรียกอยู่ใน error path ของ stream อยู่แล้ว
    // (throw ซ้ำจะกลบ error ต้นทางที่สำคัญกว่า) แต่ต้องมี metric ให้เห็น
    recordEvent("entitlement_refund_failed");
    console.error("[entitlement] คืนสิทธิ์ไม่สำเร็จ", { readingId }, e);
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

/**
 * ให้โบนัสสมัครใหม่ — เรียกครั้งเดียวตอนสร้างผู้ใช้ (idempotent ปลอดภัยถ้าเรียกซ้ำ)
 * ปัจจุบัน `SIGNUP_BONUS = 0` (ไม่ทำระบบโบนัสแจกฟรี) ฟังก์ชันนี้จึงไม่ทำอะไร
 * แต่คงไว้เพื่อไม่ให้จุดเรียกใช้ทั่วระบบพัง และเปิดกลับได้ทันทีถ้าเจ้าของเปลี่ยนใจ
 */
export async function grantSignupBonus(userId: string): Promise<void> {
  if (SIGNUP_BONUS <= 0) return;
  await grantBonus(userId, SIGNUP_BONUS, "signup");
}

/** ลบข้อมูลสิทธิ์ทั้งหมดของผู้ใช้ (เรียกจาก softDeleteUser — PDPA) */
export async function purgeEntitlementData(userId: string): Promise<void> {
  const db = await getAppDB();
  await db.prepare(`DELETE FROM reading_usage WHERE user_id = ?`).bind(userId).run();
  await db.prepare(`DELETE FROM user_bonus WHERE user_id = ?`).bind(userId).run();
}
