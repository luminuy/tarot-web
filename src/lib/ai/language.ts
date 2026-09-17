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

import { polishThai } from "@/lib/ai/thai-quality";

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
 * \uD83C\uDDF5\uD83C\uDDF9 \u0E20\u0E32\u0E29\u0E32\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49 "\u0E2D\u0E31\u0E01\u0E29\u0E23\u0E25\u0E30\u0E15\u0E34\u0E19\u0E40\u0E2B\u0E21\u0E37\u0E2D\u0E19\u0E2D\u0E31\u0E07\u0E01\u0E24\u0E29" \u2014 \u0E23\u0E39\u0E17\u0E35\u0E48 `FOREIGN_SCRIPT_REGEX` \u0E21\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E40\u0E2B\u0E47\u0E19\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E27\u0E14
 * ---------------------------------------------------------------------------
 * \u0E40\u0E04\u0E2A\u0E08\u0E23\u0E34\u0E07\u0E17\u0E35\u0E48\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E40\u0E08\u0E2D: `"\u0E43\u0E19\u0E1A\u0E23\u0E34\u0E1A\u0E17\u0E17\u0E35\u0E48 voc\u00EA \u0E40\u0E1A\u0E37\u0E48\u0E2D\u0E0A\u0E35\u0E27\u0E34\u0E15 \u0E44\u0E1E\u0E48\u0E43\u0E1A\u0E19\u0E35\u0E49\u0E01\u0E33\u0E25\u0E31\u0E07\u0E1A\u0E2D\u0E01..."`
 * (`voc\u00EA` = "\u0E04\u0E38\u0E13" \u0E43\u0E19\u0E20\u0E32\u0E29\u0E32\u0E42\u0E1B\u0E23\u0E15\u0E38\u0E40\u0E01\u0E2A)
 *
 * \u0E14\u0E48\u0E32\u0E19\u0E40\u0E14\u0E34\u0E21\u0E14\u0E39\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E2D\u0E31\u0E01\u0E29\u0E23\u0E17\u0E35\u0E48 **\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E25\u0E30\u0E15\u0E34\u0E19** (\u0E08\u0E35\u0E19 \u0E0D\u0E35\u0E48\u0E1B\u0E38\u0E48\u0E19 \u0E40\u0E01\u0E32\u0E2B\u0E25\u0E35 \u0E23\u0E31\u0E2A\u0E40\u0E0B\u0E35\u0E22 \u0E2D\u0E32\u0E2B\u0E23\u0E31\u0E1A \u0E2E\u0E34\u0E19\u0E14\u0E35 \u0E2E\u0E35\u0E1A\u0E23\u0E39)
 * \u0E40\u0E1E\u0E23\u0E32\u0E30\u0E2D\u0E31\u0E01\u0E29\u0E23\u0E25\u0E30\u0E15\u0E34\u0E19\u0E16\u0E39\u0E01\u0E43\u0E0A\u0E49\u0E08\u0E23\u0E34\u0E07\u0E17\u0E31\u0E49\u0E07\u0E40\u0E27\u0E47\u0E1A \u2014 \u0E0A\u0E37\u0E48\u0E2D\u0E44\u0E1E\u0E48 `The Lovers` \u00B7 \u0E2B\u0E19\u0E49\u0E32 `/en` \u0E17\u0E31\u0E49\u0E07\u0E0A\u0E38\u0E14
 * \u0E08\u0E30\u0E41\u0E1A\u0E19\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u00B7 \u0E1C\u0E25\u0E04\u0E37\u0E2D\u0E42\u0E1B\u0E23\u0E15\u0E38\u0E40\u0E01\u0E2A \u0E2A\u0E40\u0E1B\u0E19 \u0E1D\u0E23\u0E31\u0E48\u0E07\u0E40\u0E28\u0E2A \u0E40\u0E22\u0E2D\u0E23\u0E21\u0E31\u0E19 \u0E40\u0E27\u0E35\u0E22\u0E14\u0E19\u0E32\u0E21 \u0E2D\u0E34\u0E19\u0E42\u0E14\u0E19\u0E35\u0E40\u0E0B\u0E35\u0E22
 * **\u0E2B\u0E25\u0E38\u0E14\u0E1C\u0E48\u0E32\u0E19\u0E44\u0E14\u0E49\u0E2B\u0E21\u0E14\u0E42\u0E14\u0E22\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2D\u0E30\u0E44\u0E23\u0E17\u0E33\u0E07\u0E32\u0E19\u0E40\u0E25\u0E22** \u0E17\u0E31\u0E49\u0E07\u0E17\u0E35\u0E48\u0E42\u0E21\u0E40\u0E14\u0E25\u0E2B\u0E25\u0E32\u0E22\u0E20\u0E32\u0E29\u0E32\u0E2D\u0E22\u0E48\u0E32\u0E07 Qwen
 * \u0E2B\u0E25\u0E38\u0E14\u0E40\u0E1B\u0E47\u0E19\u0E20\u0E32\u0E29\u0E32\u0E1E\u0E27\u0E01\u0E19\u0E35\u0E49\u0E07\u0E48\u0E32\u0E22\u0E01\u0E27\u0E48\u0E32\u0E08\u0E35\u0E19\u0E14\u0E49\u0E27\u0E22\u0E0B\u0E49\u0E33
 *
 * \u0E40\u0E2A\u0E49\u0E19\u0E41\u0E1A\u0E48\u0E07\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E44\u0E14\u0E49\u0E08\u0E23\u0E34\u0E07: **\u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23\u0E25\u0E30\u0E15\u0E34\u0E19\u0E17\u0E35\u0E48\u0E21\u0E35\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E2B\u0E21\u0E32\u0E22\u0E01\u0E33\u0E01\u0E31\u0E1A** \u0E0B\u0E36\u0E48\u0E07\u0E20\u0E32\u0E29\u0E32\u0E2D\u0E31\u0E07\u0E01\u0E24\u0E29\u0E41\u0E17\u0E1A\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E49
 * \u0E2A\u0E41\u0E01\u0E19\u0E17\u0E31\u0E49\u0E07 `src/data/` `src/app/_shared/` `src/components/` \u0E41\u0E25\u0E49\u0E27\u0E1E\u0E1A\u0E15\u0E31\u0E27\u0E43\u0E19\u0E0A\u0E48\u0E27\u0E07\u0E19\u0E35\u0E49\u0E41\u0E04\u0E48
 * `\u00D7` (U+00D7) \u0E01\u0E31\u0E1A `\u0192` (U+0192) \u0E0B\u0E36\u0E48\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E2A\u0E31\u0E0D\u0E25\u0E31\u0E01\u0E29\u0E13\u0E4C \u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23 \u2014 \u0E08\u0E36\u0E07\u0E22\u0E01\u0E40\u0E27\u0E49\u0E19\u0E2A\u0E2D\u0E07\u0E15\u0E31\u0E27\u0E19\u0E35\u0E49
 * \u0E41\u0E25\u0E49\u0E27\u0E17\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E16\u0E37\u0E2D\u0E27\u0E48\u0E32\u0E15\u0E48\u0E32\u0E07\u0E14\u0E49\u0E32\u0E27\u0E44\u0E14\u0E49\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E1B\u0E25\u0E2D\u0E14\u0E20\u0E31\u0E22
 */
