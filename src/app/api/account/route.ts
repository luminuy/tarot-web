import { NextResponse } from "next/server";
import { clearAuthCookie, getSessionUser, invalidateTokenVersionCache } from "@/lib/auth/session";
import { invalidateUserTokens } from "@/lib/auth/auth-tokens.repo";
import { softDeleteUser } from "@/lib/users/users.repo";
import { deleteAllJournal } from "@/lib/journal/journal.repo";

export const runtime = "nodejs";

export async function DELETE() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" }, { status: 401 });
    }

    // 1. Delete all reading journal entries for this user
    await deleteAllJournal(user.id);

    // 2. Invalidate all active tokens for this user
    await invalidateUserTokens(user.id, "verify");
    await invalidateUserTokens(user.id, "reset");

    // 3. Soft-delete user account (PDPA Right to Erasure)
    await softDeleteUser(user.id);

    // 4. Clear session cookie
    const response = NextResponse.json({
      success: true,
      message: "ลบบัญชีและข้อมูลประวัติดูดวงทั้งหมดเรียบร้อยแล้ว",
    });

    clearAuthCookie(response);
    // ลบบัญชีแล้วต้องไม่เหลือ token_version ค้างในแคช ไม่งั้นคุกกี้ใบเดิมยังผ่านได้อีกไม่เกิน 60 วินาที
    invalidateTokenVersionCache(user.id);
    return response;
  } catch (error) {
    console.error("[Account Deletion Error]:", error);
    return NextResponse.json({ error: "ไม่สามารถดำเนินการลบบัญชีได้" }, { status: 500 });
  }
}
