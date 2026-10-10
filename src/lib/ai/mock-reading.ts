/**
 * คำอ่านสำรองออฟไลน์ (Mock Reading)
 * ---------------------------------------------------------------------------
 * ใช้เมื่อผู้ให้บริการ AI ทุกเจ้าใช้ไม่ได้จริง ๆ — ไม่มีคีย์ หรือทุกโมเดลไม่ตอบเลย
 * คำอ่านทุกบรรทัดประกอบจาก **ข้อมูลจริง** ของไพ่ที่จั่วได้ (สารานุกรม 78 ใบ + ตำแหน่งในผัง)
 * ไม่มีการกุไพ่หรือเดาความหมายขึ้นเอง (กฎเหล็กข้อ 14) และ usage = 0 เสมอ
 * ระบบจึงถือว่า "ไม่ใช่คำอ่านจริง" แล้วไม่หักสิทธิ์ผู้ใช้
 *
 * ⚠️ แยกไฟล์ออกจาก `gemini.ts` เพื่อให้ด่าน QA import มาทดสอบพฤติกรรมได้จริง
 * (`gemini.ts` มี `import "server-only"` จึงเรียกจากสคริปต์ทดสอบไม่ได้เลย
 *  ของเดิมจึงไม่เคยมีด่านไหนตรวจคำอ่านสำรองแม้แต่ด่านเดียว)
 */
import type { ReadingContext } from "@/lib/ai/prompt";
import { tallyYesNo, type YesNoVerdictTh } from "@/data/cards/yes-no";
import type { Reading } from "@/lib/schema/reading";
import type { ReadingEvent, UsageInfo } from "@/lib/ai/types";
import { getPositionMeaning, getPositionName } from "@/data/spreads-helpers";
import { recordEvents } from "@/lib/stats/record";
import { generateMindfulMicroRitual } from "@/lib/ai/ritual";
import type { TarotCard } from "@/data/cards/types";
import { redactPii } from "@/lib/security/pii";
import { reviewedCardAdvice } from "@/data/cards/card-advice";

// คำอ่านสำรองไม่ได้เรียกโมเดลจริง จึงไม่มีโทเค็นให้นับ — ศูนย์ทั้งชุดคือความจริง ไม่ใช่ค่าตั้งต้น
const DEFAULT_USAGE: UsageInfo = {
  inputTokens: 0,
  outputTokens: 0,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
};

/**
 * เหตุผลที่ต้องเสิร์ฟคำอ่านสำรอง — จดสถิติแยกกัน เพราะความหมายต่างกันคนละเรื่อง
 * `no_api_key` = ตั้งค่าผิด/ลืมใส่คีย์ (ต้องรีบแก้) · `all_models_down` = ปลายทางล่มชั่วคราว
 * `incomplete_output` = โมเดลตอบแต่เขียนไม่จบทุกตัว (โดนตัด/JSON ไม่ครบ) — ทิ้งของที่ขาดทั้งหมดแล้วใช้คำอ่านสำรองเต็มฉบับ
 */
export type MockReason = "no_api_key" | "all_models_down" | "incomplete_output";



/*
 * ✦ ยกเครื่องคำอ่านสำรอง (2026-09-23) — คำสั่งเจ้าของ "ต้องทำให้ดีที่สุดก่อนหา AI มาเพิ่ม"
 * ---------------------------------------------------------------------------
 * วันที่ AI ล่ม ผู้ใช้หลายสิบคนได้คำอ่านจากไฟล์นี้ (แผงแอดมิน 2026-09-23: 21 ครั้ง/วัน)
 * ของเดิมมีจุดอ่อน 3 ข้อที่แก้ในรอบนี้:
 *   1. ไพ่หัวตั้งทุกใบถูกเขียนว่า "สัญญาณเกื้อหนุนอย่างเด่นชัด" (สิบแห่งดาบก็เช่นกัน)
 *      ➔ ตอนนี้ดูขั้วของไพ่จากช่อง `yesNo` ในสารานุกรม (กลับหัวสลับขั้ว) แล้วเลือกน้ำเสียงให้ตรง
 *   2. บทเปิด/บทสรุปเป็นประโยคเหมารวม ("ทุกอย่างมีทางออกที่ดีเสมอ") ไม่อิงไพ่เลย
 *      ➔ ตอนนี้นับขั้วทั้งผัง อ่านเส้นทางจากใบแรกถึงใบสุดท้าย และชี้ไพ่ปลายทาง/จุดที่ต้องดูแล
 *   3. ประโยคห่อแข็งแบบแม่แบบ ("คีย์สำคัญคือ ... พลังงานบอกว่า ...") ซ้ำทุกใบ
 *      ➔ มีหลายสำนวนต่อขั้ว เลือกแบบกำหนดได้ (ไม่สุ่ม — ไพ่ชุดเดิมได้คำอ่านเดิมเสมอ)
 * เนื้อความหลักของแต่ละใบยังมาจากสารานุกรม 78 ใบ ไม่แต่งความหมายไพ่ขึ้นเอง (กฎเหล็กข้อ 14)
 */

type Lang = "th" | "en";
/** ขั้วของไพ่ในตำแหน่งที่ออก: หนุน · ต้องระวัง · ยังไม่ชี้ขาด */
export type MockTone = "light" | "shadow" | "open";

/**
 * ขั้วของไพ่ใบหนึ่งสำหรับเลือก "น้ำเสียงของประโยคห่อ" (ไม่ได้ใช้ฟันธง ใช่/ไม่ใช่)
 * ---------------------------------------------------------------------------
 * หัวตั้ง: ตามช่อง `yesNo` ของสารานุกรมตรง ๆ
 * กลับหัว: ⚠️ **ห้ามสลับขั้วตรง ๆ** — ลองแล้วได้ "หอคอย (กลับหัว) เป็นใบที่เปิดทางให้คุณ"
 *   ทั้งที่ความหมายในสารานุกรมคือ "ยื้อไว้ เลี่ยงความจริง" (ไพ่ร้ายกลับหัวไม่ได้แปลว่าดี)
 *   ➔ ไพ่ดีกลับหัว = พลังดีที่ติดขัด (ต้องระวัง) · ไพ่ร้ายกลับหัว = ยังไม่ชี้ขาด (ไม่อ้างว่าดีหรือร้าย)
 * ประโยคห่อจึงไม่มีทางขัดกับความหมายของใบที่ตามมา
 */
export function mockCardTone(card: Pick<TarotCard, "yesNo">, isReversed: boolean): MockTone {
  if (!isReversed) return card.yesNo === "yes" ? "light" : card.yesNo === "no" ? "shadow" : "open";
  return card.yesNo === "yes" ? "shadow" : "open";
}

/** "1. อดีต (ที่มาของเรื่องนี้)" ➔ "อดีต" — ชื่อเต็มพร้อมเลขข้อใช้เป็นหัวข้อได้ แต่อ่านในประโยคไม่ลื่น */
export function shortPositionName(name: string): string {
  const cleaned = name.replace(/^\s*\d+\.\s*/, "").replace(/\s*\([^)]*\)\s*$/, "").trim();
  return cleaned || name.trim();
}

/** ตัดจุด/ช่องว่างท้ายประโยค และทำตัวแรกเป็นตัวเล็ก (อังกฤษ) ให้ต่อกลางประโยคได้ */
function asClause(text: string, lang: Lang): string {
  const t = text.trim().replace(/[.。]+$/, "");
  return lang === "en" && t ? t.charAt(0).toLowerCase() + t.slice(1) : t;
}

interface VoiceVars {
  nickname: string;
  /** "ไพ่ครบทั้ง 3 ใบ" / "ไพ่ 1 ใบ" · "all 3 cards" / "your card" — ผังใบเดียวห้ามขึ้น "ทั้ง 1 ใบ" */
  cards: string;
  question: string;
}

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

function cardsPhrase(count: number, lang: Lang): string {
  if (lang === "en") return count === 1 ? "your card" : `all ${count} cards`;
  return count === 1 ? "ไพ่ 1 ใบ" : `ไพ่ครบทั้ง ${count} ใบ`;
}

/**
 * คำทักทายและประโยคปิดตามบุคลิก — ครบทั้ง 5 บุคลิก × 2 ภาษา
 * ⚠️ ห้ามมีคำยืนยันเรื่องดวงในส่วนนี้ ("ไพ่ส่งพลังบวกมาให้") เพราะเป็นประโยคที่ขึ้นกับทุกผัง
 *    เนื้อหาเรื่องดวงต้องมาจากไพ่ที่จั่วได้เท่านั้น (ดู `overallLine` / `buildSummary`)
 * ประโยคปิดจบด้วยคำถามชวนคิด 1 ข้อตามที่ schema ของ summary กำหนด
 */
