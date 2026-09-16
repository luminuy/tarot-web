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
  hasForeignScript,
  isSevereForeignLeak,
  SEVERE_FOREIGN_LEAK_THRESHOLD,
  sanitizeTarotText,
  stripForeignScript,
  stripThinkingTags,
} from "@/lib/ai/language";
import {
  consumeReadingDelta,
  createEmptyUsage,
  createReadingStreamState,
  finalizeReading,
  resolveForeignBreaker,
  resolveMaxReadingTokens,
} from "@/lib/ai/reading-stream";
import { aiGatewayHeaders, groqChatCompletionsEndpoint } from "@/lib/ai/gateway";
import { recordEvent } from "@/lib/stats/record";
import { buildReadingMessage, buildSystemPrompt, type ReadingContext } from "@/lib/ai/prompt";
import { linkAbortSignal } from "@/lib/ai/abort";
import { getContentOverrides, resolvePersona, resolveSystemCore } from "@/lib/content/overrides";
import type { ReadingEvent } from "@/lib/ai/types";

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

export const GROQ_DEFAULT_TIMEOUT_MS = 12000;

/**
 * เพดานโทเค็นผลลัพธ์ฝั่ง Groq
 *
 * ในทางปฏิบัติไม่เคยถูกใช้เลย เพราะเพดาน TPM 8,000 ที่นับ prompt รวมด้วย
 * บีบให้ผลลัพธ์เหลือราว 3,000 อยู่แล้ว — แต่ต้องมีไว้เป็นตัวเลขของ "เจ้านี้"
 * ห้ามให้ผู้ให้บริการรายอื่นมายืมเลขนี้ไปใช้ (เพดานเป็นของใครของมัน)
 */
export const GROQ_OUTPUT_CEILING = 7000;

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

/**
 * 🕰️ หน่วงก่อนลองโมเดลถัดไปเมื่อเจอ 429 (T-42)
 * ---------------------------------------------------------------------------
 * ของเดิมวนลองโมเดลถัดไป **ทันที** เมื่อได้สถานะที่ไม่ใช่ 200 โดยไม่อ่าน `Retry-After`
 * ไม่มีดีเลย ไม่มี jitter เจอ 429 (ซึ่งคอมเมนต์ในไฟล์นี้เองบันทึกว่าเกิดประจำ)
 * ก็กระหน่ำโมเดลถัดไปด้วย prompt ก้อนใหญ่ชุดเดิมทันที — ซึ่งเป็นพฤติกรรมที่ทำให้
 * โควตาของบัญชีถูกกดจนแย่ลงกว่าเดิม ไม่ใช่ดีขึ้น
 *
 * jitter จำเป็นเพราะ isolate หลายตัวชน 429 พร้อมกันได้ ถ้าหน่วงเท่ากันเป๊ะ
 * ทุกตัวจะกลับมายิงพร้อมกันอีกรอบ
 */
const GROQ_BACKOFF_BASE_MS = 400;
const GROQ_BACKOFF_MAX_MS = 4000;

function backoffDelayMs(attempt: number, retryAfterHeader: string | null): number {
  const retryAfterSec = Number(retryAfterHeader);
  if (Number.isFinite(retryAfterSec) && retryAfterSec > 0) {
    return Math.min(GROQ_BACKOFF_MAX_MS, Math.ceil(retryAfterSec * 1000));
  }
  const exponential = GROQ_BACKOFF_BASE_MS * 2 ** attempt;
  const jitter = Math.random() * GROQ_BACKOFF_BASE_MS;
  return Math.min(GROQ_BACKOFF_MAX_MS, exponential + jitter);
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      resolve();
    }, { once: true });
  });
}

export function getGroqApiKey(): string | undefined {
  return process.env.GROQ_API_KEY;
}