const ACCENTED_LATIN_CLASS = "\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u00FF\\u0100-\\u017F\\u0180-\\u024F\\u1E00-\\u1EFF";

/**
 * \u0E08\u0E31\u0E1A **\u0E17\u0E31\u0E49\u0E07\u0E04\u0E33** \u0E17\u0E35\u0E48\u0E21\u0E35\u0E2D\u0E31\u0E01\u0E29\u0E23\u0E21\u0E35\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E2B\u0E21\u0E32\u0E22\u0E01\u0E33\u0E01\u0E31\u0E1A\u0E2D\u0E22\u0E39\u0E48\u0E02\u0E49\u0E32\u0E07\u0E43\u0E19 \u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E08\u0E31\u0E1A\u0E41\u0E04\u0E48\u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23\u0E19\u0E31\u0E49\u0E19
 *
 * \u26A0\uFE0F \u0E2A\u0E33\u0E04\u0E31\u0E0D: \u0E16\u0E49\u0E32\u0E15\u0E31\u0E14\u0E41\u0E04\u0E48\u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23 `n\u00E3o` \u0E08\u0E30\u0E40\u0E2B\u0E25\u0E37\u0E2D `no` \u0E41\u0E25\u0E30 `voc\u00EA` \u0E08\u0E30\u0E40\u0E2B\u0E25\u0E37\u0E2D `voc`
 * \u0E0B\u0E36\u0E48\u0E07\u0E41\u0E22\u0E48\u0E01\u0E27\u0E48\u0E32\u0E40\u0E14\u0E34\u0E21 \u0E40\u0E1E\u0E23\u0E32\u0E30\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E40\u0E2B\u0E47\u0E19\u0E04\u0E33\u0E1E\u0E34\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E2D\u0E48\u0E32\u0E19\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E41\u0E17\u0E19\u0E17\u0E35\u0E48\u0E08\u0E30\u0E40\u0E2B\u0E47\u0E19\u0E04\u0E33\u0E17\u0E35\u0E48\u0E16\u0E39\u0E01\u0E41\u0E17\u0E19\u0E2B\u0E23\u0E37\u0E2D\u0E2B\u0E32\u0E22\u0E44\u0E1B\u0E40\u0E25\u0E22
 */
