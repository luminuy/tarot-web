import { NextResponse } from "next/server";
import { z } from "zod";

import { apiFail, apiOk } from "@/lib/api/envelope";
import { getNextAvailableSlot } from "@/lib/marketplace/booking.repo";
import { getPublicReaderById } from "@/lib/marketplace/readers.repo";
import { getAppDB } from "@/lib/platform/db";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { consumeEdgeRateLimits, edgeRateLimitKey } from "@/lib/security/edge-ratelimit";
import { checkRateLimit, createRateLimitResponse, getClientIdentifier } from "@/lib/utils/rate-limit";

export const runtime = "nodejs";

const WaitlistSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  consent: z.literal(true),
});

/** รายชื่อรอต่อแม่หมอหนึ่งคนไม่เกินเท่านี้ — cron ส่งให้ทุกคนพร้อมกันเมื่อมีเวลาว่าง (โควตาอีเมลรายวันมีจำกัด) */
const MAX_WAITLIST_PER_READER = 50;

/** ตัดส่วน `+ป้าย` ของชื่อผู้รับออก — ใช้นับเพดานต่ออีเมล ไม่ใช่ที่อยู่ที่ส่งจริง */
function mailboxKey(email: string): string {
  const at = email.lastIndexOf("@");
  return `${email.slice(0, at).split("+")[0]}@${email.slice(at + 1)}`;
}

/**
 * POST /api/marketplace/readers/[id]/waitlist — "แจ้งเตือนฉันเมื่อแม่หมอมีเวลาว่าง"
 * cron ส่งอีเมลครั้งเดียวเมื่อมีเวลาว่าง แล้วลบอีเมลทิ้งทันที (PDPA) · ลงชื่อซ้ำ = ไม่เพิ่มแถว (UNIQUE)
 * ตอบเหมือนกันทุกกรณี (สำเร็จ/เคยลงไว้แล้ว) — ไม่ยืนยันว่าอีเมลนี้เคยลงชื่อหรือไม่
 *
 * 🔒 อีเมลทุกฉบับจากรายชื่อนี้ใช้โควตาอีเมลรายวันร่วมกับ OTP/รีเซ็ตรหัส/ยืนยันนัด จึงมีด่าน:
 *   • รับลงชื่อเฉพาะตอนแม่หมอไม่มีเวลาว่างจริง (มีเวลาว่างอยู่แล้ว = จองได้เลย ไม่ต้องรอ)
 *   • เพดานถี่แบบข้าม isolate (D1) ต่อ IP และต่อกล่องอีเมล · รายชื่อรอต่อแม่หมอมีเพดาน
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึงจากภายนอก" }, { status: 403 });
  }
  const clientId = getClientIdentifier(request);
  const limit = checkRateLimit(`mkt_waitlist:${clientId}`, { maxRequests: 5, windowSeconds: 600 });
  if (!limit.allowed) return createRateLimitResponse(limit.retryAfterSeconds, "ลงชื่อบ่อยเกินไป กรุณารอสักครู่");

  const { id } = await params;
  try {
    const parsed = WaitlistSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return apiFail("กรุณากรอกอีเมลให้ถูกต้องและกดยินยอม", 400);
    const reader = await getPublicReaderById(id);
    if (!reader) return apiFail("ไม่พบแม่หมอที่ระบุ", 404);

    // แม่หมอมีเวลาว่างอยู่แล้ว ➔ ไม่รับลงชื่อ (หน้าเว็บโชว์ฟอร์มนี้เฉพาะตอนเต็ม — ตรงนี้คือด่านจริง)
    if ((await getNextAvailableSlot(id)) !== null) {
      return apiFail("ตอนนี้แม่หมอมีเวลาว่างแล้ว เลือกเวลาและจองได้เลย", 409, "has_slots");
    }

    const edge = await consumeEdgeRateLimits([
      { key: edgeRateLimitKey("waitlist:ip:day", clientId), config: { max: 10, windowSec: 86_400 } },
      { key: edgeRateLimitKey("waitlist:mailbox:day", mailboxKey(parsed.data.email)), config: { max: 3, windowSec: 86_400 } },
    ]);
    if (!edge.allowed) return createRateLimitResponse(edge.retryAfterSec, "ลงชื่อบ่อยเกินไป กรุณาลองใหม่พรุ่งนี้");

    const db = await getAppDB();
    const size = await db
      .prepare("SELECT COUNT(*) AS count FROM booking_waitlist WHERE reader_id = ?")
      .bind(id)
      .first<{ count: number }>();
    if (Number(size?.count ?? 0) >= MAX_WAITLIST_PER_READER) {
      return apiFail("รายชื่อรอของแม่หมอท่านนี้เต็มแล้ว ลองแวะดูเวลาว่างอีกครั้งภายหลัง", 409, "waitlist_full");
    }
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
