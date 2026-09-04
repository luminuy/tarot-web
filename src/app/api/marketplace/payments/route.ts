import { NextResponse } from "next/server";
import { z } from "zod";

import { createGatewayCharge } from "@/lib/marketplace/payment-gateway";
import {
  CONSULTATION_PRICE_SATANG,
  createPaymentRecord,
  getPaymentByTicketId,
} from "@/lib/marketplace/payments.repo";
import { getQueueTicketById } from "@/lib/marketplace/queue.repo";
import { getReaderById } from "@/lib/marketplace/readers.repo";
import { getAppDB } from "@/lib/platform/db";
import { resolveAppOrigin } from "@/lib/security/app-origin";

export const runtime = "nodejs";

// ⚠️ ทั้ง `amountSatang` และ `returnUri` ถูกถอดออกจากสัญญาฝั่งไคลเอนต์โดยตั้งใจ
//    ราคา = ค่าคงที่ฝั่งเซิร์ฟเวอร์ (กันตั้งราคาเอง) · ปลายทาง redirect = origin ของเราเอง
//    (กันส่งผู้ใช้ออกไปหน้าฟิชชิงหลังจ่ายเงินผ่าน return_uri ที่ผู้โจมตีกำหนด)
//    `customerRef` บังคับใส่ เพื่อกันคนนอกเปิดรายการชำระเงินทับตั๋วของคนอื่น
const CreatePaymentSchema = z.object({
  ticketId: z.string().min(1, "กรุณาระบุ ticketId"),
  customerRef: z.string().min(6, "รหัสอ้างอิงอุปกรณ์ไม่ถูกต้อง"),
});

/**
 * POST /api/marketplace/payments - สร้างรายการชำระเงินสำหรับคิวรับคำปรึกษา
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = CreatePaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { ticketId, customerRef } = parsed.data;
    const amountSatang = CONSULTATION_PRICE_SATANG;

    // 1. Verify Ticket + ต้องเป็นตั๋วของผู้ขอเองเท่านั้น
    const ticket = await getQueueTicketById(ticketId);
    if (!ticket) {
      return NextResponse.json({ error: "ไม่พบตั๋วคิวที่ระบุ" }, { status: 404 });
    }
    if (ticket.customerRef !== customerRef) {
      return NextResponse.json({ error: "ไม่พบตั๋วคิวที่ระบุ" }, { status: 404 });
    }

    const reader = await getReaderById(ticket.readerId);
    if (!reader) {
      return NextResponse.json({ error: "ไม่พบข้อมูลแม่หมอสำหรับคิวนี้" }, { status: 404 });
    }

    // 2. Check if already has a payment
    const existing = await getPaymentByTicketId(ticketId);
    if (existing && existing.status === "paid") {
      return NextResponse.json({
        success: true,
        message: "คิวนี้ได้รับการชำระเงินเรียบร้อยแล้ว",
        payment: existing,
      });
    }

    // 3. Ensure Booking record exists
    const db = await getAppDB();
    let bookingId = `book_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const now = Date.now();

    const existingBooking = await db
      .prepare("SELECT id FROM bookings WHERE ticket_id = ? LIMIT 1")
      .bind(ticketId)
      .first<{ id: string }>();

    if (existingBooking) {
      bookingId = existingBooking.id;
    } else {
      await db
        .prepare(
          `INSERT INTO bookings (
            id, ticket_id, reader_id, slot_start, slot_end, status, created_at
          ) VALUES (?, ?, ?, ?, ?, 'reserved', ?)`
        )
        .bind(
          bookingId,
          ticketId,
          ticket.readerId,
          ticket.slotStart || now,
          (ticket.slotStart || now) + 30 * 60 * 1000,
          now
        )
        .run();
    }

    // 4. Create Gateway Charge
    const defaultReturnUri = `${resolveAppOrigin(request)}/readers/queue/${encodeURIComponent(ticketId)}?paid=1`;
    const charge = await createGatewayCharge({
      amountSatang,
      currency: "THB",
      description: `ปรึกษาดวงชะตากับ ${reader.displayName} (คิว #${ticket.position || 1})`,
      returnUri: defaultReturnUri,
      metadata: { ticketId, bookingId, readerId: reader.id },
    });

    // 5. Save Payment Record
    const payment = await createPaymentRecord({
      bookingId,
      ticketId,
      provider: "omise",
      providerRef: charge.chargeId,
      amountSatang,
      currency: "THB",
    });

    return NextResponse.json({
      success: true,
      payment,
      charge,
      checkoutUrl: charge.authorizeUri || defaultReturnUri,
      isTestMode: charge.isTestMode,
    });
  } catch (err) {
    console.error("[API Payments POST Error]", err);
    return NextResponse.json({ error: "ไม่สามารถสร้างรายการชำระเงินได้" }, { status: 500 });
  }
}
