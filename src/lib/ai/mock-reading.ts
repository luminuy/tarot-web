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
import type { Reading } from "@/lib/schema/reading";
import type { ReadingEvent, UsageInfo } from "@/lib/ai/types";
import { getPositionMeaning, getPositionName } from "@/data/spreads-helpers";
import { recordEvents } from "@/lib/stats/record";
import { generateMindfulMicroRitual } from "@/lib/ai/ritual";
import type { TarotCard } from "@/data/cards/types";

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

/** สำนวนต้นประโยคของแต่ละใบ — 3 แบบต่อขั้ว เลือกด้วยลำดับตำแหน่ง (ไม่สุ่ม) */
type LeadFn = (card: string, pos: string, posMeaning: string) => string;
const CARD_LEAD: Record<Lang, Record<MockTone, LeadFn[]>> = {
  th: {
    light: [
      (c, p, m) => `${c} มาอยู่ในช่อง${p} ซึ่งพูดถึง${m} ไพ่ใบนี้เป็นแรงหนุนที่ชัดเจนสำหรับเรื่องนี้`,
      (c, p, m) => `ช่อง${p}ได้${c} เป็นใบที่เปิดทางให้คุณ ช่องนี้หมายถึง${m}`,
      (c, p, m) => `${c} ในช่อง${p}ส่งสัญญาณดีมาให้ โดยช่องนี้บอกเรื่อง${m}`,
    ],
    shadow: [
      (c, p, m) => `${c} ในช่อง${p} (${m}) เป็นใบที่ชวนให้หยุดดูให้ดีก่อน ไม่ได้แปลว่าไม่มีทาง แต่เป็นจุดที่ต้องใส่ใจเป็นพิเศษ`,
      (c, p, m) => `ช่อง${p}ได้${c} ซึ่งเป็นบทเรียนมากกว่าคำตัดสิน ช่องนี้พูดถึง${m}`,
      (c, p, m) => `${c} มาอยู่ตรงช่อง${p} (${m}) เตือนเบา ๆ ว่ายังมีบางอย่างในส่วนนี้ที่ต้องจัดการ`,
    ],
    open: [
      (c, p, m) => `${c} ในช่อง${p} ยังไม่ชี้ขาดไปทางใดทางหนึ่ง ช่องนี้พูดถึง${m} ผลจึงขึ้นกับการเลือกของคุณเองมาก`,
      (c, p, m) => `ช่อง${p}ได้${c} เป็นใบที่เปิดให้คุณเป็นคนกำหนด ช่องนี้หมายถึง${m}`,
      (c, p, m) => `${c} ในช่อง${p} (${m}) บอกว่าเรื่องนี้ยังเปลี่ยนได้ ขึ้นอยู่กับสิ่งที่คุณทำจากนี้`,
    ],
  },
  en: {
    light: [
      (c, p, m) => `${c} lands in ${p} — ${m} — and it is a clear source of support here.`,
      (c, p, m) => `${p} draws ${c}, a card that opens the way for you. This position speaks to ${m}.`,
      (c, p, m) => `${c} in ${p} sends a good signal; this position is about ${m}.`,
    ],
    shadow: [
      (c, p, m) => `${c} in ${p} (${m}) asks you to slow down and look closely. It does not close the door, but this is where your attention matters most.`,
      (c, p, m) => `${p} draws ${c} — more a lesson than a verdict. This position speaks to ${m}.`,
      (c, p, m) => `${c} sits in ${p} (${m}), a gentle warning that something here still needs work.`,
    ],
    open: [
      (c, p, m) => `${c} in ${p} does not lean either way. This position speaks to ${m}, so a lot depends on what you choose.`,
      (c, p, m) => `${p} draws ${c}, a card that leaves the decision with you. This position is about ${m}.`,
      (c, p, m) => `${c} in ${p} (${m}) says this part can still change, depending on what you do next.`,
    ],
  },
};

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
 * ใช้ค่า `yesNo` ที่ผูกไว้กับไพ่ทั้ง 78 ใบในสารานุกรม (ข้อมูลชุดเดียวกับที่ส่งให้
 * โมเดลจริงอ่าน) ไพ่กลับหัวสลับขั้ว yes↔no ส่วน maybe คงเดิม แล้วรวมคะแนนทั้งผัง
 * — ไม่ใช่การเดาและไม่ได้สร้างข้อมูลใหม่ขึ้นเอง
 *
 * เดิมคืน `null` เสมอ ➔ ผัง `yes-no` ที่ตกมาถึงคำอ่านสำรองจะไม่มีคำตอบให้ผู้ใช้เลย
 * เพราะ UI ซ่อนชิปคำตอบเมื่อค่าเป็น null (StreamReader.tsx)
 */
function resolveMockYesNo(ctx: ReadingContext): "ใช่" | "ไม่ใช่" | "ยังไม่แน่" | null {
  if (!ctx.spread.yesNoMode) return null;
  let score = 0;
  for (let i = 0; i < ctx.drawn.length; i++) {
    const card = ctx.cards[i];
    if (!card) continue;
    const polarity = card.yesNo === "yes" ? 1 : card.yesNo === "no" ? -1 : 0;
    score += ctx.drawn[i].isReversed ? -polarity : polarity;
  }
  return score > 0 ? "ใช่" : score < 0 ? "ไม่ใช่" : "ยังไม่แน่";
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
  const question = ctx.question?.trim() || (isEn ? "the road ahead" : "ภาพรวมดวงชะตา");
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
    const lead = CARD_LEAD[lang][v.tone][variant](v.name, v.pos, v.posMeaning);
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
  const body = views.length > 0 ? buildSummary(views, lang) : "";
  let summary = [body, voice.close].filter(Boolean).join(" ");
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
  const adviceList = [...(MOCK_ADVICE[dominantElement] ?? MOCK_ADVICE.ดิน)[lang], mindful];

  const light = views.filter((v) => v.tone === "light").length;
  const shadow = views.filter((v) => v.tone === "shadow").length;

  const finalReading: Reading = {
    opening,
    cards: cardsResult,
    connections,
    summary,
    advice: adviceList,
    timing: (MOCK_TIMING[dominantElement] ?? MOCK_TIMING.ดิน)[lang],
    // mood เป็น enum ภายในสำหรับเลือกโทนสีหน้าเว็บ ไม่ได้แสดงผลเป็นข้อความ จึงคงค่าไทยไว้ทั้งสองภาษา
    mood: shadow > light ? "ท้าทาย" : light > shadow ? "อบอุ่น" : "ครุ่นคิด",
    yesNoAnswer,
  };

  yield { type: "done", reading: finalReading, usage: DEFAULT_USAGE, model: "mock-gemini", consistencyOk: true };
}
