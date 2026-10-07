import { apiFail, apiOk } from "@/lib/api/envelope";
import { generateGeminiJson } from "@/lib/ai/json-call";
import { checkQuestion } from "@/lib/safety/guardrails";
import { isAiCapReached } from "@/lib/security/ai-budget";
import { estimateTokens, isUserTokenCapReached, recordAiUsage } from "@/lib/security/cost-ledger";
import { recordEvent } from "@/lib/stats/record";
import { assembleOfflineDraft, buildDraftPrompt, validateDraft, type DraftContext } from "@/lib/studio/draft";
import { studioGate } from "@/lib/studio/gate";
import { isStudioAiAllowed } from "@/lib/studio/dpa";
import { isProActive } from "@/lib/studio/plan";
import { takeStudioDraft } from "@/lib/studio/quota";
import { ID, findInjectedNote, spreadOfReading } from "@/lib/studio/schemas";
import { getReading, patchReading } from "@/lib/studio/studio.repo";
import { readingView } from "@/lib/studio/view";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/marketplace/studio/readings/[id]/draft — ให้ AI เกลาคำอ่านจาก "โน้ตของหมอ" (ไม่ใช่อ่านไพ่เอง)
 *  • ร่างเก็บแยกใน `draft` เสมอ · ฉบับส่งจริง (`body`) ถูกเติมให้เฉพาะตอนที่ยังว่าง — ไม่ทับงานของหมอ
 *  • AI ล่ม/งบเต็ม/โควตาหมด/ผลไม่ผ่านด่าน ➔ ร่างออฟไลน์จากโน้ตตรง ๆ (`mode: "offline"`)
 *  • โน้ต/คำถามมีสัญญาณวิกฤต ➔ ไม่เรียก AI และแนะนำสายด่วน 1323 ให้หมอส่งต่อ (กฎเหล็กข้อ 6)
 */
export async function POST(request: Request, { params }: Ctx) {
  const gate = await studioGate(request);
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const reading = ID.reading.test(id) ? await getReading(gate.readerId, id) : null;
  if (!reading) return apiFail("ไม่พบคำอ่าน", 404);
  if (!reading.cards.length) return apiFail("ยังไม่มีไพ่ — จั่วหรือกรอกไพ่ก่อน", 409, "no_cards");
  const spread = spreadOfReading(reading);
  if (!spread) return apiFail("ข้อมูลผังของคำอ่านนี้เสียหาย กรุณาโหลดใหม่อีกครั้ง", 409, "spread_missing");

  const noteTexts = Object.values(reading.notes);
  if (findInjectedNote([reading.question, ...noteTexts])) {
    return apiFail("มีข้อความบางส่วนในโน้ตที่ระบบไม่รับ ลองเขียนใหม่ด้วยคำธรรมดา", 400, "injection");
  }
  const safety = checkQuestion([reading.question ?? "", ...noteTexts].join("\n"), "th");
  if (safety.block) {
    return apiOk({ mode: "crisis", message: safety.message, reading: readingView(reading) });
  }

  const ctx: DraftContext = {
    spread,
    cards: reading.cards,
    notes: reading.notes,
    question: reading.question,
    intro: reading.notes.intro,
    closing: reading.notes.closing,
  };

  let mode: "ai" | "offline" = "offline";
  let reason: string | undefined;
  let parts = assembleOfflineDraft(ctx);
  const subject = `r:${gate.readerId}`;

  // บัตรผ่าน 30 วัน = โควตาร่างสูงขึ้น + เพดานโทเคนระดับผู้จ่ายเงิน (`plan.ts`)
  const pro = isProActive(gate.settings.proUntil);
  // ยังไม่ยืนยันว่า AI อยู่บนบริการแบบเสียเงิน (ไม่ฝึกโมเดล) = ไม่ส่งข้อมูลลูกค้าออกไปเลย (DPA ข้อ 7)
  if (!isStudioAiAllowed()) reason = "ai_tier_unconfirmed";
  else if (!(await takeStudioDraft(gate.readerId, gate.settings.proUntil))) reason = "quota";
  else if (await isUserTokenCapReached(subject, pro ? "paid" : "reader")) reason = "token_cap";
  else if (await isAiCapReached("member")) reason = "ai_cap";
  else {
    const prompt = buildDraftPrompt(ctx);
    const raw = await generateGeminiJson(prompt, { label: "StudioDraft", temperature: 0.5, collectLog: false });
    const checked = raw ? validateDraft(raw, ctx) : ({ ok: false, reason: "models_down" } as const);
    if (checked.ok) {
      mode = "ai";
      parts = checked.parts;
    } else {
      reason = checked.reason;
    }
    void recordAiUsage(subject, estimateTokens(prompt.length), estimateTokens(JSON.stringify(raw ?? "").length));
  }
  recordEvent(mode === "ai" ? "studio_draft_ai" : `studio_draft_offline:${(reason ?? "").split(":")[0]}`);

  const draft = { parts: parts.map(({ key, text, origin }) => ({ key, text, origin })), ...(mode === "ai" ? { model: "gemini" } : {}) };
  await patchReading(gate.readerId, id, { draft, ...(reading.body?.length ? {} : { body: draft.parts }) });
  const after = await getReading(gate.readerId, id);
  return apiOk({
    mode,
    ...(reason ? { reason } : {}),
    fromKeywords: parts.filter((p) => p.fromKeywords).map((p) => p.key),
    reading: after ? readingView(after) : null,
  });
}
