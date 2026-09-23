import { NextResponse } from "next/server";
import { z } from "zod";
import { JournalItemSchema } from "@/lib/journal/journal.schema";
import { getSessionUser } from "@/lib/auth/session";
import { bulkImportJournal } from "@/lib/journal/journal.repo";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from "@/lib/utils/rate-limit";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";

export const runtime = "nodejs";

// สคีมากลาง (มีเพดานความยาว + กันฉีดคำสั่ง) — ข้อความนี้ไหลเข้า prompt ครั้งถัดไป (A2-07)
const ImportItemSchema = JournalItemSchema.extend({
  id: z.string().max(100),
  date: z.string().max(40),
  outcomeUpdatedAt: z.string().max(40).optional(),
});

const ImportPayloadSchema = z.object({
  items: z.array(ImportItemSchema).max(200, "นำเข้าได้สูงสุดครั้งละ 200 รายการ"),
});

async function getAuthenticatedUserId(): Promise<string | null> {
  const user = await getSessionUser();
  return user?.id || null;
}

export async function POST(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึงจากภายนอก" }, { status: 403 });
  }

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
