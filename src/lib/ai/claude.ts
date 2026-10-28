/**
 * 🟠 Claude (Anthropic) — ทัพหน้าของคำอ่านไพ่ เมื่อมี ANTHROPIC_API_KEY
 * ---------------------------------------------------------------------------
 * เจ้าของสั่ง 2026-10-28: "อ่านไพ่ 1-3 ใบใช้ Haiku ตั้งแต่ 4 ใบใช้ Sonnet เพราะต้องวิเคราะห์เยอะ"
 * - 1–3 ใบ ➔ `claude-haiku-5-5` · 4 ใบขึ้นไป ➔ `claude-sonnet-5-5` (ดู `claudeReadingModel()`)
 * - ไม่มีคีย์ = ไม่ยิงอะไรเลย ผู้เรียกไปต่อ Groq ➔ Gemini ตามเดิมทุกอย่าง
 * - ล้มด้วยเหตุใดก็ตาม (เครดิตหมด · 429 · 5xx · JSON ไม่ผ่าน · ปฏิเสธ) ➔ return เงียบ ๆ ให้สายสำรองรับต่อ
 *
 * ทำไมยิงด้วย fetch ตรง ไม่ใช้ `@anthropic-ai/sdk`:
 *   ผู้ให้บริการทุกเจ้าในโฟลเดอร์นี้ยิงด้วย fetch ผ่าน `gateway.ts` (Cloudflare AI Gateway) เหมือนกันหมด
 *   และ SDK ถูกถอดออกจาก package.json แล้วเพราะไม่มีใครใช้ (ดู `types.ts`) ไม่อยากเพิ่ม dependency
 *   เข้าบันเดิล Worker เพื่อคำขอเดียว
 *
 * ⚙️ คำขอ:
 * - `anthropic-version: 2026-10-21` (รุ่นนี้ห้ามส่ง temperature/top_p/top_k — ไม่ส่ง)
 * - ปิดโหมดคิด: Haiku `{type:"disabled"}` · Sonnet `{type:"between_tools"}` (Sonnet 5.5 ไม่รับ disabled)
 *   คำอ่านสตรีมให้ผู้ใช้เห็นทันที ถ้าเปิดโหมดคิด ผู้ใช้จะนั่งดูจอนิ่งระหว่างโมเดลคิด + จ่ายค่าโทเคนความคิดเพิ่ม
 * - system prompt ติด `cache_control` — prompt ของแม่หมอแต่ละคนเหมือนเดิมทุกครั้ง อ่านซ้ำจากแคชถูกกว่า 10 เท่า
 * - ไม่ใช้ structured outputs: prompt บังคับ JSON อยู่แล้ว (`prompt.ts` หัวข้อรูปแบบผลลัพธ์)
 *   กันกรณีโมเดลห่อด้วย ``` ไว้ที่ `extractJsonObject()` ก่อนส่งเข้า `finalizeReading()`
 *
 * ⚠️ กฎเหล็กข้อ 14: ไม่มีโค้ดกุไพ่ — JSON ไม่ผ่าน `ReadingSchema` = return ให้สายสำรองอ่านใหม่ทั้งหมด
 *
 * 🗺️ เส้นที่ใช้ Claude เป็นตัวแรก (เจ้าของสั่ง 2026-10-28: "เลือกโมเดลตามความเหมาะสม แต่ใช้ Claude เป็นหลัก")
 * | เส้น | รุ่น | เหตุผล |
 * | `/read` คำอ่านไพ่ · `/perspective` อ่านอีกมุม | 1-3 ใบ Haiku · 4 ใบขึ้นไป Sonnet | `claudeReadingModel()` |
 * | `/chat` คุยต่อหลังเปิดไพ่ | ตามจำนวนไพ่แบบเดียวกัน · effort `low` | ผังใหญ่ต้องโยงไพ่หลายใบ · แชทไม่ต้องคิดลึก |
 * | `/natal/chat` ถามแม่หมอเรื่องผังดวง | Sonnet · effort `medium` | ต้องไล่ดาว/มุม/เรือนให้ครบ |
 * | `/natal/overview` ปุ่มภาพรวมผัง (ฟรีทุกคน) | Haiku · effort `low` | โค้ดคำนวณและจัดลำดับแล้ว โมเดลแค่เรียบเรียง |
 * | `/natal/report` ภาพรวมในรายงานเสียเงิน | Sonnet · effort `medium` | ของที่ผู้ใช้จ่ายเงิน |
 * | `/journal/reflect` · `/journal/monthly-summary` | Sonnet · effort `low` | เรียบเรียงจากข้อเท็จจริงหลายรายการ · เรียกไม่บ่อย + มีแคช |
 * ที่ไม่ใช้ Claude โดยตั้งใจ:
 * - `/reading/clarify` ถามกลับก่อนสับไพ่ ➔ Groq — หน้าเว็บตัดที่ 2.5 วินาที ต้องเร็วที่สุด
 * - Reader Studio ร่างคำอ่าน ➔ Gemini — ร่าง DPA (`docs/legal/READER_STUDIO_DPA_DRAFT.md`) ระบุ Gemini เป็นผู้ประมวลผลช่วงรายเดียว
 */

