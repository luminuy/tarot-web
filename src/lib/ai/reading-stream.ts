/**
 * 🧩 เครื่องยนต์กลางของสตรีมคำอ่าน — ใช้ร่วมกันทุกผู้ให้บริการที่พูดภาษา OpenAI
 * ---------------------------------------------------------------------------
 * ทำไมต้องมีไฟล์นี้: เดิมตรรกะทั้งชุด (นับอักษรต่างด้าว → ตัดวงจร → parse บางส่วน →
 * ตรวจ schema → ตรวจความสอดคล้อง → ขัดภาษาไทย) ฝังอยู่ใน `groq.ts` ที่เดียว
 * ถูกยกออกมาตอนจะเพิ่มผู้ให้บริการรายที่สอง เพื่อไม่ให้ต้องก๊อปโค้ด 200 บรรทัดนี้
 * ไปไว้อีกไฟล์ (ซึ่งแปลว่าบั๊กทุกตัวในอนาคตต้องแก้สองที่ และถ้าลืมแก้ที่ใดที่หนึ่ง
 * จะไม่มีใครรู้เลย — ตรงกับที่ CLAUDE.md เรียกว่า "ทำผิดซ้ำ = บกพร่องร้ายแรงสุด")
 *
 * 📌 **สถานะปัจจุบัน: มีผู้เรียกเจ้าเดียวคือ `groq.ts`** — ผู้ให้บริการรายที่สองนั้น
 *    ถูกถอดออกไปแล้วเพราะใช้ฟรีไม่ได้จริง (ดู INC-0153) ที่ยังไม่ยุบกลับเข้า `groq.ts`
 *    เพราะการยุบกลับคือการรื้อเส้นทางคำอ่านหลักอีกรอบโดยผู้ใช้ไม่ได้อะไรเพิ่มเลย
 *    แลกกับความเสี่ยงล้วน ๆ ส่วนการแยกไว้แบบนี้อ่านง่ายกว่าและมีด่าน CI คุมอยู่แล้ว
 *
 * ⚠️ ไฟล์นี้ **ไม่รู้จักผู้ให้บริการรายไหนเลย** ห้ามใส่ชื่อเจ้าใดเจ้าหนึ่ง
 *    หรือรายละเอียด endpoint ลงมา — ส่งเข้ามาทาง `provider` / `model` เท่านั้น
 *
 * ⚠️ กฎเหล็กข้อ 14 (Zero Fabricated Cards): ที่นี่ไม่มีและห้ามมีโค้ดกุไพ่
 *    ถ้า JSON ไม่ผ่าน `ReadingSchema` จะคืน `ok: false` ให้ผู้เรียกไปลองโมเดลถัดไป
 *    **ห้ามเติมไพ่หรือเดาเนื้อหาที่หายไปเด็ดขาด**
 */

import {
  countForeignCharacters,
  FOREIGN_LEAK_SWITCH_THRESHOLD,
  isSevereForeignLeak,
  SEVERE_FOREIGN_LEAK_THRESHOLD,
  objectHasForeignScript,
  sanitizeTarotText,
  stripForeignScriptDeep,
  stripThinkingTags,
} from "@/lib/ai/language";
import { parsePartialReading } from "@/lib/utils/partial-json";
import { recordEvent } from "@/lib/stats/record";
import type { ReadingContext } from "@/lib/ai/prompt";
import { ReadingSchema } from "@/lib/schema/reading";
import type { ReadingEvent, UsageInfo } from "@/lib/ai/types";
import { checkReadingConsistency } from "@/lib/ai/consistency";
import { enforceThaiQuality } from "@/lib/ai/thai-quality";

/** สถานะสะสมของสตรีมหนึ่งเส้น (หนึ่งโมเดล หนึ่งรอบ) */
export interface ReadingStreamState {
  /** JSON ดิบที่ทยอยต่อกันมาจาก delta */
  jsonAccumulator: string;
  sentOpening: boolean;
  sentConnections: boolean;
  sentSummary: boolean;
  cardsSent: number;
  /** อักษรต่างด้าวสะสมใน content จริง (ไม่รวมส่วนความคิดของโมเดล) */
  totalForeignChars: number;
  /** true = เจออักษรต่างด้าวจนถึงเกณฑ์ ต้องหยุดอ่านสตรีมนี้แล้วสลับโมเดล */
  foreignCircuitBreaker: boolean;
}

export function createReadingStreamState(): ReadingStreamState {
  return {
    jsonAccumulator: "",
    sentOpening: false,
    sentConnections: false,
    sentSummary: false,
    cardsSent: 0,
    totalForeignChars: 0,
    foreignCircuitBreaker: false,
  };
}

export function createEmptyUsage(): UsageInfo {
  return { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 };
}

