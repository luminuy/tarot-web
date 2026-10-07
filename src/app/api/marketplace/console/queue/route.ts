import { NextResponse } from "next/server";
import { z } from "zod";

import { requireReader } from "@/lib/auth/reader-auth";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { readerPriceThb } from "@/lib/marketplace/offer";
import { endCall } from "@/lib/marketplace/call.repo";
import { isTurnConfigured, revokeTurnCredential } from "@/lib/marketplace/turn";
import { isStudioEnabled } from "@/lib/studio/dpa";
import {
  getQueueTicketById,
  getReaderLiveAvailability,
  listReaderQueueTickets,
  setReaderLiveAvailability,
  toPublicTicket,
  updateTicketStatus,
} from "@/lib/marketplace/queue.repo";
import {
  cancelConsultation,
  completeBooking,
  getBookingByTicketId,
  getBlockedDates,
  getBookingsByTicketIds,
  getScheduleRules,
  isPaidBooking,
  markNoShow,
} from "@/lib/marketplace/booking.repo";
import { canMarkNoShow, canStartBooking, EARLY_START_MINUTES, NO_SHOW_GRACE_MINUTES } from "@/lib/marketplace/booking-policy";

export const runtime = "nodejs";

const PatchConsoleSchema = z.object({
  isLiveOpen: z.boolean().optional(),
  ticketId: z.string().optional(),
  action: z.enum(["accept", "handoff", "cancel", "no_show"]).optional(),
});

/**
 * GET /api/marketplace/console/queue - ดึงรายการคิวสำหรับแผงควบคุมแม่หมอ
 */
export async function GET(request: Request) {
  const auth = await requireReader(request);
  if (!auth.success) return auth.response;

  const { reader, readerId } = auth;
  try {
    const isLiveOpen = await getReaderLiveAvailability(readerId);
    // ตั๋วที่ยังไม่จ่าย (`pending_payment`) ไม่อยู่ในรายการนี้โดยตั้งใจ — แม่หมอเห็นเฉพาะคิว/นัดที่จ่ายแล้ว
    const tickets = await listReaderQueueTickets(readerId, {
      status: ["waiting", "ready", "screening"],
    });
    const schedule = await getScheduleRules(readerId);
    const bookings = await getBookingsByTicketIds(tickets.map((t) => t.id));

    return NextResponse.json({
      reader: {
        id: reader.id,
        displayName: reader.displayName,
        avatarUrl: reader.avatarUrl,
        specialties: reader.specialties,
        lineUrl: reader.lineUrl,
        commissionPct: reader.commissionPct,
      },
      isLiveOpen,
      // `paid` = ลูกค้าจ่ายแล้ว (ตั๋วยุคก่อนระบบจ่ายเงินเป็น false — แม่หมอเรียกคิวนั้นไม่ได้)
      tickets: tickets.map((t) => ({ ...toPublicTicket(t), paid: isPaidBooking(bookings.get(t.id)) })),
      totalWaiting: tickets.filter((t) => t.status === "waiting" && t.kind === "walkup").length,
      schedule,
      // ตั้งค่าการรับนัด (migrations/0021) — แม่หมอแก้เองได้ที่ PUT /api/marketplace/console/settings
      settings: {
        notifyEmail: reader.notifyEmail,
        bufferMin: reader.bufferMin,
        dailyCap: reader.dailyCap,
        blockedDates: await getBlockedDates(readerId),
        priceThb: readerPriceThb(reader),
      },
      videoCallEnabled: isTurnConfigured(),
      // Reader Studio (REFLECTION_JOURNAL_PLAN 1.13) — เปิดเมื่อ READER_STUDIO_ENABLED=1 เท่านั้น
      studioEnabled: isStudioEnabled(),
    });
  } catch (err) {
    console.error("[API Console Queue GET Error]", err);
    return NextResponse.json({ error: "ไม่สามารถโหลดข้อมูลคิวได้" }, { status: 500 });
  }
}

/**
 * PATCH /api/marketplace/console/queue - จัดการคิวและเปิด/ปิดรับงาน
 */
