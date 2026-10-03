import { NextResponse } from "next/server";
import { z } from "zod";

import { listPaymentsForTicket, settleConsultationPayment } from "@/lib/marketplace/booking.repo";
import { isTicketOwner } from "@/lib/marketplace/ticket-owner";
import { retrieveGatewayCharge } from "@/lib/marketplace/payment-gateway";
import { getQueueTicketById } from "@/lib/marketplace/queue.repo";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { checkRateLimit, createRateLimitResponse, getClientIdentifier } from "@/lib/utils/rate-limit";

export const runtime = "nodejs";

const ConfirmSchema = z.object({
  ticketId: z.string().min(1),
  /** ตัวจำลอง (เครื่องพัฒนาเท่านั้น) — เลขรายการที่ตัวจำลองต่อท้าย return_uri */
  testChargeId: z.string().max(80).optional(),
});

/**
 * POST /api/marketplace/payments/confirm — ลูกค้ากลับจากหน้าจ่ายเงิน Stripe (`?paid=1`)
 * ---------------------------------------------------------------------------
 * ⚠️ การถูกเรียกปลายทางนี้ **ไม่ใช่หลักฐานการจ่ายเงิน** (ใครก็พิมพ์ `?paid=1` เองได้)
 * เซิร์ฟเวอร์ถาม Stripe เองด้วยคีย์ลับ แล้วยอมรับเฉพาะเมื่อ ยอด · สกุลเงิน · เลขตั๋ว ตรงกับแถวของเราทุกตัว
 * ทำไมต้องมีทั้งที่มี webhook: บัตรจ่ายเสร็จแล้ว Stripe พากลับมาทันที webhook มักตามมาทีหลังไม่กี่วินาที
 * ถ้ารอ webhook อย่างเดียว ลูกค้าจะเห็น "รอชำระเงิน" ทั้งที่จ่ายแล้ว
 *
 * ตัวจำลอง (`provider = simulator`) ผ่านได้เฉพาะนอก production
 */
export async function POST(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึงจากภายนอก" }, { status: 403 });
  }
  const limit = checkRateLimit(`mkt_pay_confirm:${getClientIdentifier(request)}`, { maxRequests: 30, windowSeconds: 600 });
  if (!limit.allowed) {
    return createRateLimitResponse(limit.retryAfterSeconds, "ตรวจสอบการชำระเงินบ่อยเกินไป กรุณารอสักครู่");
  }

  try {
    const parsed = ConfirmSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    const { ticketId, testChargeId } = parsed.data;

    const ticket = await getQueueTicketById(ticketId);
    if (!ticket || !(await isTicketOwner(request, ticket))) {
      return NextResponse.json({ error: "ไม่พบตั๋วคิวที่ระบุ" }, { status: 404 });
    }

    const payments = await listPaymentsForTicket(ticketId);
    if (payments.some((p) => p.status === "paid")) {
      return NextResponse.json({ status: "confirmed" });
    }

    for (const payment of payments.filter((p) => p.status === "pending" || p.status === "failed")) {
      let verified = false;
      let email: string | null = null;
      if (payment.provider === "simulator") {
        verified =
          process.env.NODE_ENV !== "production" && Boolean(testChargeId) && testChargeId === payment.providerRef;
      } else if (payment.provider === "stripe" && payment.providerRef) {
        const charge = await retrieveGatewayCharge(payment.providerRef);
        verified =
          charge?.status === "paid" &&
          charge.amountSatang === payment.amountSatang &&
          charge.currency === payment.currency &&
          charge.metadata.ticketId === ticketId;
        email = charge?.email ?? null;
      }
      if (!verified) continue;
      const state = await settleConsultationPayment(payment.id, { email });
      return NextResponse.json({ status: state === "already" ? "confirmed" : state });
    }

    // ยังไม่จ่าย / PromptPay ที่ยังรอธนาคารยืนยัน ➔ หน้าคิวถามสถานะต่อเอง webhook จะตามมา
    return NextResponse.json({ status: "pending" });
  } catch (err) {
    console.error("[API Payments Confirm Error]", err);
    return NextResponse.json({ error: "ตรวจสอบการชำระเงินไม่สำเร็จ" }, { status: 500 });
  }
}
