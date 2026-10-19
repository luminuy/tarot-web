import { NextResponse } from "next/server";
import { recordEvent } from "@/lib/stats/record";
import { JournalPatchSchema } from "@/lib/journal/journal.schema";
import { getSessionUser } from "@/lib/auth/session";
import { updateJournalMeta, deleteJournalItem } from "@/lib/journal/journal.repo";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { noteHasCrisisSignal } from "@/lib/ai/memory";
import { getCrisisMessage } from "@/lib/safety/guardrails";

export const runtime = "nodejs";

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
    // ✦ สมุดดวง v2: แก้ได้ทีละบางช่อง (ผลจริง · บันทึก · ปักหมุด · แท็ก · ใจ · ยินยอมให้ AI อ่าน · พิธี)
    //   รูปแบบเดิม `{ outcome, userNote }` ยังผ่านสคีมาเดียวกันได้
    const parsed = JournalPatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "ข้อมูลสถานะไม่ถูกต้อง" }, { status: 400 });
    }

    // 🧵 ผูกเส้นเรื่องได้เฉพาะเรื่องของตัวเอง — ห้ามเชื่อรหัสที่ไคลเอนต์ส่งมาเฉย ๆ
    if (parsed.data.threadId) {
      const { getThread } = await import("@/lib/journal/threads.repo");
      const thread = await getThread(userId, parsed.data.threadId);
      if (!thread) return NextResponse.json({ error: "ไม่พบเรื่องที่ติดตามนี้" }, { status: 404 });
    }

    const changed = await updateJournalMeta(userId, id, parsed.data);
    if (changed && parsed.data.threadId) {
      const { touchThread } = await import("@/lib/journal/threads.repo");
      await touchThread(userId, parsed.data.threadId).catch(() => {});
    }
    if (!changed) {
      return NextResponse.json({ error: "ไม่พบบันทึกดวงรายการนี้" }, { status: 404 });
    }

    // 📊 Sync outcome to reading_quality for model telemetry (AI_INTELLIGENCE_PLAN W1.1)
    if (parsed.data.outcome) {
      const { updateQualityOutcome } = await import("@/lib/ai/quality.repo");
      await updateQualityOutcome(id, parsed.data.outcome).catch(() => {});
      // ตัวชี้วัดแผนสะท้อนตัวเอง (หัวข้อ 5): สัดส่วนคำอ่านที่ผู้ใช้กลับมาบันทึกผลจริง
      if (parsed.data.outcome !== "PENDING") recordEvent("journal_outcome_set");
    }
    if (parsed.data.moodAfter !== undefined && parsed.data.moodAfter !== null) recordEvent("journal_mood_after_set");

    /*
     * 🛟 กฎเหล็กข้อ 6 (A3-07): บันทึกที่เขียนมีสัญญาณวิกฤต ➔ บันทึกได้ตามปกติ (ไม่บล็อก)
     * แต่ตอบข้อความสายด่วน 1323 กลับไปให้หน้าเว็บแสดงทันที (รูปแบบเดียวกับ /api/journal/reflect)
     * ตัวบันทึกเองจะไม่ถูกส่งเข้า prompt ของคำอ่านครั้งถัดไป (ดู lib/ai/memory.ts)
     */
    const notes = [parsed.data.userNote, parsed.data.ritual?.morningNote, parsed.data.ritual?.eveningNote];
    const crisis = notes.some((n) => noteHasCrisisSignal(n));
    if (crisis) recordEvent("safety_flag:journal_note_crisis");
    const lang = /^https?:\/\/[^/]+\/en(\/|$|\?)/.test(request.headers.get("referer") ?? "") ? "en" : "th";

    return NextResponse.json({ success: true, ...(crisis ? { crisis: true, crisisMessage: getCrisisMessage(lang) } : {}) });
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