import {
  consumeReadingDelta,
  createEmptyUsage,
  createReadingStreamState,
  finalizeReading,
  resolveForeignBreaker,
  resolveMaxReadingTokens,
} from "@/lib/ai/reading-stream";
import { aiGatewayHeaders, anthropicMessagesEndpoint } from "@/lib/ai/gateway";
import { recordEvent } from "@/lib/stats/record";
import { buildReadingMessage, buildSystemPrompt, type ReadingContext } from "@/lib/ai/prompt";
import { linkAbortSignal, readWithIdleTimeout } from "@/lib/ai/abort";
import { getContentOverrides, resolvePersona, resolveSystemCore } from "@/lib/content/overrides";
import type { ReadingEvent } from "@/lib/ai/types";
import { clampToBudget } from "@/lib/ai/retry-budget";

export const CLAUDE_API_VERSION = "2026-10-21";
export const CLAUDE_HAIKU_MODEL = "claude-haiku-5-5";
export const CLAUDE_SONNET_MODEL = "claude-sonnet-5-5";
/** ไพ่ตั้งแต่กี่ใบขึ้นไปใช้ Sonnet (เจ้าของสั่ง: 4 ใบขึ้นไป) */
export const CLAUDE_SONNET_FROM_CARDS = 4;
/** เพดานผลลัพธ์ของเรา (ผัง 12 ใบต้องการ 7,360) — ทั้งสองรุ่นรับได้ถึง 128K อยู่แล้ว */
const CLAUDE_OUTPUT_CEILING = 16000;
/** รอ headers ได้นานสุด — หลังได้ headers แล้วใช้เพดานเวลาระหว่างก้อนของ `readWithIdleTimeout` แทน */
const CLAUDE_HEADERS_TIMEOUT_MS = 15000;

/** เลือกรุ่นตามจำนวนไพ่ที่เปิด */
export function claudeReadingModel(cardCount: number): string {
  return cardCount >= CLAUDE_SONNET_FROM_CARDS ? CLAUDE_SONNET_MODEL : CLAUDE_HAIKU_MODEL;
}

/** ปิดโหมดคิดให้ตรงรุ่น — Sonnet 5.5 คืน 400 ถ้าส่ง `disabled` */
export function claudeThinkingOff(model: string): { type: "disabled" } | { type: "between_tools" } {
  return model === CLAUDE_SONNET_MODEL ? { type: "between_tools" } : { type: "disabled" };
}

export function getClaudeApiKey(): string | undefined {
  return process.env.ANTHROPIC_API_KEY?.trim() || undefined;
}

/**
 * พักเรียก Claude ชั่วคราวในหน่วยประมวลผลนี้ เมื่อรู้แน่ว่ายิงไปก็ไม่รอด
 * (เครดิตหมด / คีย์ผิด = 400·401·403 · โดนจำกัดอัตรา = 429)
 * ไม่งั้นทุกคำอ่านต้องเสียเวลายิงคำขอที่ล้มแน่ ๆ หนึ่งรอบก่อนไป Groq/Gemini
 */
let pausedUntil = 0;
const PAUSE_ON_ACCOUNT_ERROR_MS = 10 * 60 * 1000;
const PAUSE_ON_RATE_LIMIT_DEFAULT_MS = 60 * 1000;

export function isClaudePaused(now = Date.now()): boolean {
  return now < pausedUntil;
}

export function pauseClaudeAfterStatus(status: number, retryAfter: string | null, now = Date.now()): void {
  if (status === 429) {
    const sec = Number(retryAfter);
    pausedUntil = now + (Number.isFinite(sec) && sec > 0 ? Math.min(sec * 1000, PAUSE_ON_ACCOUNT_ERROR_MS) : PAUSE_ON_RATE_LIMIT_DEFAULT_MS);
  } else if (status === 400 || status === 401 || status === 403) {
    pausedUntil = now + PAUSE_ON_ACCOUNT_ERROR_MS;
  }
}

