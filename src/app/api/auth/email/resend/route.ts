import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { issueToken } from "@/lib/auth/auth-tokens.repo";
import { sendEmail } from "@/lib/email/send";
import { verifyEmailHtml } from "@/lib/email/templates";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { checkAuthRateLimit } from "@/lib/security/auth-ratelimit";
import { getUserById } from "@/lib/users/users.repo";
import { resolveAppOrigin } from "@/lib/security/app-origin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึงจากภายนอก" }, { status: 403 });
  }

  try {
    const session = await getSessionUser();
    if (!session?.id) {
      return NextResponse.json({ error: "เซสชันไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่" }, { status: 401 });
    }

    // Rate Limit Check per user
    const limit = await checkAuthRateLimit(request, "resend", session.id);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `คุณขอส่งอีเมลบ่อยเกินไป กรุณารออีก ${limit.retryAfterSec || 60} วินาที` },
        { status: 429 }
      );
    }

    const user = await getUserById(session.id);
    if (!user || !user.email) {
      return NextResponse.json({ error: "ไม่พบบัญชีผู้ใช้หรือที่อยู่อีเมล" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ ok: true, message: "อีเมลของคุณได้รับการยืนยันเรียบร้อยแล้ว" });
    }

    const origin = resolveAppOrigin(request);
    const verifyToken = await issueToken(user.id, "verify", 24 * 60 * 60 * 1000);
    const verifyLink = `${origin}/api/auth/email/verify?token=${encodeURIComponent(verifyToken)}`;

    await sendEmail(user.email, "ยืนยันที่อยู่อีเมลของคุณ — SeerTarot", verifyEmailHtml(verifyLink, user.name));

    return NextResponse.json({ ok: true, message: "ส่งลิงก์ยืนยันใหม่ไปยังอีเมลของคุณเรียบร้อยแล้ว" });
  } catch (err) {
    console.error("[Resend Verify Email Error]", err);
    return NextResponse.json({ error: "ไม่สามารถส่งอีเมลได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง" }, { status: 500 });
  }
}
