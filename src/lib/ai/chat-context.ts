/**
 * ✦ บริบท "คำอ่านเดิม" ที่ส่งให้แม่หมอ AI ตอนถามต่อ (แชทหลังเปิดไพ่)
 * ---------------------------------------------------------------------------
 * ของเดิมใน `chat/route.ts` ส่งแค่ `summary` ของคำอ่านให้โมเดล:
 *   · โมเดลไม่เห็นว่าตัวเองเพิ่งอ่านไพ่แต่ละใบว่าอะไร ➔ ถามต่อเรื่องไพ่ใบที่ 2
 *     แล้วตอบคนละทางกับคำอ่านรายใบที่ผู้ใช้เพิ่งเห็นบนจอ
 *   · ไม่เห็นคำแนะนำ / กรอบเวลา / คำตอบฟันธงใช่-ไม่ใช่ที่ให้ไปแล้ว
 *   · ถ้ายังไม่มีคำอ่าน กลับใส่สรุปกุขึ้นเอง ("กำลังอยู่ในช่วงการเปลี่ยนแปลงที่ดี")
 *     ซึ่งไม่ได้มาจากไพ่เลย
 *
 * ⚠️ งบอักขระ: แชทวิ่งผ่าน Groq ซึ่งนับ prompt + max_tokens รวมกันต่อคำขอ (เพดาน 8,000 โทเค็น)
 *    บล็อกนี้จึงมีเพดานรวมตายตัว (`PRIOR_READING_CHAR_BUDGET`) แล้วหารเฉลี่ยให้ทุกใบ
 *    ผังใหญ่ได้ข้อความต่อใบสั้นลง แต่ **ทุกใบยังถูกพูดถึงครบ** ไม่ใช่ตัดใบท้าย ๆ ทิ้ง
 */
import type { Reading } from "@/lib/schema/reading";
import { sanitizePromptValue } from "@/lib/ai/prompt-guard";

type Lang = "th" | "en";

/** เพดานรวมของคำอ่านรายใบ (ไม่รวมคำแนะนำ/กรอบเวลา) ≈ 440 โทเค็นไทย */
export const PRIOR_READING_CHAR_BUDGET = 1500;
const PER_CARD_MIN = 90;
const PER_CARD_MAX = 420;
const ADVICE_MAX = 110;
const TIMING_MAX = 120;
const SUMMARY_MAX = 600;

const YES_NO_EN: Record<string, string> = { ใช่: "Yes", ไม่ใช่: "No", ยังไม่แน่: "Not yet certain" };

export interface PriorReadingInput {
  result?: Partial<Reading> | null;
  /** ชื่อตำแหน่งตามลำดับ position (index 0..N) — ใช้ชื่อช่องเดียวกับบรรทัดไพ่ใน prompt */
  positionNames: string[];
  lang: Lang;
}

/** ตัดให้สั้นลงโดยไม่ทิ้งคำครึ่งท่อน — ตัดที่ช่องว่าง/จุดล่าสุดก่อนเพดาน แล้วต่อด้วย … */
function clip(text: string, max: number): string {
  const clean = sanitizePromptValue(text, 4000).replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const head = clean.slice(0, max);
  const cut = Math.max(head.lastIndexOf(" "), head.lastIndexOf("."));
  return `${(cut > max * 0.6 ? head.slice(0, cut) : head).trim()}…`;
}

/**
 * ประกอบบล็อก "สิ่งที่แม่หมอบอกผู้ถามไปแล้ว" สำหรับ system prompt ของแชท
 * ไม่มีคำอ่าน ➔ คืนบรรทัดที่บอกโมเดลตรง ๆ ว่ายังไม่มี (ห้ามอ้างว่าเคยสรุปอะไรไว้)
 */
export function formatPriorReadingForChat({ result, positionNames, lang }: PriorReadingInput): string {
  const isEn = lang === "en";
  const cards = Array.isArray(result?.cards) ? [...result!.cards].sort((a, b) => a.position - b.position) : [];
  const summary = result?.summary ? clip(result.summary, SUMMARY_MAX) : "";

  if (!cards.length && !summary) {
    return isEn
      ? "• Previous Reading: Not available for this session. Answer from the drawn cards directly and never claim you said anything earlier."
      : "• คำอ่านฉบับเต็มของรอบนี้: ยังไม่มี — ตอบจากไพ่ที่เปิดได้โดยตรง ห้ามอ้างว่าเคยสรุปหรือทำนายอะไรไว้ก่อน";
  }

  const perCard = Math.max(
    PER_CARD_MIN,
    Math.min(PER_CARD_MAX, Math.floor(PRIOR_READING_CHAR_BUDGET / Math.max(1, cards.length))),
  );

  const cardLines = cards.map((c) => {
    const pos = positionNames[c.position] || (isEn ? `Position ${c.position + 1}` : `ตำแหน่งที่ ${c.position + 1}`);
    const headline = c.headline ? clip(c.headline, 60) : "";
    const body = c.reading ? clip(c.reading, perCard) : "";
    return `  - "${pos}": ${[headline, body].filter(Boolean).join(" — ")}`.replace(/:\s*$/, "");
  });

  const advice = (result?.advice ?? []).filter(Boolean).map((a) => `  - ${clip(a, ADVICE_MAX)}`);
  const timing = result?.timing ? clip(result.timing, TIMING_MAX) : "";
  const yesNo = result?.yesNoAnswer ? (isEn ? YES_NO_EN[result.yesNoAnswer] ?? result.yesNoAnswer : result.yesNoAnswer) : "";

  if (isEn) {
    return [
      "• What you already told the seeker in this reading (stay consistent — build on it, never contradict it unless the seeker shares new facts):",
      ...cardLines,
      yesNo && `  Yes/No verdict given: ${yesNo}`,
      summary && `  Summary: "${summary}"`,
      advice.length > 0 && "  Advice given:",
      ...advice,
      timing && `  Timing given: ${timing}`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    "• สิ่งที่คุณอ่านให้ผู้ถามไปแล้วในรอบนี้ (ตอบต่อยอดให้สอดคล้อง ห้ามขัดกับของเดิม เว้นแต่ผู้ถามให้ข้อมูลใหม่):",
    ...cardLines,
    yesNo && `  คำตอบฟันธงที่ให้ไว้: ${yesNo}`,
    summary && `  สรุปคำทำนายเดิม: "${summary}"`,
    advice.length > 0 && "  คำแนะนำที่ให้ไว้แล้ว:",
    ...advice,
    timing && `  กรอบเวลาที่บอกไว้: ${timing}`,
  ]
    .filter(Boolean)
    .join("\n");
}
