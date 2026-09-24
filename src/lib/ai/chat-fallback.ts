/**
 * ✦ คำตอบสำรองของแชทถามต่อ (ตอน Groq + Gemini ไม่ว่างทั้งคู่)
 * ---------------------------------------------------------------------------
 * ยกเครื่อง 2026-09-24 (คำสั่งเจ้าของ "ทำให้ครบ") — ของเดิมใน `chat/route.ts` มีปัญหา:
 *   · ดูแค่ไพ่ใบแรกของผัง ใบอื่นไม่ถูกพูดถึงเลย
 *   · มีประโยคกุข้อมูล: "สัญญาณบวกแรกภายใน 7 วัน" · "ทิศทางโดยรวมเป็นบวก" · "ระวังเรื่องสุขภาพ"
 *     ทั้งที่ไม่ได้มาจากไพ่หรือคำอ่านเลย
 *   · จับคำว่า "ใจ" เป็นเรื่องความรัก (ตัดสินใจ / ใจเย็น ก็กลายเป็นคำถามความรัก)
 *   · ฝั่งอังกฤษมีแค่ 5 ประโยคตามบุคลิก ไม่ดูว่าถามอะไร
 *   · ไม่ใช้คำอ่านที่ผู้ใช้เพิ่งได้ (`record.result` — กรอบเวลา · คำแนะนำ · คำอ่านรายใบ) ทั้งที่มีอยู่
 *
 * ตอนนี้ทุกคำตอบอ้างของจริงเท่านั้น: ไพ่ที่เปิด (ชื่อ + ช่อง + หัวตั้ง/กลับหัว) · ความหมายจากสารานุกรม
 * ตามหมวดคำถาม · และคำอ่านจริงของผู้ใช้ถ้ามี — ไม่ยกคำถามดิบของผู้ใช้มาพูดซ้ำ (T-43)
 * หน้าเว็บติดป้ายว่าเป็นคำตอบสำรองอยู่แล้ว (เซิร์ฟเวอร์ส่ง `fallback: true`)
 */
import { cardByIndex } from "@/data/cards";
import type { TarotCard } from "@/data/cards/types";
import { getSpread } from "@/data/spreads";
import { getPositionName } from "@/data/spreads-helpers";
import { MOCK_ADVICE, MOCK_TIMING, mockCardTone, shortPositionName, type MockTone } from "@/lib/ai/mock-reading";
import type { Reading } from "@/lib/schema/reading";

type Lang = "th" | "en";

export interface ChatFallbackInput {
  userQuestion: string;
  personaId: string;
  lang: Lang;
  record: {
    drawn?: Array<{ order: number; cardIndex: number; isReversed: boolean }>;
    spreadId?: string;
    category?: string;
    result?: Partial<Reading>;
  };
}

export type ChatIntent = "card" | "timing" | "caution" | "action" | "summary" | "yesno" | "love" | "general";

interface View {
  order: number;
  card: TarotCard;
  isReversed: boolean;
  tone: MockTone;
  name: string;
  pos: string;
}

const VOICE: Record<string, Record<Lang, { lead: string; tail: string }>> = {
  warm: {
    th: { lead: "แม่หมอดูจากไพ่ที่คุณเปิดไว้แล้วนะคะ", tail: "ค่อย ๆ ไปทีละก้าวนะคะ" },
    en: { lead: "Looking back at the cards you opened:", tail: "Take it one gentle step at a time." },
  },
  playful: {
    th: { lead: "ตอบจากไพ่ของคุณตรง ๆ เลยนะ", tail: "ไม่ต้องเครียด ค่อย ๆ ลุยไป" },
    en: { lead: "Straight from your cards:", tail: "No stress, one step at a time." },
  },
  direct: {
    th: { lead: "ตอบตรง ๆ จากไพ่ของคุณ", tail: "ตัดสินใจจากสิ่งที่เห็นตรงหน้า" },
    en: { lead: "Straight answer from your cards:", tail: "Decide on what is in front of you." },
  },
  master: {
    th: { lead: "อาจารย์ขอตอบจากไพ่ในผังนะครับ", tail: "ขอให้ตัดสินใจจากข้อเท็จจริงครับ" },
    en: { lead: "Reading from the cards in your spread:", tail: "Decide from evidence, not mood." },
  },
  mystic: {
    th: { lead: "ไพ่ของคุณสะท้อนกลับมาว่า", tail: "จงวางใจในเส้นทางของตนเอง" },
    en: { lead: "Your cards reflect back:", tail: "Trust the path you are walking." },
  },
};

