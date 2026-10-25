import { NextResponse } from "next/server";
import { apiFail, apiOk } from "@/lib/api/envelope";
import { z } from "zod";

import {
  createQueueTicket,
  getReaderLiveAvailability,
  listActiveTicketsForCustomer,
  toPublicTicket,
} from "@/lib/marketplace/queue.repo";
import { checkSlotBookable, expireLapsedHold, holdBooking, releaseHold } from "@/lib/marketplace/booking.repo";
import { HOLD_MINUTES, MAX_ACTIVE_PER_CUSTOMER } from "@/lib/marketplace/booking-policy";
import { openConsultationCheckout } from "@/lib/marketplace/consultation-checkout";
import { confirmComplimentaryConsultation, hasFreeConsult } from "@/lib/marketplace/free-consult";
import { isStripeTestModeOnProduction, PAYMENTS_NOT_OPEN_MESSAGE } from "@/lib/marketplace/payment-gateway";
import { isPrivilegedTestRequest } from "@/lib/security/privileged";
import { getSessionUser } from "@/lib/auth/session";
import { readerPriceThb } from "@/lib/marketplace/offer";
import { getReaderById } from "@/lib/marketplace/readers.repo";
import { attachInviteTicket, resolveInviteClaim, type ReaderInvite } from "@/lib/marketplace/invites.repo";
import {
  readCustomerRefFromCookie,
  attachCustomerRefCookie,
} from "@/lib/marketplace/customer-ref";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { consumeEdgeRateLimits, edgeRateLimitKey } from "@/lib/security/edge-ratelimit";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from "@/lib/utils/rate-limit";

export const runtime = "nodejs";