/**
 * ย่อยเนื้อความที่สตรีมมาหนึ่งชิ้น แล้วคืน "เหตุการณ์ที่ต้องส่งถึงผู้ใช้ทันที"
 *
 * ผู้เรียกต้องเช็ก `state.foreignCircuitBreaker` หลังเรียกทุกครั้ง —
 * ถ้าเป็น true ให้ยกเลิก reader แล้วเลื่อนไปโมเดลถัดไป
 */
export function consumeReadingDelta(
  state: ReadingStreamState,
  delta: string,
  meta: { provider: string; model: string },
): ReadingEvent[] {
  if (!delta) return [];

  // ── ด่านตรวจจับอักษรต่างด้าว (Circuit Breaker) ────────────────────────────
  const foreignCount = countForeignCharacters(delta);
  if (foreignCount > 0) {
    state.totalForeignChars += foreignCount;
    if (state.totalForeignChars >= FOREIGN_LEAK_SWITCH_THRESHOLD) {
      console.warn(
        `[${meta.provider} Reading ${meta.model}] ⚠️ Circuit Breaker: อักษรต่างด้าวสะสม ${state.totalForeignChars} ตัว — สลับโมเดล`,
      );
      recordEvent(`ai_foreign_trip:${meta.provider}`);
      recordEvent(`ai_foreign_trip:${meta.model}`);
      state.foreignCircuitBreaker = true;
      return [];
    }
  }

  state.jsonAccumulator += delta;
  const partial = parsePartialReading(state.jsonAccumulator);
  const events: ReadingEvent[] = [];

  if (!state.sentOpening && partial.opening) {
    state.sentOpening = true;
    events.push({ type: "opening", text: sanitizeTarotText(partial.opening) });
  }

  while (state.cardsSent < partial.cards.length) {
    const card = partial.cards[state.cardsSent];
    state.cardsSent++;
    events.push({
      type: "card",
      position: card.position,
      headline: sanitizeTarotText(card.headline),
      visualAnchor: (card as any).visualAnchor
        ? sanitizeTarotText((card as any).visualAnchor)
        : undefined,
      reading: sanitizeTarotText(card.reading),
    });
  }

  if (!state.sentConnections && partial.connections) {
    state.sentConnections = true;
    events.push({ type: "connections", text: sanitizeTarotText(partial.connections) });
  }

  if (!state.sentSummary && partial.summary) {
    state.sentSummary = true;
    events.push({ type: "summary", text: sanitizeTarotText(partial.summary) });
  }

  return events;
}

/** ผลของการตัดวงจรเพราะอักษรต่างด้าว */
export interface ForeignBreakerOutcome {
  /** ต้องส่ง reset ให้ผู้ใช้ก่อน (เพราะพ่นเนื้อหาไปแล้วบางส่วน) */
  needsReset: boolean;
  /** true = รั่วหนักมาก ให้ข้ามโมเดลที่เหลือของผู้ให้บริการนี้ทั้งหมด */
  abandonProvider: boolean;
}

export function resolveForeignBreaker(
  state: ReadingStreamState,
  meta: { provider: string; model: string },
): ForeignBreakerOutcome {
  const needsReset = state.sentOpening || state.cardsSent > 0;
  const severe =
    state.totalForeignChars >= SEVERE_FOREIGN_LEAK_THRESHOLD ||
    isSevereForeignLeak(state.jsonAccumulator);

  if (severe) {
    console.warn(
      `[${meta.provider} Reading ${meta.model}] ⚠️ Severe foreign leak (สะสม ${state.totalForeignChars} ตัว >= ${SEVERE_FOREIGN_LEAK_THRESHOLD}) — ตัดวงจรผู้ให้บริการนี้ทั้งเจ้า`,
    );
    recordEvent("ai_severe_foreign_leak");
    recordEvent(`ai_severe_foreign_leak:${meta.model}`);
  }

  return { needsReset, abandonProvider: severe };
}

export type FinalizeResult =
  | { ok: true; event: ReadingEvent }
  /** ไปต่อโมเดลถัดไปของผู้ให้บริการเดียวกัน */
  | { ok: false; retryNextModel: true };

/**
 * ปิดงานหนึ่งสตรีม: parse → ReadingSchema → ความสอดคล้อง → ขัดภาษาไทย → `done`
 *
 * คืน `ok: false` เมื่อยังไม่ผ่านด่านใดด่านหนึ่ง เพื่อให้ผู้เรียกเลื่อนไปโมเดลถัดไป
 * **ไม่มีทางคืนคำอ่านที่กุขึ้นเอง** (กฎเหล็กข้อ 14)
 */
