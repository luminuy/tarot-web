import { NextResponse } from "next/server";
import { z } from "zod";
import { signUserSession } from "@/lib/auth/edge-auth";
import { setAuthCookie } from "@/lib/auth/session";
import { isPasswordConfigError, verifyPassword } from "@/lib/auth/password";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { clearAuthRateLimit, peekAuthRateLimit, recordAuthFailure } from "@/lib/security/auth-ratelimit";
import { getUserByEmail, getUserPasswordHash, normalizeEmail, touchLastSeen } from "@/lib/users/users.repo";

export const runtime = "nodejs";

/**
 * แฮชหลอกสำหรับหน่วงเวลาให้เท่ากับกรณีที่มีบัญชีจริง (กัน user enumeration ผ่าน timing)
 * ต้องมีรูปแบบ PHC ที่ถอดได้จริง ไม่งั้น verifyPassword() คืน false ตั้งแต่ยังไม่ทันคำนวณ
 * และเวลาตอบจะสั้นกว่าเคสมีบัญชีอย่างเห็นได้ชัด
 */
const DUMMY_PASSWORD_HASH =
  "pbkdf2$sha256$100000$BwcHBwcHBwcHBwcHBwcHBw$CwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCws";

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

    // ── Rate Limit: "ตรวจก่อน นับเฉพาะที่ผิด" ────────────────────────────────
    // ห้ามนับทุกครั้งที่เรียก — ของเดิมนับรวมครั้งที่ล็อกอินสำเร็จด้วย ทำให้
    // (1) ใครก็ได้ที่รู้อีเมลของเหยื่อ ยิงรหัสผ่านมั่ว ๆ ให้ครบเพดานเพื่อล็อกเจ้าของบัญชีออก
    // (2) คนใช้เน็ตมือถือที่แชร์ IP กัน (CGNAT) กินโควตากันเองจนล็อกอินไม่ได้
    const limit = await peekAuthRateLimit(request, "login", emailLower);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `คุณลองเข้าสู่ระบบผิดบ่อยเกินไป กรุณารออีก ${limit.retryAfterSec || 60} วินาที` },
        { status: 429 }
      );
    }

    const invalidCredentials = async () => {
      await recordAuthFailure(request, "login", emailLower);
      return NextResponse.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    };

    const user = await getUserByEmail(emailLower);

    // Anti-Enumeration: ถ้าไม่มีผู้ใช้ หรือไม่มี password_hash หรือรหัสผ่านไม่ถูกต้อง ให้ตอบ 401 ข้อความเดียวกันหมด
    if (!user || !user.hasPassword) {
      // Dummy check to prevent timing analysis
      await verifyPassword(password, DUMMY_PASSWORD_HASH);
      return invalidCredentials();
    }

    const storedHash = await getUserPasswordHash(user.id);
    if (!storedHash) {
      await verifyPassword(password, DUMMY_PASSWORD_HASH);
      return invalidCredentials();
    }

    const isMatch = await verifyPassword(password, storedHash);
    if (!isMatch) {
      return invalidCredentials();
    }

    // ล็อกอินสำเร็จ → ล้างถังของบัญชีนี้ (ถัง IP ยังคงอยู่ เพื่อกันการไล่เดารหัสผ่านเป็นชุด)
    await clearAuthRateLimit(request, "login", emailLower);

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

    setAuthCookie(response, sessionToken);

    return response;
  } catch (err) {
    // ⚠️ ระบบตั้งค่าไม่ครบ ต้องไม่ตอบว่า "รหัสผ่านไม่ถูกต้อง" — ผู้ใช้จะนั่งลองรหัสผ่านซ้ำ ๆ
    // และเจ้าของระบบจะไล่หาสาเหตุไม่เจอ เพราะหน้าเว็บชี้ไปผิดที่ (บทเรียน INC-0045)
    if (isPasswordConfigError(err)) {
      console.error("[Email Login] ตั้งค่าไม่ครบ:", err.message);
      return NextResponse.json({ error: "ระบบเข้าสู่ระบบด้วยอีเมลยังไม่พร้อมใช้งาน (ผู้ดูแลระบบยังตั้งค่าไม่ครบ) ระหว่างนี้ใช้ปุ่ม Google เข้าสู่ระบบได้ตามปกติ" }, { status: 503 });
    }
    console.error("[Email Login Error]", err);
    return NextResponse.json({ error: "ไม่สามารถเข้าสู่ระบบได้ในขณะนี้" }, { status: 500 });
  }
}
