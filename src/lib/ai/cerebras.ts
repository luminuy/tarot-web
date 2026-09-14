/**
 * 🧠 Cerebras Cloud — ทัพหน้าของ "ผังไพ่ใหญ่" (4 ใบขึ้นไป)
 * ---------------------------------------------------------------------------
 * ทำไมต้องมีเจ้านี้เพิ่ม (ต่อจาก INC-0136):
 *
 * Groq นับเพดาน TPM แบบ **prompt + max_tokens รวมกันต่อคำขอเดียว** ที่ 8,000
 * วัดจริงจาก prompt ของเราทุกผังแล้วได้ตามนี้ (ตัดตัวอย่างคำอ่านออกแล้ว):
 *
 *   ผัง 1 ใบ   5,580 ✅   |  ผัง 6 ใบ  10,198 ❌ เกิน 2,198
 *   ผัง 3 ใบ   7,467 ✅   |  ผัง 7 ใบ  11,068 ❌ เกิน 3,068
 *   ผัง 4 ใบ   8,375 ❌   |  ผัง 10 ใบ 13,751 ❌ เกิน 5,751
 *   ผัง 5 ใบ   9,258 ❌   |  ผัง 12 ใบ 15,146 ❌ เกิน 7,146
 *
 * ➔ ผัง 4 ใบขึ้นไป **ไม่มีทางผ่าน Groq ได้เลย** ไม่ว่าจะรอนานแค่ไหนหรือหมุนโมเดลกี่ตัว
 *   ที่ผ่านมามันจึงตกไป Gemini ทุกครั้ง = ผังใหญ่ไม่เคยได้ Qwen ที่ภาษาไทยดีที่สุดเลย
 *
 * Cerebras แก้ตรงนี้ได้พอดี — **มีโมเดลตัวเดียวกับที่เราใช้บน Groq อยู่แล้ว**
 * (ตัวเลขจากเอกสารทางการ inference-docs.cerebras.ai ดึงสด 2026-09-14):
 *
 *   โมเดล           context ฟรี/จ่าย   ความเร็ว     RPM   TPM (uncached/total)  TPD
 *   qwen-3.8-27b     64k / 128k        ~1,850 t/s    5     30K / 90K             1M
 *   gpt-oss-120b     65k / 131k        ~3,000 t/s    5     30K / 90K             1M
 *
 * ➔ เพดาน 30,000 ต่อคำขอ = ผัง 12 ใบ (15,502) ยังเหลือที่อีกเท่าตัว
 * ➔ 1,850 tok/s = ผัง 10 ใบเขียนจบใน ~3.5 วินาที (บน Groq ต้อง 21 วินาที)
 *
 * ⚠️ **ข้อจำกัดที่ต้องเคารพ: 5 คำขอ/นาที (RPM) และ 1M โทเค็น/วัน**
 *    ต่ำกว่าโควตาของ Groq มาก จึง **ห้ามเอามาแทน Groq ทั้งหมด**
 *    ไฟล์นี้ตั้งใจให้รับเฉพาะผังที่ Groq ทำไม่ได้อยู่แล้ว (ดู `shouldUseCerebras`)
 *    ผัง 1-3 ใบปล่อยให้ Groq ทำต่อไปเพราะโควตาต่อวันเยอะกว่าหลายเท่า
 *
 * ⚠️ ยังไม่มีใครยิงเข้าโมเดลจริงด้วยคีย์ — ต้องรัน `npm run ai:probe-cerebras` ก่อน
 *    แล้วดูผลจริงว่าโมเดลไหนคืน JSON ตาม ReadingSchema ได้ครบ (กฎ INC-0053 ห้ามเดา)
 *    ถ้าไม่ตั้ง `CEREBRAS_API_KEY` ไฟล์นี้จะไม่ทำงานเลย ระบบเดิมไม่เปลี่ยนแปลงแม้แต่นิดเดียว
 *
 * ⚠️ กฎเหล็กข้อ 14: ไม่มีและห้ามมีโค้ดกุไพ่ที่นี่ ล้มเหลว = เงียบแล้วให้ผู้เรียกไปต่อ Gemini
 */

