import { z } from "zod";
import { apiFail, apiOk } from "@/lib/api/envelope";
import { STUDIO_DPA_VERSION } from "@/lib/studio/dpa";
import { readJson, studioGate } from "@/lib/studio/gate";
import { acceptStudioDpa } from "@/lib/studio/studio.repo";

export const runtime = "nodejs";

const Body = z.object({ version: z.string().max(40), agree: z.literal(true) });

/** POST /api/marketplace/studio/dpa — ยอมรับข้อตกลงการดูแลข้อมูลลูกค้า (ต้องตรงรุ่นปัจจุบันเท่านั้น) */
export async function POST(request: Request) {
  const gate = await studioGate(request, { needDpa: false });
  if (!gate.ok) return gate.response;
  const parsed = Body.safeParse(await readJson(request));
  if (!parsed.success || parsed.data.version !== STUDIO_DPA_VERSION) {
    return apiFail("ข้อตกลงมีฉบับใหม่ กรุณาโหลดหน้าใหม่แล้วอ่านอีกครั้ง", 409, "dpa_version");
  }
  await acceptStudioDpa(gate.readerId, STUDIO_DPA_VERSION);
  return apiOk({ version: STUDIO_DPA_VERSION });
}
