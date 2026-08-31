import type { TarotCard } from "@/data/cards/types";
import type { DrawnCard } from "@/lib/tarot/shuffle";

export interface ElementalBreakdown {
  fire: number;
  water: number;
  air: number;
  earth: number;
  counts: {
    fire: number;
    water: number;
    air: number;
    earth: number;
  };
  dominantElement: "ไฟ" | "น้ำ" | "ลม" | "ดิน" | "สมดุล";
  dominantTitleTh: string;
  dominantInsightTh: string;
  balancingAdviceTh: string;
}

export function calculateElementalBalance(cards: TarotCard[], drawn?: DrawnCard[]): ElementalBreakdown {
  const counts = { fire: 0, water: 0, air: 0, earth: 0 };
  const total = cards.length;

  if (total === 0) {
    return {
      fire: 25,
      water: 25,
      air: 25,
      earth: 25,
      counts,
      dominantElement: "สมดุล",
      dominantTitleTh: "พลังงาน 4 ธาตุสมดุล",
      dominantInsightTh: "ธาตุทั้งสี่อยู่ในสภาวะกลมกลืน ไร้แรงกดดันด้านใดด้านหนึ่ง",
      balancingAdviceTh: "รักษาความสงบและมุ่งเน้นการลงมือทำตามเป้าหมายต่อไป",
    };
  }

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const isReversed = drawn && drawn[i] ? drawn[i].isReversed : false;
    // ไพ่หัวกลับอาจสะท้อนพลังงานที่ติดขัด แต่นับธาตุตามธรรมชาติของไพ่
    const weight = isReversed ? 0.9 : 1.0;

    if (card.element === "ไฟ") counts.fire += weight;
    else if (card.element === "น้ำ") counts.water += weight;
    else if (card.element === "ลม") counts.air += weight;
    else if (card.element === "ดิน") counts.earth += weight;
  }

  const rawSum = counts.fire + counts.water + counts.air + counts.earth;
  const fire = rawSum > 0 ? Math.round((counts.fire / rawSum) * 100) : 0;
  const water = rawSum > 0 ? Math.round((counts.water / rawSum) * 100) : 0;
  const air = rawSum > 0 ? Math.round((counts.air / rawSum) * 100) : 0;
  const earth = counts.earth > 0 && rawSum > 0 ? Math.round((counts.earth / rawSum) * 100) : 0;

  const maxVal = Math.max(fire, water, air, earth);
  const isBalanced = maxVal <= 35 && Math.min(fire, water, air, earth) >= 15;

  let dominantElement: "ไฟ" | "น้ำ" | "ลม" | "ดิน" | "สมดุล" = "สมดุล";
  let dominantTitleTh = "พลังงาน 4 ธาตุสมดุล";
  let dominantInsightTh = "ธาตุทั้งสี่ทำงานสอดประสานกันอย่างยอดเยี่ยม มีทั้งความคิด อารมณ์ แพชชัน และความมั่นคง";
  let balancingAdviceTh = "เดินหน้าตามแผนการที่ตั้งไว้ ทุกมิติในชีวิตพร้อมรองรับการเติบโต";

  if (!isBalanced) {
    if (fire === maxVal) {
      dominantElement = "ไฟ";
      dominantTitleTh = "พลังงานธาตุไฟโดดเด่น (Fire Passion & Drive)";
      dominantInsightTh = "ช่วงนี้มีแรงขับเคลื่อนสูง กระตือรือร้น อยากสร้างสรรค์ หรือมีการเปลี่ยนแปลงที่รวดเร็ว";
      balancingAdviceTh = "เพิ่มพลังธาตุน้ำ (ความใจเย็น/การฟังผู้อื่น) และธาตุดิน (การวางแผนรอบคอบ) เพื่อป้องกันอาการ Burnout หรือความใจร้อน";
    } else if (water === maxVal) {
      dominantElement = "น้ำ";
      dominantTitleTh = "พลังงานธาตุน้ำโดดเด่น (Water Emotion & Intuition)";
      dominantInsightTh = "หัวใจและสัญชาตญาณกำลังนำทาง มีความรู้สึกและอารมณ์ที่ลึกซึ้งต่อสถานการณ์นี้";
      balancingAdviceTh = "เพิ่มพลังธาตุลม (การใช้เหตุผล/การมองภาพใหญ่) และธาตุดิน (การลงมือทำจริง) เพื่อไม่ให้ความกังวลครอบงำ";
    } else if (air === maxVal) {
      dominantElement = "ลม";
      dominantTitleTh = "พลังงานธาตุลมโดดเด่น (Air Logic & Truth)";
      dominantInsightTh = "กำลังใช้ความคิด ตรรกะ การสื่อสาร หรือต้องตัดสินใจในเรื่องสำคัญที่ต้องอาศัยความชัดเจน";
      balancingAdviceTh = "เพิ่มพลังธาตุน้ำ (การเมตตาตัวเอง) และธาตุไฟ (ความกล้าลงมือทำ) เพื่อไม่ให้ติดอยู่ในวังวน Overthinking";
    } else {
      dominantElement = "ดิน";
      dominantTitleTh = "พลังงานธาตุดินโดดเด่น (Earth Stability & Wealth)";
      dominantInsightTh = "เน้นเรื่องความมั่นคง การเงิน ผลลัพธ์ที่จับต้องได้ และความยั่งยืนในระยะยาว";
      balancingAdviceTh = "เพิ่มพลังธาตุไฟ (ความยืดหยุ่น/ความคิดริเริ่มใหม่ๆ) เพื่อให้ชีวิตไม่ตึงเครียดหรือยึดติดกับกรอบเดิมจนเกินไป";
    }
  }

  return {
    fire,
    water,
    air,
    earth,
    counts: {
      fire: Math.round(counts.fire),
      water: Math.round(counts.water),
      air: Math.round(counts.air),
      earth: Math.round(counts.earth),
    },
    dominantElement,
    dominantTitleTh,
    dominantInsightTh,
    balancingAdviceTh,
  };
}