const MOCK_VOICE: Record<string, Record<Lang, { greet: (v: VoiceVars) => string; close: string }>> = {
  warm: {
    th: {
      greet: (v) => `สวัสดีค่ะคุณ${v.nickname} แม่หมอเปิด${v.cards}สำหรับคำถาม "${v.question}" แล้วนะคะ`,
      close: "ค่อย ๆ ก้าวไปทีละขั้นนะคะ แล้วลองถามใจตัวเองดูว่า ก้าวเล็กที่สุดที่คุณพร้อมทำได้ในวันนี้คืออะไรคะ",
    },
    en: {
      greet: (v) => `Hello ${v.nickname}. ${cap(v.cards)} for your question "${v.question}" ${v.cards === "your card" ? "is" : "are"} laid out now.`,
      close: "Take it one gentle step at a time — and ask yourself: what is the smallest step you are ready to take today?",
    },
  },
  playful: {
    th: {
      greet: (v) => `มาแล้วคุณ${v.nickname} ${v.cards}สำหรับเรื่อง "${v.question}" วางรออยู่ตรงนี้แล้ว`,
      close: "ไม่ต้องรีบเลย ลองถามตัวเองเล่น ๆ ว่า ถ้าไม่มีใครตัดสินคุณเลย คุณอยากทำอะไรกับเรื่องนี้ก่อน",
    },
    en: {
      greet: (v) => `Alright ${v.nickname}, ${v.cards} for "${v.question}" ${v.cards === "your card" ? "is" : "are"} on the table.`,
      close: "No rush. Quick question for you: if nobody were judging, what would you do about this first?",
    },
  },
  direct: {
    th: {
      greet: (v) => `คุณ${v.nickname} ${v.cards}สำหรับ "${v.question}" วางอยู่ตรงหน้าแล้ว ขอพูดตรง ๆ ตามที่ไพ่บอก`,
      close: "ตัดสินใจจากสิ่งที่เห็นตรงหน้า แล้วตอบตัวเองให้ชัดว่า อะไรคือสิ่งเดียวที่คุณรู้อยู่แล้วว่าต้องทำ",
    },
    en: {
      greet: (v) => `Straight to it, ${v.nickname}: ${v.cards} for "${v.question}" ${v.cards === "your card" ? "is" : "are"} laid out.`,
      close: "Decide on what is in front of you. What is the one thing you already know you need to do?",
    },
  },
  master: {
    th: {
      greet: (v) => `สวัสดีครับคุณ${v.nickname} อาจารย์วาง${v.cards}สำหรับเรื่อง "${v.question}" แล้ว ขออ่านเป็นลำดับขั้นนะครับ`,
      close: "ตั้งเป้าให้ชัด จัดเวลาให้ตรงเป้า แล้วทบทวนผลเป็นระยะนะครับ ถ้าวัดผลได้เพียงข้อเดียว คุณจะเลือกวัดอะไรครับ",
    },
    en: {
      greet: (v) => `Let us begin, ${v.nickname}. ${cap(v.cards)} for "${v.question}" ${v.cards === "your card" ? "is" : "are"} in position; I will read in order.`,
      close: "Set a clear objective, align your time behind it, and review at set intervals. If you could measure only one thing, what would it be?",
    },
  },
  mystic: {
    th: {
      greet: (v) => `ยินดีต้อนรับ คุณ${v.nickname} ${v.cards}สำหรับคำถาม "${v.question}" เผยตัวออกมาแล้ว`,
      close: "ม่านหมอกกำลังจางลง ลองถามใจตัวเองอย่างเงียบ ๆ ว่า สิ่งที่คุณรู้อยู่ลึก ๆ แต่ยังไม่กล้ายอมรับคืออะไร",
    },
    en: {
      greet: (v) => `Welcome, ${v.nickname}. ${cap(v.cards)} for "${v.question}" ${v.cards === "your card" ? "has" : "have"} revealed ${v.cards === "your card" ? "itself" : "themselves"}.`,
      close: "The mist is thinning. Ask yourself quietly: what do you already know, deep down, that you have not yet admitted?",
    },
  },
};

const resolveVoice = (personaId: string | null | undefined, lang: Lang) =>
  (MOCK_VOICE[personaId ?? ""] ?? MOCK_VOICE.warm)[lang];

/**
 * สำนวนต้นประโยคของแต่ละใบ — 3 แบบต่อขั้ว เลือกด้วยลำดับตำแหน่ง (ไม่สุ่ม)
 * ---------------------------------------------------------------------------
 * ✦ ยกเครื่อง 2026-10-10 (เจ้าของสั่ง): เดิมแปะคำอธิบายตำแหน่งทั้งก้อนในวงเล็บ หรือ "ช่องนี้หมายถึง…" ทุกใบ
 *   อ่านแล้วเป็นแม่แบบ (กฎเหล็กข้อ 10) ➔ ชื่อช่องแบบสั้นบอกความหมายได้อยู่แล้ว (อดีต · ปัจจุบัน · ข้อควรระวัง)
 *   มีแค่ 1 ใน 3 สำนวนที่เล่าใจความของช่องเป็นประโยคธรรมดา และใช้แค่ "แก่น" ของคำอธิบาย (`positionGist`)
 * ⚠️ สำนวนขั้ว shadow/open ห้ามมีคำว่า "แรงหนุน · เปิดทางให้ · ส่งสัญญาณดี" (ด่าน test-mock-reading ข้อ 7)
 */
type LeadFn = (card: string, pos: string, posGist: string) => string;
const CARD_LEAD: Record<Lang, Record<MockTone, LeadFn[]>> = {
  th: {
    light: [
      (c, p, g) => `${c} มาอยู่ในช่อง${p}${g ? ` ซึ่งว่าด้วย${g}` : ""} ไพ่ใบนี้เป็นแรงหนุนที่ชัดเจนสำหรับเรื่องนี้`,
      (c, p) => `ช่อง${p}ได้${c} เป็นใบที่เปิดทางให้คุณ`,
      (c, p) => `${c} ในช่อง${p}ส่งสัญญาณดีมาให้`,
    ],
    shadow: [
      (c, p) => `${c} ในช่อง${p} เป็นใบที่ชวนให้หยุดดูให้ดีก่อน ไม่ได้แปลว่าไม่มีทาง แต่เป็นจุดที่ต้องใส่ใจเป็นพิเศษ`,
      (c, p, g) => `ช่อง${p}${g ? `ซึ่งว่าด้วย${g} ` : ""}ได้${c} ใบนี้เป็นบทเรียนมากกว่าคำตัดสิน`,
      (c, p) => `${c} มาอยู่ตรงช่อง${p} เตือนเบา ๆ ว่ายังมีบางอย่างในส่วนนี้ที่ต้องจัดการ`,
    ],
    open: [
      (c, p) => `${c} ในช่อง${p} ยังไม่ชี้ขาดไปทางใดทางหนึ่ง ผลจึงขึ้นกับการเลือกของคุณเองมาก`,
      (c, p) => `ช่อง${p}ได้${c} เป็นใบที่ให้คุณเป็นคนกำหนดทิศทางเอง`,
      (c, p, g) => `${c} ในช่อง${p}${g ? `ซึ่งว่าด้วย${g}` : ""} บอกว่าเรื่องนี้ยังเปลี่ยนได้ ขึ้นอยู่กับสิ่งที่คุณทำจากนี้`,
    ],
  },
  en: {
    light: [
      (c, p, g) => `${c} lands in ${p}${g ? `, the part of the spread about ${g},` : ""} and it is a clear source of support here.`,
      (c, p) => `${p} draws ${c}, a card that opens the way for you.`,
      (c, p) => `${c} in ${p} sends a good signal.`,
    ],
    shadow: [
      (c, p) => `${c} in ${p} asks you to slow down and look closely. It does not close the door, but this is where your attention matters most.`,
      (c, p, g) => `${p}${g ? `, which is about ${g},` : ""} draws ${c} — more a lesson than a verdict.`,
      (c, p) => `${c} sits in ${p}, a gentle warning that something here still needs work.`,
    ],
    open: [
      (c, p) => `${c} in ${p} does not lean either way, so a lot depends on what you choose.`,
      (c, p) => `${p} draws ${c}, a card that leaves the direction with you.`,
      (c, p, g) => `${c} in ${p}${g ? `, the part about ${g},` : ""} says this can still change depending on what you do next.`,
    ],
  },
};

/**
 * "แก่น" ของคำอธิบายตำแหน่ง — ท่อนแรกก่อนเว้นวรรค (ไทย) / ก่อนจุลภาค (อังกฤษ)
 * "รากของเรื่องนี้ สิ่งที่ผ่านมาแล้วและยังส่งผล…" ➔ "รากของเรื่องนี้"
 * ท่อนแรกยาวเกิน (คำอธิบายไทยที่ไม่มีเว้นวรรคเลย) ➔ คืน "" ให้สำนวนข้ามไป ไม่ยัดประโยคยาวกลางประโยค
 */
function positionGist(meaning: string, lang: Lang): string {
  const first = (lang === "en" ? meaning.split(/,|;| — /)[0] : meaning.split(/\s+/)[0])?.trim() ?? "";
  const max = lang === "en" ? 48 : 28;
  return first.length >= 4 && first.length <= max ? first : "";
}

/** ประโยคปิดท้ายของแต่ละใบจากคำสำคัญในสารานุกรม — หลายสำนวนกันซ้ำ */
const KEYWORD_TAIL: Record<Lang, ((k1: string, k2?: string) => string)[]> = {
  th: [
    (k1, k2) => (k2 ? `คำที่ไพ่ใบนี้ฝากไว้คือ "${k1}" กับ "${k2}"` : `คำที่ไพ่ใบนี้ฝากไว้คือ "${k1}"`),
    (k1) => `ถ้าจำได้เพียงคำเดียวจากใบนี้ ให้จำคำว่า "${k1}"`,
    (k1, k2) => (k2 ? `ใจความของใบนี้สรุปได้ว่า ${k1} และ${k2}` : `ใจความของใบนี้สรุปได้ว่า ${k1}`),
  ],
  en: [
    (k1, k2) => (k2 ? `The words this card leaves you with: "${k1}" and "${k2}".` : `The word this card leaves you with: "${k1}".`),
    (k1) => `If you remember one word from this card, make it "${k1}".`,
    (k1, k2) => (k2 ? `Its key themes: "${k1}" and "${k2}".` : `Its key theme: "${k1}".`),
  ],
};

