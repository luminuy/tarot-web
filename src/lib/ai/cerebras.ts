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
 * Cerebras แก้ตรงนี้ได้ด้วยเพดานต่อคำขอที่กว้างกว่ามาก — **30,000 แทน 8,000**
 * ผัง 12 ใบที่หนักสุดใช้ 23,731 จึงยังเหลือที่ และเร็วระดับ ~3,000 tok/s
 * ทำให้ไม่ชน timeout แบบที่ Groq เจอ (ผัง 10 ใบบน Groq ต้องใช้ ~21 วินาที)
 *
 * 💸 **แต่ตัวที่ภาษาไทยดีที่สุดคิดเงิน** — ดูรายละเอียดที่ `CEREBRAS_MODEL_CONFIGS`
 *    เจ้าของโปรเจกต์เลือกแล้วว่าเอาแบบฟรีล้วน (2026-09-14) จึงเหลือ `gpt-oss-120b`
 *    ซึ่งเป็นคนละโมเดลกับ Qwen ที่ Groq ใช้ **สำนวนไทยแข็งกว่า**
 *    ➔ อย่าเข้าใจผิดว่าเส้นทางนี้ได้คุณภาพไทยเท่าเดิม มันคือการแลก
 *      "ผังใหญ่ยิงผ่านและเร็ว" กับ "สำนวนที่อาจสู้ Qwen ไม่ได้"
 *
 * ⚠️ **ข้อจำกัดที่ต้องเคารพ: 5 คำขอ/นาที · 2,400 คำขอ/วัน · uncached 1M โทเค็น/วัน**
 *    (ตัวเลขจริงจากหน้า Limits ของบัญชี ไม่ใช่จากเอกสารทั่วไป)
 *    ต่ำกว่าโควตาของ Groq มาก จึง **ห้ามเอามาแทน Groq ทั้งหมด**
 *    ไฟล์นี้ตั้งใจให้รับเฉพาะผังที่ Groq ทำไม่ได้อยู่แล้ว (ดู `shouldUseCerebras`)
 *    ผัง 1-3 ใบปล่อยให้ Groq ทำต่อไปเพราะโควตาต่อวันเยอะกว่าหลายเท่า
 *
 * ⚠️ **ยังไม่มีใครยิงเข้าโมเดลจริงด้วยคีย์ — ยังตัดสินไม่ได้ว่าควรเปิดใช้หรือเปล่า**
 *    ต้องรัน `npm run ai:probe-cerebras` แล้วเทียบคะแนนไทยของ `gpt-oss-120b`
 *    กับ Gemini ซึ่งเป็นตัวที่รับผังใหญ่อยู่ตอนนี้ (กฎ INC-0053 ห้ามเดา)
 *    **ถ้าแพ้ Gemini ก็ไม่ต้องเปิดเส้นทางนี้เลย** ปล่อย Gemini ทำต่อดีกว่า
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
 * ⚠️⚠️ โมเดลทั้งสองตัวบน Cerebras เป็น **reasoning model ที่คิดก่อนตอบ**
 * และเอกสารทางการเขียนชัดว่า **"Reasoning tokens count toward max_completion_tokens"**
 * ---------------------------------------------------------------------------
 * แปลว่าถ้าไม่จัดการ โทเค็นความคิดจะไปกินงบที่เรากันไว้ให้ "คำอ่าน" จนคำอ่านโดนตัดกลาง
 * ซึ่งคืออาการเดียวกับปัญหาที่เราพยายามแก้ตั้งแต่แรกเป๊ะ แค่ย้ายไปโผล่ที่เจ้าใหม่
 *
 * ตารางความสามารถจริงจาก inference-docs.cerebras.ai/capabilities/reasoning (2026-09-14)
 * **แต่ละตัวคุมไม่เหมือนกัน ห้ามตั้งค่าชุดเดียวใช้ทั้งคู่**:
 *
 *   โมเดล          reasoning_effort ปริยาย   ปิดความคิด        reasoning_format: hidden
 *   qwen-3.8-27b    high ⚠️                  ✅ ตั้ง none ได้    ❌ ไม่รองรับ
 *   gpt-oss-120b    medium                   ❌ ต่ำสุดคือ low    ✅ รองรับ
 *
 * ทางที่เลือกและเหตุผล:
 * - `qwen-3.8-27b` ➔ `reasoning_effort: "none"` ปิดความคิดทิ้งทั้งหมด
 *   งานนี้คือเขียนร้อยแก้วตามโครงที่ prompt กำหนดไว้ละเอียดแล้ว ไม่ใช่โจทย์ที่ต้องคิดหลายชั้น
 *   และฝั่ง Groq ก็ซ่อนความคิดทิ้งอยู่แล้วด้วย `reasoning_format: "hidden"` เหมือนกัน
 * - `gpt-oss-120b` ➔ ปิดไม่ได้ จึงใช้ `low` + `hidden` แล้ว **เผื่องบเป็นสองเท่า**
 *   ให้โทเค็นความคิดกินไปโดยไม่เบียดคำอ่าน (เรามีเพดาน 30,000 เหลือเฟืออยู่แล้ว)
 *
 * อีกเรื่องที่โชคดี: `qwen-3.8-27b` คืนความคิดแยกไว้ที่ `delta.reasoning`
 * ไม่ปนกับ `delta.content` ➔ ตัวถอด JSON บางส่วนและด่านนับอักษรต่างด้าวของเราปลอดภัย
 * **ห้ามเปลี่ยนไปอ่าน `delta.reasoning` เข้ามารวมเด็ดขาด** จะพังทั้งสองด่านทันที
 *
 * ⚠️ ชื่อโมเดลบน Cerebras **ไม่มี prefix ผู้ผลิต** ต่างจาก Groq
 *    Groq เขียน `qwen/qwen3.8-27b` · Cerebras เขียน `qwen-3.8-27b`
 */
