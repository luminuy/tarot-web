/**
 * ⚡ Groq Cloud LPU AI Integration (High-Speed Multi-Provider Failover)
 * -------------------------------------------------------------------
 * ให้บริการประมวลผล AI ความเร็วสูงพิเศษ (300-760ms) ด้วยชิป LPU
 * ใช้เป็นเกราะป้องกันชั้นยอดเมื่อ Google Gemini ติดโควตา 429 หรือขัดข้อง
 * รองรับ:
 * - qwen/qwen3.8-27b: ภาษาไทยเป็นธรรมชาติ สละสลวย อบอุ่น เหมาะกับแม่หมอไทย (อันดับ 1)
 * - openai/gpt-oss-120b: โมเดล 120 พันล้านพารามิเตอร์ วิเคราะห์ดวงและเหตุผลเชิงลึก (อันดับ 2)
 */

export const WORKING_GROQ_MODELS = [
  "qwen/qwen3.8-27b",
  "openai/gpt-oss-120b",
] as const;

export type GroqModelName = (typeof WORKING_GROQ_MODELS)[number];

export const GROQ_DEFAULT_TIMEOUT_MS = 6000;

export interface GroqChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GroqChatOptions {
  systemInstruction: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
  timeoutMs?: number;
}

export interface GroqProbeResult {
  model: string;
  ok: boolean;
  status: number | null;
  elapsedMs: number;
  answerPreview?: string;
  error?: string | null;
}

/**
 * ดึง Groq API Key จาก environment variable
 */
export function getGroqApiKey(): string | undefined {
  return process.env.GROQ_API_KEY;
}

/**
 * ยิงข้อความถาม-ตอบกับ Groq LPU รองรับการหมุนเวียนโมเดลอัตโนมัติ
 */
export async function generateGroqChatReply(options: GroqChatOptions): Promise<{
  reply: string;
  model: string;
  elapsedMs: number;
} | null> {
  const apiKey = options.apiKey || getGroqApiKey();
  if (!apiKey) return null;

  const timeoutMs = options.timeoutMs || GROQ_DEFAULT_TIMEOUT_MS;
  const temperature = options.temperature ?? 0.7;
  // ตั้ง 1200 tokens เพื่อให้มีที่ว่างพอสำหรับ reasoning tokens ของโมเดลตระกูล 120b
  const maxTokens = options.maxTokens ?? 1200;

  const payloadMessages: GroqChatMessage[] = [
    { role: "system", content: options.systemInstruction },
    ...options.messages.map((m) => ({
      role: m.role,
      content: m.content.slice(0, 4000),
    })),
  ];

  for (const model of WORKING_GROQ_MODELS) {
    const startedAt = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: payloadMessages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      clearTimeout(timeoutId);
      const elapsedMs = Date.now() - startedAt;

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.warn(`[Groq ${model}] status ${res.status}: ${errText.slice(0, 200)}`);
        continue;
      }

      const data = (await res.json()) as any;
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content === "string" && content.trim()) {
        return {
          reply: content.trim(),
          model,
          elapsedMs,
        };
      }

      console.warn(`[Groq ${model}] 200 แต่ไม่มีข้อความตอบกลับ`);
    } catch (err) {
      console.warn(`[Groq ${model}] fetch error:`, err);
    }
  }

  return null;
}

/**
 * ทดสอบสุขภาพการเชื่อมต่อ Groq API สำหรับแผงแอดมิน
 */
export async function probeGroqHealth(apiKey?: string): Promise<GroqProbeResult[]> {
  const key = apiKey || getGroqApiKey();
  if (!key) {
    return [
      {
        model: "groq",
        ok: false,
        status: null,
        elapsedMs: 0,
        error: "ไม่ได้ตั้งค่า GROQ_API_KEY",
      },
    ];
  }

  const results: GroqProbeResult[] = [];
  for (const model of WORKING_GROQ_MODELS) {
    const startedAt = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "ตอบกลับคำเดียวว่า: พร้อม" }],
          max_tokens: 150,
          temperature: 0,
        }),
      });

      clearTimeout(timeoutId);
      const elapsedMs = Date.now() - startedAt;

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        results.push({
          model,
          ok: false,
          status: res.status,
          elapsedMs,
          error: errText.slice(0, 200),
        });
        continue;
      }

      const data = (await res.json()) as any;
      const content = data?.choices?.[0]?.message?.content;
      results.push({
        model,
        ok: typeof content === "string" && content.trim().length > 0,
        status: 200,
        elapsedMs,
        answerPreview: typeof content === "string" ? content.trim().slice(0, 100) : "",
        error: content ? null : "ตอบ 200 แต่แยกข้อความไม่ได้",
      });
    } catch (err: any) {
      results.push({
        model,
        ok: false,
        status: null,
        elapsedMs: Date.now() - startedAt,
        error: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
      });
    }
  }

  return results;
}
