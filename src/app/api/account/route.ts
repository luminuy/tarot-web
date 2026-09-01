import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyUserSession } from "@/lib/auth/edge-auth";
import { softDeleteUser } from "@/lib/users/users.repo";
import { deleteAllJournal } from "@/lib/journal/journal.repo";

export const runtime = "nodejs";

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("tarot_auth_session")?.value;
    if (!token) {
      return NextResponse.json({ error: "ต้องเข้าสู่ระบบก่อนขอลบบัญชี" }, { status: 401 });
    }

    const user = await verifyUserSession(token);
    if (!user) {
      return NextResponse.json({ error: "เซสชันหมดอายุ" }, { status: 401 });
    }

    // 1. Delete all reading journal entries for this user
    await deleteAllJournal(user.id);

    // 2. Soft-delete user account (PDPA Right to Erasure)
    await softDeleteUser(user.id);

    // 3. Clear session cookie
    const response = NextResponse.json({
      success: true,
      message: "ลบบัญชีและข้อมูลประวัติดูดวงทั้งหมดเรียบร้อยแล้ว",
    });

    response.cookies.delete("tarot_auth_session");
    return response;
  } catch (error) {
    console.error("[Account Deletion Error]:", error);
    return NextResponse.json({ error: "ไม่สามารถดำเนินการลบบัญชีได้" }, { status: 500 });
  }
}
