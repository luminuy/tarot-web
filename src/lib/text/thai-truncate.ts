/**
 * ✂️ ตัดข้อความให้พอดีกรอบโดยไม่เฉือนสระ/วรรณยุกต์ไทยจนอ่านไม่ออก
 * ===========================================================================
 *
 * ภาษาไทยไม่ได้เขียนเรียงตัวเดียวจบเหมือนอังกฤษ — หนึ่ง "ตัวที่ตาเห็น" ประกอบจากหลาย
 * code point ที่ต้องอยู่ด้วยกัน การตัดด้วย `slice(0, n)` ดิบ ๆ จึงทำให้เกิดสองอาการ:
 *
 *   1. ตัดค้างวรรณยุกต์/สระบน-ล่าง ➔ เครื่องหมายลอยไม่มีพยัญชนะรอง (เช่น "สถานการ" + "ณ์" ขาด)
 *   2. ตัดค้างสระหน้า เ แ โ ใ ไ ➔ สระลอยไม่มีพยัญชนะตาม อ่านไม่ออกทันที
 *
 * ⚠️ โมดูลนี้ต้องเป็นฟังก์ชันบริสุทธิ์ ห้ามพึ่ง DOM — ด่าน CI ยิงเคสจริงผ่านฟังก์ชันนี้
 * (INC-0213) ถ้าย้าย logic กลับไปเขียนในคอมโพเนนต์ ด่านจะตรวจไม่ได้ทันที
 */

/** สระบน · สระล่าง · วรรณยุกต์ · ทัณฑฆาต — ต้องมีพยัญชนะ "นำหน้า" เสมอ */
const THAI_COMBINING = /[ัิ-ฺ็-๎]/;

/** สระหน้า เ แ โ ใ ไ — ต้องมีพยัญชนะ "ตามหลัง" เสมอ */
const THAI_LEADING_VOWEL = /[เ-ไ]/;

/**
 * ตัดเครื่องหมายที่ลอยอยู่ท้ายสตริงทิ้ง จนกว่าตัวสุดท้ายจะยืนเองได้
 *
 * @example trimThaiOrphans("สถานการณ์".slice(0, 8)) // "สถานการ" (ไม่ใช่ "สถานการณ" ที่ทัณฑฆาตหาย)
 */
export function trimThaiOrphans(text: string): string {
  const chars = Array.from(text);
  let end = chars.length;
  while (end > 0) {
    const last = chars[end - 1];
    if (THAI_COMBINING.test(last) || THAI_LEADING_VOWEL.test(last)) {
      end -= 1;
      continue;
    }
    break;
  }
  return chars.slice(0, end).join("");
}

/**
 * ย่อข้อความให้กว้างไม่เกิน `maxWidth` โดยวัดความกว้าง "จริง" จากตัวเรนเดอร์
 *
 * ใช้กับ canvas ได้ตรง ๆ: `fitTextToWidth(text, (t) => ctx.measureText(t).width, maxW)`
 * ➔ ไม่ต้องเดาจำนวนตัวอักษร (ซึ่งผิดทันทีเมื่อเปลี่ยนฟอนต์ ขนาด หรือภาษา)
 *
 * @param measure ฟังก์ชันวัดความกว้างของข้อความ (หน่วยเดียวกับ `maxWidth`)
 */
/**
 * ตัดข้อความให้เหลือไม่เกิน `count` ตัว โดย **ห้ามตัดคาคลัสเตอร์**
 *
 * ถ้าจุดตัดไปลงพอดีตรงที่ตัวถัดไปเป็นสระบน/ล่าง/วรรณยุกต์/ทัณฑฆาต แปลว่าพยัญชนะตัวสุดท้าย
 * ที่เก็บไว้กำลังจะ "เสียเครื่องหมายของตัวเอง" ➔ ถอยออกมาทั้งคลัสเตอร์
 *
 * @example sliceThaiSafe("สถานการณ์", 8) // "สถานการ" (ไม่ใช่ "สถานการณ" ที่ทัณฑฆาตหายไป)
 */
export function sliceThaiSafe(text: string, count: number): string {
  const chars = Array.from(text);
  if (count >= chars.length) return text;
  let end = Math.max(0, count);
  while (end > 0 && end < chars.length && THAI_COMBINING.test(chars[end])) {
    end -= 1;
  }
  return trimThaiOrphans(chars.slice(0, end).join(""));
}

export function fitTextToWidth(
  text: string,
  measure: (s: string) => number,
  maxWidth: number,
  ellipsis = "…",
): string {
  if (maxWidth <= 0) return "";
  if (!text) return text;
  if (measure(text) <= maxWidth) return text;

  const total = Array.from(text).length;
  let best = "";
  for (let i = 1; i <= total; i++) {
    const candidate = sliceThaiSafe(text, i);
    if (!candidate) continue;
    if (measure(candidate + ellipsis) > maxWidth) break;
    best = candidate;
  }
  return best ? best + ellipsis : ellipsis;
}
