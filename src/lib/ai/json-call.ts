/**
 * ✦ เรียก Gemini ให้ตอบเป็น JSON ก้อนเดียว — ไล่โมเดลตามลำดับเดียวกับเส้นทางอื่น · มีเพดานเวลาทุกโมเดล
 * คืน `null` เมื่อไม่มีคีย์ · ทุกโมเดลล่ม · หรือแกะ JSON ไม่ได้ — ผู้เรียกต้องมีทางสำรองออฟไลน์เสมอ
 * ⚠️ นับเข้าเพดานงบ AI ทุกครั้งที่ยิงจริง (`recordAiCall`) · ผู้เรียกต้องผ่าน `isAiCapReached` มาก่อน
 * ⚠️ อ่านคำตอบด้วย `extractGeminiAnswer` เท่านั้น (Gemini 3.x แทรก part ความคิด — INC-0052)
 */
import { aiGatewayHeaders, geminiEndpoint } from "@/lib/ai/gateway";
import { recordAiCall } from "@/lib/security/ai-budget";

export async function generateGeminiJson<T = unknown>(
  prompt: string,
  opts: { temperature?: number; cacheTtl?: number; label: string },
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
        headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey, ...aiGatewayHeaders({ cacheTtl: opts.cacheTtl ?? 0 }) },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: opts.temperature ?? 0.6 },
        }),
      });
      if (!res.ok) {
        console.warn(`[${opts.label}] model ${model} → ${res.status}`);
        continue;
      }
      const text = extractGeminiAnswer(await res.json())
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();
      try {
        return JSON.parse(text) as T;
      } catch {
        const m = text.match(/\{[\s\S]*\}/);
        if (m) {
          try {
            return JSON.parse(m[0]) as T;
          } catch {
            /* ไปโมเดลถัดไป */
          }
        }
      }
    } catch (err) {
      console.warn(`[${opts.label}] model ${model} → ${err instanceof Error ? err.name : String(err)}`);
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}
