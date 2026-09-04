/**
 * 🎯 Question Energy Diagnostic Framework
 * -----------------------------------------
 * วินิจฉัยสภาวะจิตใจและพลังงานใต้คำถามของผู้ถาม:
 * 1. Victim / Powerless (เปราะบาง/รู้สึกหมดพลัง)
 * 2. Analysis Paralysis (คิดวน/ลังเลติดหล่ม)
 * 3. Insecurity / Attachment (กลัวสูญเสีย/ไม่มั่นคงในสัมพันธ์)
 * 4. Growth & Agency (มุ่งมั่นพัฒนา/วางแผนเชิงรุก)
 * เพื่อปรับ "เลนส์จิตวิทยาและวิธีการเยียวยา" ของแม่หมอให้ตรงจุด
 */

export type QuestionEnergyType =
  | "victim_powerless"
  | "analysis_paralysis"
  | "insecurity_attachment"
  | "growth_agency";

export interface QuestionEnergyDiagnostic {
  energyType: QuestionEnergyType;
  labelTh: string;
  coreEmotionalNeed: string;
  counselingGuidance: string;
  promptDirective: string;
}

const VICTIM_KEYWORDS = [
  "เหนื่อย",
  "ท้อ",
  "ทำไมต้องเจอ",
  "แย่",
  "ตัน",
  "ทรมาน",
  "โดนทิ้ง",
  "หลอก",
  "พัง",
  "สู้ไม่ไหว",
  "ไม่รอด",
  "เจ็บ",
  "ร้องไห้",
  "หมดหวัง",
  "เวรกรรม",
  "ซวย",
  "ไม่ไหว",
];

const PARALYSIS_KEYWORDS = [
  "เลือกไม่ได้",
  "ลังเล",
  "สองจิตสองใจ",
  "หรือ",
  "ไปหรืออยู่",
  "ลาออกดีไหม",
  "คุ้มไหม",
  "อันไหนดี",
  "ทางไหน",
  "ควรเลือก",
  "ตัดสินใจ",
  "คิดไม่ตก",
  "สับสน",
];

const INSECURITY_KEYWORDS = [
  "เขารักไหม",
  "คิดถึงไหม",
  "มีคนอื่นไหม",
  "จะกลับมาไหม",
  "คลุมเครือ",
  "รอต่อไปดีไหม",
  "เขาคิดยังไง",
  "ใจจริง",
  "นอกใจ",
  "แอบชอบ",
  "แอบมอง",
  "ความรู้สึกเขา",
  "ทิ้งเราไหม",
];

const GROWTH_KEYWORDS = [
  "พัฒนา",
  "อนาคต",
  "เริ่มต้น",
  "ธุรกิจ",
  "โอกาส",
  "ก้าวหน้า",
  "ลงทุน",
  "เป้าหมาย",
  "สำเร็จ",
  "วางแผน",
  "เงิน",
  "กำไร",
  "ขยับขยาย",
  "เติบโต",
];

/**
 * วินิจฉัยพลังงานใต้คำถามและบริบทของผู้ถาม
 */
