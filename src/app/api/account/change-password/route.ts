import { NextResponse } from "next/server";
import { z } from "zod";
import { signUserSession } from "@/lib/auth/edge-auth";
import { getSessionUser, invalidateTokenVersionCache, setAuthCookie } from "@/lib/auth/session";
import { hashPassword, isPasswordConfigError, verifyPassword } from "@/lib/auth/password";
import { validatePasswordPolicy } from "@/lib/auth/password-policy";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { checkAuthRateLimit } from "@/lib/security/auth-ratelimit";
import { getUserById, getUserPasswordHash, setPasswordHash } from "@/lib/users/users.repo";

export const runtime = "nodejs";

const ChangePasswordSchema = z.object({
  oldPassword: z.string().optional(),
  newPassword: z.string().min(10, "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 10 ตัวอักษร").max(200, "รหัสผ่านยาวเกินไป"),
});

export async function POST(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึงจากภายนอก" }, { status: 403 });
  }

  try {
    const session = await getSessionUser();
    if (!session?.id) {
      return NextResponse.json({ error: "เซสชันไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่" }, { status: 401 });
    }

    // Rate Limit Check
    const limit = await checkAuthRateLimit(request, "login", session.id);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `คุณทำรายการบ่อยเกินไป กรุณารออีก ${limit.retryAfterSec || 60} วินาที` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = ChangePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    const { oldPassword, newPassword } = parsed.data;
    const user = await getUserById(session.id);
    if (!user) {
      return NextResponse.json({ error: "ไม่พบข้อมูลบัญชีผู้ใช้" }, { status: 404 });
    }

    // ถ้าผู้ใช้เคยตั้งรหัสผ่านไว้แล้ว ต้องตรวจรหัสผ่านเดิมก่อน
    if (user.hasPassword) {
      if (!oldPassword) {
        return NextResponse.json({ error: "กรุณาระบุรหัสผ่านเดิม" }, { status: 400 });
      }

      const currentHash = await getUserPasswordHash(user.id);
      if (!currentHash || !(await verifyPassword(oldPassword, currentHash))) {
        return NextResponse.json({ error: "รหัสผ่านเดิมไม่ถูกต้อง" }, { status: 400 });
      }
    }

    // ตรวจสอบความปลอดภัยของรหัสผ่านใหม่
    const policy = validatePasswordPolicy(newPassword, user.email || undefined);
    if (!policy.ok) {
      return NextResponse.json({ error: policy.reason || "รหัสผ่านไม่ผ่านเกณฑ์ความปลอดภัย" }, { status: 400 });
    }

    // แฮชและบันทึกรหัสผ่านใหม่ (เพิ่ม token_version อัตโนมัติเพื่อเตะ session เก่าบนเครื่องอื่นออก)
    const newHash = await hashPassword(newPassword);
    await setPasswordHash(user.id, newHash);
    // เตะเซสชันเก่าทันที ไม่ต้องรอแคช token_version หมดอายุเอง
    invalidateTokenVersionCache(user.id);

    const updatedUser = await getUserById(user.id);

    // ออก Session Cookie ใหม่
    const newSessionToken = await signUserSession({
      id: user.id,
      provider: user.provider,
      email: user.email || undefined,
      name: user.name,
      createdAt: new Date(user.createdAt).toISOString(),
      tokenVersion: updatedUser?.tokenVersion ?? user.tokenVersion + 1,
    });

    const response = NextResponse.json({
      ok: true,
      message: "เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว",
    });

    setAuthCookie(response, newSessionToken);

    return response;
  } catch (err) {
    if (isPasswordConfigError(err)) {
      console.error("[Change Password] ตั้งค่าไม่ครบ:", err.message);
      return NextResponse.json({ error: "ระบบเข้าสู่ระบบด้วยอีเมลยังไม่พร้อมใช้งาน (ผู้ดูแลระบบยังตั้งค่าไม่ครบ) ระหว่างนี้ใช้ปุ่ม Google เข้าสู่ระบบได้ตามปกติ" }, { status: 503 });
    }
    console.error("[Change Password Error]", err);
    return NextResponse.json({ error: "ไม่สามารถเปลี่ยนรหัสผ่านได้ในขณะนี้" }, { status: 500 });
  }
}
