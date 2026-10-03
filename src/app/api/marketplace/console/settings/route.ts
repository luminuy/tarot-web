import { NextResponse } from "next/server";
import { z } from "zod";

import { apiFail, apiOk } from "@/lib/api/envelope";
import { requireReader } from "@/lib/auth/reader-auth";
import { getBlockedDates, replaceBlockedDates } from "@/lib/marketplace/booking.repo";
import { BOOKING_HORIZON_DAYS, BUFFER_OPTIONS, DAILY_CAP_MAX, bkkDateKey } from "@/lib/marketplace/booking-policy";
import { updateReaderBookingSettings } from "@/lib/marketplace/readers.repo";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";

export const runtime = "nodejs";

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

const SettingsSchema = z.object({
  notifyEmail: z.union([z.string().trim().toLowerCase().email().max(254), z.literal("")]).nullable(),
  bufferMin: z.number().int().refine((v) => (BUFFER_OPTIONS as readonly number[]).includes(v)),
  dailyCap: z.number().int().min(1).max(DAILY_CAP_MAX).nullable(),
  blockedDates: z.array(z.string().regex(DATE_KEY)).max(BOOKING_HORIZON_DAYS + 30),
});

/**
 * PUT /api/marketplace/console/settings — ตั้งค่าการรับนัดของแม่หมอ (บันทึกครั้งเดียวทั้งชุด)
 * อีเมลแจ้งเตือน · เวลาพักระหว่างนัด · เพดานนัดต่อวัน · วันหยุดรายวัน
 * นัดที่ลูกค้าจ่ายแล้วไม่ถูกแตะ — มีผลกับเวลาว่างที่จะเปิดต่อจากนี้เท่านั้น
 */
export async function PUT(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึงจากภายนอก" }, { status: 403 });
  }
  const auth = await requireReader(request);
  if (!auth.success) return auth.response;
  try {
    const parsed = SettingsSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return apiFail("ข้อมูลไม่ถูกต้อง ตรวจรูปแบบอีเมลและตัวเลขอีกครั้ง", 400);
    const today = bkkDateKey(Date.now());
    const { notifyEmail, bufferMin, dailyCap, blockedDates } = parsed.data;
    await updateReaderBookingSettings(auth.readerId, { notifyEmail: notifyEmail || null, bufferMin, dailyCap });
    await replaceBlockedDates(auth.readerId, blockedDates.filter((d) => d >= today));
    return apiOk({ blockedDates: await getBlockedDates(auth.readerId) });
  } catch (err) {
    console.error("[API Console Settings PUT Error]", err);
    return apiFail("บันทึกไม่สำเร็จ กรุณาลองใหม่", 500);
  }
}
