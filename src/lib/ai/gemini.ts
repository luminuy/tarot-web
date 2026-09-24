import "server-only";
import { parsePartialReading } from "@/lib/utils/partial-json";
import { buildReadingMessage, buildSystemPrompt, type ReadingContext } from "@/lib/ai/prompt";
import { linkAbortSignal, readWithIdleTimeout } from "@/lib/ai/abort";
import { getContentOverrides, resolvePersona, resolveSystemCore } from "@/lib/content/overrides";
import { ReadingSchema } from "@/lib/schema/reading";
import type { ReadingEvent, UsageInfo } from "@/lib/ai/types";

import {
  hasForeignScript,
  objectHasForeignScript,
  stripForeignScript,
  stripForeignScriptDeep,
  stripThinkingTags,
} from "@/lib/ai/language";
import { aiGatewayHeaders, geminiEndpoint } from "@/lib/ai/gateway";
import { checkReadingConsistency } from "@/lib/ai/consistency";
import { enforceThaiQuality } from "@/lib/ai/thai-quality";
import { recordEvent } from "@/lib/stats/record";
import { resolveThinkingOutputBudget } from "@/lib/ai/reading-stream";
import { streamMockGeminiReading, type MockReason } from "@/lib/ai/mock-reading";

export { streamMockGeminiReading, type MockReason };
/**
 * ตัวเชื่อมกับ Google Gemini API (Ultra-Low Latency Streaming)
 * -------------------------------------------------
 * ไฟล์นี้ทำงานฝั่งเซิร์ฟเวอร์เท่านั้น
 */

/**
 * Schema บังคับโครงสร้าง JSON ของคำอ่าน (responseJsonSchema — มาตรฐาน JSON Schema)
 * -------------------------------------------------------------------------------
 * ต้องมี: ถ้าไม่ส่ง schema เลย Gemini 3.x จะแต่งคีย์เอง (`reading_title`, `overall_energy`, …)
 * → ReadingSchema.safeParse fail → ทุกคำอ่านตกไป fallbackReading filler (ISSUE-016)
 * ใช้ responseJsonSchema (ไม่ใช่ responseSchema แบบ OpenAPI `type:"OBJECT"` เดิมที่ 3.x คืน 400)
 */
const READING_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    opening: { type: "string" },
    cards: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          position: { type: "integer" },
          headline: { type: "string" },
          visualAnchor: { type: "string" },
          positionLink: { type: "string" },
          questionLink: { type: "string" },
          reading: { type: "string" },
        },
        required: ["position", "headline", "reading"],
      },
    },
    connections: { type: "string" },
    summary: { type: "string" },
    advice: { type: "array", items: { type: "string" } },
    timing: { type: "string" },
    yesNoAnswer: { type: "string", enum: ["ใช่", "ไม่ใช่", "ยังไม่แน่"] },
    mood: { type: "string", enum: ["สดใส", "อบอุ่น", "สงบ", "ครุ่นคิด", "ท้าทาย"] },
  },
  required: ["opening", "cards", "connections", "summary", "advice", "timing", "mood"],
};

/**
 * โมเดลที่ลองเรียงกันจนกว่าจะเจอตัวที่เรียกได้ (loop ใน streamGeminiReading + chat + monthly-summary)
 * -------------------------------------------------------------------------------------------
 * ยืนยันจาก Worker log 2026-09-01 (ISSUE-016): รุ่น 1.5 / 2.0 / 2.5 ถูก Google ปลดหมดแล้ว
 * (404 "no longer available · use models/gemini-3.6-flash") · รุ่นที่ยังเรียกได้คือ 3.5-lite / 3.6 / 3.7
 * - นำด้วย `gemini-3.6-flash` = รุ่นที่ Google แนะนำใน error message ปัจจุบัน (capacity เยอะสุด)
 * - `gemini-3.7-flash` / `gemini-flash-latest` บางจังหวะ 503 "high demand" → ให้ loop ตกไปตัวถัดไป
 * - `gemini-3.5-flash-lite` = เบาสุด เหลือเป็นตาข่ายสุดท้ายก่อน mock
 * ถ้าจะแก้ ยึดผลจริงจาก `GET https://generativelanguage.googleapis.com/v1beta/models?key=…`
 */
