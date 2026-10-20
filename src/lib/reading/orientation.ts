/**
 * 🔄 ความหมายของไพ่ "ในทิศที่เซิร์ฟเวอร์จั่วจริง" — ตรรกะล้วน ไม่มี React ไม่มี I/O (A4-01)
 * ===========================================================================
 *
 * หน้าไพ่ใบเดียว (`/daily` · `/love/1-card`) วาดแผงความหมายเสริมใต้คำอ่านของแม่หมอ
 * เซิร์ฟเวอร์สุ่มกลับหัว 40% (`REVERSAL_RATE`) ภาพไพ่ · คีย์เวิร์ด · คำอ่าน AI ใช้ทิศจริงหมดแล้ว
 * แผงเสริมจึงต้องใช้ทิศเดียวกัน ไม่งั้นหน้าเดียวพูดสองทาง (ไพ่หมุน 180° แต่ข้อความอ่านหัวตั้ง)
 *
 * ⚠️ ไฟล์นี้ไม่ import ข้อมูลไพ่/คำแปลทั้งก้อน (`yes-no.ts` ลาก `meanings-en` ≈126 KB เข้าบันเดิลหน้าไพ่ใบเดียว)
 *    กติกา ใช่/ไม่ใช่ จึงสำเนาไว้ตรงนี้ — ด่าน `test-flow-state` เทียบกับ `yesNoWeight` ของจริงไม่ให้เพี้ยน
 */
import type { Category, TarotCard, YesNo } from "@/data/cards/types";

/** ความหมายรายหมวดตามทิศของไพ่ — อังกฤษใช้ `meaningsEn` ถ้ามี ไม่มีก็ถอยกลับไปภาษาไทย (ทิศเดิมเสมอ) */
export function orientedMeaning(
  card: Pick<TarotCard, "meanings" | "meaningsEn">,
  category: Category,
  isReversed: boolean,
  isEnglish: boolean,
): string {
  const dir = isReversed ? "reversed" : "upright";
  const en = isEnglish ? card.meaningsEn?.[category]?.[dir] : undefined;
  return en || card.meanings[category][dir];
}

export type OrientedTone = "positive" | "neutral" | "negative";

/**
 * ขั้วของไพ่ในทิศที่ออก — **กติกาเดียวกับหน้าสารานุกรม** (`yesNoWeight` ใน `data/cards/yes-no.ts`)
 * หัวตั้ง: yes = บวก · no = ลบ · maybe = กลาง
 * กลับหัว: ไม่กลับขั้ว แต่แรงลดครึ่งหนึ่ง (= "มีเงื่อนไข") จึงตกเป็นกลางทั้ง yes และ no
 */
export function orientedTone(yesNo: YesNo, isReversed: boolean): OrientedTone {
  const polarity = yesNo === "yes" ? 1 : yesNo === "no" ? -1 : 0;
  const weight = isReversed ? polarity * 0.5 : polarity;
  return weight >= 1 ? "positive" : weight <= -1 ? "negative" : "neutral";
}