export function finalizeReading(
  state: ReadingStreamState,
  ctx: ReadingContext,
  meta: { provider: string; model: string; usage: UsageInfo; promptChars: number },
): FinalizeResult {
  const cleanJson = stripThinkingTags(state.jsonAccumulator);

  let parsedJson: any = null;
  try {
    parsedJson = JSON.parse(cleanJson);
  } catch {
    // ปล่อยให้ตกไปทาง schema fail ด้านล่าง — ห้ามเดาเนื้อหาที่ขาด
  }

  const parsed = parsedJson ? ReadingSchema.safeParse(parsedJson) : null;
  if (!parsed || !parsed.success) {
    recordEvent(`ai_schema_fail:${meta.provider}`);
    recordEvent(`ai_schema_fail:${meta.model}`);
    console.warn(
      `[${meta.provider} Reading ${meta.model}] JSON ไม่ตรง ReadingSchema · parseLen=${cleanJson.length} · zodErr=${
        parsed ? JSON.stringify(parsed.error.issues?.slice(0, 3)) : "JSON.parse failed"
      }`,
    );
    return { ok: false, retryNextModel: true };
  }

  let readingData = parsed.data;
  if (!ctx.spread.yesNoMode) {
    readingData.yesNoAnswer = null;
  }

  // กวาดล้างอักษรต่างด้าวรอบสุดท้ายให้สะอาดหมดจด 100%
  if (objectHasForeignScript(readingData)) {
    readingData = stripForeignScriptDeep(readingData);
  }

  // 🛡️ ด่านตรวจความสอดคล้อง (AI_INTELLIGENCE_PLAN W1.3)
  const consistency = checkReadingConsistency(readingData, ctx.cards, {
    drawnCount: ctx.drawn.length,
    yesNoMode: ctx.spread.yesNoMode,
    pastReading: ctx.pastReading,
  });

  if (consistency.fatal) {
    const fatalIssue = consistency.issues.find((i) => i.fatal);
    console.warn(
      `[${meta.provider} Reading ${meta.model}] ⚠️ ความสอดคล้องล้มเหลว (Fatal): ${fatalIssue?.code} - ${fatalIssue?.message} — สลับโมเดลถัดไป`,
    );
    if (fatalIssue) {
      recordEvent(`ai_consistency_fail:${fatalIssue.code.toLowerCase()}`);
    }
    return { ok: false, retryNextModel: true };
  }

  // ✍️ ด่านภาษาไทย (HANDOFF_AI_ACCURACY_THAI B-01)
  // แก้คำผิดที่แก้ได้เงียบ ๆ แทนการ failover — failover แลกด้วยเวลาที่ผู้ใช้นั่งรออยู่จริง
  const thai = enforceThaiQuality(readingData, { personaId: ctx.personaId });
  readingData = thai.reading;
  if (thai.fixCount > 0) {
    recordEvent("ai_thai_fix");
    recordEvent(`ai_thai_fix:${meta.model}`);
  }
  for (const code of thai.issueCodes) {
    recordEvent(`ai_thai_issue:${code.toLowerCase()}`);
  }

  const usage = meta.usage;
  if (usage.inputTokens === 0) {
    usage.inputTokens = Math.round(meta.promptChars / 3.5);
    usage.outputTokens = Math.round(cleanJson.length / 3.5);
  }

  return {
    ok: true,
    event: {
      type: "done",
      reading: readingData,
      usage,
      model: meta.model,
      consistencyOk: consistency.ok,
      thaiScore: thai.score,
      thaiIssueCodes: thai.issueCodes,
      thaiFixCount: thai.fixCount,
    },
  };
}

/**
 * 📏 เพดานโทเค็นผลลัพธ์ต่อคำอ่านหนึ่งครั้ง
 * ---------------------------------------------------------------------------
 * ฐาน 1,600 + 480 ต่อไพ่หนึ่งใบ — รองรับ visualAnchor, positionLink, questionLink
 * โดยไม่ให้คำอ่านโดนตัดกลางประโยค
 *
 * `ceiling` คือเพดานของผู้ให้บริการรายนั้น **ต้องส่งเข้ามาเสมอ**
 * เดิมค่านี้ตรึงไว้ที่ 7,000 ตายตัวในโค้ดของ Groq ทำให้ผัง 12 ใบ (`year-ahead`)
 * ซึ่งต้องการ 7,360 ถูกหั่นทิ้ง 360 โทเค็น = ไพ่ใบสุดท้ายเขียนไม่จบทุกครั้ง
 * ผู้ให้บริการที่มีพื้นที่มากกว่าจึงต้องส่งเพดานของตัวเองเข้ามา ไม่ใช้เลขของเจ้าอื่น
 */
export function resolveMaxReadingTokens(cardCount: number, ceiling: number): number {
  return Math.min(ceiling, 1600 + cardCount * 480);
}
