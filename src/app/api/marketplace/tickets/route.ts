import { NextResponse } from "next/server";
import { apiOk } from "@/lib/api/envelope";
import { z } from "zod";

import {
  createQueueTicket,
  getReaderLiveAvailability,
  listActiveTicketsForCustomer,
  toPublicTicket,
} from "@/lib/marketplace/queue.repo";
import { checkSlotBookable, expireLapsedHold, holdBooking, releaseHold } from "@/lib/marketplace/booking.repo";
import { MAX_ACTIVE_PER_CUSTOMER } from "@/lib/marketplace/booking-policy";
import { openConsultationCheckout } from "@/lib/marketplace/consultation-checkout";
import { isStripeTestModeOnProduction, PAYMENTS_NOT_OPEN_MESSAGE } from "@/lib/marketplace/payment-gateway";
import { isPrivilegedTestRequest } from "@/lib/security/privileged";
import { getSessionUser } from "@/lib/auth/session";
import { readerPriceThb } from "@/lib/marketplace/offer";
import { getReaderById } from "@/lib/marketplace/readers.repo";
import {
  readCustomerRefFromCookie,
  attachCustomerRefCookie,
} from "@/lib/marketplace/customer-ref";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from "@/lib/utils/rate-limit";

export const runtime = "nodejs";

const CreateTicketSchema = z.object({
  readerId: z.string().min(1, "กรุณาระบุรหัสแม่หมอ"),
  kind: z.enum(["walkup", "booking"]).default("walkup"),
  nickname: z.string().trim().min(1, "กรุณาระบุชื่อเล่น").max(40, "ชื่อเล่นยาวเกินไป"),
  question: z.string().trim().min(3, "กรุณาระบุคำถามอย่างน้อย 3 ตัวอักษร").max(1000, "คำถามยาวเกินไป"),
  readingSnapshot: z.string().max(2000).optional(),
  slotStart: z.number().int().positive().optional(),
  consent: z.boolean().refine((val) => val === true, {
    message: "กรุณากดยินยอมข้อกำหนดการคุ้มครองข้อมูลส่วนบุคคล (PDPA)",
  }),
  /** ความยินยอมโดยชัดแจ้งเรื่องข้อมูลอ่อนไหว (ม.26) — ช่องแยก ไม่บังคับ · ไม่ติ๊ก = ไม่ได้ยินยอม */
  sensitiveConsent: z.boolean().optional(),
});

/**
 * GET /api/marketplace/tickets — ดึงรายการคิวของลูกค้าผ่าน HttpOnly Cookie
 */
export async function GET(request: Request) {
  try {
    const customerRef = await readCustomerRefFromCookie(request);
    if (!customerRef) {
      return NextResponse.json({ error: "ไม่พบสิทธิ์เข้าถึงคิวนี้" }, { status: 401 });
    }

    const tickets = await listActiveTicketsForCustomer(customerRef);
    return NextResponse.json({ tickets: tickets.map(toPublicTicket) });
  } catch (err) {
    console.error("[API Tickets GET Error]", err);
    return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลคิวได้" }, { status: 500 });
  }
}

/**
 * POST /api/marketplace/tickets — จองคิวสด / นัดเวลาล่วงหน้า แล้วพาไปจ่ายเงิน
 * ---------------------------------------------------------------------------
 * ลำดับด่าน (ถูก ➔ แพง): รูปแบบข้อมูล ➔ แม่หมอ ➔ เปิดรับคิว/เวลานี้ว่างจริง ➔ โควตาต่อลูกค้า
 * ➔ ระบบจ่ายเงินเปิดอยู่ ➔ AI คัดกรอง (เสียเงินค่า AI — ทำหลังด่านถูก ๆ ผ่านหมดแล้ว)
 * ➔ กันที่ (unique index ตัดสิน) ➔ หน้าจ่ายเงิน Stripe
 *
 * ตั๋วเกิดในสถานะ `pending_payment` — แม่หมอเห็นตั๋วก็ต่อเมื่อเงินเข้าแล้วเท่านั้น
 * คำถามที่ AI บล็อก (สัญญาณทำร้ายตัวเอง) ไม่ถูกเก็บเงิน และหน้าคิวแสดงสายด่วน 1323
 */
