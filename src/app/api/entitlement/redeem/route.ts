import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { redeemCodeForUser } from "@/lib/entitlement/redeem";
import { getEntitlementSnapshot } from "@/lib/entitlement/snapshot";
import { checkAuthRateLimit } from "@/lib/security/auth-ratelimit";
import { recordEvent } from "@/lib/stats/record";
import { createRateLimitResponse } from "@/lib/utils/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json(
      { error: "กรุณาเข้าสู่ระบบหรือสมัครสมาชิกก่อนเพื่อนำสิทธิ์ไปผูกกับบัญชีของคุณ" },
      { status: 401 },
    );
  }

  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "ข้อมูลคำขอไม่ถูกต้อง" }, { status: 400 });
  }

  const code = (body.code ?? "").trim();
  if (!code) {
    return NextResponse.json({ error: "กรุณาระบุรหัสแลกสิทธิ์" }, { status: 400 });
  }

  // 🎟 กันไล่เดารหัส — เส้นนี้เคยยิงได้รัวไม่จำกัด ขอแค่ล็อกอิน
  // เดาถูกใบเดียว = ได้รอบเปิดไพ่ฟรี (หรือสิทธิ์พรีเมียมถ้าเป็นรหัส VIP) และไม่มีใครรู้ตัว
  // ใช้ถังบน KV ตัวเดียวกับด่านกันเดารหัสผ่าน — อย่าเขียนตัวจำกัดใหม่เอง (ดู auth-ratelimit.ts)
  const limit = await checkAuthRateLimit(request, "redeem", sessionUser.id);
  if (!limit.allowed) {
    recordEvent("redeem_blocked_ratelimit");
    return createRateLimitResponse(
      limit.retryAfterSec ?? 3600,
      "ลองแลกรหัสถี่เกินไป รอสักครู่แล้วลองใหม่",
    );
  }

  const result = await redeemCodeForUser(sessionUser.id, code);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const entitlement = await getEntitlementSnapshot(request);

  // ⚠️ ถ้อยคำต้องตรงกับชนิดของรหัส — ของเดิมบอกว่า "เปิดไพ่ทุกอย่างในเว็บ" ทุกกรณี
  // ซึ่งจริงเฉพาะรหัส VIP (`purchase_*`) เท่านั้น · รหัสแจกได้แค่รอบเปิดไพ่ผังมาตรฐาน
  const message =
    result.kind === "premium"
      ? `แลกรับสิทธิ์สำเร็จ คุณได้รับสิทธิ์เปิดไพ่ทุกอย่างในเว็บจำนวน ${result.credits} ครั้ง`
      : `แลกรับสิทธิ์สำเร็จ คุณได้รับรอบเปิดไพ่เพิ่ม ${result.credits} ครั้ง (ใช้ต่อเมื่อโควตาของวันหมดแล้ว)`;

  return NextResponse.json({
    ok: true,
    message,
    credits: result.credits,
    kind: result.kind,
    code: result.code,
    title: result.title,
    entitlement,
  });
}