export async function PATCH(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึงจากภายนอก" }, { status: 403 });
  }

  const auth = await requireReader(request);
  if (!auth.success) return auth.response;

  const { readerId } = auth;
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "รูปแบบข้อมูลคำขอไม่ถูกต้อง" },
        { status: 400 }
      );
    }
    const parsed = PatchConsoleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.format() },
        { status: 400 }
      );
    }

    // 1. Handle Live Toggle
    if (parsed.data.isLiveOpen !== undefined) {
      await setReaderLiveAvailability(readerId, parsed.data.isLiveOpen);
    }

    // 2. Handle Ticket Status Action
    if (parsed.data.ticketId && parsed.data.action) {
      const ticket = await getQueueTicketById(parsed.data.ticketId);
      if (!ticket || ticket.readerId !== readerId) {
        return NextResponse.json({ error: "ไม่พบคิวที่ระบุ หรือไม่มีสิทธิ์แก้ไข" }, { status: 404 });
      }
      const now = Date.now();
      const action = parsed.data.action;

      if (action === "accept") {
        if (ticket.status !== "waiting") {
          return NextResponse.json({ error: "คิวนี้เรียกไม่ได้แล้ว" }, { status: 409 });
        }
        // 🔒 ต้องจ่ายก่อนถึงจะได้คุย — ตัดสินที่เซิร์ฟเวอร์ ไม่ใช่แค่ซ่อนปุ่ม
        if (!isPaidBooking(await getBookingByTicketId(ticket.id))) {
          return NextResponse.json({ error: "ลูกค้ายังไม่ได้ชำระเงิน เรียกคิวนี้ไม่ได้" }, { status: 402 });
        }
        if (ticket.kind === "booking" && !canStartBooking(ticket.slotStart, now)) {
          return NextResponse.json(
            { error: `เริ่มนัดได้ก่อนเวลานัดไม่เกิน ${EARLY_START_MINUTES} นาที` },
            { status: 409 }
          );
        }
        if (!(await updateTicketStatus(ticket.id, "ready", readerId))) {
          return NextResponse.json({ error: "ไม่พบคิวที่ระบุ หรือไม่มีสิทธิ์แก้ไข" }, { status: 404 });
        }
      } else if (action === "handoff") {
        if (ticket.status !== "ready" || !(await updateTicketStatus(ticket.id, "handed_off", readerId))) {
          return NextResponse.json({ error: "ปิดคิวได้เฉพาะคิวที่เรียกแล้ว" }, { status: 409 });
        }
        await completeBooking(ticket.id);
      } else if (action === "no_show") {
        if (ticket.kind !== "booking" || !canMarkNoShow(ticket.slotStart, now) || !(await markNoShow(ticket, now))) {
          return NextResponse.json(
            { error: `แจ้งลูกค้าไม่มาได้หลังเวลานัด ${NO_SHOW_GRACE_MINUTES} นาที` },
            { status: 409 }
          );
        }
      } else {
        // แม่หมอยกเลิก = คืนเงินลูกค้าเต็มจำนวนเสมอ (decideCancellation)
        const result = await cancelConsultation(ticket, "reader", now);
        if (!result.ok) {
          return NextResponse.json({ error: "คิวนี้ยกเลิกไม่ได้แล้ว" }, { status: 409 });
        }
      }
      // ปิดคิว = วางสายวิดีโอที่อาจค้างอยู่ + เพิกถอนรหัสผ่าน TURN ทันที
      if (action !== "accept") {
        const users = await endCall(ticket.id, "reader");
        await Promise.all(users.map(revokeTurnCredential));
      }
    }

    const isLiveOpen = await getReaderLiveAvailability(readerId);
    const tickets = await listReaderQueueTickets(readerId);

    return NextResponse.json({
      success: true,
      isLiveOpen,
      tickets: tickets.map(toPublicTicket),
    });
  } catch (err) {
    console.error("[API Console Queue PATCH Error]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัปเดตแผงควบคุม" }, { status: 500 });
  }
}
