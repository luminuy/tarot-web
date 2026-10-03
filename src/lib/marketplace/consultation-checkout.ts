import { CONSULTATION_MINUTES } from "@/lib/marketplace/offer";
import { CHECKOUT_EXPIRES_MINUTES, formatSlotRange, HOLD_MINUTES } from "@/lib/marketplace/booking-policy";
import type { BookingRecord } from "@/lib/marketplace/booking.repo";
import { createGatewayCharge } from "@/lib/marketplace/payment-gateway";
import { CONSULTATION_PRICE_SATANG, createPaymentRecord } from "@/lib/marketplace/payments.repo";
import { getAppDB } from "@/lib/platform/db";
import { resolveAppOrigin } from "@/lib/security/app-origin";

/** เปิดหน้าจ่ายเงินซ้ำได้ไม่เกินกี่ครั้งต่อการจอง (กันถือที่นั่งไว้ไม่จบด้วยการกด "จ่ายต่อ" วนไป) */
export const MAX_CHECKOUTS_PER_BOOKING = 3;

/**
 * 💳 เปิดหน้าจ่ายเงิน Stripe สำหรับการจองหนึ่งใบ + บันทึกแถว payments (pending)
 * ---------------------------------------------------------------------------
 * - ราคามาจากค่าคงที่ฝั่งเซิร์ฟเวอร์เท่านั้น (`CONSULTATION_PRICE_SATANG`)
 * - ปลายทางกลับเป็น origin ของเราเอง (ไม่รับ return_uri จากไคลเอนต์)
 * - หน้าจ่ายหมดอายุ 31 นาที และต่อเวลากันที่ให้ยาวกว่านั้นเสมอ (`HOLD_MINUTES`)
 *   ➔ Stripe รับเงินหลังหน้าจ่ายหมดอายุไม่ได้ ที่นั่งจึงยังเป็นของลูกค้าตอนเงินเข้า
 * - `Idempotency-Key` ผูกกับใบจอง + ลำดับครั้ง — กดซ้ำ/เน็ตหลุดแล้วยิงใหม่ไม่ได้หน้าจ่ายสองใบ
 */
export async function openConsultationCheckout(input: {
  request: Request;
  ticketId: string;
  readerId: string;
  readerName: string;
  booking: BookingRecord;
  attempt: number;
}): Promise<{ checkoutUrl: string; paymentId: string }> {
  const { request, ticketId, readerId, readerName, booking, attempt } = input;
  const now = Date.now();
  const db = await getAppDB();

  // ต่อเวลากันที่ให้คลุมอายุหน้าจ่ายใบใหม่ (เฉพาะที่ยังกันอยู่และยังไม่หมดเวลา)
  await db
    .prepare("UPDATE bookings SET hold_expires_at = ? WHERE id = ? AND status = 'reserved' AND hold_expires_at >= ?")
    .bind(now + HOLD_MINUTES * 60_000, booking.id, now)
    .run();

  const origin = resolveAppOrigin(request);
  const queueUri = `${origin}/readers/queue/${encodeURIComponent(ticketId)}`;
  const scheduled = booking.kind === "scheduled";
  const charge = await createGatewayCharge({
    amountSatang: CONSULTATION_PRICE_SATANG,
    currency: "THB",
    description: scheduled
      ? `ปรึกษา ${readerName} · ${formatSlotRange(booking.slotStart)}`
      : `ปรึกษา ${readerName} · คิวสดตอนนี้`,
    productDescription: `ตัวต่อตัว ${CONSULTATION_MINUTES} นาที · วิดีโอคอลในเว็บ หรือ LINE`,
    submitMessage: scheduled
      ? "ยกเลิกหรือเลื่อนนัดก่อนเวลานัด 24 ชั่วโมง คืนเงินเต็มจำนวน"
      : "ยกเลิกได้ระหว่างรอคิว คืนเงินเต็มจำนวน",
    returnUri: `${queueUri}?paid=1`,
    cancelUri: queueUri,
    referenceId: booking.id,
    locale: "th",
    metadata: { ticketId, bookingId: booking.id, readerId, kind: booking.kind },
    expiresAt: Math.floor(now / 1000) + CHECKOUT_EXPIRES_MINUTES * 60,
    idempotencyKey: `checkout_${booking.id}_${attempt}`,
  });

  const payment = await createPaymentRecord({
    bookingId: booking.id,
    ticketId,
    provider: charge.provider,
    providerRef: charge.chargeId,
    amountSatang: CONSULTATION_PRICE_SATANG,
    currency: "THB",
  });

  return { checkoutUrl: charge.authorizeUri || `${queueUri}?paid=1`, paymentId: payment.id };
}
