/**
 * 📚 คลังคำสัญญาณวิกฤต — แหล่งความจริงเดียวของกฎเหล็กข้อ 6
 * ---------------------------------------------------------------------------
 * บทเรียน (T-01): ชุดเดิม 11 เรกเอ็กซ์จับสำนวนที่คนไทยใช้จริงได้เพียง 5 จาก 18 แบบ
 * คำที่คนไทยใช้บ่อยที่สุดอย่าง **คิดสั้น** และสำนวนอังกฤษที่ใช้บ่อยที่สุดอย่าง
 * **I want to die** ไม่มีอยู่ในลิสต์เลยแม้แต่คำเดียว
 *
 * โครงของไฟล์นี้
 *   1. `CRISIS_LEXEMES_TH` — คำไทยแบบ "สตริงล้วน" เทียบแบบ substring
 *      บนรูปที่ตัดช่องว่าง/ถอดวรรณยุกต์/ยุบอักษรซ้ำแล้ว **ทั้งสองฝั่ง**
 *      (ใช้สตริงล้วนเพื่อให้ตัวแปลงชุดเดียวกันทำงานกับคำในคลังได้ด้วย)
 *   2. `CRISIS_RULES_TH` — กฎไทยที่ต้องการระยะห่างหรือทางเลือก จึงต้องเป็นเรกเอ็กซ์
 *   3. `CRISIS_RULES_LATIN` — อังกฤษและคาราโอเกะ ทำงานบนรูป "มีช่องว่าง"
 *      เพื่อให้ `\b` ยังใช้ได้ (ถ้าตัดช่องว่างทิ้ง `spend it all` จะกลายเป็น `end it all`)
 *
 * ⚠️ ห้ามคัดลอกคำจากไฟล์นี้ไปเป็นเคสทดสอบ — ด่านที่เอาเรกเอ็กซ์ไปทดสอบกับตัวมันเอง
 *    พิสูจน์อะไรไม่ได้ (นั่นคือเหตุผลที่ T-01 อยู่รอดมาถึงวันนี้ · ดู T-35)
 *    คลังทดสอบอยู่ที่ `scripts/qa/fixtures/crisis-corpus.*.txt`
 */

import { looseForm, stripToneMarksFromSource, tightForm } from "./normalize";

/** คำไทยที่สื่อเจตนาชัดเจน — เทียบแบบ substring บนรูปมาตรฐาน */
export const CRISIS_LEXEMES_TH: string[] = [
  // ── ลงมือกับตัวเอง ──
  "ฆ่าตัวตาย",
  "ฆ่าตัวเอง",
  "ฆ่าตนเอง",
  "วิธีฆ่าตัวตาย",
  "คิดสั้น",
  "ปลิดชีพ",
  "ปลิดชีวิต",
  "จบชีวิต",
  "ผูกคอ",
  "แขวนคอ",
  "โดดตึก",
  "โดดสะพาน",
  "โดดน้ำตาย",
  "ยิงตัวตาย",
  "เผาตัวเอง",
  "รมควัน",
  "กรีดแขน",
  "กรีดข้อมือ",
  "กรีดตัวเอง",
  "เชือดข้อมือ",
  "เชือดตัวเอง",
  "ทำร้ายตัวเอง",
  "ทำร้ายตนเอง",
  "ทำร้ายร่างกายตัวเอง",
  "ทำร้ายร่างกายตนเอง",
  "กินยาฆ่าตัวตาย",
  "กินยาเกินขนาด",
  "กินยาทั้งขวด",
  "กินยาตาย",
  "กินยานอนหลับทั้ง",

  // ── ไม่อยากมีชีวิตอยู่ ──
  "อยากตาย",
  "อยากจะตาย",
  "ไม่อยากมีชีวิต",
  "ไม่อยากอยู่ต่อ",
  "ไม่อยากอยู่แล้ว",
  "ไม่อยากตื่นขึ้นมา",
  "ไม่อยากตื่นมาอีก",
  "ไม่อยากหายใจ",
  "ไม่อยากเกิดมา",
  "เกิดมาทำไม",
  "นอนแล้วไม่ตื่น",
  "นอนแล้วไม่อยากตื่น",

  // ── ตายดีกว่า / หายไปดีกว่า ──
  "ตายดีกว่า",
  "ตายไปดีกว่า",
  "ตายซะดีกว่า",
  "ตายไปซะดีกว่า",
  "ตายไปเลยดีกว่า",
  "หายไปเลยดีกว่า",
  "หายไปซะดีกว่า",
  "อยากหายไป",
  "หายไปจากโลกนี้",
  "โลกนี้ไม่มีที่ให้ฉัน",
  "ไม่มีใครสนใจถ้าฉันหายไป",
  "อยู่ไปก็เป็นภาระ",
  "เป็นภาระของทุกคน",
  "ไม่มีค่าพอจะมีชีวิตอยู่",
];

/**
 * กฎไทยที่ต้องใช้เรกเอ็กซ์ — ทำงานบนรูปที่ตัดช่องว่างแล้ว จึงเขียนติดกันได้เลย
 * (ห้ามใส่ `\s` ในกฎเหล่านี้ เพราะช่องว่างถูกตัดทิ้งไปก่อนแล้ว)
 */
