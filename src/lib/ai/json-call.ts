/**
 * ✦ เรียก Gemini ให้ตอบเป็น JSON ก้อนเดียว — ไล่โมเดลตามลำดับเดียวกับเส้นทางอื่น · มีเพดานเวลาทุกโมเดล
 * คืน `null` เมื่อไม่มีคีย์ · ทุกโมเดลล่ม · หรือแกะ JSON ไม่ได้ — ผู้เรียกต้องมีทางสำรองออฟไลน์เสมอ
 * ⚠️ นับเข้าเพดานงบ AI ทุกครั้งที่ยิงจริง (`recordAiCall`) · ผู้เรียกต้องผ่าน `isAiCapReached` มาก่อน
 * ⚠️ อ่านคำตอบด้วย `extractGeminiAnswer` เท่านั้น (Gemini 3.x แทรก part ความคิด — INC-0052)
 */
import { aiGatewayHeaders, geminiEndpoint } from "@/lib/ai/gateway";
import { recordAiCall } from "@/lib/security/ai-budget";
import { recordEvent } from "@/lib/stats/record";

/** แกะ JSON วัตถุก้อนเดียวจากข้อความโมเดล (ตัด code fence · ข้อความนอกปีกกา) — แกะไม่ได้คืน null */
export function parseJsonObject<T>(raw: string): T | null {
  const text = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  try {
    return JSON.parse(text) as T;
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]) as T;
    } catch {
      return null;
    }
  }
}

/**
 * ✦ JSON ก้อนเดียว: Claude ก่อน (เจ้าของสั่ง 2026-10-28 "ใช้ Claude เป็นหลัก") ➔ ไม่มีคีย์/พัก/ล้ม/แกะไม่ได้ ➔ Gemini ตามเดิม
 * ใช้กับงานสมุดดวงที่ผู้ใช้กดขอเอง (สะท้อนสมุด · สรุปรายเดือน) — รุ่นและ effort ผู้เรียกเลือกตามงาน
 * `temperature` ใช้กับ Gemini เท่านั้น (Claude API รุ่น 2026-10-21 ไม่รับ)
 */
export async function generateAiJson<T = unknown>(
  prompt: string,
  opts: Parameters<typeof generateGeminiJson>[1] & {
    claude: { model: string; effort: "low" | "medium" | "high"; maxTokens: number; timeoutMs: number };
  },
): Promise<T | null> {
  const { generateClaudeReply, getClaudeApiKey, isClaudePaused } = await import("@/lib/ai/claude");
  if (getClaudeApiKey() && !isClaudePaused()) {
    void recordAiCall(1);
    const r = await generateClaudeReply({
      model: opts.claude.model,
      system: "ตอบเป็น JSON วัตถุก้อนเดียวตามรูปแบบที่ขอเท่านั้น ห้ามมีข้อความหรือ markdown นอก JSON / Reply with a single JSON object only.",
      messages: [{ role: "user", content: prompt }],
      maxTokens: opts.claude.maxTokens,
      timeoutMs: opts.claude.timeoutMs,
      effort: opts.claude.effort,
      cacheTtl: opts.cacheTtl,
      collectLog: opts.collectLog,
    });
    const parsed = r?.reply ? parseJsonObject<T>(r.reply) : null;
    if (parsed) return parsed;
    recordEvent(`ai_claude_failover:${opts.label}`);
  }
  return generateGeminiJson<T>(prompt, opts);
}

export async function generateGeminiJson<T = unknown>(
  prompt: string,
  opts: { temperature?: number; cacheTtl?: number; label: string; /** false = ห้าม AI Gateway เก็บ log คำขอนี้ */ collectLog?: boolean },
): Promise<T | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;
  const { WORKING_GEMINI_MODELS, GEMINI_FIRST_MODEL_TIMEOUT_MS, GEMINI_FALLBACK_MODEL_TIMEOUT_MS, extractGeminiAnswer } = await import(
    "@/lib/ai/gemini"
  );
  for (const [i, model] of WORKING_GEMINI_MODELS.entries()) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), i === 0 ? GEMINI_FIRST_MODEL_TIMEOUT_MS : GEMINI_FALLBACK_MODEL_TIMEOUT_MS);
    try {
      void recordAiCall(1);
      const res = await fetch(geminiEndpoint(model, "generateContent"), {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey, ...aiGatewayHeaders({ cacheTtl: opts.cacheTtl ?? 0, collectLog: opts.collectLog }) },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: opts.temperature ?? 0.6 },
        }),
      });
      if (!res.ok) {
        console.warn(`[${opts.label}] model ${model} → ${res.status}`);
        continue;
      }
      const parsed = parseJsonObject<T>(extractGeminiAnswer(await res.json()));
      if (parsed) return parsed;
      // แกะไม่ได้ ➔ ไปโมเดลถัดไป
    } catch (err) {
      console.warn(`[${opts.label}] model ${model} → ${err instanceof Error ? err.name : String(err)}`);
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}
