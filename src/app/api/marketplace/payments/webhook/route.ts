import { NextResponse } from "next/server";
import {
  findCheckoutSessionByPaymentIntent,
  parseRefundEvent,
  parseWebhookEvent,
  retrieveRefundState,
  verifyWebhookSignature,
} from "@/lib/marketplace/payment-gateway";
import { applyGatewayRefund } from "@/lib/marketplace/refund-sync";
import { updatePaymentStatus } from "@/lib/marketplace/payments.repo";
import { handleFailedConsultationPayment, settleConsultationPayment } from "@/lib/marketplace/booking.repo";
import { getAppDB } from "@/lib/platform/db";
import { getCreditPackageById } from "@/lib/entitlement/packages";
import { grantStudioPass, isStudioPassOrder } from "@/lib/studio/plan";
import { grantBonus } from "@/lib/entitlement/entitlement";
import {
  decidePurchaseGrant,
  orderIdOfPaymentRow,
  type PaymentRowForGrant,
} from "@/lib/entitlement/purchase";

export const runtime = "nodejs";

/**
 * POST /api/marketplace/payments/webhook - รับ Webhook ยืนยันการชำระเงินจาก Stripe
 *
 * ตั้งใน Stripe Dashboard ➔ Developers ➔ Webhooks ให้ส่ง 4 event นี้มาที่เส้นนี้:
 * `checkout.session.completed` · `checkout.session.async_payment_succeeded`
 * `checkout.session.async_payment_failed` · `checkout.session.expired` · `charge.refunded` (คืนเงิน)
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    // ต้องตรวจกับ body ดิบ "ก่อน" parse เสมอ — JSON.stringify ซ้ำได้สตริงคนละตัว ลายเซ็นจะไม่ตรง
    const signature = request.headers.get("stripe-signature");

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

    /*
     * 💸 คืนเงิน (`charge.refunded`) — คืนจากแดชบอร์ด Stripe หรือจากระบบเราเอง
     * หา Checkout Session ของรายการ ➔ ถาม Stripe ซ้ำว่าคืนเต็มจำนวนจริง ➔ ถอนรอบดูดวง/ยกเลิกนัด
     * (ตั้งใน Stripe Dashboard ➔ Webhooks ให้ส่ง `charge.refunded` มาที่เส้นนี้ด้วย)
     */
    const refund = parseRefundEvent(payload);
    if (refund) {
      if (!refund.fullyRefunded) {
        return NextResponse.json({ received: true, note: "Partial refund — handle manually" });
      }
      const sessionId = await findCheckoutSessionByPaymentIntent(refund.paymentIntent);
      if (!sessionId) return NextResponse.json({ received: true, note: "Session not found" });
      const state = await retrieveRefundState(sessionId);
      // ถาม Stripe ไม่ได้ = ตอบ 500 ให้ Stripe ยิงซ้ำ (ห้ามเดาว่าคืนแล้ว/ไม่คืน)
      if (!state) return NextResponse.json({ error: "ยืนยันสถานะคืนเงินไม่ได้" }, { status: 500 });
      if (!state.fullyRefunded) return NextResponse.json({ received: true, note: "Not fully refunded" });
      const db = await getAppDB();
      const row = await db
        .prepare("SELECT id FROM payments WHERE provider_ref = ? AND provider = 'stripe' LIMIT 1")
        .bind(sessionId)
        .first<{ id: string }>();
      if (!row) return NextResponse.json({ received: true, note: "Charge not found in active records" });
      const result = await applyGatewayRefund(row.id);
      return NextResponse.json({ received: true, status: result });
    }

    const event = parseWebhookEvent(payload);
    if (!event) {
      // event ชนิดอื่นที่เราไม่ได้ใช้ — ตอบ 2xx ไม่งั้น Stripe จะยิงซ้ำไปเรื่อย ๆ
      return NextResponse.json({ received: true, note: "Event ignored" });
    }
    const chargeId = event.chargeId;

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
           FROM payments WHERE provider_ref = ? AND provider = 'stripe' LIMIT 1`
      )
      .bind(chargeId)
      .first<PaymentRowForGrant>();

    if (!paymentRow) {
      // Return 200 to acknowledge webhook even if event is for untracked charge
      return NextResponse.json({ received: true, note: "Charge not found in active records" });
    }

    // ยอดที่ Stripe เก็บได้จริงต้องตรงกับแถวของเรา — ไม่ตรง = ไม่แจกอะไรทั้งนั้น
    if (
      event.outcome === "paid" &&
      (event.charge.amountSatang !== Number(paymentRow.amount_satang) || event.charge.currency !== paymentRow.currency)
    ) {
      console.error("[Payment Webhook] ยอดเงินจาก Stripe ไม่ตรงกับรายการ", { chargeId });
      return NextResponse.json({ received: true, note: "Amount mismatch" });
    }

    /*
     * 📅 ค่าปรึกษาแม่หมอ (แถวมี ticket_id) ➔ จุดเดียวที่เปลี่ยน "เงินเข้า" เป็น "ได้นัด"
     * ที่นั่งหลุด/จ่ายซ้ำ/ยกเลิกไปก่อน ➔ settle คืนเงินให้เองอัตโนมัติ (เงินเข้าแล้วต้องจบที่นัดหรือเงินคืนเสมอ)
     * คืนเงินไม่สำเร็จ = ตอบ 500 ให้ Stripe ยิงซ้ำ (refund ใช้กุญแจกันซ้ำ เรียกกี่รอบก็คืนครั้งเดียว)
     */
    if (paymentRow.ticket_id) {
      if (event.outcome === "paid") {
        const state = await settleConsultationPayment(paymentRow.id, { webhookLog: rawBody, email: event.charge.email });
        if (state === "refund_failed") {
          return NextResponse.json({ error: "คืนเงินไม่สำเร็จ", state }, { status: 500 });
        }
        return NextResponse.json({ received: true, status: state });
      }
      if (event.outcome === "failed") {
        await handleFailedConsultationPayment(paymentRow.id, rawBody);
      }
      return NextResponse.json({ received: true, status: "processed" });
    }

    if (event.outcome === "paid") {
      await updatePaymentStatus(paymentRow.id, "paid", {
        providerRef: chargeId,
        webhookLog: rawBody,
      });

      // 🎫 บัตรผ่านสตูดิโอแม่หมอ (`stp_...`) — ให้วันครั้งเดียวต่อคำสั่งซื้อ · เขียนไม่ลง = 500 ให้ Stripe ยิงซ้ำ
      const passOrderId = orderIdOfPaymentRow(paymentRow);
      if (isStudioPassOrder(passOrderId)) {
        const granted = await grantStudioPass(passOrderId!);
        if (granted === "failed") {
          return NextResponse.json({ error: "บันทึกแพ็กเกจ AI ช่วยเขียนไม่สำเร็จ", orderId: passOrderId }, { status: 500 });
        }
        return NextResponse.json({ received: true, status: "paid", studioPass: granted });
      }

      // 💎 เติมโควตาเปิดไพ่ให้ทันทีที่การชำระเงินได้รับการยืนยันจากเกตเวย์
      // ---------------------------------------------------------------------
      // ที่นี่คือ "จุดเดียวที่พิสูจน์การจ่ายเงินได้จริง" เพราะผ่านการตรวจลายเซ็นมาแล้ว
      // ทำที่นี่ด้วย (ไม่รอ return_uri) เพราะผู้ใช้อาจปิดเบราว์เซอร์หลังจ่ายเงิน
      // แล้วไม่เคยกลับมาที่ `/api/entitlement/checkout/confirm` เลย
      // grantBonus เป็น idempotent ต่อ (user_id, reason) จึงเรียกซ้ำได้ปลอดภัย
      const buyerId = event.charge.metadata.userId ?? "";
      const boughtPackageId = event.charge.metadata.packageId ?? "";
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

    } else if (event.outcome === "failed" && paymentRow.status !== "paid") {
      // ห้ามลดรายการที่จ่ายแล้วกลับเป็น failed (event มาไม่เรียงลำดับได้)
      await updatePaymentStatus(paymentRow.id, "failed", {
        providerRef: chargeId,
        webhookLog: rawBody,
      });
    }

    return NextResponse.json({ received: true, status: event.outcome === "paid" ? "paid" : "processed" });
  } catch (err) {
    console.error("[API Payment Webhook Error]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการประมวลผล Webhook" }, { status: 500 });
  }
}
