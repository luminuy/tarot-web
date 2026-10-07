import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { checkRateLimit, createRateLimitResponse } from "@/lib/utils/rate-limit";
import { parseCustomSpread } from "@/lib/tarot/custom-spread.server";
import { deleteCustomSpread, getCustomSpread, setCustomSpreadSharing, updateCustomSpread } from "@/lib/tarot/custom-spread.repo";

export const runtime = "nodejs";

/**
 * ✦ PUT/PATCH/DELETE /api/spreads/custom/:id — แก้ผัง · เปิด/ปิดลิงก์แบ่งปัน · ลบ
 * ทุกคำสั่งกรองด้วย user_id ของเซสชัน — รหัสผังของคนอื่นได้ 404 เหมือนไม่มีอยู่
 */
const ID_RE = /^cs_[0-9a-f-]{36}$/;

async function guard(request: Request, id: string) {
  if (!isRequestAuthorizedOrigin(request)) {
    return { error: NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึงจากภายนอก" }, { status: 403 }) };
  }
  if (!ID_RE.test(id)) return { error: NextResponse.json({ error: "ไม่พบผังนี้" }, { status: 404 }) };
  const user = await getSessionUser();
  if (!user?.id) return { error: NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 }) };
  const gate = checkRateLimit(`custom_spread_write:${user.id}`, { maxRequests: 20, windowSeconds: 60 });
  if (!gate.allowed) return { error: createRateLimitResponse(gate.retryAfterSeconds, "ทำรายการถี่เกินไป กรุณารอสักครู่") };
  return { userId: user.id };
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await guard(request, id);
  if ("error" in g) return g.error;
  const body = (await request.json().catch(() => ({}))) as { spread?: unknown; lang?: unknown };
  const parsed = parseCustomSpread(body.spread, body.lang === "en" ? "en" : "th");
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  if (!(await updateCustomSpread(g.userId, id, parsed.input))) {
    return NextResponse.json({ error: "ไม่พบผังนี้" }, { status: 404 });
  }
  return NextResponse.json({ spread: await getCustomSpread(g.userId, id), warnings: parsed.warnings });
}

/** `{ share: true }` = เปิดลิงก์ (ได้ slug ใหม่) · `{ share: false }` = ปิด ลิงก์เดิมใช้ไม่ได้ทันที */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await guard(request, id);
  if ("error" in g) return g.error;
  const body = (await request.json().catch(() => ({}))) as { share?: unknown };
  if (typeof body.share !== "boolean") return NextResponse.json({ error: "ข้อมูลที่ส่งมาไม่ถูกต้อง" }, { status: 400 });
  const slug = await setCustomSpreadSharing(g.userId, id, body.share);
  if (slug === undefined) return NextResponse.json({ error: "ไม่พบผังนี้" }, { status: 404 });
  return NextResponse.json({ shareSlug: slug });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await guard(request, id);
  if ("error" in g) return g.error;
  if (!(await deleteCustomSpread(g.userId, id))) return NextResponse.json({ error: "ไม่พบผังนี้" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
