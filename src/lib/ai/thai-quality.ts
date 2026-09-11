/**
 * src/lib/ai/thai-quality.ts
 * ---------------------------------------------------------------------------
 * ✍️ ด่านตรวจ "ภาษาไทยถูกต้อง" ของคำอ่าน (HANDOFF_AI_ACCURACY_THAI A-01)
 *
 * ⚠️ อย่าสับสนกับ `src/lib/ai/language.ts` — คนละเรื่องกันคนละชั้น
 *   - `language.ts`    = ด่าน **"ไม่ใช่ภาษาต่างด้าว"** (กันอักษรจีน/ญี่ปุ่น/เกาหลีหลุด)
 *   - ไฟล์นี้          = ด่าน **"ภาษาไทยถูกต้องและเป็นธรรมชาติ"**
 *     คำอ่านที่เขียน "นะค่ะ" "เเสงสว่าง" "ค่อยๆ" ผ่าน `language.ts` ได้สบาย ๆ
 *     แต่คนไทยอ่านแล้วรู้ทันทีว่า "แม่หมอคนนี้ไม่ใช่คนไทย"
 *
 * 📖 แหล่งความจริงเดียวของกติกา: `docs/plans/HANDOFF_AI_ACCURACY_THAI_2026-09-07.md` ภาคผนวก A
 *    (แก้กฎที่นี่ ➔ ต้องแก้ภาคผนวก A ให้ตรงกันเสมอ)
 *
 * 🧭 ปรัชญาเดียวกับ `consistency.ts`: **ตรวจด้วยโค้ดล้วน ไม่เรียกโมเดล ต้นทุน AI = 0**
 *
 * ✦ กติกาสำคัญที่สุด (ภาคผนวก A.4):
 *   ด่านนี้มีไว้ทำให้คำอ่านดีขึ้น **ไม่ใช่ทำให้ผู้ใช้รอนานขึ้น**
 *   ระหว่าง "แก้อัตโนมัติเงียบ ๆ" กับ "failover ไปโมเดลถัดไป" ➔ **เลือกแก้เงียบ ๆ เสมอ**
 *   failover แลกด้วยเวลาที่ผู้ใช้นั่งรออยู่จริง เก็บไว้ใช้กับสิ่งที่แก้ไม่ได้จริง ๆ เท่านั้น
 */

import { DECK } from "@/data/cards";

export type ThaiIssueCode =
  // ── ระดับ fatal: เขียนผิดชัดเจน (ทุกตัวในกลุ่มนี้ `polishThai()` แก้ให้อัตโนมัติได้) ──
  | "DOUBLE_SARA_E" // "เเสง" (เ+เ) ต้องเป็น "แสง" (แ)
  | "PARTICLE_MISMATCH" // "นะค่ะ" → "นะคะ" · "ขอบคุณคะ" → "ขอบคุณค่ะ"
  | "DUP_DIACRITIC" // วรรณยุกต์/สระบนซ้อนซ้ำ "ก่่อน"
  | "ORPHAN_DIACRITIC" // วรรณยุกต์ลอยไม่มีพยัญชนะนำ
  | "INVISIBLE_CHAR" // zero-width / BOM / soft hyphen
  // ── ระดับ warn: สไตล์บ้านนี้ ────────────────────────────────────
  | "MAIYAMOK_SPACING" // "ค่อยๆ" → "ค่อย ๆ" (ราชบัณฑิตยสภา)
  | "LATIN_LEAK" // คำอังกฤษที่ไม่ใช่ชื่อไพ่ 1909 เช่น "energy"
  | "ROBOT_PHRASE" // "ตามหลักการของไพ่ระบุว่า"
  | "BARNUM_PHRASE" // "ทุกอย่างจะดีขึ้นเอง" ใช้กับใครก็ได้
  | "REPETITIVE_NGRAM" // วลีเดิมซ้ำ ≥ 3 ครั้งในคำอ่านเดียว
  | "WORD_SPLIT_SPACE"; // ช่องว่างแทรกกลางคำไทย

export interface ThaiIssue {
  code: ThaiIssueCode;
  message: string;
  fatal: boolean;
  /** จำนวนจุดที่พบ (ใช้ดูว่าโมเดลตัวไหนพลาดถี่) */
  count: number;
  /** ตัวอย่างข้อความที่พบ (ตัดสั้น) */
  sample?: string;
}

