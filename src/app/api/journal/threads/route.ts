import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { ThreadTitleSchema } from "@/lib/journal/journal.schema";
import { countOpenThreads, createThread, listThreads, MAX_OPEN_THREADS } from "@/lib/journal/threads.repo";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { checkRateLimit, createRateLimitResponse } from "@/lib/utils/rate-limit";

export const runtime = "nodejs";

/**
 * 🧵 GET/POST /api/journal/threads — เรื่องที่ติดตามอยู่ (REFLECTION_JOURNAL_PLAN 1.4)
 * สมาชิกเท่านั้น (นัดเช็กต้องส่งอีเมล/แจ้งเตือนได้ และเรื่องต้องตามได้ข้ามเครื่อง)
 */
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ", threads: [] }, { status: 401 });
  const status = new URL(request.url).searchParams.get("status");
  const threads = await listThreads(user.id, status === "open" || status === "closed" ? status : undefined);
  return NextResponse.json({ threads }, { headers: { "Cache-Control": "no-store, private" } });
}

export async function POST(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึงจากภายนอก" }, { status: 403 });
  }
  const user = await getSessionUser();
  if (!user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบเพื่อเริ่มติดตามเรื่อง" }, { status: 401 });

  const gate = checkRateLimit(`thread_create:${user.id}`, { maxRequests: 10, windowSeconds: 60 });
  if (!gate.allowed) return createRateLimitResponse(gate.retryAfterSeconds, "สร้างเรื่องถี่เกินไป กรุณารอสักครู่");

  const body = (await request.json().catch(() => ({}))) as { title?: unknown };
  const title = ThreadTitleSchema.safeParse(body.title);
  if (!title.success) {
    return NextResponse.json({ error: title.error.issues[0]?.message || "ชื่อเรื่องไม่ถูกต้อง" }, { status: 400 });
  }
  if ((await countOpenThreads(user.id)) >= MAX_OPEN_THREADS) {
    return NextResponse.json(
      { error: `ติดตามได้พร้อมกันสูงสุด ${MAX_OPEN_THREADS} เรื่อง — ปิดเรื่องที่จบแล้วก่อนนะ` },
      { status: 409 },
    );
  }
  const thread = await createThread(user.id, title.data);
  return NextResponse.json({ thread }, { status: 201 });
}
