import { NextResponse } from "next/server";
import { z } from "zod";

import { requireReader } from "@/lib/auth/reader-auth";
import {
  getReaderLiveAvailability,
  listReaderQueueTickets,
  setReaderLiveAvailability,
  updateTicketStatus,
  type TicketStatus,
} from "@/lib/marketplace/queue.repo";

export const runtime = "nodejs";

const PatchConsoleSchema = z.object({
  isLiveOpen: z.boolean().optional(),
  ticketId: z.string().optional(),
  action: z.enum(["accept", "handoff", "cancel"]).optional(),
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
    const tickets = await listReaderQueueTickets(readerId, {
      status: ["waiting", "ready", "screening"],
    });

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
      tickets,
      totalWaiting: tickets.filter((t) => t.status === "waiting").length,
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
  const auth = await requireReader(request);
  if (!auth.success) return auth.response;

  const { readerId } = auth;
  try {
    const body = await request.json();
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
      let targetStatus: TicketStatus = "waiting";
      if (parsed.data.action === "accept") targetStatus = "ready";
      if (parsed.data.action === "handoff") targetStatus = "handed_off";
      if (parsed.data.action === "cancel") targetStatus = "cancelled";

      const updated = await updateTicketStatus(parsed.data.ticketId, targetStatus, readerId);
      if (!updated) {
        return NextResponse.json({ error: "ไม่พบคิวที่ระบุ หรือไม่มีสิทธิ์แก้ไข" }, { status: 404 });
      }
    }

    const isLiveOpen = await getReaderLiveAvailability(readerId);
    const tickets = await listReaderQueueTickets(readerId);

    return NextResponse.json({
      success: true,
      isLiveOpen,
      tickets,
    });
  } catch (err) {
    console.error("[API Console Queue PATCH Error]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัปเดตแผงควบคุม" }, { status: 500 });
  }
}
