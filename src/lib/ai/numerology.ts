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
  meaningEn: string;
}

export interface NumerologyAnalysis {
  synchronicities: NumerologyPattern[];
  courtCardCount: number;
  courtCardNames: string[];
  progressionTrend: "advancing" | "regressing" | "stable" | "dynamic";
  narrativeTh: string;
  /** ฉบับอังกฤษล้วนสำหรับ prompt หน้า `/en` (ISSUE-055) */
  narrativeEn: string;
}

const NUMBER_ARCHETYPES: Record<number, string> = {
  1: "พลังแห่งการเริ่มต้นใหม่ เมล็ดพันธุ์แห่งโอกาส และศักยภาพบริสุทธิ์ที่กำลังปะทุขึ้น",
  2: "จุดเปลี่ยนทางแพร่ง การชั่งน้ำหนัก ความเป็นคู่ การร่วมมือ หรือความลังเลที่รอการประสาน",
  3: "การเติบโต การขยายตัว การร่วมแรงร่วมใจ และการผลิบานของผลงานแรกเริ่ม",
  4: "ความต้องการความมั่นคง การจัดระเบียบ การหยุดพัก หรือความรู้สึกติดอยู่ในกรอบที่คับแคบ",
  5: "บททดสอบ ความขัดแย้ง จุดสะดุด และแรงกดดันที่บีบให้ต้องก้าวข้ามขีดจำกัดเดิม",
  6: "การฟื้นฟู ความสุขสงบ การเยียวยาจิตใจ ชัยชนะเล็ก ๆ และการประนีประนอม",
  7: "การหยุดประเมินทบทวนตนเอง ความอดทนรอคอย การใช้สติปัญญา หรือการวางกลยุทธ์อย่างเงียบ ๆ",
  8: "การเคลื่อนไหวไปข้างหน้าอย่างรวดเร็ว อำนาจในการจัดการ และการปลดแอกสู่ความเชี่ยวชาญ",
  9: "จุดสูงสุดใกล้ความสมบูรณ์ การเก็บเกี่ยวบทเรียน ความสันโดษ และการตระหนักรู้ส่วนตัว",
  10: "การปิดฉากวงจรเดิมอย่างสมบูรณ์แบบ เพื่อเตรียมเปิดรับรอบใหม่ของชีวิต",
};

const NUMBER_ARCHETYPES_EN: Record<number, string> = {
  1: "new beginnings, the seed of opportunity and raw potential breaking through",
  2: "a crossroads, weighing options, duality, partnership or indecision awaiting balance",
  3: "growth, expansion, collaboration and the first fruits of effort",
  4: "a need for stability, structure, rest — or feeling boxed in",
  5: "tests, conflict, stumbling blocks and pressure that forces you past old limits",
  6: "recovery, harmony, emotional healing, small victories and compromise",
  7: "pausing to reassess, patience, using wisdom or quiet strategy",
  8: "swift forward movement, power to manage and breaking free into mastery",
  9: "a near-complete peak, harvesting lessons, solitude and self-realization",
  10: "the full close of an old cycle, making room for a new chapter",
};

/**
 * วิเคราะห์รหัสตัวเลขจากไพ่ที่เปิดได้
 * ไพ่บุคคล (Page–King = 11–14 ของ Minor) **ไม่ใช่ตัวเลข** — นับแยกในหมวดไพ่บุคคลเท่านั้น
 * (เดิมถูกนับเป็นเลข 11–14 ปนในทิศทางตัวเลข ทำให้ Page ➔ King อ่านว่า "ก้าวหน้า" ผิด ๆ)
 */
