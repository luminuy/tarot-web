import { NextResponse } from "next/server";
import { listPublicApprovedReaders } from "@/lib/marketplace/readers.repo";

export const runtime = "nodejs";

/**
 * GET /api/readers - รายชื่อแม่หมอที่ผ่านการอนุมัติ (Public API)
 */
export async function GET() {
  try {
    const readers = await listPublicApprovedReaders();
    return NextResponse.json({ readers, total: readers.length });
  } catch (err) {
    console.error("[Public Readers API Error]", err);
    return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลแม่หมอได้ในขณะนี้" }, { status: 500 });
  }
}
