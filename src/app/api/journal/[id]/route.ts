import { NextResponse } from "next/server";
import { z } from "zod";
import { JournalItemSchema, JournalOutcomeSchema } from "@/lib/journal/journal.schema";
import { getSessionUser } from "@/lib/auth/session";
import { updateJournalOutcome, deleteJournalItem } from "@/lib/journal/journal.repo";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";

export const runtime = "nodejs";

const UpdateOutcomeSchema = z.object({
  outcome: JournalOutcomeSchema,
  userNote: JournalItemSchema.shape.userNote,
});

async function getAuthenticatedUserId(): Promise<string | null> {
  const user = await getSessionUser();
  return user?.id || null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึงจากภายนอก" }, { status: 403 });
  }

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

    const changed = await updateJournalOutcome(userId, id, parsed.data.outcome, parsed.data.userNote);
    if (!changed) {
      return NextResponse.json({ error: "ไม่พบบันทึกดวงรายการนี้" }, { status: 404 });
    }

    // 📊 Sync outcome to reading_quality for model telemetry (AI_INTELLIGENCE_PLAN W1.1)
    const { updateQualityOutcome } = await import("@/lib/ai/quality.repo");
    await updateQualityOutcome(id, parsed.data.outcome).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Journal Item PATCH Error]:", error);
    return NextResponse.json({ error: "ไม่สามารถอัปเดตสถานะบันทึกได้" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึงจากภายนอก" }, { status: 403 });
  }

  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "ต้องเข้าสู่ระบบเพื่อลบประวัติ" }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await deleteJournalItem(userId, id);
    if (!deleted) {
      return NextResponse.json({ error: "ไม่พบบันทึกดวงรายการนี้" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Journal Item DELETE Error]:", error);
    return NextResponse.json({ error: "ไม่สามารถลบบันทึกได้" }, { status: 500 });
  }
}
