/**
 * 🧑‍⚖️ ผู้ตัดสิน LLM ชั้น 2 (REFLECTION_JOURNAL_PLAN 1.15 · แทร็ก E)
 * ---------------------------------------------------------------------------
 * ปลดล็อก HANDOFF_AI_JUDGE_BASELINE: รอบ 2026-09-24 ผู้ตัดสิน `gemini-3.6-flash` ชน 429 (โควตาใช้ร่วมกับเว็บจริง)
 * ได้คะแนนแค่ 6/30 เคส — ไฟล์นี้แก้สามเรื่อง:
 *   1. **คีย์แยก**: `JUDGE_GEMINI_API_KEY` / `JUDGE_GROQ_API_KEY` ก่อน แล้วค่อยถอยไปคีย์ของเว็บ (บอกในรายงานว่าใช้คีย์ไหน)
 *   2. **สลับผู้ตัดสินเมื่อโดน 429/5xx**: ผู้ตัดสินที่โดนจำกัดถูกพักทั้งรอบ แล้วใช้ตัวถัดไปในรายการ
 *   3. **คนละตระกูลกับผู้ผลิตเสมอ**: โมเดลให้คะแนนงานตระกูลตัวเองสูงเกินจริง (self-preference bias)
 *      ➔ คำอ่านจาก Gemini ห้ามให้ Gemini ตัดสิน · คำอ่านจาก Qwen ห้ามให้ Qwen ตัดสิน
 * ⚠️ ใช้คีย์ของนักพัฒนา รันด้วยมือ — ห้ามผูกเข้า CI / repo:verify (ชั้น 1 เท่านั้นที่รันใน CI)
 */
import { aiGatewayHeaders, geminiEndpoint, groqChatCompletionsEndpoint } from "../../../../src/lib/ai/gateway";

export type ModelFamily = "gemini" | "qwen" | "openai-oss" | "llama" | "anthropic" | "mock" | "unknown";

export function modelFamily(model: string | null | undefined): ModelFamily {
  const m = (model ?? "").toLowerCase();
  if (!m) return "unknown";
  if (m.startsWith("mock")) return "mock";
  if (m.includes("gemini") || m.includes("gemma")) return "gemini";
  if (m.includes("qwen")) return "qwen";
  if (m.includes("gpt-oss") || m.startsWith("openai/")) return "openai-oss";
  if (m.includes("llama")) return "llama";
  if (m.includes("claude")) return "anthropic";
  return "unknown";
}

export interface JudgeSpec {
  provider: "gemini" | "groq";
  model: string;
}

/** ลำดับผู้ตัดสินที่ลอง — ตัวแรกที่ "คนละตระกูล" และ "ยังไม่โดนพัก" ได้งานไป */
export const JUDGE_POOL: readonly JudgeSpec[] = [
  { provider: "gemini", model: "gemini-3.6-flash" },
  { provider: "gemini", model: "gemini-3.5-flash-lite" },
  { provider: "groq", model: "openai/gpt-oss-120b" },
  { provider: "groq", model: "qwen/qwen3.8-27b" },
];

export function judgeKeyFor(provider: JudgeSpec["provider"]): { key: string | null; dedicated: boolean } {
  const dedicated = provider === "gemini" ? process.env.JUDGE_GEMINI_API_KEY : process.env.JUDGE_GROQ_API_KEY;
  if (dedicated) return { key: dedicated, dedicated: true };
  const shared = provider === "gemini" ? process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY : process.env.GROQ_API_KEY;
  return { key: shared || null, dedicated: false };
}

/** ผู้ตัดสินที่ใช้ได้กับคำอ่านจากโมเดลนี้ (ตัดตระกูลเดียวกัน · ตัดตัวที่ไม่มีคีย์ · ตัดตัวที่โดนพัก) */
export function eligibleJudges(
  producerModel: string | null | ReadonlyArray<string | null>,
  benched: ReadonlySet<string>,
  pool: readonly JudgeSpec[] = JUDGE_POOL,
): JudgeSpec[] {
  // เทียบคู่: ผู้ตัดสินต้องคนละตระกูลกับ "ทั้งสองฝั่ง"
  const fams = new Set((Array.isArray(producerModel) ? producerModel : [producerModel]).map((m) => modelFamily(m as string | null)));
  return pool.filter((j) => !fams.has(modelFamily(j.model)) && !benched.has(j.model) && Boolean(judgeKeyFor(j.provider).key));
}

export type JudgeCallResult =
  | { ok: true; text: string; judge: JudgeSpec }
  | { ok: false; status: number; retryable: boolean; judge: JudgeSpec };

/** เรียกผู้ตัดสิน 1 ตัว ให้ตอบ JSON — temperature 0 (ผลซ้ำได้มากที่สุด) */
export async function callJudge(j: JudgeSpec, prompt: string, fetchImpl: typeof fetch = fetch): Promise<JudgeCallResult> {
  const { key } = judgeKeyFor(j.provider);
  if (!key) return { ok: false, status: 0, retryable: true, judge: j };
  try {
    if (j.provider === "gemini") {
      const res = await fetchImpl(geminiEndpoint(j.model, "generateContent"), {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key, ...aiGatewayHeaders({ cacheTtl: 0 }) },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0 },
        }),
      });
      if (!res.ok) return { ok: false, status: res.status, retryable: res.status === 429 || res.status >= 500, judge: j };
      const payload = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      const text = payload.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
      return { ok: true, text, judge: j };
    }
    const res = await fetchImpl(groqChatCompletionsEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, ...aiGatewayHeaders({ cacheTtl: 0 }) },
      body: JSON.stringify({
        model: j.model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return { ok: false, status: res.status, retryable: res.status === 429 || res.status >= 500, judge: j };
    const payload = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return { ok: true, text: payload.choices?.[0]?.message?.content ?? "", judge: j };
  } catch {
    return { ok: false, status: 0, retryable: true, judge: j };
  }
}

/**
 * ลองผู้ตัดสินตามลำดับ — โดน 429/5xx ➔ พักตัวนั้นทั้งรอบ (`benched`) แล้วไปตัวถัดไป
 * คืน null เมื่อไม่เหลือผู้ตัดสินที่ใช้ได้ (รายงานต้องบอกว่า "ไม่ได้ตัดสิน" ไม่ใช่คะแนน 0)
 */
export async function judgeWithRotation(
  producerModel: string | null | ReadonlyArray<string | null>,
  prompt: string,
  benched: Set<string>,
  opts: { pool?: readonly JudgeSpec[]; fetchImpl?: typeof fetch } = {},
): Promise<{ text: string; judge: JudgeSpec } | null> {
  for (const j of eligibleJudges(producerModel, benched, opts.pool)) {
    const r = await callJudge(j, prompt, opts.fetchImpl);
    if (r.ok) return { text: r.text, judge: j };
    if (r.retryable) benched.add(j.model);
  }
  return null;
}

/** ดึง JSON ก้อนแรกจากข้อความ (บางโมเดลห่อด้วย ```json) */
export function parseJudgeJson(text: string): Record<string, unknown> | null {
  const t = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  try {
    return JSON.parse(t) as Record<string, unknown>;
  } catch {
    const m = t.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}
