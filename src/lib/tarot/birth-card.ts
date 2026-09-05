import { DECK, type TarotCard } from "@/data/cards";

export interface BirthCardResult {
  day: number;
  month: number;
  yearCe: number;
  yearBe: number;
  calculatedSum: number;
  primaryNumber: number;
  primaryCard: TarotCard;
  secondaryNumber?: number;
  secondaryCard?: TarotCard;
  method: "standard_numerology";
}

/**
 * ลดทอนตัวเลขด้วยการบวกเลขโดดจนกระทั่งได้ค่า <= 22
 */
export function reduceToTarotNumber(num: number): number {
  let current = num;
  while (current > 22) {
    current = current
      .toString()
      .split("")
      .reduce((sum, digit) => sum + Number.parseInt(digit, 10), 0);
  }
  return current;
}

/**
 * คำนวณไพ่ทาโรต์ประจำตัว (Tarot Birth Card) ตามหลักเลขศาสตร์สากล
 * กฎเหล็กข้อ 14: หากไม่พบไพ่ในสำรับ 78 ใบ ต้องคืน undefined ห้ามสุ่มหรือกุไพ่ขึ้นมาเองเด็ดขาด
 */
export function calculateBirthCard(
  day: number,
  month: number,
  year: number,
  isBuddhistEra = false,
): BirthCardResult | undefined {
  if (!day || !month || !year || day < 1 || day > 31 || month < 1 || month > 12) {
    return undefined;
  }

  // ปรับปี พ.ศ. เป็น ค.ศ.
  const yearCe = isBuddhistEra ? year - 543 : year;
  const yearBe = isBuddhistEra ? year : year + 543;

  if (yearCe < 1800 || yearCe > 2200) {
    return undefined;
  }

  // วิธีมาตรฐาน: รวม วัน + เดือน + ปี ค.ศ.
  const initialSum = day + month + yearCe;
  const primaryNumber = reduceToTarotNumber(initialSum);

  // ในเลขศาสตร์ทาโรต์ 22 เทียบเท่ากับ 0 (The Fool)
  const majorCardNumber = primaryNumber === 22 ? 0 : primaryNumber;

  // ค้นหาไพ่ชุดใหญ่ในสำรับ 78 ใบ
  const primaryCard = DECK.find(
    (card) => card.arcana === "major" && card.number === majorCardNumber,
  );

  // กฎข้อ 14: หากหาไม่เจอ ต้องคืน undefined ห้าม fallback ปลอม
  if (!primaryCard) {
    return undefined;
  }

  // คำนวณไพ่จิตวิญญาณรอง (Secondary Soul Card) หากไพ่หลักเป็นเลขสองหลัก (10-21)
  let secondaryCard: TarotCard | undefined;
  let secondaryNumber: number | undefined;

  if (majorCardNumber >= 10 && majorCardNumber <= 21) {
    secondaryNumber = majorCardNumber
      .toString()
      .split("")
      .reduce((sum, digit) => sum + Number.parseInt(digit, 10), 0);

    secondaryCard = DECK.find(
      (card) => card.arcana === "major" && card.number === secondaryNumber,
    );
  } else if (majorCardNumber === 0) {
    // 22/0 The Fool มีไพ่คู่บารมีคือ 4 (The Emperor)
    secondaryNumber = 4;
    secondaryCard = DECK.find(
      (card) => card.arcana === "major" && card.number === 4,
    );
  }

  return {
    day,
    month,
    yearCe,
    yearBe,
    calculatedSum: initialSum,
    primaryNumber: majorCardNumber,
    primaryCard,
    secondaryNumber,
    secondaryCard,
    method: "standard_numerology",
  };
}
