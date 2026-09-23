import { getAppDB } from "@/lib/platform/db";
import { nextResetAt, weekKey } from "@/lib/entitlement/week";
import { getDailyStreak, isDailyFreeReadingUsed, recordDailyReading, todayDateKey } from "@/lib/entitlement/daily";
import { DAILY_LIMIT, GUEST_BLOCK_REASON, GUEST_LIMIT, SIGNUP_BONUS } from "@/lib/entitlement/limits";
import { recordEvent } from "@/lib/stats/record";
import { bumpCounter, readCounter } from "@/lib/platform/kv-counter";

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

/**
 * ผลของการหักสิทธิ์ — ต้องแยก "คำขอนี้เป็นคนหัก" ออกจาก "หักไปแล้วก่อนหน้านี้"
 * ให้ชัด ไม่งั้นการคืนสิทธิ์จะไปลบแถวของคำขออื่นทิ้ง (T-02)
 */
export type ConsumeOutcome =
  /** คำขอนี้สร้างแถวเอง — `usageId` คือแถวเดียวที่คำขอนี้มีสิทธิ์คืน */
  | { status: "inserted"; usageId: string }
  /** มีแถวอยู่ก่อนแล้ว (ยิงซ้ำ) หรือ DB ล่มแล้วปล่อยผ่าน — ห้ามคืนสิทธิ์ */
  | { status: "already" }
  /** ผู้เยี่ยมชมที่ยังมีสิทธิ์ — นับที่คุกกี้ ไม่มีแถวใน DB */
  | { status: "guest-allowed" }
  /** สิทธิ์ไม่พอ */
  | { status: "denied" };

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
 * เพดานของนโยบาย "ปล่อยผ่านเมื่อ DB ล่ม" (T-08)
 * ---------------------------------------------------------------------------
 * นโยบาย `allow` ตั้งใจให้ผู้ใช้ที่ดีไม่ถูกลงโทษเพราะระบบเราพัง แต่ของเดิม
 * **ไม่มีเพดานของตัวเอง** — D1 ถูก throttle เมื่อไหร่ สมาชิกทุกคนอ่านได้ไม่จำกัด
 * ตลอดช่วงนั้น เหลือเบรกแค่งบ AI รวมของทั้งเว็บ
 *
 * ตัวนับอยู่บน KV/Redis (ไม่ใช่ `Map` ต่อ isolate) จึงบังคับได้จริงข้าม edge
 * และใช้ `bumpCounter` ชุดเดียวกับโควตาอื่น ๆ จึงไม่กินโควตาเขียน KV เพิ่มอย่างมีนัย
 */
const DEGRADED_ALLOW_PER_USER_PER_DAY = 3;

function degradedKey(userId: string, day: string): string {
  return `app:entq:degraded:${day}:${userId}`;
}

/**
 * นโยบายเมื่อ `consumeReading` เขียน DB ไม่ได้
 * `allow` → ปล่อยผ่านได้ แต่ **นับ** และตัดที่เพดานเล็ก ๆ ต่อผู้ใช้ต่อวัน
 * คืน `"already"` เสมอเมื่อปล่อยผ่าน เพราะไม่มีแถวจริงให้คืนสิทธิ์
 */
async function onConsumeDbFailure(v: Viewer, where: string, e: unknown): Promise<ConsumeOutcome> {
  const allow = onDbFailure(where, e);
  if (!allow) return { status: "denied" };
  if (v.kind !== "member") return { status: "already" };

  const day = todayDateKey();
  const key = degradedKey(v.userId, day);
  const used = await readCounter(key).catch(() => 0);
  if (used >= DEGRADED_ALLOW_PER_USER_PER_DAY) {
    recordEvent("entitlement_degraded_capped");
    return { status: "denied" };
  }
  bumpCounter(key, 60 * 60 * 36);
  recordEvent("entitlement_degraded_allowed");
  return { status: "already" };
}