const ACCENTED_LATIN_WORD_REGEX = new RegExp(
  `[A-Za-z${ACCENTED_LATIN_CLASS}]*[${ACCENTED_LATIN_CLASS}][A-Za-z${ACCENTED_LATIN_CLASS}]*`,
  "gu",
);

/**
 * \u0E04\u0E33\u0E15\u0E48\u0E32\u0E07\u0E14\u0E49\u0E32\u0E27\u0E17\u0E35\u0E48 **\u0E44\u0E21\u0E48\u0E21\u0E35\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E2B\u0E21\u0E32\u0E22\u0E01\u0E33\u0E01\u0E31\u0E1A** \u0E08\u0E36\u0E07\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E1B\u0E47\u0E19\u0E23\u0E32\u0E22\u0E04\u0E33
 * ---------------------------------------------------------------------------
 * \u0E04\u0E31\u0E14\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E04\u0E33\u0E17\u0E35\u0E48 **\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E04\u0E33\u0E2D\u0E31\u0E07\u0E01\u0E24\u0E29** \u0E41\u0E25\u0E30\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E04\u0E33\u0E17\u0E35\u0E48\u0E42\u0E1C\u0E25\u0E48\u0E43\u0E19\u0E04\u0E33\u0E2D\u0E48\u0E32\u0E19\u0E44\u0E1E\u0E48\u0E44\u0E14\u0E49\u0E42\u0E14\u0E22\u0E0A\u0E2D\u0E1A\u0E18\u0E23\u0E23\u0E21
 * (\u0E08\u0E36\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35 `ban` \u0E02\u0E2D\u0E07\u0E40\u0E27\u0E35\u0E22\u0E14\u0E19\u0E32\u0E21 \u0E40\u0E1E\u0E23\u0E32\u0E30\u0E0A\u0E19\u0E01\u0E31\u0E1A\u0E04\u0E33\u0E2D\u0E31\u0E07\u0E01\u0E24\u0E29 \u0E41\u0E25\u0E30\u0E44\u0E21\u0E48\u0E21\u0E35 `Sie` \u0E02\u0E2D\u0E07\u0E40\u0E22\u0E2D\u0E23\u0E21\u0E31\u0E19
 *  \u0E40\u0E1E\u0E23\u0E32\u0E30\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23\u0E2A\u0E32\u0E21\u0E15\u0E31\u0E27\u0E17\u0E35\u0E48\u0E0A\u0E19\u0E01\u0E31\u0E1A\u0E04\u0E33\u0E22\u0E48\u0E2D\u0E44\u0E14\u0E49\u0E07\u0E48\u0E32\u0E22)
 *
 * \u0E40\u0E17\u0E35\u0E22\u0E1A\u0E02\u0E2D\u0E1A\u0E04\u0E33\u0E14\u0E49\u0E27\u0E22 `\b` \u0E41\u0E25\u0E30\u0E44\u0E21\u0E48\u0E2A\u0E19\u0E15\u0E31\u0E27\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E43\u0E2B\u0E0D\u0E48\u0E40\u0E25\u0E47\u0E01
 */
