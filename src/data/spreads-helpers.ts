import type { Category } from "./cards/types";

/**
 * 📐 นิยามชนิดข้อมูลของผังพยากรณ์ + ฟังก์ชันเลือกภาษา (ไม่มีข้อมูลผังอยู่ในไฟล์นี้)
 *
 * ⚠️ **ห้าม import อะไรจาก `./spreads` เข้ามาในไฟล์นี้เด็ดขาด**
 *
 * ทำไมต้องแยกออกมา: `spreads.ts` เก็บผังทั้ง 25 แบบพร้อมคำอธิบายสองภาษาครบทุกตำแหน่ง
 * รวมแล้ว 85 KB · คอมโพเนนต์ฝั่งไคลเอนต์ที่ต้องการแค่ "ฟังก์ชันเลือกภาษา" 5 ตัวนี้
 * (ซึ่งรับ object เข้ามาแล้วคืนข้อความ ไม่แตะข้อมูลส่วนกลางเลยสักตัว)
 * เคยต้อง import จาก `./spreads` ซึ่งลากข้อมูลทั้งก้อนติดเข้าบันเดิลไปด้วย
 * = **17.2 KB (gzip) บน 54 หน้า** ที่ไม่มีหน้าไหนใช้ข้อมูลนั้นเลย
 * เพราะข้อมูลผังถูกดึงฝั่งเซิร์ฟเวอร์แล้วส่งลงมาเป็น prop อยู่แล้ว
 *
 * แพตเทิร์นเดียวกับ `@/data/cards/summary` ที่เคยแก้ปัญหาสำรับไพ่ 896 KB มาแล้ว
 * ด่าน `scripts/qa/test-bundle-budget.ts` คุมไม่ให้ 54 หน้านั้นโตกลับ
 */

export interface SpreadPosition {
  index: number;
  nameTh: string;
  nameEn?: string;
  /** อธิบายว่าไพ่ตรงนี้ตอบคำถามอะไร — ส่งให้ AI ใช้ตีความ */
  meaning: string;
  meaningEn?: string;
  /** พิกัดบนผืนผ้าสำหรับจัดวาง UI (หน่วยเป็นสัดส่วน 0-1) */
  x: number;
  y: number;
  /** องศาการหมุนของไพ่ เช่น ไพ่ขวางใน Celtic Cross */
  rotate?: number;
}

export interface Spread {
  id: string;
  nameTh: string;
  nameEn: string;
  /**
   * ชื่อสำหรับ SEO เท่านั้น — ใช้ใน <title> และ <h1> ของหน้า /spreads/[id]
   *
   * ⚠️ ห้ามนำไปใช้ใน UI เลือกผังเด็ดขาด เพราะทั้ง 25 ผังขึ้นต้นด้วย
   * "ดูดวงไพ่ยิปซี" เหมือนกันหมด ผู้ใช้จะแยกไม่ออกว่าผังไหนคือผังไหน
   * UI ทุกจุดต้องใช้ `nameTh` ต่อไป (ดู HANDOFF_SEO_WAVE1_2026-09-05.md)
   *
   * ที่มา: คนไทยค้น "ไพ่ยิปซี" มากกว่า "ไพ่ทาโรต์" (Google Autocomplete 8/10)
   */
  seoTitleTh?: string;
  /** คำโปรยสั้น ๆ บนหน้าเลือก spread */
  tagline: string;
  taglineEn: string;
  description: string;
  descriptionEn: string;
  /** หมวดคำถามเริ่มต้น ใช้เลือกชุดความหมายไพ่ */
  defaultCategory: Category;
  positions: SpreadPosition[];
  /** ราคาเป็นเครดิต — 0 คือเปิดให้ใช้ฟรี */
  credits: number;
  /** ให้ผู้ใช้ที่ยังไม่ล็อกอินลองได้ไหม */
  guestAllowed: boolean;
  /** โหมดตอบ ใช่/ไม่ใช่ — จะให้ AI สรุปคำตอบชัดเจนเพิ่ม */
  yesNoMode?: boolean;
  /** ใช้กับ UI ผลลัพธ์แบบไหน — ไม่ระบุ = "full" (StreamReader เดิม) */
  resultStyle?: "quick" | "full";
}

export function getSpreadName(spread: Spread, isEnglishOrLocale: boolean | string): string {
  const isEn = typeof isEnglishOrLocale === "boolean" ? isEnglishOrLocale : isEnglishOrLocale === "en";
  return isEn ? (spread.nameEn || spread.nameTh) : spread.nameTh;
}

export function getSpreadTagline(spread: Spread, isEnglishOrLocale: boolean | string): string {
  const isEn = typeof isEnglishOrLocale === "boolean" ? isEnglishOrLocale : isEnglishOrLocale === "en";
  return isEn ? (spread.taglineEn || spread.tagline) : spread.tagline;
}

export function getSpreadDescription(spread: Spread, isEnglishOrLocale: boolean | string): string {
  const isEn = typeof isEnglishOrLocale === "boolean" ? isEnglishOrLocale : isEnglishOrLocale === "en";
  return isEn ? (spread.descriptionEn || spread.description) : spread.description;
}

export function getPositionName(pos: SpreadPosition, isEnglishOrLocale: boolean | string): string {
  const isEn = typeof isEnglishOrLocale === "boolean" ? isEnglishOrLocale : isEnglishOrLocale === "en";
  return isEn ? (pos.nameEn || pos.nameTh) : pos.nameTh;
}

export function getPositionMeaning(pos: SpreadPosition, isEnglishOrLocale: boolean | string): string {
  const isEn = typeof isEnglishOrLocale === "boolean" ? isEnglishOrLocale : isEnglishOrLocale === "en";
  return isEn ? (pos.meaningEn || pos.meaning) : pos.meaning;
}
