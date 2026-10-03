import { NextResponse } from "next/server";
import { apiOk } from "@/lib/api/envelope";
import { z } from "zod";
import { getQueueTicketById, toPublicTicket, type QueueTicket } from "@/lib/marketplace/queue.repo";
import {
  cancelConsultation,
  expireLapsedHold,
  getBookingByTicketId,
  listPaymentsForTicket,
  rescheduleBooking,
} from "@/lib/marketplace/booking.repo";
import { canReschedule, decideCancellation } from "@/lib/marketplace/booking-policy";
import { getReaderById } from "@/lib/marketplace/readers.repo";
import { readCustomerRefFromCookie } from "@/lib/marketplace/customer-ref";
import { requireReader } from "@/lib/auth/reader-auth";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { isTurnConfigured } from "@/lib/marketplace/turn";

export const runtime = "nodejs";

/**
 * ภาพรวมการจอง/การจ่ายเงินของตั๋ว สำหรับหน้าคิวของลูกค้า
 * นโยบาย (ยกเลิกได้ไหม · ได้เงินคืนไหม · เลื่อนได้ไหม) คำนวณฝั่งเซิร์ฟเวอร์ด้วยฟังก์ชันเดียวกับที่บังคับจริง
 */
async function buildBookingView(ticket: QueueTicket, nowMs: number) {
  const booking = await getBookingByTicketId(ticket.id);
  if (!booking) return null;
  const payments = await listPaymentsForTicket(ticket.id);
  const paid = payments.some((p) => p.status === "paid");
  const refunded = payments.some((p) => p.status === "refunded");
  const slotStart = booking.kind === "scheduled" ? booking.slotStart : null;
  return {
    id: booking.id,
    kind: booking.kind,
    status: booking.status,
    slotStart,
    slotEnd: booking.kind === "scheduled" ? booking.slotEnd : null,
    holdExpiresAt: booking.status === "reserved" ? booking.holdExpiresAt : null,
    rescheduleCount: booking.rescheduleCount,
    cancelledBy: booking.cancelledBy,
    refundStatus: booking.refundStatus ?? (refunded ? "refunded" : null),
    paid: paid || refunded,
    amountSatang: payments.find((p) => p.status === "paid" || p.status === "refunded")?.amountSatang ?? null,
    cancel: decideCancellation({ actor: "customer", kind: ticket.kind, ticketStatus: ticket.status, paid, slotStart, nowMs }),
    canReschedule: canReschedule({
      ticketStatus: ticket.status,
      slotStart,
      rescheduleCount: booking.rescheduleCount,
      nowMs,
    }),
  };
}

async function loadOwnedTicket(request: Request, id: string): Promise<QueueTicket | null> {
  const customerRef = await readCustomerRefFromCookie(request);
  if (!customerRef) return null;
  const ticket = await getQueueTicketById(id);
  return ticket && ticket.customerRef === customerRef ? ticket : null;
}