export const LATIN_LEAK_MAP: Record<string, string> = {
  // \u0E2A\u0E23\u0E23\u0E1E\u0E19\u0E32\u0E21\u0E1A\u0E38\u0E23\u0E38\u0E29\u0E17\u0E35\u0E48 2 \u2014 \u0E15\u0E31\u0E27\u0E01\u0E32\u0E23\u0E2B\u0E25\u0E31\u0E01\u0E17\u0E35\u0E48\u0E42\u0E21\u0E40\u0E14\u0E25\u0E40\u0E1C\u0E25\u0E2D\u0E2A\u0E25\u0E31\u0E1A\u0E20\u0E32\u0E29\u0E32
  voce: "\u0E04\u0E38\u0E13",
  usted: "\u0E04\u0E38\u0E13",
  ustedes: "\u0E1E\u0E27\u0E01\u0E04\u0E38\u0E13",
  vous: "\u0E04\u0E38\u0E13",
  votre: "\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13",
  anda: "\u0E04\u0E38\u0E13",
  kamu: "\u0E04\u0E38\u0E13",
  saya: "\u0E09\u0E31\u0E19",
  // \u0E04\u0E33\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21/\u0E04\u0E33\u0E0A\u0E48\u0E27\u0E22\u0E17\u0E35\u0E48\u0E1E\u0E1A\u0E1A\u0E48\u0E2D\u0E22\u0E40\u0E27\u0E25\u0E32\u0E42\u0E21\u0E40\u0E14\u0E25\u0E44\u0E2B\u0E25\u0E44\u0E1B\u0E17\u0E31\u0E49\u0E07\u0E27\u0E25\u0E35
  porque: "\u0E40\u0E1E\u0E23\u0E32\u0E30",
  cuando: "\u0E40\u0E21\u0E37\u0E48\u0E2D",
  pero: "\u0E41\u0E15\u0E48",
  tetapi: "\u0E41\u0E15\u0E48",
  adalah: "\u0E04\u0E37\u0E2D",
  // \u0E04\u0E33\u0E17\u0E31\u0E01\u0E17\u0E32\u0E22/\u0E02\u0E2D\u0E1A\u0E04\u0E38\u0E13 \u0E17\u0E35\u0E48\u0E2B\u0E25\u0E38\u0E14\u0E21\u0E32\u0E17\u0E49\u0E32\u0E22\u0E04\u0E33\u0E2D\u0E48\u0E32\u0E19\u0E44\u0E14\u0E49
  gracias: "\u0E02\u0E2D\u0E1A\u0E04\u0E38\u0E13",
  obrigado: "\u0E02\u0E2D\u0E1A\u0E04\u0E38\u0E13",
  merci: "\u0E02\u0E2D\u0E1A\u0E04\u0E38\u0E13",
  danke: "\u0E02\u0E2D\u0E1A\u0E04\u0E38\u0E13",
};

const LATIN_LEAK_REGEX = new RegExp(`\\b(${Object.keys(LATIN_LEAK_MAP).join("|")})\\b`, "giu");