const TONE_WORD: Record<Lang, Record<MockTone, string>> = {
  th: { light: "เป็นแรงหนุน", shadow: "ชวนให้ระวัง", open: "ยังเปิดกว้าง" },
  en: { light: "supportive", shadow: "cautionary", open: "still open" },
};

/** ธาตุไทย → อังกฤษ ใช้เฉพาะคำอ่านสำรอง (คำอ่านจริงโมเดลเขียนเอง) */
const ELEMENT_EN: Record<string, string> = { ไฟ: "Fire", น้ำ: "Water", ลม: "Air", ดิน: "Earth" };

const ELEMENT_THEME: Record<string, Record<Lang, string>> = {
  ไฟ: { th: "เรื่องนี้ขับเคลื่อนด้วยความกล้าและการลงมือทำ", en: "this story runs on courage and action" },
  น้ำ: { th: "อารมณ์และความรู้สึกเป็นแกนกลางของเรื่อง", en: "feelings sit at the centre of this story" },
  ลม: { th: "ความคิดและการสื่อสารเป็นตัวตัดสินของเรื่องนี้", en: "thinking and communication decide how this goes" },
  ดิน: { th: "เรื่องงาน เงิน และความมั่นคงเป็นแกนของเรื่อง", en: "work, money and stability are the backbone here" },
};

/** คำฟันธงฝั่งอังกฤษ — schema เก็บค่าเป็นไทยเสมอ ฝั่งแสดงผลค่อยแปลง */
const YES_NO_EN: Record<string, string> = { ใช่: "Yes", ไม่ใช่: "No", ยังไม่แน่: "Not yet certain" };

/**
 * ฟันธง ใช่/ไม่ใช่ ของคำอ่านสำรอง
 * ---------------------------------------------------------------------------
 * ใช้ `tallyYesNo()` ตัวเดียวกับบล็อกหลักฐานที่ส่งให้โมเดลจริงใน `buildReadingMessage()`
 * (ค่า `yesNo` ของไพ่ทั้ง 78 ใบในสารานุกรม · กลับหัวไม่กลับขั้วแต่แรงลดครึ่ง · ใบคำตอบสรุปนับสองเท่า)
 * — ไม่ใช่การเดาและไม่ได้สร้างข้อมูลใหม่ขึ้นเอง
 *
 * เดิมคืน `null` เสมอ ➔ ผัง `yes-no` ที่ตกมาถึงคำอ่านสำรองจะไม่มีคำตอบให้ผู้ใช้เลย
 * เพราะ UI ซ่อนชิปคำตอบเมื่อค่าเป็น null (StreamReader.tsx)
 */
function resolveMockYesNo(ctx: ReadingContext): YesNoVerdictTh | null {
  if (!ctx.spread.yesNoMode) return null;
  const items = ctx.drawn
    .map((d, i) => ({ card: ctx.cards[i], isReversed: d.isReversed }))
    .filter((it) => Boolean(it.card));
  return tallyYesNo(items).verdict;
}

/**
 * หา "ไพ่ปลายทาง" จากชื่อช่อง ไม่ใช่จากลำดับ — ใบสุดท้ายไม่ได้เป็นผลลัพธ์เสมอ
 * (ผังใช่/ไม่ใช่: ใบสุดท้ายคือ "ข้อควรระวัง" ส่วนคำตอบอยู่ใบแรก) ไม่เจอ = ไม่พูดเรื่องปลายทาง
 */
const OUTCOME_POS: Record<Lang, RegExp> = {
  th: /ผลลัพธ์|อนาคต|ปลายทาง|แนวโน้ม|บทสรุป|คำตอบ/,
  en: /outcome|future|result|trajectory|answer|verdict/i,
};

function findOutcome(views: DrawnView[], lang: Lang): DrawnView | undefined {
  for (let i = views.length - 1; i >= 0; i--) if (OUTCOME_POS[lang].test(views[i].pos)) return views[i];
  return undefined;
}

/** "หอคอย (กลับหัว)ในช่อง" ➔ "หอคอย (กลับหัว) ในช่อง" — วงเล็บติดอักษรไทยอ่านสะดุด */
function tidyThai(text: string): string {
  return text.replace(/\)(?=[\u0E00-\u0E7F])/g, ") ").replace(/\s{2,}/g, " ").trim();
}

interface DrawnView {
  order: number;
  card: TarotCard;
  isReversed: boolean;
  tone: MockTone;
  name: string; // ชื่อไพ่ + ป้ายกลับหัว
  pos: string; // ชื่อตำแหน่งแบบสั้น (ใช้ในประโยค)
  posMeaning: string;
}

function overallLine(views: DrawnView[], lang: Lang): string {
  const isEn = lang === "en";
  if (views.length === 1) {
    const v = views[0];
    const t = {
      th: {
        light: `ไพ่ใบเดียวที่ออกมาคือ${v.name} เป็นใบที่ส่งแรงหนุนมาให้เรื่องนี้`,
        shadow: `ไพ่ใบเดียวที่ออกมาคือ${v.name} เป็นใบที่ชวนให้ทบทวนก่อนก้าวต่อ`,
        open: `ไพ่ใบเดียวที่ออกมาคือ${v.name} เป็นใบที่ยังเปิดให้คุณเป็นคนเลือกทาง`,
      },
      en: {
        light: `The single card that came up is ${v.name}, and it brings real support to this question.`,
        shadow: `The single card that came up is ${v.name}, asking you to pause and reflect before moving on.`,
        open: `The single card that came up is ${v.name}, which leaves the choice of path with you.`,
      },
    };
    return t[lang][v.tone];
  }
  const light = views.filter((v) => v.tone === "light").length;
  const shadow = views.filter((v) => v.tone === "shadow").length;
  const n = views.length;
  if (light > shadow) {
    return isEn
      ? `Overall this spread leans open: ${light} of ${n} cards support what you are asking about.`
      : `ภาพรวมของไพ่ชุดนี้ค่อนข้างเปิดทาง มีไพ่ที่หนุนเรื่องนี้ ${light} ใบจาก ${n} ใบ`;
  }
  if (shadow > light) {
    return isEn
      ? `This spread holds several cautionary cards (${shadow} of ${n}), but each of them also shows where the way through is.`
      : `ไพ่ชุดนี้มีหลายใบที่ชวนให้ระวัง (${shadow} จาก ${n} ใบ) แต่ทุกใบก็บอกทางออกไว้ด้วย`;
  }
  return isEn
    ? "This spread carries support and caution in roughly equal measure, so the details matter more than the overall picture."
    : "ไพ่ชุดนี้มีทั้งแรงหนุนและจุดที่ต้องระวังพอ ๆ กัน รายละเอียดของแต่ละใบจึงสำคัญกว่าภาพรวม";
}