/**
 * ตัด code fence / ข้อความนำหน้า-ท้ายที่โมเดลอาจห่อมา ให้เหลือ JSON วัตถุเดียว
 * ไม่ซ่อมเนื้อหาข้างใน — JSON เสียก็ปล่อยให้ `finalizeReading()` ปฏิเสธตามเดิม
 */
export function extractJsonObject(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return start >= 0 && end > start ? text.slice(start, end + 1) : text;
}

export async function* streamClaudeReading(ctx: ReadingContext): AsyncGenerator<ReadingEvent> {
  const apiKey = getClaudeApiKey();
  if (!apiKey) return;
  if (isClaudePaused()) {
    recordEvent("ai_claude_paused_skip");
    return;
  }
  if (ctx.retryBudget && !ctx.retryBudget.take()) return;

  const overrides = await getContentOverrides();
  const persona = resolvePersona(overrides, ctx.personaId);
  const systemCore = resolveSystemCore(overrides);
  const systemInstruction = buildSystemPrompt(ctx.personaId, {
    systemCore: ctx.lang === "en" ? undefined : systemCore,
    persona,
    lang: ctx.lang,
  });
  const userMessage = buildReadingMessage(ctx);
  if (ctx.usageMeter) ctx.usageMeter.promptChars = systemInstruction.length + userMessage.length;

  const model = claudeReadingModel(ctx.drawn.length);
  const maxTokens = resolveMaxReadingTokens(ctx.drawn.length, CLAUDE_OUTPUT_CEILING);
  const state = createReadingStreamState();
  const usage = createEmptyUsage();
  let stopReason: string | null = null;
  let unlinkAbort: (() => void) | undefined;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), clampToBudget(CLAUDE_HEADERS_TIMEOUT_MS, ctx.retryBudget));
    unlinkAbort = linkAbortSignal(controller, ctx.abortSignal);

    const res = await fetch(anthropicMessagesEndpoint(), {
      method: "POST",
      signal: controller.signal,
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": CLAUDE_API_VERSION,
        "content-type": "application/json",
        ...aiGatewayHeaders({ cacheTtl: 0 }),
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        stream: true,
        thinking: claudeThinkingOff(model),
        system: [{ type: "text", text: systemInstruction, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: userMessage }],
      }),
    });
    clearTimeout(timeoutId);

    if (!res.ok || !res.body) {
      const errText = await res.text().catch(() => "");
      console.warn(`[Claude Reading ${model}] status ${res.status}: ${errText.slice(0, 200)}`);
      recordEvent(`ai_claude_http:${res.status}`);
      pauseClaudeAfterStatus(res.status, res.headers.get("retry-after"));
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let streamError = false;

    while (true) {
      const { value, done } = await readWithIdleTimeout(reader, { signal: ctx.abortSignal });
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const jsonStr = line.slice(5).trim();
        if (!jsonStr) continue;
        let evt: any;
        try {
          evt = JSON.parse(jsonStr);
        } catch {
          continue;
        }
        if (evt.type === "message_start") {
          const u = evt.message?.usage ?? {};
          usage.inputTokens = u.input_tokens ?? 0;
          usage.cacheReadTokens = u.cache_read_input_tokens ?? 0;
          usage.cacheWriteTokens = u.cache_creation_input_tokens ?? 0;
        } else if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
          for (const event of consumeReadingDelta(state, evt.delta.text ?? "", { provider: "claude", model })) {
            yield event;
          }
          if (state.foreignCircuitBreaker) break;
        } else if (evt.type === "message_delta") {
          stopReason = evt.delta?.stop_reason ?? stopReason;
          if (typeof evt.usage?.output_tokens === "number") usage.outputTokens = evt.usage.output_tokens;
        } else if (evt.type === "error") {
          console.warn(`[Claude Reading ${model}] stream error event: ${String(evt.error?.type ?? "")}`);
          recordEvent(`ai_claude_stream_error:${String(evt.error?.type ?? "unknown")}`);
          streamError = true;
          break;
        }
      }

      if (state.foreignCircuitBreaker || streamError) {
        await reader.cancel().catch(() => undefined);
        break;
      }
    }

    if (state.foreignCircuitBreaker) {
      const outcome = resolveForeignBreaker(state, { provider: "claude", model });
      if (outcome.needsReset) yield { type: "reset" };
      return;
    }
    if (stopReason === "refusal") recordEvent("ai_claude_refusal");
    // ล้มกลางสตรีม/ถูกปฏิเสธ = return เฉย ๆ · ผู้เรียก (read/route) ส่ง reset เองถ้าพ่นเนื้อหาไปแล้ว
    if (streamError || stopReason === "refusal") return;
    if (stopReason === "max_tokens") recordEvent(`ai_claude_max_tokens:${model}`);

    // ค่าโทเคนที่ Claude คิดเงินจริง = input (ไม่ได้แคช) + อ่านจากแคช + เขียนแคช · ระบบเราเก็บรวมเป็น inputTokens
    const billedInput = usage.inputTokens + usage.cacheReadTokens + usage.cacheWriteTokens;
    state.jsonAccumulator = extractJsonObject(state.jsonAccumulator);
    const finalized = finalizeReading(state, ctx, {
      provider: "claude",
      model,
      usage: { ...usage, inputTokens: billedInput },
      promptChars: systemInstruction.length + userMessage.length,
    });
    // JSON ไม่ผ่าน = return ให้สายสำรองอ่านใหม่ทั้งหมด (ห้ามต่อเติมคำอ่านที่ขาด)
    if (finalized.ok) yield finalized.event;
  } catch (err) {
    if (ctx.abortSignal?.aborted) {
      recordEvent("ai_client_aborted:claude");
      return;
    }
    console.warn(`[Claude Reading ${model}] error:`, err);
    recordEvent("ai_claude_error");
  } finally {
    unlinkAbort?.();
  }
}