export interface ThaiQualityResult {
  ok: boolean;
  fatal: boolean;
  /** 0-100 (100 = ไม่มี issue) เก็บลง `reading_quality.thai_score` */
  score: number;
  issues: ThaiIssue[];
  /** ข้อความหลังแก้อัตโนมัติ (มีค่าเฉพาะเมื่อมีอะไรถูกแก้จริง) */
  fixed?: string;
}

export interface ThaiQualityOptions {
  /**
   * ผ่อนกฎตามบุคลิกแม่หมอ (ภาคผนวก A.3)
   * `playful` ใช้ภาษาพูด "แกรรร" "โอ๊ยยย" ➔ ผ่อน `DUP_DIACRITIC` ให้
   * แต่ `DOUBLE_SARA_E` และ `PARTICLE_MISMATCH` ยังบังคับเต็มทุกบุคลิก
   */
  personaId?: string | null;
  /** คำละตินที่อนุญาตเพิ่มเติมนอกเหนือจากชื่อไพ่ 78 ใบ (เช่น ชื่อผัง ชื่อแบรนด์) */
  allowLatin?: string[];
  /** เกณฑ์จำนวนวลีกำกวมที่ยอมให้มีได้ (ค่าเริ่มต้น 1 ➔ พบมากกว่านี้จึงเตือน) */
  barnumTolerance?: number;
}

/* ═════════════════════════════════════════════════════════════════════
 * ภาคผนวก A.1 — กลุ่ม fatal (ผิดชัดเจน แก้อัตโนมัติได้ปลอดภัย)
 * ═══════════════════════════════════════════════════════════════════ */

/** เ + เ ที่ควรเป็น แ ตัวเดียว */
const DOUBLE_SARA_E_RE = /เเ/g;

/**
 * รายการปิด (closed list) ของคำลงท้ายที่โมเดลมักสลับ ค่ะ/คะ
 * ⚠️ ห้ามเปลี่ยนไปใช้กฎทั่วไปเดา เช่น "เจอ ? แล้วเปลี่ยน ค่ะ เป็น คะ ทุกกรณี"
 *    ประโยคซ้อนจะพังทันที — รายการปิดครอบคลุมความผิดพลาดจริงของโมเดลกว่า 90%
 *
 * กฎที่ยึด: "ค่ะ" = ลงท้ายประโยคบอกเล่า · "คะ" = ลงท้ายคำถาม หรือมาหลัง "นะ"
 */
const PARTICLE_FIXES: Array<[RegExp, string]> = [
  [/นะค่ะ/g, "นะคะ"],
  [/ไหมค่ะ/g, "ไหมคะ"],
  [/มั้ยค่ะ/g, "มั้ยคะ"],
  [/หรือค่ะ/g, "หรือคะ"],
  [/เหรอค่ะ/g, "เหรอคะ"],
  [/อะไรค่ะ/g, "อะไรคะ"],
  [/ยังไงค่ะ/g, "ยังไงคะ"],
  [/เมื่อไหร่ค่ะ/g, "เมื่อไหร่คะ"],
  [/ขอบคุณคะ/g, "ขอบคุณค่ะ"],
  [/สวัสดีคะ/g, "สวัสดีค่ะ"],
  [/ได้เลยคะ/g, "ได้เลยค่ะ"],
  // "ค่ะ?" ท้ายประโยคคำถามผิดเสมอ (เครื่องหมายคำถามติดกันเป็นรูปแบบปิด ไม่ใช่การเดา)
  [/ค่ะ(\s*\?)/g, "คะ$1"],
];

/** วรรณยุกต์ (่ ้ ๊ ๋) · ไม้ไต่คู้ (็) · การันต์ (์) · สระบน ที่พิมพ์ซ้อนซ้ำ */
const DUP_DIACRITIC_RE = /([\u0E31\u0E34-\u0E3A\u0E47-\u0E4E])\1+/g;

/**
 * วรรณยุกต์ลอย — ต้องตามหลังพยัญชนะ หรือสระบนเท่านั้น
 * (ถ้าลอยอยู่หลังสระหน้า เช่น "เ" หรือหลังช่องว่าง แปลว่าพิมพ์พลาด)
 */
