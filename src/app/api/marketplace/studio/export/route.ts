import { studioGate } from "@/lib/studio/gate";
import { exportAllStudioData } from "@/lib/studio/studio.repo";

export const runtime = "nodejs";

/** GET /api/marketplace/studio/export — ส่งออกข้อมูลสตูดิโอทั้งหมดของแม่หมอเป็นไฟล์ JSON (DPA ข้อ 12 · 15) */
export async function GET(request: Request) {
  const gate = await studioGate(request, { needDpa: false });
  if (!gate.ok) return gate.response;
  const data = await exportAllStudioData(gate.readerId);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="seertarot-studio-${new Date().toISOString().slice(0, 10)}.json"`,
      "cache-control": "no-store",
    },
  });
}
