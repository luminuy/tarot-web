/**
 * ⚖️ Golden Dawn Elemental Dignities & Alchemy Engine
 * ---------------------------------------------------
 * ถอดรหัสปฏิสัมพันธ์ของธาตุทั้ง 4 (ไฟ, น้ำ, ลม, ดิน) และสัดส่วนเมเจอร์/ไมเนอร์
 * ตามหลักการทาโรต์ดั้งเดิมของ Hermetic Order of the Golden Dawn
 * เพื่อให้ AI วิเคราะห์ความเชื่อมโยง (connections) ได้คมกริบและลึกซึ้ง
 */

import type { TarotCard } from "@/data/cards";

export type TarotElement = "ไฟ" | "น้ำ" | "ลม" | "ดิน";

export interface ElementalCount {
  element: TarotElement;
  count: number;
  percentage: number;
}

export interface ElementalPairInteraction {
  cardA: string;
  cardB: string;
  elementA: TarotElement;
  elementB: TarotElement;
  relationship: "harmonious" | "tension" | "neutral" | "reinforcing";
  meaningTh: string;
}

export interface ElementalAlchemyResult {
  counts: Record<TarotElement, number>;
  dominantElement: TarotElement | null;
  lackingElements: TarotElement[];
  majorCount: number;
  majorPercentage: number;
  pairInteractions: ElementalPairInteraction[];
  alchemyNarrative: string;
}

const ELEMENT_PSYCHOLOGY: Record<TarotElement, { nature: string; positive: string; shadow: string }> = {
  ไฟ: {
    nature: "แรงผลักดัน ความกระตือรือร้น ความกล้าหาญ และเจตจำนง",
    positive: "มีความมุ่งมั่น มีไฟ พร้อมริเริ่มและบุกเบิกสิ่งใหม่",
    shadow: "ใจร้อน วู่วาม เอาแต่ใจ หรือเกิดภาวะหมดไฟ (Burnout)",
  },
  น้ำ: {
    nature: "อารมณ์ ความรู้สึก ความรัก จิตใต้สำนึก และสัญชาตญาณ",
    positive: "เห็นอกเห็นใจ เข้าใจความรู้สึกตนเองและผู้อื่นอย่างลึกซึ้ง",
    shadow: "วิตกกังวล หวั่นไหวง่าย จมดิ่งกับอดีต หรือใช้อารมณ์นำทาง",
  },
  ลม: {
    nature: "สติปัญญา ความคิด ตรรกะ การสื่อสาร และการแยกแยะความจริง",
    positive: "คิดวิเคราะห์เฉียบคม สื่อสารตรงไปตรงมา มองการณ์ไกล",
    shadow: "คิดมาก ฟุ้งซ่าน ยึดติดกับทิฐิ หรือสร้างความขัดแย้งด้วยวาจา",
  },
  ดิน: {
    nature: "ความมั่นคงทางกายภาพ การเงิน การงาน ร่างกาย และความจริงตรงหน้า",
    positive: "สุขุม หนักแน่น ลงมือทำจริง บริหารจัดการชีวิตได้อย่างมั่นคง",
    shadow: "ยึดติดกับวัตถุ กลัวการเปลี่ยนแปลง ดื้อรั้น หรือรู้สึกติดหล่ม",
  },
};

const LACKING_ELEMENT_MEANINGS: Record<TarotElement, string> = {
  ไฟ: "ขาดพลังขับเคลื่อนและความมั่นใจ อาจรู้สึกเฉื่อยชา เหนื่อยล้า หรือไม่กล้าเสี่ยงก้าวออกจาก Comfort Zone",
  น้ำ: "ใช้เหตุผลและตรรกะควบคุมมากเกินไปจนละเลยเสียงหัวใจ หรือเก็บกดความรู้สึกที่แท้จริงไว้ใต้พรม",
  ลม: "ขาดการไตร่ตรองรอบคอบหรือขาดการสื่อสารที่ชัดเจน การกระทำขับเคลื่อนด้วยอารมณ์ชั่ววูบโดยไร้แผนรองรับ",
  ดิน: "ขาดการลงมือทำให้เป็นรูปธรรมจับต้องได้ ความคิดหรือความปรารถนาลอยอยู่ในอากาศแต่ยังไม่หยั่งรากลงสู่ความเป็นจริง",
};