const CreateTicketSchema = z.object({
  readerId: z.string().min(1, "กรุณาระบุรหัสแม่หมอ"),
  kind: z.enum(["walkup", "booking"]).default("walkup"),
  nickname: z.string().trim().min(1, "กรุณาระบุชื่อเล่น").max(40, "ชื่อเล่นยาวเกินไป"),
  // ขั้นต่ำ 3 ตัวอักษรตรวจหลัง parse — ลูกค้าจากลิงก์ห้องส่วนตัวเว้นได้ (คุยกับแม่หมอใน LINE มาแล้ว)
  question: z.string().trim().max(1000, "คำถามยาวเกินไป").default(""),
  readingSnapshot: z.string().max(2000).optional(),
  slotStart: z.number().int().positive().optional(),
  consent: z.boolean().refine((val) => val === true, {
    message: "กรุณากดยินยอมข้อกำหนดการคุ้มครองข้อมูลส่วนบุคคล (PDPA)",
  }),
  /** ความยินยอมโดยชัดแจ้งเรื่องข้อมูลอ่อนไหว (ม.26) — ช่องแยก ไม่บังคับ · ไม่ติ๊ก = ไม่ได้ยินยอม */
  sensitiveConsent: z.boolean().optional(),
  /**
   * รหัสลิงก์ห้องส่วนตัวที่แม่หมอส่งให้ (migrations/0032) — มี = แม่หมอเชิญลูกค้าคนนี้เอง
   * ข้ามแค่สวิตช์คิวสดกับคำถามขั้นต่ำ ด่านอื่น (โควตา · AI คัดกรอง · กันที่ · จ่ายเงิน) เหมือนการจองปกติทุกข้อ
   */
  inviteCode: z.string().trim().min(16).max(64).optional(),
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
 * บัญชีที่ได้สิทธิ์ปรึกษาฟรี (`free-consult.ts`) ยืนยันทันทีด้วยรายการยอด 0 แทนหน้าจ่ายเงิน
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

    const { readerId, nickname, question, readingSnapshot, slotStart, sensitiveConsent, inviteCode } = parsed.data;
    // ลิงก์ห้องส่วนตัว = คุยตอนนี้เสมอ (ไม่มีเวลานัด)
    const kind = inviteCode ? "walkup" : parsed.data.kind;
    if (!inviteCode && question.length < 3) {
      return NextResponse.json({ error: "กรุณาระบุคำถามอย่างน้อย 3 ตัวอักษร" }, { status: 400 });
    }

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

    // ล็อกอินอยู่ = ผูกตั๋วกับบัญชี (เห็น "นัดของฉัน" ทุกเครื่อง) · ไม่ล็อกอินก็จองได้ตามปกติ
    const user = await getSessionUser().catch(() => null);
    // บัญชีที่ได้สิทธิ์ปรึกษาฟรี (free-consult.ts) ➔ ข้ามหน้าจ่ายเงิน · ด่านอื่น (โควตา · AI คัดกรอง · กันที่) ยังตรวจครบ
    const freeConsult = await hasFreeConsult(user);

    const now = Date.now();
    // ✦ ลิงก์ห้องส่วนตัว — ตัดสินก่อนด่านแพง (AI คัดกรอง · หน้าจ่ายเงิน): ลิงก์ยังใช้ได้ไหม มีคนอื่นกำลังจ่ายไหม
    let invite: ReaderInvite | null = null;
    if (inviteCode) {
      const claim = await resolveInviteClaim(inviteCode, readerId, existingRef, user?.id ?? null, now);
      if (claim.kind === "refused") return apiFail(claim.error, claim.status, claim.code);
      // ลูกค้าคนเดิมกดซ้ำ (จ่ายค้างไว้/จ่ายแล้ว) ➔ พากลับหน้าคิวของเขา ไม่สร้างตั๋วใบที่สอง
      if (claim.kind === "own") return apiOk({ redirectUrl: `/readers/queue/${claim.ticketId}` });
      invite = claim.invite;
    }

    // แม่หมอเชิญเองผ่านลิงก์ห้องส่วนตัว ➔ ไม่ต้องเปิดสวิตช์คิวสด (ด่านอื่นยังตรวจครบ)
    if (kind === "walkup" && !invite) {
      const isLive = await getReaderLiveAvailability(readerId);
      if (!isLive) {
        return NextResponse.json(
          { error: "แม่หมอเพิ่งปิดรับคิวสด เลือกนัดเวลาล่วงหน้าแทนได้เลย" },
          { status: 409 }
        );
      }
    } else if (kind === "booking") {
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
    if (!freeConsult && isStripeTestModeOnProduction() && !(await isPrivilegedTestRequest(request))) {
      return NextResponse.json({ error: PAYMENTS_NOT_OPEN_MESSAGE }, { status: 503 });
    }

    /*
     * 🔒 เพดาน "กันที่โดยยังไม่จ่าย" ต่อเครื่อง แบบข้าม isolate (D1) — ด่านโควตาข้างบนนับจากคุกกี้
     * ซึ่งคำขอที่ไม่ส่งคุกกี้จะถูกนับเป็นลูกค้าใหม่ทุกครั้ง ด่านนี้จึงนับจาก IP แทน:
     *   ต่อแม่หมอหนึ่งคน ≤ MAX_ACTIVE_PER_CUSTOMER ครั้งต่ออายุการกันที่ · ทุกแม่หมอรวม ≤ 10 ครั้งต่ออายุการกันที่
     * วางก่อน AI คัดกรองและการกันที่ — คำขอที่เกินเพดานไม่เสียค่า AI และไม่ทำให้เวลาว่างหายจากตาราง
     */
    const holdWindowSec = HOLD_MINUTES * 60;
    const holdLimit = await consumeEdgeRateLimits([
      {
        key: edgeRateLimitKey("mkt_hold:reader", `${clientId}:${readerId}`),
        config: { max: MAX_ACTIVE_PER_CUSTOMER, windowSec: holdWindowSec },
      },
      { key: edgeRateLimitKey("mkt_hold:ip", clientId), config: { max: 10, windowSec: holdWindowSec } },
    ]);
    if (!holdLimit.allowed) {
      return createRateLimitResponse(
        holdLimit.retryAfterSec,
        "เครื่องนี้มีรายการรอชำระเงินหลายรายการแล้ว ชำระหรือรอให้รายการเดิมหมดเวลาก่อน แล้วค่อยจองใหม่"
      );
    }

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
    // ผูกตั๋วกับลิงก์ห้องก่อนเปิดหน้าจ่ายเงิน (compare-and-swap) — คนที่สองที่กดพร้อมกันแพ้แล้วปล่อยที่ของตัวเอง
    if (invite && !(await attachInviteTicket(invite.id, invite.ticketId, ticket.id))) {
      await releaseHold(ticket.id, "cancelled", "system");
      return apiFail("มีคนกำลังชำระเงินผ่านลิงก์นี้อยู่ ถ้าไม่ใช่คุณ ทักแม่หมอขอลิงก์ใหม่ได้เลย", 409, "invite_busy");
    }

    // ✦ ปรึกษาฟรี ➔ ยืนยันผ่านจุดเดียวกับเงินจริงทันที แล้วพาไปหน้าคิว/นัด (ไม่มีหน้าจ่ายเงิน)
    if (freeConsult && user?.email) {
      const state = await confirmComplimentaryConsultation({
        ticketId: ticket.id,
        bookingId: hold.booking.id,
        userId: user.id,
        email: user.email,
      });
      if (state !== "confirmed") {
        console.error("[API Tickets POST] ยืนยันการจองฟรีไม่สำเร็จ", { ticketId: ticket.id, state });
        await releaseHold(ticket.id, "cancelled", "system");
        return apiFail("ยืนยันการจองไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", 409, "free_confirm_failed");
      }
      const free = apiOk({ ticket: toPublicTicket(ticket), redirectUrl, free: true });
      return await attachCustomerRefCookie(free, customerRef);
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
        privateRoom: invite !== null,
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