import { aiGatewayHeaders, cerebrasChatCompletionsEndpoint } from "@/lib/ai/gateway";
import { recordEvent } from "@/lib/stats/record";
import { buildReadingMessage, buildSystemPrompt, type ReadingContext } from "@/lib/ai/prompt";
import { getContentOverrides, resolvePersona, resolveSystemCore } from "@/lib/content/overrides";
import {
  consumeReadingDelta,
  createEmptyUsage,
  createReadingStreamState,
  finalizeReading,
  resolveForeignBreaker,
  resolveMaxReadingTokens,
} from "@/lib/ai/reading-stream";
import type { ReadingEvent } from "@/lib/ai/types";

/**
 * เรียงให้ Qwen มาก่อนด้วยเหตุผลเดียวกับฝั่ง Groq — ภาษาไทยเป็นธรรมชาติที่สุด
 * `gpt-oss-120b` เป็นตัวสำรอง เร็วกว่าแต่สำนวนไทยแข็งกว่า
 *
 * ⚠️ ชื่อโมเดลบน Cerebras **ไม่มี prefix ผู้ผลิต** ต่างจาก Groq
 *    Groq เขียน `qwen/qwen3.8-27b` · Cerebras เขียน `qwen-3.8-27b`
 */
export const WORKING_CEREBRAS_MODELS = ["qwen-3.8-27b", "gpt-oss-120b"] as const;

/**
 * เพดานโทเค็นรวมต่อคำขอเดียวของ Cerebras ชั้นฟรี (uncached TPM)
 * ตั้งต่ำกว่า 30,000 จริงไว้เล็กน้อยเพราะการประมาณโทเค็นของเราคลาดเคลื่อนได้
 */
const CEREBRAS_TPM_LIMIT = 28000;

/** เพดานความยาวคำอ่าน — กว้างพอให้ผัง 12 ใบ (7,360) เขียนจบโดยไม่โดนหั่น */
const CEREBRAS_OUTPUT_CEILING = 8000;

/** อัตราแปลงตัวอักษร → โทเค็น วัดจริงจากที่ Groq รายงานกลับมา (INC-0136) */
const CHARS_PER_TOKEN = 3.41;

/**
 * จำนวนไพ่ต่ำสุดที่จะส่งมา Cerebras
 *
 * ผัง 1-3 ใบ Groq รับไหวสบาย ๆ และมีโควตาต่อวันเยอะกว่ามาก จึงไม่ควรมาเบียด
 * โควตา 5 RPM ของที่นี่ ซึ่งควรสงวนไว้ให้ผังใหญ่ที่ไม่มีทางเลือกอื่น
 */
export const CEREBRAS_MIN_CARDS = 4;

export function getCerebrasApiKey(): string | undefined {
  return process.env.CEREBRAS_API_KEY?.trim() || undefined;
}

/**
 * ควรส่งคำขอนี้ไป Cerebras ไหม — ใช้ใน route ก่อนเรียก `streamCerebrasReading`
 * แยกออกมาเป็นฟังก์ชันเพื่อให้ชุดทดสอบเรียกตรวจเงื่อนไขได้โดยไม่ต้องมีคีย์
 */
export function shouldUseCerebras(cardCount: number): boolean {
  return Boolean(getCerebrasApiKey()) && cardCount >= CEREBRAS_MIN_CARDS;
}

/**
 * 🔮 สตรีมคำทำนายผ่าน Cerebras (OpenAI-compatible SSE)
 *
 * ใช้เครื่องยนต์ถอดสตรีมตัวเดียวกับ Groq (`reading-stream.ts`) ทุกด่าน:
 * ตัดวงจรอักษรต่างด้าว → ตรวจ ReadingSchema → ตรวจความสอดคล้อง → ขัดภาษาไทย
 *
 * จบไม่สำเร็จ = หลุดออกจาก generator เงียบ ๆ ให้ route caller ไปต่อ Groq/Gemini
 */
