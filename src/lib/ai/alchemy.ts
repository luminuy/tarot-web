/**
 * ⚖️ Golden Dawn Elemental Dignities & Alchemy Engine
 * ---------------------------------------------------
 * ถอดรหัสปฏิสัมพันธ์ของธาตุทั้ง 4 (ไฟ, น้ำ, ลม, ดิน) และสัดส่วนเมเจอร์/ไมเนอร์
 * ตามหลักการทาโรต์ดั้งเดิมของ Hermetic Order of the Golden Dawn
 * เพื่อให้ AI วิเคราะห์ความเชื่อมโยง (connections) ได้คมกริบและลึกซึ้ง
 */

import type { TarotCard } from "@/data/cards";

export type TarotElement = "ไฟ" | "น้ำ" | "ลม" | "ดิน";

export interface ElementalPairInteraction {
  cardA: string;
  cardB: string;
  elementA: TarotElement;
  elementB: TarotElement;
  relationship: "harmonious" | "tension" | "neutral" | "reinforcing";
  meaningTh: string;
  meaningEn: string;
}

export interface ElementalAlchemyResult {
  counts: Record<TarotElement, number>;
  dominantElement: TarotElement | null;
  lackingElements: TarotElement[];
  majorCount: number;
  majorPercentage: number;
  pairInteractions: ElementalPairInteraction[];
  alchemyNarrative: string;
  /** ฉบับอังกฤษล้วนสำหรับ prompt หน้า `/en` (ISSUE-055) */
  alchemyNarrativeEn: string;
}

export interface AlchemyOptions {
  /**
   * ป้ายของไพ่แต่ละใบตามลำดับ เช่น `ตำแหน่ง "อดีต" (หอคอย)` — ให้ AI รู้ว่าคู่ธาตุนี้คือ "ช่องไหนคุยกับช่องไหน"
   * ไม่ส่ง = ใช้ชื่อไพ่อย่างเดียว (พฤติกรรมเดิม)
   */
  labelsTh?: string[];
  labelsEn?: string[];
}

const ELEMENT_EN: Record<TarotElement, string> = { ไฟ: "Fire", น้ำ: "Water", ลม: "Air", ดิน: "Earth" };

const ELEMENT_PSYCHOLOGY_EN: Record<TarotElement, { nature: string; positive: string }> = {
  ไฟ: { nature: "drive, enthusiasm, courage and will", positive: "determination, passion and readiness to initiate" },
  น้ำ: { nature: "emotion, love, the subconscious and intuition", positive: "deep empathy for oneself and others" },
  ลม: { nature: "intellect, logic, communication and discernment", positive: "sharp analysis, honest communication and foresight" },
  ดิน: { nature: "material security, money, work, the body and present reality", positive: "steadiness, follow-through and grounded management of life" },
};

const LACKING_ELEMENT_MEANINGS_EN: Record<TarotElement, string> = {
  ไฟ: "missing drive and confidence — sluggishness, fatigue or reluctance to leave the comfort zone",
  น้ำ: "logic overriding the heart — true feelings swept under the rug",
  ลม: "missing clear thinking or communication — acting on impulse without a plan",
  ดิน: "missing concrete action — ideas and wishes not yet rooted in reality",
};

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
 * `labelA/B` = ป้ายที่ใช้เรียกไพ่ในข้อความ (ชื่อไพ่ หรือ ชื่อตำแหน่ง+ชื่อไพ่)
 */
