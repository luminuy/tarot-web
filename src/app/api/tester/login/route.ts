import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";

import {
  TESTER_COOKIE_NAME,
  TESTER_SESSION_MAX_AGE,
  isTesterConfigured,
  signTesterSession,
  verifyTesterPassword,
} from "@/lib/auth/tester-auth";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from "@/lib/utils/rate-limit";
import { recordEvent } from "@/lib/stats/record";

export const runtime = "nodejs";

const BodySchema = z.object({ password: z.string().min(1).max(200) });

/**
 * POST /api/tester/login — ปลดล็อกการใช้งานเว็บแบบไม่จำกัดสำหรับผู้ทดสอบ
 * ตั้ง cookie `tarot_tester` (30 วัน) · ไม่ให้สิทธิ์แผงแอดมิน
 */
export async function POST(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาต" }, { status: 403 });
  }
  if (!isTesterConfigured()) {
    return NextResponse.json(
      { error: "ยังไม่ได้ตั้งค่า TESTER_PASSWORD บนเซิร์ฟเวอร์" },
      { status: 503 },
    );
  }

  // กัน brute-force: 5 ครั้ง / 15 นาที ต่อ IP
  const clientIp = getClientIdentifier(request);
  const limit = checkRateLimit(`tester_login:${clientIp}`, {
    maxRequests: 5,
    windowSeconds: 15 * 60,
  });
  if (!limit.allowed) {
    return createRateLimitResponse(
      limit.retryAfterSeconds,
      "ลองเข้าระบบถี่เกินไป รอสักครู่แล้วลองใหม่",
    );
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  if (!verifyTesterPassword(parsed.data.password)) {
    recordEvent("tester_login_fail");
    return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }

  (await cookies()).set(TESTER_COOKIE_NAME, signTesterSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TESTER_SESSION_MAX_AGE,
  });
  recordEvent("tester_login_success");

  return NextResponse.json({ ok: true });
}
