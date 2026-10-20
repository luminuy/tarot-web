import type { TarotCard, YesNo } from "./types";
import { CARD_KEYWORDS_EN } from "./keywords-en";
import { CARD_MEANINGS_EN } from "./meanings-en";

export interface YesNoTone {
  labelTh: string;
  labelEn: string;
  leadTh: string;
  leadEn: string;
  badgeClass: string;
}

/** โทนของคำตอบแต่ละแบบ — ใช้กับหัวข้อและสีในเซกชัน "ใช่หรือไม่" */
export const YES_NO_TONE: Record<YesNo, YesNoTone> = {
  yes: {
    labelTh: "เอนไปทางใช่",
    labelEn: "Leaning Yes",
    leadTh: "แนวโน้มเชิงบวกและมีพลังเกื้อหนุน",
    leadEn: "Strong positive momentum and favorable alignment",
    badgeClass: "border-ok/40 bg-[#EBF3ED] text-ok",
  },
  no: {
    labelTh: "เอนไปทางไม่ใช่",
    labelEn: "Leaning No",
    leadTh: "มีอุปสรรค แรงต้าน หรือควรระมัดระวัง",
    leadEn: "Obstacles, friction, or caution advised",
    badgeClass: "border-err/40 bg-err-wash text-err",
  },
  maybe: {
    labelTh: "ยังไม่ชี้ขาด",
    labelEn: "Undecided / Neutral",
    leadTh: "ขึ้นอยู่กับการตัดสินใจและจังหวะเวลา",
    leadEn: "Outcome hinges upon deliberate choices and timing",
    badgeClass: "border-line bg-inset text-gold-ink",
  },
};

export interface YesNoAnswer {
  verdict: YesNo;
  verdictLabel: string;
  headline: string;
  body: string;
  condition: string;
}

function extractFirstSentence(text: string | undefined, isEnglish: boolean): string {
  if (!text) return "";
  if (isEnglish) {
    const parts = text.split(".");
    return parts[0] ? `${parts[0].trim()}.` : text;
  }
  const parts = text.split("·");
  return parts[0] ? parts[0].trim() : text;
}

/**
 * ประกอบคำตอบ Yes/No จากข้อมูลที่มีอยู่จริงในสำรับ 1909 RWS เท่านั้น
 * ⚠️ ห้ามคืนค่าที่ไม่ได้มาจาก card.* — ปฏิบัติตามกฎเหล็ก Zero Fabricated Cards
 * ⚠️ isUpright=false ไม่กลับ verdict แต่เปลี่ยน body/condition เป็นเวอร์ชันหัวกลับ
 */
