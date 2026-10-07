import { getAppDB } from "@/lib/platform/db";
import { KEY, kvGetJSON, kvPutJSON } from "@/lib/platform/kv-store";
import { recordEvent } from "@/lib/stats/record";

/**
 * 🎫 บัตรผ่านสตูดิโอ 30 วัน (REFLECTION_JOURNAL_PLAN 1.13 — "รายได้: แพ็กเกจสำหรับแม่หมอ")
 * ---------------------------------------------------------------------------
 * ทำไมเป็น "บัตรผ่านจ่ายครั้งเดียว" ไม่ใช่สมาชิกรายเดือนตัดบัตรอัตโนมัติ:
 *  • PromptPay (ช่องทางหลักของคนไทย) ตัดเงินซ้ำอัตโนมัติไม่ได้ — สมาชิกรายเดือนจะใช้ได้แค่บัตรเครดิต
 *  • ใช้ท่อจ่ายเงินเดิม (Checkout แบบจ่ายครั้งเดียว + webhook + คืนเงิน) ที่ผ่านด่านเส้นทางเงินแล้ว
 *  • ไม่มีการตัดเงินที่แม่หมอลืม — ซื้อซ้ำก่อนหมด = ต่อวันจากวันหมดเดิม (ไม่เสียวันที่เหลือ)
 *
 * ราคา (บาท) — ตั้งจากแผงแอดมินแท็บ "หมอดูพาร์ทเนอร์" ได้ ไม่ต้อง deploy · ลำดับการเลือก:
 *  1. ราคาเฉพาะแม่หมอคนนั้น (`reader_studio_settings.pass_price_thb`)
 *  2. ราคากลางที่แอดมินตั้ง (KV `app:flag:studio.pass_price_thb`)
 *  3. ค่าตั้งต้นใน `wrangler.jsonc` → vars `STUDIO_PRO_PRICE_THB` (299)
 *  ไม่มีสักชั้น = ยังไม่เปิดขาย ปุ่มซื้อถูกซ่อน · ยอดที่ Stripe ต้องจ่ายถูกจดลงแถว payments ตอนเริ่มจ่าย
 *  (webhook/confirm เทียบกับแถวนั้น) — เปลี่ยนราคากลางทางไม่กระทบคำสั่งซื้อที่เริ่มไปแล้ว
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

export const STUDIO_PASS_PRICE_MIN_THB = 20;
export const STUDIO_PASS_PRICE_MAX_THB = 100_000;
const DEFAULT_PRICE_KEY = KEY.flag("studio.pass_price_thb");
const PRICE_MEMO_MS = 30_000;

/** บาทเต็มในช่วงที่รับได้ — อย่างอื่น (ว่าง · ทศนิยม · ติดลบ · พิมพ์เกินหลัก) = null */
export function validPassPriceThb(raw: unknown): number | null {
  const n = typeof raw === "string" && raw.trim() !== "" ? Number(raw) : raw;
  return typeof n === "number" && Number.isInteger(n) && n >= STUDIO_PASS_PRICE_MIN_THB && n <= STUDIO_PASS_PRICE_MAX_THB ? n : null;
}

/** ค่าตั้งต้นจาก `wrangler.jsonc` (ใช้เมื่อแอดมินยังไม่ตั้งราคากลาง) */
export function envPassPriceThb(): number | null {
  return validPassPriceThb(process.env.STUDIO_PRO_PRICE_THB);
}

/** ราคากลางที่แอดมินตั้งไว้ (null = ไม่ได้ตั้ง ใช้ค่าตั้งต้น) */
export async function getAdminDefaultPassPriceThb(): Promise<number | null> {
  const raw = await kvGetJSON<{ value?: unknown }>(DEFAULT_PRICE_KEY, PRICE_MEMO_MS).catch(() => null);
  return validPassPriceThb(raw?.value);
}

export async function setAdminDefaultPassPriceThb(priceThb: number | null): Promise<void> {
  await kvPutJSON(DEFAULT_PRICE_KEY, { value: priceThb, updatedAt: Date.now() });
}

/** ราคากลางที่ใช้จริง = ที่แอดมินตั้ง ➔ ค่าตั้งต้น */
export async function defaultPassPriceThb(): Promise<number | null> {
  return (await getAdminDefaultPassPriceThb()) ?? envPassPriceThb();
}

/** ราคาบัตรผ่านของแม่หมอคนนี้ (บาท) — null = ยังไม่เปิดขาย */
export async function resolvePassPriceThb(readerId: string): Promise<number | null> {
  const db = await getAppDB();
  const row = await db
    .prepare(`SELECT pass_price_thb FROM reader_studio_settings WHERE reader_id = ?`)
    .bind(readerId)
    .first<{ pass_price_thb: number | null }>();
  return validPassPriceThb(row?.pass_price_thb) ?? (await defaultPassPriceThb());
}

/** ตั้งราคาเฉพาะแม่หมอคนนี้ (null = กลับไปใช้ราคากลาง) */
export async function setReaderPassPriceThb(readerId: string, priceThb: number | null, now = Date.now()): Promise<void> {
  const db = await getAppDB();
  await db
    .prepare(
      `INSERT INTO reader_studio_settings (reader_id, pass_price_thb, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(reader_id) DO UPDATE SET pass_price_thb = excluded.pass_price_thb, updated_at = excluded.updated_at`,
    )
    .bind(readerId, priceThb, now)
    .run();
}

export interface ReaderPassAdminRow {
  readerId: string;
  priceThb: number | null;
  proUntil: number | null;
}

/** ราคาเฉพาะคน + วันหมดบัตรผ่านของแม่หมอทุกคนที่มีแถวตั้งค่า (สำหรับแผงแอดมิน) */
export async function listReaderPassAdminRows(): Promise<ReaderPassAdminRow[]> {
  const db = await getAppDB();
  const res = await db
    .prepare(`SELECT reader_id, pass_price_thb, pro_until FROM reader_studio_settings`)
    .all<{ reader_id: string; pass_price_thb: number | null; pro_until: number | null }>();
  return (res.results ?? []).map((r) => ({
    readerId: r.reader_id,
    priceThb: validPassPriceThb(r.pass_price_thb),
    proUntil: typeof r.pro_until === "number" ? r.pro_until : null,
  }));
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

export function studioPlanView(proUntil: number | null, freeDraftsPerDay: number, priceThb: number | null, now = Date.now()): StudioPlanView {
  return {
    active: isProActive(proUntil, now),
    proUntil: isProActive(proUntil, now) ? proUntil : null,
    priceThb,
    days: STUDIO_PASS_DAYS,
    freeDraftsPerDay,
    proDraftsPerDay: studioProDraftsPerDay(),
  };
}
