import { NextResponse } from "next/server";
import { z } from "zod";
import { AUTH_COOKIE_NAME, signUserSession } from "@/lib/auth/edge-auth";
import { verifyPassword } from "@/lib/auth/password";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { checkAuthRateLimit } from "@/lib/security/auth-ratelimit";
import { getUserByEmail, getUserPasswordHash, normalizeEmail, touchLastSeen } from "@/lib/users/users.repo";

export const runtime = "nodejs";

const LoginSchema = z.object({
  email: z.string().trim().email("รูปแบบอีเมลไม่ถูกต้อง").max(120),
  password: z.string().min(1, "กรุณาระบุรหัสผ่าน").max(200),
});

export async function POST(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึงจากภายนอก" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    const { email, password } = parsed.data;
    const emailLower = normalizeEmail(email);

    // Rate Limit Check
    const limit = await checkAuthRateLimit(request, "login", emailLower);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `คุณลองเข้าสู่ระบบผิดบ่อยเกินไป กรุณารออีก ${limit.retryAfterSec || 60} วินาที` },
        { status: 429 }
      );
    }

    const user = await getUserByEmail(emailLower);

    // Anti-Enumeration: ถ้าไม่มีผู้ใช้ หรือไม่มี password_hash หรือรหัสผ่านไม่ถูกต้อง ให้ตอบ 401 ข้อความเดียวกันหมด
    if (!user || !user.hasPassword) {
      // Dummy check to prevent timing analysis
      await verifyPassword(password, "pbkdf2$sha256$150000$dummySaltString$dummyHashString");
      return NextResponse.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    const storedHash = await getUserPasswordHash(user.id);
    if (!storedHash) {
      return NextResponse.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    const isMatch = await verifyPassword(password, storedHash);
    if (!isMatch) {
      return NextResponse.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    // อัปเดตเวลาใช้งานล่าสุด
    await touchLastSeen(user.id);

    // ออก Session Cookie
    const sessionToken = await signUserSession({
      id: user.id,
      provider: user.provider,
      email: user.email || undefined,
      name: user.name,
      createdAt: new Date(user.createdAt).toISOString(),
      tokenVersion: user.tokenVersion,
    });

    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[Email Login Error]", err);
    return NextResponse.json({ error: "ไม่สามารถเข้าสู่ระบบได้ในขณะนี้" }, { status: 500 });
  }
}
