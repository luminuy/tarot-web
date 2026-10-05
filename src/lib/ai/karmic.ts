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
  /** ✦ คำอ่านนี้มาจากเส้นเรื่องเดียวกับคำถามตอนนี้ (ผู้ใช้เลือกเอง) */
  sameThread?: boolean;
  /** ✦ บันทึกของผู้ใช้ — มีค่าเฉพาะเมื่อผู้ใช้กดยินยอมให้แม่หมอ AI อ่านรายการนั้น (share_with_ai) */
  sharedNote?: string;
}

export interface KarmicBridgeAnalysis {
  hasPastContext: boolean;
  pastReading?: PastReadingSnapshot;
  karmicNarrative?: string;
  /** ฉบับอังกฤษล้วนสำหรับ prompt หน้า `/en` (ISSUE-055) */
  karmicNarrativeEn?: string;
}

const NOTABLE_TRANSITIONS_EN: Record<string, Record<string, string>> = {
  tower: {
    star: "Healing after the storm: from the upheaval of The Tower to the hope and renewal of The Star",
    sun: "From shadow into light: the clouds of loss have passed and joy and clarity are rising",
    world: "Liberation: the collapse of the old freed you to complete a cycle and begin again with grace",
  },
  death: {
    fool: "Spiritual rebirth: after an ending (Death), today is the first step of a new adventure (The Fool)",
    empress: "Abundance after shedding: barren ground has turned into a field of joy and fresh growth",
  },
  devil: {
    star: "Breaking the chains: the shackles of fear or a toxic bond have fallen away; your inner light is guiding you",
    judgement: "Awakening and freedom: you hear the call of truth and are ready to forgive yourself and begin anew",
  },
};

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
  let transitionInsightEn = "";

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
          transitionInsightEn = NOTABLE_TRANSITIONS_EN[pastId]?.[currentId] ?? "";
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
    `ความจำวิวัฒนาการดวงชะตา (Past Karmic Memory): ผู้ถามเคยมาเปิดไพ่ครั้งล่าสุด${timeDesc} ${questionDesc} และได้ไพ่เด่นคือ ${pastReading.primaryCardName}`.trim()
  );

  if (pastReading.sameThread) {
    narrativeParts.push("• คำถามตอนนี้ผู้ถามเลือกเองว่าเป็น \"เรื่องเดียวกัน\" กับครั้งนั้น — เชื่อมความต่อเนื่องของเรื่องได้ตรง ๆ");
  }
  if (pastReading.outcome && pastReading.outcome !== "PENDING") {
    narrativeParts.push(`• ผลการทำนายครั้งก่อนที่ผู้ถามบันทึกไว้: ${pastReading.outcome}`);
  }
  if (pastReading.sharedNote) {
    narrativeParts.push(`• สิ่งที่ผู้ถามเขียนเล่าไว้เอง (ยินยอมให้แม่หมออ่าน): <seeker_note>${pastReading.sharedNote}</seeker_note>`);
  }

  if (pastReading.recentPrimaryCards && pastReading.recentPrimaryCards.length > 0) {
    narrativeParts.push(`• ไพ่เด่นในอดีตครั้งอื่น ๆ: ${pastReading.recentPrimaryCards.join(", ")}`);
  }

  if (transitionInsight) {
    narrativeParts.push(`• การเปลี่ยนผ่านของชีวิต: ${transitionInsight}`);
  } else {
    narrativeParts.push(
      `• คำแนะนำสำหรับแม่หมอ: สามารถเอ่ยทักความต่อเนื่องของการเดินทางในชีวิตของผู้ถามอย่างอบอุ่น (เช่น "ยินดีที่ได้พบกันอีกครั้ง..." หรือ "หลังจากที่เราเคยคุยกันเรื่อง...") โดยไม่ต้องพูดถึงรายละเอียดเดิมทั้งหมด เพื่อให้เขารู้สึกว่าแม่หมอจดจำและใส่ใจชีวิตของเขาอย่างแท้จริง`
    );
  }

  // ฉบับอังกฤษ — คำถาม/ชื่อไพ่ในอดีตเป็นข้อมูลของผู้ใช้เอง จึงยกมาตรง ๆ
  const en: string[] = [];
  const ago =
    pastReading.daysAgo === undefined
      ? ""
      : pastReading.daysAgo === 0
        ? " (earlier today)"
        : pastReading.daysAgo === 1
          ? " (yesterday)"
          : ` (${pastReading.daysAgo} days ago)`;
  en.push(
    `Past karmic memory: the seeker last consulted the cards${ago}${pastReading.question ? ` about "${pastReading.question}"` : ""}, and the lead card was ${pastReading.primaryCardName}`,
  );
  if (pastReading.sameThread) {
    en.push("• The seeker chose this question as a continuation of the same story — connect the thread directly.");
  }
  if (pastReading.outcome && pastReading.outcome !== "PENDING") {
    en.push(`• Outcome the seeker recorded for that reading: ${pastReading.outcome}`);
  }
  if (pastReading.sharedNote) {
    en.push(`• What the seeker wrote themselves (shared with consent): <seeker_note>${pastReading.sharedNote}</seeker_note>`);
  }
  if (pastReading.recentPrimaryCards && pastReading.recentPrimaryCards.length > 0) {
    en.push(`• Lead cards from other past readings: ${pastReading.recentPrimaryCards.join(", ")}`);
  }
  en.push(
    transitionInsightEn
      ? `• Life transition: ${transitionInsightEn}`
      : '• Guidance for the reader: warmly acknowledge the continuity of their journey (e.g. "Welcome back..." or "Since we last spoke about...") without repeating every detail, so they feel genuinely remembered.',
  );

  return {
    hasPastContext: true,
    pastReading,
    karmicNarrative: narrativeParts.join("\n"),
    karmicNarrativeEn: en.join("\n"),
  };
}
