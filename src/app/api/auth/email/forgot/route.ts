import { NextResponse } from "next/server";
import { z } from "zod";
import { invalidateUserTokens, issueToken } from "@/lib/auth/auth-tokens.repo";
import { sendEmail } from "@/lib/email/send";
import { resetPasswordHtml, resetPasswordText } from "@/lib/email/templates";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { checkAuthRateLimit } from "@/lib/security/auth-ratelimit";
import { getRequestIp, verifyTurnstile } from "@/lib/security/turnstile";
import { getUserByEmail, normalizeEmail } from "@/lib/users/users.repo";
import { resolveAppOrigin } from "@/lib/security/app-origin";

export const runtime = "nodejs";

const ForgotSchema = z.object({
  email: z.string().trim().email("รูปแบบอีเมลไม่ถูกต้อง").max(120),
});

export async function POST(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึงจากภายนอก" }, { status: 403 });
  }

  const isEnglish = /seertarot_lang=en/.test(request.headers.get("cookie") || "") || request.headers.get("referer")?.includes("/en");
  const lang: "th" | "en" = isEnglish ? "en" : "th";

  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: isEnglish ? "Invalid request format" : "รูปแบบข้อมูลคำขอไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    // ด่านกันบอท (Turnstile) — ผ่านตลอดถ้ายังไม่ได้ตั้ง TURNSTILE_SECRET_KEY
    const turnstileToken = typeof body?.turnstileToken === "string" ? body.turnstileToken : undefined;
    const ts = await verifyTurnstile(turnstileToken, getRequestIp(request));
    if (!ts.ok) {
      console.warn(`[turnstile] forgot ปฏิเสธ: ${ts.reason}`);
      return NextResponse.json(
        { error: isEnglish ? "Bot verification failed. Please refresh and try again." : "ระบบตรวจพบว่าอาจไม่ใช่การใช้งานจากคนจริง กรุณารีเฟรชหน้าแล้วลองใหม่" },
        { status: 403 },
      );
    }

    const parsed = ForgotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({
        ok: true,
        message: isEnglish ? "If this account exists, we have sent a password reset link." : "หากมีบัญชีนี้อยู่ในระบบ เราได้ส่งลิงก์ตั้งรหัสผ่านใหม่ไปแล้ว",
      });
    }

    const { email } = parsed.data;
    const emailLower = normalizeEmail(email);

    // Rate Limit Check
    const limit = await checkAuthRateLimit(request, "forgot", emailLower);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: isEnglish ? `Too many requests. Please wait ${limit.retryAfterSec || 60} seconds.` : `คุณทำรายการบ่อยเกินไป กรุณารออีก ${limit.retryAfterSec || 60} วินาที` },
        { status: 429 }
      );
    }

    const user = await getUserByEmail(emailLower);
    const origin = resolveAppOrigin(request);

    // Anti-Enumeration: ถ้ามีผู้ใช้ ให้ส่งอีเมลจริง แต่ถ้าไม่มี ก็ตอบ 200 สำเร็จเหมือนกัน
    if (user && user.email) {
      try {
        await invalidateUserTokens(user.id, "reset");
        const resetToken = await issueToken(user.id, "reset", 15 * 60 * 1000);
        const resetLink = `${origin}${isEnglish ? "/en" : ""}/reset-password?token=${encodeURIComponent(resetToken)}`;
        await sendEmail(
          user.email,
          isEnglish ? "Reset Your Password — SeerTarot" : "คำขอตั้งรหัสผ่านใหม่ — SeerTarot",
          resetPasswordHtml(resetLink, user.name, lang),
          resetPasswordText(resetLink, user.name, lang)
        );
      } catch (err) {
        console.error("[Forgot password send email failed]", err);
      }
    }

    return NextResponse.json({
      ok: true,
      message: isEnglish ? "If this account exists in our system, a password reset link has been sent to your email." : "หากมีบัญชีนี้อยู่ในระบบ เราได้ส่งลิงก์ตั้งรหัสผ่านใหม่ไปยังอีเมลของคุณเรียบร้อยแล้ว",
    });
  } catch (err) {
    console.error("[Forgot Password Error]", err);
    return NextResponse.json({ error: isEnglish ? "Unable to process request at this time. Please try again." : "ไม่สามารถดำเนินการได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง" }, { status: 500 });
  }
}
