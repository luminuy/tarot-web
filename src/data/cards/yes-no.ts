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
        body = `In reverse, the themes of ${kwStr} amplify underlying stagnation or strain, reinforcing a signal to pause and reconsider.`;
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
  const kwStr = kwList.join(", ");
  const rawCondition = isUpright ? card.meanings.general.upright : card.meanings.general.reversed;
  const condition = extractFirstSentence(rawCondition, false);

  const headline = isUpright
    ? `ไพ่ ${card.nameTh} ใช่หรือไม่ — ${tone.labelTh}`
    : `ไพ่ ${card.nameTh} (กลับหัว) ใช่หรือไม่ — ${tone.labelTh} (มีเงื่อนไข)`;

  let body = "";
  if (isUpright) {
    if (card.yesNo === "yes") {
      body = `ด้วยพลังงานหลักของ ${kwStr} ไพ่ใบนี้สะท้อนโอกาสแห่งความสำเร็จที่สดใสและมีแนวโน้มเชิงบวก`;
    } else if (card.yesNo === "no") {
      body = `พลังงานของ ${kwStr} ชี้ให้เห็นถึงความท้าทายหรือความเสี่ยง จึงควรระมัดระวังและไม่ควรผลีผลาม`;
    } else {
      body = `สัญลักษณ์ของ ${kwStr} บอกว่าสถานการณ์ยังคงหมุนเวียน ผลลัพธ์จำเป็นต้องอาศัยการประเมินอย่างรอบคอบ`;
    }
  } else {
    if (card.yesNo === "yes") {
      body = `แม้ไพ่จะเอนไปทางใช่ แต่ในตำแหน่งกลับหัว พลังของ ${kwStr} เตือนว่าอาจมีความล่าช้าหรือการติดขัดภายในที่ต้องเคลียร์ก่อน`;
    } else if (card.yesNo === "no") {
      body = `ในตำแหน่งกลับหัว พลังของ ${kwStr} ย้ำชัดถึงความตึงเครียดหรือการยึดติด ควรปล่อยวางหรือเปลี่ยนทิศทาง`;
    } else {
      body = `ตำแหน่งกลับหัวพร้อมพลังของ ${kwStr} สื่อถึงความลังเลหรือไม่แน่ชัด ควรหยุดนิ่งเพื่อสร้างความชัดเจน`;
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