export function buildYesNoAnswer(card: TarotCard, isUpright: boolean, isEnglish: boolean): YesNoAnswer {
  const tone = YES_NO_TONE[card.yesNo];
  const verdictLabel = isEnglish ? tone.labelEn : tone.labelTh;

  if (isEnglish) {
    const kwDict = CARD_KEYWORDS_EN[card.id];
    const kwList = isUpright
      ? (kwDict?.upright ?? card.keywords.upright).slice(0, 3)
      : (kwDict?.reversed ?? card.keywords.reversed).slice(0, 3);
    const kwStr = kwList.join(", ");

    const enMeanings = CARD_MEANINGS_EN[card.id]?.meanings.general;
    const rawCondition = isUpright ? enMeanings?.upright : enMeanings?.reversed;
    const condition = extractFirstSentence(rawCondition, true);

    const headline = isUpright
      ? `Is ${card.nameEn} Yes or No? — ${tone.labelEn}`
      : `Is Reversed ${card.nameEn} Yes or No? — ${tone.labelEn} (With Nuance)`;

    let body = "";
    if (isUpright) {
      if (card.yesNo === "yes") {
        body = `Carrying the primary archetypal energies of ${kwStr}, this card indicates a favorable outcome and promising momentum.`;
      } else if (card.yesNo === "no") {
        body = `Embodying the themes of ${kwStr}, this card counsels caution, reflecting potential resistance or misaligned timing.`;
      } else {
        body = `Reflecting the qualities of ${kwStr}, the outcome remains in flux, depending strongly on conscious balance and personal choices.`;
      }
    } else {
      if (card.yesNo === "yes") {
        body = `While the foundational energy leans positive, the reversed posture through ${kwStr} suggests delays, internal doubt, or friction before manifestation.`;
      } else if (card.yesNo === "no") {
        body = `Reversed, with themes of ${kwStr}, the answer still leans no but more softly: a moment to step back and regroup before acting.`;
      } else {
        body = `The reversed posture along with ${kwStr} highlights confusion or hesitance, indicating answers will emerge once clarity is restored.`;
      }
    }

    return {
      verdict: card.yesNo,
      verdictLabel,
      headline,
      body,
      condition,
    };
  }

  // Thai Locale
  const kwList = isUpright ? card.keywords.upright.slice(0, 3) : card.keywords.reversed.slice(0, 3);
  // ภาษาไทยไม่คั่นด้วยจุลภาค — "ก ข และค" (B1 2026-10-20)
  const kwStr = kwList.length > 1 ? `${kwList.slice(0, -1).join(" ")} และ${kwList[kwList.length - 1]}` : (kwList[0] ?? "");
  const rawCondition = isUpright ? card.meanings.general.upright : card.meanings.general.reversed;
  const condition = extractFirstSentence(rawCondition, false);

  const headline = isUpright
    ? `ไพ่ ${card.nameTh} ใช่หรือไม่ — ${tone.labelTh}`
    : `ไพ่ ${card.nameTh} (กลับหัว) ใช่หรือไม่ — ${tone.labelTh} (มีเงื่อนไข)`;

  /*
   * กลับหัวไม่กลับขั้ว แค่แรงลดลง (`yesNoWeight`) — ประโยคต้องไม่ตีค่าคีย์เวิร์ดกลับหัวว่าดี/ร้าย
   * เดิมเขียน "ย้ำชัดถึงความตึงเครียด" ทั้งที่คีย์เวิร์ดกลับหัวของไพ่ฝั่ง "ไม่ใช่" มักเป็นการฟื้นตัว
   * (เช่น ห้าแห่งถ้วยกลับหัว = เริ่มก้าวข้าม ให้อภัย) — หน้าไพ่ขัดกับตัวเอง (B1 2026-10-20)
   */
  let body = "";
  if (isUpright) {
    if (card.yesNo === "yes") {
      body = `ไพ่ใบนี้พูดถึง${kwStr} เป็นพลังที่หนุนให้เรื่องเดินหน้า คำตอบจึงเอนไปทางใช่`;
    } else if (card.yesNo === "no") {
      body = `ไพ่ใบนี้พูดถึง${kwStr} บอกว่าเรื่องนี้ยังมีแรงต้านหรือจังหวะยังไม่เหมาะ คำตอบจึงเอนไปทางไม่ใช่ ค่อย ๆ ไปอย่างระวัง`;
    } else {
      body = `ไพ่ใบนี้พูดถึง${kwStr} ผลยังไม่นิ่ง ขึ้นอยู่กับการตัดสินใจของคุณจากนี้`;
    }
  } else {
    if (card.yesNo === "yes") {
      body = `ตอนกลับหัว ไพ่ใบนี้พูดถึง${kwStr} คำตอบยังเอนไปทางใช่ แต่อาจช้ากว่าที่หวัง หรือมีเรื่องในใจที่ต้องเคลียร์ก่อน`;
    } else if (card.yesNo === "no") {
      body = `ตอนกลับหัว ไพ่ใบนี้พูดถึง${kwStr} คำตอบยังเอนไปทางไม่ใช่แต่เบาลง เป็นช่วงให้ถอยมาตั้งหลักก่อนลงมือ`;
    } else {
      body = `ตอนกลับหัว ไพ่ใบนี้พูดถึง${kwStr} ภาพยังไม่ชัด รอให้ใจนิ่งและข้อมูลครบก่อนค่อยตัดสินใจ`;
    }
  }

  return {
    verdict: card.yesNo,
    verdictLabel,
    headline,
    body,
    condition,
  };
}

/** ค่าฟันธงที่ schema คำอ่านเก็บ (ไทยเสมอ — ฝั่งแสดงผลแปลงเป็นอังกฤษเอง) */
export type YesNoVerdictTh = "ใช่" | "ไม่ใช่" | "ยังไม่แน่";

/**
 * น้ำหนัก ใช่/ไม่ใช่ ของไพ่หนึ่งใบ — **กติกาเดียวกับหน้าสารานุกรม** (`buildYesNoAnswer`)
 * หัวตั้ง: yes = +1 · no = −1 · maybe = 0
 * กลับหัว: **ไม่กลับขั้ว** แต่แรงลดลงครึ่งหนึ่ง (หน้าสารานุกรมเขียนว่า "มีเงื่อนไข" — ล่าช้า/ติดขัดก่อนเป็นจริง)
 *
 * เดิมคำอ่านสำรองกลับขั้วไพ่กลับหัว (yes ➔ no) ขณะที่หน้า `/cards/<id>` ไม่กลับ
 * ผู้ใช้จึงเห็นคำตอบสองแบบสำหรับไพ่ใบเดียวกัน (ISSUE-054)
 */
export function yesNoWeight(card: Pick<TarotCard, "yesNo">, isReversed: boolean): number {
  const polarity = card.yesNo === "yes" ? 1 : card.yesNo === "no" ? -1 : 0;
  return isReversed ? polarity * 0.5 : polarity;
}

/** ใบในตำแหน่งแรกของผังใช่/ไม่ใช่คือ "คำตอบสรุป" — นับน้ำหนักสองเท่า */
const YES_NO_ANCHOR_WEIGHT = 2;

/**
 * รวมน้ำหนักทั้งผังเป็นคำตอบเดียว — ใช้ร่วมกันทั้งคำอ่านสำรองและบล็อกหลักฐานใน prompt ของ AI
 * ±1 ขึ้นไป = ใช่/ไม่ใช่ · ระหว่างนั้น = ยังไม่แน่
 */
export function tallyYesNo(
  items: Array<{ card: Pick<TarotCard, "yesNo">; isReversed: boolean }>,
): { verdict: YesNoVerdictTh; score: number } {
  let score = 0;
  items.forEach(({ card, isReversed }, i) => {
    score += yesNoWeight(card, isReversed) * (i === 0 ? YES_NO_ANCHOR_WEIGHT : 1);
  });
  const verdict: YesNoVerdictTh = score >= 1 ? "ใช่" : score <= -1 ? "ไม่ใช่" : "ยังไม่แน่";
  return { verdict, score };
}
