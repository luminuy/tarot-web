/**
 * 💳 รายการชำระเงินทั้งหมดสำหรับแผงแอดมิน (แท็บ "รายการชำระเงิน") — อ่านอย่างเดียว
 * ---------------------------------------------------------------------------
 * ครอบทุกสินค้าในตาราง `payments`: แพ็กเติมรอบ (`ord_`) · AI ช่วยเขียน (`stp_`) · ปรึกษาแม่หมอ (ที่เหลือ)
 * เดิมแท็บ "การจองและการเงิน" เห็นแค่การจองแม่หมอ การซื้อแพ็กเติมรอบจึงไม่มีที่ให้ตรวจเลย
 *
 * PDPA: ไม่ดึงอีเมลหรือชื่อ — แสดงแค่รหัสผู้ใช้ไว้ค้นต่อในแท็บ "สมาชิก"
 */

import { getAppDB } from "@/lib/platform/db";
import { STUDIO_PASS_ORDER_PREFIX } from "@/lib/studio/plan";

import type { Product } from "./executive-report";

export const PAYMENT_STATUSES = ["paid", "pending", "failed", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface AdminPaymentRow {
  id: string;
  createdAt: number;
  product: Product;
  amountThb: number;
  status: string;
  provider: string;
  /** รายการทดสอบ (ตัวจำลอง หรือ Stripe โหมดทดสอบ) — ไม่ใช่เงินจริง */
  test: boolean;
  /** เลขคำสั่งซื้อ (หรือรหัสการจองของรายการปรึกษาแม่หมอ) */
  ref: string | null;
  userId: string | null;
  refundDue: boolean;
  /** ลิงก์ค้นรายการนี้ในแดชบอร์ด Stripe — `null` เมื่อไม่ใช่ Stripe */
  stripeUrl: string | null;
}

export interface PaymentFilter {
  status?: PaymentStatus;
  product?: Product;
  /** `real` = เงินจริงเท่านั้น (ค่าเริ่มต้น) · `test` = รายการทดสอบ · `all` = ทั้งหมด */
  mode?: "real" | "test" | "all";
  /** ค้นจากรหัสรายการ · เลขคำสั่งซื้อ · รหัสการจอง · รหัสผู้ใช้ · รหัสอ้างอิง Stripe */
  q?: string;
  /** แบ่งหน้า: เอารายการที่เก่ากว่าเวลานี้ (epoch ms) */
  before?: number;
  limit?: number;
}

const TEST_SQL = "(provider = 'simulator' OR provider_ref LIKE 'cs\\_test\\_%' ESCAPE '\\')";
const PRODUCT_SQL = `CASE WHEN order_id LIKE 'ord\\_%' ESCAPE '\\' THEN 'packs'
                          WHEN order_id LIKE ? ESCAPE '\\' THEN 'studio'
                          ELSE 'consult' END`;

function stripeSearchUrl(provider: string, ref: string | null, test: boolean): string | null {
  if (provider !== "stripe" || !ref) return null;
  return `https://dashboard.stripe.com/${test ? "test/" : ""}search?query=${encodeURIComponent(ref)}`;
}

export async function listAdminPayments(f: PaymentFilter): Promise<{ rows: AdminPaymentRow[]; hasMore: boolean }> {
  const db = await getAppDB();
  const limit = Math.min(200, Math.max(1, f.limit ?? 50));
  const where: string[] = [];
  const args: unknown[] = [`${STUDIO_PASS_ORDER_PREFIX.replace(/_/g, "\\_")}%`];

  if (f.status) {
    where.push("status = ?");
    args.push(f.status);
  }
  if (f.mode === "test") where.push(TEST_SQL);
  else if (f.mode !== "all") where.push(`NOT ${TEST_SQL}`);
  if (f.before) {
    where.push("created_at < ?");
    args.push(f.before);
  }
  const q = f.q?.trim();
  if (q) {
    where.push("(id = ? OR order_id = ? OR booking_id = ? OR user_id = ? OR ticket_id = ? OR provider_ref = ?)");
    args.push(q, q, q, q, q, q);
  }

  const { results } = await db
    .prepare(
      `SELECT * FROM (
         SELECT id, created_at, ${PRODUCT_SQL} AS product, amount_satang, status, provider, provider_ref,
                ${TEST_SQL} AS test, order_id, booking_id, user_id, refund_due
           FROM payments
          ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ) ${f.product ? "WHERE product = ?" : ""}
       ORDER BY created_at DESC LIMIT ?`,
    )
    .bind(...args, ...(f.product ? [f.product] : []), limit + 1)
    .all<{
      id: string;
      created_at: number;
      product: Product;
      amount_satang: number;
      status: string;
      provider: string;
      provider_ref: string | null;
      test: number;
      order_id: string | null;
      booking_id: string | null;
      user_id: string | null;
      refund_due: number | null;
    }>();

  const rows = (results ?? []).slice(0, limit).map<AdminPaymentRow>((r) => {
    const test = Number(r.test) === 1;
    return {
      id: r.id,
      createdAt: Number(r.created_at),
      product: r.product,
      amountThb: Number(r.amount_satang) / 100,
      status: r.status,
      provider: r.provider,
      test,
      // แถวเก่าก่อน 0015 ก๊อปเลขเดียวกันลงทั้งสองช่อง — แสดงช่องเดียวพอ
      ref: r.order_id ?? r.booking_id,
      userId: r.user_id,
      refundDue: Number(r.refund_due ?? 0) === 1,
      stripeUrl: stripeSearchUrl(r.provider, r.provider_ref, test),
    };
  });
  return { rows, hasMore: (results ?? []).length > limit };
}
