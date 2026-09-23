import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createQueueTicket,
  getReaderLiveAvailability,
  listActiveTicketsForCustomer,
  toPublicTicket,
} from "@/lib/marketplace/queue.repo";
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
  slotStart: z.number().optional(),
  consent: z.boolean().refine((val) => val === true, {
    message: "กรุณากดยินยอมข้อกำหนดการคุ้มครองข้อมูลส่วนบุคคล (PDPA)",
  }),
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
 * POST /api/marketplace/tickets - เข้าคิวรับคำปรึกษา
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

    const { readerId, kind, nickname, question, readingSnapshot, slotStart } = parsed.data;

    // 🔒 customerRef ออกโดยเซิร์ฟเวอร์เท่านั้น — ห้ามรับจาก body (A2-13)
    //    เดิมรับค่าจาก body แล้วเซ็นคุกกี้ให้ทันที ใครรู้ ref ของคนอื่นก็แลกเป็นคุกกี้อ่านคิวเขาได้
    //    มีคุกกี้อยู่แล้ว = ลูกค้าคนเดิม ใช้ค่าเดิม · ไม่มี = ลูกค้าใหม่ สุ่มให้ใหม่
    const customerRef =
      (await readCustomerRefFromCookie(request)) ??
      `cust_${crypto.randomUUID().replace(/-/g, "")}`;

    // Verify Reader
    const reader = await getReaderById(readerId);
    if (!reader || reader.status !== "approved") {
      return NextResponse.json({ error: "ไม่พบแม่หมอที่ระบุ หรือยังไม่เปิดรับงาน" }, { status: 404 });
    }

    // If walk-up, verify reader is currently live
    if (kind === "walkup") {
      const isLive = await getReaderLiveAvailability(readerId);
      if (!isLive) {
        return NextResponse.json(
          { error: "แม่หมอท่านนี้ยังไม่ได้เปิดรับคิวสดในขณะนี้ กรุณาเลือกจองคิวล่วงหน้าหรือรอเปิดคิว" },
          { status: 409 }
        );
      }
    }

    // Create ticket with AI Screening
    const ticket = await createQueueTicket({
      readerId,
      kind,
      customerRef,
      nickname,
      question,
      readingSnapshot,
      slotStart,
    });

    const res = NextResponse.json({
      success: true,
      ticket: toPublicTicket(ticket),
      redirectUrl: `/readers/queue/${ticket.id}`,
    });
    return await attachCustomerRefCookie(res, customerRef);
  } catch (err) {
    console.error("[API Tickets POST Error]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการสร้างตั๋วคิว" }, { status: 500 });
  }
}
