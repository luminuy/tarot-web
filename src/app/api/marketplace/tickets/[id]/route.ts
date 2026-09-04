import { NextResponse } from "next/server";
import { cancelQueueTicket, getQueueTicketById } from "@/lib/marketplace/queue.repo";
import { getReaderById } from "@/lib/marketplace/readers.repo";
import { readCustomerRefFromCookie } from "@/lib/marketplace/customer-ref";
import { requireReader } from "@/lib/auth/reader-auth";

export const runtime = "nodejs";

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
    const ticket = await getQueueTicketById(id);
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

    // Only reveal reader LINE link when status is 'ready' or 'handed_off' (Strict Zero-Leak Security)
    const canAccessLine = ticket.status === "ready" || ticket.status === "handed_off";

    return NextResponse.json({
      ticket,
      reader: {
        id: reader.id,
        displayName: reader.displayName,
        avatarUrl: reader.avatarUrl,
        specialties: reader.specialties,
        // Protected lineUrl
        lineUrl: canAccessLine ? reader.lineUrl : null,
      },
      canAccessLine,
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
  const { id } = await params;
  try {
    const customerRef = await readCustomerRefFromCookie(request);
    if (!customerRef) {
      return NextResponse.json(
        { error: "ต้องระบุสิทธิ์ของผู้จองคิวผ่าน Cookie" },
        { status: 401 }
      );
    }

    const ok = await cancelQueueTicket(id, customerRef);
    if (!ok) {
      return NextResponse.json({ error: "ไม่สามารถยกเลิกตั๋วคิวได้" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "ยกเลิกคิวเรียบร้อยแล้ว" });
  } catch (err) {
    console.error("[API Ticket DELETE Error]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการยกเลิกคิว" }, { status: 500 });
  }
}