function buildConnections(views: DrawnView[], lang: Lang): { text: string; dominantElement: string; lacking: string[] } {
  const isEn = lang === "en";
  const parts: string[] = [];
  const elementCounts: Record<string, number> = { ไฟ: 0, น้ำ: 0, ลม: 0, ดิน: 0 };
  for (const v of views) if (v.card.element in elementCounts) elementCounts[v.card.element]++;
  const ranked = Object.entries(elementCounts).sort((a, b) => b[1] - a[1]);
  const dominantElement = ranked[0]?.[1] ? ranked[0][0] : "ดิน";
  const lacking = views.length >= 3 ? ranked.filter(([, c]) => c === 0).map(([e]) => e) : [];
  const majorCount = views.filter((v) => v.card.arcana === "major").length;
  const reversedCount = views.filter((v) => v.isReversed).length;

  const outcome = findOutcome(views, lang);
  if (views.length >= 2 && outcome === views[views.length - 1]) {
    const first = views[0];
    const last = outcome;
    const arc = `${first.tone}>${last.tone}`;
    const arcMeaning: Record<string, Record<Lang, string>> = {
      "light>light": { th: "ทิศทางจึงดีต่อเนื่องตั้งแต่ต้นจนปลาย", en: "so the direction stays good from start to finish" },
      "shadow>light": { th: "เรื่องที่หนักในตอนต้นกำลังคลี่คลายไปในทางที่ดีขึ้น", en: "so what felt heavy at the start is easing into something better" },
      "light>shadow": { th: "ช่วงแรกไปได้ดี แต่ปลายทางต้องระวังอย่าประมาท", en: "so it starts well, but do not get careless near the end" },
      "shadow>shadow": { th: "เรื่องนี้ยังต้องใช้ความอดทนและการปรับวิธีคิด", en: "so this still calls for patience and a change of approach" },
    };
    const meaning =
      arcMeaning[arc]?.[lang] ??
      (isEn ? "so the ending is still being written by what you do" : "ปลายทางจึงยังถูกเขียนต่อได้ด้วยสิ่งที่คุณทำ");
    parts.push(
      isEn
        ? `The story opens with ${first.name} in ${first.pos}, which is ${TONE_WORD.en[first.tone]}, and closes with ${last.name} in ${last.pos}, which is ${TONE_WORD.en[last.tone]} — ${meaning}.`
        : `เรื่องนี้เริ่มจาก${first.name}ในช่อง${first.pos}ที่${TONE_WORD.th[first.tone]} และไปจบที่${last.name}ในช่อง${last.pos}ที่${TONE_WORD.th[last.tone]} ${meaning}`,
    );
  } else if (views.length >= 2) {
    // ผังที่ไม่ได้เรียงตามเวลา — ชี้ใบที่หนุนที่สุดกับใบที่ต้องระวังที่สุดแทนการเล่าต้น➔ปลาย
    const ally = views.find((v) => v.tone === "light");
    const watch = views.find((v) => v.tone === "shadow");
    if (ally && watch) {
      parts.push(
        isEn
          ? `${ally.name} in ${ally.pos} and ${watch.name} in ${watch.pos} pull in different directions, so this is about balancing what helps against what holds you back.`
          : `${ally.name}ในช่อง${ally.pos} กับ${watch.name}ในช่อง${watch.pos} ดึงไปคนละทาง เรื่องนี้จึงเป็นการชั่งน้ำหนักระหว่างสิ่งที่หนุนกับสิ่งที่รั้งคุณไว้`,
      );
    } else if (ally || watch) {
      const v = (ally ?? watch)!;
      parts.push(
        isEn
          ? `The card setting the tone here is ${v.name} in ${v.pos}, which is ${TONE_WORD.en[v.tone]}.`
          : `ใบที่กำหนดทิศทางของผังนี้คือ${v.name}ในช่อง${v.pos} ซึ่ง${TONE_WORD.th[v.tone]}`,
      );
    }
  }

  if (views.length >= 2 && majorCount >= Math.ceil(views.length / 2)) {
    parts.push(
      isEn
        ? `${majorCount} Major Arcana cards appear, which marks this as a genuine turning point rather than a passing phase.`
        : `มีไพ่ชุดใหญ่ (Major Arcana) ถึง ${majorCount} ใบ แสดงว่าเรื่องนี้เป็นจุดเปลี่ยนสำคัญ ไม่ใช่เรื่องชั่วคราว`,
    );
  } else if (views.length >= 3 && majorCount === 0) {
    parts.push(
      isEn
        ? "There are no Major Arcana cards at all, so this sits almost entirely in your hands — everyday choices will change it."
        : "ไม่มีไพ่ชุดใหญ่เลยสักใบ เรื่องนี้จึงอยู่ในมือคุณเกือบทั้งหมด เปลี่ยนได้ด้วยการกระทำในชีวิตประจำวัน",
    );
  }

  const domCount = elementCounts[dominantElement] ?? 0;
  if (views.length === 1) {
    const c = views[0].card;
    parts.push(
      isEn
        ? `It is a ${ELEMENT_EN[c.element] ?? "Earth"} card linked to ${c.astrologyEn || c.astrology}, and ${ELEMENT_THEME[c.element]?.en ?? ELEMENT_THEME.ดิน.en}.`
        : `ไพ่ใบนี้เป็นธาตุ${c.element} ผูกกับ${c.astrology} ${ELEMENT_THEME[c.element]?.th ?? ELEMENT_THEME.ดิน.th}`,
    );
  } else if (domCount >= 2) {
    parts.push(
      isEn
        ? `${ELEMENT_EN[dominantElement] ?? "Earth"} is the strongest element here (${domCount} cards): ${ELEMENT_THEME[dominantElement]?.en}.`
        : `ธาตุ${dominantElement}ออกมาเด่นที่สุด (${domCount} ใบ) ${ELEMENT_THEME[dominantElement]?.th}`,
    );
  }

  if (views.length >= 3 && reversedCount >= Math.ceil(views.length / 2)) {
    parts.push(
      isEn
        ? `${reversedCount} cards came up reversed, a sign that much of the energy is still held inside rather than expressed.`
        : `ไพ่กลับหัวถึง ${reversedCount} ใบ บอกว่าพลังส่วนใหญ่ยังติดค้างอยู่ข้างใน ยังไม่ได้แสดงออกมา`,
    );
  }

  return { text: parts.join(isEn ? " " : " "), dominantElement, lacking };
}

function buildSummary(views: DrawnView[], lang: Lang): string {
  const isEn = lang === "en";
  const parts: string[] = [];
  if (views.length >= 2) {
    const last = findOutcome(views, lang);
    const outcome = {
      th: {
        light: "ซึ่งชี้ว่าถ้าเดินต่อในทางนี้ ผลที่ได้มีแนวโน้มออกมาดี",
        shadow: "ซึ่งเตือนว่าถ้ายังทำแบบเดิม ผลอาจไม่เป็นอย่างที่หวัง แต่ยังมีเวลาปรับ",
        open: "ซึ่งบอกว่าปลายทางยังไม่ตายตัว ขึ้นกับสิ่งที่คุณเลือกทำจากนี้",
      },
      en: {
        light: "which suggests that if you keep going this way, the result is likely to be good",
        shadow: "which warns that if nothing changes, the result may fall short — but there is still time to adjust",
        open: "which says the ending is not fixed yet; it depends on what you choose next",
      },
    };
    if (last) {
      parts.push(
        isEn
          ? `The card speaking for where this is heading is ${last.name} in ${last.pos}, ${outcome.en[last.tone]}.`
          : `ไพ่ที่บอกปลายทางของเรื่องนี้คือ${last.name}ในช่อง${last.pos} ${outcome.th[last.tone]}`,
      );
    }
    const watch = views.find((v) => v.tone === "shadow" && v !== last);
    if (watch) {
      parts.push(
        isEn
          ? `The part that needs the most care is ${watch.pos}, where ${watch.name} came up.`
          : `จุดที่ต้องดูแลมากที่สุดอยู่ที่ช่อง${watch.pos} ซึ่งออก${watch.name}`,
      );
    }
    const ally = views.find((v) => v.tone === "light" && v !== last);
    if (ally) {
      parts.push(
        isEn
          ? `Your strongest ally in this spread is ${ally.name} in ${ally.pos}; lean on what it describes.`
          : `ตัวช่วยที่แข็งแรงที่สุดในผังนี้คือ${ally.name}ในช่อง${ally.pos} ให้พึ่งเรื่องที่ใบนี้บอกไว้`,
      );
    }
  } else {
    const v = views[0];
    const kw = (lang === "en" ? v.card.keywordsEn?.[v.isReversed ? "reversed" : "upright"] : undefined) ??
      v.card.keywords[v.isReversed ? "reversed" : "upright"];
    const k = kw?.[0];
    if (k) {
      parts.push(
        isEn
          ? `Everything in this reading comes back to one idea from ${v.name}: "${k}".`
          : `ทั้งหมดของคำอ่านนี้กลับมาที่ใจความเดียวจาก${v.name} คือ "${k}"`,
      );
    }
  }
  return parts.join(" ");
}

export const MOCK_ADVICE: Record<string, Record<Lang, string[]>> = {
  ไฟ: {
    th: ["เลือกเรื่องที่ค้างอยู่มา 1 เรื่อง แล้วเริ่มลงมือภายใน 24 ชั่วโมงนี้", "ก่อนคุยเรื่องสำคัญ รอให้ใจเย็นลงสักคืนแล้วค่อยพูด"],
    en: ["Pick one thing you have been putting off and start it within the next 24 hours.", "Before any important conversation, sleep on it once so you speak from a calm place."],
  },
  น้ำ: {
    th: ["เขียนความรู้สึกเรื่องนี้ลงกระดาษ 5 นาที โดยไม่ต้องแก้คำ", "หาเวลาพักจริง ๆ สักครึ่งวันก่อนตัดสินใจเรื่องใหญ่"],
    en: ["Write down how you feel about this for five minutes, without editing a word.", "Take a real half-day of rest before making any big decision."],
  },
  ลม: {
    th: ["จดข้อดีข้อเสียของทางเลือกที่มีอยู่ ข้างละ 3 ข้อ", "ส่งข้อความสั้น ๆ ถึงคนที่เกี่ยวข้อง บอกสิ่งที่คุณต้องการให้ชัด"],
    en: ["List three pros and three cons for each option you have.", "Send one short, clear message to the person involved saying what you need."],
  },
  ดิน: {
    th: ["แตกเป้าหมายเรื่องนี้ออกเป็นขั้นเล็ก ๆ แล้วทำขั้นแรกให้เสร็จภายในสัปดาห์นี้", "ทบทวนรายรับรายจ่ายหรือเวลาที่ใช้กับเรื่องนี้ 1 รอบ"],
    en: ["Break this goal into small steps and finish the first one this week.", "Review the money or time you are putting into this, once, honestly."],
  },
};

/**
 * ✦ คำแนะนำตามหมวด × ขั้วของปลายทาง (ยกเครื่อง 2026-10-10 · เจ้าของสั่ง)
 * ---------------------------------------------------------------------------
 * เดิมเลือกจาก "ธาตุเด่น" อย่างเดียว (`MOCK_ADVICE`) ➔ คำถามแฟนเก่าได้ "ส่งข้อความสั้น ๆ ถึงคนที่เกี่ยวข้อง"
 * ทั้งที่ไพ่ในคำอ่านเดียวกันเตือน "ระวังการกลับไปหาคนเดิม" — ขัดกันเอง และอาจพาผู้ใช้ไปทักแฟนเก่า
 * ⚠️ หมวดความรักขั้ว shadow ห้ามมีคำแนะนำให้ติดต่อ/ทักอีกฝ่าย · คำถามแฟนเก่าใช้ชุดเฉพาะเสมอ (`INTENT_ADVICE.ex`)
 * `MOCK_ADVICE` (ตามธาตุ) ยังอยู่ให้แชทสำรองใช้ — คำอ่านสำรองไม่ใช้แล้ว
 */