const INTENT_PATTERNS: Array<[ChatIntent, RegExp]> = [
  ["timing", /เมื่อไหร่|เมื่อไร|ตอนไหน|กี่วัน|กี่เดือน|กี่ปี|นานไหม|นานแค่ไหน|เร็วไหม|\bwhen\b|how long|how soon/i],
  ["caution", /ระวัง|กังวล|กลัว|ข้อเสีย|อุปสรรค|\brisk|worr|careful|avoid|watch out/i],
  ["action", /แก้|ทำไง|ทำยังไง|ทำอย่างไร|ยังไงดี|อย่างไรดี|ทำอะไรดี|ทางออก|ควรทำ|เริ่มยังไง|ทำตัว|what should|how do i|how can i|advice|what can i do/i],
  // ต้องมาก่อน yes/no — "สรุปอีกทีได้ไหม" ลงท้าย "ไหม" แต่ไม่ได้ถามใช่/ไม่ใช่
  ["summary", /สรุป|ภาพรวม|อีกที|summar|overall|recap|in short/i],
  ["yesno", /ไหม|มั้ย|หรือเปล่า|รึเปล่า|หรือไม่|^(will|should|is|does|do|can|am|are)\b/i],
  // ⚠️ ห้ามจับ "ใจ" เฉย ๆ — "ตัดสินใจ" / "ใจเย็น" ไม่ใช่เรื่องความรัก (บั๊กเดิม)
  ["love", /รัก|แฟน|คนคุย|คนรัก|แต่งงาน|คืนดี|หัวใจ|\blove|partner|relationship|crush|\bex\b|dating/i],
];

export function detectChatIntent(question: string, views: Pick<View, "card" | "pos">[] = []): ChatIntent {
  const q = question.trim();
  const lower = q.toLowerCase();
  if (views.some((v) => q.includes(v.card.nameTh) || lower.includes(v.card.nameEn.toLowerCase()) || (v.pos.length >= 3 && q.includes(v.pos)))) {
    return "card";
  }
  if (/ใบที่\s*\d+|card\s*#?\d+/i.test(q)) return "card";
  for (const [intent, re] of INTENT_PATTERNS) if (re.test(q)) return intent;
  return "general";
}

/** ตัดข้อความยาวที่ขอบคำ (ช่องว่าง) — ห้ามตัดกลางคลัสเตอร์อักษรไทย (INC-0213) */
function clip(text: string, max = 260): string {
  const t = text.trim();
  if (t.length <= max) return t;
  const cut = t.lastIndexOf(" ", max);
  return `${t.slice(0, cut > max * 0.5 ? cut : max).trim()} …`;
}

function tidyThai(text: string): string {
  return text.replace(/\)(?=[฀-๿])/g, ") ").replace(/\s{2,}/g, " ").trim();
}

/**
 * หมวดของ "คำถามในแชท" — คนถามต่อข้ามหมวดได้ (เปิดไพ่เรื่องความรัก แล้วถามต่อเรื่องงาน)
 * ถ้าไม่ดูตรงนี้ คำถามเรื่องงานจะได้ความหมายหมวดความรักของไพ่มาตอบ
 */
function questionCategory(question: string, fallback: string): string {
  if (/งาน|อาชีพ|เจ้านาย|ออฟฟิศ|สัมภาษณ์|ลาออก|ธุรกิจ|job|work|career|boss|interview|business/i.test(question)) return "work";
  if (/เงิน|การเงิน|หนี้|ลงทุน|รายได้|money|financ|debt|invest|income/i.test(question)) return "money";
  if (/รัก|แฟน|คนคุย|คนรัก|แต่งงาน|คืนดี|love|partner|relationship|crush|dating/i.test(question)) return "love";
  return fallback;
}

function meaningOf(v: View, category: string, lang: Lang): string {
  const o = v.isReversed ? "reversed" : "upright";
  const m = lang === "en" ? v.card.meaningsEn : v.card.meanings;
  return (m as Record<string, { upright: string; reversed: string }> | undefined)?.[category]?.[o] ?? m?.general?.[o] ?? "";
}

function keywordOf(v: View, lang: Lang): string {
  const o = v.isReversed ? "reversed" : "upright";
  return ((lang === "en" ? v.card.keywordsEn?.[o] : undefined) ?? v.card.keywords[o])?.[0] ?? "";
}

