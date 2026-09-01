import { NextResponse } from "next/server";
import { z } from "zod";
import { invalidateUserTokens, issueToken } from "@/lib/auth/auth-tokens.repo";
import { sendEmail } from "@/lib/email/send";
import { resetPasswordHtml } from "@/lib/email/templates";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { checkAuthRateLimit } from "@/lib/security/auth-ratelimit";
import { getUserByEmail, normalizeEmail } from "@/lib/users/users.repo";

export const runtime = "nodejs";

const ForgotSchema = z.object({
  email: z.string().trim().email("รูปแบบอีเมลไม่ถูกต้อง").max(120),
});

function getOriginUrl(request: Request): string {
  const url = new URL(request.url);
  const rawHost = request.headers.get("x-forwarded-host") || url.host;
  const protocol = request.headers.get("x-forwarded-proto") || (url.protocol.replace(":", ""));
  return process.env.APP_ORIGIN || `${protocol}://${rawHost}`;
}

export async function POST(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึงจากภายนอก" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = ForgotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: true, message: "หากมีบัญชีนี้อยู่ในระบบ เราได้ส่งลิงก์ตั้งรหัสผ่านใหม่ไปแล้ว" });
    }

    const { email } = parsed.data;
    const emailLower = normalizeEmail(email);

    // Rate Limit Check
    const limit = await checkAuthRateLimit(request, "forgot", emailLower);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `คุณทำรายการบ่อยเกินไป กรุณารออีก ${limit.retryAfterSec || 60} วินาที` },
        { status: 429 }
      );
    }

    const user = await getUserByEmail(emailLower);
    const origin = getOriginUrl(request);

    // Anti-Enumeration: ถ้ามีผู้ใช้ ให้ส่งอีเมลจริง แต่ถ้าไม่มี ก็ตอบ 200 สำเร็จเหมือนกัน
    if (user && user.email) {
      try {
        await invalidateUserTokens(user.id, "reset");
        const resetToken = await issueToken(user.id, "reset", 15 * 60 * 1000);
        const resetLink = `${origin}/reset-password?token=${encodeURIComponent(resetToken)}`;
        await sendEmail(user.email, "คำขอตั้งรหัสผ่านใหม่ — Luminuy Tarot", resetPasswordHtml(resetLink, user.name));
      } catch (err) {
        console.error("[Forgot password send email failed]", err);
      }
    }

    return NextResponse.json({
      ok: true,
      message: "หากมีบัญชีนี้อยู่ในระบบ เราได้ส่งลิงก์ตั้งรหัสผ่านใหม่ไปยังอีเมลของคุณเรียบร้อยแล้ว",
    });
  } catch (err) {
    console.error("[Forgot Password Error]", err);
    return NextResponse.json({ error: "ไม่สามารถดำเนินการได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง" }, { status: 500 });
  }
}