/**
 * 💬 คำตอบแบบไม่สตรีม (ผังดวง `/api/natal/chat` · แชทหลังเปิดไพ่ · JSON ของสมุดดวงผ่าน `generateAiJson`)
 * ---------------------------------------------------------------------------
 * เจ้าของสั่ง 2026-10-28: หน้าผังดวงใช้ Sonnet "เพราะต้องการความแม่นยำ ละเอียด"
 * - เปิดโหมดคิดแบบ adaptive (ระดับ `medium`) — คำตอบไม่ได้สตรีมทีละคำ ผู้ใช้รอคำตอบทั้งก้อนอยู่แล้ว
 *   แลกเวลาอีกไม่กี่วินาทีกับการไล่ดูตำแหน่งดาว/มุม/เรือนให้ครบก่อนตอบ
 * - `max_tokens` ต้องเผื่อโทเคนความคิด (ความคิดนับรวมในงบผลลัพธ์)
 * - คืน null เมื่อไม่มีคีย์ · พักอยู่ · ล้ม · ถูกปฏิเสธ · โดนตัดที่ max_tokens ➔ ผู้เรียกไปต่อ Groq/Gemini
 * - อ่านเฉพาะบล็อก `text` (บล็อก thinking ว่างเปล่าโดยค่าเริ่มต้นอยู่แล้ว ไม่ส่งถึงผู้ใช้)
 */
