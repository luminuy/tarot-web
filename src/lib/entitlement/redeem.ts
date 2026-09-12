import { getAppDB } from "@/lib/platform/db";
import { grantBonus } from "@/lib/entitlement/entitlement";

/**
 * ชนิดของรหัสแลกสิทธิ์ — ตัดสินจาก `reason_prefix` ของแถวในตาราง `redeem_codes`
 * ------------------------------------------------------------------------
 * - `premium` (`purchase_*`) — นับเป็น "เครดิตที่ซื้อ" ➔ `hasPaidCredits = true`
 *   ปลดล็อกผังใหญ่ + ปรมาจารย์ลับ ตราบใดที่ยังมีรอบเหลือ (ใช้กับพาร์ตเนอร์/อินฟลูฯ)
 * - `gift` (prefix อื่นทั้งหมด) — เพิ่ม "รอบเปิดไพ่" เฉย ๆ ไม่ปลดฟีเจอร์พรีเมียม
 *   ใช้กับการแจกทั่วไป/ชดเชยผู้ใช้ (ดู `getEntitlement()` ที่นับเฉพาะ `purchase_%` เป็นสิทธิ์ที่ซื้อ)
 *
 * ⚠️ ของเดิมมี prefix เดียวคือ `purchase_redeem` ทุกโค้ดที่แจกออกไปจึงทำให้ผู้รับ
 * กลายเป็น "ลูกค้าที่จ่ายเงิน" ในสายตาระบบทันที — แจกรอบฟรีไม่ได้เลยถ้าไม่แถมพรีเมียมไปด้วย
 */
export type RedeemKind = "gift" | "premium";

/** prefix มาตรฐานของแต่ละชนิด — ใช้ตอนสร้างโค้ดใหม่จากแผงแอดมิน */
export const PREMIUM_REASON_PREFIX = "purchase_redeem";
export const GIFT_REASON_PREFIX = "gift_redeem";

/** เครดิตที่ซื้อ/นับเป็นพรีเมียม คือ reason ที่ขึ้นต้น `purchase_` เท่านั้น (ตรงกับ memberUsage) */
export function redeemKindOf(reasonPrefix: string): RedeemKind {
  return reasonPrefix.trim().toLowerCase().startsWith("purchase_") ? "premium" : "gift";
}

/**
 * ล้าง `reason_prefix` ที่อ่านมาจากฐานข้อมูลให้ปลอดภัยก่อนเอาไปประกอบเป็น reason จริง
 *
 * ทำไมต้องล้าง: ค่านี้ไปโผล่ใน `user_bonus.reason` ซึ่งเป็นตัวตัดสินสิทธิ์พรีเมียมด้วย
 * `LIKE 'purchase_%'` — แถวที่พิมพ์ผิด (เว้นวรรค/ตัวพิมพ์ใหญ่/อักขระแปลก) จึงเปลี่ยนผลสิทธิ์ได้
 * **เมื่อไม่ชัวร์ให้ตกไปทาง `gift` เสมอ** (สิทธิ์น้อยที่สุด) ไม่ใช่ตกไปทางพรีเมียม
 */
