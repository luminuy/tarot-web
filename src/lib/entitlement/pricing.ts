/**
 * 💰 ตัวเลขที่ใช้โชว์บนหน้าราคา / หน้าต่างเติมรอบ — คำนวณจาก `packages.ts` ที่เดียว
 * ===========================================================================
 * ⚠️ ห้ามพิมพ์ "ครั้งละ 10 บาท" หรือ "ประหยัด 49%" ลงในข้อความเอง — เปลี่ยนราคาเมื่อไร
 *    ตัวเลขที่พิมพ์ไว้จะโกหกลูกค้าทันที (ไฟล์นี้ไม่แตะ I/O ด่านตรวจเรียกตรงได้)
 */

import type { CreditPackage } from "./packages";

/** ราคาต่อครั้ง ปัดเป็นบาทเต็ม (59/3 = 19.67 ➔ 20) */
export function pricePerReadingThb(pkg: Pick<CreditPackage, "priceThb" | "credits">): number {
  return Math.round(pkg.priceThb / pkg.credits);
}

/**
 * ถูกกว่าแพ็กที่แพงที่สุดต่อครั้งกี่เปอร์เซ็นต์ (ปัดลง — ห้ามโม้เกินจริง)
 * แพ็กที่เป็นฐานเทียบเองได้ 0 ➔ ไม่ต้องโชว์ป้าย
 */
export function savingsPercent(
  pkg: Pick<CreditPackage, "priceThb" | "credits">,
  all: ReadonlyArray<Pick<CreditPackage, "priceThb" | "credits">>,
): number {
  const base = Math.max(...all.map((p) => p.priceThb / p.credits));
  const mine = pkg.priceThb / pkg.credits;
  if (!(base > 0) || mine >= base) return 0;
  return Math.floor(((base - mine) / base) * 100);
}