export function analyzeNumerologicalRhythm(cards: TarotCard[]): NumerologyAnalysis {
  const numberBuckets: Record<number, TarotCard[]> = {};
  const courtCards: TarotCard[] = [];
  const numbersInOrder: number[] = [];

  for (const card of cards) {
    if (card.arcana === "minor" && card.number >= 11) {
      courtCards.push(card);
      continue;
    }
    // ปรับลดเลข Major ที่เกิน 10 ด้วยการรวมหลัก (เช่น 19 ➔ 1+9 = 10 ➔ 1)
    let baseNum = card.number;
    if (baseNum > 10 && card.arcana === "major") {
      baseNum = ((baseNum - 1) % 9) + 1;
    }
    (numberBuckets[baseNum] ??= []).push(card);
    numbersInOrder.push(baseNum);
  }

  // หาตัวเลขที่ซ้ำกันตั้งแต่ 2 ใบขึ้นไป (Synchronicities)
  const synchronicities: NumerologyPattern[] = [];
  for (const [numStr, group] of Object.entries(numberBuckets)) {
    const num = Number(numStr);
    if (group.length >= 2 && NUMBER_ARCHETYPES[num]) {
      const namesTh = group.map((c) => c.nameTh);
      synchronicities.push({
        number: num,
        cards: namesTh,
        meaningTh: `พลังงานเลข ${num} ปรากฏซ้ำ (${namesTh.join(", ")}): บ่งชี้สภาวะ${NUMBER_ARCHETYPES[num]}`,
        meaningEn: `The number ${num} repeats (${group.map((c) => c.nameEn).join(", ")}): signals ${NUMBER_ARCHETYPES_EN[num]}`,
      });
    }
  }

  // วิเคราะห์แนวโน้มลำดับตัวเลข (Progression / Regression) จากสามเลขแรกของผัง
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

  const courtCardNames = courtCards.map((c) => c.nameTh);
  const courtNamesEn = courtCards.map((c) => c.nameEn);

  // สร้าง Narrative สรุปสำหรับ Prompt
  const narrativeParts: string[] = [];
  const en: string[] = [];

  for (const syn of synchronicities) {
    narrativeParts.push(`• ${syn.meaningTh}`);
    en.push(`• ${syn.meaningEn}`);
  }

  if (courtCards.length >= 3) {
    narrativeParts.push(
      `• การกระจุกตัวของไพ่บุคคล (${courtCards.length} ใบ: ${courtCardNames.join(
        ", "
      )}): บ่งชี้ว่าเรื่องนี้ไม่ได้ขึ้นอยู่กับคุณคนเดียว แต่มีผู้คนรอบข้างเข้ามามีอิทธิพลหรือส่งผลต่อการตัดสินใจอย่างสูง`
    );
    en.push(
      `• A cluster of court cards (${courtCards.length}: ${courtNamesEn.join(", ")}): this is not about you alone — other people strongly influence the outcome or the decision`,
    );
  } else if (courtCards.length === 2) {
    narrativeParts.push(
      `• บทสนทนาระหว่างสองบุคคล (${courtCardNames.join(
        " กับ "
      )}): สะท้อนความสัมพันธ์หรือการแลกเปลี่ยนบทบาทระหว่างสองฝ่าย`
    );
    en.push(`• A dialogue between two people (${courtNamesEn.join(" and ")}): a relationship or an exchange of roles between two sides`);
  }

  if (progressionTrend === "advancing") {
    narrativeParts.push(
      `• ทิศทางตัวเลขก้าวหน้า (Numerical Progression): พลังงานกำลังเคลื่อนตัวจากจุดเริ่มต้นไปสู่ความสมบูรณ์อย่างต่อเนื่อง`
    );
    en.push("• Numerical progression: energy is moving steadily from beginning toward completion");
  } else if (progressionTrend === "regressing") {
    narrativeParts.push(
      `• ทิศทางตัวเลขทวนกระแส (Numerical Regression): มีบทเรียนบางอย่างในอดีตที่ยังสะสางไม่จบ และจำเป็นต้องหันกลับไปเคลียร์ให้เรียบร้อยก่อนก้าวต่อ`
    );
    en.push("• Numerical regression: an unfinished lesson from the past needs to be cleared before moving on");
  }

  return {
    synchronicities,
    courtCardCount: courtCards.length,
    courtCardNames,
    progressionTrend,
    narrativeTh: narrativeParts.join("\n"),
    narrativeEn: en.join("\n"),
  };
}
