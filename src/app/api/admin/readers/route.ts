import { NextResponse } from "next/server";
import { z } from "zod";

import { recordAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  createReader,
  listReaders,
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
});

/**
 * GET /api/admin/readers - ดึงรายชื่อแม่หมอทั้งหมด
 */
export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status") as ReaderStatus | null;
    const validStatus = statusParam && ["pending", "approved", "suspended"].includes(statusParam) ? statusParam : undefined;

    const readers = await listReaders(validStatus ? { status: validStatus } : undefined);
    return NextResponse.json({ readers });
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
    const body = await request.json();
    const parsed = CreateReaderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const reader = await createReader({
      displayName: parsed.data.displayName,
      bio: parsed.data.bio,
      avatarUrl: parsed.data.avatarUrl || null,
      specialties: parsed.data.specialties,
      lineUrl: parsed.data.lineUrl,
      status: parsed.data.status,
      commissionPct: parsed.data.commissionPct,
    });

    await recordAudit("create_reader", `สร้างแม่หมอ: ${reader.displayName} (${reader.id})`);

    return NextResponse.json({ reader, success: true }, { status: 201 });
  } catch (err) {
    console.error("[API Admin Readers POST Error]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการสร้างโปรไฟล์แม่หมอ" }, { status: 500 });
  }
}
