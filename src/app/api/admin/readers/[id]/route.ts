import { NextResponse } from "next/server";
import { READER_PRICE_MAX_THB, READER_PRICE_MIN_THB } from "@/lib/marketplace/offer";
import { z } from "zod";

import { recordAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth/require-admin";
import { signReaderToken } from "@/lib/auth/reader-auth";
import { normalizeConsoleLinkDays } from "@/lib/marketplace/console-link";
import {
  countOpenPaidConsultations,
  deleteReader,
  getReaderById,
  rotateReaderSessionSecret,
  toAdminReader,
  updateReader,
  type Reader,
} from "@/lib/marketplace/readers.repo";

export const runtime = "nodejs";

/**
 * ลิงก์แผงแม่หมอใหม่ — อายุตามที่แอดมินเลือก (1 · 7 · 30 วัน · ค่าอื่น = 30 วัน)
 * หน้าแอดมินบอกเวลาหมดอายุจริงจาก `expiresAt` (ไม่เดาเอง)
 */
function issueConsoleLink(reader: Reader, daysParam: unknown) {
  const days = normalizeConsoleLinkDays(daysParam);
  const expiresAt = Date.now() + days * 24 * 60 * 60 * 1000;
  const token = signReaderToken(reader.id, reader.sessionSecret, days * 24);
  return { token, expiresAt, days };
}

const UpdateReaderSchema = z.object({
  displayName: z.string().trim().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร").max(80, "ชื่อยาวเกินไป").optional(),
  bio: z.string().trim().max(1500, "ประวัติยาวเกินไป").optional(),
  avatarUrl: z.string().trim().url("รูปแบบ URL รูปภาพไม่ถูกต้อง").or(z.literal("")).nullable().optional(),
  specialties: z.array(z.string().trim().min(1).max(50)).max(10).optional(),
  lineUrl: z.string().trim().min(3, "กรุณาระบุ LINE ID หรือ LINE OA URL").max(300).optional(),
  status: z.enum(["pending", "approved", "suspended"]).optional(),
  commissionPct: z.number().int().min(0).max(100).optional(),
  // ค่าปรึกษาต่อครั้ง (บาท) — null = ใช้ราคากลาง · เพดานกันพิมพ์ผิดหลักจนลูกค้าโดนตัดเงินผิด
  priceThb: z.number().int().min(READER_PRICE_MIN_THB).max(READER_PRICE_MAX_THB).nullable().optional(),
});

/**
 * GET /api/admin/readers/[id]?days=1|7|30 - ดึงข้อมูลแม่หมอรายบุคคล พร้อมสร้างลิงก์แผงแม่หมอ
 * ทุกครั้งที่เรียก = ลิงก์ใหม่อายุเต็มตามที่เลือก (ลิงก์เก่ายังใช้ได้จนหมดอายุ — ยกเลิกทั้งหมดได้ด้วย POST revoke_links)
 */
export async function GET(
  request: Request,
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
    const { token, expiresAt, days } = issueConsoleLink(reader, new URL(request.url).searchParams.get("days"));
    return NextResponse.json({ reader: toAdminReader(reader), token, expiresAt, days });
  } catch (err) {
    console.error("[API Admin Reader GET ID Error]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการค้นหาแม่หมอ" }, { status: 500 });
  }
}

const ActionSchema = z.object({
  action: z.literal("revoke_links"),
  days: z.number().int().optional(),
});

/**
 * POST /api/admin/readers/[id] { action: "revoke_links" } - ยกเลิกลิงก์แผงแม่หมอทุกลิงก์ที่เคยออก
 * (เปลี่ยนกุญแจเซ็น) แล้วคืนลิงก์ใหม่ให้ส่งแทนทันที — ใช้ตอนลิงก์หลุดไปถึงคนอื่น หรือแม่หมอเลิกใช้เครื่องเดิม
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  try {
    const parsed = ActionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "คำสั่งไม่ถูกต้อง" }, { status: 400 });
    }
    const reader = await rotateReaderSessionSecret(id);
    if (!reader) {
      return NextResponse.json({ error: "ไม่พบแม่หมอที่ระบุ" }, { status: 404 });
    }
    await recordAudit("revoke_reader_links", `ยกเลิกลิงก์แผงแม่หมอทั้งหมด: ${reader.displayName} (${id})`);
    const { token, expiresAt, days } = issueConsoleLink(reader, parsed.data.days);
    return NextResponse.json({ reader: toAdminReader(reader), token, expiresAt, days, revoked: true });
  } catch (err) {
    console.error("[API Admin Reader POST Error]", err);
    return NextResponse.json({ error: "ยกเลิกลิงก์ไม่สำเร็จ" }, { status: 500 });
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
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "รูปแบบข้อมูลคำขอไม่ถูกต้อง" },
        { status: 400 }
      );
    }
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

    return NextResponse.json({ reader: toAdminReader(updated), success: true });
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

    /*
     * ยังมีลูกค้าที่จ่ายเงินรอคิวอยู่ หรือมีเงินค้างคืนลูกค้า ➔ `deleteReader` ไม่ลบอะไรเลย
     * ต้องตอบ 409 พร้อมเหตุผลที่แอดมินทำต่อได้ ไม่ใช่ 500 "ลบไม่ได้" ที่ดูเหมือนระบบพัง
     */
    const openPaid = await countOpenPaidConsultations(id);
    if (openPaid > 0) {
      return NextResponse.json(
        {
          error: `ยังลบไม่ได้ — แม่หมอท่านนี้มีลูกค้าที่จ่ายเงินแล้วรอคิวอยู่ หรือมีเงินที่ต้องคืนลูกค้า ${openPaid} รายการ ปิดคิวหรือคืนเงินให้ครบก่อน (หรือเปลี่ยนสถานะเป็นระงับแทน)`,
          code: "open_paid_consultations",
          openPaid,
        },
        { status: 409 }
      );
    }

    const ok = await deleteReader(id);
    if (!ok) {
      // ระหว่างตรวจกับลบ มีลูกค้าจ่ายเงินเข้ามาพอดี — `deleteReader` ตรวจซ้ำแล้วไม่ลบ
      if ((await countOpenPaidConsultations(id)) > 0) {
        return NextResponse.json(
          { error: "ยังลบไม่ได้ — มีลูกค้าเพิ่งจ่ายเงินเข้ามา ลองโหลดรายการใหม่แล้วตรวจคิวอีกครั้ง", code: "open_paid_consultations" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: "ไม่สามารถลบแม่หมอได้" }, { status: 500 });
    }

    await recordAudit("delete_reader", `ลบแม่หมอ: ${existing.displayName} (${id})`);

    return NextResponse.json({ success: true, message: "ลบแม่หมอเรียบร้อยแล้ว" });
  } catch (err) {
    console.error("[API Admin Reader DELETE Error]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการลบแม่หมอ" }, { status: 500 });
  }
}
