/**
 * 🛟 ชั้นที่ 3 ของด่านความปลอดภัย — ตัวจำแนกสัญญาณวิกฤตด้วย Workers AI
 * ---------------------------------------------------------------------------
 * กฎเหล็กข้อ 6: บล็อกสัญญาณทำร้ายตัวเองทันที แสดงสายด่วน 1323
 *
 * `checkQuestion()` (regex) จับ "รูปประโยคตรง ๆ" ได้ แต่พลาดประโยคอ้อม เช่น
 * "ตื่นมาทุกเช้าแล้วรู้สึกว่าไม่มีอะไรให้ทำต่อ" / "เหมือนหายไปเลยคงไม่มีใครสังเกต"
 *
 * ไฟล์นี้เป็น "ตาข่ายชั้นสาม" — ทำงานเฉพาะเมื่อ:
 *   1. regex ชั้นแรกไม่บล็อก (flag != crisis) และ
 *   2. ข้อความมีคำบ่งชี้ความทุกข์ระดับอ่อน (SOFT_DISTRESS) ที่ regex ไม่กล้าตัดสิน
 * แล้วจึงถาม Workers AI ให้ยืนยัน — จำกัดจำนวนเรียกไว้เฉพาะเคสคลุมเครือ (ประหยัด neuron)
 *
 * ⚠️ fail-open: ไม่มี binding / โมเดลล่ม / timeout → คืน false (ไม่บล็อก)
 *    เพราะชั้น regex + system prompt ยังทำงาน — AI เป็นส่วนเสริม ไม่ใช่ด่านเดียว
 *    การบล็อกคำถามทั้งหมดเพราะ Workers AI ขัดข้อง แย่กว่าปล่อยเคสอ้อมหลุดชั่วคราว
 */

import { getAiBinding } from "@/lib/platform/cf";

/**
 * คำบ่งชี้ความทุกข์ระดับอ่อน — ไม่ใช่วิกฤตชัดเจน แต่ "ควรให้ AI ดูอีกที"
 * ตั้งใจให้กว้างไว้ก่อน (false positive แค่เสีย 1 เรียก Workers AI ที่ฟรี)
 */
const SOFT_DISTRESS_PATTERNS: RegExp[] = [
  /ไม่ไหว(แล้ว|อีกแล้ว)?|หมดแรง|หมดหวัง|สิ้นหวัง|ท้อแท้|ท้อมาก/,
  /เหนื่อยกับชีวิต|เบื่อชีวิต|เบื่อทุกอย่าง|ชีวิตไม่มีความหมาย|ไม่มีอะไรให้ทำต่อ/,
  /ร้องไห้ทุก(วัน|คืน)|เศร้ามาก|จมอยู่กับความเศร้า|ใจมันพัง|หัวใจสลาย/,
  /ไม่มีใคร(รัก|ต้องการ|สนใจ|เข้าใจ)|อยู่คนเดียว.*ตลอด|โดดเดี่ยว/,
  /อยากหนีไป(ให้ไกล|จากทุกอย่าง)|อยากหายไป|ไม่อยากเจอใคร|แบกไม่ไหว/,
  /มืดไปหมด|มองไม่เห็นทางออก|ไม่รู้จะไปทางไหนต่อ|ตันไปหมด/,
  /\b(hopeless|worthless|empty inside|can'?t go on|give up on life|no reason to)\b/i,
];

/** true = ข้อความคลุมเครือพอที่ควรส่งให้ AI ยืนยัน */
export function mayNeedDeepCrisisCheck(text: string): boolean {
  const t = text.normalize("NFC");
  return SOFT_DISTRESS_PATTERNS.some((p) => p.test(t));
}

/** โมเดล Workers AI สำหรับจำแนก — instruct ทั่วไป รองรับไทยพอใช้ ตอบสั้น */
const CLASSIFIER_MODEL = "@cf/meta/llama-3.1-8b-instruct";
const CLASSIFY_TIMEOUT_MS = 3500;

const SYSTEM_PROMPT =
  'คุณคือตัวจำแนกความเสี่ยงด้านความปลอดภัย ตอบเป็นคำเดียวเท่านั้น: "YES" หรือ "NO" ห้ามอธิบาย';

function buildUserPrompt(text: string): string {
  return [
    "ข้อความต่อไปนี้ (จากผู้ใช้เว็บดูดวง) แสดงสัญญาณว่าผู้เขียน",
    "อยากทำร้ายตัวเอง อยากตาย รู้สึกว่าไม่อยากมีชีวิตอยู่ต่อ",
    "หรือกำลังคิดฆ่าตัวตาย ใช่หรือไม่?",
    "",
    `"""${text.slice(0, 1200)}"""`,
    "",
    'ตอบ "YES" ถ้ามีสัญญาณเช่นนั้นแม้เพียงเล็กน้อยหรือเป็นนัย',
    'ตอบ "NO" ถ้าเป็นเพียงความเครียด ความเศร้า หรือความไม่สบายใจทั่วไปที่ไม่ถึงขั้นนั้น',
  ].join("\n");
}

/**
 * ประเมินความเสี่ยงวิกฤตด้วย Workers AI — เรียกเฉพาะเคสคลุมเครือ
 * คืน true เฉพาะเมื่อ (มีคำบ่งชี้ความทุกข์อ่อน) และ (AI ยืนยันว่าเป็นสัญญาณวิกฤต)
 */
export async function assessCrisisRisk(text: string): Promise<boolean> {
  const trimmed = (text || "").trim();
  if (trimmed.length < 8) return false;
  if (!mayNeedDeepCrisisCheck(trimmed)) return false;

  const AI = await getAiBinding();
  if (!AI) return false; // ไม่มี Workers AI binding (dev / ยังไม่ deploy) → ข้าม

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CLASSIFY_TIMEOUT_MS);

    const result = await Promise.race([
      AI.run(CLASSIFIER_MODEL, {
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(trimmed) },
        ],
        max_tokens: 4,
        temperature: 0,
      }),
      new Promise((_, reject) =>
        controller.signal.addEventListener("abort", () => reject(new Error("timeout"))),
      ),
    ]);
    clearTimeout(timeoutId);

    const answer = String((result as { response?: string })?.response || "").toUpperCase();
    const isCrisis = /\bYES\b|ใช่/.test(answer);
    if (isCrisis) {
      console.warn("[safety-ai] จับสัญญาณวิกฤตแบบอ้อมที่ regex ไม่จับ");
    }
    return isCrisis;
  } catch (err) {
    console.warn("[safety-ai] classify ล้มเหลว — fail-open:", err);
    return false;
  }
}