const ORPHAN_DIACRITIC_RE = /(?<![\u0E01-\u0E2E\u0E31\u0E34-\u0E39\u0E47])[\u0E48-\u0E4B]/g;

/** zero-width space / ZWNJ / ZWJ / BOM / soft hyphen */
const INVISIBLE_CHAR_RE = /[\u00AD\u200B-\u200D\uFEFF]/g;

/* ═════════════════════════════════════════════════════════════════════
 * ภาคผนวก A.2 — กลุ่ม warn (สไตล์บ้านนี้)
 * ═══════════════════════════════════════════════════════════════════ */

/** ไม้ยมกที่ไม่มีช่องว่างนำหน้า เช่น "ค่อยๆ" */
const MAIYAMOK_NO_SPACE_BEFORE_RE = /[\u0E01-\u0E4E]ๆ/g;
/** ไม้ยมกที่ไม่มีช่องว่างตามหลัง เช่น "ค่อย ๆก้าว" */
const MAIYAMOK_NO_SPACE_AFTER_RE = /ๆ(?=[\u0E01-\u0E2E\u0E40-\u0E44])/g;

const ROBOT_PHRASES = [
  "ตามหลักการของไพ่",
  "ไพ่ใบนี้เป็นสัญลักษณ์ของ",
  "จากการวิเคราะห์",
  "โดยสรุปแล้ว",
  "ดังที่กล่าวมาข้างต้น",
  "ในส่วนของ",
];

/**
 * วลี Barnum — ประโยคที่เอาไปวางในคำอ่านของใครก็ได้โดยไม่ต้องดูไพ่เลย
 *
 * 📌 ที่มาของรายการรอบสอง (ISSUE-045):
 * LLM Judge รอบ `20260911-1` ให้ `notVague` 4.67/5.00 โดยหัก 3 เคสจาก 9 เคสที่ตัดสิน
 * ตอนนั้นพจนานุกรมมีแค่ 8 วลีและเพดานผ่อนถึง 2 วลี ➔ คำอ่านที่กำกวมจริงลอยผ่านหมด
 *
 * ⚠️ กติกาการเพิ่มวลีใหม่: ต้องเป็นประโยคที่ **จริงกับทุกคนเสมอ** เท่านั้น
 * ห้ามใส่วลีที่อาจเป็นคำแนะนำเฉพาะเจาะจงในบางบริบท (เช่น "ลองคุยกับเขาตรง ๆ")
 * และเลี่ยงวลีที่มีไม้ยมก เพราะข้อความดิบจากโมเดลอาจยังไม่ถูกเว้นวรรค ("ดีๆ" vs "ดี ๆ")
 * แล้วจะจับไม่ติดอย่างเงียบ ๆ
 */
const BARNUM_PHRASES = [
  // ── ชุดเดิม ──
  "ทุกอย่างจะดีขึ้นเอง",
  "ขอให้เชื่อมั่นในตัวเอง",
  "จักรวาลกำลังจัดสรร",
  "ทุกอย่างเกิดขึ้นด้วยเหตุผล",
  "เพียงแค่คุณเปิดใจ",
  "จงเชื่อในสัญชาตญาณ",
  "ไม่มีอะไรเป็นไปไม่ได้",
  "ขอแค่อดทนอีกนิด",
  // ── ชุดเพิ่ม: คำปลอบใจสำเร็จรูป ──
  "ทุกอย่างจะผ่านไปได้ด้วยดี",
  "เดี๋ยวทุกอย่างก็ดีเอง",
  "ฟ้าหลังฝนย่อมสวยงาม",
  "ทุกการรอคอยมีความหมาย",
  "สิ่งดีกำลังจะเข้ามา",
  "ไม่มีอะไรสายเกินไป",
  "ชีวิตมีขึ้นมีลง",
  "ขอแค่มีความหวัง",
  "จักรวาลจะจัดสรรให้เอง",
  // ── ชุดเพิ่ม: การเลี่ยงตอบที่ปลอมตัวมาเป็นคำแนะนำ (โยงกับ onQuestion) ──
  "ขึ้นอยู่กับตัวคุณเอง",
  "แล้วแต่ใจคุณ",
  "คำตอบอยู่ในใจคุณ",
  "เวลาจะเป็นเครื่องพิสูจน์",
  "เมื่อถึงเวลาที่เหมาะสม",
  "อนาคตอยู่ในมือคุณ",
  // ── ชุดเพิ่ม: ภาษาพลังงานลอย ๆ ที่ไม่อ้างหน้าไพ่ ──
  "พลังงานรอบตัวคุณกำลังเปลี่ยนแปลง",
  "สัญญาณจากจักรวาลกำลังบอกคุณ",
];

