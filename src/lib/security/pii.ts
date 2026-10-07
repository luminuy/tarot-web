/**
 * 🛡️ ซ่อนข้อมูลส่วนบุคคลก่อนส่งออกนอกระบบ (REFLECTION_JOURNAL_PLAN 1.14 · แทร็ก S)
 * ---------------------------------------------------------------------------
 * คนมักพิมพ์เบอร์/อีเมล/เลขบัตรลงในคำถามโดยไม่ตั้งใจ ("เขาเบอร์ 081-234-5678 จะโทรมาไหม")
 * ข้อมูลพวกนี้ไม่ช่วยคำอ่านเลย แต่ถูกส่งไปผู้ให้บริการโมเดลภายนอก ➔ ซ่อนก่อนเข้า prompt ทุกครั้ง
 *
 *  • เลขบัตรประชาชน 13 หลัก — ตรวจ "หลักตรวจสอบ" (หลักที่ 13) จริง ไม่ใช่แค่นับหลัก
 *    (ตัวเลข 13 หลักอื่น ๆ เช่น เลขพัสดุ จึงไม่โดนซ่อนผิด)
 *  • เบอร์มือถือไทย (06/08/09 · +66) และเบอร์บ้านกรุงเทพฯ 02
 *  • อีเมล
 *  • เลขบัตรเครดิต/เดบิต 13–19 หลัก — ต้องผ่าน Luhn · เลขบัญชีธนาคารรูปแบบ xxx-x-xxxxx-x
 *
 * ไม่แตะ: วันเกิด (12/05/1990) · ปี · ราคา · เลขทั่วไปสั้น ๆ — แม่หมอยังใช้บริบทเหล่านี้ได้
 * ตัวแทนใช้สัญลักษณ์ล้วน `[•••]` — ไม่มีภาษา จึงไม่ทำให้คำอ่านไทยมีอังกฤษปน (หรือกลับกัน)
 * ⚠️ ไม่เก็บค่าที่ซ่อนไว้ที่ไหนเลย — คืนแค่ "ชนิด" ที่พบ ไว้บอกผู้ใช้เบา ๆ
 */

export type PiiKind = "nationalId" | "phone" | "email" | "card" | "bankAccount";

export const PII_PLACEHOLDER = "[•••]";

export interface RedactionResult {
  text: string;
  kinds: PiiKind[];
}

const digitsOf = (s: string) => s.replace(/\D/g, "");

/** หลักตรวจสอบของเลขประจำตัวประชาชนไทย: Σ d[i]×(13−i) (i=0..11) ➔ (11 − Σ mod 11) mod 10 */
export function isValidThaiNationalId(raw: string): boolean {
  const d = digitsOf(raw);
  if (d.length !== 13 || d[0] === "0") return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(d[i]) * (13 - i);
  return (11 - (sum % 11)) % 10 === Number(d[12]);
}

export function luhnValid(raw: string): boolean {
  const d = digitsOf(raw);
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

// ขอบเขตตัวเลข: ห้ามมีตัวเลขติดหน้า/หลัง (กันตัดกลางเลขยาวที่ไม่ใช่ PII)
const NB = "(?<![\\d])";
const NA = "(?![\\d])";

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
/** 13 หลัก จะมีขีด/เว้นวรรคตามรูปแบบบนบัตร (1-2345-67890-12-3) หรือติดกันก็ได้ */
const NATIONAL_ID = new RegExp(`${NB}\\d[-\\s]?\\d{4}[-\\s]?\\d{5}[-\\s]?\\d{2}[-\\s]?\\d${NA}`, "g");
/** 13–19 หลัก คั่นด้วยเว้นวรรค/ขีดเป็นกลุ่มได้ */
const CARD = new RegExp(`${NB}\\d(?:[-\\s]?\\d){12,18}${NA}`, "g");
const BANK_ACCOUNT = new RegExp(`${NB}\\d{3}-\\d-\\d{5}-\\d${NA}`, "g");
/** มือถือ 0[689]x-xxx-xxxx · +66 [689]x-xxx-xxxx · เบอร์บ้าน 02-xxx-xxxx */
const PHONE = new RegExp(
  `(?:\\+66[-\\s]?|${NB}0)(?:[689]\\d[-\\s]?\\d{3}[-\\s]?\\d{4}|2[-\\s]?\\d{3}[-\\s]?\\d{4})${NA}`,
  "g",
);

export function redactPii(raw: string): RedactionResult {
  if (!raw) return { text: raw, kinds: [] };
  const kinds = new Set<PiiKind>();
  let text = raw;

  text = text.replace(EMAIL, () => (kinds.add("email"), PII_PLACEHOLDER));
  // ลำดับสำคัญ: บัตรประชาชน (ตรวจหลักตรวจสอบ) ➔ บัตรเครดิต (Luhn) ➔ บัญชี ➔ เบอร์โทร
  text = text.replace(NATIONAL_ID, (m) => (isValidThaiNationalId(m) ? (kinds.add("nationalId"), PII_PLACEHOLDER) : m));
  text = text.replace(CARD, (m) => (luhnValid(m) ? (kinds.add("card"), PII_PLACEHOLDER) : m));
  text = text.replace(BANK_ACCOUNT, () => (kinds.add("bankAccount"), PII_PLACEHOLDER));
  text = text.replace(PHONE, () => (kinds.add("phone"), PII_PLACEHOLDER));

  return { text, kinds: [...kinds] };
}

/** รวมชนิดที่พบจากหลายช่อง (คำถาม · บริบท · ชื่อเล่น) — ใช้บอกผู้ใช้ครั้งเดียว */
export function detectPiiKinds(...texts: Array<string | undefined | null>): PiiKind[] {
  const all = new Set<PiiKind>();
  for (const t of texts) if (t) for (const k of redactPii(t).kinds) all.add(k);
  return [...all];
}

const LABEL: Record<PiiKind, { th: string; en: string }> = {
  nationalId: { th: "เลขบัตรประชาชน", en: "ID number" },
  phone: { th: "เบอร์โทร", en: "phone number" },
  email: { th: "อีเมล", en: "email" },
  card: { th: "เลขบัตร", en: "card number" },
  bankAccount: { th: "เลขบัญชี", en: "account number" },
};

/** ประโยคบอกผู้ใช้เบา ๆ — ไม่ขอให้เลือก ไม่ขู่ */
export function piiNotice(kinds: PiiKind[], lang: "th" | "en"): string | null {
  if (kinds.length === 0) return null;
  const names = kinds.map((k) => LABEL[k][lang]);
  return lang === "en"
    ? `We hid your ${names.join(" and ")} before sending your question to the AI reader — your reading isn't affected.`
    : `เราซ่อน${names.join("และ")}ไว้ก่อนส่งคำถามให้แม่หมอ AI แล้ว คำอ่านไม่เสียอะไร`;
}
