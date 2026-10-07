import { apiFail, apiOk } from "@/lib/api/envelope";
import { createCommitment } from "@/lib/tarot/shuffle";
import { readJson, studioGate } from "@/lib/studio/gate";
import { CreateReadingSchema, ID, findInjectedNote, resolveStudioSpread } from "@/lib/studio/schemas";
import { getImportableTicket, readingForTicket } from "@/lib/studio/queue-import";
import { createClient, createReading, findClientBySource, getClient, getReading, listReadings, listTemplates, patchReading, setReadingCommitment } from "@/lib/studio/studio.repo";
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
  const { title, spreadId, customSpread, templateId, ticketId } = parsed.data;
  let { clientId, question } = parsed.data;
  if (findInjectedNote([title, question])) return apiFail("มีข้อความบางส่วนที่ระบบไม่รับ ลองเขียนใหม่ด้วยคำธรรมดา", 400, "injection");
  if (clientId && !(await getClient(gate.readerId, clientId))) return apiFail("ไม่พบลูกค้า", 404);
  const spread = resolveStudioSpread(spreadId, customSpread);
  if (!spread.ok) return apiFail(spread.error, 400);

  // เริ่มจากคิว/นัดของเว็บ: ตั๋วต้องเป็นของแม่หมอคนนี้ · ตั๋วละครั้ง · ลูกค้าจองซ้ำ = ลูกค้าคนเดิม
  if (ticketId) {
    const ticket = await getImportableTicket(gate.readerId, ticketId);
    if (!ticket) return apiFail("ไม่พบคิวนี้ หรือคิวนี้เก่าเกิน 60 วัน", 404, "ticket_not_found");
    const existing = await readingForTicket(gate.readerId, ticketId);
    if (existing) return apiFail("เริ่มคำอ่านจากคิวนี้ไปแล้ว", 409, "ticket_used");
    if (!clientId) {
      const known = await findClientBySource(gate.readerId, ticket.sourceCustomerHash);
      const client =
        known ??
        (await createClient(gate.readerId, {
          displayName: ticket.nickname || `ลูกค้าจากคิว ${new Date(ticket.at).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}`,
          note: "มาจากคิว/นัดที่จองผ่านเว็บ",
          sourceCustomerHash: ticket.sourceCustomerHash,
        }));
      if (!client) return apiFail("รายชื่อลูกค้าเต็มแล้ว ลบรายชื่อที่ไม่ใช้ก่อน", 409, "client_limit");
      clientId = client.id;
    }
    question = question || ticket.question;
  }

  let id: string;
  try {
    id = await createReading(gate.readerId, {
      clientId: clientId ?? null,
      title,
      question: question ?? null,
      spreadId: spread.spreadId,
      customSpread: spread.customSpread,
      showAiDisclosure: gate.settings.showAiDisclosure,
      sourceTicketId: ticketId ?? null,
    });
  } catch (err) {
    // ชนดัชนี UNIQUE (กดสองครั้งพร้อมกัน) = เริ่มจากคิวนี้ไปแล้ว
    if (ticketId && /UNIQUE/i.test(String(err))) return apiFail("เริ่มคำอ่านจากคิวนี้ไปแล้ว", 409, "ticket_used");
    throw err;
  }
  const { serverSeed, commitment } = createCommitment();
  await setReadingCommitment(gate.readerId, id, serverSeed, commitment);
  if (templateId) {
    const t = (await listTemplates(gate.readerId)).find((x) => x.id === templateId);
    if (t) await patchReading(gate.readerId, id, { notes: { ...(t.intro ? { intro: t.intro } : {}), ...(t.closing ? { closing: t.closing } : {}) } });
  }
  const reading = await getReading(gate.readerId, id);
  return apiOk({ reading: reading ? readingView(reading) : null }, { status: 201 });
}
