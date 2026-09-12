import { NextResponse } from "next/server";
import { z } from "zod";

import { recordAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  createRedeemCode,
  listRedeemCodes,
  updateRedeemCode,
} from "@/lib/entitlement/redeem-admin.repo";

export const runtime = "nodejs";

const CreateRedeemSchema = z.object({
  code: z
    .string()
    .trim()
    .min(4, "รหัสต้องมีอย่างน้อย 4 ตัวอักษร")
    .max(32, "รหัสยาวเกินไป (สูงสุด 32 ตัวอักษร)"),
  title: z
    .string()
    .trim()
    .min(1, "กรุณาระบุชื่อแคมเปญ")
    .max(100, "ชื่อแคมเปญยาวเกินไป"),
  credits: z
    .number()
    .int("จำนวนสิทธิ์ต้องเป็นจำนวนเต็ม")
    .min(1, "จำนวนสิทธิ์ขั้นต่ำคือ 1 ครั้ง")
    .max(100, "จำนวนสิทธิ์สูงสุดคือ 100 ครั้ง"),
  kind: z.enum(["premium", "quota"] as const),
  // ⚠️ INC-0134: ไม่มีตัวเลือก "ไม่จำกัดคน" และ "ไม่มีวันหมดอายุ" อีกต่อไป
  // รหัสที่ไม่มีเพดานคือรหัสที่หลุดแล้วดับไม่ได้ · ชั้น repo ก็ปฏิเสธซ้ำอีกชั้น
  maxUses: z
    .number()
    .int()
    .min(1, "ต้องระบุเพดานจำนวนคนแลกอย่างน้อย 1")
    .max(100000, "จำนวนครั้งที่แลกต้องไม่เกิน 100,000"),
  expiresAt: z.number().int().positive("ต้องระบุวันหมดอายุ"),
});

const UpdateRedeemSchema = z.object({
  code: z.string().trim().min(1, "กรุณาระบุรหัสที่ต้องการแก้ไข"),
  title: z.string().trim().min(1).max(100).optional(),
  maxUses: z.number().int().min(1).max(100000).optional(),
  expiresAt: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/admin/redeem
 * ดึงรายการรหัสทั้งหมด และสรุปสถิติ
 */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const codes = await listRedeemCodes();
    const totalRedemptions = codes.reduce((sum, c) => sum + c.actualRedeemedCount, 0);

    return NextResponse.json({
      codes,
      totalCodes: codes.length,
      totalRedemptions,
      success: true,
    });
  } catch (err) {
    console.error("[API Admin Redeem GET Error]", err);
    return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลรหัสแลกสิทธิ์ได้" }, { status: 500 });
  }
}

/**
 * POST /api/admin/redeem
 * สร้างรหัสแลกสิทธิ์ใหม่
 */
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await request.json();
    const parsed = CreateRedeemSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstIssue ? firstIssue.message : "ข้อมูลไม่ถูกต้อง", details: parsed.error.format() },
        { status: 400 },
      );
    }

    const created = await createRedeemCode(parsed.data);

    // Audit log ปลอดภัย ไร้ PII ตามมาตรฐาน PDPA
    await recordAudit(
      "redeem_code_create",
      `สร้างรหัส: ${created.code} (${created.credits} สิทธิ์, ${created.reasonPrefix}, เพดาน: ${created.maxUses})`,
    );

    return NextResponse.json({ code: created, success: true }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[API Admin Redeem POST Error]", err);
    return NextResponse.json({ error: msg || "เกิดข้อผิดพลาดในการสร้างรหัสแลกสิทธิ์" }, { status: 400 });
  }
}

/**
 * PATCH /api/admin/redeem
 * แก้ไขรหัสแลกสิทธิ์ (title, max_uses, expires_at, is_active)
 */
export async function PATCH(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await request.json();
    const parsed = UpdateRedeemSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstIssue ? firstIssue.message : "ข้อมูลไม่ถูกต้อง", details: parsed.error.format() },
        { status: 400 },
      );
    }

    const { code, ...patch } = parsed.data;
    const updated = await updateRedeemCode(code, patch);

    // Audit log ปลอดภัย ไร้ PII
    if (patch.isActive !== undefined) {
      await recordAudit(
        "redeem_code_toggle",
        `สลับสถานะรหัส: ${updated.code} เป็น ${updated.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}`,
      );
    } else {
      await recordAudit("redeem_code_update", `แก้ไขรหัส: ${updated.code}`);
    }

    return NextResponse.json({ code: updated, success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[API Admin Redeem PATCH Error]", err);
    return NextResponse.json({ error: msg || "เกิดข้อผิดพลาดในการแก้ไขรหัสแลกสิทธิ์" }, { status: 400 });
  }
}