/**
 * GET /api/marketplace/tickets/[id] - ดึงสถานะคิวล่าสุด (Poll)
 * 🔒 ป้องกันข้อมูลอ่อนไหวตาม PDPA: ต้องเป็นเจ้าของตั๋ว (ตรงกับ Cookie) หรือเป็นแม่หมอเจ้าของคิวเท่านั้น
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    let ticket = await getQueueTicketById(id);
    if (!ticket) {
      return NextResponse.json({ error: "ไม่พบตั๋วคิวที่ระบุ" }, { status: 404 });
    }

    const customerRef = await readCustomerRefFromCookie(request);
    const isOwner = Boolean(customerRef) && ticket.customerRef === customerRef;
    const readerAuth = await requireReader(request);
    const isReader = readerAuth.success && readerAuth.readerId === ticket.readerId;

    if (!isOwner && !isReader) {
      // ⚠️ ตอบ 404 ไม่ใช่ 403 — ไม่ให้ยืนยันว่า ticket id นี้มีอยู่จริง (Zero Info Leakage)
      return NextResponse.json({ error: "ไม่พบตั๋วคิวที่ระบุ" }, { status: 404 });
    }

    const reader = await getReaderById(ticket.readerId);
    if (!reader) {
      return NextResponse.json({ error: "ไม่พบข้อมูลแม่หมอสำหรับคิวนี้" }, { status: 404 });
    }

    // รอจ่ายเงินจนเลยเวลากันที่ ➔ ปิดเป็นหมดเวลาให้เห็นทันที (ไม่ต้องมี cron)
    const now = Date.now();
    if (await expireLapsedHold(ticket, now)) {
      ticket = (await getQueueTicketById(id)) ?? ticket;
    }

    // Only reveal reader LINE link when status is 'ready' or 'handed_off' (Strict Zero-Leak Security)
    const canAccessLine = ticket.status === "ready" || ticket.status === "handed_off";

    return NextResponse.json({
      ticket: toPublicTicket(ticket),
      reader: {
        id: reader.id,
        displayName: reader.displayName,
        avatarUrl: reader.avatarUrl,
        specialties: reader.specialties,
        // Protected lineUrl
        lineUrl: canAccessLine ? reader.lineUrl : null,
      },
      canAccessLine,
      booking: isOwner ? await buildBookingView(ticket, now) : null,
      // 📹 วิดีโอคอลตัวต่อตัว — เปิดเฉพาะตอนแม่หมอเรียกคิวแล้ว และตั้งค่า TURN ไว้แล้ว
      videoCallAvailable: ticket.status === "ready" && isTurnConfigured(),
    });
  } catch (err) {
    console.error("[API Ticket GET ID Error]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการตรวจสอบสถานะคิว" }, { status: 500 });
  }
}

/**
 * DELETE /api/marketplace/tickets/[id] - ยกเลิกตั๋วคิว
 *
 * ⚠️ ต้องยืนยันตัวตนเจ้าของตั๋วผ่าน Signed Cookie
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึงจากภายนอก" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const ticket = await loadOwnedTicket(request, id);
    if (!ticket) {
      return NextResponse.json({ error: "ไม่พบตั๋วคิวที่ระบุ" }, { status: 404 });
    }

    const result = await cancelConsultation(ticket, "customer");
    if (!result.ok) {
      const message =
        result.reason === "in_session"
          ? "แม่หมอเริ่มคุยกับคุณแล้ว ยกเลิกเองไม่ได้ หากมีปัญหาแจ้งแม่หมอในห้องได้เลย"
          : result.reason === "changed"
            ? "สถานะคิวเพิ่งเปลี่ยน กรุณาโหลดหน้าใหม่แล้วลองอีกครั้ง"
            : "คิวนี้ปิดไปแล้ว";
      return NextResponse.json({ error: message }, { status: 409 });
    }
    const message =
      result.refundStatus === "refunded"
        ? "ยกเลิกแล้ว คืนเงินเต็มจำนวน เงินจะกลับเข้าช่องทางที่จ่ายภายใน 5–10 วันทำการ"
        : result.refundStatus === "failed"
          ? "ยกเลิกแล้ว ระบบคืนเงินขัดข้อง ทีมงานจะคืนเงินให้ภายใน 3 วันทำการ"
          : result.refundStatus === "none"
            ? "ยกเลิกนัดแล้ว (ยกเลิกน้อยกว่า 24 ชั่วโมงก่อนนัด จึงไม่มีการคืนเงิน)"
            : "ยกเลิกแล้ว ไม่มีการตัดเงิน";
    return NextResponse.json({ success: true, refundStatus: result.refundStatus, message });
  } catch (err) {
    console.error("[API Ticket DELETE Error]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการยกเลิกคิว" }, { status: 500 });
  }
}

const RescheduleSchema = z.object({ slotStart: z.number().int().positive() });

/**
 * PATCH /api/marketplace/tickets/[id] — เลื่อนนัด (เจ้าของตั๋วเท่านั้น · ก่อนนัด ≥ 24 ชม. · 1 ครั้ง)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึงจากภายนอก" }, { status: 403 });
  }
  const { id } = await params;
  try {
    const parsed = RescheduleSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "กรุณาเลือกเวลาใหม่" }, { status: 400 });
    }
    const ticket = await loadOwnedTicket(request, id);
    if (!ticket) {
      return NextResponse.json({ error: "ไม่พบตั๋วคิวที่ระบุ" }, { status: 404 });
    }
    const result = await rescheduleBooking(ticket, parsed.data.slotStart);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return apiOk({ slotStart: result.slotStart });
  } catch (err) {
    console.error("[API Ticket PATCH Error]", err);
    return NextResponse.json({ error: "เลื่อนนัดไม่สำเร็จ กรุณาลองใหม่" }, { status: 500 });
  }
}
