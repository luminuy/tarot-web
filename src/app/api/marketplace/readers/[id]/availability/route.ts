import { NextResponse } from "next/server";
import { getReaderLiveAvailability } from "@/lib/marketplace/queue.repo";
import { getPublicReaderById } from "@/lib/marketplace/readers.repo";

export const runtime = "nodejs";

/**
 * GET /api/marketplace/readers/[id]/availability - ดึงสถานะเปิดรับคิวสด
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const reader = await getPublicReaderById(id);
    if (!reader) {
      return NextResponse.json({ error: "ไม่พบแม่หมอที่ระบุ" }, { status: 404 });
    }

    const isLiveOpen = await getReaderLiveAvailability(id);

    return NextResponse.json({
      readerId: id,
      isLiveOpen,
      mode: isLiveOpen ? "live_and_scheduled" : "scheduled_only",
    });
  } catch (err) {
    console.error("[API Reader Availability GET Error]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการตรวจสอบคิวแม่หมอ" }, { status: 500 });
  }
}
