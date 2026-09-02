import { NextResponse } from "next/server";
import { z } from "zod";
import { signUserSession } from "@/lib/auth/edge-auth";
import { invalidateTokenVersionCache, setAuthCookie } from "@/lib/auth/session";
import { consumeToken, invalidateUserTokens } from "@/lib/auth/auth-tokens.repo";
import { hashPassword, isPasswordConfigError } from "@/lib/auth/password";
import { validatePasswordPolicy } from "@/lib/auth/password-policy";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { checkAuthRateLimit } from "@/lib/security/auth-ratelimit";
import { getUserById, setPasswordHash } from "@/lib/users/users.repo";

export const runtime = "nodejs";

const ResetSchema = z.object({
  token: z.string().trim().min(1, "กรุณาระบุ Token"),
  password: z.string().min(10, "รหัสผ่านต้องมีความยาวอย่างน้อย 10 ตัวอักษร").max(200, "รหัสผ่านยาวเกินไป"),
});

export async function POST(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึงจากภายนอก" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = ResetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    const { token, password } = parsed.data;

    // กันการยิง token มั่ว ๆ รัว ๆ ต่อ IP (token สุ่ม 32 ไบต์เดาไม่ได้จริง แต่ไม่ควรปล่อยให้ยิงฟรี)
    const limit = await checkAuthRateLimit(request, "reset");
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `คุณทำรายการบ่อยเกินไป กรุณารออีก ${limit.retryAfterSec || 60} วินาที` },
        { status: 429 }
      );
    }

    // Consume single-use reset token
    const tokenResult = await consumeToken(token, "reset");
    if (!tokenResult) {
      return NextResponse.json(
        { error: "ลิงก์ตั้งรหัสผ่านนี้หมดอายุหรือถูกใช้งานไปแล้ว กรุณากดขอลิงก์ใหม่อีกครั้ง" },
        { status: 400 }
      );
    }

    const user = await getUserById(tokenResult.userId);
    if (!user) {
      return NextResponse.json({ error: "ไม่พบข้อมูลบัญชีผู้ใช้" }, { status: 404 });
    }

    // Password Policy Check
    const policy = validatePasswordPolicy(password, user.email || undefined);
    if (!policy.ok) {
      return NextResponse.json({ error: policy.reason || "รหัสผ่านไม่ผ่านเกณฑ์ความปลอดภัย" }, { status: 400 });
    }

    // Hash & Save (bumps token_version automatically)
    const newHash = await hashPassword(password);
    await setPasswordHash(user.id, newHash);
    // เตะเซสชันเก่าทุกอุปกรณ์ทันที (จุดประสงค์หลักของการรีเซ็ตรหัสผ่าน)
    invalidateTokenVersionCache(user.id);
    await invalidateUserTokens(user.id, "reset");

    // ดึงข้อมูลผู้ใช้ล่าสุดหลังอัปเดต token_version
    const updatedUser = await getUserById(user.id);

    // ออก Session Cookie ใหม่
    const sessionToken = await signUserSession({
      id: user.id,
      provider: user.provider,
      email: user.email || undefined,
      name: user.name,
      createdAt: new Date(user.createdAt).toISOString(),
      tokenVersion: updatedUser?.tokenVersion ?? user.tokenVersion + 1,
    });

    const response = NextResponse.json({
      ok: true,
      message: "ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    });

    setAuthCookie(response, sessionToken);

    return response;
  } catch (err) {
    if (isPasswordConfigError(err)) {
      console.error("[Reset Password] ตั้งค่าไม่ครบ:", err.message);
      return NextResponse.json({ error: "ระบบเข้าสู่ระบบด้วยอีเมลยังไม่พร้อมใช้งาน (ผู้ดูแลระบบยังตั้งค่าไม่ครบ) ระหว่างนี้ใช้ปุ่ม Google เข้าสู่ระบบได้ตามปกติ" }, { status: 503 });
    }
    console.error("[Reset Password Error]", err);
    return NextResponse.json({ error: "ไม่สามารถตั้งรหัสผ่านใหม่ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง" }, { status: 500 });
  }
}