export interface CerebrasModelConfig {
  id: string;
  /** ระดับความคิด — "none" = ปิดสนิท (เฉพาะตัวที่รองรับ) */
  reasoningEffort: "none" | "low" | "medium" | "high";
  /** ส่ง `reasoning_format: "hidden"` ได้ไหม (ส่งไปทั้งที่ไม่รองรับอาจโดน 400) */
  supportsHiddenReasoning: boolean;
  /**
   * ตัวคูณงบผลลัพธ์ เผื่อโทเค็นความคิดที่ปิดไม่ได้
   * ปิดความคิดได้ = 1 (ไม่ต้องเผื่อ) · ปิดไม่ได้ = 2 (เผื่อให้ความคิดกินครึ่งหนึ่ง)
   */
  reasoningBudgetMultiplier: number;
  /**
   * 💸 **โมเดลนี้คิดเงินจริงไหม**
   *
   * `true` = อยู่ชั้น PayGo ➔ ทุกคำขอมีค่าใช้จ่ายตามจำนวนโทเค็น
   * โมเดลที่ตั้ง `true` **จะไม่ถูกใช้โดยปริยาย** ต้องเปิดด้วย `CEREBRAS_ALLOW_PAID=1` เท่านั้น
   */
  billed: boolean;
  /** ราคาไว้อ่านประกอบการตัดสินใจ (USD ต่อล้านโทเค็น) — ไม่ได้ใช้คำนวณอะไรในโค้ด */
  priceNote: string;
}

/*
 * ⚠️⚠️ **อ่านก่อนขยับลำดับหรือเพิ่มโมเดล** ⚠️⚠️
 * ---------------------------------------------------------------------------
 * โควตาของ Cerebras **แยกรายโมเดล และคนละชั้นบริการกันได้ในบัญชีเดียว**
 * ตัวเลขจริงจากหน้า Limits ของบัญชีที่ใช้งาน (2026-09-14):
 *
 *   โมเดล          ชั้น          คำขอ/นาที  คำขอ/วัน  uncached/นาที  uncached/วัน
 *   gpt-oss-120b   Free Trial    5          2,400     30,000         1,000,000
 *   gemma-4-31b    Free Trial    5          2,400     30,000         1,000,000
 *   qwen-3.8-27b   💸 PayGo      450        648,000   150,000        216,000,000
 *
 * `qwen-3.8-27b` ตัวเลขสวยกว่ามาก **แต่คิดเงิน** ($0.99/$1.49 ต่อล้านโทเค็น
 * ≈ 0.37 บาทต่อผัง 5 ใบ · 0.60 บาทต่อผัง 12 ใบ) — เจ้าของโปรเจกต์ตัดสินใจแล้วว่า
 * **เอาแบบฟรีล้วน ไม่จ่ายเลย** (2026-09-14) จึงถูกปิดไว้ด้วย `billed: true`
 *
 * 📌 สิ่งที่ต้องรู้และห้ามโฆษณาเกินจริง:
 * เหตุผลเดิมที่เลือก Cerebras คือ "ได้ `qwen-3.8-27b` ตัวเดียวกับที่ใช้บน Groq
 * = ภาษาไทยคุณภาพเดียวกัน" ➔ **พอตัดตัวที่คิดเงินออก เหตุผลนั้นหายไป**
 * เหลือ `gpt-oss-120b` ซึ่งเป็นคนละโมเดล สำนวนไทยแข็งกว่า Qwen
 *
 * สิ่งที่ยังได้อยู่จริง ๆ บนเส้นทางฟรี:
 *   ✅ เพดานต่อคำขอ 30,000 แทน 8,000 ของ Groq ➔ ผังใหญ่ยิงผ่านได้
 *   ✅ เร็วมาก ~3,000 tok/s ➔ ไม่ชน timeout เหมือน Groq
 *   ❓ **ภาษาไทยจะดีกว่า Gemini (ตัวสำรองที่รับผังใหญ่อยู่ตอนนี้) หรือเปล่า ยังไม่มีใครวัด**
 *      ➔ ถ้า `npm run ai:probe-cerebras` ออกมาแล้วคะแนนไทยแพ้ Gemini
 *        **ก็ไม่ควรเปิดใช้เส้นทางนี้เลย** ปล่อยให้ Gemini รับผังใหญ่ต่อไปดีกว่า
 *
 * ⚠️ โควตาฟรีต่อวันแปลเป็นของจริง: uncached 1,000,000 ÷ ~23,700 ต่อผังใหญ่
 *    ≈ **42 ผังใหญ่/วัน** เกินจากนั้นจะโดน 429 แล้วตกไป Gemini เอง (ไม่พัง)
 *    ไม่ทำตัวนับโควตาฝั่งเรา เพราะแต่ละ isolate บน Workers นับแยกกัน = นับไม่ตรงอยู่ดี
 */