/** ช่องว่างแทรกกลางคำ: พยัญชนะ + ช่องว่าง + สระ/วรรณยุกต์ที่ลอยตามไม่ได้ */
const WORD_SPLIT_RE = /[\u0E01-\u0E2E]\s+[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/g;

/** คำละติน ≥ 3 ตัวอักษร */
const LATIN_WORD_RE = /[A-Za-z][A-Za-z'-]{2,}/g;

/* ═════════════════════════════════════════════════════════════════════
 * Allowlist ของคำละติน — ชื่อไพ่ 1909 ทั้ง 78 ใบ + คำประกอบ
 * ═══════════════════════════════════════════════════════════════════ */

let latinAllowCache: Set<string> | null = null;

function latinAllowlist(): Set<string> {
  if (latinAllowCache) return latinAllowCache;
  const set = new Set<string>();
  for (const card of DECK) {
    for (const token of card.nameEn.split(/[^A-Za-z]+/)) {
      if (token.length >= 3) set.add(token.toLowerCase());
    }
  }
  // คำที่ปรากฏในชื่อผัง ชื่อบุคลิก และศัพท์ทาโรต์ที่เขียนทับศัพท์ไม่ได้จริง ๆ
  for (const extra of [
    "arcana",
    "major",
    "minor",
    "tarot",
    "rider",
    "waite",
    "smith",
    "celtic",
    "cross",
    "the",
    "and",
    "reversed",
    "upright",
  ]) {
    set.add(extra);
  }
  latinAllowCache = set;
  return set;
}

/* ═════════════════════════════════════════════════════════════════════
 * polishThai — แก้อัตโนมัติเฉพาะกลุ่มที่ปลอดภัย 100%
 * ═══════════════════════════════════════════════════════════════════ */

/**
 * แก้ภาษาไทยที่ผิดชัดเจนแบบเงียบ ๆ (regex ล้วน ไม่มี allocation หนัก)
 *
 * ⚠️ ฟังก์ชันนี้วิ่งบน **สตรีมสด** ผ่าน `sanitizeTarotText()` ➔ ต้องเร็วระดับ < 1ms
 *    ต่อข้อความ 2,000 ตัวอักษร (มีเทสต์วัดเวลาจริงใน `scripts/qa/test-thai-quality.ts`)
 *
 * ✅ idempotent — เรียกซ้ำกี่ครั้งผลลัพธ์เท่าเดิม (สตรีมสดเรียกทับซ้ำได้ปลอดภัย)
 */
export function polishThai(text: string | null | undefined): string {
  if (!text) return "";
  let out = text;

  // 1. อักขระล่องหน — ลบทิ้งก่อนเสมอ ไม่งั้นมันขวางการจับคู่ regex ข้ออื่น
  out = out.replace(INVISIBLE_CHAR_RE, "");

  // 2. เ + เ → แ
  out = out.replace(DOUBLE_SARA_E_RE, "แ");

  // 3. คำลงท้าย ค่ะ/คะ ตามรายการปิด
  for (const [re, to] of PARTICLE_FIXES) {
    out = out.replace(re, to);
  }

  // 4. วรรณยุกต์/สระบนซ้อนซ้ำ
  out = out.replace(DUP_DIACRITIC_RE, "$1");

  // 5. วรรณยุกต์ลอย
  out = out.replace(ORPHAN_DIACRITIC_RE, "");

  // 6. ไม้ยมกเว้นวรรคหน้า-หลัง
  out = out.replace(MAIYAMOK_NO_SPACE_BEFORE_RE, (m) => `${m.slice(0, -1)} ๆ`);
  out = out.replace(MAIYAMOK_NO_SPACE_AFTER_RE, "ๆ ");

  return out;
}

/** แก้ภาษาไทยในทุกสตริงของวัตถุซ้อนชั้น (คงรูปร่าง Type เดิมไว้ 100%) */
export function polishThaiDeep<T>(value: T): T {
  if (typeof value === "string") return polishThai(value) as unknown as T;
  if (Array.isArray(value)) return value.map(polishThaiDeep) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = polishThaiDeep(v);
    return out as T;
  }
  return value;
}

/* ═════════════════════════════════════════════════════════════════════
 * checkThaiQuality — ตรวจอย่างเดียว ไม่แก้ (ใช้ทั้งใน CI และตอนเก็บสถิติ)
 * ═══════════════════════════════════════════════════════════════════ */

function countMatches(text: string, re: RegExp): { count: number; sample?: string } {
  const matches = text.match(re);
  if (!matches || matches.length === 0) return { count: 0 };
  return { count: matches.length, sample: matches[0].slice(0, 24) };
}

/**
 * หาวลีไทยความยาว `size` ตัวอักษรที่ซ้ำมากที่สุดในข้อความ
 * ใช้จับอาการ "อ่านทุกใบเหมือนกันหมด" ซึ่งเป็นต้นเหตุของความรู้สึกว่าไม่แม่น
 */
function maxRepeatedNgram(text: string, size = 8): { phrase: string; times: number } {
  const compact = text.replace(/\s+/g, "");
  if (compact.length < size * 3) return { phrase: "", times: 0 };

  const seen = new Map<string, number>();
  let best = "";
  let bestCount = 0;
  for (let i = 0; i + size <= compact.length; i++) {
    const gram = compact.slice(i, i + size);
    if (!/^[\u0E01-\u0E4E]+$/.test(gram)) continue;
    const next = (seen.get(gram) ?? 0) + 1;
    seen.set(gram, next);
    if (next > bestCount) {
      bestCount = next;
      best = gram;
    }
  }
  return { phrase: best, times: bestCount };
}

/**
 * ตรวจคุณภาพภาษาไทยของข้อความหนึ่งก้อน
 *
 * คะแนน: เริ่มที่ 100 · หัก 15 ต่อ issue ระดับ fatal · หัก 5 ต่อ issue ระดับ warn
 * (หักตาม "ชนิดของปัญหา" ไม่ใช่ตามจำนวนจุด — ไม่งั้นคำอ่านยาวจะเสียเปรียบคำอ่านสั้นโดยอัตโนมัติ)
 */
export function checkThaiQuality(
  text: string | null | undefined,
  opts?: ThaiQualityOptions
): ThaiQualityResult {
  const issues: ThaiIssue[] = [];
  if (!text || !text.trim()) {
    return { ok: true, fatal: false, score: 100, issues };
  }

  const relaxDupDiacritic = opts?.personaId === "playful";

  // ── กลุ่ม fatal ──────────────────────────────────────────────
  const doubleSaraE = countMatches(text, DOUBLE_SARA_E_RE);
  if (doubleSaraE.count > 0) {
    issues.push({
      code: "DOUBLE_SARA_E",
      message: `พบสระ เ ซ้อนสองตัวแทน แ จำนวน ${doubleSaraE.count} จุด`,
      fatal: true,
      count: doubleSaraE.count,
      sample: doubleSaraE.sample,
    });
  }

  let particleCount = 0;
  let particleSample: string | undefined;
  for (const [re] of PARTICLE_FIXES) {
    const found = countMatches(text, re);
    particleCount += found.count;
    if (!particleSample && found.sample) particleSample = found.sample;
  }
  if (particleCount > 0) {
    issues.push({
      code: "PARTICLE_MISMATCH",
      message: `ใช้คำลงท้าย ค่ะ/คะ ผิดที่ ${particleCount} จุด (เช่น "${particleSample}")`,
      fatal: true,
      count: particleCount,
      sample: particleSample,
    });
  }

  if (!relaxDupDiacritic) {
    const dup = countMatches(text, DUP_DIACRITIC_RE);
    if (dup.count > 0) {
      issues.push({
        code: "DUP_DIACRITIC",
        message: `พบวรรณยุกต์หรือสระบนซ้อนซ้ำ ${dup.count} จุด`,
        fatal: true,
        count: dup.count,
        sample: dup.sample,
      });
    }
  }

  const orphan = countMatches(text, ORPHAN_DIACRITIC_RE);
  if (orphan.count > 0) {
    issues.push({
      code: "ORPHAN_DIACRITIC",
      message: `พบวรรณยุกต์ลอยไม่มีพยัญชนะนำหน้า ${orphan.count} จุด`,
      fatal: true,
      count: orphan.count,
    });
  }

  const invisible = countMatches(text, INVISIBLE_CHAR_RE);
  if (invisible.count > 0) {
    issues.push({
      code: "INVISIBLE_CHAR",
      message: `พบอักขระล่องหน (zero-width / BOM) ${invisible.count} ตัว`,
      fatal: true,
      count: invisible.count,
    });
  }

  // ── กลุ่ม warn ───────────────────────────────────────────────
  const maiyamokBefore = countMatches(text, MAIYAMOK_NO_SPACE_BEFORE_RE);
  const maiyamokAfter = countMatches(text, MAIYAMOK_NO_SPACE_AFTER_RE);
  const maiyamokCount = maiyamokBefore.count + maiyamokAfter.count;
  if (maiyamokCount > 0) {
    issues.push({
      code: "MAIYAMOK_SPACING",
      message: `ไม้ยมกไม่ได้เว้นวรรคหน้า-หลัง ${maiyamokCount} จุด (เช่น "${maiyamokBefore.sample ?? "ๆ"}")`,
      fatal: false,
      count: maiyamokCount,
      sample: maiyamokBefore.sample,
    });
  }

  const allow = latinAllowlist();
  const extraAllow = new Set((opts?.allowLatin ?? []).map((w) => w.toLowerCase()));
  const latinWords = text.match(LATIN_WORD_RE) ?? [];
  const leaked: string[] = [];
  for (const word of latinWords) {
    const key = word.toLowerCase();
    if (allow.has(key) || extraAllow.has(key)) continue;
    leaked.push(word);
  }
  if (leaked.length > 0) {
    issues.push({
      code: "LATIN_LEAK",
      message: `พบคำอังกฤษที่ไม่ใช่ชื่อไพ่ 1909 จำนวน ${leaked.length} คำ (เช่น "${leaked[0]}")`,
      fatal: false,
      count: leaked.length,
      sample: leaked.slice(0, 5).join(", "),
    });
  }

  const robotFound = ROBOT_PHRASES.filter((p) => text.includes(p));
  if (robotFound.length > 0) {
    issues.push({
      code: "ROBOT_PHRASE",
      message: `พบสำนวนหุ่นยนต์ที่ prompt ห้ามไว้: ${robotFound.join(" · ")}`,
      fatal: false,
      count: robotFound.length,
      sample: robotFound[0],
    });
  }

  const barnumFound = BARNUM_PHRASES.filter((p) => text.includes(p));
  const barnumTolerance = opts?.barnumTolerance ?? 1;
  if (barnumFound.length > barnumTolerance) {
    issues.push({
      code: "BARNUM_PHRASE",
      message: `พบวลีกำกวมที่ใช้กับใครก็ได้ ${barnumFound.length} วลี: ${barnumFound.join(" · ")}`,
      fatal: false,
      count: barnumFound.length,
      sample: barnumFound[0],
    });
  }

  const ngram = maxRepeatedNgram(text);
  if (ngram.times >= 3) {
    issues.push({
      code: "REPETITIVE_NGRAM",
      message: `วลี "${ngram.phrase}" ซ้ำ ${ngram.times} ครั้งในคำอ่านเดียว`,
      fatal: false,
      count: ngram.times,
      sample: ngram.phrase,
    });
  }

  // ⚠️ heuristic นี้ผิดได้ง่าย ➔ เป็น warn ตลอดกาล ห้ามยกเป็น fatal (ภาคผนวก A.2)
  const wordSplit = countMatches(text, WORD_SPLIT_RE);
  if (wordSplit.count > 0) {
    issues.push({
      code: "WORD_SPLIT_SPACE",
      message: `อาจมีช่องว่างแทรกกลางคำไทย ${wordSplit.count} จุด`,
      fatal: false,
      count: wordSplit.count,
      sample: wordSplit.sample,
    });
  }

  const fatalCount = issues.filter((i) => i.fatal).length;
  const warnCount = issues.length - fatalCount;
  const score = Math.max(0, 100 - fatalCount * 15 - warnCount * 5);

  const polished = polishThai(text);
  return {
    ok: issues.length === 0,
    fatal: fatalCount > 0,
    score,
    issues,
    ...(polished !== text ? { fixed: polished } : {}),
  };
}

/**
 * รวบรวมข้อความไทยทุกชิ้นในวัตถุซ้อนชั้นมาต่อกัน (ใช้ตรวจทั้ง Reading ในครั้งเดียว)
 * คั่นด้วย `\n` เพื่อไม่ให้คำท้ายฟิลด์กับคำต้นฟิลด์ถัดไปติดกันจนเกิดผลบวกลวง
 */
export function collectThaiText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(collectThaiText).join("\n");
  if (value && typeof value === "object") {
    return Object.values(value).map(collectThaiText).join("\n");
  }
  return "";
}