export function diagnoseQuestionEnergy(
  question: string,
  intake?: { situation?: string; feeling?: string; hoped?: string }
): QuestionEnergyDiagnostic {
  const combinedText = [
    question || "",
    intake?.situation || "",
    intake?.feeling || "",
    intake?.hoped || "",
  ]
    .join(" ")
    .toLowerCase();

  let victimScore = 0;
  let paralysisScore = 0;
  let insecurityScore = 0;
  let growthScore = 0;

  for (const kw of VICTIM_KEYWORDS) {
    if (combinedText.includes(kw)) victimScore += 2;
  }
  for (const kw of PARALYSIS_KEYWORDS) {
    if (combinedText.includes(kw)) paralysisScore += 2;
  }
  for (const kw of INSECURITY_KEYWORDS) {
    if (combinedText.includes(kw)) insecurityScore += 2;
  }
  for (const kw of GROWTH_KEYWORDS) {
    if (combinedText.includes(kw)) growthScore += 2;
  }

  // กำหนดสภาวะที่มีคะแนนสูงสุด
  const maxScore = Math.max(victimScore, paralysisScore, insecurityScore, growthScore);

  if (maxScore > 0) {
    if (maxScore === victimScore) {
      return {
        energyType: "victim_powerless",
        labelTh: "สภาวะเปราะบางและต้องการพลังใจ (Vulnerable / Seeking Empowerment)",
        coreEmotionalNeed: "ต้องการการรับฟังโดยไม่ตัดสิน ความอบอุ่น และการคืนความเชื่อมั่นในศักยภาพตนเอง",
        counselingGuidance:
          "ห้ามซ้ำเติมหรือใช้คำสั่งสอนแข็งทื่อ ให้เริ่มด้วยการโอบอุ้มความรู้สึก แล้วค่อยๆ ชี้ให้เห็นว่าเขายังมีสิทธิ์เลือกและก้าวต่อไปได้",
        promptDirective:
          "• กรอบจิตวิทยา: ผู้ถามกำลังรู้สึกเปราะบาง จงใช้น้ำเสียงที่โอบอุ้มหัวใจ ชี้ให้เห็นว่าเขาไม่ได้อยู่คนเดียว และเปลี่ยนความกลัวเป็นพลังก้าวแรก",
      };
    }

    if (maxScore === paralysisScore) {
      return {
        energyType: "analysis_paralysis",
        labelTh: "สภาวะคิดวนและติดหล่มการตัดสินใจ (Analysis Paralysis)",
        coreEmotionalNeed: "ต้องการความชัดเจนในการจัดลำดับความสำคัญ และความกล้าหาญในการปล่อยวางสิ่งที่ค้างคา",
        counselingGuidance:
          "ช่วยชั่งน้ำหนักพลังงานของทางเลือกอย่างตรงไปตรงมา ชี้ให้เห็นว่าการไม่ตัดสินใจก็คือการตัดสินใจอย่างหนึ่งที่ทำให้เสียเวลาชีวิต",
        promptDirective:
          "• กรอบจิตวิทยา: ผู้ถามกำลังลังเลคิดวน จงช่วยตัดความฟุ้งซ่าน ชี้จุดสำคัญที่สุด 1 จุด และมอบเกณฑ์ตัดสินใจที่เฉียบคม",
      };
    }

    if (maxScore === insecurityScore) {
      return {
        energyType: "insecurity_attachment",
        labelTh: "สภาวะไม่มั่นคงในความสัมพันธ์ (Relational Insecurity)",
        coreEmotionalNeed: "ต้องการความจริงที่กระจ่าง และการตระหนักรู้ว่าคุณค่าของตนเองไม่ได้ขึ้นอยู่กับการยอมรับของอีกฝ่าย",
        counselingGuidance:
          "เปิดเผยความจริงบนหน้าไพ่อย่างนุ่มนวล เตือนสติไม่ให้เอาใจไปผูกไว้กับความไม่แน่นอน และชวนให้เขากลับมารักและดูแลตัวเอง",
        promptDirective:
          "• กรอบจิตวิทยา: ผู้ถามกำลังกังวลเรื่องความสัมพันธ์ จงเตือนสติอย่างอ่อนโยนว่าความรักที่ดีต้องไม่บั่นทอนคุณค่าในตัวเอง คืนจุดยืนที่สง่างามให้เขา",
      };
    }

    return {
      energyType: "growth_agency",
      labelTh: "สภาวะมุ่งมั่นพัฒนาและพร้อมลงมือทำ (Growth & Action-Oriented)",
      coreEmotionalNeed: "ต้องการวิสัยทัศน์ที่ชัดเจน กลยุทธ์ที่เฉียบคม และขั้นตอนปฏิบัติที่เป็นรูปธรรม",
      counselingGuidance:
        "ใช้น้ำเสียงที่เป็นมืออาชีพ มั่นใจ ท้าทายให้ก้าวข้ามขีดจำกัด และมอบคำแนะนำแบบ Step-by-Step ที่มีพลัง",
      promptDirective:
        "• กรอบจิตวิทยา: ผู้ถามพร้อมลุยและพัฒนา จงมอบคำแนะนำระดับกลยุทธ์ที่คมชัด หนักแน่น และผลักดันให้เขาสร้างผลลัพธ์จริง",
    };
  }

  // ค่าปริยาย: สมดุลทั่วไป
  return {
    energyType: "growth_agency",
    labelTh: "สภาวะเปิดกว้างพร้อมรับคำแนะนำ (Open & Receptive)",
    coreEmotionalNeed: "ต้องการความกระจ่างและการชี้แนะทิศทางชีวิตอย่างรอบด้าน",
    counselingGuidance: "อ่านไพ่ตามธรรมชาติด้วยความเข้าอกเข้าใจและให้กำลังใจ",
    promptDirective: "• กรอบจิตวิทยา: นำเสนอความจริงอย่างลึกซึ้ง อบอุ่น และมอบพลังบวกในการดำเนินชีวิต",
  };
}
