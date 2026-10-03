import { NextResponse } from "next/server";

import { getAvailableSlots } from "@/lib/marketplace/booking.repo";
import { BOOKING_TIMEZONE, SLOT_MINUTES } from "@/lib/marketplace/booking-policy";
import { getPublicReaderById } from "@/lib/marketplace/readers.repo";

export const runtime = "nodejs";

/**
 * GET /api/marketplace/readers/[id]/slots — เวลาว่างให้จอง 14 วันข้างหน้า (เวลาไทย)
 * ข้อมูลสาธารณะ (ไม่มีชื่อ/คำถามของใคร) · ห้ามแคช — ช่องที่เพิ่งถูกจองต้องหายทันที
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const reader = await getPublicReaderById(id);
    if (!reader) {
      return NextResponse.json({ error: "ไม่พบแม่หมอที่ระบุ" }, { status: 404 });
    }
    const days = await getAvailableSlots(id);
    return NextResponse.json(
      { readerId: id, timezone: BOOKING_TIMEZONE, slotMinutes: SLOT_MINUTES, days },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[API Reader Slots GET Error]", err);
    return NextResponse.json({ error: "โหลดเวลาว่างไม่สำเร็จ" }, { status: 500 });
  }
}
