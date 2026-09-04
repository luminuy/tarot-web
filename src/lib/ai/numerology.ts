/**
 * 🔢 Numerological Rhythm & Cycle Engine
 * --------------------------------------
 * ถอดรหัสจังหวะตัวเลขในผังพยากรณ์:
 * - ตัวเลขที่ปรากฏซ้ำ (Synchronicities)
 * - การกระจุกตัวของไพ่บุคคล (Court Cards)
 * - การวิเคราะห์การเติบโตก้าวหน้า (Progression) หรือการถอยหลังกลับไปแก้เรื่องเดิม (Regression)
 */

import type { TarotCard } from "@/data/cards";

export interface NumerologyPattern {
  number: number;
  cards: string[];
  meaningTh: string;
}

export interface NumerologyAnalysis {
  synchronicities: NumerologyPattern[];
  courtCardCount: number;
  courtCardNames: string[];
  progressionTrend: "advancing" | "regressing" | "stable" | "dynamic";
  narrativeTh: string;
}

const NUMBER_ARCHETYPES: Record<number, string> = {
  1: "พลังแห่งการเริ่มต้นใหม่ เมล็ดพันธุ์แห่งโอกาส และศักยภาพบริสุทธิ์ที่กำลังปะทุขึ้น",
  2: "จุดเปลี่ยนทางแพร่ง การชั่งน้ำหนัก ความเป็นคู่ การร่วมมือ หรือความลังเลที่รอการประสาน",
  3: "การเติบโต การขยายตัว การร่วมแรงร่วมใจ และการผลิบานของผลงานแรกเริ่ม",
  4: "ความต้องการความมั่นคง การจัดระเบียบ การหยุดพัก หรือความรู้สึกติดอยู่ในกรอบที่คับแคบ",
  5: "บททดสอบ ความขัดแย้ง จุดสะดุด และแรงกดดันที่บีบให้ต้องก้าวข้ามขีดจำกัดเดิม",
  6: "การฟื้นฟู ความสุขสงบ การเยียวยาจิตใจ ชัยชนะเล็กๆ และการประนีประนอม",
  7: "การหยุดประเมินทบทวนตนเอง ความอดทนรอคอย การใช้สติปัญญา หรือการวางกลยุทธ์อย่างเงียบๆ",
  8: "การเคลื่อนไหวไปข้างหน้าอย่างรวดเร็ว อำนาจในการจัดการ และการปลดแอกสู่ความเชี่ยวชาญ",
  9: "จุดสูงสุดใกล้ความสมบูรณ์ การเก็บเกี่ยวบทเรียน ความสันโดษ และการตระหนักรู้ส่วนตัว",
  10: "การปิดฉากวงจรเดิมอย่างสมบูรณ์แบบ เพื่อเตรียมเปิดรับรอบใหม่ของชีวิต",
};

/**
 * วิเคราะห์รหัสตัวเลขจากไพ่ที่เปิดได้
 */
export function analyzeNumerologicalRhythm(cards: TarotCard[]): NumerologyAnalysis {
  const numberBuckets: Record<number, string[]> = {};
  const courtCardNames: string[] = [];
  const numbersInOrder: number[] = [];

  for (const card of cards) {
    const rawNum = card.number;
    // ปรับลดตัวเลขให้เหลือ 1-10 สำหรับการจับคู่ (เช่น 19 (1+9=10) หรือตามค่าหลัก)
    let baseNum = rawNum;
    if (baseNum > 10 && card.arcana === "major") {
      baseNum = ((baseNum - 1) % 9) + 1; // numerological root reduction
    }

    if (!numberBuckets[baseNum]) {
      numberBuckets[baseNum] = [];
    }
    numberBuckets[baseNum].push(card.nameTh);
    numbersInOrder.push(baseNum);

    // ตรวจจับไพ่บุคคล (Page, Knight, Queen, King: 11-14 ใน Minor Arcana)
    if (card.arcana === "minor" && card.number >= 11) {
      courtCardNames.push(card.nameTh);
    }
  }

  // หาตัวเลขที่ซ้ำกันตั้งแต่ 2 ใบขึ้นไป (Synchronicities)
  const synchronicities: NumerologyPattern[] = [];
  for (const [numStr, cardNames] of Object.entries(numberBuckets)) {
    const num = Number(numStr);
    if (cardNames.length >= 2 && NUMBER_ARCHETYPES[num]) {
      synchronicities.push({
        number: num,
        cards: cardNames,
        meaningTh: `พลังงานเลข ${num} ปรากฏซ้ำ (${cardNames.join(", ")}): บ่งชี้สภาวะ${NUMBER_ARCHETYPES[num]}`,
      });
    }
  }

  // วิเคราะห์แนวโน้มลำดับตัวเลข (Progression / Regression)
  let progressionTrend: NumerologyAnalysis["progressionTrend"] = "dynamic";
  if (numbersInOrder.length >= 3) {
    const diff1 = numbersInOrder[1] - numbersInOrder[0];
    const diff2 = numbersInOrder[2] - numbersInOrder[1];
    if (diff1 > 0 && diff2 > 0) {
      progressionTrend = "advancing";
    } else if (diff1 < 0 && diff2 < 0) {
      progressionTrend = "regressing";
    } else if (Math.abs(diff1) <= 1 && Math.abs(diff2) <= 1) {
      progressionTrend = "stable";
    }
  }

  // สร้าง Narrative สรุปสำหรับ Prompt
  const narrativeParts: string[] = [];

  if (synchronicities.length > 0) {
    for (const syn of synchronicities) {
      narrativeParts.push(`• ${syn.meaningTh}`);
    }
  }

  if (courtCardNames.length >= 3) {
    narrativeParts.push(
      `• การกระจุกตัวของไพ่บุคคล (${courtCardNames.length} ใบ: ${courtCardNames.join(
        ", "
      )}): บ่งชี้ว่าเรื่องนี้ไม่ได้ขึ้นอยู่กับคุณคนเดียว แต่มีผู้คนรอบข้างเข้ามามีอิทธิพลหรือส่งผลต่อการตัดสินใจอย่างสูง`
    );
  } else if (courtCardNames.length === 2) {
    narrativeParts.push(
      `• บทสนทนาระหว่างสองบุคคล (${courtCardNames.join(
        " กับ "
      )}): สะท้อนความสัมพันธ์หรือการแลกเปลี่ยนบทบาทระหว่างสองฝ่าย`
    );
  }

  if (progressionTrend === "advancing") {
    narrativeParts.push(
      `• ทิศทางตัวเลขก้าวหน้า (Numerical Progression): พลังงานกำลังเคลื่อนตัวจากจุดเริ่มต้นไปสู่ความสมบูรณ์อย่างต่อเนื่อง`
    );
  } else if (progressionTrend === "regressing") {
    narrativeParts.push(
      `• ทิศทางตัวเลขทวนกระแส (Numerical Regression): มีบทเรียนบางอย่างในอดีตที่ยังสะสางไม่จบ และจำเป็นต้องหันกลับไปเคลียร์ให้เรียบร้อยก่อนก้าวต่อ`
    );
  }

  return {
    synchronicities,
    courtCardCount: courtCardNames.length,
    courtCardNames,
    progressionTrend,
    narrativeTh: narrativeParts.join("\n"),
  };
}