/**
 * แกนสิทธิ์การเปิดไพ่ — แหล่งความจริงเดียว (ENTITLEMENT_PLAN ข้อ 5)
 * ห้ามคำนวณสิทธิ์ที่อื่น · ห้ามคำนวณฝั่งเบราว์เซอร์
 *
 * ผู้เยี่ยมชม (ยังไม่สมัคร): `GUEST_LIMIT` ครั้ง — ตอนนี้ตั้งเป็น 0 = ต้องสมัคร/เข้าสู่ระบบก่อน
 * สมาชิก (สมัครแล้ว):       `DAILY_LIMIT` ครั้ง/วัน — ตอนนี้ 1 ครั้ง (ไม่ว่าจะเปิดผังใด รีเซ็ตเที่ยงคืนเวลาไทย) + โบนัสก้อน (ไม่หมดอายุ)
 */

export {
  DAILY_LIMIT,
  GUEST_BLOCK_REASON,
  REQUIRE_SIGNUP_TO_READ,
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
  reason?: "signup_required" | "guest_used" | "daily_exhausted" | "weekly_exhausted" | "members_only";
  kind: "guest" | "member";
}

/**
 * ยอดการใช้สิทธิ์ของสมาชิก — **หนึ่งรอบเดินทางไป D1 เท่านั้น**
 *
 * T-10: ของเดิมยิง `Promise.all` สี่คำสั่งแยกกัน = สี่รอบเดินทางต่อการเช็คโควตาหนึ่งครั้ง
 * และฟังก์ชันนี้ถูกเรียกแทบทุกการโหลดหน้า · `db.batch()` ส่งทั้งชุดไปรอบเดียว
 * (ถ้าไดรเวอร์ไหนไม่มี `batch` จะถอยไปใช้ `Promise.all` แบบเดิมอัตโนมัติ)
 */
