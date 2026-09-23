/**
 * 🛟 OpenRouter — ชั้นสำรองที่ 3 ของคำอ่านไพ่ (โมเดลฟรีเท่านั้น)
 * ---------------------------------------------------------------------------
 * ลำดับเต็ม: Groq ➔ Gemini ➔ **OpenRouter** ➔ คำอ่านสำรองออฟไลน์
 *
 * ทำไมต้องมี: ผังตั้งแต่ 4 ใบเกินเพดาน 8K token ต่อคำขอของ Groq จึงไป Gemini ทั้งหมด
 * วันที่โควตา Gemini หมด (429) ผู้ใช้ได้คำอ่านสำรองออฟไลน์แทน AI (2026-09-23 วันเดียว 21 ครั้ง)
 *
 * ⛔ ใช้ได้เฉพาะโมเดลฟรี (คำสั่งเจ้าของ) — กันสองชั้น:
 *   1. `OPENROUTER_FREE_MODELS` เก็บเฉพาะชื่อที่ลงท้าย `:free`
 *   2. `freeOnly()` กรองซ้ำตอนรันอีกรอบ ต่อให้มีคนเติมชื่อโมเดลเสียเงินเข้ามาก็ไม่ถูกเรียก
 *   และบัญชี OpenRouter ไม่เติมเครดิต ➔ ต่อให้หลุดทั้งสองชั้นก็ถูกเก็บเงินไม่ได้
 *
 * ⚠️ รายชื่อโมเดลต้องมาจากผลวัด `ai-probe-openrouter.yml` เท่านั้น (INC-0053 — ห้ามเดา)
 *    โมเดลฟรีบน OpenRouter ถูกเพิ่ม/ถอดบ่อย ถ้าเห็น 404 ใน log ให้รันวัดใหม่แล้วแก้รายชื่อ
 *
 * โปรโตคอลเป็นแบบ OpenAI เหมือน Groq จึงใช้ตัวช่วยสตรีมชุดเดียวกัน (`reading-stream.ts`)
 */

import {
  consumeReadingDelta,
  createEmptyUsage,
  createReadingStreamState,
  finalizeReading,
  resolveForeignBreaker,
  resolveMaxReadingTokens,
} from "@/lib/ai/reading-stream";
import { recordEvent } from "@/lib/stats/record";
import { buildReadingMessage, buildSystemPrompt, type ReadingContext } from "@/lib/ai/prompt";
import { linkAbortSignal, readWithIdleTimeout } from "@/lib/ai/abort";
import { getContentOverrides, resolvePersona, resolveSystemCore } from "@/lib/content/overrides";
import type { ReadingEvent } from "@/lib/ai/types";

const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";

/** ผลวัดจาก `ai-probe-openrouter.yml` — เรียงจากคุณภาพไทยดีสุด (ดูหัวไฟล์) */
export const OPENROUTER_FREE_MODELS: readonly string[] = [];

/** ลองไม่เกินกี่โมเดลต่อคำอ่าน — ผู้ใช้รอผ่าน Groq + Gemini มาแล้ว ห้ามให้รอนานไปกว่านี้ */
const MAX_MODELS_PER_READING = 2;

/** โมเดลฟรีช้ากว่า Groq มาก — เผื่อเวลาถึงไบต์แรกไว้พอ แต่ไม่ให้ค้างไม่รู้จบ */
const FIRST_BYTE_TIMEOUT_MS = 25_000;

/** เพดานผลลัพธ์ — โมเดลฟรีส่วนใหญ่รับบริบทยาว ไม่ติดเพดาน TPM แบบ Groq */
const OPENROUTER_OUTPUT_CEILING = 9000;

export function freeOnly(models: readonly string[]): string[] {
  return models.filter((m) => m.endsWith(":free"));
}

/** ส่งเนื้อหาถึงผู้ใช้ไปแล้วบางส่วน ➔ ต้อง reset ก่อนลองโมเดลถัดไป */
function emittedAny(state: ReturnType<typeof createReadingStreamState>): boolean {
  return state.sentOpening || state.cardsSent > 0 || state.sentConnections || state.sentSummary;
}

export function stripCodeFence(text: string): string {
  const m = text.match(/^\s*```(?:json)?\s*([\s\S]*?)\s*```\s*$/);
  return m ? m[1] : text;
}

export function getOpenRouterApiKey(): string | undefined {
  return process.env.OPENROUTER_API_KEY;
}

/**
 * สตรีมคำอ่านผ่านโมเดลฟรีบน OpenRouter
 * คืน `true` เมื่อส่ง `done` ได้สำเร็จ · `false` = ผู้เรียกไปทางถัดไป (คำอ่านสำรอง/แจ้งให้โหลดใหม่)
 */