export const CEREBRAS_MODEL_CONFIGS: readonly CerebrasModelConfig[] = [
  {
    id: "gpt-oss-120b",
    reasoningEffort: "low",
    supportsHiddenReasoning: true,
    reasoningBudgetMultiplier: 2,
    billed: false,
    priceNote: "ฟรี (Free Trial) — ราคาชั้นจ่ายคือ $0.35/$1M เข้า · $0.75/$1M ออก",
  },
  {
    id: "qwen-3.8-27b",
    reasoningEffort: "none",
    supportsHiddenReasoning: false,
    reasoningBudgetMultiplier: 1,
    billed: true,
    priceNote: "💸 คิดเงิน $0.99/$1M เข้า · $1.49/$1M ออก ≈ 0.37-0.60 บาท/คำอ่าน",
  },
] as const;

/**
 * โมเดลที่จะใช้จริงในรอบนี้ — ตัดตัวที่คิดเงินทิ้งเสมอ
 * เว้นแต่ตั้ง `CEREBRAS_ALLOW_PAID=1` ไว้ชัดเจน (ต้องเป็นการตัดสินใจของเจ้าของเท่านั้น)
 */
export function activeCerebrasModels(): readonly CerebrasModelConfig[] {
  if (process.env.CEREBRAS_ALLOW_PAID?.trim() === "1") return CEREBRAS_MODEL_CONFIGS;
  return CEREBRAS_MODEL_CONFIGS.filter((m) => !m.billed);
}

export const WORKING_CEREBRAS_MODELS = CEREBRAS_MODEL_CONFIGS.map((m) => m.id);

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
  return (
    Boolean(getCerebrasApiKey()) &&
    cardCount >= CEREBRAS_MIN_CARDS &&
    // ปิดตัวที่คิดเงินหมดแล้วอาจไม่เหลือโมเดลเลย — อย่าเสียเวลาเปิดสตรีมเปล่า ๆ
    activeCerebrasModels().length > 0
  );
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
  // คิดจากตัวที่กินงบมากที่สุด เพื่อให้ prompt ที่ตัดแล้วพอสำหรับทุกโมเดลในสายพาน
  const worstCaseBudget = Math.max(
    ...activeCerebrasModels().map((c) =>
      Math.min(CEREBRAS_OUTPUT_CEILING * 2, maxReadingTokens * c.reasoningBudgetMultiplier),
    ),
  );
  const budget = estTokens(systemInstruction) + worstCaseBudget;
  if (budget + estTokens(userMessage) > CEREBRAS_TPM_LIMIT) {
    userMessage = buildReadingMessage(ctx, { omitExemplar: true });
    recordEvent(
      budget + estTokens(userMessage) <= CEREBRAS_TPM_LIMIT
        ? "ai_prompt_trimmed:cerebras"
        : "ai_prompt_over_tpm:cerebras",
    );
  }

  for (const config of activeCerebrasModels()) {
    const model = config.id;
    const state = createReadingStreamState();
    const usage = createEmptyUsage();

    /*
     * งบที่ส่งให้โมเดล = งบคำอ่าน × ตัวคูณเผื่อความคิด
     * โทเค็นความคิดถูกนับรวมใน max_completion_tokens ➔ ถ้าไม่เผื่อ คำอ่านจะโดนตัดกลาง
     */
    const budgetTokens = Math.min(
      CEREBRAS_OUTPUT_CEILING * 2,
      maxReadingTokens * config.reasoningBudgetMultiplier,
    );

    try {
      const controller = new AbortController();
      /*
       * ⏱️ เพดานเวลาโตตามงบจริงที่ส่งไป (รวมโทเค็นความคิดแล้ว) คิดที่ ~1,200 tok/s
       * ต่ำกว่าที่เอกสารแจ้งไว้ ~1,850 เพื่อเผื่อจังหวะที่เซิร์ฟเวอร์แน่น บวกเริ่มต้น 5 วินาที
       */
      const timeoutMs = Math.min(45000, 5000 + Math.ceil((budgetTokens / 1200) * 1000));
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
          max_completion_tokens: budgetTokens,
          temperature: 0.6,
          // ⚠️ ห้ามตัดสองบรรทัดนี้ทิ้ง — ไม่ส่ง = Qwen คิดระดับ "high" แล้วกินงบคำอ่านจนโดนตัดกลาง
          reasoning_effort: config.reasoningEffort,
          // ส่ง hidden เฉพาะตัวที่รองรับ (qwen-3.8-27b ไม่รองรับ ส่งไปเสี่ยงโดน 400)
          ...(config.supportsHiddenReasoning ? { reasoning_format: "hidden" } : {}),
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
