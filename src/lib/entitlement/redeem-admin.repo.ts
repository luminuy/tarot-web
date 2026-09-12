import { getAppDB } from "@/lib/platform/db";

export type RedeemReasonKind = "premium" | "quota";

export interface RedeemCodeRow {
  code: string;
  title: string;
  credits: number;
  maxUses: number;
  usedCount: number;
  actualRedeemedCount: number;
  reasonPrefix: "purchase_redeem" | "promo_redeem";
  expiresAt: number | null;
  isActive: boolean;
  createdAt: number;
}

export interface RedemptionRow {
  id: string;
  code: string;
  userId: string;
  credits: number;
  redeemedAt: number;
}

export interface CreateRedeemCodeInput {
  code: string;
  title: string;
  credits: number;
  kind: RedeemReasonKind;
  maxUses?: number;
  expiresAt?: number | null;
}

export interface UpdateRedeemCodeInput {
  title?: string;
  maxUses?: number;
  expiresAt?: number | null;
  isActive?: boolean;
}

const CODE_REGEX = /^[A-Z0-9][A-Z0-9-]{3,31}$/;

interface RawRedeemCodeRow {
  code: string;
  title: string;
  credits: number;
  max_uses: number;
  used_count: number;
  actual_redeemed_count: number;
  reason_prefix: string;
  expires_at: number | null;
  is_active: number;
  created_at: number;
}

interface RawRedemptionRow {
  id: string;
  code: string;
  user_id: string;
  credits: number;
  redeemed_at: number;
}

function mapRow(row: RawRedeemCodeRow): RedeemCodeRow {
  const prefix = row.reason_prefix === "promo_redeem" ? "promo_redeem" : "purchase_redeem";
  return {
    code: row.code,
    title: row.title,
    credits: Number(row.credits),
    maxUses: Number(row.max_uses),
    usedCount: Number(row.used_count),
    actualRedeemedCount: Number(row.actual_redeemed_count ?? 0),
    reasonPrefix: prefix,
    expiresAt: row.expires_at ? Number(row.expires_at) : null,
    isActive: Boolean(row.is_active),
    createdAt: Number(row.created_at),
  };
}

/**
 * ดึงรายการรหัสทั้งหมด เรียงตาม created_at ล่าสุดก่อน
 * พร้อมยอดนับจริงจากตาราง redeem_redemptions
 */
export async function listRedeemCodes(): Promise<RedeemCodeRow[]> {
  const db = await getAppDB();
  const res = await db
    .prepare(
      `SELECT c.code, c.title, c.credits, c.max_uses, c.used_count, c.reason_prefix, c.expires_at, c.is_active, c.created_at,
              (SELECT COUNT(*) FROM redeem_redemptions r WHERE r.code = c.code) AS actual_redeemed_count
         FROM redeem_codes c
        ORDER BY c.created_at DESC`,
    )
    .all<RawRedeemCodeRow>();

  return (res.results || []).map(mapRow);
}

/**
 * สร้างรหัสแลกสิทธิ์ใหม่
 */
export async function createRedeemCode(input: CreateRedeemCodeInput): Promise<RedeemCodeRow> {
  const code = input.code.trim().toUpperCase();
  if (!CODE_REGEX.test(code)) {
    throw new Error(
      "รหัสต้องขึ้นต้นด้วยตัวอักษรหรือตัวเลข ประกอบด้วย A-Z, 0-9 หรือเครื่องหมายขีด (-) ความยาว 4-32 ตัวอักษร",
    );
  }

  const title = (input.title || "").trim();
  if (!title || title.length > 100) {
    throw new Error("ชื่อแคมเปญต้องมีความยาวระหว่าง 1 ถึง 100 ตัวอักษร");
  }

  const credits = Math.floor(input.credits);
  if (credits < 1 || credits > 100) {
    throw new Error("จำนวนสิทธิ์ต้องอยู่ระหว่าง 1 ถึง 100 ครั้ง");
  }

  const maxUses = input.maxUses === undefined ? -1 : Math.floor(input.maxUses);
  if (maxUses !== -1 && (maxUses < 1 || maxUses > 100000)) {
    throw new Error("จำนวนครั้งที่ให้แลกต้องเป็น -1 (ไม่จำกัด) หรืออยู่ระหว่าง 1 ถึง 100,000");
  }

  const reasonPrefix = input.kind === "premium" ? "purchase_redeem" : "promo_redeem";
  const expiresAt = input.expiresAt ? Math.floor(input.expiresAt) : null;
  const now = Date.now();

  const db = await getAppDB();
  try {
    await db
      .prepare(
        `INSERT INTO redeem_codes (code, title, credits, max_uses, used_count, reason_prefix, expires_at, is_active, created_at)
         VALUES (?, ?, ?, ?, 0, ?, ?, 1, ?)`,
      )
      .bind(code, title, credits, maxUses, reasonPrefix, expiresAt, now)
      .run();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/unique|constraint/i.test(msg)) {
      throw new Error(`รหัส '${code}' มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น`);
    }
    throw err;
  }

  return {
    code,
    title,
    credits,
    maxUses,
    usedCount: 0,
    actualRedeemedCount: 0,
    reasonPrefix,
    expiresAt,
    isActive: true,
    createdAt: now,
  };
}