/**
 * รายชื่อโมเดล "ทุกตัวที่เรารู้จัก" — ตอนนี้ใช้ที่เดียวคือด่านตรวจ /api/admin/ai-health
 * เพื่อวัดผลทุกตัวต่อไปเรื่อย ๆ จะได้รู้ว่าตัวที่เคยตายกลับมาใช้ได้แล้วหรือยัง
 * ⚠️ ห้ามเอารายการนี้ไปใช้ในเส้นทางที่มีผู้ใช้นั่งรอ — ใช้ WORKING_GEMINI_MODELS แทน
 */
export const CANDIDATE_GEMINI_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.7-flash",
  "gemini-flash-latest",
  "gemini-3.5-flash-lite",
];

/**
 * โมเดลที่ "พิสูจน์แล้วว่าตอบได้จริง" — ใช้กับทุกเส้นทางที่ผู้ใช้นั่งรออยู่
 * (คำอ่านไพ่ · ห้องคุยถามแม่หมอ · สรุปดวงรายเดือน)
 * ------------------------------------------------------------------------
 * 📊 วัดจริงจากแท็บ "สุขภาพ AI" บน production 3 ครั้งติด (2026-09-02 14:17 / 14:20 / 14:23):
 *
 *   | โมเดล                  | ครั้ง 1  | ครั้ง 2  | ครั้ง 3  | สรุป              |
 *   | `gemini-3.6-flash`     | ❌ 20s   | ✅ 2397ms| ✅ 3210ms| 2/3 · ไม่แน่นอน   |
 *   | `gemini-3.7-flash`     | ❌ 20s   | ❌ 20s   | ❌ 20s   | 0/3 · ตายสนิท     |
 *   | `gemini-flash-latest`  | ❌ 20s   | ❌ 20s   | ❌ 20s   | 0/3 · ตายสนิท     |
 *   | `gemini-3.5-flash-lite`| ✅ 861ms | ✅ 843ms | ✅ 722ms | 3/3 · เร็วและนิ่ง |
 *
 * `3.7-flash` และ `flash-latest` ไม่ตอบเลยสักครั้งจาก 3 ครั้ง จึงตัดออกจากเส้นทางที่มีคนรอ
 * เก็บ `3.6-flash` ไว้เป็นตัวแรกเพราะคุณภาพคำตอบดีกว่าเมื่อมันว่าง แต่ต้องมีเพดานเวลาสั้น ๆ
 * แล้วตกไป `3.5-flash-lite` ทันที (กลยุทธ์ hedge — เจ้าของโปรเจกต์เลือกเอง 2026-09-02)
 *
 * ⚠️ ถ้าจะแก้รายการนี้ ให้ยึดผลจาก /admin → แท็บ "สุขภาพ AI" เท่านั้น **ห้ามเดา** (บทเรียน INC-0053)
 */
export const WORKING_GEMINI_MODELS = ["gemini-3.5-flash-lite", "gemini-3.6-flash"];

/**
 * เพดานเวลารอ "การตอบกลับครั้งแรก" ต่อโมเดล (มิลลิวินาที)
 * ตัวแรกให้ 9 วินาทีเพื่อความลึกซึ้ง หากติดขัดตกไปตัวที่ 2 (3.5-flash-lite) ทันที
 */
export const GEMINI_FIRST_MODEL_TIMEOUT_MS = 9000;
export const GEMINI_FALLBACK_MODEL_TIMEOUT_MS = 15000;