/**
 * ประเมินความสัมพันธ์ระหว่างคู่ธาตุตามกฎ Elemental Dignities
 */
function evaluatePairDignity(
  cardA: TarotCard,
  cardB: TarotCard
): ElementalPairInteraction | null {
  const elemA = cardA.element as TarotElement;
  const elemB = cardB.element as TarotElement;

  if (!elemA || !elemB) return null;

  if (elemA === elemB) {
    return {
      cardA: cardA.nameTh,
      cardB: cardB.nameTh,
      elementA: elemA,
      elementB: elemB,
      relationship: "reinforcing",
      meaningTh: `พลังธาตุ${elemA}เสริมกำลังกันเข้มข้น (${cardA.nameTh} + ${cardB.nameTh}) ทวีคูณ${ELEMENT_PSYCHOLOGY[elemA].nature}`,
    };
  }

  // คู่เกื้อหนุน (Fire + Air / Water + Earth)
  if ((elemA === "ไฟ" && elemB === "ลม") || (elemA === "ลม" && elemB === "ไฟ")) {
    return {
      cardA: cardA.nameTh,
      cardB: cardB.nameTh,
      elementA: elemA,
      elementB: elemB,
      relationship: "harmonious",
      meaningTh: `ธาตุไฟและธาตุลมเกื้อหนุนกัน (${cardA.nameTh} + ${cardB.nameTh}): ความคิดและแรงบันดาลใจโหมส่งให้เกิดการลงมือทำที่ก้าวกระโดด`,
    };
  }
  if ((elemA === "น้ำ" && elemB === "ดิน") || (elemA === "ดิน" && elemB === "น้ำ")) {
    return {
      cardA: cardA.nameTh,
      cardB: cardB.nameTh,
      elementA: elemA,
      elementB: elemB,
      relationship: "harmonious",
      meaningTh: `ธาตุน้ำและธาตุดินผสานกันอย่างอุดมสมบูรณ์ (${cardA.nameTh} + ${cardB.nameTh}): ความรู้สึกและจินตนาการสามารถแปรเปลี่ยนเป็นความสำเร็จที่มั่นคงจับต้องได้`,
    };
  }

  // คู่ขัดแย้ง/ตึงเครียด (Fire + Water / Air + Earth)
  if ((elemA === "ไฟ" && elemB === "น้ำ") || (elemA === "น้ำ" && elemB === "ไฟ")) {
    return {
      cardA: cardA.nameTh,
      cardB: cardB.nameTh,
      elementA: elemA,
      elementB: elemB,
      relationship: "tension",
      meaningTh: `ธาตุไฟปะทะธาตุน้ำ (${cardA.nameTh} + ${cardB.nameTh}): ความขัดแย้งภายในระหว่างความอยากพุ่งไปข้างหน้ากับความกลัว/ความผูกพันในใจ ทำให้เกิดสภาวะอารมณ์ที่พลุ่งพล่าน`,
    };
  }
  if ((elemA === "ลม" && elemB === "ดิน") || (elemA === "ดิน" && elemB === "ลม")) {
    return {
      cardA: cardA.nameTh,
      cardB: cardB.nameTh,
      elementA: elemA,
      elementB: elemB,
      relationship: "tension",
      meaningTh: `ธาตุลมขัดแย้งกับธาตุดิน (${cardA.nameTh} + ${cardB.nameTh}): ความคิดและทฤษฎีในหัวขัดแย้งกับข้อจำกัดในโลกความเป็นจริง เกิดความรู้สึกลังเลหรือติดหล่ม`,
    };
  }

  // คู่เป็นกลาง (Fire + Earth / Air + Water)
  return {
    cardA: cardA.nameTh,
    cardB: cardB.nameTh,
    elementA: elemA,
    elementB: elemB,
    relationship: "neutral",
    meaningTh: `ธาตุ${elemA}และธาตุ${elemB} (${cardA.nameTh} + ${cardB.nameTh}): ต้องอาศัยการประนีประนอมและการจัดสรรจังหวะเวลาอย่างมีสติ`,
  };
}