/**
 * ตรวจคุณภาพภาษาไทยของทั้งวัตถุคำอ่าน (รวมทุกฟิลด์เข้าด้วยกันครั้งเดียว)
 * ใช้ใน `groq.ts` / `gemini.ts` หลังผ่าน `ReadingSchema` และ `checkReadingConsistency()`
 */
export function checkThaiQualityDeep(value: unknown, opts?: ThaiQualityOptions): ThaiQualityResult {
  return checkThaiQuality(collectThaiText(value), opts);
}

/* ═════════════════════════════════════════════════════════════════════
 * enforceThaiQuality — ตัวเชื่อมเข้าท่อจริงของ groq.ts / gemini.ts (B-01)
 * ═══════════════════════════════════════════════════════════════════ */

/** รหัสปัญหาที่ `polishThai()` แก้ให้เองได้ 100% ➔ แก้เงียบ ๆ ไม่ต้อง failover */
export const AUTOFIXABLE_CODES: ThaiIssueCode[] = [
  "DOUBLE_SARA_E",
  "PARTICLE_MISMATCH",
  "DUP_DIACRITIC",
  "ORPHAN_DIACRITIC",
  "INVISIBLE_CHAR",
  "MAIYAMOK_SPACING",
];

export interface ThaiEnforcement<T> {
  /** คำอ่านหลังขัดภาษาไทยแล้ว (พร้อมส่งถึงผู้ใช้) */
  reading: T;
  /** คะแนนภาษาไทยหลังขัด 0-100 — เก็บลง `reading_quality.thai_score` */
  score: number;
  /** รหัสปัญหาที่ยังเหลืออยู่หลังขัด (แก้อัตโนมัติไม่ได้) */
  issueCodes: ThaiIssueCode[];
  /** จำนวนจุดที่ถูกแก้อัตโนมัติเงียบ ๆ */
  fixCount: number;
}

