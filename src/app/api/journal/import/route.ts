import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifyUserSession } from "@/lib/auth/edge-auth";
import { bulkImportJournal } from "@/lib/journal/journal.repo";
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

const ImportItemSchema = z.object({
  id: z.string(),
  date: z.string(),
  nickname: z.string().optional(),
  question: z.string().min(1),
  spreadId: z.string().min(1),
  spreadName: z.string().min(1),
  category: z.string().min(1),
  personaId: z.string().min(1),
  personaName: z.string().min(1),
  cards: z.array(CardDetailSchema),
  summary: z.string().default(""),
  advice: z.array(z.string()).optional(),
  timing: z.string().optional(),
  outcome: z.enum(["PENDING", "ACCURATE", "PARTIAL", "NOT_HAPPENED"]).optional(),
  userNote: z.string().optional(),
  outcomeUpdatedAt: z.string().optional(),
});

const ImportPayloadSchema = z.object({
  items: z.array(ImportItemSchema).max(200, "นำเข้าได้สูงสุดครั้งละ 200 รายการ"),
});

async function getAuthenticatedUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("tarot_auth_session")?.value;
  if (!token) return null;
  const user = await verifyUserSession(token);
  return user?.id || null;
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "ต้องเข้าสู่ระบบเพื่อนำเข้าประวัติ" }, { status: 401 });
    }

    const clientIp = getClientIdentifier(request);
    const limit = checkRateLimit(`journal_import:${userId || clientIp}`, {
      maxRequests: 10,
      windowSeconds: 60,
    });
    if (!limit.allowed) {
      return createRateLimitResponse(limit.retryAfterSeconds, "นำเข้าข้อมูลถี่เกินไป กรุณารอสักครู่");
    }

    const body = await request.json().catch(() => ({}));
    const parsed = ImportPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "รูปแบบข้อมูลนำเข้าไม่ถูกต้อง", details: parsed.error.issues }, { status: 400 });
    }

    const result = await bulkImportJournal(userId, parsed.data.items);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Journal Import Error]:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการนำเข้าประวัติ" }, { status: 500 });
  }
}
