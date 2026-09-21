/**
 * ✍️ ด่านคุณภาพภาษาไทยของ "ข้อความที่เราเขียนเอง" (T-40)
 * ---------------------------------------------------------------------------
 * ## ทำไมต้องมีด่านนี้
 *
 * `polishThai()` / `checkThaiQuality()` ทำงานกับ **ผลจากโมเดลเท่านั้น**
 * ข้อความไทยที่ทีมเขียนเองไม่เคยผ่านฟังก์ชันนี้เลยสักครั้ง และด่าน `test-thai-quality.ts`
 * ทดสอบฟังก์ชันกับสตริงสังเคราะห์ ไม่เคยสแกนข้อความจริงในรีโป
 *
 * ผลที่วัดได้จริงเมื่อ 2026-09-16: **117 บรรทัดเขียนไม้ยมกโดยไม่เว้นวรรค**
 * ซึ่งคือข้อบกพร่องเดียวกับที่เอนจินคอยแก้ให้ผลของ AI · 77 จาก 117 อยู่ใน
 * `src/data/**` และ `src/components/**` คือข้อความที่เผยแพร่จริงและข้อความ SEO
 *
 * ## ด่านนี้ตรวจอะไร
 *
 * สแกนสตริงไทยทุกตัวใน `src/data/**` และ `src/components/**` แล้วบังคับกฎเดียวกับ
 * ที่บังคับกับผลของโมเดล — เริ่มจากกฎที่ `polishThai()` แก้ให้เองได้ 100%
 * (ไม้ยมกไม่เว้นวรรค · `นะค่ะ` · `เเ` ซ้อน · เว้นวรรคซ้อน)
 *
 * ## ⚠️ ไฟล์ที่ได้รับการยกเว้น (และเหตุผล)
 *
 * - `src/lib/ai/thai-quality.ts` — ตัวเครื่องตรวจเอง แพตเทิร์นต้องเขียนแบบผิดจึงจะจับได้
 * - `src/lib/safety/crisis-lexicon.ts` — กฎต้องแมตช์ข้อความที่ผู้ใช้พิมพ์ติดกันจริง
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
/** โฟลเดอร์ที่ข้อความในนั้น "ผู้ใช้เห็นจริง" หรือเป็นข้อความ SEO */
const SCAN_DIRS = ["src/data", "src/components", "src/app", "src/lib"];

/** ไฟล์ที่ข้อความผิดเป็นเจตนา ไม่ใช่ข้อบกพร่อง */
const EXEMPT = new Set([
  "src/lib/ai/thai-quality.ts",
  "src/lib/safety/crisis-lexicon.ts",
  /* อธิบายคำที่ "สะกดผิด" ไว้ในคอมเมนต์เพื่อบอกว่าเราแก้อะไรให้โมเดล — ไม่ใช่ข้อความที่ผู้ใช้เห็น */
  "src/lib/ai/language.ts",
]);

let pass = 0;
let fail = 0;

function check(label: string, ok: boolean, detail = ""): void {
  if (ok) {
    pass++;
    console.log(`✅ ${label}`);
  } else {
    fail++;
    console.log(`❌ ${label}${detail ? `\n${detail}` : ""}`);
  }
}

function walk(dir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}

interface Rule {
  code: string;
  label: string;
  /** ต้องเป็น regex ที่ไม่มีธง `g` — สคริปต์เติมเอง */
  pattern: RegExp;
  /** คำอธิบายวิธีแก้ */
  fix: string;
  /**
   * ตรวจเฉพาะบรรทัดที่เป็นโค้ดจริง ข้ามคอมเมนต์
   * ใช้กับกฎที่พูดถึง "ถ้อยคำที่ผู้ใช้เห็น" — คอมเมนต์ที่ยกคำต้องห้ามมาอธิบายไม่ใช่ความผิด
   */
  codeOnly?: boolean;
}

/**
 * กฎที่ `polishThai()` แก้ให้เองได้ 100% จึงไม่มีข้ออ้างว่าแก้ไม่ได้
 * (ดู `AUTO_FIXABLE_CODES` ใน `src/lib/ai/thai-quality.ts`)
 */
