import { apiOk } from "@/lib/api/envelope";
import { studioGate } from "@/lib/studio/gate";
import { listImportableTickets } from "@/lib/studio/queue-import";

export const runtime = "nodejs";

/** GET /api/marketplace/studio/tickets — คิว/นัดที่ลูกค้าจองผ่านเว็บ (60 วันล่าสุด) ที่เริ่มคำอ่านในสตูดิโอได้ */
export async function GET(request: Request) {
  const gate = await studioGate(request);
  if (!gate.ok) return gate.response;
  return apiOk({ tickets: await listImportableTickets(gate.readerId) });
}
