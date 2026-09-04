/**
 * 🛡️ ยามภาษาศักดิ์สิทธิ์ (Sacred Language & Foreign Script Guard)
 * ------------------------------------------------------------------
 * ป้องกันคำทำนายหลุดเป็นภาษาจีน ญี่ปุ่น เกาหลี หรือภาษาต่างด้าวที่ผู้ใช้ไทยอ่านไม่ออก
 *
 * ที่มา: โมเดลตระกูล Qwen (บน Groq LPU) ถูกเทรนด้วยคลังจีนเป็นหลัก
 * เมื่อประมวลผลคำถามยาวหรือสลับซับซ้อน อาจ "หลุด" อักษรจีน (Hanzi) หรือเครื่องหมายวรรคตอนจีนปนออกมา
 *
 * เกราะป้องกันระดับสากล:
 * 1. ใช้ Unicode Property Escapes (/u flag) จับอักษรจีนทุกรูปแบบ (\p{sc=Han})
 * 2. ดักจับอักษรญี่ปุ่น เกาหลี ซีริลลิก อาหรับ เทวนาครี และเครื่องหมายวรรคตอน Fullwidth จีน
 * 3. มีฟังก์ชันนับจำนวนเพื่อใช้เป็น Circuit Breaker สลับไปโมเดลสำรอง (Gemini) ทันทีหากหลุดเกินเกณฑ์
 */

/**
 * Regex สากลครอบคลุมอักษรต่างด้าวที่ไม่ควรปรากฏในผลคำทำนายภาษาไทย
 * - \p{sc=Han}: อักษรจีนทุกระนาบ Unicode (ครอบคลุมทั้งตัวย่อ ตัวเต็ม และโบราณ)
 * - \p{sc=Hiragana}|\p{sc=Katakana}: ญี่ปุ่น
 * - \p{sc=Hangul}: เกาหลี
 * - \p{sc=Cyrillic}|\p{sc=Arabic}|\p{sc=Devanagari}|\p{sc=Hebrew}: รัสเซีย อาหรับ อินเดีย ฮีบรู
 * - \u3000-\u303F: CJK Symbols and Punctuation (เช่น 。「」『』)
 * - \uFF01-\uFF0F\uFF1A-\uFF20\uFF3B-\uFF40\uFF5B-\uFF65: Fullwidth ASCII/Punctuation (เช่น ，：！？)
 * - \uFFFD: Mojibake (Replacement Character จากการ decode พัง)
 */
export const FOREIGN_SCRIPT_REGEX =
  /[\p{sc=Han}\p{sc=Hiragana}\p{sc=Katakana}\p{sc=Hangul}\p{sc=Cyrillic}\p{sc=Arabic}\p{sc=Devanagari}\p{sc=Hebrew}\u3000-\u303F\uFF01-\uFF0F\uFF1A-\uFF20\uFF3B-\uFF40\uFF5B-\uFF65\uFFFD]/gu;

/**
 * ตรวจว่าข้อความมีอักษรต่างด้าวปนอยู่หรือไม่
 */
export function hasForeignScript(text: string | null | undefined): boolean {
  if (!text) return false;
  FOREIGN_SCRIPT_REGEX.lastIndex = 0;
  return FOREIGN_SCRIPT_REGEX.test(text);
}

/**
 * นับจำนวนอักษรต่างด้าวที่พบในข้อความ
 */
export function countForeignCharacters(text: string | null | undefined): number {
  if (!text) return 0;
  const matches = text.match(FOREIGN_SCRIPT_REGEX);
  return matches ? matches.length : 0;
}

/**
 * ตารางแปลงคำภาษาจีนที่โมเดลตระกูล Qwen มักเผลอหลุดออกมา ให้เป็นคำภาษาไทยธรรมชาติก่อนทำความสะอาด
 */
export const CHINESE_LEAK_MAP: Record<string, string> = {
  "仓促": "รีบร้อน",
  "向你": "สู่คุณ",
  "以及": "และ",
  "非常": "อย่างยิ่ง",
  "然而": "อย่างไรก็ตาม",
  "因此": "ดังนั้น",
  "建议": "ขอแนะนำว่า",
  "但是": "แต่",
  "或者": "หรือ",
  "所以": "ดังนั้น",
  "目前": "ในขณะนี้",
  "如果": "หาก",
  "未来": "ในอนาคต",
  "过去": "ในอดีต",
  "现在": "ในปัจจุบัน",
  "需要": "จำเป็นต้อง",
  "可以": "สามารถ",
  "可能": "อาจจะ",
  "同时": "ในขณะเดียวกัน",
  "不仅": "ไม่เพียงแต่",
  "而且": "แต่ยัง",
  "甚至": "แม้กระทั่ง",
  "特别": "เป็นพิเศษ",
  "例如": "เช่น",
  "最后": "ท้ายที่สุด",
  "首先": "ประการแรก",
};

