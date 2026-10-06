import { apiFail, apiOk } from "@/lib/api/envelope";
import { hashPassword } from "@/lib/auth/password";
import { SITE_ORIGIN } from "@/lib/config/site";
import { readJson, studioGate } from "@/lib/studio/gate";
import { ID, ShareSchema } from "@/lib/studio/schemas";
import { hashShareToken, newShareToken } from "@/lib/studio/share";
import { getReading, publishReading, revokeShare } from "@/lib/studio/studio.repo";
import { readingView } from "@/lib/studio/view";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST — สร้างลิงก์ส่วนตัวให้ลูกค้า (โทเคนสุ่ม 128 บิต · เก็บแค่แฮช · โชว์โทเคนครั้งเดียว)
 *        สร้างใหม่ซ้ำ = ลิงก์เดิมใช้ไม่ได้ทันที (หมุนลิงก์)
 * DELETE — เพิกถอนลิงก์ทันที
 */
export async function POST(request: Request, { params }: Ctx) {
  const gate = await studioGate(request);
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const parsed = ShareSchema.safeParse(await readJson(request));
  if (!ID.reading.test(id) || !parsed.success) return apiFail("ข้อมูลไม่ถูกต้อง", 400);
  const reading = await getReading(gate.readerId, id);
  if (!reading) return apiFail("ไม่พบคำอ่าน", 404);
  if (!reading.cards.length) return apiFail("ยังไม่มีไพ่", 409, "no_cards");
  if (!reading.body?.some((p) => p.text.trim())) return apiFail("ยังไม่มีคำอ่านฉบับส่งจริง", 409, "no_body");

  const token = newShareToken();
  const expiresAt = Date.now() + parsed.data.expiresDays * 86_400_000;
  const password = parsed.data.password || null;
  const ok = await publishReading(gate.readerId, id, hashShareToken(token), expiresAt, password ? await hashPassword(password) : null);
  if (!ok) return apiFail("สร้างลิงก์ไม่สำเร็จ กรุณาลองใหม่", 500);
  const after = await getReading(gate.readerId, id);
  return apiOk({ url: `${SITE_ORIGIN}/r/${token}`, expiresAt, hasPassword: Boolean(password), reading: after ? readingView(after) : null });
}

export async function DELETE(request: Request, { params }: Ctx) {
  const gate = await studioGate(request);
  if (!gate.ok) return gate.response;
  const { id } = await params;
  if (!ID.reading.test(id) || !(await revokeShare(gate.readerId, id))) return apiFail("ไม่พบลิงก์ของคำอ่านนี้", 404);
  const after = await getReading(gate.readerId, id);
  return apiOk({ reading: after ? readingView(after) : null });
}
