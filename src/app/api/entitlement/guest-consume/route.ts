import { NextResponse } from "next/server";

import { GUEST_LIMIT } from "@/lib/entitlement/entitlement";
import {
  GUEST_COOKIE_NAME,
  GUEST_COOKIE_OPTIONS,
  guestCookieValue,
  markGuestUsedOnServer,
  readGuestCookie,
  verifyGuestConsumeTicket,
} from "@/lib/entitlement/guest";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { recordEvent } from "@/lib/stats/record";

export const runtime = "nodejs";

/**
 * POST /api/entitlement/guest-consume — หักสิทธิ์ฟรีของผู้เยี่ยมชม "หลัง" อ่านจบจริง
 * ------------------------------------------------------------------------------
 * เดิม read route แปะ `Set-Cookie used=1` บน header ของ SSE response ตั้งแต่สตรีม
 * เริ่ม → ถ้า AI ล้มระหว่างทาง ผู้เยี่ยมชมเสียสิทธิ์ฟรีทั้งที่ยังไม่ได้อ่านอะไร
 * (สมาชิกไม่โดนเพราะ refundReading ลบแถว DB ได้ แต่คุกกี้ที่ส่งไปแล้วดึงกลับไม่ได้)
 *
 * ตอนนี้ read route ออก `guestConsumeTicket` (เซ็น HMAC) เฉพาะตอน event `done`
 * ที่เป็นคำอ่านจริง — failure path ทุกทางไม่มีทางได้ ticket → ไม่มีทางเสียสิทธิ์
 * client ยิง ticket มาที่นี่ แล้วเราจึง Set-Cookie used=1
 *
 * การบังคับสิทธิ์จริงยังอยู่ที่ `start`/`read` ที่อ่านคุกกี้ทุกครั้ง — endpoint นี้แค่ "บันทึก"
 */
export async function POST(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json(
      { error: "ไม่อนุญาตให้เข้าถึง API จากภายนอก (Unauthorized Origin)" },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as { ticket?: unknown } | null;
  const ticketStr = typeof body?.ticket === "string" ? body.ticket : "";
  if (!ticketStr) {
    return NextResponse.json({ error: "ticket ไม่ครบ" }, { status: 400 });
  }

  const rid = await verifyGuestConsumeTicket(ticketStr);
  if (!rid) {
    return NextResponse.json({ error: "ticket ไม่ถูกต้องหรือหมดอายุ" }, { status: 401 });
  }

  // อ่านคุกกี้เดิม — used ครบแล้วก็แค่ยืนยัน (idempotent) ไม่นับ event ซ้ำ
  const current = await readGuestCookie();
  const gid = current?.gid ?? `g_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;

  const res = NextResponse.json({ ok: true, used: GUEST_LIMIT });
  const token = await guestCookieValue({ gid, used: GUEST_LIMIT }).catch(() => null);
  if (token) {
    res.cookies.set(GUEST_COOKIE_NAME, token, GUEST_COOKIE_OPTIONS);
  }

  // defense-in-depth: read route mark ให้แล้ว แต่กันกรณี client ยิงตรงนี้โดยไม่ผ่าน read done
  void markGuestUsedOnServer(gid);

  if (!current || current.used < GUEST_LIMIT) {
    recordEvent("entitlement_guest_consumed");
  }

  return res;
}
