/**
 * ⚡ Groq Cloud LPU AI Integration (High-Speed Multi-Provider Failover)
 * -------------------------------------------------------------------
 * ให้บริการประมวลผล AI ความเร็วสูงพิเศษ (300-760ms) ด้วยชิป LPU
 * ใช้เป็นเกราะป้องกันชั้นยอดเมื่อ Google Gemini ติดโควตา 429 หรือขัดข้อง
 * รองรับ:
 * - qwen/qwen3.8-27b: ภาษาไทยเป็นธรรมชาติ สละสลวย อบอุ่น เหมาะกับแม่หมอไทย (อันดับ 1)
 * - openai/gpt-oss-120b: โมเดล 120 พันล้านพารามิเตอร์ วิเคราะห์ดวงและเหตุผลเชิงลึก (อันดับ 2)
 */

import {
  countForeignCharacters,
  hasForeignScript,
  objectHasForeignScript,
  sanitizeTarotText,
  stripForeignScript,
  stripForeignScriptDeep,
  stripThinkingTags,
} from "@/lib/ai/language";
import { aiGatewayHeaders, groqChatCompletionsEndpoint } from "@/lib/ai/gateway";
import { parsePartialReading } from "@/lib/utils/partial-json";
import { recordEvent } from "@/lib/stats/record";
import { buildReadingMessage, buildSystemPrompt, type ReadingContext } from "@/lib/ai/prompt";
import { getContentOverrides, resolvePersona, resolveSystemCore } from "@/lib/content/overrides";
import { type Reading, ReadingSchema } from "@/lib/schema/reading";
import type { ReadingEvent, UsageInfo } from "@/lib/ai/claude";

/**
 * ลำดับนี้ตั้งใจให้ Qwen มาก่อน — คุณภาพภาษาไทยดีที่สุดในสี่ตัว (มี QA test ล็อกไว้)
 *
 * ⚠️ แลกมาด้วยความเสี่ยง: Qwen เทรนด้วยคลังจีนเป็นหลัก บางครั้งหลุดพ่นอักษรจีนปนกลางประโยคไทย
 * จึงต้องมีด่าน `hasForeignScript()` คัดทิ้งแล้วเลื่อนไปโมเดลถัดไป (ดู `src/lib/ai/language.ts`)
 * **ห้ามลบด่านนั้นออกโดยไม่สลับลำดับโมเดลก่อน**
 */
export const WORKING_GROQ_MODELS = [
  "qwen/qwen3.8-27b",
  "qwen/qwen3.6-27b",
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
] as const;

export type GroqModelName = (typeof WORKING_GROQ_MODELS)[number];

