import { NextResponse } from "next/server";
import { z } from "zod";

import { apiFail, apiOk } from "@/lib/api/envelope";
import { getPublicReaderById } from "@/lib/marketplace/readers.repo";
import { getAppDB } from "@/lib/platform/db";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { checkRateLimit, createRateLimitResponse, getClientIdentifier } from "@/lib/utils/rate-limit";

export const runtime = "nodejs";

const WaitlistSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  consent: z.literal(true),
});

/**
 * POST /api/marketplace/readers/[id]/waitlist — "แจ้งเตือนฉันเมื่อแม่หมอมีเวลาว่าง"
 * cron ส่งอีเมลครั้งเดียวเมื่อมีเวลาว่าง แล้วลบอีเมลทิ้งทันที (PDPA) · ลงชื่อซ้ำ = ไม่เพิ่มแถว (UNIQUE)
 * ตอบเหมือนกันทุกกรณี (สำเร็จ/เคยลงไว้แล้ว) — ไม่ยืนยันว่าอีเมลนี้เคยลงชื่อหรือไม่
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึงจากภายนอก" }, { status: 403 });
  }
  const limit = checkRateLimit(`mkt_waitlist:${getClientIdentifier(request)}`, { maxRequests: 5, windowSeconds: 600 });
  if (!limit.allowed) return createRateLimitResponse(limit.retryAfterSeconds, "ลงชื่อบ่อยเกินไป กรุณารอสักครู่");

  const { id } = await params;
  try {
    const parsed = WaitlistSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return apiFail("กรุณากรอกอีเมลให้ถูกต้องและกดยินยอม", 400);
    const reader = await getPublicReaderById(id);
    if (!reader) return apiFail("ไม่พบแม่หมอที่ระบุ", 404);

    const db = await getAppDB();
    await db
      .prepare("INSERT OR IGNORE INTO booking_waitlist (id, reader_id, email, created_at) VALUES (?, ?, ?, ?)")
      .bind(`wait_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`, id, parsed.data.email, Date.now())
      .run();
    return apiOk({});
  } catch (err) {
    console.error("[API Waitlist POST Error]", err);
    return apiFail("ลงชื่อไม่สำเร็จ กรุณาลองใหม่", 500);
  }
}
