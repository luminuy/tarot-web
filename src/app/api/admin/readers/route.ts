import { NextResponse } from "next/server";
import { z } from "zod";

import { recordAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth/require-admin";
import { countOpenBookingsByReader, getNextAvailableSlot, getScheduleRules } from "@/lib/marketplace/booking.repo";
import { READER_PRICE_MAX_THB, READER_PRICE_MIN_THB } from "@/lib/marketplace/offer";
import { listLiveReaderIds } from "@/lib/marketplace/queue.repo";
import {
  createReader,
  listReaders,
  toAdminReader,
  updateReader,
  type Reader,
  type ReaderActivity,
  type ReaderStatus,
} from "@/lib/marketplace/readers.repo";

export const runtime = "nodejs";

const CreateReaderSchema = z.object({
  displayName: z.string().trim().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร").max(80, "ชื่อยาวเกินไป"),
  bio: z.string().trim().max(1500, "ประวัติยาวเกินไป").optional().default(""),
  avatarUrl: z.string().trim().url("รูปแบบ URL รูปภาพไม่ถูกต้อง").or(z.literal("")).nullable().optional(),
  specialties: z.array(z.string().trim().min(1).max(50)).max(10).default([]),
  lineUrl: z.string().trim().min(3, "กรุณาระบุ LINE ID หรือ LINE OA URL").max(300),
  status: z.enum(["pending", "approved", "suspended"]).optional().default("pending"),
  commissionPct: z.number().int().min(0).max(100).optional().default(20),
  // ค่าปรึกษาต่อครั้ง — เดิมไม่มีในชุดนี้ zod จึงตัดทิ้งเงียบ ๆ: แอดมินตั้งราคาตอนเพิ่มแม่หมอแล้วได้ราคากลางแทน
  priceThb: z.number().int().min(READER_PRICE_MIN_THB).max(READER_PRICE_MAX_THB).nullable().optional(),
});

/** งานตอนนี้ของแม่หมอที่ใช้งานอยู่ — คนละคนพังได้โดยไม่ล้มทั้งรายการ */
async function readActivity(
  reader: Reader,
  live: Set<string>,
  open: Map<string, { upcoming: number; liveWaiting: number }>,
  nowMs: number
): Promise<ReaderActivity | null> {
  if (reader.status !== "approved") return null;
  try {
    const hasSchedule = (await getScheduleRules(reader.id)).length > 0;
    const counts = open.get(reader.id);
    return {
      isLiveOpen: live.has(reader.id),
      hasSchedule,
      nextSlot: hasSchedule ? await getNextAvailableSlot(reader.id, nowMs) : null,
      upcoming: counts?.upcoming ?? 0,
      liveWaiting: counts?.liveWaiting ?? 0,
    };
  } catch (err) {
    console.error("[API Admin Readers] อ่านงานของแม่หมอไม่สำเร็จ", reader.id, err);
    return null;
  }
}

/**
 * GET /api/admin/readers - ดึงรายชื่อแม่หมอทั้งหมด พร้อมงานตอนนี้ (คิวสด · เวลาว่างเร็วสุด · นัดที่ค้าง)
 */
export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status") as ReaderStatus | null;
    const validStatus = statusParam && ["pending", "approved", "suspended"].includes(statusParam) ? statusParam : undefined;

    const nowMs = Date.now();
    const [readers, live, open] = await Promise.all([
      listReaders(validStatus ? { status: validStatus } : undefined),
      listLiveReaderIds().catch(() => new Set<string>()),
      countOpenBookingsByReader(nowMs).catch(() => new Map<string, { upcoming: number; liveWaiting: number }>()),
    ]);
    const rows = await Promise.all(
      readers.map(async (r) => ({ ...toAdminReader(r), activity: await readActivity(r, live, open, nowMs) }))
    );
    return NextResponse.json({ readers: rows });
  } catch (err) {
    console.error("[API Admin Readers GET Error]", err);
    return NextResponse.json({ error: "ไม่สามารถดึงรายชื่อแม่หมอได้" }, { status: 500 });
  }
}

/**
 * POST /api/admin/readers - สร้างโปรไฟล์แม่หมอใหม่
 */
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "รูปแบบข้อมูลคำขอไม่ถูกต้อง" },
        { status: 400 }
      );
    }
    const parsed = CreateReaderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const created = await createReader({
      displayName: parsed.data.displayName,
      bio: parsed.data.bio,
      avatarUrl: parsed.data.avatarUrl || null,
      specialties: parsed.data.specialties,
      lineUrl: parsed.data.lineUrl,
      status: parsed.data.status,
      commissionPct: parsed.data.commissionPct,
    });
    const reader =
      parsed.data.priceThb != null ? ((await updateReader(created.id, { priceThb: parsed.data.priceThb })) ?? created) : created;

    await recordAudit("create_reader", `สร้างแม่หมอ: ${reader.displayName} (${reader.id})`);

    return NextResponse.json({ reader: toAdminReader(reader), success: true }, { status: 201 });
  } catch (err) {
    console.error("[API Admin Readers POST Error]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการสร้างโปรไฟล์แม่หมอ" }, { status: 500 });
  }
}
