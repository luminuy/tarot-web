/**
 * 🧹 ตัวปรับข้อความให้เป็นรูปมาตรฐานก่อนเทียบกับคลังคำวิกฤต
 * ---------------------------------------------------------------------------
 * บทเรียน (T-01): ด่านเดิมเทียบสตริงดิบกับเรกเอ็กซ์ตรง ๆ ทำได้แค่ `.normalize("NFC")`
 * ผลคือคนที่พิมพ์ว่า `ฆ่า ตัว ตาย` · `ฆาตัวตาย` (ลืมวรรณยุกต์) · `อยากต๊ายยย`
 * หรือแทรกอักขระกว้างศูนย์คั่นกลาง หลุดด่านไปทั้งหมด
 *
 * ไฟล์นี้จึงแปลงข้อความให้เหลือ "แก่น" ก่อนเทียบ และ **ต้องใช้ตัวแปลงชุดเดียวกัน
 * กับทั้งข้อความของผู้ใช้และคำในคลัง** ไม่งั้นสองฝั่งจะไม่มีวันตรงกัน
 *
 * ⚠️ ห้ามใช้กับข้อความที่จะเอาไปแสดงผลหรือส่งเข้าโมเดล — ใช้เพื่อ "เทียบ" เท่านั้น
 */

/** อักขระกว้างศูนย์/ยัติภังค์นุ่ม ที่คัดลอกมาจากแอปแชตแล้วมองไม่เห็นด้วยตา */
const INVISIBLE = /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF\u00AD]/g;

/**
 * สระอำ (U+0E33) เขียนได้สองแบบที่หน้าตาเหมือนกันบนจอ: `ทำ` (ตัวเดียว) กับ `ทํา`
 * (นิคหิต U+0E4D + สระอา) — คีย์บอร์ดบางตัวและการคัดลอกจากเอกสารให้ผลคนละแบบ
 * จึงต้องคลี่ให้เป็นรูปเดียวกันก่อน ไม่งั้นคำเดียวกันจะเทียบไม่ติด
 */
const SARA_AM = /\u0E33/g;
const SARA_AM_EXPANDED = "\u0E4D\u0E32";

/** วรรณยุกต์และเครื่องหมายไทยที่คนพิมพ์ตกหรือใส่เกินได้ง่าย (U+0E47–U+0E4E) */
const THAI_TONE_MARKS = /[\u0E47-\u0E4E]/g;

/** ช่องว่างทุกชนิดรวมถึงช่องว่างแบบไม่ตัดบรรทัด */
const ANY_SPACE = /[\s\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]+/g;

/**
 * รูปที่ 1 — "แน่น": ตัดช่องว่างทิ้งทั้งหมด
 * ภาษาไทยไม่เว้นวรรคระหว่างคำอยู่แล้ว การตัดช่องว่างจึงทำให้ `ฆ่า ตัว ตาย`
 * กลับมาเท่ากับ `ฆ่าตัวตาย` โดยไม่ต้องเขียนเรกเอ็กซ์รองรับช่องว่างทุกตำแหน่ง
 */
export function tightForm(input: string): string {
  return input
    .normalize("NFC")
    .replace(INVISIBLE, "")
    .toLowerCase()
    .replace(ANY_SPACE, "");
}

/**
 * รูปที่ 2 — "หลวม": ถอดวรรณยุกต์ไทยออก แล้วยุบอักษรที่ซ้ำติดกันให้เหลือตัวเดียว
 * ครอบคนที่พิมพ์ `ฆาตัวตาย` (ตกไม้เอก) · `อยากต๊ายยย` (ใส่วรรณยุกต์ผิด + ลากเสียง)
 * และ `diiiie` ในฝั่งอังกฤษ
 */
export function looseForm(input: string): string {
  return squeezeRepeats(toneStrippedForm(input));
}

/**
 * รูปที่ 2ก — "ถอดวรรณยุกต์": ตัดช่องว่าง + ถอดวรรณยุกต์ แต่ **ไม่** ยุบอักษรซ้ำ
 * ใช้กับกฎที่เป็นเรกเอ็กซ์ เพราะการยุบอักษรซ้ำในตัวเรกเอ็กซ์เองจะทำให้ `{0,24}` พัง
 */
export function toneStrippedForm(input: string): string {
  return foldThai(tightForm(input));
}

/** คลี่สระอำแล้วถอดวรรณยุกต์ — ใช้กับทั้งข้อความและตัวบทเรกเอ็กซ์ */
function foldThai(text: string): string {
  return text.replace(SARA_AM, SARA_AM_EXPANDED).replace(THAI_TONE_MARKS, "");
}

/** ถอดวรรณยุกต์ออกจาก "ตัวบทเรกเอ็กซ์" — ปลอดภัยเพราะวรรณยุกต์ไทยไม่ใช่อักขระพิเศษของเรกเอ็กซ์ */
export function stripToneMarksFromSource(source: string): string {
  return foldThai(source);
}

/**
 * รูปที่ 3 — "มีช่องว่าง": ยุบช่องว่างให้เหลือช่องเดียว
 * เก็บไว้สำหรับเรกเอ็กซ์อังกฤษที่ต้องพึ่งขอบคำ `\b` (เช่น `kms` ที่ห้ามไปชนกับ `10 kms`)
 */
export function spacedForm(input: string): string {
  return input
    .normalize("NFC")
    .replace(INVISIBLE, "")
    .toLowerCase()
    .replace(ANY_SPACE, " ")
    .trim();
}

/** ยุบอักษรเดียวกันที่ซ้ำติดกันตั้งแต่ 2 ตัวขึ้นไปให้เหลือตัวเดียว */
export function squeezeRepeats(input: string): string {
  let out = "";
  let prev = "";
  for (const ch of input) {
    if (ch !== prev) out += ch;
    prev = ch;
  }
  return out;
}

/** ทุกรูปที่ใช้เทียบ — เรียงจากเข้มงวดไปหลวม */
export interface MatchForms {
  /** ตัดช่องว่างทิ้งทั้งหมด */
  tight: string;
  /** tight + ถอดวรรณยุกต์ */
  toneStripped: string;
  /** tight + ถอดวรรณยุกต์ + ยุบอักษรซ้ำ */
  loose: string;
  /** ยุบช่องว่างเหลือช่องเดียว — สำหรับเรกเอ็กซ์อังกฤษที่ต้องใช้ขอบคำ */
  spaced: string;
}

export function matchForms(input: string): MatchForms {
  const tight = tightForm(input);
  const toneStripped = foldThai(tight);
  return {
    tight,
    toneStripped,
    loose: squeezeRepeats(toneStripped),
    spaced: spacedForm(input),
  };
}