type AdviceTone = "light" | "shadow" | "open";
const CATEGORY_ADVICE: Record<string, Record<AdviceTone, Record<Lang, string[]>>> = {
  general: {
    light: {
      th: ["เลือกเรื่องที่ค้างอยู่มา 1 เรื่อง แล้วเริ่มลงมือภายใน 24 ชั่วโมงนี้", "จดสิ่งที่กำลังไปได้ดี 3 ข้อ แล้วทำต่อให้สม่ำเสมอ"],
      en: ["Pick one thing you have been putting off and start it within the next 24 hours.", "Write down three things that are going well and keep them going."],
    },
    shadow: {
      th: ["ก่อนตัดสินใจเรื่องสำคัญ รอให้ใจนิ่งสักคืนแล้วค่อยตัดสิน", "แตกเรื่องที่หนักใจออกเป็นขั้นเล็ก ๆ แล้วทำขั้นแรกให้เสร็จในสัปดาห์นี้"],
      en: ["Before any important decision, sleep on it once so you decide from a calm place.", "Break what weighs on you into small steps and finish the first one this week."],
    },
    open: {
      th: ["จดข้อดีข้อเสียของทางเลือกที่มีอยู่ ข้างละ 3 ข้อ", "คุยกับคนที่ไว้ใจได้ 1 คน เพื่อฟังมุมที่คุณอาจมองข้าม"],
      en: ["List three pros and three cons for each option you have.", "Talk it through with one person you trust to hear the angle you might be missing."],
    },
  },
  love: {
    light: {
      th: ["บอกความรู้สึกด้วยประโยคง่าย ๆ 1 ประโยค ไม่ต้องรอจังหวะที่สมบูรณ์แบบ", "หาเวลาคุยกันแบบไม่มีมือถือคั่นสัก 30 นาทีในสัปดาห์นี้"],
      en: ["Say how you feel in one simple sentence; you do not need the perfect moment.", "Find thirty minutes this week to talk with no phones in between."],
    },
    shadow: {
      th: ["ก่อนตัดสินใจเรื่องความสัมพันธ์ รอให้ใจนิ่งสักคืนแล้วค่อยคิดใหม่", "เขียนสิ่งที่คุณต้องการจากความรัก 3 ข้อ แล้วดูว่าตอนนี้ได้รับข้อไหนบ้าง"],
      en: ["Before deciding anything about this relationship, let your heart settle overnight.", "Write down three things you need from love, then notice which of them you are actually getting."],
    },
    open: {
      th: ["สังเกตสิ่งที่อีกฝ่ายทำในสัปดาห์นี้ มากกว่าสิ่งที่พูด", "ถามตัวเองว่าความสัมพันธ์แบบไหนที่ทำให้คุณสบายใจ แล้วจดไว้"],
      en: ["Watch what the other person does this week more than what they say.", "Ask yourself what kind of relationship feels safe to you, and write it down."],
    },
  },
  work: {
    light: {
      th: ["เลือกงานที่สำคัญที่สุด 1 ชิ้น แล้วลงมือภายใน 24 ชั่วโมง", "เล่าผลงานที่ทำสำเร็จให้หัวหน้าหรือทีมรู้ ไม่ต้องรอให้ใครถาม"],
      en: ["Pick your single most important task and start it within 24 hours.", "Let your manager or team know what you have already delivered; do not wait to be asked."],
    },
    shadow: {
      th: ["ลิสต์งานที่ถืออยู่ทั้งหมด แล้วเลือก 1 ชิ้นที่ส่งต่อหรือเลื่อนได้", "ก่อนตัดสินใจเรื่องงานใหญ่ ขอความเห็นจากคนที่รู้เรื่องนั้นจริงสัก 1 คน"],
      en: ["List everything on your plate and choose one thing you can hand off or postpone.", "Before a big work decision, ask one person who really knows the field."],
    },
    open: {
      th: ["จดทางเลือกเรื่องงานที่มีอยู่ ข้างละ 3 ข้อดีข้อเสีย", "ตั้งเป้าเล็ก ๆ 1 ข้อที่วัดผลได้ภายในสัปดาห์นี้"],
      en: ["Write three pros and cons for each work option you have.", "Set one small, measurable goal for this week."],
    },
  },
  money: {
    light: {
      th: ["กันเงินส่วนหนึ่งไว้ออมก่อนใช้ แม้จะเป็นจำนวนเล็ก ๆ", "วางแผนว่ารายรับที่เข้ามาจะเก็บหรือต่อยอดอย่างไรก่อนใช้"],
      en: ["Set some money aside before you spend, even a small amount.", "Decide how incoming money will be saved or grown before you spend it."],
    },
    shadow: {
      th: ["ชะลอการซื้อของชิ้นใหญ่หรือการลงทุนใหม่ออกไปก่อน 1 สัปดาห์", "จดรายจ่ายทุกบาทเป็นเวลา 7 วัน เพื่อดูว่าเงินรั่วไปตรงไหน"],
      en: ["Hold off on any big purchase or new investment for one week.", "Track every expense for seven days to see where the money leaks."],
    },
    open: {
      th: ["แยกเงินที่จำเป็นกับเงินที่ใช้ได้ออกจากกันให้ชัด", "ก่อนจ่ายทุกครั้ง ถามตัวเองว่าจำเป็นหรือแค่อยากได้"],
      en: ["Separate the money you need from the money you can spend.", "Before each purchase, ask whether you need it or only want it."],
    },
  },
  self: {
    light: {
      th: ["ทำสิ่งที่ทำให้คุณรู้สึกเป็นตัวเองสัก 30 นาทีในวันนี้", "จดสิ่งที่คุณภูมิใจในตัวเองช่วงนี้ 3 ข้อ"],
      en: ["Spend thirty minutes today on something that makes you feel like yourself.", "Write down three things you are proud of lately."],
    },
    shadow: {
      th: ["ให้เวลาพักจริง ๆ กับตัวเองสักครึ่งวัน โดยไม่ต้องรู้สึกผิด", "เขียนสิ่งที่หนักใจลงกระดาษ 5 นาที แล้วเลือก 1 เรื่องที่วางลงได้ก่อน"],
      en: ["Give yourself a real half-day of rest, without guilt.", "Write what weighs on you for five minutes, then choose one thing you can set down first."],
    },
    open: {
      th: ["ลองเขียนว่าอีก 3 เดือนข้างหน้า คุณอยากเป็นคนแบบไหน", "เลือกนิสัยเล็ก ๆ 1 อย่างที่อยากเริ่ม แล้วทำต่อเนื่อง 7 วัน"],
      en: ["Write down who you want to be three months from now.", "Choose one small habit to start and keep it for seven days."],
    },
  },
};

/**
 * ✦ ประเภทคำถามที่พบบ่อย — จับจากคำในคำถาม (ไม่ใช้ AI) เพื่อตอบให้ตรงเรื่องและเลือกคำแนะนำที่ปลอดภัย
 * ไม่เข้าข่ายข้อไหน = null (ใช้คำแนะนำตามหมวดตามปกติ ไม่มีประโยคตอบตรง)
 */
type QuestionIntent =
  | "ex"
  | "feelings"
  | "new_love"
  | "health"
  | "study"
  | "family"
  | "job_change"
  | "business"
  | "money"
  | "decision";
/**
 * ลำดับสำคัญ — เรื่องเฉพาะมาก่อนเรื่องกว้าง ("แฟนเก่ายังรักเราไหม" = แฟนเก่า ไม่ใช่ความรู้สึก)
 * `decision` ("ควร…ไหม") อยู่ท้ายสุด ใช้เมื่อไม่เข้าเรื่องไหนเลย · คำถาม "เมื่อไหร่" แยกเป็นธง `asksTiming` ต่อท้ายคำตอบ
 * ⚠️ สุขภาพ: ตอบได้แค่เรื่องกำลังใจ/การดูแลตัวเอง ห้ามทำนายผลการรักษาหรืออาการ และชี้ไปหาแพทย์เสมอ
 */
const INTENT_ORDER: readonly QuestionIntent[] = [
  "ex",
  "feelings",
  "new_love",
  "health",
  "study",
  "family",
  "job_change",
  "business",
  "money",
  "decision",
];
const INTENT_PATTERN: Record<QuestionIntent, RegExp> = {
  ex: /แฟนเก่า|คนเก่า|คืนดี|กลับมาหา|กลับมาคบ|\bex\b|get back together|come back to me/i,
  feelings: /เขารู้สึก|เขาคิดยังไง|เขาคิดอย่างไร|เขาชอบ|เขารัก|ใจเขา|how (?:does|do) (?:he|she|they) feel|feel about me|love me/i,
  new_love: /คนคุย|คนใหม่|เนื้อคู่|เจอคน|คู่แท้|มีแฟน|โสด|soulmate|meet someone|new (?:love|partner)|single/i,
  health: /สุขภาพ|ป่วย|โรค|ผ่าตัด|หาย(?:ป่วย|ดี)|อาการ|health|illness|sick|surgery|recover/i,
  study: /(?<!ตรวจ)สอบ|เรียน(?!รู้)|(?<!ลง)ทุนการศึกษา|ทุนเรียน|มหาลัย|มหาวิทยาลัย|exam|study|school|university|scholarship/i,
  family: /ครอบครัว|พ่อ(?!ค้า)|แม่(?!หมอ|ค้า)|ลูก(?!ค้า)|พี่น้อง|ญาติ|family|parents?|mother|father|children|siblings?/i,
  job_change: /ย้ายงาน|เปลี่ยนงาน|ลาออก|งานใหม่|สมัครงาน|สัมภาษณ์|change (?:my )?jobs?|quit (?:my )?job|new job|interview/i,
  business: /ธุรกิจ|ค้าขาย|ขายของ|ร้าน|ลูกค้า|business|shop|customers?|start-?up/i,
  money: /การเงิน|เงิน|หนี้|รายได้|ลงทุน|money|finances?|debt|income|invest/i,
  decision: /ควร.*(?:ไหม|มั้ย|หรือเปล่า|ดีไหม)|ดีไหม|เลือก(?:ทาง|อะไร)|should i|which (?:one|option)/i,
};
const TIMING_PATTERN = /เมื่อไหร่|เมื่อไร|อีกนานไหม|ช่วงไหน|\bwhen\b|how long/i;
function detectIntent(question: string): QuestionIntent | null {
  for (const intent of INTENT_ORDER) if (INTENT_PATTERN[intent].test(question)) return intent;
  return null;
}