export async function generateClaudeReply(opts: {
  model: string;
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  maxTokens: number;
  timeoutMs: number;
  effort?: "low" | "medium" | "high";
  /** ส่งต่อให้ AI Gateway (`aiGatewayHeaders`) — ค่าเริ่มต้น: ห้ามแคช · เก็บ log ตามปกติ */
  cacheTtl?: number;
  collectLog?: boolean;
}): Promise<{ reply: string; model: string; usage: { inputTokens: number; outputTokens: number } } | null> {
  const apiKey = getClaudeApiKey();
  if (!apiKey) return null;
  if (isClaudePaused()) {
    recordEvent("ai_claude_paused_skip");
    return null;
  }
  // ข้อความแรกต้องเป็นของผู้ใช้ · ข้อความติดกันบทบาทเดียวกัน API รวมให้เอง
  const messages = [...opts.messages];
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs);
  try {
    const res = await fetch(anthropicMessagesEndpoint(), {
      method: "POST",
      signal: controller.signal,
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": CLAUDE_API_VERSION,
        "content-type": "application/json",
        ...aiGatewayHeaders({ cacheTtl: opts.cacheTtl ?? 0, collectLog: opts.collectLog }),
      },
      body: JSON.stringify({
        model: opts.model,
        max_tokens: opts.maxTokens,
        thinking: { type: "adaptive" },
        output_config: { effort: opts.effort ?? "medium" },
        system: [{ type: "text", text: opts.system, cache_control: { type: "ephemeral" } }],
        messages,
      }),
    });
    if (!res.ok) {
      recordEvent(`ai_claude_http:${res.status}`);
      pauseClaudeAfterStatus(res.status, res.headers.get("retry-after"));
      return null;
    }
    const data = (await res.json()) as {
      stop_reason?: string;
      content?: Array<{ type: string; text?: string }>;
      usage?: { input_tokens?: number; output_tokens?: number; cache_read_input_tokens?: number; cache_creation_input_tokens?: number };
    };
    if (data.stop_reason === "refusal") {
      recordEvent("ai_claude_refusal");
      return null;
    }
    if (data.stop_reason === "max_tokens") {
      // คำตอบขาดกลางประโยค ห้ามส่งให้ผู้ใช้ — ให้ตัวสำรองตอบใหม่ทั้งหมด
      recordEvent(`ai_claude_max_tokens:${opts.model}`);
      return null;
    }
    const reply = (data.content ?? [])
      .filter((b) => b.type === "text" && typeof b.text === "string")
      .map((b) => b.text)
      .join("")
      .trim();
    if (!reply) return null;
    const u = data.usage ?? {};
    return {
      reply,
      model: opts.model,
      usage: {
        inputTokens: (u.input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0),
        outputTokens: u.output_tokens ?? 0,
      },
    };
  } catch (err) {
    console.warn(`[Claude Reply ${opts.model}] error:`, err instanceof Error ? err.name : "unknown");
    recordEvent("ai_claude_error");
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export interface ClaudeProbeResult {
  model: string;
  ok: boolean;
  status: number | null;
  elapsedMs: number;
  answerPreview: string;
  error: string | null;
}

/**
 * 🩺 ตรวจสุขภาพ Claude สำหรับแท็บ "สุขภาพ AI" ใน /admin — ยิงจริง 1 ครั้งต่อรุ่น ด้วยคำถามสั้นที่สุด (ค่าใช้จ่ายไม่ถึงเซ็นต์)
 * - ยิงผ่าน endpoint เดียวกับคำอ่านจริง (AI Gateway ถ้าเปิด) จึงจับปัญหา gateway ได้ด้วย
 * - ไม่สนโหมดพัก (`isClaudePaused`) — แอดมินกดตรวจเพื่อดูสถานะจริง ณ ตอนนี้
 * - ข้อความ error ตัดค่าคีย์ออกก่อนคืนเสมอ · 400 "credit balance" = เครดิตหมด · 401 = คีย์ผิด · 429 = ติดเพดาน
 */
export async function probeClaudeHealth(apiKey: string, models: readonly string[] = [CLAUDE_HAIKU_MODEL, CLAUDE_SONNET_MODEL]): Promise<ClaudeProbeResult[]> {
  const scrub = (s: string) => s.split(apiKey).join("***").slice(0, 400);
  const out: ClaudeProbeResult[] = [];
  for (const model of models) {
    const startedAt = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch(anthropicMessagesEndpoint(), {
        method: "POST",
        signal: controller.signal,
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": CLAUDE_API_VERSION,
          "content-type": "application/json",
          ...aiGatewayHeaders({ cacheTtl: 0 }),
        },
        body: JSON.stringify({
          model,
          max_tokens: 32,
          thinking: claudeThinkingOff(model),
          messages: [{ role: "user", content: "ตอบกลับคำเดียวว่า: พร้อม" }],
        }),
      });
      const elapsedMs = Date.now() - startedAt;
      if (!res.ok) {
        out.push({ model, ok: false, status: res.status, elapsedMs, answerPreview: "", error: scrub(await res.text().catch(() => "")) });
        continue;
      }
      const data = (await res.json()) as { stop_reason?: string; content?: Array<{ type: string; text?: string }> };
      const answer = (data.content ?? [])
        .filter((b) => b.type === "text" && typeof b.text === "string")
        .map((b) => b.text)
        .join("")
        .trim();
      out.push({ model, ok: !!answer, status: 200, elapsedMs, answerPreview: answer.slice(0, 120), error: answer ? null : `ตอบ 200 แต่ไม่มีข้อความ (stop_reason ${data.stop_reason ?? "-"})` });
    } catch (err) {
      out.push({ model, ok: false, status: null, elapsedMs: Date.now() - startedAt, answerPreview: "", error: scrub(err instanceof Error ? `${err.name}: ${err.message}` : String(err)) });
    } finally {
      clearTimeout(timer);
    }
  }
  return out;
}