export async function POST(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึงจากภายนอก" }, { status: 403 });
  }

  const clientId = getClientIdentifier(request);
  const limit = checkRateLimit(`mkt_ticket:${clientId}`, {
    maxRequests: 10,
    windowSeconds: 600,
  });
  if (!limit.allowed) {
    return createRateLimitResponse(
      limit.retryAfterSeconds,
      "คุณทำรายการเข้าคิวบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่นะ"
    );
  }

  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "รูปแบบข้อมูลคำขอไม่ถูกต้อง" },
        { status: 400 }
      );
    }
    const parsed = CreateTicketSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { readerId, kind, nickname, question, readingSnapshot, slotStart, sensitiveConsent } = parsed.data;

    // 🔒 customerRef ออกโดยเซิร์ฟเวอร์เท่านั้น — ห้ามรับจาก body (A2-13)
    //    เดิมรับค่าจาก body แล้วเซ็นคุกกี้ให้ทันที ใครรู้ ref ของคนอื่นก็แลกเป็นคุกกี้อ่านคิวเขาได้
    //    มีคุกกี้อยู่แล้ว = ลูกค้าคนเดิม ใช้ค่าเดิม · ไม่มี = ลูกค้าใหม่ สุ่มให้ใหม่
    const existingRef = await readCustomerRefFromCookie(request);
    const customerRef = existingRef ?? `cust_${crypto.randomUUID().replace(/-/g, "")}`;

    // Verify Reader
    const reader = await getReaderById(readerId);
    if (!reader || reader.status !== "approved") {
      return NextResponse.json({ error: "ไม่พบแม่หมอที่ระบุ หรือยังไม่เปิดรับงาน" }, { status: 404 });
    }

    const now = Date.now();
    if (kind === "walkup") {
      const isLive = await getReaderLiveAvailability(readerId);
      if (!isLive) {
        return NextResponse.json(
          { error: "แม่หมอเพิ่งปิดรับคิวสด เลือกนัดเวลาล่วงหน้าแทนได้เลย" },
          { status: 409 }
        );
      }
    } else {
      if (!slotStart) {
        return NextResponse.json({ error: "กรุณาเลือกวันและเวลานัด" }, { status: 400 });
      }
      // ไม่เชื่อเวลาที่ไคลเอนต์ส่งมา — ตรวจกับตารางของแม่หมอ + ช่องที่ถูกจองแล้วฝั่งเซิร์ฟเวอร์
      const rejection = await checkSlotBookable(readerId, slotStart, now);
      if (rejection) {
        return NextResponse.json({ error: rejection, code: "slot_unavailable" }, { status: 409 });
      }
    }

    if (existingRef) {
      const listed = await listActiveTicketsForCustomer(existingRef);
      // ตั๋วที่รอจ่ายจนหมดเวลากันที่แล้วไม่นับ (ปิดให้ตรงนี้เลย ไม่ต้องรอใครเปิดหน้าคิว)
      const lapsed = await Promise.all(listed.map((t) => expireLapsedHold(t, now)));
      const active = listed.filter((_, i) => !lapsed[i]);
      if (active.length >= MAX_ACTIVE_PER_CUSTOMER) {
        return NextResponse.json(
          { error: `คุณมีคิวหรือนัดที่ยังไม่จบอยู่ ${active.length} รายการ ปิดหรือยกเลิกรายการเดิมก่อนจองใหม่` },
          { status: 429 }
        );
      }
    }

    // คีย์ทดสอบบนเว็บจริง = เปิดให้เฉพาะผู้ทดสอบ (บัตร 4242 ห้ามได้คิวแม่หมอฟรี)
    if (isStripeTestModeOnProduction() && !(await isPrivilegedTestRequest(request))) {
      return NextResponse.json({ error: PAYMENTS_NOT_OPEN_MESSAGE }, { status: 503 });
    }

    // ล็อกอินอยู่ = ผูกตั๋วกับบัญชี (เห็น "นัดของฉัน" ทุกเครื่อง) · ไม่ล็อกอินก็จองได้ตามปกติ
    const user = await getSessionUser().catch(() => null);

    // Create ticket with AI Screening — ยังไม่เข้าคิวจนกว่าจะจ่ายเงิน
    const ticket = await createQueueTicket({
      userId: user?.id ?? null,
      readerId,
      kind,
      customerRef,
      nickname,
      question,
      readingSnapshot,
      slotStart: kind === "booking" ? slotStart : undefined,
      initialStatus: "pending_payment",
      sensitiveConsent: sensitiveConsent === true,
    });
    const redirectUrl = `/readers/queue/${ticket.id}`;

    // AI บล็อก (เช่น สัญญาณทำร้ายตัวเอง) ➔ ไม่เก็บเงิน ไม่กันที่ — หน้าคิวแสดงเหตุผล + สายด่วน 1323
    if (ticket.status === "cancelled") {
      const blocked = apiOk({ ticket: toPublicTicket(ticket), redirectUrl });
      return await attachCustomerRefCookie(blocked, customerRef);
    }

    const hold = await holdBooking({
      ticketId: ticket.id,
      readerId,
      kind: kind === "booking" ? "scheduled" : "walkup",
      slotStart: kind === "booking" && slotStart ? slotStart : now,
      nowMs: now,
      contactEmail: user?.email ?? null,
    });
    if (!hold.ok) {
      await releaseHold(ticket.id, "cancelled", "system");
      return NextResponse.json(
        { error: "เวลานี้เพิ่งมีคนจองไปเมื่อสักครู่ กรุณาเลือกเวลาอื่น", code: "slot_unavailable" },
        { status: 409 }
      );
    }

    let checkoutUrl: string;
    try {
      ({ checkoutUrl } = await openConsultationCheckout({
        request,
        ticketId: ticket.id,
        readerId,
        readerName: reader.displayName,
        booking: hold.booking,
        attempt: 1,
        priceThb: readerPriceThb(reader),
        customerEmail: user?.email ?? null,
      }));
    } catch (err) {
      // เกตเวย์ล่ม = ปล่อยที่ทันที ไม่ให้เวลาว่างหายไปจากตาราง 36 นาทีทั้งที่ไม่มีใครจ่ายได้
      console.error("[API Tickets POST] เปิดหน้าจ่ายเงินไม่สำเร็จ", err);
      await releaseHold(ticket.id, "cancelled", "system");
      return NextResponse.json(
        { error: "ระบบชำระเงินขัดข้องชั่วคราว ยังไม่มีการตัดเงิน กรุณาลองใหม่อีกครั้ง" },
        { status: 502 }
      );
    }

    const res = NextResponse.json({
      success: true,
      ticket: toPublicTicket(ticket),
      redirectUrl,
      checkoutUrl,
    });
    return await attachCustomerRefCookie(res, customerRef);
  } catch (err) {
    console.error("[API Tickets POST Error]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการสร้างตั๋วคิว" }, { status: 500 });
  }
}
