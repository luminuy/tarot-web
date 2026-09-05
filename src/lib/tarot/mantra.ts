import type { TarotCard } from "@/data/cards/types";
import type { DrawnCard } from "@/lib/tarot/shuffle";

export interface SacredMantra {
  quoteTh: string;
  sourceCard: TarotCard;
  powerWord: string;
  affirmationTh: string;
  elementSymbol: string;
  quoteEn?: string;
  affirmationEn?: string;
  elementSymbolEn?: string;
  powerWordEn?: string;
}

const ELEMENT_SYMBOLS: Record<string, string> = {
  "ไฟ": "ธาตุไฟ · พลังแห่งการสร้างสรรค์",
  "น้ำ": "ธาตุน้ำ · พลังแห่งปัญญาญาณและหัวใจ",
  "ลม": "ธาตุลม · พลังแห่งความจริงและความชัดเจน",
  "ดิน": "ธาตุดิน · พลังแห่งความมั่นคงและอุดมสมบูรณ์",
};

const ELEMENT_SYMBOLS_EN: Record<string, string> = {
  "ไฟ": "Fire · Creative Will & Passion",
  "น้ำ": "Water · Intuition & Emotional Wisdom",
  "ลม": "Air · Truth & Mental Clarity",
  "ดิน": "Earth · Grounding & Abundance",
};

/**
 * สกัดคำคมพลังใจศักดิ์สิทธิ์ (Sacred Oracle Mantra) ประจำรอบการเปิดไพ่
 */
export function generateSacredMantra(cards: TarotCard[], drawn?: DrawnCard[]): SacredMantra | null {
  if (!cards || cards.length === 0) {
    return null;
  }

  // ค้นหาไพ่ที่มีพลังเชิงบวกสูงสุด หรือไพ่หลักในผัง
  let chosenIndex = 0;
  let maxScore = -1;

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    if (!card) continue;
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
  if (!chosenCard) return null;
  const isReversed = drawn && drawn[chosenIndex] ? drawn[chosenIndex].isReversed : false;
  
  let powerWord = "ปัญญาญาณ";
  let powerWordEn = "Intuition";
  if (chosenCard && (chosenCard as any).keywords) {
    const kw = (chosenCard as any).keywords;
    if (Array.isArray(kw) && kw.length > 0) {
      powerWord = kw[0];
      powerWordEn = kw[0];
    } else if (typeof kw === "object") {
      const list = isReversed ? kw.reversed : kw.upright;
      if (Array.isArray(list) && list.length > 0) {
        powerWord = list[0];
        powerWordEn = list[0];
      }
    }
  }

  // คัดสรร Mantra ตามธาตุและพลังของไพ่
  const element = chosenCard.element || "ลม";
  const elementSymbol = ELEMENT_SYMBOLS[element] || "พลังจักรวาล";
  const elementSymbolEn = ELEMENT_SYMBOLS_EN[element] || "Cosmic Alignment";

  let quoteTh = "";
  let affirmationTh = "";
  let quoteEn = "";
  let affirmationEn = "";

  switch (element) {
    case "ไฟ":
      quoteTh = `"เมื่อไฟแห่งความเชื่อมั่นลุกโชน ไม่มีอุปสรรคใดขวางทางหัวใจที่มุ่งมั่นได้"`;
      affirmationTh = `"ฉันเปี่ยมด้วยพลัง ความคิดสร้างสรรค์ และพร้อมลงมือทำเพื่อความฝัน"`;
      quoteEn = `"When the fire of conviction ignites within, no obstacle can withstand a resolute heart."`;
      affirmationEn = `"I am energized by creative purpose, moving boldly toward my deepest aspirations."`;
      break;
    case "น้ำ":
      quoteTh = `"จงเชื่อมั่นในสัญชาตญาณอันบริสุทธิ์ หัวใจที่สงบจะมองเห็นทางออกเสมอ"`;
      affirmationTh = `"ฉันรักและเมตตาตัวเอง ปล่อยวางสิ่งที่ควบคุมไม่ได้ และโอบกอดความสุข"`;
      quoteEn = `"Trust the quiet wisdom of your intuition; a calm heart illuminates every threshold."`;
      affirmationEn = `"I hold space for self-compassion, releasing what is beyond control and welcoming peace."`;
      break;
    case "ลม":
      quoteTh = `"ความชัดเจนในความคิด จะสลายหมอกควันแห่งความกังวลทั้งหมดออกไป"`;
      affirmationTh = `"ฉันมีสติปัญญาที่เฉียบคม มองเห็นความจริง และตัดสินใจด้วยความมั่นใจ"`;
      quoteEn = `"Lucid discernment dissolves the lingering fog of fear and indecision."`;
      affirmationEn = `"I possess sharp insight, embracing truth and choosing my path with steadfast clarity."`;
      break;
    case "ดิน":
    default:
      quoteTh = `"ความอดทนและการลงมือทำอย่างต่อเนื่อง คือรากฐานของความสำเร็จที่ยั่งยืน"`;
      affirmationTh = `"ฉันสร้างความมั่นคงและมั่งคั่งให้ชีวิตทีละก้าวอย่างหนักแน่น"`;
      quoteEn = `"Patience and steady craftsmanship form the unshakeable bedrock of lasting fruition."`;
      affirmationEn = `"I cultivate security and authentic abundance step by step, grounded in my worth."`;
      break;
  }

  return {
    quoteTh,
    sourceCard: chosenCard,
    powerWord,
    affirmationTh,
    elementSymbol,
    quoteEn,
    affirmationEn,
    elementSymbolEn,
    powerWordEn,
  };
}