/**
 * ดึง "ข้อความคำตอบจริง" ออกจาก parts ของ Gemini
 * ------------------------------------------------
 * Gemini 3.x เปิดโหมดคิด (thinking) เป็นค่าเริ่มต้น → `content.parts` จะมีทั้ง
 * part ความคิดภายใน (`thought: true` บางทีมีแต่ `thoughtSignature` ไม่มี `text` เลย)
 * และ part คำตอบจริงปนกัน และ **ลำดับไม่แน่นอน** — `parts[0]` จึงไม่ใช่คำตอบเสมอไป
 *
 * ใครที่อ่าน `parts[0].text` ตรง ๆ จะได้ค่าว่างหรือได้ข้อความความคิดแทนคำตอบ
 * (บทเรียน INC-0052 · เคยทำให้ห้องแชทถามแม่หมอตกไปใช้คำตอบสำเร็จรูปทุกครั้ง)
 *
 * ⚠️ ฟังก์ชันนี้ **ไม่ trim** เพราะถูกใช้ต่อสตรีมทีละ chunk ด้วย
 * การ trim รายชิ้นจะกินช่องว่างในสตริง JSON จนพัง — ถ้าต้องการ trim ใช้ `extractGeminiAnswer()`
 */
export function joinGeminiAnswerParts(parts: unknown): string {
  if (!Array.isArray(parts)) return "";
  return parts
    .filter((p: any) => p && p.thought !== true && typeof p.text === "string")
    .map((p: any) => p.text as string)
    .join("");
}

/** ดึงคำตอบจาก response ก้อนเดียว (generateContent ที่ไม่ใช่สตรีม) พร้อม trim และตัด thinking tags */
export function extractGeminiAnswer(payload: any): string {
  const text = joinGeminiAnswerParts(payload?.candidates?.[0]?.content?.parts);
  return stripThinkingTags(text);
}

// ค่าเริ่มต้นก่อนได้ usageMetadata จริงจาก Gemini — ตั้งเป็นศูนย์แทนการเดาตัวเลข
// เพื่อไม่ให้ระบบคิดต้นทุน/เครดิตหลงเชื่อตัวเลขปลอมถ้า Gemini เปลี่ยน API แล้วไม่ส่ง usageMetadata มา
const DEFAULT_USAGE: UsageInfo = {
  inputTokens: 0,
  outputTokens: 0,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
};


/**
 * กันอักษรต่างภาษาหลุดออกไปหาผู้ใช้ระหว่างสตรีม
 *
 * โมเดลบางตัวหลุดพ่นอักษรจีน/ญี่ปุ่นปนกลางประโยคไทย พอเป็นสตรีมจะย้อนกลับไปขอใหม่ไม่ได้แล้ว
 * (ข้อความออกไปแสดงบนจอแล้ว) จึงล้างทิ้งตรงจุดที่ yield แทน แล้ว log ไว้ดูอัตราการเกิด
 */
function thaiOnly(text: string, where: string): string {
  if (!hasForeignScript(text)) return text;
  console.warn(`[lang] พบอักษรต่างภาษาใน "${where}" — ล้างทิ้งก่อนส่งออก`);
  return stripForeignScript(text);
}

/**
 * 📏 งบโทเค็นผลลัพธ์ต่อคำอ่านหนึ่งครั้งฝั่ง Gemini
 *
 * Gemini 3.x เปิดโหมดคิดเป็นค่าเริ่มต้นและ **โทเค็นความคิดถูกนับรวมในงบผลลัพธ์**
 * ปิดไม่ได้ด้วย — `thinkingBudget: 0` ทำให้ได้ 400 มาแล้ว จึงต้องเผื่องบ 3 เท่า
 * และไม่ต่ำกว่า 8,192 เพื่อให้เพดานนี้แทบไม่มีทางเป็นตัวบีบคำอ่าน
 *
 * ถ้าค่านี้ถูกปฏิเสธด้วย 400 ระบบจะยิงซ้ำโดยไม่ส่งเพดานเลย (ดู `fetchGeminiStream`)
 */
export const GEMINI_OUTPUT_BUDGET = { ceiling: 8000, multiplier: 3, floor: 8192 } as const;

/** ผลของการขอสตรีมหนึ่งครั้ง */
interface GeminiFetchResult {
  response: Response | null;
  /** true = เพดานผลลัพธ์ถูกปฏิเสธ ต้องยิงซ้ำแบบไม่ส่งเพดาน (บันทึกสถิติไว้ดู) */
  droppedBudget: boolean;
}

