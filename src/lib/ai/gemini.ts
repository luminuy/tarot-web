import "server-only";
import { parsePartialReading } from "@/lib/utils/partial-json";
import { buildReadingMessage, buildSystemPrompt, type ReadingContext } from "@/lib/ai/prompt";
import { getContentOverrides, resolvePersona, resolveSystemCore } from "@/lib/content/overrides";
import { type Reading, ReadingSchema } from "@/lib/schema/reading";
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
    yield* streamMockGeminiReading(ctx);
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
    });

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
  if (!sawAnyResponse) {
    console.warn("ทุก Gemini Model ไม่ตอบสนอง ทำการสลับไปใช้ Local Reading Stream เพื่อไม่ให้ผู้ใช้ต้องรอนาน");
    yield* streamMockGeminiReading(ctx);
    return;
  }

  recordEvent(`ai_incomplete_reading:${lastFailure ?? "unknown"}`);
  yield {
    type: "error",
    message:
      ctx.lang === "en"
        ? "The reading was cut off before every card was covered. Nothing was charged — please reload and draw again."
        : "คำอ่านขาดกลางคัน ยังเปิดไพ่ได้ไม่ครบทุกใบ ระบบไม่ได้หักสิทธิ์ของคุณ กรุณาโหลดใหม่อีกครั้งนะคะ",
  };
}