/**
 * แก้ไขรหัสแลกสิทธิ์ (อนุญาตเฉพาะ title, max_uses, expires_at, is_active)
 * ไม่อนุญาตให้แก้ไข code หรือ credits ตามกฎข้อห้ามของระบบ
 */
export async function updateRedeemCode(
  codeInput: string,
  patch: UpdateRedeemCodeInput,
): Promise<RedeemCodeRow> {
  const code = codeInput.trim().toUpperCase();
  const db = await getAppDB();

  const current = await db
    .prepare(
      `SELECT c.code, c.title, c.credits, c.max_uses, c.used_count, c.reason_prefix, c.expires_at, c.is_active, c.created_at,
              (SELECT COUNT(*) FROM redeem_redemptions r WHERE r.code = c.code) AS actual_redeemed_count
         FROM redeem_codes c
        WHERE c.code = ? LIMIT 1`,
    )
    .bind(code)
    .first<RawRedeemCodeRow>();

  if (!current) {
    throw new Error(`ไม่พบรหัส '${code}' ในระบบ`);
  }

  let nextTitle = current.title;
  if (patch.title !== undefined) {
    const trimmed = patch.title.trim();
    if (!trimmed || trimmed.length > 100) {
      throw new Error("ชื่อแคมเปญต้องมีความยาวระหว่าง 1 ถึง 100 ตัวอักษร");
    }
    nextTitle = trimmed;
  }

  let nextMaxUses = Number(current.max_uses);
  if (patch.maxUses !== undefined) {
    const mu = Math.floor(patch.maxUses);
    if (mu !== -1 && (mu < 1 || mu > 100000)) {
      throw new Error("จำนวนครั้งที่ให้แลกต้องเป็น -1 (ไม่จำกัด) หรืออยู่ระหว่าง 1 ถึง 100,000");
    }
    nextMaxUses = mu;
  }

  let nextExpiresAt = current.expires_at ? Number(current.expires_at) : null;
  if (patch.expiresAt !== undefined) {
    nextExpiresAt = patch.expiresAt ? Math.floor(patch.expiresAt) : null;
  }

  let nextIsActive = Boolean(current.is_active);
  if (patch.isActive !== undefined) {
    nextIsActive = Boolean(patch.isActive);
  }

  await db
    .prepare(
      `UPDATE redeem_codes
          SET title = ?, max_uses = ?, expires_at = ?, is_active = ?
        WHERE code = ?`,
    )
    .bind(nextTitle, nextMaxUses, nextExpiresAt, nextIsActive ? 1 : 0, code)
    .run();

  return {
    code: current.code,
    title: nextTitle,
    credits: Number(current.credits),
    maxUses: nextMaxUses,
    usedCount: Number(current.used_count),
    actualRedeemedCount: Number(current.actual_redeemed_count ?? 0),
    reasonPrefix: current.reason_prefix === "promo_redeem" ? "promo_redeem" : "purchase_redeem",
    expiresAt: nextExpiresAt,
    isActive: nextIsActive,
    createdAt: Number(current.created_at),
  };
}

/**
 * ดึงรายการผู้แลกสิทธิ์ของรหัสที่กำหนด
 */
export async function listRedemptions(code: string, limit = 200): Promise<RedemptionRow[]> {
  const normalizedCode = code.trim().toUpperCase();
  const db = await getAppDB();
  const maxRows = Math.min(Math.max(1, limit), 200);

  const res = await db
    .prepare(
      `SELECT id, code, user_id, credits, redeemed_at
         FROM redeem_redemptions
        WHERE code = ?
        ORDER BY redeemed_at DESC
        LIMIT ?`,
    )
    .bind(normalizedCode, maxRows)
    .all<RawRedemptionRow>();

  return (res.results || []).map((row) => ({
    id: row.id,
    code: row.code,
    userId: row.user_id,
    credits: Number(row.credits),
    redeemedAt: Number(row.redeemed_at),
  }));
}