/**
 * 🚦 เกณฑ์ตัดวงจรเมื่อคำอ่านหลุดภาษาต่างด้าว — **แหล่งความจริงเดียวของตัวเลขทั้งสองระดับ**
 * ---------------------------------------------------------------------------
 * ⚠️ ห้ามเขียนตัวเลขพวกนี้ซ้ำที่อื่นเด็ดขาด ให้ import ไปใช้เท่านั้น
 * ของเดิมเลข 14 กับ 20 ถูกฮาร์ดโค้ดไว้ใน `groq.ts` แยกจากค่า default ของฟังก์ชันข้างล่าง
 * ถ้ามีคนปรับที่ไฟล์ใดไฟล์หนึ่ง อีกที่จะยังใช้ค่าเดิมโดยไม่มีอะไรเตือน
 * แล้วเกณฑ์ "สลับโมเดล" กับ "เลิกกับ Groq ทั้งชุด" จะเพี้ยนไปคนละทางแบบเงียบ ๆ
 *
 * สองระดับต่างกันตรงนี้:
 * - `SWITCH`  = โมเดลตัวนี้เริ่มหลุด → ลองโมเดล Groq ตัวถัดไป
 * - `SEVERE`  = หลุดหนักระดับทั้งประโยค → เลิกกับ Groq ทั้งชุด กระโดดไป Gemini ทันที
 */
export const FOREIGN_LEAK_SWITCH_THRESHOLD = 14;
export const SEVERE_FOREIGN_LEAK_THRESHOLD = 20;

/**
 * ตรวจว่ามีการหลุดของภาษาต่างด้าวอย่างร้ายแรงหรือไม่
 * (หลุดทั้งประโยคหรือทั้งย่อหน้า >= `SEVERE_FOREIGN_LEAK_THRESHOLD` ตัวอักษร)
 * ใช้เป็นเกณฑ์ตัดวงจร (Circuit Breaker) เพื่อข้ามโมเดล Groq ที่เหลือแล้วสลับไป Gemini ทันที
 */
export function isSevereForeignLeak(
  text: string | null | undefined,
  threshold: number = SEVERE_FOREIGN_LEAK_THRESHOLD,
): boolean {
  return countForeignCharacters(text) >= threshold;
}

/**
 * ตรวจทุกค่าที่เป็นสตริงในวัตถุซ้อนชั้น (ใช้กับผลคำทำนายที่เป็น JSON)
 */
export function objectHasForeignScript(value: unknown): boolean {
  if (typeof value === "string") return hasForeignScript(value);
  if (Array.isArray(value)) return value.some(objectHasForeignScript);
  if (value && typeof value === "object" && value !== null) return Object.values(value).some(objectHasForeignScript);
  return false;
}

/**
 * นับจำนวนอักษรต่างด้าวสะสมในวัตถุซ้อนชั้น
 */
export function countObjectForeignCharacters(value: unknown): number {
  if (typeof value === "string") return countForeignCharacters(value);
  if (Array.isArray(value)) {
    return value.reduce((sum, item) => sum + countObjectForeignCharacters(item), 0);
  }
  if (value && typeof value === "object" && value !== null) {
    return Object.values(value).reduce((sum, val) => sum + countObjectForeignCharacters(val), 0);
  }
  return 0;
}

/**
 * ลบอักษรต่างด้าวทิ้งและจัดเก็บกวาดช่องไฟอย่างสละสลวย
 * 1. แปลงคำศัพท์จีนที่พบบ่อยเป็นภาษาไทยสละสลวย
 * 2. ลบอักษรต่างด้าวที่เหลืออยู่ทั้งหมดด้วย Unicode Property Escapes
 * 3. คงอักษรไทย อังกฤษ ตัวเลข และวรรคตอนสากลไว้ 100%
 */
export function stripForeignScript(text: string): string {
  if (!text) return "";
  let processed = text;
  for (const [hanzi, thai] of Object.entries(CHINESE_LEAK_MAP)) {
    processed = processed.replaceAll(hanzi, thai);
  }
  return processed
    .replace(FOREIGN_SCRIPT_REGEX, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.!?…])/g, "$1")
    .trim();
}

/**
 * ลบอักษรต่างด้าวออกจากทุกสตริงในวัตถุซ้อนชั้น (คงรูปร่าง Type เดิมไว้ทั้งหมด)
 */
export function stripForeignScriptDeep<T>(value: T): T {
  if (typeof value === "string") return stripForeignScript(value) as unknown as T;
  if (Array.isArray(value)) return value.map(stripForeignScriptDeep) as unknown as T;
  if (value && typeof value === "object" && value !== null) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = stripForeignScriptDeep(v);
    }
    return out as T;
  }
  return value;
}

/**
 * ลบแท็กกระบวนการคิดภายในของ AI เช่น <think>...</think>, <thought>...</thought>, <reasoning>...</reasoning>
 * ---------------------------------------------------------------------------------------------------
 * ที่มา: โมเดลประเภท Reasoning (เช่น Qwen 2.5/3.x, DeepSeek R1 บน Groq)
 * จะส่งแท็ก <think>...</think> ออกมาแสดงกระบวนการคิด ซึ่งเป็นข้อมูลภายในของโมเดล
 * ไม่ควรแสดงให้ผู้ใช้หรือแสดงในแผงผู้ดูแลระบบเด็ดขาด
 */
export function stripThinkingTags(text: string | null | undefined): string {
  if (!text) return "";
  let cleaned = text.replace(/<(think|thought|reasoning)>[\s\S]*?<\/\1>/gi, "");
  cleaned = cleaned.replace(/<(think|thought|reasoning)>[\s\S]*$/gi, "");
  return cleaned.trim();
}

/**
 * ทำความสะอาดสมบูรณ์แบบในฟังก์ชันเดียว: ตัดแท็กคิด + ลบอักษรต่างด้าว
 */
export function sanitizeTarotText(text: string | null | undefined): string {
  return stripForeignScript(stripThinkingTags(text));
}
