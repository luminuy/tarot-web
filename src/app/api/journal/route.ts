import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifyUserSession } from "@/lib/auth/edge-auth";
import { listJournal, insertJournal, deleteAllJournal } from "@/lib/journal/journal.repo";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from "@/lib/utils/rate-limit";

export const runtime = "nodejs";

const CardDetailSchema = z.object({
  order: z.number(),
  positionName: z.string(),
  cardIndex: z.number(),
  cardNameTh: z.string(),
  cardNameEn: z.string().optional(),
  isReversed: z.boolean(),
  element: z.string().optional(),
});

const SaveReadingSchema = z.object({
  nickname: z.string().optional(),
  question: z.string().min(1, "กรุณาระบุคำถาม"),
  spreadId: z.string().min(1),
  spreadName: z.string().min(1),
  category: z.string().min(1),
  personaId: z.string().min(1),
  personaName: z.string().min(1),
  cards: z.array(CardDetailSchema).min(1, "ต้องมีข้อมูลไพ่อย่างน้อย 1 ใบ"),
  summary: z.string().default(""),
  advice: z.array(z.string()).optional(),
  timing: z.string().optional(),
  outcome: z.enum(["PENDING", "ACCURATE", "PARTIAL", "NOT_HAPPENED"]).optional(),
  userNote: z.string().optional(),
});

async function getAuthenticatedUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("tarot_auth_session")?.value;
  if (!token) return null;
  const user = await verifyUserSession(token);
  return user?.id || null;
}

export async function GET(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "ต้องเข้าสู่ระบบเพื่อเข้าถึงประวัติบนเซิร์ฟเวอร์" }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit")) || 50;
    const before = Number(url.searchParams.get("before")) || undefined;

    const readings = await listJournal(userId, { limit, before });
    return NextResponse.json({ readings });
  } catch (error) {
    console.error("[Journal GET Error]:", error);
    return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลประวัติดูดวงได้" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "ต้องเข้าสู่ระบบเพื่อบันทึกประวัติบนเซิร์ฟเวอร์" }, { status: 401 });
    }

    const clientIp = getClientIdentifier(request);
    const limit = checkRateLimit(`journal_save:${userId || clientIp}`, {
      maxRequests: 30,
      windowSeconds: 60,
    });
    if (!limit.allowed) {
      return createRateLimitResponse(limit.retryAfterSeconds, "บันทึกข้อมูลถี่เกินไป กรุณารอสักครู่");
    }

    const body = await request.json().catch(() => ({}));
    const parsed = SaveReadingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "ข้อมูลบันทึกไม่ถูกต้อง", details: parsed.error.issues }, { status: 400 });
    }

    const saved = await insertJournal(userId, parsed.data);
    return NextResponse.json({ reading: saved }, { status: 201 });
  } catch (error) {
    console.error("[Journal POST Error]:", error);
    return NextResponse.json({ error: "ไม่สามารถบันทึกประวัติดูดวงได้" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "ต้องเข้าสู่ระบบเพื่อล้างประวัติ" }, { status: 401 });
    }

    const count = await deleteAllJournal(userId);
    return NextResponse.json({ success: true, deleted: count });
  } catch (error) {
    console.error("[Journal DELETE Error]:", error);
    return NextResponse.json({ error: "ไม่สามารถล้างประวัติดูดวงได้" }, { status: 500 });
  }
}