/**
 * ขัดภาษาไทยของคำอ่านก่อนส่งถึงผู้ใช้ แล้วคืนสถิติไว้เก็บลงฐานข้อมูล
 *
 * ✦ **ไม่สั่ง failover** โดยเจตนา (ภาคผนวก A.4)
 *   ความผิดกลุ่ม fatal ทั้งหมดของด่านนี้แก้ได้ถูกต้อง 100% ด้วย regex
 *   การสลับโมเดลจึงมีแต่เสีย TTFB ของผู้ใช้ไปเปล่า ๆ
 *   สิ่งที่เราทำแทนคือ **เก็บสถิติ** ว่าโมเดลไหนต้องขัดกี่จุด
 *   แล้วค่อยตัดสินใจลดชั้นโมเดลนั้นด้วยข้อมูลจริง (เกณฑ์: autofix > 5 จุดต่อคำอ่าน)
 */
export function enforceThaiQuality<T>(reading: T, opts?: ThaiQualityOptions): ThaiEnforcement<T> {
  const before = checkThaiQualityDeep(reading, opts);
  const fixCount = before.issues
    .filter((i) => AUTOFIXABLE_CODES.includes(i.code))
    .reduce((sum, i) => sum + i.count, 0);

  const polished = fixCount > 0 ? polishThaiDeep(reading) : reading;
  const after = fixCount > 0 ? checkThaiQualityDeep(polished, opts) : before;

  return {
    reading: polished,
    score: after.score,
    issueCodes: after.issues.map((i) => i.code),
    fixCount,
  };
}