function findTargetCard(question: string, views: View[]): View | undefined {
  const lower = question.toLowerCase();
  const byName = views.find((v) => question.includes(v.card.nameTh) || lower.includes(v.card.nameEn.toLowerCase()));
  if (byName) return byName;
  const num = question.match(/ใบที่\s*(\d+)|card\s*#?(\d+)/i);
  if (num) return views[Number(num[1] ?? num[2]) - 1];
  return views.find((v) => v.pos.length >= 3 && question.includes(v.pos));
}

const OUTCOME_POS = /ผลลัพธ์|อนาคต|ปลายทาง|แนวโน้ม|บทสรุป|คำตอบ|outcome|future|result|trajectory|answer/i;

export function buildOfflineChatReply(input: ChatFallbackInput): string {
  const { userQuestion, personaId, lang, record } = input;
  const isEn = lang === "en";
  const voice = (VOICE[personaId] ?? VOICE.warm)[lang];
  const category = questionCategory(userQuestion, record.category || "general");
  const spread = record.spreadId ? getSpread(record.spreadId) : undefined;

  const views: View[] = [...(record.drawn ?? [])]
    .sort((a, b) => a.order - b.order)
    .flatMap((d, i) => {
      const card = cardByIndex(d.cardIndex);
      if (!card) return []; // กฎเหล็กข้อ 14 — ห้ามเดาใบแทน
      const pos = spread?.positions[d.order];
      const fullPos = pos ? getPositionName(pos, isEn) : isEn ? `Card ${i + 1}` : `ใบที่ ${i + 1}`;
      const base = isEn ? card.nameEn : card.nameTh;
      return [{
        order: d.order,
        card,
        isReversed: d.isReversed,
        tone: mockCardTone(card, d.isReversed),
        name: `${base}${d.isReversed ? (isEn ? " (reversed)" : " (กลับหัว)") : ""}`,
        pos: shortPositionName(fullPos),
      }];
    });

  // ไม่มีไพ่ให้อ้าง = บอกตรง ๆ ให้โหลดใหม่ ห้ามแต่งคำตอบลอย ๆ (กฎเหล็กข้อ 14)
  if (views.length === 0) {
    return isEn
      ? "I can't see the cards from this reading right now, so I would rather not guess. Please reload the reading and ask again."
      : "ตอนนี้ยังมองไม่เห็นไพ่ของคำอ่านนี้ จึงไม่ขอเดาคำตอบให้นะ ลองโหลดคำอ่านใหม่แล้วถามอีกครั้งได้เลย";
  }

  const result = record.result;
  const outcome = [...views].reverse().find((v) => OUTCOME_POS.test(v.pos)) ?? views[views.length - 1];
  const elementCount: Record<string, number> = { ไฟ: 0, น้ำ: 0, ลม: 0, ดิน: 0 };
  for (const v of views) if (v.card.element in elementCount) elementCount[v.card.element]++;
  const dominant = Object.entries(elementCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "ดิน";
  const intent = detectChatIntent(userQuestion, views);
  let body = "";

  switch (intent) {
    case "card": {
      const v = findTargetCard(userQuestion, views) ?? views[0];
      const fromResult = result?.cards?.find((c) => c.position === v.order)?.reading;
      body = isEn
        ? `${v.name} in ${v.pos}: ${clip(fromResult || meaningOf(v, category, lang))}`
        : `${v.name}ในช่อง${v.pos}: ${clip(fromResult || meaningOf(v, category, lang))}`;
      break;
    }
    case "timing": {
      body = result?.timing
        ? isEn
          ? `The timeframe your reading gave is ${result.timing}, as a rough guide rather than a fixed date.`
          : `กรอบเวลาที่คำอ่านของคุณบอกไว้คือ ${result.timing} เป็นการประมาณ ไม่ใช่วันที่ตายตัว`
        : isEn
          ? `Going by the strongest element in your spread, things are likely to move ${MOCK_TIMING[dominant]?.en ?? MOCK_TIMING.ดิน.en} — a rough guide, not a fixed date.`
          : `ดูจากธาตุ${dominant}ที่เด่นในผัง เรื่องนี้น่าจะเริ่มขยับ${MOCK_TIMING[dominant]?.th ?? MOCK_TIMING.ดิน.th} เป็นการประมาณ ไม่ใช่วันที่ตายตัว`;
      body += isEn
        ? ` ${outcome.name} in ${outcome.pos} sets the pace: "${keywordOf(outcome, lang)}".`
        : ` ไพ่ที่กำหนดจังหวะคือ${outcome.name}ในช่อง${outcome.pos} ใจความคือ "${keywordOf(outcome, lang)}"`;
      break;
    }
    case "caution": {
      const watch = views.find((v) => v.tone === "shadow");
      body = watch
        ? isEn
          ? `The card that carries the warning is ${watch.name} in ${watch.pos}. ${clip(meaningOf(watch, category, lang), 220)}`
          : `ไพ่ที่เตือนไว้คือ${watch.name}ในช่อง${watch.pos} ${clip(meaningOf(watch, category, lang), 220)}`
        : isEn
          ? `None of your cards carries a strong warning. The thing to keep an eye on is "${keywordOf(views[0], lang)}" from ${views[0].name}.`
          : `ไพ่ชุดนี้ไม่มีใบไหนเตือนแรง ๆ สิ่งที่ควรใส่ใจคือ "${keywordOf(views[0], lang)}" จาก${views[0].name}`;
      break;
    }
    case "action": {
      const advice = (result?.advice ?? []).filter((a) => !a.includes("🧘")).slice(0, 2);
      const list = advice.length > 0 ? advice : (MOCK_ADVICE[dominant] ?? MOCK_ADVICE.ดิน)[lang];
      body = isEn
        ? `From ${advice.length > 0 ? "your reading" : `the ${dominant === "ไฟ" ? "Fire" : dominant === "น้ำ" ? "Water" : dominant === "ลม" ? "Air" : "Earth"} energy in your spread`}, two things you can do now: 1) ${list[0]} 2) ${list[1] ?? ""}`.trim()
        : `สิ่งที่ทำได้เลยจาก${advice.length > 0 ? "คำอ่านของคุณ" : `ธาตุ${dominant}ที่เด่นในผัง`} มีสองข้อ 1) ${list[0]} 2) ${list[1] ?? ""}`.trim();
      // คำแนะนำต้องยึดกับไพ่ที่เปิดจริงเสมอ — ชี้ใบที่เป็นตัวช่วยให้เห็นว่ามาจากไหน
      {
        const ally = views.find((v) => v.tone === "light") ?? outcome;
        body += isEn
          ? ` The card backing you up here is ${ally.name} in ${ally.pos}: "${keywordOf(ally, lang)}".`
          : ` ใบที่เป็นตัวช่วยของคุณคือ${ally.name}ในช่อง${ally.pos} ใจความคือ "${keywordOf(ally, lang)}"`;
      }
      break;
    }
    case "yesno": {
      let score = 0;
      for (const v of views) score += v.tone === "light" ? 1 : v.tone === "shadow" ? -1 : 0;
      const verdict =
        score > 0
          ? isEn ? "leaning yes" : 'เอนไปทาง "ใช่"'
          : score < 0
            ? isEn ? "leaning no" : 'เอนไปทาง "ไม่ใช่"'
            : isEn ? "not settled yet" : "ยังไม่ชี้ขาด";
      const key = views.find((v) => (score >= 0 ? v.tone === "light" : v.tone === "shadow")) ?? outcome;
      body = isEn
        ? `Weighing the cards you opened, the answer is ${verdict}. The card tipping the balance is ${key.name} in ${key.pos}: "${keywordOf(key, lang)}".`
        : `ชั่งน้ำหนักจากไพ่ที่เปิดไว้ คำตอบ${verdict} ใบที่ทำให้ตาชั่งเอียงคือ${key.name}ในช่อง${key.pos} ใจความคือ "${keywordOf(key, lang)}"`;
      break;
    }
    case "love": {
      const v = outcome;
      const love = meaningOf(v, "love", lang);
      body = isEn
        ? `On the relationship side, ${v.name} in ${v.pos} says: ${clip(love)}`
        : `ในมุมความรัก ${v.name}ในช่อง${v.pos} บอกว่า ${clip(love)}`;
      break;
    }
    case "summary":
    default: {
      body = result?.summary
        ? clip(result.summary, 300)
        : isEn
          ? `The card speaking loudest for this is ${outcome.name} in ${outcome.pos}: ${clip(meaningOf(outcome, category, lang), 220)}`
          : `ไพ่ที่พูดถึงเรื่องนี้ชัดที่สุดคือ${outcome.name}ในช่อง${outcome.pos} ${clip(meaningOf(outcome, category, lang), 220)}`;
    }
  }

  const reply = `${voice.lead} ${body} ${voice.tail}`;
  return isEn ? reply.replace(/\s{2,}/g, " ").trim() : tidyThai(reply);
}