export async function* streamOpenRouterReading(ctx: ReadingContext): AsyncGenerator<ReadingEvent, boolean> {
  const apiKey = getOpenRouterApiKey();
  const models = freeOnly(OPENROUTER_FREE_MODELS).slice(0, MAX_MODELS_PER_READING);
  if (!apiKey || models.length === 0) return false;

  const overrides = await getContentOverrides();
  const systemInstruction = buildSystemPrompt(ctx.personaId, {
    systemCore: ctx.lang === "en" ? undefined : resolveSystemCore(overrides),
    persona: resolvePersona(overrides, ctx.personaId),
    lang: ctx.lang,
  });
  const userMessage = buildReadingMessage(ctx);
  const maxReadingTokens = resolveMaxReadingTokens(ctx.drawn.length, OPENROUTER_OUTPUT_CEILING);

  recordEvent("ai_openrouter_attempt");

  for (const model of models) {
    const state = createReadingStreamState();
    const usage = createEmptyUsage();
    let unlinkAbort: (() => void) | undefined;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FIRST_BYTE_TIMEOUT_MS);
      unlinkAbort = linkAbortSignal(controller, ctx.abortSignal);

      const send = (jsonMode: boolean) =>
        fetch(OPENROUTER_CHAT_URL, {
          method: "POST",
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://seertarot.net",
            "X-Title": "SeerTarot",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: userMessage },
            ],
            ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
            stream: true,
            // โมเดลที่คิดก่อนตอบ: ซ่อนความคิดออกจาก content (เหตุผลเดียวกับ reasoning_format ของ Groq)
            reasoning: { exclude: true },
            usage: { include: true },
            max_tokens: maxReadingTokens,
            temperature: 0.6,
          }),
        });

      // โมเดลฟรีบางตัวไม่รองรับโหมด JSON (400 "does not support") — ยิงใหม่แบบไม่ขอ
      // prompt สั่งให้ตอบเป็น JSON อยู่แล้ว และ finalizeReading ตรวจ schema ซ้ำทุกครั้ง
      let res = await send(true);
      if (res.status === 400) {
        const errText = await res.clone().text().catch(() => "");
        if (/support/i.test(errText)) res = await send(false);
      }

      clearTimeout(timeoutId);

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "");
        console.warn(`[OpenRouter Reading ${model}] status ${res.status}: ${errText.slice(0, 200)}`);
        recordEvent(`ai_openrouter_fail:${res.status}`);
        // โควตารายวันของโมเดลฟรีนับรวมทั้งบัญชี — หมดแล้วลองตัวอื่นก็หมดเหมือนกัน
        if (res.status === 429 && /per.?day/i.test(errText)) return false;
        continue;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await readWithIdleTimeout(reader, { signal: ctx.abortSignal });
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
            if (chunk.usage) {
              usage.inputTokens = chunk.usage.prompt_tokens ?? usage.inputTokens;
              usage.outputTokens = chunk.usage.completion_tokens ?? usage.outputTokens;
            }
            const delta = chunk.choices?.[0]?.delta?.content || "";
            for (const event of consumeReadingDelta(state, delta, { provider: "openrouter", model })) {
              yield event;
            }
            if (state.foreignCircuitBreaker) break;
          } catch {
            // บรรทัด keep-alive (": OPENROUTER PROCESSING") หรือ JSON ขาดครึ่ง — ข้ามได้
          }
        }

        if (state.foreignCircuitBreaker) {
          try {
            await reader.cancel();
          } catch {
            /* สตรีมถูกปิดจากฝั่งเครือข่ายไปแล้ว — กำลังจะ break อยู่แล้ว */
          }
          break;
        }
      }

      if (state.foreignCircuitBreaker) {
        const outcome = resolveForeignBreaker(state, { provider: "openrouter", model });
        if (outcome.needsReset) yield { type: "reset" };
        if (outcome.abandonProvider) return false;
        continue;
      }

      /*
       * usage = 0 ➔ route ถือว่า "ไม่ใช่คำอ่านจริง" แล้วไม่หักสิทธิ์ (INC-0096)
       * บางผู้ให้บริการบน OpenRouter ไม่ส่ง usage กลับมาในสตรีม ต้องประเมินเองให้ไม่เป็น 0
       * ไม่งั้นคำอ่าน AI จริงจะถูกนับเป็นคำอ่านสำรองออฟไลน์
       */
      if (usage.outputTokens === 0 && state.jsonAccumulator.length > 0) {
        usage.inputTokens = Math.ceil((systemInstruction.length + userMessage.length) / 3);
        usage.outputTokens = Math.ceil(state.jsonAccumulator.length / 3);
      }

      // โมเดลฟรีบางตัวห่อ JSON ด้วย ```json ... ``` ทั้งที่ขอ json_object — แกะออกก่อนตรวจ schema
      state.jsonAccumulator = stripCodeFence(state.jsonAccumulator);

      const finalized = finalizeReading(state, ctx, {
        provider: "openrouter",
        model,
        usage,
        promptChars: systemInstruction.length + userMessage.length,
      });

      if (finalized.ok) {
        recordEvent("ai_openrouter_success");
        const ev = finalized.event;
        yield ev.type === "done" ? { ...ev, model: `openrouter:${model}` } : ev;
        return true;
      }
      if (emittedAny(state)) yield { type: "reset" };
    } catch (err) {
      if (ctx.abortSignal?.aborted) {
        recordEvent("ai_client_aborted:openrouter");
        return false;
      }
      console.warn(`[OpenRouter Reading ${model}] stream error:`, err);
      recordEvent("ai_openrouter_fail:stream");
      if (emittedAny(state)) yield { type: "reset" };
    } finally {
      unlinkAbort?.();
    }
  }

  return false;
}