/** คำแนะนำเฉพาะประเภทคำถาม — ชนะคำแนะนำตามหมวด (แฟนเก่า: ห้ามชวนทัก ให้เว้นระยะและทบทวนก่อนเสมอ) */
const INTENT_ADVICE: Partial<Record<QuestionIntent, Record<Lang, string[]>>> = {
  ex: {
    th: [
      "ก่อนทักเขา เว้นระยะสัก 7 วัน แล้วถามตัวเองว่าคิดถึงตัวเขา หรือคิดถึงช่วงเวลาที่ผ่านมา",
      "เขียนเหตุผลที่เลิกกันครั้งก่อน 3 ข้อ แล้วดูว่าตอนนี้มีข้อไหนเปลี่ยนไปจริงบ้าง",
    ],
    en: [
      "Before reaching out, give it seven days and ask yourself whether you miss them or the time you shared.",
      "Write down three reasons it ended last time, then check which of them has truly changed.",
    ],
  },
  feelings: {
    th: ["สังเกตสิ่งที่เขาทำให้คุณจริง ๆ ในสัปดาห์นี้ มากกว่าการเดาความคิดเขา", "ถามตัวเองว่าคุณต้องการอะไรจากเขา แล้วค่อยพูดตรง ๆ เมื่อใจพร้อม"],
    en: ["Notice what they actually do for you this week rather than guessing their thoughts.", "Ask yourself what you want from them, and say it plainly when you feel ready."],
  },
  new_love: {
    th: ["ลองไปที่ใหม่หรือทำกิจกรรมใหม่ 1 อย่างในสัปดาห์นี้ เพื่อเปิดโอกาสได้เจอคน", "จดลักษณะของคนที่ทำให้คุณสบายใจ 3 ข้อ เพื่อใช้ดูคนที่เข้ามา"],
    en: ["Go somewhere new or try one new activity this week to open the door to meeting people.", "Write down three qualities of someone who makes you feel at ease, and use them to see who comes along."],
  },
  health: {
    th: ["ถ้ามีอาการที่กังวล ให้ปรึกษาแพทย์โดยตรง กรณีฉุกเฉินโทร 1669", "พักผ่อนให้พอและดื่มน้ำให้เพียงพอตลอดสัปดาห์นี้"],
    en: ["If a symptom worries you, talk to a doctor directly; in an emergency call your local emergency number.", "Get enough rest and water throughout this week."],
  },
  study: {
    th: ["แบ่งเนื้อหาที่ต้องอ่านเป็นชิ้นเล็ก ๆ แล้วทำวันละ 1 ชิ้นจนถึงวันสอบ", "ลองทำข้อสอบเก่าจับเวลาจริงสัก 1 ชุดในสัปดาห์นี้"],
    en: ["Split what you need to study into small pieces and do one a day until the exam.", "Try one past paper under real timing this week."],
  },
  family: {
    th: ["หาเวลาคุยกับคนในบ้านแบบตั้งใจฟังสัก 15 นาที โดยยังไม่ต้องหาข้อสรุป", "บอกสิ่งที่คุณต้องการจากครอบครัวด้วยประโยคง่าย ๆ 1 ประโยค"],
    en: ["Spend fifteen minutes truly listening to someone at home, without trying to settle anything yet.", "Tell your family what you need in one simple sentence."],
  },
  business: {
    th: ["ดูตัวเลขรายรับรายจ่ายของธุรกิจย้อนหลัง 1 เดือนให้ชัดก่อนตัดสินใจเรื่องใหญ่", "ถามลูกค้าจริงสัก 3 คนว่าชอบหรืออยากให้ปรับอะไร"],
    en: ["Review the last month's business income and costs before any big decision.", "Ask three real customers what they like and what they would change."],
  },
  decision: {
    th: ["จดข้อดีข้อเสียของแต่ละทาง ข้างละ 3 ข้อ แล้ววางไว้ 1 คืนก่อนตัดสิน", "ถามตัวเองว่าอีก 1 ปีข้างหน้า คุณจะเสียดายทางไหนมากกว่ากัน"],
    en: ["Write three pros and cons for each path, then sleep on it before you decide.", "Ask yourself which path you would regret more a year from now."],
  },
};

/**
 * ✦ ประโยคตอบตรงคำถาม — ขึ้นต้นบทสรุป (ไม่ใช้ในโหมดใช่/ไม่ใช่ ซึ่งมีคำตอบฟันธงอยู่แล้ว)
 * คิดจากขั้วของไพ่ปลายทาง (หรือภาพรวมของผัง) เท่านั้น ไม่ฟันธงเกินไพ่ และไม่อ้างว่ารู้การกระทำของคนอื่น
 */