const RULES: Rule[] = [
  {
    code: "MAIYAMOK_SPACING",
    label: "ไม้ยมกต้องเว้นวรรคหน้า-หลัง (ราชบัณฑิตยสภา)",
    pattern: /[ก-๎]ๆ|ๆ(?=[ก-ฮเ-ไ])/,
    fix: 'เขียน "ค่อย ๆ" ไม่ใช่ "ค่อยๆ"',
  },
  {
    code: "NA_KHA",
    label: '"นะค่ะ" เป็นคำผิด',
    pattern: /นะค่ะ|นะค่ะ|น่ะค่ะ/,
    fix: 'เขียน "นะคะ" (ไม่มีไม้เอกที่ ค)',
  },
  {
    code: "DOUBLE_SARA_E",
    label: "สระ เ ซ้อนสองตัวแทน แ",
    pattern: /เเ/,
    fix: 'เขียน "แ" ตัวเดียว ไม่ใช่ "เ" สองตัวติดกัน',
  },
  {
    /*
     * 🚨 INC-0213 — ห้ามโทษผู้ใช้ว่า "ยังเปิดไพ่ไม่ครบ"
     * ตอน AI เขียนคำทำนายไม่จบ ระบบเคยขึ้นแถบแดงว่า "ยังเปิดไพ่ได้ไม่ครบทุกใบ"
     * ทั้งที่หน้าจอเดียวกันมีป้าย "เปิดไพ่ครบแล้ว" อยู่ข้าง ๆ — ผู้ทดสอบถ่ายภาพมาให้ดู
     * สิ่งที่ไม่ครบคือ "คำอ่าน" ไม่ใช่ "การเปิดไพ่ของผู้ใช้" ต้องเขียนให้ตรงตัวการเสมอ
     */
    code: "BLAME_USER_CARD_OPENING",
    label: "ข้อความแจ้งเตือนห้ามบอกว่าผู้ใช้ยังเปิดไพ่ไม่ครบ (INC-0213)",
    pattern: /(?:ยัง)?เปิดไพ่(?:ได้)?ไม่ครบ/,
    fix: 'เขียนให้ตรงตัวการ เช่น "แม่หมอเขียนคำทำนายไม่จบ จึงยังอ่านไม่ครบทุกใบที่คุณเปิดไว้"',
    codeOnly: true,
  },
];

console.log("✍️ [QA] คุณภาพภาษาไทยของข้อความที่เราเขียนเอง (ไม่ใช่แค่ผลจากโมเดล)\n");

const files: string[] = [];
for (const dir of SCAN_DIRS) files.push(...walk(path.join(ROOT, dir)));

let scanned = 0;
const offendersByRule = new Map<string, string[]>();

for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  if (EXEMPT.has(rel)) continue;
  const src = fs.readFileSync(file, "utf-8");
  // ข้ามไฟล์ที่ไม่มีอักษรไทยเลย
  if (!/[ก-๛]/.test(src)) continue;
  scanned++;

  src.split("\n").forEach((line, i) => {
    const trimmed = line.trimStart();
    const isComment = trimmed.startsWith("*") || trimmed.startsWith("//") || trimmed.startsWith("/*");
    for (const rule of RULES) {
      if (rule.codeOnly && isComment) continue;
      if (rule.pattern.test(line)) {
        const list = offendersByRule.get(rule.code) ?? [];
        list.push(`${rel}:${i + 1} → ${line.trim().slice(0, 100)}`);
        offendersByRule.set(rule.code, list);
      }
    }
  });
}

check(`สแกนไฟล์ที่มีข้อความไทยแล้ว ${scanned} ไฟล์`, scanned > 50, "สแกนได้น้อยผิดปกติ — ตรวจ SCAN_DIRS");

for (const rule of RULES) {
  const offenders = offendersByRule.get(rule.code) ?? [];
  check(
    `${rule.label} — พบ ${offenders.length} จุด`,
    offenders.length === 0,
    offenders.length > 0
      ? `   วิธีแก้: ${rule.fix}\n` +
        offenders.slice(0, 20).map((o) => `   · ${o}`).join("\n") +
        (offenders.length > 20 ? `\n   … และอีก ${offenders.length - 20} จุด` : "")
      : "",
  );
}

console.log(`\n${pass}/${pass + fail} ผ่าน`);
if (fail > 0) process.exit(1);