/**
 * \u0E19\u0E31\u0E1A "\u0E19\u0E49\u0E33\u0E2B\u0E19\u0E31\u0E01\u0E15\u0E48\u0E32\u0E07\u0E14\u0E49\u0E32\u0E27" \u0E02\u0E2D\u0E07\u0E04\u0E33\u0E25\u0E30\u0E15\u0E34\u0E19\u0E17\u0E35\u0E48\u0E2B\u0E25\u0E38\u0E14\u0E21\u0E32 \u2014 \u0E43\u0E0A\u0E49\u0E04\u0E27\u0E32\u0E21\u0E22\u0E32\u0E27\u0E04\u0E33 \u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E08\u0E33\u0E19\u0E27\u0E19\u0E15\u0E31\u0E27\u0E17\u0E35\u0E48\u0E21\u0E35\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E2B\u0E21\u0E32\u0E22
 *
 * \u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25: \u0E15\u0E31\u0E27\u0E15\u0E31\u0E14\u0E27\u0E07\u0E08\u0E23\u0E19\u0E31\u0E1A\u0E40\u0E1B\u0E47\u0E19 **\u0E08\u0E33\u0E19\u0E27\u0E19\u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23** \u0E41\u0E25\u0E30\u0E2A\u0E25\u0E31\u0E1A\u0E42\u0E21\u0E40\u0E14\u0E25\u0E17\u0E35\u0E48 14 \u0E15\u0E31\u0E27
 * \u0E16\u0E49\u0E32\u0E19\u0E31\u0E1A `voc\u00EA` \u0E40\u0E1B\u0E47\u0E19 1 (\u0E40\u0E1E\u0E23\u0E32\u0E30\u0E21\u0E35 `\u00EA` \u0E15\u0E31\u0E27\u0E40\u0E14\u0E35\u0E22\u0E27) \u0E15\u0E48\u0E2D\u0E43\u0E2B\u0E49\u0E42\u0E21\u0E40\u0E14\u0E25\u0E2B\u0E25\u0E38\u0E14\u0E40\u0E1B\u0E47\u0E19\u0E42\u0E1B\u0E23\u0E15\u0E38\u0E40\u0E01\u0E2A\u0E17\u0E31\u0E49\u0E07\u0E22\u0E48\u0E2D\u0E2B\u0E19\u0E49\u0E32
 * \u0E01\u0E47\u0E44\u0E21\u0E48\u0E21\u0E35\u0E27\u0E31\u0E19\u0E16\u0E36\u0E07\u0E40\u0E01\u0E13\u0E11\u0E4C \u00B7 \u0E19\u0E31\u0E1A\u0E17\u0E31\u0E49\u0E07\u0E04\u0E33\u0E41\u0E25\u0E49\u0E27\u0E1B\u0E23\u0E30\u0E42\u0E22\u0E04\u0E40\u0E15\u0E47\u0E21\u0E16\u0E36\u0E07\u0E40\u0E01\u0E13\u0E11\u0E4C\u0E15\u0E32\u0E21\u0E17\u0E35\u0E48\u0E04\u0E27\u0E23
 * \u0E2A\u0E48\u0E27\u0E19\u0E04\u0E33\u0E40\u0E14\u0E35\u0E48\u0E22\u0E27 \u0E46 (4 \u0E15\u0E31\u0E27) \u0E22\u0E31\u0E07\u0E15\u0E48\u0E33\u0E01\u0E27\u0E48\u0E32\u0E40\u0E01\u0E13\u0E11\u0E4C \u0E08\u0E36\u0E07\u0E16\u0E39\u0E01 **\u0E41\u0E01\u0E49\u0E40\u0E07\u0E35\u0E22\u0E1A \u0E46** \u0E41\u0E17\u0E19\u0E01\u0E32\u0E23 failover
 * \u0E15\u0E23\u0E07\u0E15\u0E32\u0E21\u0E2B\u0E25\u0E31\u0E01\u0E02\u0E2D\u0E07\u0E44\u0E1F\u0E25\u0E4C\u0E19\u0E35\u0E49: failover \u0E41\u0E25\u0E01\u0E14\u0E49\u0E27\u0E22\u0E40\u0E27\u0E25\u0E32\u0E17\u0E35\u0E48\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E19\u0E31\u0E48\u0E07\u0E23\u0E2D \u0E2A\u0E48\u0E27\u0E19\u0E04\u0E33\u0E40\u0E14\u0E35\u0E22\u0E27\u0E41\u0E01\u0E49\u0E43\u0E2B\u0E49\u0E16\u0E39\u0E01\u0E44\u0E14\u0E49\u0E40\u0E25\u0E22
 */
