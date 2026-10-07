import { apiFail, apiOk } from "@/lib/api/envelope";
import { readJson, studioGate } from "@/lib/studio/gate";
import { TemplateSchema, findInjectedNote } from "@/lib/studio/schemas";
import { createTemplate, listTemplates } from "@/lib/studio/studio.repo";

export const runtime = "nodejs";

const MAX_TEMPLATES = 50;

/** แม่แบบคำอ่าน (บทนำ · คำลงท้าย) ใช้ซ้ำได้ */
export async function GET(request: Request) {
  const gate = await studioGate(request);
  if (!gate.ok) return gate.response;
  return apiOk({ templates: await listTemplates(gate.readerId) });
}

export async function POST(request: Request) {
  const gate = await studioGate(request);
  if (!gate.ok) return gate.response;
  const parsed = TemplateSchema.safeParse(await readJson(request));
  if (!parsed.success) return apiFail("กรุณาตั้งชื่อแม่แบบ", 400);
  if (findInjectedNote([parsed.data.intro, parsed.data.closing])) return apiFail("มีข้อความบางส่วนที่ระบบไม่รับ", 400, "injection");
  if ((await listTemplates(gate.readerId)).length >= MAX_TEMPLATES) return apiFail(`มีแม่แบบครบ ${MAX_TEMPLATES} แบบแล้ว`, 409, "template_limit");
  const id = await createTemplate(gate.readerId, parsed.data);
  return apiOk({ id, templates: await listTemplates(gate.readerId) }, { status: 201 });
}
