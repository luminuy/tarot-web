import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { ThreadPatchSchema } from "@/lib/journal/journal.schema";
import { listThreadEntries } from "@/lib/journal/journal.repo";
import { deleteThread, getThread, updateThread } from "@/lib/journal/threads.repo";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { apiOk } from "@/lib/api/envelope";

export const runtime = "nodejs";

/** 🧵 GET = เรื่อง + คำอ่านในเรื่อง (เก่า ➔ ใหม่) · PATCH = แก้ชื่อ/ปิดเรื่อง/บทสรุป · DELETE = ลบเรื่อง (คำอ่านยังอยู่) */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  const { id } = await params;
  const thread = await getThread(user.id, id);
  if (!thread) return NextResponse.json({ error: "ไม่พบเรื่องนี้" }, { status: 404 });
  const entries = await listThreadEntries(user.id, id);
  return NextResponse.json({ thread, entries }, { headers: { "Cache-Control": "no-store, private" } });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึงจากภายนอก" }, { status: 403 });
  }
  const user = await getSessionUser();
  if (!user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  const { id } = await params;
  const parsed = ThreadPatchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const ok = await updateThread(user.id, id, parsed.data);
  if (!ok) return NextResponse.json({ error: "ไม่พบเรื่องนี้" }, { status: 404 });
  return apiOk();
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึงจากภายนอก" }, { status: 403 });
  }
  const user = await getSessionUser();
  if (!user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  const { id } = await params;
  const ok = await deleteThread(user.id, id);
  if (!ok) return NextResponse.json({ error: "ไม่พบเรื่องนี้" }, { status: 404 });
  return apiOk();
}