export const GROQ_DEFAULT_TIMEOUT_MS = 12000;

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
  hasReasoning?: boolean;
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
 * ยิงข้อความถาม-ตอบกับ Groq LPU รองรับการหมุนเวียน 4 โมเดลอัตโนมัติ
 * ไม่กำหนดเพดาน max_tokens เพื่อให้ทดสอบและคุยบทสนทนายาวได้เต็มที่
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

      const requestBody: Record<string, unknown> = {
        model,
        messages: payloadMessages,
        temperature,
        // reasoning model (Qwen3) แยกโทเค็นความคิดออกจาก content — content สะอาดตั้งแต่ต้นทาง
        reasoning_format: "parsed",
        // เพดานเริ่มต้น 2,400 โทเค็น (~ตอบแชทยาว 4 ท่อน) กันโมเดล reasoning เผางบไม่จบ
        // ผู้เรียกทับได้ด้วย options.maxTokens
        max_tokens: typeof options.maxTokens === "number" ? options.maxTokens : 2400,
      };

      const res = await fetch(groqChatCompletionsEndpoint(), {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          ...aiGatewayHeaders({ cacheTtl: 0 }),
        },
        body: JSON.stringify(requestBody),
      });

      clearTimeout(timeoutId);
      const elapsedMs = Date.now() - startedAt;

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.warn(`[Groq ${model}] status ${res.status}: ${errText.slice(0, 200)}`);
        continue;
      }

      const data = (await res.json()) as any;
      const rawContent = data?.choices?.[0]?.message?.content;
      if (typeof rawContent === "string" && rawContent.trim()) {
        const reply = stripThinkingTags(rawContent);
        if (!reply) {
          console.warn(`[Groq ${model}] ข้อความว่างเปล่าหลังตัด thinking tags ออก`);
          continue;
        }

        // ด่านภาษา — ทำความสะอาดและแปลงคำจีนที่โมเดลเผลอใช้กลับเป็นไทยก่อน
        const sanitized = sanitizeTarotText(reply);
        if (hasForeignScript(sanitized)) {
          const isLastModel = model === WORKING_GROQ_MODELS[WORKING_GROQ_MODELS.length - 1];
          console.warn(`[Groq ${model}] คำตอบยังมีอักษรต่างภาษาปนหลัง sanitize — ${isLastModel ? "ล้างทิ้ง" : "ข้ามไปโมเดลถัดไป"}`);
          if (!isLastModel) continue;
          const cleaned = stripForeignScript(sanitized);
          if (!cleaned) continue;
          return { reply: cleaned, model, elapsedMs };
        }

        return {
          reply: sanitized,
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

      // ด่านตรวจสุขภาพยิงตรงไป Groq เสมอ — ตั้งใจ ไม่ผ่าน AI Gateway
      // เพราะต้องการวัด "provider ต้นทางยังเรียกได้ไหม" ไม่ใช่สุขภาพของ gateway
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
          // 400 พอสำหรับคำเดียว แม้โมเดล reasoning จะคิดสั้น ๆ ก่อน (เดิม 1000 = เผาเปล่า)
          max_tokens: 400,
          temperature: 0,
          reasoning_format: "parsed",
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
      const rawContent = data?.choices?.[0]?.message?.content;
      const reasoning = data?.choices?.[0]?.message?.reasoning;
      const cleanAnswer = typeof rawContent === "string" ? stripThinkingTags(rawContent) : "";
      const hasReasoning = typeof reasoning === "string" && reasoning.trim().length > 0;

      results.push({
        model,
        ok: cleanAnswer.length > 0,
        status: 200,
        elapsedMs,
        hasReasoning,
        answerPreview: cleanAnswer.slice(0, 100),
        error: cleanAnswer ? null : "ตอบ 200 แต่ไม่มีข้อความคำตอบ (หลังตัด thinking ออก)",
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

/**
 * 🔮 สตรีมคำทำนายไพ่ทาโรต์เชิงลึกด้วย Groq LPU (Ultra-Fast 300+ tok/s)
 * ------------------------------------------------------------------
 * - โมเดล: qwen3.8-27b → qwen3.6-27b → gpt-oss-120b (Qwen ภาษาไทยสวย · 120b reasoning ลึก ไม่หลุดจีน)
 * - `reasoning_format: "hidden"` — แยกโทเค็นความคิดออกจาก content (สำคัญมากกับ reasoning model)
 * - `max_tokens` ปรับตามจำนวนไพ่ (1,600 + 340/ใบ) กันคำอ่านโดนตัดกลาง
 * - Foreign Script Circuit Breaker: อักษรต่างด้าวใน content สะสม ≥ 14 ตัว → สลับโมเดล + นับสถิติ
 * - sanitizeTarotText() ทำความสะอาด real-time · stripForeignScriptDeep() กวาดรอบสุดท้าย
 * - สำเร็จตาม ReadingSchema หรือปล่อยให้ route caller สลับไป Gemini
 */
export async function* streamGroqReading(ctx: ReadingContext): AsyncGenerator<ReadingEvent> {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    console.warn("[Groq Reading] ไม่พบ GROQ_API_KEY ข้ามไปใช้ Gemini");
    return;
  }

  const overrides = await getContentOverrides();
  const persona = resolvePersona(overrides, ctx.personaId);
  const systemCore = resolveSystemCore(overrides);
  const systemInstruction = buildSystemPrompt(ctx.personaId, { systemCore, persona });
  const userMessage = buildReadingMessage(ctx);

  // Qwen 2 ตัวก่อน (ภาษาไทยสวยสุด) → gpt-oss-120b (reasoning ลึก ไม่มีปัญหาจีนหลุด)
  // เป็นตาข่ายสุดท้ายก่อนตกไป Gemini
  const readingModels = [
    "qwen/qwen3.8-27b",
    "qwen/qwen3.6-27b",
    "openai/gpt-oss-120b",
  ] as const;

  // เพดานผลลัพธ์: ฐาน 1,600 + 340/ใบ (ผัง 10 ใบ ≈ 5,000) — กันคำอ่านโดนตัดกลางจนต้อง failover
  const maxReadingTokens = Math.min(6000, 1600 + ctx.drawn.length * 340);

  for (const model of readingModels) {
    const startedAt = Date.now();
    let jsonAccumulator = "";
    let sentOpening = false;
    let sentConnections = false;
    let sentSummary = false;
    let cardsSent = 0;
    let totalForeignChars = 0;
    let foreignCircuitBreaker = false;

    let usage: UsageInfo = {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    };

    try {
      const controller = new AbortController();
      // Groq LPU ประมวลผลไวมาก (~300 tok/s) เพดานเวลา 20 วินาทีเพียงพอสำหรับคำอ่านยาว
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(groqChatCompletionsEndpoint(), {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          ...aiGatewayHeaders({ cacheTtl: 0 }),
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: userMessage },
          ],
          response_format: { type: "json_object" },
          stream: true,
          // ⚠️ สำคัญ: Qwen3 เป็น reasoning model — ถ้าไม่ตั้งค่านี้ โทเค็น <think> จะปนใน delta.content
          // ทำให้ (1) partial parse เพี้ยน คำอ่านใบแรกโผล่ช้า (2) circuit breaker นับคำจีนใน "ความคิด" ของโมเดล
          reasoning_format: "hidden",
          max_tokens: maxReadingTokens,
          temperature: 0.6,
        }),
      });

      clearTimeout(timeoutId);

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "");
        console.warn(`[Groq Reading ${model}] status ${res.status}: ${errText.slice(0, 200)}`);
        continue;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === "[DONE]") continue;

          try {
            const chunk = JSON.parse(jsonStr);
            if (chunk.x_groq?.usage) {
              usage.inputTokens = chunk.x_groq.usage.prompt_tokens ?? usage.inputTokens;
              usage.outputTokens = chunk.x_groq.usage.completion_tokens ?? usage.outputTokens;
            }

            const delta = chunk.choices?.[0]?.delta?.content || "";
            if (delta) {
              // ด่านตรวจจับอักษรต่างด้าว (Circuit Breaker)
              const foreignCount = countForeignCharacters(delta);
              if (foreignCount > 0) {
                totalForeignChars += foreignCount;
                // reasoning ถูกแยกออกแล้ว (reasoning_format: hidden) → นับเฉพาะเนื้อคำตอบจริง
                // เกิน 14 ตัว = โมเดลนี้หลุดจีนใน content จริง สลับทันที
                if (totalForeignChars >= 14) {
                  console.warn(
                    `[Groq Reading ${model}] ⚠️ Circuit Breaker: อักษรต่างด้าวสะสม ${totalForeignChars} ตัว — สลับโมเดล`,
                  );
                  recordEvent("ai_foreign_trip:groq");
                  recordEvent(`ai_foreign_trip:${model}`);
                  foreignCircuitBreaker = true;
                  break;
                }
              }

              jsonAccumulator += delta;
              const partial = parsePartialReading(jsonAccumulator);

              if (!sentOpening && partial.opening) {
                sentOpening = true;
                yield { type: "opening", text: sanitizeTarotText(partial.opening) };
              }

              while (cardsSent < partial.cards.length) {
                const card = partial.cards[cardsSent];
                cardsSent++;
                yield {
                  type: "card",
                  position: card.position,
                  headline: sanitizeTarotText(card.headline),
                  reading: sanitizeTarotText(card.reading),
                };
              }

              if (!sentConnections && partial.connections) {
                sentConnections = true;
                yield { type: "connections", text: sanitizeTarotText(partial.connections) };
              }

              if (!sentSummary && partial.summary) {
                sentSummary = true;
                yield { type: "summary", text: sanitizeTarotText(partial.summary) };
              }
            }
          } catch {
            // chunk JSON parse ignore
          }
        }

        if (foreignCircuitBreaker) {
          try {
            await reader.cancel();
          } catch {}
          break;
        }
      }

      if (foreignCircuitBreaker) {
        continue; // ลองโมเดลถัดไปหรือตกไปหา Gemini
      }

      const cleanJson = stripThinkingTags(jsonAccumulator);
      let parsedJson: any = null;
      try {
        parsedJson = JSON.parse(cleanJson);
      } catch {
        // loose parse fallback
      }

      const parsed = parsedJson ? ReadingSchema.safeParse(parsedJson) : null;
      if (parsed && parsed.success) {
        let readingData = parsed.data;
        if (!ctx.spread.yesNoMode) {
          readingData.yesNoAnswer = null;
        }

        // กวาดล้างอักษรต่างด้าวรอบสุดท้ายให้สะอาดหมดจด 100%
        if (objectHasForeignScript(readingData)) {
          readingData = stripForeignScriptDeep(readingData);
        }

        if (usage.inputTokens === 0) {
          usage.inputTokens = Math.round((systemInstruction.length + userMessage.length) / 3.5);
          usage.outputTokens = Math.round(cleanJson.length / 3.5);
        }

        yield { type: "done", reading: readingData, usage };
        return; // ทำงานสำเร็จสมบูรณ์!
      } else {
        recordEvent("ai_schema_fail:groq");
        recordEvent(`ai_schema_fail:${model}`);
        console.warn(
          `[Groq Reading ${model}] JSON ไม่ตรง ReadingSchema · parseLen=${cleanJson.length} · zodErr=${
            parsed ? JSON.stringify(parsed.error.issues?.slice(0, 3)) : "JSON.parse failed"
          }`,
        );
      }
    } catch (err) {
      console.warn(`[Groq Reading ${model}] stream error:`, err);
    }
  }

  // หากโมเดล Groq ทั้งหมดไม่สามารถตอบได้จบสมบูรณ์ จะหลุดออกจาก generator
  // เพื่อเปิดทางให้ route caller สลับไปใช้ Gemini ได้อย่างแนบเนียน
}