export async function* streamMockGeminiReading(ctx: ReadingContext): AsyncGenerator<ReadingEvent> {
  const nickname = ctx.nickname?.trim() || "ผู้แสวงหาคำตอบ";
  const question = ctx.question?.trim() || "ภาพรวมดวงชะตา";
  const category = (ctx.category || "general") as "general" | "work" | "money" | "love" | "self";

  // 1. Opening Greeting tailored by Persona
  let opening = "";
  if (ctx.personaId === "direct") {
    opening = `สวัสดีคุณ${nickname} ไพ่ทั้ง ${ctx.drawn.length} ใบสำหรับเรื่อง "${question}" วางเรียงออกมาตรงไปตรงมา ชัดเจนในทิศทางที่ต้องเลือก`;
  } else if (ctx.personaId === "mystic") {
    opening = `ยินดีต้อนรับสู่วิหารศักดิ์สิทธิ์ คุณ${nickname} สัมผัสแรกจากไพ่ทั้ง ${ctx.drawn.length} ใบปรากฏคลื่นพลังงานลี้ลับที่กำลังหมุนวนรอบคำถาม "${question}"`;
  } else {
    opening = `สวัสดีค่ะคุณ${nickname} แม่หมอเปิดไพ่ทั้ง ${ctx.drawn.length} ใบให้แล้วนะคะ สำหรับคำถาม "${question}" ไพ่ส่งมอบความกระจ่างและพลังบวกมาให้อย่างอบอุ่นค่ะ`;
  }
  yield { type: "opening", text: opening };
  await new Promise((r) => setTimeout(r, 40));

  // 2. Per-card Deep Interpretation from 78 Cards Encyclopedia
  const cardsResult = [];
  let majorCount = 0;
  const elementCounts: Record<string, number> = { ไฟ: 0, น้ำ: 0, ลม: 0, ดิน: 0 };

  for (let i = 0; i < ctx.drawn.length; i++) {
    const d = ctx.drawn[i];
    const card = ctx.cards[i];
    if (!card) continue;

    if (card.arcana === "major") majorCount++;
    if (card.element && elementCounts[card.element] !== undefined) {
      elementCounts[card.element]++;
    }

    const pos = ctx.spread.positions[d.order] || {
      nameTh: `ตำแหน่งที่ ${i + 1}`,
      meaning: "พลังงานในตำแหน่งนี้",
    };

    const orientation = d.isReversed ? "reversed" : "upright";
    const catMeaning = card.meanings?.[category]?.[orientation] || card.meanings?.general?.[orientation] || "";
    const keywords = card.keywords?.[orientation]?.slice(0, 3).join(", ") || "";

    const headline = `${card.nameTh}${d.isReversed ? " (กลับหัว)" : ""} ในตำแหน่ง${pos.nameTh}`;
    
    let reading = "";
    if (d.isReversed) {
      reading = `${card.nameTh} ในตำแหน่ง ${pos.nameTh} (${pos.meaning}) บ่งบอกถึงภาวะที่พลังงานอาจสะดุดหรือมีความลังเลภายใน คีย์สำคัญคือ "${keywords}" คำแนะนำคือ ${catMeaning}`;
    } else {
      reading = `${card.nameTh} ในตำแหน่ง ${pos.nameTh} (${pos.meaning}) เป็นสัญญาณเกื้อหนุนอย่างเด่นชัด คีย์สำคัญคือ "${keywords}" พลังงานบอกว่า ${catMeaning}`;
    }

    cardsResult.push({ position: d.order, headline, reading });
    yield { type: "card", position: d.order, headline, reading };
    await new Promise((r) => setTimeout(r, 35));
  }

  // 3. Card Connections Synthesis
  const dominantElement = Object.entries(elementCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "ดิน";
  let connections = "";
  if (majorCount >= Math.ceil(ctx.drawn.length / 2)) {
    connections = `ไพ่ชุดนี้มีไพ่ชุดใหญ่ (Major Arcana) ปรากฏขึ้นถึง ${majorCount} ใบ ชี้ว่าเรื่องนี้เป็นจุดเปลี่ยนสำคัญของชีวิตที่จักรวาลกำลังจัดสรร ไม่ใช่เรื่องบังเอิญเล็ก ๆ น้อย ๆ`;
  } else {
    connections = `พลังงานธาตุ${dominantElement}ปรากฏเด่นชัดในผังนี้ ส่งพลังเชื่อมโยงให้เห็นว่า ความพยายามและการลงมือทำทีละก้าวของคุณจะนำพาผลลัพธ์ที่จับต้องได้มาให้`;
  }
  yield { type: "connections", text: connections };
  await new Promise((r) => setTimeout(r, 30));

  // 4. Core Summary
  let summary = "";
  if (ctx.personaId === "direct") {
    summary = `สรุปสำหรับคำถาม "${question}": ความจริงปรากฏชัดเจนแล้ว อย่าปล่อยให้ความลังเลดึงเวลาไว้ จงตัดสินใจบนพื้นฐานของเหตุผลและความจริง`;
  } else if (ctx.personaId === "mystic") {
    summary = `สารจากดวงดาวและไพ่สำหรับ "${question}": ม่านหมอกกำลังสลายตัว จงเชื่อมั่นในญาณหยั่งรู้ของคุณ แล้วทางข้างหน้าจะปรากฏอย่างแจ่มชัด`;
  } else {
    summary = `แม่หมอขอสรุปให้คุณ${nickname}ว่า สำหรับ "${question}" ทุกอย่างมีทางออกที่ดีเสมอ ขอให้มั่นใจในคุณค่าของตัวเองและก้าวไปข้างหน้าอย่างอบอุ่นใจนะคะ`;
  }
  yield { type: "summary", text: summary };
  await new Promise((r) => setTimeout(r, 30));

  // 5. Actionable Advice
  const adviceList: string[] = [];
  if (dominantElement === "ไฟ") {
    adviceList.push("กล้าที่จะริเริ่มและลงมือทำทันทีที่มีโอกาส");
    adviceList.push("ระวังอารมณ์ใจร้อน ให้คิดอย่างรอบคอบก่อนเจรจา");
  } else if (dominantElement === "น้ำ") {
    adviceList.push("รับฟังความรู้สึกและสัญชาตญาณภายในของตนเอง");
    adviceList.push("ให้เวลาตัวเองได้ผ่อนคลายและเคลียร์จิตใจให้แจ่มใส");
  } else if (dominantElement === "ลม") {
    adviceList.push("รวบรวมข้อมูลและวิเคราะห์เหตุผลให้รอบด้าน");
    adviceList.push("สื่อสารอย่างตรงไปตรงมาและชัดเจนกับผู้เกี่ยวข้อง");
  } else {
    adviceList.push("จัดระเบียบแผนงานและการเงินให้มั่นคงเป็นขั้นตอน");
    adviceList.push("อดทนและสร้างรากฐานที่แข็งแรงทีละก้าว");
  }

  const finalReading: Reading = {
    opening,
    cards: cardsResult,
    connections,
    summary,
    advice: adviceList,
    timing: dominantElement === "ไฟ" ? "ภายใน 1-2 สัปดาห์นี้" : dominantElement === "น้ำ" ? "ภายใน 1 เดือนนี้" : dominantElement === "ลม" ? "เร็ว ๆ นี้ภายในไม่กี่วัน" : "ภายใน 1-3 เดือนนี้",
    mood: majorCount > 1 ? "ท้าทาย" : "อบอุ่น",
    yesNoAnswer: null,
  };

  yield { type: "done", reading: finalReading, usage: DEFAULT_USAGE, model: "mock-gemini", consistencyOk: true };
}
