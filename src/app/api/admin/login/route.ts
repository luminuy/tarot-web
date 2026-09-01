import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";

import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE,
  isAdminConfigured,
  signAdminSession,
  verifyAdminPassword,
} from "@/lib/auth/admin-auth";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from "@/lib/utils/rate-limit";
import { recordAudit } from "@/lib/admin/audit";

export const runtime = "nodejs";

const BodySchema = z.object({ password: z.string().min(1).max(200) });

export async function POST(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาต" }, { status: 403 });
  }
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "ยังไม่ได้ตั้งค่า ADMIN_PASSWORD บนเซิร์ฟเวอร์" },
      { status: 503 },
    );
  }

  // กัน brute-force: 5 ครั้ง / 15 นาที ต่อ IP
  const clientIp = getClientIdentifier(request);
  const limit = checkRateLimit(`admin_login:${clientIp}`, {
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

  if (!verifyAdminPassword(parsed.data.password)) {
    await recordAudit("admin_login_fail");
    return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }

  (await cookies()).set(ADMIN_COOKIE_NAME, signAdminSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
  await recordAudit("admin_login_success");

  return NextResponse.json({ ok: true });
}
