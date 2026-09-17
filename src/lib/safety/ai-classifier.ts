/**
 * 🛟 ชั้นที่ 3 ของด่านความปลอดภัย — ตัวจำแนกสัญญาณวิกฤตด้วย Workers AI
 * ---------------------------------------------------------------------------
 * กฎเหล็กข้อ 6: บล็อกสัญญาณทำร้ายตัวเองทันที แสดงสายด่วน 1323
 *
 * `checkQuestion()` (regex) จับ "รูปประโยคตรง ๆ" ได้ แต่พลาดประโยคอ้อม เช่น
 * "ตื่นมาทุกเช้าแล้วรู้สึกว่าไม่มีอะไรให้ทำต่อ" / "เหมือนหายไปเลยคงไม่มีใครสังเกต"
 *
 * ไฟล์นี้เป็น "ตาข่ายชั้นสาม" — ทำงานเมื่อ regex ชั้นแรกไม่บล็อก (flag != crisis)
 *
 * 🔴 บทเรียน T-01 — ประตูของชั้นนี้เคยเป็นเรกเอ็กซ์อ่อน ๆ ชุดเดียว
 * ผลคือสำนวนที่หลุดทั้งสองลิสต์ **ไม่มีทางเดินทางมาถึงตัวจำแนก AI ได้เลย**
 * "สามชั้น" จึงยุบเหลือ "เรกเอ็กซ์ชุด A หรือเรกเอ็กซ์ชุด B" ซึ่งไม่ใช่สามชั้น
 * ตอนนี้ประตูถูกถอดออกแล้ว: ข้อความที่ยาวพอ (`LENGTH_GATE_CHARS`) ถูกส่งให้ AI ดูทุกกรณี
 * ส่วนลิสต์ `SOFT_DISTRESS_PATTERNS` เปลี่ยนบทบาทจาก "ประตู" เป็น "ตัวชี้ระดับความเสี่ยง"
 * ที่ใช้ตัดสินว่าเมื่อตัวจำแนกพังแล้วจะ fail-open หรือ fail-safe
 *
 * ⚠️ นโยบายเมื่อตัวจำแนกใช้ไม่ได้ (ไม่มี binding / โมเดลล่ม / timeout):
 *    - ข้อความที่ **เข้าลิสต์ความทุกข์อ่อน** → fail-safe (บล็อก + แสดงสายด่วน)
 *      เพราะนี่คือกลุ่มที่เรามีเหตุให้กังวลอยู่แล้ว การปล่อยผ่านคือความเสี่ยงต่อชีวิต
 *    - ข้อความทั่วไปที่ผ่านประตูความยาวเฉย ๆ → fail-open (ไม่บล็อก)
 *      การบล็อกคำถามปกติทั้งเว็บเพราะ Workers AI ขัดข้องแย่กว่า
 *    - **ทุกเส้นทางที่ fail-open ต้องยิง metric** ดูได้ที่ `/admin` ไม่ใช่แค่ `console.warn`
 */

import { getAiBinding } from "@/lib/platform/cf";
import { recordEvent } from "@/lib/stats/record";

/**
 * คำบ่งชี้ความทุกข์ระดับอ่อน — ไม่ใช่วิกฤตชัดเจน แต่ "มีเหตุให้กังวล"
 * ใช้ตัดสินว่าเมื่อตัวจำแนกพังจะ fail-safe (บล็อก) หรือ fail-open (ปล่อย)
 * ตั้งใจให้กว้างไว้ก่อน
 */