/**
 * วิเคราะห์เคมีธาตุภาพรวมของผังพยากรณ์
 */
export function analyzeElementalAlchemy(cards: TarotCard[]): ElementalAlchemyResult {
  const counts: Record<TarotElement, number> = {
    ไฟ: 0,
    น้ำ: 0,
    ลม: 0,
    ดิน: 0,
  };

  let majorCount = 0;

  for (const card of cards) {
    if (card.element in counts) {
      counts[card.element as TarotElement]++;
    }
    if (card.arcana === "major") {
      majorCount++;
    }
  }

  const total = cards.length || 1;
  const majorPercentage = Math.round((majorCount / total) * 100);

  // หาธาตุเด่น (ถ้ามีสัดส่วน >= 40%)
  let dominantElement: TarotElement | null = null;
  let maxCount = 0;
  for (const [elem, count] of Object.entries(counts) as [TarotElement, number][]) {
    if (count > maxCount) {
      maxCount = count;
      dominantElement = elem;
    }
  }
  if (maxCount / total < 0.35) {
    dominantElement = null; // ธาตุกระจายตัวสมดุล
  }

  // หาธาตุที่ขาดหาย (Void Element)
  const lackingElements = (Object.keys(counts) as TarotElement[]).filter(
    (elem) => counts[elem] === 0
  );

  // ตรวจจับคู่ธาตุติดกัน (Pair interactions) สูงสุด 3 คู่แรกที่สำคัญ
  const pairInteractions: ElementalPairInteraction[] = [];
  for (let i = 0; i < cards.length - 1 && pairInteractions.length < 3; i++) {
    const interaction = evaluatePairDignity(cards[i], cards[i + 1]);
    if (interaction && (interaction.relationship === "harmonious" || interaction.relationship === "tension")) {
      pairInteractions.push(interaction);
    }
  }

  // สร้าง Alchemy Narrative ภาษาไทย
  const narrativeParts: string[] = [];

  narrativeParts.push(
    `สัดส่วนธาตุ: ไฟ ${counts.ไฟ} ใบ | น้ำ ${counts.น้ำ} ใบ | ลม ${counts.ลม} ใบ | ดิน ${counts.ดิน} ใบ (ไพ่ชุดใหญ่ Major Arcana: ${majorCount}/${total} ใบ คิดเป็น ${majorPercentage}%)`
  );

  if (dominantElement) {
    narrativeParts.push(
      `• ธาตุเด่นทรงอิทธิพล: ธาตุ${dominantElement} — ขับเคลื่อนด้วย${ELEMENT_PSYCHOLOGY[dominantElement].positive}`
    );
  } else {
    narrativeParts.push(`• ความสมดุลของธาตุ: พลังงานกระจายตัวค่อนข้างสมดุล ไม่มีธาตุใดครอบงำฝ่ายเดียว`);
  }

  if (lackingElements.length > 0) {
    const lackingDesc = lackingElements
      .map((elem) => `ธาตุ${elem} (${LACKING_ELEMENT_MEANINGS[elem]})`)
      .join(" และ ");
    narrativeParts.push(`• จุดบอด/ธาตุที่ขาดหาย (Void Alchemy): ${lackingDesc}`);
  }

  if (pairInteractions.length > 0) {
    const interactionDesc = pairInteractions.map((p) => p.meaningTh).join(" | ");
    narrativeParts.push(`• เคมีคู่ไพ่สำคัญ: ${interactionDesc}`);
  }

  if (majorPercentage >= 50) {
    narrativeParts.push(
      `• มิติชะตากรรม: ไพ่ชุดใหญ่ครอบคลุมเกินครึ่ง ผังนี้สะท้อนจุดเปลี่ยนสำคัญของชีวิตที่นำพาโดยแรงผลักดันระดับจิตวิญญาณ`
    );
  }

  return {
    counts,
    dominantElement,
    lackingElements,
    majorCount,
    majorPercentage,
    pairInteractions,
    alchemyNarrative: narrativeParts.join("\n"),
  };
}