const INTENT_ANSWER: Record<QuestionIntent, Record<Lang, Record<AdviceTone, string>>> = {
  ex: {
    th: {
      light: "สำหรับคำถามว่าเขาจะกลับมาไหม ไพ่เอนไปทางที่ยังมีโอกาสได้คุยกันใหม่ แต่ไพ่บอกแนวโน้ม ไม่ได้รับประกันการตัดสินใจของใคร",
      shadow: "สำหรับคำถามว่าเขาจะกลับมาไหม ไพ่ยังไม่เห็นสัญญาณชัดว่าเรื่องจะกลับไปเหมือนเดิม และชวนให้คุณดูแลใจตัวเองก่อน",
      open: "สำหรับคำถามว่าเขาจะกลับมาไหม ไพ่ยังไม่ชี้ขาด ขึ้นกับว่าทั้งสองฝ่ายเปลี่ยนไปจากเดิมจริงหรือเปล่า",
    },
    en: {
      light: "As for whether they will come back, the cards lean towards a chance to talk again — they show a trend, not a guarantee of anyone's choice.",
      shadow: "As for whether they will come back, the cards do not show a clear sign that things will return to how they were, and they ask you to look after your own heart first.",
      open: "As for whether they will come back, the cards have not decided; it depends on whether both of you have truly changed.",
    },
  },
  feelings: {
    th: {
      light: "ความรู้สึกของอีกฝ่ายที่ไพ่สะท้อนออกมาเอนไปทางบวก แต่ให้ดูจากสิ่งที่เขาทำประกอบด้วย",
      shadow: "ความรู้สึกของอีกฝ่ายที่ไพ่สะท้อนออกมายังมีความลังเลหรือระยะห่างอยู่",
      open: "ความรู้สึกของอีกฝ่ายตามที่ไพ่สะท้อนยังไม่ชัด อาจเพราะเขาเองก็ยังไม่แน่ใจ",
    },
    en: {
      light: "The feelings the cards reflect from the other person lean positive, but read them alongside what they actually do.",
      shadow: "The feelings the cards reflect from the other person still carry hesitation or distance.",
      open: "The other person's feelings are not clear in these cards — they may not be sure themselves yet.",
    },
  },
  job_change: {
    th: {
      light: "เรื่องย้ายหรือเปลี่ยนงาน ไพ่เอนไปทางสนับสนุนให้ขยับ ถ้าคุณเตรียมตัวพร้อม",
      shadow: "เรื่องย้ายหรือเปลี่ยนงาน ไพ่ชวนให้ชะลอและเตรียมตัวให้พร้อมกว่านี้ก่อนตัดสินใจ",
      open: "เรื่องย้ายหรือเปลี่ยนงาน ไพ่ยังไม่ชี้ขาด ลองชั่งข้อดีข้อเสียให้ชัดก่อน",
    },
    en: {
      light: "On changing jobs, the cards lean towards making the move, as long as you are prepared.",
      shadow: "On changing jobs, the cards suggest slowing down and preparing more before you decide.",
      open: "On changing jobs, the cards have not decided — weigh the pros and cons clearly first.",
    },
  },
  money: {
    th: {
      light: "เรื่องเงิน ไพ่เอนไปทางดีขึ้น ถ้าคุมรายจ่ายได้ต่อเนื่อง",
      shadow: "เรื่องเงิน ไพ่ชวนให้ระวังรายจ่ายและอย่าเพิ่งเสี่ยงช่วงนี้",
      open: "เรื่องเงิน ไพ่ยังไม่ชี้ขาด ขึ้นกับการวางแผนของคุณจากนี้",
    },
    en: {
      light: "On money, the cards lean towards improvement if you keep spending in check.",
      shadow: "On money, the cards ask you to watch your spending and avoid risks for now.",
      open: "On money, the cards have not decided; it depends on how you plan from here.",
    },
  },
  new_love: {
    th: {
      light: "เรื่องความรักครั้งใหม่ ไพ่เอนไปทางที่หัวใจกำลังเปิดรับ โอกาสได้เจอหรือคุยกับคนที่ใช่มีอยู่จริง",
      shadow: "เรื่องความรักครั้งใหม่ ไพ่ชวนให้ดูแลใจตัวเองให้พร้อมก่อน แล้วความสัมพันธ์ที่ดีจะง่ายขึ้น",
      open: "เรื่องความรักครั้งใหม่ ไพ่ยังไม่ชี้ขาด ขึ้นกับว่าคุณเปิดโอกาสให้ตัวเองมากแค่ไหน",
    },
    en: {
      light: "On new love, the cards lean towards a heart that is opening — a real chance to meet or connect with someone right.",
      shadow: "On new love, the cards ask you to take care of your own heart first; a good connection comes easier after that.",
      open: "On new love, the cards have not decided; it depends on how much room you give yourself to meet people.",
    },
  },
  health: {
    th: {
      light: "เรื่องสุขภาพ ไพ่ใช้ดูได้แค่กำลังใจและการดูแลตัวเอง ไม่ใช่การวินิจฉัย ซึ่งไพ่ชุดนี้ให้กำลังใจที่ดี อาการที่กังวลควรปรึกษาแพทย์",
      shadow: "เรื่องสุขภาพ ไพ่ใช้ดูได้แค่กำลังใจและการดูแลตัวเอง ไม่ใช่การวินิจฉัย ไพ่ชุดนี้ชวนให้ใส่ใจร่างกายมากขึ้น อาการที่กังวลควรปรึกษาแพทย์",
      open: "เรื่องสุขภาพ ไพ่ใช้ดูได้แค่กำลังใจและการดูแลตัวเอง ไม่ใช่การวินิจฉัย อาการที่กังวลควรปรึกษาแพทย์",
    },
    en: {
      light: "On health, tarot can only speak to morale and self-care, not diagnosis — and these cards are encouraging. Please see a doctor about any symptom that worries you.",
      shadow: "On health, tarot can only speak to morale and self-care, not diagnosis — these cards ask you to pay closer attention to your body. Please see a doctor about any symptom that worries you.",
      open: "On health, tarot can only speak to morale and self-care, not diagnosis. Please see a doctor about any symptom that worries you.",
    },
  },
  study: {
    th: {
      light: "เรื่องการเรียนการสอบ ไพ่เอนไปทางดี ถ้าคุณเตรียมตัวต่อเนื่องอย่างที่ทำอยู่",
      shadow: "เรื่องการเรียนการสอบ ไพ่ชวนให้เพิ่มการเตรียมตัวและอย่าประมาท ยังมีเวลาปรับ",
      open: "เรื่องการเรียนการสอบ ไพ่ยังไม่ชี้ขาด ผลขึ้นกับการเตรียมตัวจากนี้มาก",
    },
    en: {
      light: "On study and exams, the cards lean positive, as long as you keep preparing steadily.",
      shadow: "On study and exams, the cards ask you to prepare more and not get complacent — there is still time.",
      open: "On study and exams, the cards have not decided; the result depends a lot on your preparation from here.",
    },
  },
  family: {
    th: {
      light: "เรื่องครอบครัว ไพ่เอนไปทางที่ความสัมพันธ์ในบ้านคลี่คลายและอบอุ่นขึ้น",
      shadow: "เรื่องครอบครัว ไพ่ชวนให้ใจเย็นและฟังกันมากขึ้น ยังมีเรื่องที่ต้องค่อย ๆ คุย",
      open: "เรื่องครอบครัว ไพ่ยังไม่ชี้ขาด ขึ้นกับว่าแต่ละคนเปิดใจคุยกันแค่ไหน",
    },
    en: {
      light: "On family, the cards lean towards things at home easing and growing warmer.",
      shadow: "On family, the cards ask for patience and more listening — there is still something to talk through slowly.",
      open: "On family, the cards have not decided; it depends on how openly everyone talks.",
    },
  },
  business: {
    th: {
      light: "เรื่องธุรกิจ ไพ่เอนไปทางเติบโต ถ้าคุณคุมตัวเลขและฟังลูกค้าต่อเนื่อง",
      shadow: "เรื่องธุรกิจ ไพ่ชวนให้ระวังการขยายหรือลงทุนเพิ่มช่วงนี้ ดูตัวเลขให้ชัดก่อน",
      open: "เรื่องธุรกิจ ไพ่ยังไม่ชี้ขาด ขึ้นกับการตัดสินใจและการวางแผนของคุณจากนี้",
    },
    en: {
      light: "On business, the cards lean towards growth if you keep an eye on the numbers and listen to customers.",
      shadow: "On business, the cards caution against expanding or investing more right now — get the numbers clear first.",
      open: "On business, the cards have not decided; it depends on your planning and choices from here.",
    },
  },
  decision: {
    th: {
      light: "สำหรับการตัดสินใจครั้งนี้ ไพ่เอนไปทางสนับสนุนให้ก้าวต่อ ถ้าคุณชั่งข้อดีข้อเสียแล้วรู้สึกพร้อม",
      shadow: "สำหรับการตัดสินใจครั้งนี้ ไพ่ชวนให้ชะลอและหาข้อมูลเพิ่มก่อน ยังไม่ต้องรีบ",
      open: "สำหรับการตัดสินใจครั้งนี้ ไพ่ยังไม่ชี้ขาด คำตอบอยู่ที่ว่าคุณให้น้ำหนักกับอะไรมากที่สุด",
    },
    en: {
      light: "For this decision, the cards lean towards moving ahead, once you have weighed it and feel ready.",
      shadow: "For this decision, the cards suggest slowing down and gathering more information first — no need to rush.",
      open: "For this decision, the cards have not decided; the answer lies in what matters most to you.",
    },
  },
};

/** ต่อท้ายคำตอบเมื่อคำถามถามเวลา — ไพ่ไม่บอกวันเวลาตายตัว ให้แค่จังหวะคร่าว ๆ ตามธาตุเด่น */
const TIMING_ANSWER: Record<Lang, (timing: string) => string> = {
  th: (t) => `ส่วนเรื่องเมื่อไหร่ ไพ่ไม่ได้บอกวันเวลาตายตัว จังหวะคร่าว ๆ ที่ไพ่ชี้คือ${t}`,
  en: (t) => `As for when, the cards do not give a fixed date; the rough timing they point to is ${t}.`,
};

/**
 * ✦ ประโยคปิด — เดิมใช้ประโยคเดียวของบุคลิกทุกครั้ง (ผู้ใช้ที่ได้คำอ่านสำรองสองครั้งเห็นประโยคเดียวกันเป๊ะ)
 * ตอนนี้หมุนกับอีก 3 แบบที่ไม่มีคำลงท้ายเพศ (ไม่ชนบุคลิก ค่ะ/ครับ) · เลือกจากไพ่ที่จั่ว จึงไม่สุ่ม (ไพ่ชุดเดิมได้คำเดิม)
 * ทุกแบบจบด้วยคำถามชวนคิด 1 ข้อตามที่ schema ของ summary กำหนด
 */
const CLOSE_VARIANTS: Record<Lang, string[]> = {
  th: [
    "ลองถามตัวเองดูว่า สิ่งไหนในเรื่องนี้ที่อยู่ในมือคุณจริง ๆ",
    "ก่อนปิดไพ่ ลองถามใจตัวเองว่า อีกหนึ่งสัปดาห์ข้างหน้า คุณอยากเห็นเรื่องนี้เป็นแบบไหน",
    "ลองถามตัวเองเบา ๆ ว่า ถ้าเพื่อนสนิทเจอเรื่องเดียวกันนี้ คุณจะแนะนำเขาว่าอะไร",
  ],
  en: [
    "Ask yourself: which part of this is truly in your hands?",
    "Before you close the cards, ask yourself: a week from now, how would you like this to look?",
    "Ask yourself gently: if a close friend were in this exact spot, what would you tell them?",
  ],
};

/** ขั้วที่ใช้ตอบคำถาม/เลือกคำแนะนำ — ไพ่ปลายทางก่อน · ผังใบเดียวใช้ใบนั้น · ไม่มีปลายทางใช้ฝั่งที่มากกว่า */
function headingTone(views: DrawnView[], lang: Lang): AdviceTone {
  if (views.length === 1) return views[0].tone;
  const outcome = findOutcome(views, lang);
  if (outcome) return outcome.tone;
  const light = views.filter((v) => v.tone === "light").length;
  const shadow = views.filter((v) => v.tone === "shadow").length;
  return light > shadow ? "light" : shadow > light ? "shadow" : "open";
}

const MINDFUL_EN: Record<string, string> = {
  ไฟ: "🧘 One-minute practice: stand tall, take three deep breaths, step forward once, and say out loud one thing you will do today.",
  น้ำ: "🧘 One-minute practice: hand on your chest, drink a glass of water slowly, and tell yourself it is okay to feel what you feel.",
  ลม: "🧘 One-minute practice: breathe in for four, hold for four, out for four, hold for four — repeat until the thoughts slow down.",
  ดิน: "🧘 One-minute practice: feet flat on the floor, notice the weight of your body, then write down the smallest next step.",
};

export const MOCK_TIMING: Record<string, Record<Lang, string>> = {
  ไฟ: { th: "ภายใน 1-2 สัปดาห์นี้", en: "within the next one to two weeks" },
  น้ำ: { th: "ภายใน 1 เดือนนี้", en: "within about a month" },
  ลม: { th: "เร็ว ๆ นี้ภายในไม่กี่วัน", en: "within the next few days" },
  ดิน: { th: "ภายใน 1-3 เดือนนี้", en: "over the next one to three months" },
};

