import { apiFail, apiOk } from "@/lib/api/envelope";
import { readJson, studioGate } from "@/lib/studio/gate";
import { ClientSchema, ID } from "@/lib/studio/schemas";
import { deleteClient, exportClient, updateClient } from "@/lib/studio/studio.repo";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/** GET = ส่งออกข้อมูลลูกค้าคนนี้ทั้งหมด (PDPA — แม่หมอส่งให้ลูกค้าที่ขอได้) */
export async function GET(request: Request, { params }: Ctx) {
  const gate = await studioGate(request);
  if (!gate.ok) return gate.response;
  const { id } = await params;
  if (!ID.client.test(id)) return apiFail("ไม่พบลูกค้า", 404);
  const data = await exportClient(gate.readerId, id);
  if (!data) return apiFail("ไม่พบลูกค้า", 404);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="seertarot-client-${id.slice(3, 11)}.json"`,
      "cache-control": "no-store",
    },
  });
}

export async function PUT(request: Request, { params }: Ctx) {
  const gate = await studioGate(request);
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const parsed = ClientSchema.safeParse(await readJson(request));
  if (!ID.client.test(id) || !parsed.success) return apiFail("ข้อมูลไม่ถูกต้อง", 400);
  if (!(await updateClient(gate.readerId, id, parsed.data))) return apiFail("ไม่พบลูกค้า", 404);
  return apiOk();
}

/** ลบลูกค้าทั้งคน — คำอ่านและลิงก์ทั้งหมดของลูกค้าคนนี้หายด้วย (ลิงก์ที่ส่งไปแล้วเปิดไม่ได้ทันที) */
export async function DELETE(request: Request, { params }: Ctx) {
  const gate = await studioGate(request);
  if (!gate.ok) return gate.response;
  const { id } = await params;
  if (!ID.client.test(id)) return apiFail("ไม่พบลูกค้า", 404);
  const res = await deleteClient(gate.readerId, id);
  if (!res.deleted) return apiFail("ไม่พบลูกค้า", 404);
  return apiOk({ readingsDeleted: res.readings });
}