export const CRISIS_RULES_TH: RegExp[] = [
  /(เบื่อ|เหนื่อยกับ|ทน)ชีวิต.{0,24}อยากจบ/,
  /อยากจบ.{0,12}(ชีวิต|ทุกอย่าง|มันซะที|มันที|ตัวเอง)/,
  /จบ ?ๆ ?ไปเลย|จบๆไปเลย/,
  /ไม่อยากอยู่.{0,12}โลก(นี้|ใบนี้)/,
  /(วางแผน|หาวิธี|อยากรู้วิธี).{0,8}(ฆ่าตัวตาย|จบชีวิต|ตายแบบไม่เจ็บ)/,
  /ตายแบบไม่เจ็บ|ตายยังไงไม่เจ็บ/,
];

/**
 * กฎอักษรละติน — อังกฤษ + คาราโอเกะ (ทับศัพท์ไทยด้วยอักษรอังกฤษ พบบ่อยมากบนโซเชียล)
 * ทำงานบนรูป "มีช่องว่าง" เพื่อให้ `\b` ยังคุ้มครองคำพ้องอยู่
 */
export const CRISIS_RULES_LATIN: RegExp[] = [
  // ── อังกฤษ ──
  /\bsuicid(e|es|al|ality)\b/i,
  /\bkill(ing|ed)?\s*my\s*self\b/i,
  /\bi\s+(want|wanna|wish|need)\s+(to\s+)?die\b/i,
  /\bwant(ing)?\s+to\s+die\b/i,
  /\bwanna\s+die\b/i,
  /\bwant\s+to\s+be\s+dead\b/i,
  /\bwish\s+i\s+(was|were)\s+(dead|never\s+born)\b/i,
  /\bbetter\s+off\s+(dead|without\s+me)\b/i,
  /\bend\s+(my\s+(own\s+)?life|it\s+all|things\s+for\s+good)\b/i,
  /\btake\s+my\s+own\s+life\b/i,
  /\boff\s*my\s*self\b/i,
  /\bun\s*-?\s*alive(\s*my\s*self)?\b/i,
  /\bself\s*-?\s*harm(ing|ed)?\b/i,
  /\bcut(ting)?\s*my\s*self\b/i,
  /\bslit(ting)?\s+my\s+wrists?\b/i,
  /\bhang(ing)?\s*my\s*self\b/i,
  /\bjump(ing)?\s+off\s+(a\s+|the\s+)?(bridge|building|roof|balcony)\b/i,
  /\bno\s+reason\s+to\s+(live|go\s+on|be\s+here)\b/i,
  /\b(don'?t|do\s+not|dont)\s+want\s+to\s+(live|be\s+alive|exist|be\s+here|wake\s+up)\b/i,
  /\bover\s*-?\s*dos(e|ing)\b/i,
  /\bod\s+on\s+(pills|meds|my\s+meds)\b/i,
  // `kms` คือแสลงของ "kill myself" — เว้นให้ "5 kms" ผ่านไปได้
  /(?<!\d\s?)\bkms\b/i,

  // ── คาราโอเกะ (ทับศัพท์ไทย) ──
  /\bkh?a\s*tua\s*t[ah]?i\b/i,
  /\byak\s*t[ah]?i\b/i,
  /\bmai\s*yak\s*(yu|mi\s*chi?wit)\b/i,
  /\bp[hu]?uk\s*k[oa]r?\s*t[ah]?i\b/i,
  /\bkh?it\s*s[aiu]n\b/i,
  /\bt[ah]?i\s*de+\s*kwa\b/i,
  /\bplit\s*chip\b/i,
  /\btam\s*rai\s*tua\s*eng\b/i,
];

/** รูปมาตรฐานของคำในคลัง — คำนวณครั้งเดียวตอนโหลดโมดูล */
const LEXEME_FORMS = CRISIS_LEXEMES_TH.map((lex) => ({
  tight: tightForm(lex),
  loose: looseForm(lex),
}));

/** กฎไทยฉบับถอดวรรณยุกต์ — ให้คนที่พิมพ์ตกวรรณยุกต์ (`ฆาตัวตาย`) ยังโดนจับ */
const CRISIS_RULES_TH_TONELESS = CRISIS_RULES_TH.map(
  (re) => new RegExp(stripToneMarksFromSource(re.source), re.flags),
);

export interface CrisisMatch {
  /** คำหรือกฎที่ทำให้ติด — ใช้ในด่านทดสอบเท่านั้น ห้ามบันทึกลง log ที่มี PII */
  rule: string;
}

/**
 * หาสัญญาณวิกฤตจากทุกรูปมาตรฐานของข้อความ
 * @returns `null` เมื่อไม่พบ
 */
export function findCrisisSignal(forms: {
  tight: string;
  toneStripped: string;
  loose: string;
  spaced: string;
}): CrisisMatch | null {
  for (let i = 0; i < LEXEME_FORMS.length; i++) {
    const f = LEXEME_FORMS[i];
    if (forms.tight.includes(f.tight) || forms.loose.includes(f.loose)) {
      return { rule: CRISIS_LEXEMES_TH[i] };
    }
  }
  for (let i = 0; i < CRISIS_RULES_TH.length; i++) {
    if (CRISIS_RULES_TH[i].test(forms.tight) || CRISIS_RULES_TH_TONELESS[i].test(forms.toneStripped)) {
      return { rule: CRISIS_RULES_TH[i].source };
    }
  }
  for (const rule of CRISIS_RULES_LATIN) {
    if (rule.test(forms.spaced)) return { rule: rule.source };
  }
  return null;
}
