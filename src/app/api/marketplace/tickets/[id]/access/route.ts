import { NextResponse } from "next/server";

import { SITE_ORIGIN } from "@/lib/config/site";
import { verifyBookingAccess } from "@/lib/marketplace/booking-mail";
import { attachCustomerRefCookie } from "@/lib/marketplace/customer-ref";
import { getQueueTicketById } from "@/lib/marketplace/queue.repo";
import { checkRateLimit, createRateLimitResponse, getClientIdentifier } from "@/lib/utils/rate-limit";

export const runtime = "nodejs";

/**
 * GET /api/marketplace/tickets/[id]/access?k=… — ลิงก์ "ดูนัดของฉัน" ในอีเมลยืนยัน/เตือนนัด
 * ---------------------------------------------------------------------------
 * โทเคนเซ็นด้วยกุญแจของเรา ผูกกับเลขตั๋ว + ตัวตนลูกค้า และหมดอายุ 7 วันหลังนัด
 * ผ่าน ➔ ปั๊มคุกกี้ `customerRef` ให้เบราว์เซอร์นี้ แล้วพาไปหน้าคิว (เปลี่ยนเครื่องก็เปิดนัดได้)
 * ไม่ผ่าน ➔ พาไปหน้าคิวเฉย ๆ (ซึ่งตอบ "ไม่พบ" เอง) — ไม่บอกว่าเพราะอะไร
 *
 * ⚠️ redirect ไปที่ path ของเราเองเท่านั้น (SITE_ORIGIN + เลขตั๋วที่ตรวจแล้ว) — ไม่รับปลายทางจาก query
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const limit = checkRateLimit(`mkt_access:${getClientIdentifier(request)}`, { maxRequests: 30, windowSeconds: 600 });
  if (!limit.allowed) return createRateLimitResponse(limit.retryAfterSeconds, "เปิดลิงก์บ่อยเกินไป กรุณารอสักครู่");

  const { id } = await params;
  const target = `${SITE_ORIGIN}/readers/queue/${encodeURIComponent(id)}`;
  const token = new URL(request.url).searchParams.get("k") ?? "";
  const ref = token ? await verifyBookingAccess(token, id) : null;
  const ticket = ref ? await getQueueTicketById(id) : null;

  const res = NextResponse.redirect(target, { status: 303 });
  // ลิงก์มีโทเคน — ห้ามแคชและห้ามส่ง Referer ต่อออกไป
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Referrer-Policy", "no-referrer");
  if (ticket && ref && ticket.customerRef === ref) {
    return attachCustomerRefCookie(res, ref);
  }
  return res;
}
