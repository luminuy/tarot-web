import type { TarotCard } from "@/data/cards/types";
import { cardSummaryById } from "@/data/cards/summary";

export type BirthCardItem = Pick<
  TarotCard,
  "id" | "arcana" | "suit" | "number" | "nameTh" | "nameEn" | "image" | "element" | "astrology"
> & {
  astrologyEn?: string;
  numerology?: string;
  numerologyEn?: string;
  keywords?: { upright: string[]; reversed: string[] };
  keywordsEn?: { upright: string[]; reversed: string[] };
  meanings?: Partial<TarotCard["meanings"]>;
};

export interface BirthCardResult<T extends BirthCardItem = BirthCardItem> {
  day: number;
  month: number;
  yearCe: number;
  yearBe: number;
  calculatedSum: number;
  primaryNumber: number;
  primaryCard: T;
  secondaryNumber?: number;
  secondaryCard?: T;
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
 * กฎเหล็กข้อ 14: หากไม่พบไพ่ในสำรับ ต้องคืน undefined ห้ามสุ่มหรือกุไพ่ขึ้นมาเองเด็ดขาด
 */
export function calculateBirthCard<T extends BirthCardItem = BirthCardItem>(
  day: number,
  month: number,
  year: number,
  isBuddhistEra = false,
  cards?: readonly T[],
): BirthCardResult<T> | undefined {
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

  // ค้นหาไพ่ชุดใหญ่: ถ้าส่ง cards มาให้หาจาก cards ถ้าไม่ส่งให้ใช้ cardSummaryById (zero bundle)
  let primaryCard: T | undefined;
  if (cards && cards.length > 0) {
    primaryCard = cards.find(
      (card) => card.arcana === "major" && card.number === majorCardNumber,
    );
  } else {
    const cardId = `major-${String(majorCardNumber).padStart(2, "0")}`;
    primaryCard = cardSummaryById(cardId) as unknown as T | undefined;
  }

  // กฎข้อ 14: หากหาไม่เจอ ต้องคืน undefined ห้าม fallback ปลอม
  if (!primaryCard) {
    return undefined;
  }

  // คำนวณไพ่จิตวิญญาณรอง (Secondary Soul Card) หากไพ่หลักเป็นเลขสองหลัก (10-21)
  let secondaryCard: T | undefined;
  let secondaryNumber: number | undefined;

  if (majorCardNumber >= 10 && majorCardNumber <= 21) {
    secondaryNumber = majorCardNumber
      .toString()
      .split("")
      .reduce((sum, digit) => sum + Number.parseInt(digit, 10), 0);

    if (cards && cards.length > 0) {
      secondaryCard = cards.find(
        (card) => card.arcana === "major" && card.number === secondaryNumber,
      );
    } else {
      const cardId = `major-${String(secondaryNumber).padStart(2, "0")}`;
      secondaryCard = cardSummaryById(cardId) as unknown as T | undefined;
    }
  } else if (majorCardNumber === 0) {
    // 22/0 The Fool มีไพ่คู่บารมีคือ 4 (The Emperor)
    secondaryNumber = 4;
    if (cards && cards.length > 0) {
      secondaryCard = cards.find(
        (card) => card.arcana === "major" && card.number === 4,
      );
    } else {
      secondaryCard = cardSummaryById("major-04") as unknown as T | undefined;
    }
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
