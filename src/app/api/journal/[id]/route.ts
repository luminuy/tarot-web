import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifyUserSession } from "@/lib/auth/edge-auth";
import { updateJournalOutcome, deleteJournalItem } from "@/lib/journal/journal.repo";

export const runtime = "nodejs";

const UpdateOutcomeSchema = z.object({
  outcome: z.enum(["PENDING", "ACCURATE", "PARTIAL", "NOT_HAPPENED"]),
  userNote: z.string().optional(),
});

async function getAuthenticatedUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("tarot_auth_session")?.value;
  if (!token) return null;
  const user = await verifyUserSession(token);
  return user?.id || null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "ต้องเข้าสู่ระบบเพื่อแก้ไขประวัติ" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const parsed = UpdateOutcomeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "ข้อมูลสถานะไม่ถูกต้อง" }, { status: 400 });
    }

    await updateJournalOutcome(userId, id, parsed.data.outcome, parsed.data.userNote);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Journal Item PATCH Error]:", error);
    return NextResponse.json({ error: "ไม่สามารถอัปเดตสถานะบันทึกได้" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "ต้องเข้าสู่ระบบเพื่อลบประวัติ" }, { status: 401 });
    }

    const { id } = await params;
    await deleteJournalItem(userId, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Journal Item DELETE Error]:", error);
    return NextResponse.json({ error: "ไม่สามารถลบบันทึกได้" }, { status: 500 });
  }
}