function evaluatePairDignity(
  cardA: TarotCard,
  cardB: TarotCard,
  labels: { thA: string; thB: string; enA: string; enB: string },
): ElementalPairInteraction | null {
  const elemA = cardA.element as TarotElement;
  const elemB = cardB.element as TarotElement;

  if (!elemA || !elemB) return null;

  const { thA, thB, enA, enB } = labels;
  const base = { cardA: cardA.nameTh, cardB: cardB.nameTh, elementA: elemA, elementB: elemB };
  const pair = (a: TarotElement, b: TarotElement) =>
    (elemA === a && elemB === b) || (elemA === b && elemB === a);

  if (elemA === elemB) {
    return {
      ...base,
      relationship: "reinforcing",
      meaningTh: `พลังธาตุ${elemA}เสริมกำลังกันเข้มข้น (${thA} + ${thB}) ทวีคูณ${ELEMENT_PSYCHOLOGY[elemA].nature}`,
      meaningEn: `Doubled ${ELEMENT_EN[elemA]} (${enA} + ${enB}) amplifies ${ELEMENT_PSYCHOLOGY_EN[elemA].nature}`,
    };
  }

  // คู่เกื้อหนุน (Fire + Air / Water + Earth)
  if (pair("ไฟ", "ลม")) {
    return {
      ...base,
      relationship: "harmonious",
      meaningTh: `ธาตุไฟและธาตุลมเกื้อหนุนกัน (${thA} + ${thB}): ความคิดและแรงบันดาลใจโหมส่งให้เกิดการลงมือทำที่ก้าวกระโดด`,
      meaningEn: `Fire and Air support each other (${enA} + ${enB}): ideas fan inspiration into bold action`,
    };
  }
  if (pair("น้ำ", "ดิน")) {
    return {
      ...base,
      relationship: "harmonious",
      meaningTh: `ธาตุน้ำและธาตุดินผสานกันอย่างอุดมสมบูรณ์ (${thA} + ${thB}): ความรู้สึกและจินตนาการสามารถแปรเปลี่ยนเป็นความสำเร็จที่มั่นคงจับต้องได้`,
      meaningEn: `Water and Earth nourish each other (${enA} + ${enB}): feelings and imagination can become tangible, lasting results`,
    };
  }

  // คู่ขัดแย้ง/ตึงเครียด (Fire + Water / Air + Earth)
  if (pair("ไฟ", "น้ำ")) {
    return {
      ...base,
      relationship: "tension",
      meaningTh: `ธาตุไฟปะทะธาตุน้ำ (${thA} + ${thB}): ความขัดแย้งภายในระหว่างความอยากพุ่งไปข้างหน้ากับความกลัว/ความผูกพันในใจ ทำให้เกิดสภาวะอารมณ์ที่พลุ่งพล่าน`,
      meaningEn: `Fire clashes with Water (${enA} + ${enB}): the urge to charge ahead fights fear or emotional attachment, stirring turbulent feelings`,
    };
  }
  if (pair("ลม", "ดิน")) {
    return {
      ...base,
      relationship: "tension",
      meaningTh: `ธาตุลมขัดแย้งกับธาตุดิน (${thA} + ${thB}): ความคิดและทฤษฎีในหัวขัดแย้งกับข้อจำกัดในโลกความเป็นจริง เกิดความรู้สึกลังเลหรือติดหล่ม`,
      meaningEn: `Air clashes with Earth (${enA} + ${enB}): theories in the head collide with real-world limits, producing hesitation or feeling stuck`,
    };
  }

  // คู่เป็นกลาง (Fire + Earth / Air + Water)
  return {
    ...base,
    relationship: "neutral",
    meaningTh: `ธาตุ${elemA}และธาตุ${elemB} (${thA} + ${thB}): ต้องอาศัยการประนีประนอมและการจัดสรรจังหวะเวลาอย่างมีสติ`,
    meaningEn: `${ELEMENT_EN[elemA]} and ${ELEMENT_EN[elemB]} (${enA} + ${enB}): calls for compromise and mindful timing`,
  };
}

/**
 * วิเคราะห์เคมีธาตุภาพรวมของผังพยากรณ์
 */
export function analyzeElementalAlchemy(cards: TarotCard[], opts?: AlchemyOptions): ElementalAlchemyResult {
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

  // หาธาตุเด่น (ต้องมีสัดส่วน >= 35%)
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
  const thLabel = (i: number) => opts?.labelsTh?.[i] || cards[i].nameTh;
  const enLabel = (i: number) => opts?.labelsEn?.[i] || cards[i].nameEn;
  const pairInteractions: ElementalPairInteraction[] = [];
  for (let i = 0; i < cards.length - 1 && pairInteractions.length < 3; i++) {
    const interaction = evaluatePairDignity(cards[i], cards[i + 1], {
      thA: thLabel(i),
      thB: thLabel(i + 1),
      enA: enLabel(i),
      enB: enLabel(i + 1),
    });
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

  // ฉบับอังกฤษล้วน (ISSUE-055) — โครงเดียวกับฉบับไทยทุกบรรทัด
  const en: string[] = [
    `Elemental balance: Fire ${counts.ไฟ} | Water ${counts.น้ำ} | Air ${counts.ลม} | Earth ${counts.ดิน} (Major Arcana: ${majorCount}/${total} cards = ${majorPercentage}%)`,
  ];
  en.push(
    dominantElement
      ? `• Dominant element: ${ELEMENT_EN[dominantElement]} — driven by ${ELEMENT_PSYCHOLOGY_EN[dominantElement].positive}`
      : "• Elemental balance: energy is spread fairly evenly; no single element dominates",
  );
  if (lackingElements.length > 0) {
    en.push(
      `• Missing element(s): ${lackingElements.map((e) => `${ELEMENT_EN[e]} (${LACKING_ELEMENT_MEANINGS_EN[e]})`).join(" and ")}`,
    );
  }
  if (pairInteractions.length > 0) {
    en.push(`• Key card-pair chemistry: ${pairInteractions.map((p) => p.meaningEn).join(" | ")}`);
  }
  if (majorPercentage >= 50) {
    en.push("• Fate dimension: Major Arcana make up half or more — a major life turning point driven by soul-level forces");
  }

  return {
    counts,
    dominantElement,
    lackingElements,
    majorCount,
    majorPercentage,
    pairInteractions,
    alchemyNarrative: narrativeParts.join("\n"),
    alchemyNarrativeEn: en.join("\n"),
  };
}