export function normalizeReasonPrefix(raw: string): string {
  const cleaned = (raw ?? "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (!cleaned) return GIFT_REASON_PREFIX;
  if (cleaned.startsWith("purchase_")) return cleaned;
  return cleaned.startsWith("gift") ? cleaned : `gift_${cleaned}`;
}

export interface RedeemCodeInfo {
  code: string;
  title: string;
  credits: number;
  maxUses: number;
  usedCount: number;
  reasonPrefix: string;
  /** ชนิดของโค้ด — คำนวณจาก `reasonPrefix` ห้ามเก็บซ้ำในฐานข้อมูล */
  kind: RedeemKind;
  expiresAt: number | null;
  isActive: boolean;
}

export type RedeemResult =
  | {
      ok: true;
      code: string;
      title: string;
      credits: number;
      /** `gift` = ได้รอบเปิดไพ่เพิ่มเฉย ๆ · `premium` = ปลดผังใหญ่ + ปรมาจารย์ลับด้วย */
      kind: RedeemKind;
    }
  | {
      ok: false;
      error: string;
    };

/**
 * ตรวจสอบความถูกต้องและสถานะของรหัสแลกสิทธิ์
 */
export async function getRedeemCodeInfo(codeInput: string): Promise<RedeemCodeInfo | null> {
  const code = codeInput.trim().toUpperCase();
  if (!code) return null;

  const db = await getAppDB();
  const row = await db
    .prepare(
      `SELECT code, title, credits, max_uses, used_count, reason_prefix, expires_at, is_active
       FROM redeem_codes
       WHERE code = ? LIMIT 1`,
    )
    .bind(code)
    .first<{
      code: string;
      title: string;
      credits: number;
      max_uses: number;
      used_count: number;
      reason_prefix: string;
      expires_at: number | null;
      is_active: number;
    }>();

  if (!row) return null;

  const reasonPrefix = normalizeReasonPrefix(row.reason_prefix);

  return {
    code: row.code,
    title: row.title,
    credits: Number(row.credits),
    maxUses: Number(row.max_uses),
    usedCount: Number(row.used_count),
    reasonPrefix,
    kind: redeemKindOf(reasonPrefix),
    expiresAt: row.expires_at ? Number(row.expires_at) : null,
    isActive: Boolean(row.is_active),
  };
}

/**
 * แลกรับสิทธิ์จากโค้ดสำหรับผู้ใช้
 */
export async function redeemCodeForUser(userId: string, codeInput: string): Promise<RedeemResult> {
  if (!userId) {
    return { ok: false, error: "กรุณาเข้าสู่ระบบก่อนแลกรับสิทธิ์" };
  }

  const code = codeInput.trim().toUpperCase();
  if (!code) {
    return { ok: false, error: "กรุณาระบุรหัสแลกสิทธิ์" };
  }

  const codeInfo = await getRedeemCodeInfo(code);
  if (!codeInfo) {
    return { ok: false, error: "ไม่พบรหัสแลกสิทธิ์นี้ หรือรหัสไม่ถูกต้อง" };
  }

  if (!codeInfo.isActive) {
    return { ok: false, error: "รหัสแลกสิทธิ์นี้ถูกปิดใช้งานแล้ว" };
  }

  if (codeInfo.expiresAt && Date.now() > codeInfo.expiresAt) {
    return { ok: false, error: "รหัสแลกสิทธิ์นี้หมดอายุแล้ว" };
  }

  if (codeInfo.maxUses !== -1 && codeInfo.usedCount >= codeInfo.maxUses) {
    return { ok: false, error: "รหัสแลกสิทธิ์นี้ถูกใช้ครบสิทธิ์ที่กำหนดแล้ว" };
  }

  const db = await getAppDB();

  // ตรวจสอบว่าผู้ใช้นี้เคยแลกรหัสนี้ไปแล้วหรือไม่
  const alreadyRedeemed = await db
    .prepare(`SELECT 1 FROM redeem_redemptions WHERE code = ? AND user_id = ? LIMIT 1`)
    .bind(code, userId)
    .first<{ 1: number }>();

  if (alreadyRedeemed) {
    return { ok: false, error: "คุณเคยใช้รหัสแลกสิทธิ์นี้ไปแล้ว (จำกัด 1 บัญชีต่อ 1 สิทธิ์)" };
  }

  const redemptionId = `rdm_${crypto.randomUUID()}`;
  const now = Date.now();

  // ── 1. จองสิทธิ์แบบอะตอมมิก — เงื่อนไขทั้งหมดอยู่ใน UPDATE เดียว ──
  //
  // ⚠️ การตรวจด้านบนเป็นแค่ "ข้อความบอกผู้ใช้ให้ตรงเหตุ" เท่านั้น ห้ามใช้เป็นตัวบังคับจริง
  // เพราะระหว่างอ่าน (`getRedeemCodeInfo`) กับเขียน มีช่องให้คนอื่นแลกแทรกได้ (TOCTOU)
  // ของเดิมบวก `used_count` แบบไม่มีเงื่อนไข ตอนนั้นไม่เป็นไรเพราะโค้ดทุกใบ `max_uses = -1`
  // แต่พอเริ่มจำกัดจำนวนจริง ช่องนี้จะกลายเป็น "โค้ด 50 สิทธิ์ถูกแลกได้ 60 คน" ทันที
  const claim = await db
    .prepare(
      `UPDATE redeem_codes
          SET used_count = used_count + 1
        WHERE code = ?
          AND is_active = 1
          AND (expires_at IS NULL OR expires_at > ?)
          AND (max_uses = -1 OR used_count < max_uses)`,
    )
    .bind(code, now)
    .run()
    .catch((err: unknown) => {
      console.error("[Redeem] จองสิทธิ์ไม่สำเร็จ:", err);
      return null;
    });

  if (!claim || (claim.meta?.changes ?? 0) === 0) {
    return { ok: false, error: "รหัสแลกสิทธิ์นี้ถูกใช้ครบสิทธิ์ที่กำหนดแล้ว" };
  }

  /** คืนสิทธิ์ที่จองไว้เมื่อขั้นตอนถัดไปล้ม — ไม่งั้นโควตาโค้ดจะหายไปเฉย ๆ โดยไม่มีใครได้ */
  const releaseClaim = async () => {
    await db
      .prepare(`UPDATE redeem_codes SET used_count = used_count - 1 WHERE code = ? AND used_count > 0`)
      .bind(code)
      .run()
      .catch((err: unknown) => console.error("[Redeem] คืนสิทธิ์ที่จองไว้ไม่สำเร็จ:", err));
  };

  try {
    // ── 2. บันทึกผู้แลก — UNIQUE(code, user_id) คือด่านจริงที่กัน "คนเดิมแลกซ้ำ" ──
    await db
      .prepare(
        `INSERT INTO redeem_redemptions (id, code, user_id, credits, redeemed_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(redemptionId, code, userId, codeInfo.credits, now)
      .run();

    // ── 3. มอบรอบเข้าสู่ user_bonus ──
    // reason ขึ้นต้นด้วย `purchase_` เฉพาะโค้ดชนิด premium เท่านั้นจึงจะปลดฟีเจอร์พรีเมียม
    // ส่วนโค้ดแจก (`gift_*`) ได้แค่รอบเปิดไพ่ — ตัวตัดสินคือ `normalizeReasonPrefix()` ข้างบน
    const reason = `${codeInfo.reasonPrefix}_${code}`;
    await grantBonus(userId, codeInfo.credits, reason);

    // ⚠️ `grantBonus()` กลืน error ทุกชนิดแล้ว return เงียบ ๆ (ดู entitlement.ts)
    // ถ้าไม่ยืนยันตรงนี้ ผู้ใช้จะถูกตีตราว่า "แลกไปแล้ว" ทั้งที่ไม่ได้รอบสักหน่วย
    // และเพราะ UNIQUE(code, user_id) เขาจะแลกรหัสใบนั้นไม่ได้อีกตลอดชีพ — ห้ามตอบ ok
    const granted = await db
      .prepare(`SELECT granted FROM user_bonus WHERE user_id = ? AND reason = ? LIMIT 1`)
      .bind(userId, reason)
      .first<{ granted: number }>()
      .catch(() => null);

    if (!granted) {
      await db
        .prepare(`DELETE FROM redeem_redemptions WHERE id = ?`)
        .bind(redemptionId)
        .run()
        .catch((e: unknown) => console.error("[Redeem] ย้อนแถวการแลกไม่สำเร็จ:", e));
      await releaseClaim();
      console.error("[Redeem] เขียนเครดิตไม่สำเร็จ — ย้อนการแลกทั้งหมดแล้ว", { userId, code });
      return { ok: false, error: "ระบบบันทึกสิทธิ์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" };
    }

    return {
      ok: true,
      code: codeInfo.code,
      title: codeInfo.title,
      credits: codeInfo.credits,
      kind: codeInfo.kind,
    };
  } catch (err: unknown) {
    await releaseClaim();
    const msg = err instanceof Error ? err.message : String(err);
    if (/unique|constraint/i.test(msg)) {
      return { ok: false, error: "คุณเคยใช้รหัสแลกสิทธิ์นี้ไปแล้ว" };
    }
    console.error("[Redeem] ล้มเหลวขณะประมวลผลการแลกสิทธิ์:", err);
    return { ok: false, error: "เกิดข้อผิดพลาดในการประมวลผลการแลกสิทธิ์ กรุณาลองใหม่อีกครั้ง" };
  }
}
