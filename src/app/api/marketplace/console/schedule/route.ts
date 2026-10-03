import { NextResponse } from "next/server";
import { apiOk } from "@/lib/api/envelope";
import { z } from "zod";

import { requireReader } from "@/lib/auth/reader-auth";
import { getScheduleRules, replaceScheduleRules } from "@/lib/marketplace/booking.repo";
import { validateScheduleRules } from "@/lib/marketplace/booking-policy";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";

export const runtime = "nodejs";

const ScheduleSchema = z.object({
  rules: z
    .array(
      z.object({
        weekday: z.number().int().min(0).max(6),
        startMin: z.number().int().min(0).max(1440),
        endMin: z.number().int().min(0).max(1440),
      })
    )
    .max(21),
});

/**
 * PUT /api/marketplace/console/schedule — แม่หมอบันทึกตารางรับนัดประจำสัปดาห์ (ทั้งชุด)
 * นัดที่ลูกค้าจ่ายแล้วไม่ถูกแตะ — ตารางใหม่มีผลกับเวลาว่างที่เปิดให้จองต่อจากนี้เท่านั้น
 */
export async function PUT(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึงจากภายนอก" }, { status: 403 });
  }
  const auth = await requireReader(request);
  if (!auth.success) return auth.response;

  try {
    const parsed = ScheduleSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "รูปแบบตารางเวลาไม่ถูกต้อง" }, { status: 400 });
    }
    const invalid = validateScheduleRules(parsed.data.rules);
    if (invalid) {
      return NextResponse.json({ error: invalid }, { status: 400 });
    }
    await replaceScheduleRules(auth.readerId, parsed.data.rules);
    return apiOk({ schedule: await getScheduleRules(auth.readerId) });
  } catch (err) {
    console.error("[API Console Schedule PUT Error]", err);
    return NextResponse.json({ error: "บันทึกตารางเวลาไม่สำเร็จ" }, { status: 500 });
  }
}