/**
 * เพดานแข็งของ `max_tokens` บนเส้นทางแชท (T-39)
 * ---------------------------------------------------------------------------
 * ของเดิมเชื่อค่าที่ผู้เรียกส่งมาแบบไม่มีขอบเขต โดยมีคอมเมนต์ระบุเจตนาว่า "ไม่กำหนดเพดาน
 * เพื่อให้ทดสอบและคุยยาวได้เต็มที่" — เจตนาดี แต่เมื่อรวมกับ T-38 (ประวัติป้อนกลับ
 * ไม่จำกัด) แปลว่าเซสชันเดียวลากค่าโทเคนได้ไม่จำกัดจริง ๆ
 *
 * ค่าเริ่มต้นยังเป็น 2,400 เท่าเดิม ผู้เรียกยังทับได้ **แต่ทับได้ไม่เกินเพดานนี้**
 */
const GROQ_CHAT_MAX_TOKENS_HARD_CAP = 4096;

/**
 * ยิงข้อความถาม-ตอบกับ Groq LPU รองรับการหมุนเวียน 4 โมเดลอัตโนมัติ
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

  for (const [attemptIndex, model] of WORKING_GROQ_MODELS.entries()) {
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
        // ผู้เรียกทับได้ด้วย options.maxTokens แต่ไม่เกินเพดานแข็งของไฟล์นี้ (T-39)
        max_tokens: Math.min(
          typeof options.maxTokens === "number" && options.maxTokens > 0 ? options.maxTokens : 2400,
          GROQ_CHAT_MAX_TOKENS_HARD_CAP,
        ),
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
        // 429 = โควตาเต็ม — ยิงโมเดลถัดไปทันทีคือการซ้ำเติม ไม่ใช่การกู้คืน (T-42)
        if (res.status === 429 || res.status >= 500) {
          recordEvent(`ai_groq_backoff:${res.status}`);
          await sleep(backoffDelayMs(attemptIndex, res.headers.get("retry-after")));
        }
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
          if (isSevereForeignLeak(sanitized)) {
            console.warn(
              `[Groq ${model}] ⚠️ Severe foreign leak (>= ${SEVERE_FOREIGN_LEAK_THRESHOLD} chars) — ตัดวงจร Groq สลับไป Gemini ทันที`,
            );
            recordEvent("ai_severe_foreign_leak");
            recordEvent(`ai_severe_foreign_leak:${model}`);
            break;
          }
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
 * - `max_tokens` ปรับตามจำนวนไพ่ (1,600 + 480/ใบ) กันคำอ่านโดนตัดกลาง
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
  const systemInstruction = buildSystemPrompt(ctx.personaId, {
    systemCore: ctx.lang === "en" ? undefined : systemCore,
    persona,
    lang: ctx.lang,
  });

  /*
   * 🔄 หมุนลำดับ Qwen สองตัวแบบ 50/50 — เพดาน TPM ของ Groq **แยกรายโมเดล**
   * ---------------------------------------------------------------------------
   * เดิมทุกคำขอเริ่มที่ `qwen3.8-27b` เสมอ แล้วค่อยไล่ลงเมื่อล้ม = failover ล้วน
   * ผลคือ qwen3.8 โดนถลุงโควตาต่อนาทีอยู่ตัวเดียว ส่วนตัวอื่นนั่งว่าง
   * พอทราฟฟิกมาพร้อมกันจึงโดน 429 ทั้งที่โควตารวมยังเหลือ
   *
   * หมุนเฉพาะ **ในกลุ่ม Qwen ที่ภาษาไทยดีเท่ากัน** จึงไม่ขัดกฎ "Qwen มาก่อน"
   * ที่ล็อกไว้ในคอมเมนต์ของ WORKING_GROQ_MODELS — ผู้ใช้ยังได้ Qwen เป็นตัวแรกเสมอ
   *
   * ใช้สุ่มแทนตัวนับ เพราะบน Cloudflare Workers แต่ละ isolate มีตัวนับของตัวเอง
   * ตัวนับจะเริ่มที่ 0 ทุก isolate = ไม่กระจายจริง
   *
   * ⚠️ ไม่กระทบ Provably Fair แม้แต่น้อย — ตรงนี้เลือกแค่ "ใครเป็นคนเขียนข้อความ"
   *    ไม่ได้แตะการสับไพ่หรือการเลือกไพ่ซึ่งอยู่คนละเส้นทางโดยสิ้นเชิง
   */
  const readingModels = (
    Math.random() < 0.5
      ? ["qwen/qwen3.8-27b", "qwen/qwen3.6-27b"]
      : ["qwen/qwen3.6-27b", "qwen/qwen3.8-27b"]
  ).concat([
    "openai/gpt-oss-120b",
    // เติม gpt-oss-20b ท้ายแถว — เดิมอยู่ใน WORKING_GROQ_MODELS (ใช้กับแชท)
    // แต่ไม่เคยถูกใช้กับคำอ่านเลย ทั้งที่มีโควตา TPM/RPD ของตัวเองเต็ม ๆ
    "openai/gpt-oss-20b",
  ]);

  /*
   * 📏 ประเมินโทเค็นก่อนยิง แล้วตัดของเสริมถ้าจะชนเพดาน TPM
   * ---------------------------------------------------------------------------
   * Groq ปฏิเสธทั้งคำขอด้วย 429 `Request too large ... (TPM): Limit 8000`
   * โดยนับ **prompt + max_tokens รวมกันต่อคำขอเดียว** ไม่ใช่งบสะสมต่อนาที
   * ➔ รอให้นานแค่ไหนก็ไม่ช่วย ต้องทำให้คำขอเล็กลงเท่านั้น
   *
   * วัดจริงจากเลขที่ Groq แจ้งกลับมาเอง (เคส 3 ใบ Requested 8,247 · max_tokens 3,040
   * ➔ prompt = 5,207 โทเค็น จากข้อความ 17,742 ตัวอักษร) ได้อัตรา ~3.41 ตัวอักษร/โทเค็น
   * สูตรนี้ทำนายเคส 3 ใบได้ตรงเป๊ะกับที่ Groq นับจริง
   *
   * ของที่ยอมตัดเป็นอย่างแรกคือ "ตัวอย่างคำอ่านมาตรฐาน" (B-02 · ~900 โทเค็น)
   * เพราะเป็นตัวช่วยด้านสไตล์ ไม่ใช่ข้อมูลไพ่ — ตัดแล้วคำอ่านยังถูกต้องครบถ้วน
   * ดีกว่าปล่อยให้โดน 429 แล้วตกไปโมเดลสำรองทั้งดุ้น
   */
  const CHARS_PER_TOKEN = 3.41;
  const GROQ_TPM_LIMIT = 8000;
  const estTokens = (text: string) => Math.ceil(text.length / CHARS_PER_TOKEN);

  // เพดานผลลัพธ์: ฐาน 1,600 + 480/ใบ (ผัง 10 ใบ ≈ 6,400) — รองรับ visualAnchor, positionLink, questionLink กันคำอ่านโดนตัดกลาง
  const maxReadingTokens = resolveMaxReadingTokens(ctx.drawn.length, GROQ_OUTPUT_CEILING);

  let userMessage = buildReadingMessage(ctx);
  if (estTokens(systemInstruction) + estTokens(userMessage) + maxReadingTokens > GROQ_TPM_LIMIT) {
    const trimmed = buildReadingMessage(ctx, { omitExemplar: true });
    const fitsNow =
      estTokens(systemInstruction) + estTokens(trimmed) + maxReadingTokens <= GROQ_TPM_LIMIT;
    userMessage = trimmed;
    // เก็บสถิติไว้ดูใน /admin ว่าต้องตัดบ่อยแค่ไหน และตัดแล้วยังไม่พอกี่ครั้ง
    recordEvent(fitsNow ? "ai_prompt_trimmed" : "ai_prompt_over_tpm");

    /*
     * 🚪 ตัดแล้วยังไม่พอ = ยิงไปก็โดน 429 ทุกโมเดลแน่นอน ให้ถอยทันที
     * ---------------------------------------------------------------------------
     * เพดาน TPM ของ Groq นับ prompt + max_tokens รวมกัน **ต่อคำขอเดียว**
     * (INC-0136) ➔ หมุนโมเดลหรือรอต่อคิวไม่ช่วยอะไรเลยแม้แต่นิดเดียว
     *
     * เดิมโค้ดตรงนี้แค่จดสถิติไว้แล้ว "ยิงต่อทั้งที่รู้ว่าไม่รอด" ครบทั้ง 4 โมเดล
     * ผู้ใช้ผังใหญ่จึงต้องนั่งรอคำขอที่ถูกปฏิเสธ 4 รอบก่อนได้เริ่มอ่านจริงจาก Gemini
     *
     * วัดจริงทุกผังแล้ว: 4 ใบเกิน 375 · 5 ใบเกิน 1,258 · 12 ใบเกิน 7,146
     * ➔ ตั้งแต่ 4 ใบขึ้นไปไม่มีทางผ่านเส้นทางนี้ ต้องให้ Gemini รับไปทั้งหมด
     */
    if (!fitsNow) {
      console.warn(
        `[Groq Reading] คำขอผัง ${ctx.drawn.length} ใบใหญ่เกินเพดาน TPM ${GROQ_TPM_LIMIT} แม้ตัดของเสริมแล้ว — ข้าม Groq ทั้งเจ้า`,
      );
      return;
    }
  }

  for (const [readingAttempt, model] of readingModels.entries()) {
    const state = createReadingStreamState();
    const usage = createEmptyUsage();
    let unlinkAbort: (() => void) | undefined;

    try {
      const controller = new AbortController();
      /*
       * ⏱️ เพดานเวลาต้องโตตามความยาวคำอ่าน — เดิมตรึงไว้ 20 วินาทีตายตัว
       * Groq LPU เดินราว 300 tok/s ➔ ผัง 10 ใบ (6,400 โทเค็น) ต้องใช้ ~21 วินาที
       * ตัวเลขตายตัวจึงตัดคำอ่านผังใหญ่ทิ้งกลางคันเสมอ ทั้งที่โมเดลยังเขียนอยู่
       * คิดจากอัตราจริงแล้วเผื่อเวลาเริ่มต้น 6 วินาที และกันไว้ไม่ให้เกิน 55 วินาที
       */
      const timeoutMs = Math.min(55000, 6000 + Math.ceil((maxReadingTokens / 300) * 1000));
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      // ผู้ใช้ปิดแท็บ → ยกเลิกคำขอที่ต้นทางทันที ไม่ใช่ปล่อยให้โมเดลผลิตจนจบแล้วทิ้ง (T-06)
      unlinkAbort = linkAbortSignal(controller, ctx.abortSignal);

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
        // หน่วงก่อนลองโมเดลถัดไปเมื่อโดนจำกัดโควตา/เซิร์ฟเวอร์ขัดข้อง (T-42)
        if (res.status === 429 || res.status >= 500) {
          recordEvent(`ai_groq_backoff:${res.status}`);
          await sleep(backoffDelayMs(readingAttempt, res.headers.get("retry-after")), ctx.abortSignal);
        }
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
            for (const event of consumeReadingDelta(state, delta, { provider: "groq", model })) {
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
        const outcome = resolveForeignBreaker(state, { provider: "groq", model });
        if (outcome.needsReset) {
          yield { type: "reset" };
        }
        if (outcome.abandonProvider) {
          break; // ข้ามโมเดล Groq ที่เหลือทั้งหมด สลับไป Gemini ทันที
        }
        continue; // ลองโมเดลถัดไปหรือตกไปหา Gemini
      }

      const finalized = finalizeReading(state, ctx, {
        provider: "groq",
        model,
        usage,
        promptChars: systemInstruction.length + userMessage.length,
      });

      if (finalized.ok) {
        yield finalized.event;
        return; // ทำงานสำเร็จสมบูรณ์!
      }
    } catch (err) {
      // ลูกค้าตัดการเชื่อมต่อ = ไม่ใช่ความล้มเหลวของโมเดล ห้ามไล่ลองโมเดลถัดไปให้เปลืองเงิน
      if (ctx.abortSignal?.aborted) {
        recordEvent("ai_client_aborted:groq");
        return;
      }
      console.warn(`[Groq Reading ${model}] stream error:`, err);
    } finally {
      unlinkAbort?.();
    }
  }

  // หากโมเดล Groq ทั้งหมดไม่สามารถตอบได้จบสมบูรณ์ จะหลุดออกจาก generator
  // เพื่อเปิดทางให้ route caller สลับไปใช้ Gemini ได้อย่างแนบเนียน
}
