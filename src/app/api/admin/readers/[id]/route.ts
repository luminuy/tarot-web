import { NextResponse } from "next/server";
import { z } from "zod";

import { recordAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  deleteReader,
  getReaderById,
  updateReader,
} from "@/lib/marketplace/readers.repo";

export const runtime = "nodejs";

const UpdateReaderSchema = z.object({
  displayName: z.string().trim().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร").max(80, "ชื่อยาวเกินไป").optional(),
  bio: z.string().trim().max(1500, "ประวัติยาวเกินไป").optional(),
  avatarUrl: z.string().trim().url("รูปแบบ URL รูปภาพไม่ถูกต้อง").or(z.literal("")).nullable().optional(),
  specialties: z.array(z.string().trim().min(1).max(50)).max(10).optional(),
  lineUrl: z.string().trim().min(3, "กรุณาระบุ LINE ID หรือ LINE OA URL").max(300).optional(),
  status: z.enum(["pending", "approved", "suspended"]).optional(),
  commissionPct: z.number().int().min(0).max(100).optional(),
});

/**
 * GET /api/admin/readers/[id] - ดึงข้อมูลแม่หมอรายบุคคล
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  try {
    const reader = await getReaderById(id);
    if (!reader) {
      return NextResponse.json({ error: "ไม่พบแม่หมอที่ระบุ" }, { status: 404 });
    }
    return NextResponse.json({ reader });
  } catch (err) {
    console.error("[API Admin Reader GET ID Error]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการค้นหาแม่หมอ" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/readers/[id] - อัปเดตข้อมูลหรือสถานะแม่หมอ
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = UpdateReaderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const updated = await updateReader(id, parsed.data);
    if (!updated) {
      return NextResponse.json({ error: "ไม่พบแม่หมอที่ระบุ" }, { status: 404 });
    }

    await recordAudit(
      "update_reader",
      `อัปเดตแม่หมอ: ${updated.displayName} (${id}) [status: ${updated.status}]`
    );

    return NextResponse.json({ reader: updated, success: true });
  } catch (err) {
    console.error("[API Admin Reader PATCH Error]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัปเดตข้อมูลแม่หมอ" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/readers/[id] - ลบแม่หมอออกจากระบบ
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  try {
    const existing = await getReaderById(id);
    if (!existing) {
      return NextResponse.json({ error: "ไม่พบแม่หมอที่ระบุ" }, { status: 404 });
    }

    const ok = await deleteReader(id);
    if (!ok) {
      return NextResponse.json({ error: "ไม่สามารถลบแม่หมอได้" }, { status: 500 });
    }

    await recordAudit("delete_reader", `ลบแม่หมอ: ${existing.displayName} (${id})`);

    return NextResponse.json({ success: true, message: "ลบแม่หมอเรียบร้อยแล้ว" });
  } catch (err) {
    console.error("[API Admin Reader DELETE Error]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการลบแม่หมอ" }, { status: 500 });
  }
}
