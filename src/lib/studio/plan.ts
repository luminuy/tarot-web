import { getAppDB } from "@/lib/platform/db";
import { recordEvent } from "@/lib/stats/record";

/**
 * 🎫 บัตรผ่านสตูดิโอ 30 วัน (REFLECTION_JOURNAL_PLAN 1.13 — "รายได้: แพ็กเกจสำหรับแม่หมอ")
 * ---------------------------------------------------------------------------
 * ทำไมเป็น "บัตรผ่านจ่ายครั้งเดียว" ไม่ใช่สมาชิกรายเดือนตัดบัตรอัตโนมัติ:
 *  • PromptPay (ช่องทางหลักของคนไทย) ตัดเงินซ้ำอัตโนมัติไม่ได้ — สมาชิกรายเดือนจะใช้ได้แค่บัตรเครดิต
 *  • ใช้ท่อจ่ายเงินเดิม (Checkout แบบจ่ายครั้งเดียว + webhook + คืนเงิน) ที่ผ่านด่านเส้นทางเงินแล้ว
 *  • ไม่มีการตัดเงินที่แม่หมอลืม — ซื้อซ้ำก่อนหมด = ต่อวันจากวันหมดเดิม (ไม่เสียวันที่เหลือ)
 *
 * ราคา: `STUDIO_PRO_PRICE_THB` ใน `wrangler.jsonc` → vars (ตั้ง 299 บาท 2026-10-07 · ไม่ตั้ง = ยังไม่เปิดขาย ปุ่มซื้อถูกซ่อน)
 * สิ่งที่ได้: โควตาร่างคำอ่านต่อวันสูงขึ้น (`STUDIO_PRO_DRAFTS_PER_DAY` ค่าเริ่ม 300) + เพดานโทเคนระดับ `paid`
 * แผนฟรียังทำทุกอย่างได้ครบ (ลูกค้า · ลิงก์ · แบรนด์ · PDF) — ไม่ล็อกฟีเจอร์พื้นฐานไว้หลังเงิน
 *
 * ความถูกต้องของเงิน:
 *  • แถว `reader_studio_passes` ถูกสร้างตอนเริ่มจ่าย ผูก order_id ↔ แม่หมอ (แถว payments ไม่มี reader_id)
 *  • ให้วันได้ครั้งเดียวต่อคำสั่งซื้อ: `UPDATE ... WHERE granted_at IS NULL` (webhook + หน้ากลับจาก Stripe ยิงซ้ำได้)
 *  • คืนเงินเต็ม ➔ `revokeStudioPass` หักวันของคำสั่งซื้อนั้นออก (ครั้งเดียว: `WHERE revoked_at IS NULL`)
 */

export const STUDIO_PASS_DAYS = 30;
export const STUDIO_PASS_ORDER_PREFIX = "stp_";
const DAY_MS = 86_400_000;

/** ราคาบัตรผ่าน (สตางค์) — null = ยังไม่เปิดขาย */
export function studioPassPriceSatang(): number | null {
  const n = Number(process.env.STUDIO_PRO_PRICE_THB);
  return Number.isInteger(n) && n >= 20 && n <= 100_000 ? n * 100 : null;
}

export function studioProDraftsPerDay(): number {
  const n = Number(process.env.STUDIO_PRO_DRAFTS_PER_DAY);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 300;
}

export function isProActive(proUntil: number | null | undefined, now = Date.now()): boolean {
  return typeof proUntil === "number" && proUntil > now;
}

export function isStudioPassOrder(orderId: string | null | undefined): boolean {
  return typeof orderId === "string" && /^stp_[0-9a-f]{16}$/.test(orderId);
}