async function memberUsage(userId: string): Promise<{ dailyUsed: number; bonusGranted: number; bonusUsed: number; paidGranted: number }> {
  const db = await getAppDB();
  const dk = todayDateKey();
  const wk = weekKey();

  const statements = [
    // ⚠️ `week_key` ของแถวยุคปัจจุบันเก็บ "วันไทยของวันที่เปิดไพ่" ไม่ใช่วันจันทร์ต้นสัปดาห์
    // (ดู consumeReading ที่ bind `dk`) — ชื่อคอลัมน์เป็นมรดกจากยุคโควตารายสัปดาห์
    // เงื่อนไขเดิมเขียนว่า `(week_key = dk OR (week_key = wk AND source = 'daily'))`
    // ซึ่งพังทุกวันจันทร์: วันจันทร์ dk == wk แถวที่เปิดวันจันทร์จึงติดเงื่อนไขที่สอง
    // ไปตลอดทั้งสัปดาห์ ทำให้สมาชิกที่ใช้โควตาวันจันทร์หมด ถูกล็อกยาวถึงวันอาทิตย์
    // แถวมรดกจริง ๆ ใช้ source = 'weekly' (ดู migrations/0007) ไม่ใช่ 'daily'
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM reading_usage
          WHERE user_id = ?
            AND (
              (source = 'weekly' AND week_key = ?)
              OR (source NOT IN ('weekly', 'bonus') AND week_key = ?)
            )`,
      )
      .bind(userId, wk, dk),
    db.prepare(`SELECT COALESCE(SUM(granted), 0) AS n FROM user_bonus WHERE user_id = ?`).bind(userId),
    db.prepare(`SELECT COUNT(*) AS n FROM reading_usage WHERE user_id = ? AND source = 'bonus'`).bind(userId),
    db
      .prepare(`SELECT COALESCE(SUM(granted), 0) AS n FROM user_bonus WHERE user_id = ? AND reason LIKE 'purchase_%'`)
      .bind(userId),
  ];

  const readOneByOne = async (): Promise<number[]> => {
    const rows = await Promise.all(statements.map((st) => st.first<{ n: number }>()));
    return rows.map((r) => Number(r?.n ?? 0));
  };

  const batch = (db as { batch?: (s: unknown[]) => Promise<Array<{ results?: Array<{ n?: number }> }>> }).batch;
  let counts: number[] | null = null;

  if (typeof batch === "function") {
    try {
      const rows = await batch.call(db, statements);
      const parsed = rows.map((r) => Number(r?.results?.[0]?.n));
      // ⚠️ ห้ามยอมรับผลที่อ่านไม่ออก — ถ้ารูปร่างที่ไดรเวอร์คืนมาไม่ตรงที่คาด
      // ค่าจะกลายเป็น NaN แล้วถูกตีเป็น 0 = "ยังไม่ได้ใช้โควตาเลย" = เปิดไพ่ฟรีไม่จำกัด
      // เจอแบบนั้นให้ถอยไปอ่านทีละคำสั่งซึ่งพิสูจน์แล้วว่าถูกต้อง ไม่ใช่เดาเป็นศูนย์
      if (parsed.length === statements.length && parsed.every((n) => Number.isFinite(n))) {
        counts = parsed;
      } else {
        recordEvent("entitlement_batch_shape_unexpected");
      }
    } catch (e) {
      recordEvent("entitlement_batch_failed");
      console.warn("[entitlement] db.batch ใช้ไม่ได้ — ถอยไปอ่านทีละคำสั่ง", e);
    }
  }

  if (!counts) counts = await readOneByOne();

  return {
    dailyUsed: counts[0] ?? 0,
    bonusGranted: counts[1] ?? 0,
    bonusUsed: counts[2] ?? 0,
    paidGranted: counts[3] ?? 0,
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
      // `signup_required` เมื่อเว็บบังคับสมัครก่อนเล่น · `guest_used` เมื่อเคยมีสิทธิ์ทดลองแล้วใช้ครบ
      reason: remaining > 0 ? undefined : GUEST_BLOCK_REASON,
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
 * - สมาชิก: ได้ `DAILY_LIMIT` ครั้งต่อวัน — ตอนนี้ 1 ครั้ง (ตัดตามวันไทย) + ใช้โควตาโบนัสเมื่อโควตารายวันหมด
 * - กันหักซ้ำด้วย UNIQUE(reading_id): กดรัว/รีทราย/สองแท็บ ก็หักครั้งเดียว
 */
export async function consumeReading(
  v: Viewer,
  readingId: string,
  spreadId?: string
): Promise<ConsumeOutcome> {
  const outcome = await consumeReadingInner(v, readingId);
  /*
   * บันทึก streak ของผัง daily **หลัง** รู้ผลการหักสิทธิ์เท่านั้น (A1-13)
   * เดิมบันทึกก่อนตรวจโควตา โดนปฏิเสธ (403) ก็ยังได้ streak +1 · AI ล่มแล้วคืนสิทธิ์ก็ได้ streak ฟรี
   * (การคืนสิทธิ์ลบแถว streak ของรอบนั้นด้วย — ดู refundReading)
   */
  if (spreadId === "daily" && outcome.status !== "denied") {
    const userKey = v.kind === "member" ? v.userId : `guest_${v.gid}`;
    await recordDailyReading(userKey, readingId).catch(() => {});
  }
  return outcome;
}

async function consumeReadingInner(v: Viewer, readingId: string): Promise<ConsumeOutcome> {
  if (v.kind === "guest") {
    // การนับจริงของผู้เยี่ยมชมอยู่ที่คุกกี้ (PR C) — ที่นี่แค่ตรวจว่ายังมีสิทธิ์
    // ไม่มีแถวใน DB ให้คืน จึงไม่ใช่ "inserted" ที่ refund ได้
    return v.guestUsed < GUEST_LIMIT ? { status: "guest-allowed" } : { status: "denied" };
  }

  const db = await getAppDB();

  // ── fast path: เคยหัก reading นี้แล้ว ──────────────────────────────────────
  // 🔴 บทเรียน T-02: เดิมคืน `true` เหมือนกรณีที่หักสำเร็จ ผู้เรียกจึงตั้ง `consumed = true`
  // ทั้งที่คำขอนี้ไม่ได้ insert อะไรเลย พอสตรีมถูกตัดกลางคัน `finally` เรียกคืนสิทธิ์
  // แล้วลบ**แถวค่าใช้จ่ายของครั้งแรก**ทิ้ง = เปิดไพ่ฟรีไม่จำกัด
  // "หักไปแล้ว" กับ "คำขอนี้เป็นคนหัก" ต้องเป็นคนละสถานะเสมอ
  const already = await db
    .prepare(`SELECT 1 AS x FROM reading_usage WHERE reading_id = ? LIMIT 1`)
    .bind(readingId)
    .first<{ x: number }>()
    .catch(() => null);
  if (already) return { status: "already" };

  const now = Date.now();
  const dk = todayDateKey();
  const wk = weekKey();

  // id ของแถวที่ **คำขอนี้** สร้าง — ใช้ผูกกับการคืนสิทธิ์ ไม่ให้ไปลบแถวของคำขออื่น
  const usageId = `ru_${crypto.randomUUID()}`;

  const doConditionalInsert = async (): Promise<ConsumeOutcome> => {
    // ── ชั้นที่ 1: โควตารายวัน (`DAILY_LIMIT` ครั้ง/วัน) ──
    // เงื่อนไขนับต้องตรงกับ memberUsage() เป๊ะ ๆ (ป้องกันปัญหาข้ามวันจันทร์ตาม INC-0074)
    const daily = await db
      .prepare(
        `INSERT INTO reading_usage (id, user_id, reading_id, week_key, source, consumed_at)
         SELECT ?, ?, ?, ?, 'daily', ?
          WHERE (
            SELECT COUNT(*) FROM reading_usage
             WHERE user_id = ?
               AND (
                 (source = 'weekly' AND week_key = ?)
                 OR (source NOT IN ('weekly', 'bonus') AND week_key = ?)
               )
          ) < ?`
      )
      .bind(usageId, v.userId, readingId, dk, now, v.userId, wk, dk, DAILY_LIMIT)
      .run();

    if ((daily.meta?.changes ?? 0) > 0) return { status: "inserted", usageId };

    // ── ชั้นที่ 2: โควตาโบนัส/ที่ซื้อมา ──
    const bonus = await db
      .prepare(
        `INSERT INTO reading_usage (id, user_id, reading_id, week_key, source, consumed_at)
         SELECT ?, ?, ?, ?, 'bonus', ?
          WHERE (SELECT COALESCE(SUM(granted), 0) FROM user_bonus WHERE user_id = ?)
              > (SELECT COUNT(*) FROM reading_usage WHERE user_id = ? AND source = 'bonus')`
      )
      .bind(usageId, v.userId, readingId, dk, now, v.userId, v.userId)
      .run();

    return (bonus.meta?.changes ?? 0) > 0 ? { status: "inserted", usageId } : { status: "denied" };
  };

  try {
    return await doConditionalInsert();
  } catch (e) {
    // แยกให้ชัด: ชน UNIQUE(reading_id) = เคยหักไปแล้วจริง ๆ → ผ่าน ไม่หักซ้ำ
    // และ **ไม่ใช่** "inserted" — คำขอนี้ไม่ได้เป็นคนสร้างแถว จึงไม่มีสิทธิ์ลบมันทิ้ง
    if (isUniqueViolation(e)) return { status: "already" };

    // ตารางหาย = ซ่อมได้ → สร้างตารางแล้วหักใหม่อีกครั้งเดียว
    // (ถ้าสำเร็จ ผู้ใช้ถูกหักสิทธิ์ถูกต้องตามจริง ไม่ได้ของฟรีเพราะระบบพัง)
    if (isMissingTable(e) && (await trySelfHeal())) {
      try {
        return await doConditionalInsert();
      } catch (retryErr) {
        if (isUniqueViolation(retryErr)) return { status: "already" };
        return await onConsumeDbFailure(v, "consumeReading/insert-after-heal", retryErr);
      }
    }

    // error อื่น (throttle / schema drift) = โควตาไม่ได้ถูกบันทึก
    // ห้ามกลืนเงียบเหมือนของเดิม — ยิง metric แล้วตัดสินตามนโยบายที่ประกาศไว้
    return await onConsumeDbFailure(v, "consumeReading/insert", e);
  }
}

/**
 * คืนสิทธิ์เมื่อ AI ล้มเหลว — ต้องเรียกทุกเส้นทางที่ error ใน read route
 * ปลอดภัยเมื่อไม่มีแถว (ผู้เยี่ยมชม หรือหักไม่สำเร็จ) — เป็น no-op
 *
 * 🔴 `usageId` **บังคับ** และต้องเป็น id ที่ `consumeReading()` คืนมาพร้อม
 * `status === "inserted"` ของคำขอนี้เท่านั้น — ไม่ใช่ `WHERE reading_id = ?` ลอย ๆ
 * แบบเดิมที่ทำให้คำขอที่สองลบแถวค่าใช้จ่ายของคำขอแรกทิ้งได้ (T-02)
 */
export async function refundReading(readingId: string, usageId: string): Promise<void> {
  if (!usageId) return;
  try {
    const db = await getAppDB();
    await db
      .prepare(`DELETE FROM reading_usage WHERE reading_id = ? AND id = ?`)
      .bind(readingId, usageId)
      .run();
    // คืนสิทธิ์ = รอบนี้ไม่นับ ➔ ไม่นับ streak ของรอบนี้ด้วย (A1-13)
    await db.prepare(`DELETE FROM daily_readings WHERE reading_id = ?`).bind(readingId).run();
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
 *
 * 🔴 บทเรียน T-04: ของเดิมคืน `void` และกลืน error ทุกตัวด้วย `catch { console.error }`
 * เส้นทางยืนยันการจ่ายเงินจึงตอบ `{ ok: true }` ให้ผู้ใช้ทั้งที่เครดิตไม่เคยลงฐานข้อมูล
 * ไม่มี ticket ไม่มี metric ไม่มีคิวลองใหม่ — เงินเข้าแต่ของไม่ถึงมือโดยไม่มีใครรู้
 *
 * ตอนนี้คืน `true` เฉพาะเมื่อ **อ่านกลับมาเจอแถวจริง** (แบบเดียวกับที่ `redeem.ts` ทำอยู่)
 * แถวที่มีอยู่แล้วจาก reason เดิมก็นับว่าสำเร็จ เพราะ idempotent คือพฤติกรรมที่ตั้งใจ
 */
export async function grantBonus(userId: string, n: number, reason: string): Promise<boolean> {
  if (!userId || n <= 0) return false;
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

    // อ่านกลับมายืนยันว่าแถวลงจริง — `run()` สำเร็จไม่ได้แปลว่าข้อมูลอยู่ในฐาน
    const row = await db
      .prepare(`SELECT granted FROM user_bonus WHERE user_id = ? AND reason = ? LIMIT 1`)
      .bind(userId, reason)
      .first<{ granted: number }>();

    if (!row) {
      recordEvent("entitlement_grant_missing_after_insert");
      console.error("[entitlement] grantBonus: insert ผ่านแต่ไม่พบแถว", { userId, reason });
      return false;
    }
    return true;
  } catch (err) {
    recordEvent("entitlement_grant_failed");
    console.error("[entitlement] grantBonus failed:", err);
    return false;
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
