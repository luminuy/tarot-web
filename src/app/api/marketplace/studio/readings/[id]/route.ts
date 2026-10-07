import { apiFail, apiOk } from "@/lib/api/envelope";
import { readJson, studioGate } from "@/lib/studio/gate";
import { ID, PatchReadingSchema, findInjectedNote } from "@/lib/studio/schemas";
import { deleteReading, getClient, getReading, patchReading } from "@/lib/studio/studio.repo";
import { readingView } from "@/lib/studio/view";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Ctx) {
  const gate = await studioGate(request);
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const reading = ID.reading.test(id) ? await getReading(gate.readerId, id) : null;
  if (!reading) return apiFail("ไม่พบคำอ่าน", 404);
  return apiOk({ reading: readingView(reading) });
}

/** แก้ชื่อ/คำถาม/โน้ต/ฉบับส่งจริง — ไพ่แก้ที่นี่ไม่ได้ (จั่วแล้วล็อก) */
export async function PATCH(request: Request, { params }: Ctx) {
  const gate = await studioGate(request);
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const parsed = PatchReadingSchema.safeParse(await readJson(request));
  if (!ID.reading.test(id) || !parsed.success) return apiFail("ข้อมูลไม่ถูกต้อง", 400);
  const p = parsed.data;
  // โน้ต/คำถามจะเข้า prompt ร่าง ➔ ตรวจคำสั่งแฝงตั้งแต่ตอนบันทึก (ฉบับส่งจริงไม่เข้า prompt จึงไม่ต้องตรวจ)
  if (findInjectedNote([p.title, p.question, ...Object.values(p.notes ?? {})])) {
    return apiFail("มีข้อความบางส่วนที่ระบบไม่รับ ลองเขียนใหม่ด้วยคำธรรมดา", 400, "injection");
  }
  if (p.clientId && !(await getClient(gate.readerId, p.clientId))) return apiFail("ไม่พบลูกค้า", 404);
  const patch: Parameters<typeof patchReading>[2] = {};
  if (p.title !== undefined) patch.title = p.title;
  if (p.question !== undefined) patch.question = p.question?.trim().slice(0, 500) || null;
  if (p.clientId !== undefined) patch.clientId = p.clientId;
  if (p.notes !== undefined) patch.notes = p.notes;
  if (p.body !== undefined) patch.body = p.body;
  if (p.showAiDisclosure !== undefined) patch.showAiDisclosure = p.showAiDisclosure;
  if (!(await patchReading(gate.readerId, id, patch))) return apiFail("ไม่พบคำอ่าน", 404);
  const reading = await getReading(gate.readerId, id);
  return apiOk({ reading: reading ? readingView(reading) : null });
}

export async function DELETE(request: Request, { params }: Ctx) {
  const gate = await studioGate(request);
  if (!gate.ok) return gate.response;
  const { id } = await params;
  if (!ID.reading.test(id) || !(await deleteReading(gate.readerId, id))) return apiFail("ไม่พบคำอ่าน", 404);
  return apiOk();
}
