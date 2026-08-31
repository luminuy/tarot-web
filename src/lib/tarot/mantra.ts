import type { TarotCard } from "@/data/cards/types";
import type { DrawnCard } from "@/lib/tarot/shuffle";

export interface SacredMantra {
  quoteTh: string;
  sourceCard: TarotCard;
  powerWord: string;
  affirmationTh: string;
  elementSymbol: string;
}

const ELEMENT_SYMBOLS: Record<string, string> = {
  "ไฟ": "🔥 ธาตุไฟ · พลังแห่งการสร้างสรรค์",
  "น้ำ": "💧 ธาตุน้ำ · พลังแห่งปัญญาญาณและหัวใจ",
  "ลม": "🌪️ ธาตุลม · พลังแห่งความจริงและความชัดเจน",
  "ดิน": "🌍 ธาตุดิน · พลังแห่งความมั่นคงและอุดมสมบูรณ์",
};

/**
 * สกัดคำคมพลังใจศักดิ์สิทธิ์ (Sacred Oracle Mantra) ประจำรอบการเปิดไพ่
 */
export function generateSacredMantra(cards: TarotCard[], drawn?: DrawnCard[]): SacredMantra {
  if (!cards || cards.length === 0) {
    return {
      quoteTh: "ชะตาชีวิตอยู่ในกำมือของคุณ ทุกการตัดสินใจในวันนี้คือการสร้างอนาคต",
      sourceCard: {
        id: "major-00",
        nameTh: "เดอะฟูล",
        nameEn: "The Fool",
        element: "ลม",
      } as TarotCard,
      powerWord: "ความกล้าหาญ",
      affirmationTh: "ฉันพร้อมก้าวสู่บทใหม่ของชีวิตด้วยหัวใจที่เปิดกว้าง",
      elementSymbol: "🌪️ ธาตุลม · พลังแห่งการเริ่มต้นใหม่",
    };
  }

  // ค้นหาไพ่ที่มีพลังเชิงบวกสูงสุด หรือไพ่หลักในผัง
  let chosenIndex = 0;
  let maxScore = -1;

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const isReversed = drawn && drawn[i] ? drawn[i].isReversed : false;
    let score = 5;

    if (card.arcana === "major") score += 3;
    if (card.yesNo === "yes") score += 2;
    if (!isReversed) score += 2;
    if (card.id === "major-19" || card.id === "major-17" || card.id === "major-21" || card.id === "major-01" || card.id === "major-03") {
      score += 5; // The Sun, The Star, The World, The Magician, The Empress
    }

    if (score > maxScore) {
      maxScore = score;
      chosenIndex = i;
    }
  }

  const chosenCard = cards[chosenIndex];
  const isReversed = drawn && drawn[chosenIndex] ? drawn[chosenIndex].isReversed : false;
  const keywords = isReversed ? chosenCard.keywords.reversed : chosenCard.keywords.upright;
  const powerWord = keywords[0] || "ปัญญาญาณ";

  // คัดสรร Mantra ตามธาตุและพลังของไพ่
  const element = chosenCard.element || "ลม";
  const elementSymbol = ELEMENT_SYMBOLS[element] || "✦ พลังจักรวาล";

  let quoteTh = "";
  let affirmationTh = "";

  switch (element) {
    case "ไฟ":
      quoteTh = `"เมื่อไฟแห่งความเชื่อมั่นลุกโชน ไม่มีอุปสรรคใดขวางทางหัวใจที่มุ่งมั่นได้"`;
      affirmationTh = `"ฉันเปี่ยมด้วยพลัง ความคิดสร้างสรรค์ และพร้อมลงมือทำเพื่อความฝัน"`;
      break;
    case "น้ำ":
      quoteTh = `"จงเชื่อมั่นในสัญชาตญาณอันบริสุทธิ์ หัวใจที่สงบจะมองเห็นทางออกเสมอ"`;
      affirmationTh = `"ฉันรักและเมตตาตัวเอง ปล่อยวางสิ่งที่ควบคุมไม่ได้ และโอบกอดความสุข"`;
      break;
    case "ลม":
      quoteTh = `"ความชัดเจนในความคิด จะสลายหมอกควันแห่งความกังวลทั้งหมดออกไป"`;
      affirmationTh = `"ฉันมีสติปัญญาที่เฉียบคม มองเห็นความจริง และตัดสินใจด้วยความมั่นใจ"`;
      break;
    case "ดิน":
    default:
      quoteTh = `"ความอดทนและการลงมือทำอย่างต่อเนื่อง คือรากฐานของความสำเร็จที่ยั่งยืน"`;
      affirmationTh = `"ฉันสร้างความมั่นคงและมั่งคั่งให้ชีวิตทีละก้าวอย่างหนักแน่น"`;
      break;
  }

  return {
    quoteTh,
    sourceCard: chosenCard,
    powerWord,
    affirmationTh,
    elementSymbol,
  };
}
