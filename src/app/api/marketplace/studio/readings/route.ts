import { apiFail, apiOk } from "@/lib/api/envelope";
import { createCommitment } from "@/lib/tarot/shuffle";
import { readJson, studioGate } from "@/lib/studio/gate";
import { CreateReadingSchema, ID, findInjectedNote, resolveStudioSpread } from "@/lib/studio/schemas";
import { createReading, getClient, getReading, listReadings, listTemplates, patchReading, setReadingCommitment } from "@/lib/studio/studio.repo";
import { readingSummary, readingView } from "@/lib/studio/view";

export const runtime = "nodejs";

/** GET ?clientId= รายการคำอ่าน · POST เริ่มคำอ่านใหม่ (ตรึงคำมั่น Provably Fair ทันที ก่อนหมอจะเห็นไพ่) */
export async function GET(request: Request) {
  const gate = await studioGate(request);
  if (!gate.ok) return gate.response;
  const clientId = new URL(request.url).searchParams.get("clientId") ?? undefined;
  if (clientId && !ID.client.test(clientId)) return apiFail("ไม่พบลูกค้า", 404);
  return apiOk({ readings: (await listReadings(gate.readerId, clientId)).map(readingSummary) });
}

export async function POST(request: Request) {
  const gate = await studioGate(request);
  if (!gate.ok) return gate.response;
  const parsed = CreateReadingSchema.safeParse(await readJson(request));
  if (!parsed.success) return apiFail("กรุณาใส่ชื่อคำอ่านและเลือกผัง", 400);
  const { clientId, title, question, spreadId, customSpread, templateId } = parsed.data;
  if (findInjectedNote([title, question])) return apiFail("มีข้อความบางส่วนที่ระบบไม่รับ ลองเขียนใหม่ด้วยคำธรรมดา", 400, "injection");
  if (clientId && !(await getClient(gate.readerId, clientId))) return apiFail("ไม่พบลูกค้า", 404);
  const spread = resolveStudioSpread(spreadId, customSpread);
  if (!spread.ok) return apiFail(spread.error, 400);

  const id = await createReading(gate.readerId, {
    clientId: clientId ?? null,
    title,
    question,
    spreadId: spread.spreadId,
    customSpread: spread.customSpread,
    showAiDisclosure: gate.settings.showAiDisclosure,
  });
  const { serverSeed, commitment } = createCommitment();
  await setReadingCommitment(gate.readerId, id, serverSeed, commitment);
  if (templateId) {
    const t = (await listTemplates(gate.readerId)).find((x) => x.id === templateId);
    if (t) await patchReading(gate.readerId, id, { notes: { ...(t.intro ? { intro: t.intro } : {}), ...(t.closing ? { closing: t.closing } : {}) } });
  }
  const reading = await getReading(gate.readerId, id);
  return apiOk({ reading: reading ? readingView(reading) : null }, { status: 201 });
}
