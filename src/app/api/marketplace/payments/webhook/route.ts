import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/marketplace/payment-gateway";
import { updatePaymentStatus } from "@/lib/marketplace/payments.repo";
import { getAppDB } from "@/lib/platform/db";
import { getCreditPackageById } from "@/lib/entitlement/packages";
import { grantBonus } from "@/lib/entitlement/entitlement";
import {
  decidePurchaseGrant,
  orderIdOfPaymentRow,
  type PaymentRowForGrant,
} from "@/lib/entitlement/purchase";

export const runtime = "nodejs";

/**
 * POST /api/marketplace/payments/webhook - รับ Webhook ยืนยันการชำระเงินจาก Payment Gateway
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature =
      request.headers.get("x-omise-signature") ||
      request.headers.get("x-signature") ||
      request.headers.get("signature");

    // Verify webhook signature (Zero-Trust Security Guard)
    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json({ error: "ลายเซ็น Webhook ไม่ถูกต้อง (Invalid signature)" }, { status: 401 });
    }

    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "รูปแบบ JSON ของ Webhook ไม่ถูกต้อง" }, { status: 400 });
    }

    const data = (payload.data || payload) as Record<string, unknown>;
    const chargeId = (data.id || payload.chargeId) as string | undefined;
    const isPaid =
      data.status === "successful" ||
      payload.status === "paid" ||
      payload.event === "charge.complete";

    if (!chargeId) {
      return NextResponse.json({ error: "ไม่พบ charge id ใน Webhook payload" }, { status: 400 });
    }

    // Look up payment by providerRef (chargeId)
    const db = await getAppDB();
    /*
     * 🔴 R-08: ต้องดึง `order_id` · `currency` · `status` · `provider` · `user_id` มาด้วย
     * ของเดิมดึงแค่ 4 คอลัมน์แล้วประกอบกุญแจกันจ่ายซ้ำจาก `booking_id` ซึ่งเป็น NULL
     * สำหรับการเติมเครดิตทุกรายการ (เลขออร์เดอร์ย้ายไป `order_id` ตั้งแต่ migrations/0015)
     */
    const paymentRow = await db
      .prepare(
        `SELECT id, order_id, booking_id, user_id, ticket_id, amount_satang, currency, status, provider
           FROM payments WHERE provider_ref = ? LIMIT 1`
      )
      .bind(chargeId)
      .first<PaymentRowForGrant>();

    if (!paymentRow) {
      // Return 200 to acknowledge webhook even if event is for untracked charge
      return NextResponse.json({ received: true, note: "Charge not found in active records" });
    }

    if (isPaid) {
      await updatePaymentStatus(paymentRow.id, "paid", {
        providerRef: chargeId,
        webhookLog: rawBody,
      });

      // 💎 เติมโควตาเปิดไพ่ให้ทันทีที่การชำระเงินได้รับการยืนยันจากเกตเวย์
      // ---------------------------------------------------------------------
      // ที่นี่คือ "จุดเดียวที่พิสูจน์การจ่ายเงินได้จริง" เพราะผ่านการตรวจลายเซ็นมาแล้ว
      // ทำที่นี่ด้วย (ไม่รอ return_uri) เพราะผู้ใช้อาจปิดเบราว์เซอร์หลังจ่ายเงิน
      // แล้วไม่เคยกลับมาที่ `/api/entitlement/checkout/confirm` เลย
      // grantBonus เป็น idempotent ต่อ (user_id, reason) จึงเรียกซ้ำได้ปลอดภัย
      const metadata = (data.metadata ?? {}) as Record<string, unknown>;
      const buyerId = typeof metadata.userId === "string" ? metadata.userId : "";
      const boughtPackageId = typeof metadata.packageId === "string" ? metadata.packageId : "";
      const paidOrderId = orderIdOfPaymentRow(paymentRow);
      if (!paymentRow.ticket_id && buyerId && boughtPackageId) {
        /*
         * ตัดสินด้วยตรรกะก้อนเดียวกับ `checkout/confirm` — กุญแจกันจ่ายซ้ำจึงตรงกันเสมอ
         * (เส้นทางนี้เห็นสถานะ `paid` ที่เพิ่งเขียนไปเมื่อบรรทัดที่แล้ว จึงส่ง status: "paid")
         */
        const decision = decidePurchaseGrant({
          row: { ...paymentRow, user_id: paymentRow.user_id ?? buyerId, status: "paid" },
          pkg: getCreditPackageById(boughtPackageId),
          userId: buyerId,
          orderId: paidOrderId,
          allowSimulator: false,
        });

        if (!decision.ok) {
          console.warn("[Payment Webhook] ไม่แจกโควตา", { orderId: paidOrderId, code: decision.code });
        } else {
          // 🔴 T-04 · R-08: เขียนเครดิตไม่ลง = ต้องตอบไม่ใช่ 2xx ให้เกตเวย์ยิงซ้ำ
          // ของเดิมทิ้งค่าที่ grantBonus คืนมาแล้วตอบ 200 — "จ่ายแล้วแต่ของไม่ถึงมือ" เงียบสนิท
          const granted = await grantBonus(buyerId, decision.credits, decision.reason);
          if (!granted) {
            console.error("[Payment Webhook] จ่ายเงินสำเร็จแต่เขียนเครดิตไม่ลง", {
              buyerId,
              orderId: paidOrderId,
            });
            return NextResponse.json(
              { error: "บันทึกโควตาไม่สำเร็จ", orderId: paidOrderId },
              { status: 500 }
            );
          }
        }
      }

      // Advance ticket or booking status if associated
      if (paymentRow.ticket_id) {
        try {
          await db
            .prepare("UPDATE queue_tickets SET status = 'waiting' WHERE id = ? AND status = 'screening'")
            .bind(paymentRow.ticket_id)
            .run();
        } catch {
          // ignore
        }
      }
    } else if (data.status === "failed") {
      await updatePaymentStatus(paymentRow.id, "failed", {
        providerRef: chargeId,
        webhookLog: rawBody,
      });
    }

    return NextResponse.json({ received: true, status: isPaid ? "paid" : "processed" });
  } catch (err) {
    console.error("[API Payment Webhook Error]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการประมวลผล Webhook" }, { status: 500 });
  }
}