/**
 * ยิงขอสตรีมจาก Gemini พร้อมตาข่ายกัน 400 จากเพดานผลลัพธ์
 *
 * เคยเจอมาแล้วว่า Gemini 3.x ปฏิเสธ `thinkingBudget: 0` และ `responseSchema` แบบเก่า
 * ด้วย 400 "invalid argument" — `maxOutputTokens` ก็มีโอกาสโดนแบบเดียวกัน
 * ถ้าโดน ให้ถอยไปยิงแบบไม่ส่งเพดาน ดีกว่าปล่อยให้ผู้ใช้ตกไปคำอ่านสำรองทั้งที่แก้ได้
 */
async function fetchGeminiStream(args: {
  endpoint: string;
  apiKey: string;
  systemInstruction: string;
  userPrompt: string;
  maxOutputTokens: number;
  timeoutMs: number;
  model: string;
  /** สัญญาณยกเลิกของคำขอจริง — ปิดแท็บแล้วต้องหยุดยิง Gemini ทันที (T-06) */
  abortSignal?: AbortSignal;
}): Promise<GeminiFetchResult> {
  const buildBody = (withBudget: boolean) => ({
    contents: [{ role: "user", parts: [{ text: args.userPrompt }] }],
    systemInstruction: { parts: [{ text: args.systemInstruction }] },
    generationConfig: {
      responseMimeType: "application/json",
      responseJsonSchema: READING_JSON_SCHEMA,
      temperature: 0.7,
      ...(withBudget ? { maxOutputTokens: args.maxOutputTokens } : {}),
    },
  });

  for (const withBudget of [true, false]) {
    // ⏱️ จับเวลาเฉพาะ "การตอบกลับครั้งแรก" (headers) แล้วเคลียร์ทันทีที่ได้ response
    // ห้ามปล่อยตัวจับเวลาไว้ข้ามไปตอนอ่านสตรีม ไม่งั้นมันจะไปตัดสตรีมกลางคัน
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), args.timeoutMs);
    const unlinkAbort = linkAbortSignal(controller, args.abortSignal);
    try {
      const res = await fetch(args.endpoint, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": args.apiKey,
          ...aiGatewayHeaders({ cacheTtl: 0 }),
        },
        body: JSON.stringify(buildBody(withBudget)),
      });
      clearTimeout(timeoutId);
      unlinkAbort();

      if (res.ok) return { response: res, droppedBudget: !withBudget };

      // log body ด้วย (ไม่ใช่แค่ status) — ช่วยแยก "คีย์ผิด" / "โมเดลไม่มี" / "โควตาหมด" ได้ทันทีจาก Worker log
      const errBody = await res.text().catch(() => "");
      console.warn(
        `Gemini Model ${args.model} returned status: ${res.status} · ${errBody.slice(0, 300)}`,
      );
      // 400 ตอนส่งเพดาน = น่าจะเป็นเพราะเพดานนั่นแหละ ลองใหม่แบบไม่ส่ง
      if (withBudget && res.status === 400) {
        recordEvent("ai_gemini_budget_rejected");
        continue;
      }
      return { response: null, droppedBudget: false };
    } catch (e) {
      clearTimeout(timeoutId);
      unlinkAbort();
      if (args.abortSignal?.aborted) {
        // ลูกค้าตัดการเชื่อมต่อ ไม่ใช่ Gemini พัง — ห้ามยิงซ้ำหรือถอยโมเดลให้เปลืองเงิน
        recordEvent("ai_client_aborted:gemini");
        return { response: null, droppedBudget: false };
      }
      console.warn(`Gemini Model ${args.model} fetch failed:`, e);
      return { response: null, droppedBudget: false };
    }
  }
  return { response: null, droppedBudget: false };
}

