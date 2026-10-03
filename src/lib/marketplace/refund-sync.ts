import { getAppDB } from "@/lib/platform/db";
import { orderIdOfPaymentRow, purchaseGrantReason, type PaymentRowForGrant } from "@/lib/entitlement/purchase";
import { sendBookingCancelled } from "@/lib/marketplace/booking-mail";
import { retrieveRefundState } from "@/lib/marketplace/payment-gateway";
import { recordEvent } from "@/lib/stats/record";

/**
 * 💸 คืนเงินที่เกิดนอกระบบเรา (กดคืนในแดชบอร์ด Stripe) ➔ ถอนสิ่งที่ลูกค้าได้จากเงินก้อนนั้น
 * ===========================================================================
 * เจ้าของแจ้ง (2026-10-03): คืนเงินลูกค้าในแดชบอร์ด Stripe แล้ว แต่รอบดูดวงที่ซื้อยังอยู่ครบ
 * สาเหตุ: เว็บไม่เคยฟัง event คืนเงินเลย — รู้แค่ตอน "จ่ายแล้ว" แถว payments จึงค้าง `paid` ตลอดไป
 *
 *   เติมรอบดูดวง ➔ ตั้ง `user_bonus.granted = 0` ของแถวการซื้อนั้น (กุญแจ `purchase_<orderId>` เดิม)
 *                  รอบที่ใช้ไปแล้วก่อนคืนเงินไม่ถูกเรียกคืน (ยอดคงเหลือไม่ติดลบ — ตัวคำนวณตัดที่ 0)
 *                  กุญแจเดิมยังอยู่ ➔ webhook จ่ายเงินที่ยิงซ้ำมาภายหลังแจกคืนไม่ได้ (ON CONFLICT DO NOTHING)
 *   ค่าปรึกษาแม่หมอ ➔ นัด/คิวที่ยังไม่จบถูกยกเลิก (cancelled_by = system) + อีเมลแจ้งลูกค้า
 *
 * idempotent: จองแถวด้วย `UPDATE ... WHERE status = 'paid'` — คืนเงินที่ระบบเราเป็นคนคืนเอง
 * (สถานะเป็น refunded อยู่แล้ว) หรือ event ซ้ำ จะได้ changes = 0 แล้วไม่ทำอะไร
 * ⚠️ คืนบางส่วน (partial) ไม่ถอนอัตโนมัติ — ต้องตัดสินใจเป็นราย ๆ ไป (แจ้งผ่านสถิติ)
 */
export type GatewayRefundResult = "credits_revoked" | "booking_cancelled" | "marked_refunded" | "already";

export async function applyGatewayRefund(paymentId: string): Promise<GatewayRefundResult> {
  const db = await getAppDB();
  const claim = await db
    .prepare("UPDATE payments SET status = 'refunded', refund_due = 0, updated_at = ? WHERE id = ? AND status = 'paid'")
    .bind(Date.now(), paymentId)
    .run();
  if ((claim.meta?.changes ?? 0) === 0) return "already";

  const row = await db
    .prepare(
      `SELECT id, order_id, booking_id, user_id, ticket_id, amount_satang, currency, status, provider
         FROM payments WHERE id = ? LIMIT 1`
    )
    .bind(paymentId)
    .first<PaymentRowForGrant>();
  if (!row) return "marked_refunded";

  if (row.ticket_id) {
    const now = Date.now();
    const res = await db
      .prepare("UPDATE queue_tickets SET status = 'cancelled' WHERE id = ? AND status IN ('pending_payment', 'waiting', 'ready')")
      .bind(row.ticket_id)
      .run();
    await db
      .prepare(
        `UPDATE bookings SET status = CASE WHEN status IN ('reserved', 'confirmed') THEN 'cancelled' ELSE status END,
                cancelled_at = COALESCE(cancelled_at, ?), cancelled_by = COALESCE(cancelled_by, 'system'), refund_status = 'refunded'
          WHERE ticket_id = ?`
      )
      .bind(now, row.ticket_id)
      .run();
    recordEvent("consultation_refunded_outside");
    if ((res.meta?.changes ?? 0) > 0) {
      await sendBookingCancelled(row.ticket_id, "system", "refunded");
      return "booking_cancelled";
    }
    return "marked_refunded";
  }

  const orderId = orderIdOfPaymentRow(row);
  if (row.user_id && orderId) {
    await db
      .prepare("UPDATE user_bonus SET granted = 0 WHERE user_id = ? AND reason = ?")
      .bind(row.user_id, purchaseGrantReason(orderId))
      .run();
    recordEvent("purchase_refund_revoked");
    return "credits_revoked";
  }
  return "marked_refunded";
}

/**
 * ซิงก์ย้อนหลัง (ปุ่มในแผงแอดมิน) — ไล่ถาม Stripe ทีละรายการว่ารายการที่เรายังถือว่า "จ่ายแล้ว" ถูกคืนเงินไปหรือยัง
 * ใช้เก็บกวาดการคืนเงินที่เกิดก่อนเว็บฟัง event คืนเงิน หรือ webhook ที่หล่นหาย
 */
export async function syncGatewayRefunds(limit = 100): Promise<{ checked: number; applied: number; partial: number; unreachable: number }> {
  const db = await getAppDB();
  const { results } = await db
    .prepare(
      "SELECT id, provider_ref FROM payments WHERE status = 'paid' AND provider = 'stripe' AND provider_ref LIKE 'cs_%' ORDER BY updated_at DESC LIMIT ?"
    )
    .bind(limit)
    .all<{ id: string; provider_ref: string }>();
  const out = { checked: 0, applied: 0, partial: 0, unreachable: 0 };
  for (const p of results || []) {
    out.checked++;
    const state = await retrieveRefundState(p.provider_ref);
    if (!state) {
      out.unreachable++;
      continue;
    }
    if (state.fullyRefunded) {
      if ((await applyGatewayRefund(p.id)) !== "already") out.applied++;
    } else if (state.partiallyRefunded) {
      out.partial++;
    }
  }
  return out;
}
