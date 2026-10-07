import { DECK } from "@/data/cards";
import { PUBLIC_SPREADS } from "@/data/spreads";
import { z } from "zod";
import { apiFail, apiOk } from "@/lib/api/envelope";
import { PURGE_CONFIRM_TEXT, STUDIO_DPA_POINTS_TH, STUDIO_DPA_VERSION, hasAcceptedDpa } from "@/lib/studio/dpa";
import { readJson, studioGate } from "@/lib/studio/gate";
import { readingSummary } from "@/lib/studio/view";
import { listClients, listReadings, listTemplates, purgeStudioData } from "@/lib/studio/studio.repo";
import { STUDIO_DEFAULT_COLOR } from "@/lib/studio/brand";
import { resolvePassPriceThb, studioPlanView } from "@/lib/studio/plan";
import { studioDraftQuota, studioDraftsPerDay } from "@/lib/studio/quota";

export const runtime = "nodejs";

/**
 * GET /api/marketplace/studio — ข้อมูลตั้งต้นของสตูดิโอแม่หมอ (REFLECTION_JOURNAL_PLAN 1.13)
 * ยังไม่ยอมรับข้อตกลง ➔ ส่งแค่ตัวข้อตกลง (ไม่ส่งข้อมูลลูกค้าใด ๆ)
 */
export async function GET(request: Request) {
  const gate = await studioGate(request, { needDpa: false });
  if (!gate.ok) return gate.response;
  const accepted = hasAcceptedDpa(gate.settings.dpaVersion);
  const dpa = { version: STUDIO_DPA_VERSION, accepted, acceptedVersion: gate.settings.dpaVersion, points: STUDIO_DPA_POINTS_TH };
  const reader = { id: gate.readerId, displayName: gate.reader.displayName };
  if (!accepted) return apiOk({ reader, dpa });

  const [clients, readings, templates, quota, passPriceThb] = await Promise.all([
    listClients(gate.readerId),
    listReadings(gate.readerId),
    listTemplates(gate.readerId),
    studioDraftQuota(gate.readerId, gate.settings.proUntil),
    resolvePassPriceThb(gate.readerId),
  ]);
  return apiOk({
    reader,
    dpa,
    settings: { ...gate.settings, brandColor: gate.settings.brandColor ?? STUDIO_DEFAULT_COLOR },
    clients,
    readings: readings.map(readingSummary),
    templates,
    quota,
    plan: studioPlanView(gate.settings.proUntil, studioDraftsPerDay(), passPriceThb),
    spreads: PUBLIC_SPREADS.map((s) => ({ id: s.id, nameTh: s.nameTh, count: s.positions.length })),
    deck: DECK.map((c, i) => ({ index: i, id: c.id, nameTh: c.nameTh, nameEn: c.nameEn })),
  });
}

/**
 * DELETE /api/marketplace/studio — แม่หมอลบข้อมูลสตูดิโอทั้งหมดของตัวเอง (DPA ข้อ 15)
 * ต้องพิมพ์ข้อความยืนยันตรงตัว · ทำได้แม้ยังไม่ยอมรับข้อตกลงรุ่นใหม่ (สิทธิ์ลบต้องไม่ถูกกั้น)
 */
export async function DELETE(request: Request) {
  const gate = await studioGate(request, { needDpa: false });
  if (!gate.ok) return gate.response;
  const parsed = z.object({ confirm: z.literal(PURGE_CONFIRM_TEXT) }).safeParse(await readJson(request));
  if (!parsed.success) return apiFail(`พิมพ์ "${PURGE_CONFIRM_TEXT}" เพื่อยืนยัน`, 400, "confirm_required");
  return apiOk({ deleted: await purgeStudioData(gate.readerId) });
}

