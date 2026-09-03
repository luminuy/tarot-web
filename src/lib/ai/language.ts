/**
 * ยามภาษา — กันคำทำนายหลุดเป็นภาษาอื่นที่ผู้ใช้อ่านไม่ออก
 *
 * ที่มา: โมเดลตระกูล Qwen (`qwen/qwen3.8-27b`, `qwen/qwen3.6-27b` บน Groq) ถูกเทรนด้วยคลังจีนเป็นหลัก
 * เวลาโดนคำถามยาว ๆ หรืออุณหภูมิสูง มันจะ "หลุด" กลับไปคิดเป็นจีนแล้วพ่นอักษรจีนปนออกมากลางประโยคไทย
 * prompt อย่างเดียวกันไม่ได้ 100% จึงต้องมีด่านตรวจฝั่งเซิร์ฟเวอร์ด้วย
 *
 * ขอบเขต: บล็อกเฉพาะ "ตัวเขียน" (script) ที่ผู้ใช้ไทยอ่านไม่ออก
 * อังกฤษ/ตัวเลข/สัญลักษณ์ ปล่อยผ่าน เพราะชื่อไพ่ 1909 เป็นอังกฤษทั้งหมด (The Star, Page of Cups ฯลฯ)
 */

/** อักษรที่ไม่ควรโผล่ในคำทำนายภาษาไทยเด็ดขาด */
const FOREIGN_SCRIPT =
  /[　-〿぀-ゟ゠-ヿ㐀-䶿一-鿿豈-﫿＀-￯가-힯Ѐ-ӿ֐-׿؀-ۿऀ-ॿ]/;

const FOREIGN_SCRIPT_GLOBAL = new RegExp(FOREIGN_SCRIPT.source, "g");

/** `true` = ข้อความมีอักษรจีน/ญี่ปุ่น/เกาหลี/ซีริลลิก/อารบิก/ฮีบรู/เทวนาครีปน */
export function hasForeignScript(text: string | null | undefined): boolean {
  if (!text) return false;
  return FOREIGN_SCRIPT.test(text);
}

/** ตรวจทุกค่าที่เป็นสตริงในวัตถุซ้อนชั้น (ใช้กับผลคำทำนายที่เป็น JSON) */
export function objectHasForeignScript(value: unknown): boolean {
  if (typeof value === "string") return hasForeignScript(value);
  if (Array.isArray(value)) return value.some(objectHasForeignScript);
  if (value && typeof value === "object") return Object.values(value).some(objectHasForeignScript);
  return false;
}

/**
 * ทางเลือกสุดท้าย — ลบอักษรต่างด้าวทิ้งแล้วเก็บกวาดช่องว่าง
 *
 * ใช้เมื่อ retry ไม่ได้แล้ว (เช่น สตรีมส่งออกไปหาผู้ใช้แล้ว) ดีกว่าปล่อยอักษรจีนค้างในบันทึกดวง
 * ไม่ใช่ทางแก้หลัก — ทางแก้หลักคือ retry ไปโมเดลถัดไป
 */
export function stripForeignScript(text: string): string {
  return text
    .replace(FOREIGN_SCRIPT_GLOBAL, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.!?…])/g, "$1")
    .trim();
}

/** ลบอักษรต่างด้าวออกจากทุกสตริงในวัตถุซ้อนชั้น (คงรูปร่างเดิมไว้ทั้งหมด) */
export function stripForeignScriptDeep<T>(value: T): T {
  if (typeof value === "string") return stripForeignScript(value) as unknown as T;
  if (Array.isArray(value)) return value.map(stripForeignScriptDeep) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = stripForeignScriptDeep(v);
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
  // 1. ตัด <think>...</think>, <thought>...</thought>, <reasoning>...</reasoning> ทั้งหมด
  let cleaned = text.replace(/<(think|thought|reasoning)>[\s\S]*?<\/\1>/gi, "");
  // 2. กรณีสตรีมหรือโดนตัดคำก่อนปิดแท็ก (ไม่มีแท็กปิด) ให้ตัดตั้งแต่แท็กเปิดไปจนสุด
  cleaned = cleaned.replace(/<(think|thought|reasoning)>[\s\S]*$/gi, "");
  return cleaned.trim();
}
