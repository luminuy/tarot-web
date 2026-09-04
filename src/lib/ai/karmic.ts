/**
 * 📜 Long-Term Karmic Evolution Bridge
 * -------------------------------------
 * ระบบเชื่อมโยงประวัติและวิวัฒนาการดวงชะตาระยะยาวของผู้ใช้:
 * - ดึงการเปิดไพ่ครั้งล่าสุด (หากมี) เพื่อเปรียบเทียบการเปลี่ยนแปลง
 * - ตรวจจับจุดเปลี่ยนผ่านทางจิตวิญญาณ (เช่น อดีตได้ The Tower ➔ ปัจจุบันได้ The Star)
 * - ส่งคำแนะนำให้แม่หมอเอ่ยทักอย่างอบอุ่น สร้างความผูกพันระดับลึกซึ้ง
 */

import type { TarotCard } from "@/data/cards";

export interface PastReadingSnapshot {
  date?: string;
  question?: string;
  primaryCardName: string;
  summary?: string;
  outcome?: string | null;
  daysAgo?: number;
  recentPrimaryCards?: string[];
}

export interface KarmicBridgeAnalysis {
  hasPastContext: boolean;
  pastReading?: PastReadingSnapshot;
  karmicNarrative?: string;
}

const NOTABLE_TRANSITIONS: Record<string, Record<string, string>> = {
  tower: {
    star: "การฟื้นฟูหลังพายุพังทลาย: จากวิกฤตความเจ็บปวดในอดีต (The Tower) สู่ดวงดาวแห่งความหวังและการเยียวยาในวันนี้ (The Star)",
    sun: "การพ้นจากเงามืดสู่แสงสว่าง: เมฆหมอกแห่งการสูญเสียได้ผ่านพ้นไป ความสุขและความกระจ่างแจ้งกำลังเริ่มขึ้น",
    world: "การหลุดพ้นสู่อิสรภาพ: การพังทลายของสิ่งเดิมได้ปลดปล่อยให้คุณมาถึงจุดสิ้นสุดของวัฏจักรเดิมและเริ่มต้นใหม่อย่างสง่างาม",
  },
  death: {
    fool: "การเกิดใหม่ทางจิตวิญญาณ: หลังจากการสิ้นสุดของบางสิ่ง (Death) วันนี้คือการก้าวแรกของการผจญภัยครั้งใหม่ (The Fool)",
    empress: "ความอุดมสมบูรณ์หลังการผลัดใบ: ดินที่เคยรกร้างได้แปรเปลี่ยนเป็นทุ่งหญ้าแห่งความสุขและการเติบโตใหม่",
  },
  devil: {
    star: "การหลุดพ้นจากพันธนาการ: โซ่ตรวนแห่งความกลัวหรือความสัมพันธ์ที่เป็นพิษได้หลุดออกไปแล้ว แสงสว่างภายในกำลังนำทางคุณ",
    judgement: "การตื่นรู้และคืนอิสรภาพ: คุณได้ยินเสียงเรียกของความจริงและพร้อมที่จะให้อภัยตนเองเพื่อเริ่มต้นใหม่",
  },
};

/**
 * วิเคราะห์การเปลี่ยนผ่านของดวงชะตาระหว่างการเปิดไพ่ในอดีตกับปัจจุบัน
 */
export function analyzeKarmicBridge(
  currentCards: TarotCard[],
  pastReading?: PastReadingSnapshot
): KarmicBridgeAnalysis {
  if (!pastReading || !pastReading.primaryCardName) {
    return { hasPastContext: false };
  }

  const primaryCurrent = currentCards[0];
  if (!primaryCurrent) {
    return { hasPastContext: false };
  }

  let transitionInsight = "";

  // ตรวจจับคู่การเปลี่ยนผ่านที่มีนัยสำคัญ
  const pastCardLower = pastReading.primaryCardName.toLowerCase();
  for (const [pastId, targetMap] of Object.entries(NOTABLE_TRANSITIONS)) {
    const matchesPast =
      pastCardLower.includes(pastId) ||
      (pastId === "tower" && pastCardLower.includes("หอคอย")) ||
      (pastId === "death" && pastCardLower.includes("ความตาย")) ||
      (pastId === "devil" && pastCardLower.includes("ปีศาจ"));

    if (matchesPast) {
      for (const [currentId, desc] of Object.entries(targetMap)) {
        if (
          primaryCurrent.id === currentId ||
          primaryCurrent.nameEn.toLowerCase().includes(currentId) ||
          (currentId === "star" && primaryCurrent.nameTh.includes("ดวงดาว")) ||
          (currentId === "sun" && primaryCurrent.nameTh.includes("ดวงอาทิตย์")) ||
          (currentId === "world" && primaryCurrent.nameTh.includes("โลก")) ||
          (currentId === "fool" && primaryCurrent.nameTh.includes("เดอะฟูล")) ||
          (currentId === "empress" && primaryCurrent.nameTh.includes("จักรพรรดินี")) ||
          (currentId === "judgement" && primaryCurrent.nameTh.includes("จัดจ์เมนต์"))
        ) {
          transitionInsight = desc;
          break;
        }
      }
    }
  }

  const narrativeParts: string[] = [];
  const timeDesc = pastReading.daysAgo !== undefined
    ? pastReading.daysAgo === 0
      ? " (เมื่อวันนี้)"
      : pastReading.daysAgo === 1
      ? " (เมื่อวานนี้)"
      : ` (เมื่อ ${pastReading.daysAgo} วันที่แล้ว)`
    : "";
  const questionDesc = pastReading.question ? `ในเรื่อง "${pastReading.question}"` : "";

  narrativeParts.push(
    `✦ ความจำวิวัฒนาการดวงชะตา (Past Karmic Memory): ผู้ถามเคยมาเปิดไพ่ครั้งล่าสุด${timeDesc} ${questionDesc} และได้ไพ่เด่นคือ ${pastReading.primaryCardName}`.trim()
  );

  if (pastReading.outcome && pastReading.outcome !== "PENDING") {
    narrativeParts.push(`• ผลการทำนายครั้งก่อนที่ผู้ถามบันทึกไว้: ${pastReading.outcome}`);
  }

  if (pastReading.recentPrimaryCards && pastReading.recentPrimaryCards.length > 0) {
    narrativeParts.push(`• ไพ่เด่นในอดีตครั้งอื่นๆ: ${pastReading.recentPrimaryCards.join(", ")}`);
  }

  if (transitionInsight) {
    narrativeParts.push(`• การเปลี่ยนผ่านของชีวิต: ${transitionInsight}`);
  } else {
    narrativeParts.push(
      `• คำแนะนำสำหรับแม่หมอ: สามารถเอ่ยทักความต่อเนื่องของการเดินทางในชีวิตของผู้ถามอย่างอบอุ่น (เช่น "ยินดีที่ได้พบกันอีกครั้ง..." หรือ "หลังจากที่เราเคยคุยกันเรื่อง...") โดยไม่ต้องพูดถึงรายละเอียดเดิมทั้งหมด เพื่อให้เขารู้สึกว่าแม่หมอจดจำและใส่ใจชีวิตของเขาอย่างแท้จริง`
    );
  }

  return {
    hasPastContext: true,
    pastReading,
    karmicNarrative: narrativeParts.join("\n"),
  };
}
