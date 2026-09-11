import { getAppDB } from "@/lib/platform/db";
import { grantBonus } from "@/lib/entitlement/entitlement";

export interface RedeemCodeInfo {
  code: string;
  title: string;
  credits: number;
  maxUses: number;
  usedCount: number;
  reasonPrefix: string;
  expiresAt: number | null;
  isActive: boolean;
}

export type RedeemResult =
  | {
      ok: true;
      code: string;
      title: string;
      credits: number;
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

  return {
    code: row.code,
    title: row.title,
    credits: Number(row.credits),
    maxUses: Number(row.max_uses),
    usedCount: Number(row.used_count),
    reasonPrefix: row.reason_prefix,
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

  try {
    // 1. บันทึกการแลกรับสิทธิ์
    await db
      .prepare(
        `INSERT INTO redeem_redemptions (id, code, user_id, credits, redeemed_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(redemptionId, code, userId, codeInfo.credits, now)
      .run();

    // 2. ปรับปรุงจำนวนครั้งที่ถูกใช้
    await db
      .prepare(`UPDATE redeem_codes SET used_count = used_count + 1 WHERE code = ?`)
      .bind(code)
      .run();

    // 3. มอบเครดิตเข้าสู่ user_bonus โดยใช้ reason ขึ้นต้นด้วย purchase_
    // เพื่อให้เข้าเงื่อนไข hasPaidCredits ทันที (ปลดล็อกผังใหญ่ + ปรมาจารย์ลับ)
    const reason = `${codeInfo.reasonPrefix}_${code}`;
    await grantBonus(userId, codeInfo.credits, reason);

    return {
      ok: true,
      code: codeInfo.code,
      title: codeInfo.title,
      credits: codeInfo.credits,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/unique|constraint/i.test(msg)) {
      return { ok: false, error: "คุณเคยใช้รหัสแลกสิทธิ์นี้ไปแล้ว" };
    }
    console.error("[Redeem] ล้มเหลวขณะประมวลผลการแลกสิทธิ์:", err);
    return { ok: false, error: "เกิดข้อผิดพลาดในการประมวลผลการแลกสิทธิ์ กรุณาลองใหม่อีกครั้ง" };
  }
}
