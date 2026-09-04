import { NextResponse } from "next/server";
import { cancelQueueTicket, getQueueTicketById } from "@/lib/marketplace/queue.repo";
import { getReaderById } from "@/lib/marketplace/readers.repo";

export const runtime = "nodejs";

/**
 * GET /api/marketplace/tickets/[id] - ดึงสถานะคิวล่าสุด (Poll)
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const ticket = await getQueueTicketById(id);
    if (!ticket) {
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
 * ⚠️ ต้องแนบ `customerRef` ของเจ้าของตั๋วมาด้วยเสมอ
 * ก่อนหน้านี้ยกเลิกได้ด้วย ticket id เพียงอย่างเดียว ซึ่ง id ปรากฏอยู่ในลิงก์
 * `/readers/queue/<id>` ที่ผู้ใช้แชร์ต่อ/ค้างอยู่ในประวัติเบราว์เซอร์ได้
 * ใครเห็นลิงก์ก็เตะลูกค้าที่จ่ายเงินแล้วออกจากคิวแม่หมอได้ทันทีโดยไม่ต้องล็อกอิน
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const url = new URL(request.url);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const customerRef =
      (typeof body.customerRef === "string" ? body.customerRef : "") ||
      (url.searchParams.get("customerRef") ?? "");

    if (!customerRef) {
      return NextResponse.json(
        { error: "ต้องระบุรหัสอ้างอิงของผู้จองคิว (customerRef)" },
        { status: 400 }
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