const SOFT_DISTRESS_PATTERNS: RegExp[] = [
  /ไม่ไหว(แล้ว|อีกแล้ว)?|หมดแรง|หมดหวัง|สิ้นหวัง|ท้อแท้|ท้อมาก/,
  /เหนื่อยกับชีวิต|เบื่อชีวิต|เบื่อทุกอย่าง|ชีวิตไม่มีความหมาย|ไม่มีอะไรให้ทำต่อ/,
  /ร้องไห้ทุก(วัน|คืน)|เศร้ามาก|จมอยู่กับความเศร้า|ใจมันพัง|หัวใจสลาย/,
  /ไม่มีใคร(รัก|ต้องการ|สนใจ|เข้าใจ)|อยู่คนเดียว.*ตลอด|โดดเดี่ยว/,
  /อยากหนีไป(ให้ไกล|จากทุกอย่าง)|อยากหายไป|ไม่อยากเจอใคร|แบกไม่ไหว/,
  /มืดไปหมด|มองไม่เห็นทางออก|ไม่รู้จะไปทางไหนต่อ|ตันไปหมด/,
  /เจ็บจนชา|ชาไปหมด|ไม่รู้สึกอะไรอีกแล้ว|ว่างเปล่าข้างใน/,
  /ไม่มีแรงจะลุก|ไม่อยากทำอะไรเลย|นอนทั้งวัน.*ไม่อยาก/,
  /เป็นตัวถ่วง|ไม่มีใครต้องการฉัน|โทษตัวเองตลอด|เกลียดตัวเอง/,
  /\b(hopeless|worthless|empty inside|can'?t go on|give up on life|no reason to)\b/i,
  /\b(numb inside|nothing matters|nobody would miss me|tired of everything|can'?t take it any\s?more)\b/i,
];

/**
 * ความยาวขั้นต่ำที่ส่งให้ตัวจำแนกดู
 * ข้อความสั้นกว่านี้แทบไม่มีบริบทพอให้ตัดสิน และเป็นกลุ่มที่ regex ชั้นแรกจับได้อยู่แล้ว
 * Workers AI อยู่ในโควตาฟรี — ราคาของการเรียกเพิ่มคือ latency ไม่ใช่เงิน
 */
const LENGTH_GATE_CHARS = 24;

/** true = ข้อความเข้าลิสต์ความทุกข์อ่อน (ใช้ตัดสินนโยบายตอนตัวจำแนกพัง) */
export function hasSoftDistressSignal(text: string): boolean {
  const t = text.normalize("NFC");
  return SOFT_DISTRESS_PATTERNS.some((p) => p.test(t));
}

/**
 * true = ควรส่งให้ AI ดู
 *
 * เดิมฟังก์ชันนี้คือ "ประตู" ที่ทำให้ชั้น 3 แทบไม่เคยทำงาน — ตอนนี้กว้างขึ้นมาก:
 * เข้าลิสต์ความทุกข์อ่อน **หรือ** ยาวพอที่จะมีบริบท
 */
export function mayNeedDeepCrisisCheck(text: string): boolean {
  const t = text.normalize("NFC").trim();
  if (t.length >= LENGTH_GATE_CHARS) return true;
  return hasSoftDistressSignal(t);
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
 * ประเมินความเสี่ยงวิกฤตด้วย Workers AI
 * คืน true เมื่อ AI ยืนยันว่าเป็นสัญญาณวิกฤต — หรือเมื่อตัวจำแนกใช้ไม่ได้
 * และข้อความนั้นเข้าลิสต์ความทุกข์อ่อน (fail-safe)
 */
export async function assessCrisisRisk(text: string): Promise<boolean> {
  const trimmed = (text || "").trim();
  if (trimmed.length < 8) return false;
  if (!mayNeedDeepCrisisCheck(trimmed)) return false;

  // ข้อความกลุ่มนี้มีเหตุให้กังวลอยู่แล้ว — ถ้าตัวจำแนกใช้ไม่ได้ให้ถอยไปทางที่ปลอดภัย
  const soft = hasSoftDistressSignal(trimmed);

  const AI = await getAiBinding();
  if (!AI) {
    // ไม่มี Workers AI binding (dev / ยังไม่ deploy)
    recordEvent(soft ? "safety_ai_failsafe:no_binding" : "safety_ai_failopen:no_binding");
    return soft;
  }

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
    console.warn(`[safety-ai] classify ล้มเหลว — ${soft ? "fail-safe (บล็อก)" : "fail-open"}:`, err);
    recordEvent(soft ? "safety_ai_failsafe:error" : "safety_ai_failopen:error");
    return soft;
  }
}