function countLatinLeakWeight(text: string): number {
  let weight = 0;
  for (const m of text.matchAll(ACCENTED_LATIN_WORD_REGEX)) weight += m[0].length;
  for (const m of text.matchAll(LATIN_LEAK_REGEX)) weight += m[0].length;
  return weight;
}

/**
 * ตรวจว่าข้อความมีอักษรต่างด้าวปนอยู่หรือไม่
 */
export function hasForeignScript(text: string | null | undefined): boolean {
  if (!text) return false;
  FOREIGN_SCRIPT_REGEX.lastIndex = 0;
  if (FOREIGN_SCRIPT_REGEX.test(text)) return true;
  return countLatinLeakWeight(text) > 0;
}

/**
 * นับจำนวนอักษรต่างด้าวที่พบในข้อความ
 */
export function countForeignCharacters(text: string | null | undefined): number {
  if (!text) return 0;
  const matches = text.match(FOREIGN_SCRIPT_REGEX);
  return (matches ? matches.length : 0) + countLatinLeakWeight(text);
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
  // คำต่างด้าวอักษรละตินที่รู้จัก → แทนด้วยคำไทย (แนวเดียวกับ CHINESE_LEAK_MAP ข้างบน)
  processed = processed.replace(LATIN_LEAK_REGEX, (m) => LATIN_LEAK_MAP[m.toLowerCase()] ?? m);
  // คำที่มีเครื่องหมายกำกับ: ถ้าถอดเครื่องหมายแล้วตรงกับคลังคำ ➔ แปลเป็นไทย
  // (`você` ➔ `คุณ` อ่านลื่นกว่าการลบทิ้งจนประโยคขาดคำ)
  // ถ้าไม่รู้จัก ➔ ตัดทั้งคำ ไม่ใช่ตัดแค่ตัวอักษรจนเหลือคำพิการอย่าง `voc` หรือ `no`
  processed = processed.replace(ACCENTED_LATIN_WORD_REGEX, (word) => {
    const bare = word.normalize("NFD").replace(/\p{M}+/gu, "").toLowerCase();
    return LATIN_LEAK_MAP[bare] ?? "";
  });
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
 * ทำความสะอาดสมบูรณ์แบบในฟังก์ชันเดียว: ตัดแท็กคิด + ลบอักษรต่างด้าว + ขัดภาษาไทยให้ถูกต้อง
 * ---------------------------------------------------------------------------
 * `polishThai()` ต่อท้ายตรงนี้ทำให้ **ทุกเส้นทางได้ประโยชน์ทันที** โดยไม่ต้องไล่แก้ทีละจุด
 * (คำอ่านไพ่ · แชทถามตอบ · สตรีมสด) — "นะค่ะ" ที่โมเดลเขียน ผู้ใช้จะเห็นเป็น "นะคะ"
 *
 * ทำไมเลือกแก้เงียบ ๆ แทน failover: failover แลกด้วยเวลาที่ผู้ใช้นั่งรออยู่จริง
 * ส่วนความผิดกลุ่มนี้แก้ได้ถูกต้อง 100% ด้วย regex (ภาคผนวก A.4 ของแผน)
 *
 * ⚠️ ฟังก์ชันนี้วิ่งบนสตรีมสดทุกก้อนข้อความ — `polishThai()` จึงต้องเป็น regex ล้วน
 *    และมีเทสต์วัดเวลาจริงล็อกไว้ที่ ≤ 1ms ต่อ 2,000 ตัวอักษร
 */
export function sanitizeTarotText(text: string | null | undefined): string {
  return polishThai(stripForeignScript(stripThinkingTags(text)));
}
