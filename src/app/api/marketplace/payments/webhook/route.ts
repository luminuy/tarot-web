import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/marketplace/payment-gateway";
import { updatePaymentStatus } from "@/lib/marketplace/payments.repo";
import { getAppDB } from "@/lib/platform/db";
import { getCreditPackageById } from "@/lib/entitlement/packages";
import { grantBonus } from "@/lib/entitlement/entitlement";

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
    const paymentRow = await db
      .prepare(
        "SELECT id, booking_id, ticket_id, amount_satang FROM payments WHERE provider_ref = ? LIMIT 1"
      )
      .bind(chargeId)
      .first<{ id: string; booking_id: string; ticket_id: string | null; amount_satang: number }>();

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
      if (!paymentRow.ticket_id && buyerId && boughtPackageId) {
        const pkg = getCreditPackageById(boughtPackageId);
        // ยอดเงินที่บันทึกไว้ต้องตรงกับราคาแพ็กเกจฝั่งเซิร์ฟเวอร์ ไม่งั้นไม่แจก
        if (pkg && Number(paymentRow.amount_satang) === pkg.amountSatang) {
          await grantBonus(buyerId, pkg.credits, `purchase_${paymentRow.booking_id}`);
        } else {
          console.warn(
            "[Payment Webhook] ยอดเงินไม่ตรงกับแพ็กเกจ — ไม่แจกโควตา",
            paymentRow.booking_id
          );
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
