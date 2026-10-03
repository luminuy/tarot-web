import { NextResponse } from "next/server";
import { apiOk } from "@/lib/api/envelope";
import { z } from "zod";

import {
  isStripeTestModeOnProduction,
  openGatewayCheckoutUrl,
  PAYMENTS_NOT_OPEN_MESSAGE,
} from "@/lib/marketplace/payment-gateway";
import { isPrivilegedTestRequest } from "@/lib/security/privileged";
import { isTicketOwner } from "@/lib/marketplace/ticket-owner";
import { readerPriceThb } from "@/lib/marketplace/offer";
import { getQueueTicketById } from "@/lib/marketplace/queue.repo";
import { getReaderById } from "@/lib/marketplace/readers.repo";
import { expireLapsedHold, getBookingByTicketId, listPaymentsForTicket } from "@/lib/marketplace/booking.repo";
import { MAX_CHECKOUTS_PER_BOOKING, openConsultationCheckout } from "@/lib/marketplace/consultation-checkout";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from "@/lib/utils/rate-limit";

export const runtime = "nodejs";

// ⚠️ ทั้ง `amountSatang` และ `returnUri` ถูกถอดออกจากสัญญาฝั่งไคลเอนต์โดยตั้งใจ
//    ราคา = ค่าคงที่ฝั่งเซิร์ฟเวอร์ (กันตั้งราคาเอง) · ปลายทาง redirect = origin ของเราเอง
//    (กันส่งผู้ใช้ออกไปหน้าฟิชชิงหลังจ่ายเงินผ่าน return_uri ที่ผู้โจมตีกำหนด)
//    ความเป็นเจ้าของตั๋วอ่านจากคุกกี้ที่เราเซ็นเองเท่านั้น (ไม่รับ customerRef จาก body — A2-13)
//    เพื่อกันคนนอกเปิดรายการชำระเงินทับตั๋วของคนอื่น
const CreatePaymentSchema = z.object({
  ticketId: z.string().min(1, "กรุณาระบุ ticketId"),
});

/**
 * POST /api/marketplace/payments — "จ่ายต่อ" สำหรับการจองที่ยังรอจ่ายเงิน (ลูกค้ากดย้อนกลับจากหน้า Stripe)
 * ---------------------------------------------------------------------------
 * - หน้าจ่ายเดิมยังเปิดอยู่ ➔ ส่งลิงก์เดิมกลับไป (ไม่สร้างใบใหม่ = ไม่มีทางจ่ายซ้อนสองใบ)
 * - หน้าจ่ายเดิมหมดอายุแต่ยังกันที่อยู่ ➔ เปิดใบใหม่ (ไม่เกิน 3 ครั้งต่อการจอง)
 * - ที่นั่งหลุดแล้ว ➔ 409 ให้เลือกเวลาใหม่
 * การจองใหม่ทั้งหมดเริ่มที่ `POST /api/marketplace/tickets` (กันที่ + เปิดหน้าจ่ายในคำขอเดียว)
 */
export async function POST(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึงจากภายนอก" }, { status: 403 });
  }

  const clientId = getClientIdentifier(request);
  const limit = checkRateLimit(`mkt_pay:${clientId}`, {
    maxRequests: 10,
    windowSeconds: 600,
  });
  if (!limit.allowed) {
    return createRateLimitResponse(
      limit.retryAfterSeconds,
      "คุณทำรายการชำระเงินบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่นะ"
    );
  }

  // คีย์ทดสอบบนเว็บจริง = เปิดให้เฉพาะผู้ทดสอบ (บัตร 4242 ห้ามได้คิวแม่หมอฟรี)
  if (isStripeTestModeOnProduction() && !(await isPrivilegedTestRequest(request))) {
    return NextResponse.json({ error: PAYMENTS_NOT_OPEN_MESSAGE }, { status: 503 });
  }

  try {
    const parsed = CreatePaymentSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    const { ticketId } = parsed.data;

    // ต้องเป็นตั๋วของผู้ขอเองเท่านั้น (คุกกี้ที่เราเซ็นเอง)
    const ticket = await getQueueTicketById(ticketId);
    if (!ticket || !(await isTicketOwner(request, ticket))) {
      return NextResponse.json({ error: "ไม่พบตั๋วคิวที่ระบุ" }, { status: 404 });
    }
    if (ticket.status !== "pending_payment") {
      return NextResponse.json({ error: "การจองนี้ไม่ได้รอชำระเงินแล้ว" }, { status: 409 });
    }
    if (await expireLapsedHold(ticket)) {
      return NextResponse.json(
        { error: "หมดเวลาชำระเงิน ระบบปล่อยเวลานี้แล้ว กรุณาจองใหม่", code: "hold_expired" },
        { status: 409 }
      );
    }
    const booking = await getBookingByTicketId(ticketId);
    const reader = await getReaderById(ticket.readerId);
    if (!booking || booking.status !== "reserved" || !reader) {
      return NextResponse.json({ error: "ไม่พบการจองที่รอชำระเงิน" }, { status: 404 });
    }

    const payments = await listPaymentsForTicket(ticketId);
    const pending = payments.filter((p) => p.status === "pending");
    for (const p of [...pending].reverse()) {
      const url = p.providerRef ? await openGatewayCheckoutUrl(p.providerRef) : null;
      if (url) return apiOk({ checkoutUrl: url });
    }
    if (payments.length >= MAX_CHECKOUTS_PER_BOOKING) {
      return NextResponse.json(
        { error: "เปิดหน้าชำระเงินครบจำนวนครั้งแล้ว กรุณายกเลิกแล้วจองใหม่" },
        { status: 429 }
      );
    }

    const { checkoutUrl } = await openConsultationCheckout({
      request,
      ticketId,
      readerId: reader.id,
      readerName: reader.displayName,
      booking,
      attempt: payments.length + 1,
      priceThb: readerPriceThb(reader),
      customerEmail: booking.contactEmail,
    });
    return apiOk({ checkoutUrl });
  } catch (err) {
    console.error("[API Payments POST Error]", err);
    return NextResponse.json({ error: "เปิดหน้าชำระเงินไม่สำเร็จ ยังไม่มีการตัดเงิน กรุณาลองใหม่" }, { status: 500 });
  }
}