export async function* streamGeminiReading(ctx: ReadingContext): AsyncGenerator<ReadingEvent> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    // ⚠️ ไม่มีคีย์ = ทุกคำอ่านเป็น mock ออฟไลน์ · usage = 0 → ระบบถือว่า "ไม่ใช่คำอ่านจริง"
    // → ไม่หักสิทธิ์ guest/สมาชิก (ตั้งใจกันโกงตาม INC-0096) → paywall ไม่ทำงานเลย
    // ตั้งคีย์ด้วย `npx wrangler secret put GEMINI_API_KEY` (ดู docs/PENDING_SETUP.md)
    console.error(
      "[gemini] ไม่พบ GEMINI_API_KEY / GOOGLE_API_KEY — เสิร์ฟคำอ่าน mock ออฟไลน์ทั้งหมด และระบบสิทธิ์ (โควตา) จะไม่ทำงาน",
    );
    yield* streamMockGeminiReading(ctx, "no_api_key");
    return;
  }

  const overrideDoc = await getContentOverrides();
  const systemInstruction = buildSystemPrompt(ctx.personaId, {
    systemCore: ctx.lang === "en" ? undefined : resolveSystemCore(overrideDoc),
    persona: resolvePersona(overrideDoc, ctx.personaId),
    lang: ctx.lang,
  });
  const userPrompt = buildReadingMessage(ctx);
  const maxOutputTokens = resolveThinkingOutputBudget(ctx.drawn.length, GEMINI_OUTPUT_BUDGET);

  /*
   * 🔁 ลูปนี้ครอบ "ยิง + สตรีม + ตรวจ" ทั้งชุด ไม่ใช่แค่ตอนขอ response
   * ---------------------------------------------------------------------------
   * เดิมลูปจบทันทีที่ได้ headers แล้วสตรีมอยู่นอกลูป ➔ **ถ้าเขียนไม่จบก็จบเลย
   * ไม่มีการลองโมเดลที่สองแม้แต่ครั้งเดียว** แล้วยัดข้อความสำเร็จรูปให้ผู้ใช้แทน
   * (คำอ่านผังใหญ่จึงออกมาไพ่ไม่ครบแบบเงียบ ๆ — ดู INC-0155)
   *
   * ตอนนี้เขียนไม่จบ = ลองโมเดลถัดไปก่อนเสมอ เหมือนที่ฝั่ง Groq ทำอยู่แล้ว
   */
  let sawAnyResponse = false;
  let lastFailure: "truncated" | "schema" | "stream_error" | null = null;

  for (const [modelIdx, model] of WORKING_GEMINI_MODELS.entries()) {
    const { response, droppedBudget } = await fetchGeminiStream({
      endpoint: geminiEndpoint(model, "streamGenerateContent", { sse: true }),
      apiKey,
      systemInstruction,
      userPrompt,
      maxOutputTokens,
      timeoutMs: modelIdx === 0 ? GEMINI_FIRST_MODEL_TIMEOUT_MS : GEMINI_FALLBACK_MODEL_TIMEOUT_MS,
      model,
      abortSignal: ctx.abortSignal,
    });

    if (ctx.abortSignal?.aborted) return;
    if (!response || !response.body) continue;
    sawAnyResponse = true;
    if (droppedBudget) {
      console.warn(`[gemini] ${model} ไม่รับ maxOutputTokens — ยิงใหม่แบบไม่ส่งเพดานแล้ว`);
    }

    const activeModel = model;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let jsonAccumulator = "";
    let sentOpening = false;
    let sentConnections = false;
    let sentSummary = false;
    let cardsSent = 0;
    /** เหตุผลที่โมเดลหยุดเขียน — "MAX_TOKENS" คือหลักฐานตรง ๆ ว่าคำอ่านโดนตัด */
    let finishReason = "";
    // เก็บ usageMetadata จริงจาก chunk ล่าสุดที่มันมากับ Gemini stream
    // (ไม่ใช้ตัวเลขคงที่ เพราะระบบเครดิต/สมาชิกต้องคิดต้นทุนจากของจริง ไม่งั้นบิลกับที่คิดราคาขายไม่ตรงกัน)
    let usage: UsageInfo = { ...DEFAULT_USAGE };

    try {
      while (true) {
        // เพดานเวลาระหว่างก้อน + ยกเลิกตามลูกค้า (A2-15) — เดิม `reader.read()` รอไม่มีกำหนด
        // และถอดสายยกเลิกไปตั้งแต่ได้ headers ปิดแท็บแล้ว Gemini ยังผลิตโทเคนต่อ
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

            // usageMetadata มักมากับ chunk สุดท้ายของสตรีม เก็บล่าสุดที่เจอไว้เสมอ
            const meta = chunk.usageMetadata;
            if (meta) {
              usage = {
                inputTokens: meta.promptTokenCount ?? usage.inputTokens,
                outputTokens: meta.candidatesTokenCount ?? usage.outputTokens,
                // Gemini ไม่มี prompt caching แบบเดียวกับ Claude จึงเป็น 0 เสมอในตอนนี้
                cacheReadTokens: meta.cachedContentTokenCount ?? 0,
                cacheWriteTokens: 0,
              };
            }

            // เก็บไว้เสมอ ค่าสุดท้ายที่ได้คือคำตอบว่าโมเดลจบเพราะอะไร
            const reason = chunk.candidates?.[0]?.finishReason;
            if (reason) finishReason = String(reason);

            // ข้าม part ความคิดของ Gemini 3.x — รายละเอียดอยู่ใน joinGeminiAnswerParts()
            const answerText = joinGeminiAnswerParts(chunk.candidates?.[0]?.content?.parts);
            if (answerText) {
              jsonAccumulator += answerText;
              const partial = parsePartialReading(jsonAccumulator);

              if (!sentOpening && partial.opening) {
                sentOpening = true;
                yield { type: "opening", text: thaiOnly(partial.opening, "opening") };
              }

              while (cardsSent < partial.cards.length) {
                const card = partial.cards[cardsSent];
                cardsSent++;
                yield {
                  type: "card",
                  position: card.position,
                  headline: thaiOnly(card.headline, `card[${card.position}].headline`),
                  visualAnchor: (card as any).visualAnchor
                    ? thaiOnly((card as any).visualAnchor, `card[${card.position}].visualAnchor`)
                    : undefined,
                  reading: thaiOnly(card.reading, `card[${card.position}].reading`),
                };
              }

              if (!sentConnections && partial.connections) {
                sentConnections = true;
                yield { type: "connections", text: thaiOnly(partial.connections, "connections") };
              }

              if (!sentSummary && partial.summary) {
                sentSummary = true;
                yield { type: "summary", text: thaiOnly(partial.summary, "summary") };
              }
            }
          } catch {
            // Chunk parse ignore
          }
        }
      }
    } catch (error) {
      if (ctx.abortSignal?.aborted) {
        recordEvent("ai_client_aborted:gemini");
        return;
      }
      console.error(`[gemini] ${activeModel} สตรีมขัดข้อง:`, error);
      recordEvent(`ai_stream_error:${activeModel}`);
      lastFailure = "stream_error";
      if (sentOpening || cardsSent > 0) yield { type: "reset" };
      continue;
    }

    /*
     * 📊 บันทึกไว้ทุกครั้งที่คำอ่านถูกตัด — เดิมเส้นทางนี้ไม่มีสถิติเลยสักตัว
     * ทำให้ไม่มีใครรู้ว่าผู้ใช้ได้คำอ่านไพ่ไม่ครบไปกี่คน (ฝั่ง Groq มี ai_schema_fail อยู่แล้ว)
     */
    const truncated = finishReason === "MAX_TOKENS";
    if (truncated) {
      recordEvent("ai_truncated:gemini");
      recordEvent(`ai_truncated:${activeModel}`);
      recordEvent(`ai_truncated_cards:${ctx.drawn.length}`);
      console.warn(
        `[gemini] ${activeModel} เขียนไม่จบ (finishReason=MAX_TOKENS) · ผัง ${ctx.drawn.length} ใบ · ได้ไพ่มา ${cardsSent} ใบ · งบที่ให้ ${maxOutputTokens}`,
      );
    }

    let parsedJson: any = null;
    try {
      parsedJson = JSON.parse(jsonAccumulator);
    } catch {
      // JSON ไม่ครบ — จัดการรวมกับกรณี schema ไม่ผ่านด้านล่าง
    }

    const parsed = parsedJson ? ReadingSchema.safeParse(parsedJson) : null;
    if (!parsed || !parsed.success) {
      recordEvent("ai_schema_fail:gemini");
      recordEvent(`ai_schema_fail:${activeModel}`);
      console.warn(
        `[gemini] คำอ่านไม่ผ่าน schema · accLen=${jsonAccumulator.length} · finishReason=${finishReason || "(ไม่ระบุ)"} · head=${jsonAccumulator.slice(0, 200)} · zodErr=${parsed ? JSON.stringify(parsed.error.issues?.slice(0, 3)) : "JSON.parse failed"}`,
      );
      lastFailure = truncated ? "truncated" : "schema";
      // พ่นเนื้อหาไปแล้วบางส่วน ต้องบอกไคลเอนต์ให้ล้างก่อนเริ่มใหม่กับโมเดลถัดไป
      if (sentOpening || cardsSent > 0) yield { type: "reset" };
      continue;
    }

    let readingData = parsed.data;
    if (!ctx.spread.yesNoMode) {
      readingData.yesNoAnswer = null;
    }
    // ผลสุดท้ายคือตัวที่ถูกบันทึกลงสมุดบันทึกดวง — ต้องสะอาดแน่นอน
    if (objectHasForeignScript(readingData)) {
      console.warn("[lang] คำทำนายฉบับสมบูรณ์มีอักษรต่างภาษาปน — ล้างก่อนบันทึก");
      readingData = stripForeignScriptDeep(readingData);
    }

    // 🛡️ ด่านตรวจความสอดคล้อง (AI_INTELLIGENCE_PLAN W1.3)
    const consistency = checkReadingConsistency(readingData, ctx.cards, {
      drawnCount: ctx.drawn.length,
      yesNoMode: ctx.spread.yesNoMode,
      pastReading: ctx.pastReading,
    });

    if (!consistency.ok) {
      for (const issue of consistency.issues) {
        recordEvent(`ai_consistency_${issue.fatal ? "fail" : "warn"}:${issue.code.toLowerCase()}`);
      }
    }

    // 🃏 กฎเหล็กข้อ 14 — ห้ามส่งคำอ่านที่ตกด่านระดับ fatal ออกไปเด็ดขาด
    // FOREIGN_CARD (พูดถึงไพ่ที่ไม่ได้อยู่ในสำรับที่จั่วรอบนี้) เป็น fatal
    // เดิมถอยไปคำอ่านสำรอง ตอนนี้ลองโมเดลถัดไปก่อน แล้วค่อยแจ้งผู้ใช้ถ้าไม่เหลือใคร
    if (consistency.fatal) {
      const fatalIssue = consistency.issues.find((i) => i.fatal);
      console.warn(
        `[gemini] ${activeModel} ⚠️ ความสอดคล้องล้มเหลว (Fatal): ${fatalIssue?.code} - ${fatalIssue?.message} — ลองโมเดลถัดไป`,
      );
      lastFailure = "schema";
      if (sentOpening || cardsSent > 0) yield { type: "reset" };
      continue;
    }

    // ✍️ ด่านภาษาไทย (HANDOFF_AI_ACCURACY_THAI B-01) — แก้เงียบ ๆ ไม่ถอยไปโมเดลอื่น
    const thai = enforceThaiQuality(readingData, { personaId: ctx.personaId });
    readingData = thai.reading;
    if (thai.fixCount > 0) {
      recordEvent("ai_thai_fix");
      recordEvent(`ai_thai_fix:${activeModel}`);
    }
    for (const code of thai.issueCodes) {
      recordEvent(`ai_thai_issue:${code.toLowerCase()}`);
    }

    yield {
      type: "done",
      reading: readingData,
      usage,
      model: activeModel,
      consistencyOk: consistency.ok,
      thaiScore: thai.score,
      thaiIssueCodes: thai.issueCodes,
      thaiFixCount: thai.fixCount,
    };
    return;
  }

  /*
   * มาถึงตรงนี้ = ไม่มีโมเดลไหนให้คำอ่านที่ครบถ้วนได้เลย
   * ---------------------------------------------------------------------------
   * แยกสองกรณีให้ชัด เพราะความหมายต่อผู้ใช้ต่างกันคนละเรื่อง:
   *
   * 1. **ไม่มีใครตอบเลย** (เน็ตล่ม / โควตาหมด / คีย์ผิด) ➔ คำอ่านสำรองออฟไลน์
   *    usage = 0 ระบบจึงไม่หักสิทธิ์ ผู้ใช้ยังได้อ่านอะไรสักอย่างดีกว่าจอว่าง
   *
   * 2. **ตอบแต่เขียนไม่จบ** ➔ **ต้องบอกผู้ใช้ตรง ๆ ให้โหลดใหม่ ห้ามเงียบ**
   *    เดิมตรงนี้ยัดข้อความสำเร็จรูป ("จงเชื่อมั่นในสัญชาตญาณ...") ให้แทน
   *    แล้วส่ง `done` พร้อม usage จริง ➔ ระบบนับว่าสำเร็จและ **หักโควตาผู้ใช้ไปด้วย**
   *    ทั้งที่ไพ่มาไม่ครบและคำอ่านไม่ได้เกี่ยวกับไพ่ที่จั่วเลย
   *    ขัดเจตนากฎเหล็กข้อ 14 ที่ว่า "ข้อมูลไพ่ไม่สมบูรณ์ ➔ แจ้งให้โหลดใหม่ทันที"
   *    ตอนนี้ส่ง `error` แทน ซึ่ง route จะคืนสิทธิ์ให้เอง (`refundIfConsumed`)
   */
  /*
   * 🛟 ชั้นที่ 3: โมเดลฟรีบน OpenRouter — ลองก่อนทั้งสองกรณีข้างล่าง
   * (Gemini ไม่ตอบเลย / ตอบแต่เขียนไม่จบ) ไม่มีคีย์หรือไม่มีโมเดลที่วัดแล้วผ่าน = ข้ามเงียบ ๆ
   * ทุกโมเดลที่ล้มกลางคันส่ง `reset` แล้ว จึงเริ่มสตรีมใหม่ได้โดยไม่ซ้อนเนื้อหาเก่า
   */
  const { streamOpenRouterReading } = await import("@/lib/ai/openrouter");
  if (yield* streamOpenRouterReading(ctx)) return;

  if (!sawAnyResponse) {
    console.warn("ทุก Gemini Model ไม่ตอบสนอง ทำการสลับไปใช้ Local Reading Stream เพื่อไม่ให้ผู้ใช้ต้องรอนาน");
    yield* streamMockGeminiReading(ctx, "all_models_down");
    return;
  }

  /*
   * 🛟 ตอบแต่เขียนไม่จบทุกโมเดล ➔ คำอ่านสำรอง **เต็มฉบับ** (2026-09-24 · คำสั่งเจ้าของ "ทำให้ครบ")
   * ---------------------------------------------------------------------------
   * เดิม (INC-0155) ส่ง `error` ให้ผู้ใช้กดโหลดใหม่ เพราะของเก่าก่อนหน้านั้น "ประกอบคำอ่านจาก
   * ไพ่เท่าที่มาทันแล้วเติมช่องว่างด้วยข้อความสำเร็จรูป + หักสิทธิ์" ซึ่งผิดทั้งคู่
   * ตอนนี้ไม่ทำแบบนั้นแล้ว: ของที่เขียนมาครึ่งทางถูก `reset` ทิ้งไปแล้วตั้งแต่ในลูป (ไม่มีการเติม)
   * แล้วเสิร์ฟคำอ่านสำรองที่ประกอบจากไพ่ครบทุกใบจากสารานุกรม · usage = 0 ➔ route คืนสิทธิ์ให้
   * · หน้าเว็บขึ้น `FallbackNotice` พร้อมปุ่มให้แม่หมอ AI อ่านไพ่ชุดเดิมใหม่ — ผู้ใช้ได้อ่านเสมอ ไม่ใช่จอว่าง
   */
  recordEvent(`ai_incomplete_reading:${lastFailure ?? "unknown"}`);
  yield* streamMockGeminiReading(ctx, "incomplete_output");
}
