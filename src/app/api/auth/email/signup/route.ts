import { NextResponse } from "next/server";
import { z } from "zod";
import { signUserSession } from "@/lib/auth/edge-auth";
import { setAuthCookie } from "@/lib/auth/session";
import { issueToken } from "@/lib/auth/auth-tokens.repo";
import { hashPassword } from "@/lib/auth/password";
import { validatePasswordPolicy } from "@/lib/auth/password-policy";
import { sendEmail } from "@/lib/email/send";
import { accountExistsHtml, resetPasswordHtml, verifyEmailHtml } from "@/lib/email/templates";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { checkAuthRateLimit } from "@/lib/security/auth-ratelimit";
import { createEmailUser, getUserByEmail, normalizeEmail } from "@/lib/users/users.repo";
import { resolveAppOrigin } from "@/lib/security/app-origin";

export const runtime = "nodejs";

const SignupSchema = z.object({
  email: z.string().trim().email("รูปแบบอีเมลไม่ถูกต้อง").max(120, "อีเมลยาวเกินไป"),
  password: z.string().min(10, "รหัสผ่านต้องมีความยาวอย่างน้อย 10 ตัวอักษร").max(200, "รหัสผ่านยาวเกินไป"),
  name: z.string().trim().min(1, "กรุณาระบุชื่อของคุณ").max(80, "ชื่อยาวเกินไป"),
});

export async function POST(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึงจากภายนอก" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = SignupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    const { email, password, name } = parsed.data;
    const emailLower = normalizeEmail(email);

    // Rate Limit Check
    const limit = await checkAuthRateLimit(request, "signup", emailLower);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `คุณทำรายการบ่อยเกินไป กรุณารออีก ${limit.retryAfterSec || 60} วินาที` },
        { status: 429 }
      );
    }

    // Password Policy Check
    const policy = validatePasswordPolicy(password, email);
    if (!policy.ok) {
      return NextResponse.json({ error: policy.reason || "รหัสผ่านไม่ผ่านเกณฑ์ความปลอดภัย" }, { status: 400 });
    }

    const origin = resolveAppOrigin(request);
    const existingUser = await getUserByEmail(emailLower);

    // Anti-Enumeration: หากมีบัญชีอยู่แล้ว ให้ตอบ 200 Generic และส่งอีเมลแจ้งเตือน
    if (existingUser) {
      if (existingUser.hasPassword) {
        try {
          await sendEmail(email, "การแจ้งเตือนเกี่ยวกับบัญชี — Luminuy Tarot", accountExistsHtml(existingUser.name));
        } catch {
          // ignore email sending errors
        }
      } else {
        // บัญชีเดิมเป็น OAuth-only → ส่งลิงก์ให้ตั้งรหัสผ่าน
        try {
          const resetToken = await issueToken(existingUser.id, "reset", 15 * 60 * 1000);
          const setupLink = `${origin}/reset-password?token=${encodeURIComponent(resetToken)}`;
          await sendEmail(email, "คำขอตั้งรหัสผ่านใหม่ — Luminuy Tarot", resetPasswordHtml(setupLink, existingUser.name));
        } catch {
          // ignore
        }
      }

      return NextResponse.json({
        ok: true,
        message: "ระบบได้ส่งข้อมูลการยืนยันไปยังอีเมลของคุณเรียบร้อยแล้ว",
        user: null,
      });
    }

    // สร้างบัญชีใหม่
    const passwordHash = await hashPassword(password);
    const newUser = await createEmailUser({
      email,
      name,
      passwordHash,
    });

    // โบนัสสมัครใหม่ (ENTITLEMENT_PLAN ข้อ 5) — idempotent
    try {
      const { grantSignupBonus } = await import("@/lib/entitlement/entitlement");
      await grantSignupBonus(newUser.id);
    } catch (bonusErr) {
      console.error("[Signup bonus failed]", bonusErr);
    }

    // ออก Token ยืนยันอีเมล (อายุ 24 ชม.)
    try {
      const verifyToken = await issueToken(newUser.id, "verify", 24 * 60 * 60 * 1000);
      const verifyLink = `${origin}/api/auth/email/verify?token=${encodeURIComponent(verifyToken)}`;
      await sendEmail(email, "ยืนยันที่อยู่อีเมลของคุณ — Luminuy Tarot", verifyEmailHtml(verifyLink, name));
    } catch (emailErr) {
      console.error("[Signup verify email failed]", emailErr);
    }

    // ออก Session Cookie ให้ใช้งานได้ทันที
    const sessionToken = await signUserSession({
      id: newUser.id,
      provider: "email",
      email: newUser.email || undefined,
      name: newUser.name,
      createdAt: new Date(newUser.createdAt).toISOString(),
      tokenVersion: newUser.tokenVersion,
    });

    const response = NextResponse.json({
      ok: true,
      message: "สร้างบัญชีสำเร็จ กรุณาตรวจสอบอีเมลเพื่อยืนยันตัวตน",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        emailVerified: false,
      },
    });

    setAuthCookie(response, sessionToken);

    return response;
  } catch (err) {
    console.error("[Email Signup Error]", err);
    return NextResponse.json({ error: "ไม่สามารถสร้างบัญชีได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง" }, { status: 500 });
  }
}