export async function* streamMockGeminiReading(
  ctx: ReadingContext,
  reason: MockReason = "all_models_down",
): AsyncGenerator<ReadingEvent> {
  const lang: Lang = ctx.lang === "en" ? "en" : "th";
  const isEn = lang === "en";

  /*
   * 📊 จดสถิติทุกครั้งที่คำอ่านสำรองถึงมือผู้ใช้
   * ทุกเส้นทางล้มเหลวอื่นจด recordEvent ไว้หมด ยกเว้นเส้นนี้ที่มีแค่ console.warn
   * ➔ แผงแอดมินจึงมองไม่เห็นเลยว่าผู้ใช้ได้คำอ่านสำรองบ่อยแค่ไหน
   */
  recordEvents([
    "ai_mock_served",
    `ai_mock_served:${reason}`,
    `ai_mock_served_cards:${ctx.drawn.length}`,
    `ai_mock_served_lang:${lang}`,
  ]);

  const nickname = ctx.nickname?.trim() || (isEn ? "friend" : "ผู้แสวงหาคำตอบ");
  // 🛡️ แทร็ก S/E: คำอ่านสำรองถูกบันทึกลงสมุดดวงด้วย — ซ่อนเบอร์/อีเมล/เลขบัตรเหมือนคำอ่านจากโมเดล (ซึ่งไม่เคยเห็นข้อมูลดิบ)
  const question = redactPii(ctx.question?.trim() ?? "").text || (isEn ? "the road ahead" : "ภาพรวมดวงชะตา");
  const category = (ctx.category || "general") as "general" | "work" | "money" | "love" | "self";
  const voice = resolveVoice(ctx.personaId, lang);

  // ประกอบมุมมองของไพ่แต่ละใบครั้งเดียว — ไพ่ที่หาไม่เจอถูกข้าม ไม่มีการเติมไพ่แทน (กฎเหล็กข้อ 14)
  const views: DrawnView[] = [];
  for (let i = 0; i < ctx.drawn.length; i++) {
    const d = ctx.drawn[i];
    const card = ctx.cards[i];
    if (!card) continue;
    const pos = ctx.spread.positions[d.order];
    const fullPos = pos ? getPositionName(pos, isEn) : isEn ? `Position ${i + 1}` : `ตำแหน่งที่ ${i + 1}`;
    const posMeaning = pos
      ? asClause(getPositionMeaning(pos, isEn), lang)
      : isEn
        ? "the energy held in this position"
        : "พลังงานในตำแหน่งนี้";
    const baseName = isEn ? card.nameEn : card.nameTh;
    views.push({
      order: d.order,
      card,
      isReversed: d.isReversed,
      tone: mockCardTone(card, d.isReversed),
      name: `${baseName}${d.isReversed ? (isEn ? " (reversed)" : " (กลับหัว)") : ""}`,
      pos: shortPositionName(fullPos),
      posMeaning,
    });
  }

  // 1. บทเปิด = คำทักทายตามบุคลิก + ภาพรวมที่นับจากไพ่จริง
  const greeting = voice.greet({ nickname, cards: cardsPhrase(ctx.drawn.length, lang), question });
  const polish = (t: string) => (isEn ? t.trim() : tidyThai(t));
  const opening = polish(views.length > 0 ? `${greeting} ${overallLine(views, lang)}` : greeting);
  yield { type: "opening", text: opening };
  await new Promise((r) => setTimeout(r, 40));

  // 2. คำอ่านรายใบ — สำนวนต้นประโยคตามขั้ว + ความหมายจากสารานุกรม + คำสำคัญ
  const cardsResult = [];
  for (const [i, v] of views.entries()) {
    const orientation = v.isReversed ? "reversed" : "upright";
    const catMeaning = isEn
      ? v.card.meaningsEn?.[category]?.[orientation] || v.card.meaningsEn?.general?.[orientation] || ""
      : v.card.meanings?.[category]?.[orientation] || v.card.meanings?.general?.[orientation] || "";
    const kws = (isEn ? v.card.keywordsEn?.[orientation] || v.card.keywords?.[orientation] : v.card.keywords?.[orientation]) ?? [];
    const variant = (i + v.card.number) % 3;
    const lead = CARD_LEAD[lang][v.tone][variant](v.name, v.pos, positionGist(v.posMeaning, lang));
    const tail = kws[0] ? KEYWORD_TAIL[lang][(variant + 1) % 3](kws[0], kws[1]) : "";
    const reading = polish([lead, catMeaning, tail].filter(Boolean).join(" "));
    const headline = `${v.pos}: ${v.name}`;
    cardsResult.push({ position: v.order, headline, reading });
    yield { type: "card", position: v.order, headline, reading };
    await new Promise((r) => setTimeout(r, 35));
  }

  // 3. ไพ่ทั้งผังคุยกันอย่างไร — เส้นทางต้น➔ปลาย · ไพ่ชุดใหญ่ · ธาตุเด่น · ไพ่กลับหัว
  const built = views.length > 0 ? buildConnections(views, lang) : { text: "", dominantElement: "ดิน", lacking: [] as string[] };
  const { dominantElement, lacking } = built;
  const connections = polish(built.text);
  yield { type: "connections", text: connections };
  await new Promise((r) => setTimeout(r, 30));

  // 4. บทสรุป — โหมดฟันธงต้องขึ้นคำตอบให้ตรงกับ yesNoAnswer เสมอ (กัน YESNO_CONTRADICTION)
  const yesNoAnswer = resolveMockYesNo(ctx);
  const intent = detectIntent(ctx.question ?? "");
  const tone = views.length > 0 ? headingTone(views, lang) : "open";
  // ตอบตรงคำถามก่อน (ถ้ารู้ประเภท) — โหมดใช่/ไม่ใช่มีคำตอบฟันธงขึ้นต้นอยู่แล้ว จึงไม่ซ้อน
  const asksTiming = TIMING_PATTERN.test(ctx.question ?? "");
  const timingText = (MOCK_TIMING[dominantElement] ?? MOCK_TIMING.ดิน)[lang];
  const direct =
    views.length > 0 && !yesNoAnswer
      ? [intent ? INTENT_ANSWER[intent][lang][tone] : "", asksTiming ? TIMING_ANSWER[lang](timingText) : ""]
          .filter(Boolean)
          .join(" ")
      : "";
  const body = views.length > 0 ? buildSummary(views, lang) : "";
  // ประโยคปิด: หมุนจากไพ่ที่จั่ว (ไม่สุ่ม) · 0 = ของบุคลิก
  const seed = ctx.drawn.reduce((sum, d, i) => sum + (d.cardIndex + 1) * (i + 1) + (d.isReversed ? 7 : 0), 0);
  const variants = [voice.close, ...CLOSE_VARIANTS[lang]];
  const close = variants[seed % variants.length];
  let summary = [direct, body, close].filter(Boolean).join(" ");
  if (yesNoAnswer) {
    summary = isEn
      ? `Weighing all ${ctx.drawn.length} cards together for "${question}", the answer is ${YES_NO_EN[yesNoAnswer]}. ${summary}`
      : `ชั่งน้ำหนักไพ่ทั้ง ${ctx.drawn.length} ใบสำหรับ "${question}" แล้ว คำตอบคือ ${yesNoAnswer} ${summary}`;
  }
  summary = polish(summary);
  yield { type: "summary", text: summary };
  await new Promise((r) => setTimeout(r, 30));

  // 5. คำแนะนำ 2 ข้อตามธาตุเด่น + กิจกรรมฝึกสติ 1 นาทีปิดท้าย (schema กำหนดให้ข้อสุดท้ายขึ้นต้นด้วย 🧘)
  const mindful = isEn
    ? MINDFUL_EN[dominantElement] ?? MINDFUL_EN.ดิน
    : generateMindfulMicroRitual(lacking, dominantElement).adviceString;
  // คำแนะนำ: ประเภทคำถาม (ถ้ามีชุดเฉพาะ) ➔ หมวด × ขั้วปลายทาง · ข้อฝึกสติตามธาตุปิดท้ายเหมือนเดิม
  const topical =
    (intent && INTENT_ADVICE[intent]?.[lang]) ??
    (CATEGORY_ADVICE[category] ?? CATEGORY_ADVICE.general)[tone][lang];
  /*
   * คำแนะนำรายใบ (`card-advice.ts`) ของไพ่ที่กำหนดทิศทาง (ปลายทาง · ใบเดียว) — ใช้เฉพาะแถวที่แม่หมอตรวจแล้ว
   * แถว pending ได้ null ➔ เหมือนเดิมทุกอย่าง · คำถามแฟนเก่าไม่ใช้ (ชุดเฉพาะ "เว้นระยะก่อนทัก" ต้องมาก่อนเสมอ)
   */
  const keyView = views.length === 1 ? views[0] : findOutcome(views, lang);
  const cardAdvice =
    keyView && intent !== "ex" ? reviewedCardAdvice(keyView.card.id, keyView.isReversed, lang) : null;
  const adviceList = cardAdvice ? [cardAdvice, topical[0], mindful] : [...topical, mindful];

  const light = views.filter((v) => v.tone === "light").length;
  const shadow = views.filter((v) => v.tone === "shadow").length;

  const finalReading: Reading = {
    opening,
    cards: cardsResult,
    connections,
    summary,
    advice: adviceList,
    // จังหวะจากธาตุเป็นการประมาณ ไม่ใช่คำทำนายวันเวลา — ขึ้นต้นด้วย "อาจ" ไม่ให้อ่านเป็นการฟันธง
    timing: isEn
      ? `Possibly ${(MOCK_TIMING[dominantElement] ?? MOCK_TIMING.ดิน).en}`
      : `อาจเห็นความเคลื่อนไหว${(MOCK_TIMING[dominantElement] ?? MOCK_TIMING.ดิน).th}`,
    // mood เป็น enum ภายในสำหรับเลือกโทนสีหน้าเว็บ ไม่ได้แสดงผลเป็นข้อความ จึงคงค่าไทยไว้ทั้งสองภาษา
    mood: shadow > light ? "ท้าทาย" : light > shadow ? "อบอุ่น" : "ครุ่นคิด",
    yesNoAnswer,
  };

  yield { type: "done", reading: finalReading, usage: DEFAULT_USAGE, model: "mock-gemini", consistencyOk: true };
}