export function newStudioPassOrderId(): string {
  return `${STUDIO_PASS_ORDER_PREFIX}${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

/** จองคำสั่งซื้อไว้ก่อนพาไปจ่าย (ยังไม่ให้วัน) */
export async function createStudioPassOrder(readerId: string, orderId: string): Promise<void> {
  const db = await getAppDB();
  await db
    .prepare(`INSERT INTO reader_studio_passes (order_id, reader_id, days, created_at) VALUES (?, ?, ?, ?)`)
    .bind(orderId, readerId, STUDIO_PASS_DAYS, Date.now())
    .run();
}

export async function getStudioPassOrder(orderId: string): Promise<{ readerId: string; days: number; grantedAt: number | null; revokedAt: number | null } | null> {
  const db = await getAppDB();
  const r = await db
    .prepare(`SELECT reader_id, days, granted_at, revoked_at FROM reader_studio_passes WHERE order_id = ?`)
    .bind(orderId)
    .first<{ reader_id: string; days: number; granted_at: number | null; revoked_at: number | null }>();
  return r ? { readerId: r.reader_id, days: r.days, grantedAt: r.granted_at, revokedAt: r.revoked_at } : null;
}

/**
 * ให้วันของคำสั่งซื้อนี้ — เรียกได้เฉพาะหลัง "พิสูจน์ว่าเงินเข้าแล้ว" (webhook ที่ตรวจลายเซ็น / ถาม Stripe เอง)
 * ต่อจากวันหมดเดิมถ้ายังไม่หมด · เรียกซ้ำ = "already"
 */
export async function grantStudioPass(orderId: string, now = Date.now()): Promise<"granted" | "already" | "not_found" | "failed"> {
  try {
    const db = await getAppDB();
    const order = await getStudioPassOrder(orderId);
    if (!order) return "not_found";
    const claim = await db
      .prepare(`UPDATE reader_studio_passes SET granted_at = ? WHERE order_id = ? AND granted_at IS NULL AND revoked_at IS NULL`)
      .bind(now, orderId)
      .run();
    if ((claim.meta?.changes ?? 0) === 0) return "already";
    const add = order.days * DAY_MS;
    await db
      .prepare(
        `INSERT INTO reader_studio_settings (reader_id, pro_until, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(reader_id) DO UPDATE SET pro_until = MAX(COALESCE(pro_until, 0), ?) + ?, updated_at = excluded.updated_at`,
      )
      .bind(order.readerId, now + add, now, now, add)
      .run();
    recordEvent("studio_pass_granted");
    return "granted";
  } catch (err) {
    console.error("[Studio pass] ให้วันไม่สำเร็จ", { orderId, err });
    return "failed";
  }
}

/** คืนเงินเต็ม ➔ หักวันของคำสั่งซื้อนั้น (ครั้งเดียว) */
export async function revokeStudioPass(orderId: string, now = Date.now()): Promise<boolean> {
  const db = await getAppDB();
  const order = await getStudioPassOrder(orderId);
  if (!order) return false;
  const claim = await db
    .prepare(`UPDATE reader_studio_passes SET revoked_at = ? WHERE order_id = ? AND revoked_at IS NULL`)
    .bind(now, orderId)
    .run();
  if ((claim.meta?.changes ?? 0) === 0) return false;
  if (order.grantedAt) {
    await db
      .prepare(`UPDATE reader_studio_settings SET pro_until = COALESCE(pro_until, 0) - ?, updated_at = ? WHERE reader_id = ?`)
      .bind(order.days * DAY_MS, now, order.readerId)
      .run();
  }
  recordEvent("studio_pass_revoked");
  return true;
}

export interface StudioPlanView {
  active: boolean;
  proUntil: number | null;
  /** ราคา (บาท) — null = ยังไม่เปิดขาย */
  priceThb: number | null;
  days: number;
  freeDraftsPerDay: number;
  proDraftsPerDay: number;
}

export function studioPlanView(proUntil: number | null, freeDraftsPerDay: number, now = Date.now()): StudioPlanView {
  const price = studioPassPriceSatang();
  return {
    active: isProActive(proUntil, now),
    proUntil: isProActive(proUntil, now) ? proUntil : null,
    priceThb: price === null ? null : price / 100,
    days: STUDIO_PASS_DAYS,
    freeDraftsPerDay,
    proDraftsPerDay: studioProDraftsPerDay(),
  };
}
