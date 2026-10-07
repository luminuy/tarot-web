import { apiFail, apiOk } from "@/lib/api/envelope";
import { readJson, studioGate } from "@/lib/studio/gate";
import { ClientSchema } from "@/lib/studio/schemas";
import { MAX_CLIENTS_PER_READER, createClient, listClients } from "@/lib/studio/studio.repo";

export const runtime = "nodejs";

/** GET ?q= ค้นชื่อลูกค้า · POST เพิ่มลูกค้า (เพดาน 2,000 คนต่อแม่หมอ) */
export async function GET(request: Request) {
  const gate = await studioGate(request);
  if (!gate.ok) return gate.response;
  const q = new URL(request.url).searchParams.get("q")?.trim().slice(0, 60) || undefined;
  return apiOk({ clients: await listClients(gate.readerId, q) });
}

export async function POST(request: Request) {
  const gate = await studioGate(request);
  if (!gate.ok) return gate.response;
  const parsed = ClientSchema.safeParse(await readJson(request));
  if (!parsed.success) return apiFail("กรุณาใส่ชื่อลูกค้า", 400);
  const client = await createClient(gate.readerId, parsed.data);
  if (!client) return apiFail(`มีลูกค้าครบ ${MAX_CLIENTS_PER_READER.toLocaleString("th-TH")} คนแล้ว ลบรายชื่อที่ไม่ใช้ก่อน`, 409, "client_limit");
  return apiOk({ client }, { status: 201 });
}
