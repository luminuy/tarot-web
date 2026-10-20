import { NextResponse } from "next/server";
import { apiOk } from "@/lib/api/envelope";
import { z } from "zod";
import { getQueueTicketById, liveQueuePosition, toPublicTicket, type QueueTicket } from "@/lib/marketplace/queue.repo";
import {
  cancelConsultation,
  expireLapsedHold,
  getBookingByTicketId,
  listPaymentsForTicket,
  primaryPaidPayment,
  rescheduleBooking,
} from "@/lib/marketplace/booking.repo";
import { canReschedule, decideCancellation, paidGraceUntil, readerMissedRoom } from "@/lib/marketplace/booking-policy";
import { endCall, getRoomAttendance } from "@/lib/marketplace/call.repo";
import { DEFAULT_SUPPORT_EMAIL } from "@/lib/config/site";
import { getReaderById } from "@/lib/marketplace/readers.repo";
import { isTicketOwner } from "@/lib/marketplace/ticket-owner";
import { getReviewByTicketId } from "@/lib/marketplace/reviews.repo";
import { readerPriceThb } from "@/lib/marketplace/offer";
import { requireReader } from "@/lib/auth/reader-auth";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { isTurnConfigured, revokeTurnCredential } from "@/lib/marketplace/turn";
import { bookingAccessUrl } from "@/lib/marketplace/booking-mail";
import { isInviteTicket } from "@/lib/marketplace/invites.repo";

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
  // เวลาที่จ่ายสำเร็จ (updated_at ของรายการที่ paid) — ใช้ตัดสินช่วงผ่อนผัน 10 นาทีหลังจ่าย
  const paidAt = primaryPaidPayment(payments)?.updatedAt ?? null;
  const refunded = payments.some((p) => p.status === "refunded");
  const slotStart = booking.kind === "scheduled" ? booking.slotStart : null;
  const review = ticket.status === "handed_off" ? await getReviewByTicketId(ticket.id) : null;
  const room = ticket.status === "ready" ? await getRoomAttendance(ticket.id) : null;
  return {
    id: booking.id,
    kind: booking.kind,
    /** คะแนนที่ลูกค้าให้ไว้แล้ว (null = ยังไม่รีวิว) */
    reviewRating: review?.rating ?? null,
    canReview: ticket.status === "handed_off" && (booking.status === "done" || booking.status === "confirmed") && !review,
    status: booking.status,
    slotStart,
    slotEnd: booking.kind === "scheduled" ? booking.slotEnd : null,
    holdExpiresAt: booking.status === "reserved" ? booking.holdExpiresAt : null,
    rescheduleCount: booking.rescheduleCount,
    cancelledBy: booking.cancelledBy,
    refundStatus: booking.refundStatus ?? (refunded ? "refunded" : null),
    paid: paid || refunded,
    amountSatang: payments.find((p) => p.status === "paid" || p.status === "refunded")?.amountSatang ?? null,
    cancel: decideCancellation({
      actor: "customer",
      kind: ticket.kind,
      ticketStatus: ticket.status,
      paid,
      slotStart,
      nowMs,
      paidAt,
      readerMissedRoom: readerMissedRoom(room, nowMs),
    }),
    canReschedule: canReschedule({
      ticketStatus: ticket.status,
      slotStart,
      rescheduleCount: booking.rescheduleCount,
      nowMs,
      paidAt,
    }),
    /** ช่วงผ่อนผันหลังจ่ายหมดเมื่อไร (null = ไม่อยู่ในช่วง) — หน้าคิวบอกลูกค้าว่ายังยกเลิก/เลื่อนฟรีได้ถึงกี่โมง */
    graceUntil: ticket.status === "waiting" ? paidGraceUntil(paidAt, slotStart, nowMs) : null,
  };
}