export async function* streamCerebrasReading(ctx: ReadingContext): AsyncGenerator<ReadingEvent> {
  const apiKey = getCerebrasApiKey();
  if (!apiKey) return;

  const overrides = await getContentOverrides();
  const persona = resolvePersona(overrides, ctx.personaId);
  const systemCore = resolveSystemCore(overrides);
  const systemInstruction = buildSystemPrompt(ctx.personaId, {
    systemCore: ctx.lang === "en" ? undefined : systemCore,
    persona,
    lang: ctx.lang,
  });

  const maxReadingTokens = resolveMaxReadingTokens(ctx.drawn.length, CEREBRAS_OUTPUT_CEILING);
  const estTokens = (text: string) => Math.ceil(text.length / CHARS_PER_TOKEN);

  /*
   * เผื่อไว้เหมือนฝั่ง Groq: ถ้าคำขอใหญ่เกินเพดานจริง ๆ ให้ตัด "ตัวอย่างคำอ่านมาตรฐาน"
   * ออกก่อน (~830 โทเค็น) ดีกว่าปล่อยให้โดนปฏิเสธทั้งคำขอ
   *
   * ตามตัวเลขที่วัดไว้ ผังใหญ่สุดของเราคือ 15,502 ซึ่งยังห่างเพดาน 28,000 มาก
   * ทางนี้จึงแทบไม่ถูกใช้ — แต่ต้องมีไว้กันวันที่ prompt โตขึ้นแล้วไม่มีใครทันสังเกต
   */
  let userMessage = buildReadingMessage(ctx);
  const budget = estTokens(systemInstruction) + maxReadingTokens;
  if (budget + estTokens(userMessage) > CEREBRAS_TPM_LIMIT) {
    userMessage = buildReadingMessage(ctx, { omitExemplar: true });
    recordEvent(
      budget + estTokens(userMessage) <= CEREBRAS_TPM_LIMIT
        ? "ai_prompt_trimmed:cerebras"
        : "ai_prompt_over_tpm:cerebras",
    );
  }

  for (const model of WORKING_CEREBRAS_MODELS) {
    const state = createReadingStreamState();
    const usage = createEmptyUsage();

    try {
      const controller = new AbortController();
      /*
       * ⏱️ เพดานเวลาโตตามความยาวคำอ่าน คิดที่ ~1,200 tok/s (ต่ำกว่าที่เอกสารแจ้ง
       * ไว้ ~1,850 เพื่อเผื่อจังหวะที่เซิร์ฟเวอร์แน่น) บวกเวลาเริ่มต้น 5 วินาที
       */
      const timeoutMs = Math.min(45000, 5000 + Math.ceil((maxReadingTokens / 1200) * 1000));
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(cerebrasChatCompletionsEndpoint(), {
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
          max_completion_tokens: maxReadingTokens,
          temperature: 0.6,
        }),
      });

      clearTimeout(timeoutId);

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "");
        console.warn(`[Cerebras Reading ${model}] status ${res.status}: ${errText.slice(0, 200)}`);
        recordEvent(`ai_http_fail:cerebras_${res.status}`);
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
            // Cerebras ส่ง usage มาที่ระดับบนสุดตามมาตรฐาน OpenAI (ไม่ใช่ใต้ x_groq)
            if (chunk.usage) {
              usage.inputTokens = chunk.usage.prompt_tokens ?? usage.inputTokens;
              usage.outputTokens = chunk.usage.completion_tokens ?? usage.outputTokens;
            }

            const delta = chunk.choices?.[0]?.delta?.content || "";
            for (const event of consumeReadingDelta(state, delta, {
              provider: "cerebras",
              model,
            })) {
              yield event;
            }
            if (state.foreignCircuitBreaker) break;
          } catch {
            // chunk JSON parse ignore
          }
        }

        if (state.foreignCircuitBreaker) {
          try {
            await reader.cancel();
          } catch {}
          break;
        }
      }

      if (state.foreignCircuitBreaker) {
        const outcome = resolveForeignBreaker(state, { provider: "cerebras", model });
        if (outcome.needsReset) {
          yield { type: "reset" };
        }
        if (outcome.abandonProvider) break;
        continue;
      }

      const finalized = finalizeReading(state, ctx, {
        provider: "cerebras",
        model,
        usage,
        promptChars: systemInstruction.length + userMessage.length,
      });

      if (finalized.ok) {
        yield finalized.event;
        return;
      }
    } catch (err) {
      console.warn(`[Cerebras Reading ${model}] stream error:`, err);
    }
  }
}