async function loadOwnedTicket(request: Request, id: string): Promise<QueueTicket | null> {
  const ticket = await getQueueTicketById(id);
  return ticket && (await isTicketOwner(request, ticket)) ? ticket : null;
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

    const isOwner = await isTicketOwner(request, ticket);
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

    const booking = isOwner ? await buildBookingView(ticket, now) : null;
    // "คิวที่ N" คำนวณสดตามลำดับการจ่ายเงิน — ไม่ใช่ตัวเลขที่แช่ไว้ตอนจ่าย
    const position = await liveQueuePosition(ticket);
    return NextResponse.json({
      ticket: { ...toPublicTicket(ticket), position },
      reader: {
        id: reader.id,
        displayName: reader.displayName,
        avatarUrl: reader.avatarUrl,
        specialties: reader.specialties,
        priceThb: readerPriceThb(reader),
        // Protected lineUrl
        lineUrl: canAccessLine ? reader.lineUrl : null,
      },
      canAccessLine,
      booking,
      /**
       * ลิงก์นัดส่วนตัว (ลิงก์เซ็นชุดเดียวกับในอีเมลยืนยัน) — เปิดจากเบราว์เซอร์ไหน/เครื่องไหนก็เข้านัดนี้ได้
       * เบราว์เซอร์ในแอป LINE มีคุกกี้แยกจาก Safari/Chrome ลิงก์เปล่าจึงเปิดนอกแอปไม่เจอนัด (CONSULT_FLOW P6)
       * 🔒 **เจ้าของตั๋วเท่านั้น** — ห้ามส่งให้แม่หมอ: ลิงก์นี้แลกเป็นคุกกี้ `customerRef` ได้
       *    = เห็นทุกนัดของลูกค้าคนนั้น (บทเรียน A2-13)
       */
      accessUrl: isOwner ? await bookingAccessUrl(ticket.id, ticket.customerRef, booking?.slotStart ?? null) : null,
      // 📹 วิดีโอคอลตัวต่อตัว — เปิดเฉพาะตอนแม่หมอเรียกคิวแล้ว และตั้งค่า TURN ไว้แล้ว
      videoCallAvailable: ticket.status === "ready" && isTurnConfigured(),
      // ระบบวิดีโอคอลเปิดใช้อยู่ไหม (ยังไม่ถึงคิวก็รู้ได้) — ไม่เปิด = คุยทาง LINE อย่างเดียว
      // หน้าคิวใช้ตัดสินว่าต้องชวนลูกค้าที่เปิดในแอป LINE ออกไป Safari/Chrome ไหม (ในแอป LINE เปิดแชท LINE ได้ดีอยู่แล้ว)
      videoCallEnabled: isTurnConfigured(),
      // ✦ มาจากลิงก์ห้องส่วนตัวที่แม่หมอส่งให้ (migrations/0032) — หน้าคิวพูดว่า "รอแม่หมอรับเข้าห้อง" แทน "รอคิว"
      privateRoom: await isInviteTicket(ticket.id),
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
      const support = process.env.SUPPORT_EMAIL || DEFAULT_SUPPORT_EMAIL;
      const message =
        result.reason === "in_session"
          ? `แม่หมอเริ่มคุยกับคุณแล้ว ยกเลิกเองไม่ได้ ถ้าเข้าห้องแล้วไม่เจอแม่หมอ รอในห้องต่ออีกสักครู่ ครบ 15 นาทีจะยกเลิกและรับเงินคืนเต็มได้เอง หรือเขียนถึงทีมงานที่ ${support}`
          : result.reason === "changed"
            ? "สถานะคิวเพิ่งเปลี่ยน กรุณาโหลดหน้าใหม่แล้วลองอีกครั้ง"
            : "คิวนี้ปิดไปแล้ว";
      return NextResponse.json({ error: message }, { status: 409 });
    }
    // ยกเลิกระหว่างอยู่ในห้อง (แม่หมอไม่เข้าห้อง) ➔ ปิดห้องวิดีโอ + เพิกถอนรหัสผ่าน TURN ทันที
    if (ticket.status === "ready") {
      const users = await endCall(ticket.id, "customer");
      await Promise.all(users.map(revokeTurnCredential));
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
