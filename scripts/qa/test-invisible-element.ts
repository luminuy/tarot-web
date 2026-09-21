/**
 * 👻 ด่านกันของประดับล่องหน (Invisible Ornament Gate — ISSUE-046)
 * ---------------------------------------------------------------------------
 * ## ทำไมต้องมีด่านนี้
 *
 * ตรวจจริงเมื่อ 2026-09-13 พบ **จุดสถานะสีเขียวที่มองไม่เห็นเลย** บนแถบ
 * "อ่านคำทำนายครบถ้วนแล้ว" ของ `StreamReader.tsx` — กล่องแถบใช้ `bg-[#EBF3ED]`
 * แล้ววงกลมข้างในใส่ `bg-[#EBF3ED]` ซ้ำ วงกลมจึงกลืนหายไปกับพื้นหลังสนิท
 *
 * ของแบบนี้ **typecheck จับไม่ได้ · lint จับไม่ได้ · คนอ่าน diff ก็ไม่สะดุด**
 * เพราะทั้งสองบรรทัดถูกต้องตามไวยากรณ์ทุกประการ ต่างกันแค่ว่าอยู่ซ้อนกัน
 * ตัวที่พิสูจน์ว่าเป็นความพลาดจริงคือพี่น้องของมัน `QuickChatResult.tsx`
 * ที่เป็นแถบเดียวกันเป๊ะแต่ใช้ `bg-ok` ถูกต้อง — ของนี้คือสำเนาที่ลอกผิด
 *
 * กวาดทั้งเว็บรอบนั้นเจอชนิดเดียวกันอีกจุด: `ProvablyFairPanel.tsx`
 * เหรียญ ✓ `w-5 h-5 rounded-full bg-[#EBF3ED]` นั่งอยู่บนกล่อง `bg-[#EBF3ED]`
 *
 * ## ด่านนี้ตรวจอะไร
 *
 * ของประดับทรงกลม (`rounded-full` + คู่ `w-N h-N` ที่เล็กกว่า 8) ที่มีสีพื้นของตัวเอง
 * **ห้ามมีสีพื้นตรงกับกล่องที่ครอบมันอยู่** — ตรงกันเมื่อไรคือมองไม่เห็น
 *
 * ## วิธีหา "กล่องที่ครอบอยู่" — ใช้ระดับการย่อหน้า
 *
 * ทั้ง repo ผ่าน prettier ย่อหน้าจึงสม่ำเสมอ 100% บรรทัดที่ย่อหน้าน้อยกว่าและอยู่เหนือขึ้นไป
 * ที่ใกล้ที่สุด = แท็กที่ครอบอยู่ · วิธีนี้ไม่ต้องเขียน parser JSX (ซึ่งจะไปสะดุด
 * generic อย่าง `useState<boolean>` แล้วนับเป็นแท็กเปิด)
 *
 * ## ⚠️ กับดักที่ต้องรู้ก่อนแก้ด่านนี้
 *
 * - เทียบเฉพาะตอนที่ **ทั้งลูกและแม่มีคลาส `bg-` เพียงตัวเดียว** ถ้าฝั่งใดมีหลายตัว
 *   (เช่นสลับตามเงื่อนไข) จะข้ามไป — ยอมปล่อยผ่านดีกว่าฟ้องผิดแล้วโดนปิดด่าน
 * - จับเฉพาะของประดับขนาดเล็ก ไม่ได้ห้ามกล่องซ้อนกล่องสีเดียวกันทั่วไป
 *   (พื้นสีเดียวกันซ้อนกันเป็นเรื่องปกติและถูกต้องในดีไซน์นี้)
 */
import fs from "node:fs";
import path from "node:path";
import { assertNonEmptyCorpus } from "./lib/corpus";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");

/** คลาสพื้นหลังที่ "เล็กเกินกว่าจะเป็นกล่องจริง" — ถือเป็นของประดับ */
const MAX_ORNAMENT_SIZE = 8;

function walkTsx(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkTsx(full));
    else if (entry.name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

/** คลาสทั้งหมดที่เป็น string literal บนบรรทัดนั้น (ครอบทุกแบบ quote) */
function classesOf(line: string): string[] {
  const out: string[] = [];
  for (const m of line.matchAll(/["'`]([^"'`]*)["'`]/g)) out.push(...m[1].split(/\s+/));
  return out.filter(Boolean);
}

/** คลาสพื้นหลังตัวเดียวของบรรทัดนี้ — คืน null ถ้าไม่มีหรือมีหลายตัว */
function soleBg(classes: string[]): string | null {
  const bgs = [...new Set(classes.filter((c) => /^bg-/.test(c) && !/^bg-(clip|blend|origin|repeat|size|position|no-repeat)/.test(c)))];
  return bgs.length === 1 ? bgs[0] : null;
}

/** เป็นของประดับทรงกลมขนาดเล็กไหม */
function isSmallRound(classes: string[]): boolean {
  if (!classes.includes("rounded-full")) return false;
  const w = classes.find((c) => /^w-\d+(\.\d+)?$/.test(c));
  const h = classes.find((c) => /^h-\d+(\.\d+)?$/.test(c));
  if (!w || !h) return false;
  return parseFloat(w.slice(2)) < MAX_ORNAMENT_SIZE && parseFloat(h.slice(2)) < MAX_ORNAMENT_SIZE;
}

const indentOf = (line: string): number => line.length - line.trimStart().length;

type Finding = { file: string; line: number; bg: string; parentLine: number };

export function scanInvisibleOrnaments(files: string[]): Finding[] {
  const findings: Finding[] = [];

  for (const file of files) {
    const lines = fs.readFileSync(file, "utf-8").split("\n");

    for (let i = 0; i < lines.length; i++) {
      const classes = classesOf(lines[i]);
      if (!isSmallRound(classes)) continue;
      const bg = soleBg(classes);
      if (!bg) continue;

      // เดินขึ้นหา "กล่องที่ครอบอยู่" = บรรทัดเหนือขึ้นไปที่ย่อหน้าน้อยกว่า และมีสีพื้น
      const myIndent = indentOf(lines[i]);
      let ceiling = myIndent;
      for (let j = i - 1; j >= 0; j--) {
        if (!lines[j].trim()) continue;
        const ind = indentOf(lines[j]);
        if (ind >= ceiling) continue;
        ceiling = ind;
        const parentBg = soleBg(classesOf(lines[j]));
        if (!parentBg) {
          if (ind === 0) break;
          continue;
        }
        if (parentBg === bg) {
          findings.push({ file: path.relative(ROOT, file), line: i + 1, bg, parentLine: j + 1 });
        }
        break; // เจอกล่องที่มีสีพื้นตัวแรกแล้ว — ตัวที่อยู่สูงกว่านั้นถูกทับไปแล้ว
      }
    }
  }

  return findings;
}


/**
 * 🫥 ข้อความที่ล่องหนเพราะคอลัมน์ยุบเหลือกว้าง 0 (iOS Safari)
 * ---------------------------------------------------------------------------
 * INC-0200 · 2026-09-18 เจ้าของเปิดลิ้นชักนำทางบน iPhone แล้วชื่อ "วิหารพยากรณ์" กับบรรทัด
 * "RIDER-WAITE TAROT" หายไปทั้งคู่ เหลือแต่ป้าย 1909 RWS ลอยอยู่กลางหัวลิ้นชัก
 *
 * ต้นเหตุ: คอลัมน์ที่ครอบข้อความเขียนไว้แค่ `flex flex-col min-w-0` โดยไม่มีฐานความกว้าง
 * ลูกทั้งสองบรรทัดใช้ `truncate` ซึ่งมี **min-content เป็น 0**
 * Safari คิดความกว้างคอลัมน์แบบ shrink-to-fit แล้วยุบเหลือเท่าป้ายที่เป็น `shrink-0`
 * ข้อความจึงกว้าง 0 และหายทั้งคู่ · Chrome ใช้ max-content จึงไม่มีใครเห็นอาการตอนรีวิว
 *
 * กฎ: คอลัมน์ (`flex-col`) ที่มี `min-w-0` และข้างในมีลูกที่ `truncate`
 * ต้องมีฐานความกว้างเสมอ — `flex-1` · `grow` · `w-full` · `basis-*`
 */
const WIDTH_BASIS = /\b(flex-1|grow|w-full|basis-)/;

type CollapseFinding = { file: string; line: number; truncateLine: number };

export function scanCollapsingColumns(files: string[]): CollapseFinding[] {
  const findings: CollapseFinding[] = [];

  for (const file of files) {
    const lines = fs.readFileSync(file, "utf-8").split("\n");

    for (let i = 0; i < lines.length; i++) {
      const classes = classesOf(lines[i]).join(" ");
      if (!/\bflex-col\b/.test(classes) || !/\bmin-w-0\b/.test(classes)) continue;
      if (WIDTH_BASIS.test(classes)) continue;

      /* มองหาลูกที่ `truncate` ภายในบล็อกเดียวกัน (ย่อหน้าลึกกว่า) */
      const ownIndent = indentOf(lines[i]);
      for (let j = i + 1; j < Math.min(i + 25, lines.length); j++) {
        if (!lines[j].trim()) continue;
        if (indentOf(lines[j]) <= ownIndent) break;
        if (classesOf(lines[j]).includes("truncate")) {
          findings.push({ file: path.relative(ROOT, file), line: i + 1, truncateLine: j + 1 });
          break;
        }
      }
    }
  }

  return findings;
}

/**
 * 🃏 การ์ดแชร์ผลคำทำนาย — ชื่อตำแหน่งห้าม `whitespace-nowrap` (INC-0211)
 *
 * ต้นเหตุ: ชื่อตำแหน่งของผังใหญ่ยาว 160-229px (เช่น "1. แก่นของเรื่อง (หัวใจของสถานการณ์)")
 * แต่คอลัมน์ของไพ่แต่ละใบกว้างแค่ 96px · `whitespace-nowrap` ทำให้มันล้นออกนอกคอลัมน์
 * ทั้งซ้ายและขวา แล้วไป **ทับชื่อของไพ่ใบข้าง ๆ** จนอ่านไม่ออกทั้งคู่
 * (วัดของจริงที่ 430px: ทับกัน 3 คู่ · ใบแรกล้นออกนอกการ์ดไป 7px)
 *
 * ลายน้ำท้ายการ์ดเป็นอาการกลับกัน: ไม่มี `whitespace-nowrap` เลย บนจอแคบจึงตัดกลางคำ
 * เห็นเป็น "SEERTAROT.NE" แล้วขึ้นบรรทัดใหม่เป็น "T"
 *
 * กฎ: ในบล็อกโชว์ไพ่ของ ShareModal ชื่อตำแหน่งต้องตัดบรรทัดได้และมี `line-clamp-*`
 *     ส่วนลายน้ำท้ายการ์ดต้อง `whitespace-nowrap` ทั้งสองก้อน และแถวต้อง `flex-wrap`
 */
type ShareFinding = { rule: string; hint: string };

export function scanShareCardText(root: string): ShareFinding[] {
  const out: ShareFinding[] = [];
  const file = path.join(root, "src/components/reading/ShareModal.tsx");
  if (!fs.existsSync(file)) {
    return [{ rule: "หาไฟล์ ShareModal.tsx ไม่เจอ", hint: "ด่านนี้ตรวจไม่ได้ — อย่าปล่อยผ่านเงียบ ๆ (INC-0211)" }];
  }
  const text = fs.readFileSync(file, "utf-8");

  const posSpan = text.match(/<span className="([^"]*)"[^>]*>\s*\{isEnglish \? \(c\.position\.nameEn/);
  if (!posSpan) {
    out.push({
      rule: "หา <span> ชื่อตำแหน่งในการ์ดแชร์ไม่เจอ",
      hint: "มาร์กอัปเปลี่ยนไป — แก้ด่านให้ตรงก่อน อย่าปล่อยผ่าน (INC-0211)",
    });
  } else {
    const cls = posSpan[1];
    if (/\bwhitespace-nowrap\b/.test(cls)) {
      out.push({
        rule: "ชื่อตำแหน่งในการ์ดแชร์ใช้ `whitespace-nowrap`",
        hint: "ชื่อยาวกว่าคอลัมน์ 96px เกือบเท่าตัว มันจะล้นไปทับชื่อไพ่ใบข้าง ๆ — เอาออก (INC-0211)",
      });
    }
    if (!/\bline-clamp-\d\b/.test(cls)) {
      out.push({
        rule: "ชื่อตำแหน่งในการ์ดแชร์ไม่มี `line-clamp-*`",
        hint: "ไม่จำกัดจำนวนบรรทัด ความสูงหัวคอลัมน์จะไม่เท่ากัน ไพ่ในแถวเดียวกันเรียงไม่ตรง (INC-0211)",
      });
    }
  }
  /* `className` เป็น optional ในแพตเทิร์น — ถ้าใครถอดออกทั้งก้อน ด่านต้องฟ้องว่า
     "ไม่มี whitespace-nowrap" ให้ตรงอาการ ไม่ใช่ฟ้องว่าหามาร์กอัปไม่เจอ */
  const footerRow = text.match(
    /<div className="([^"]*)"[^>]*>\s*<span(?: className="([^"]*)")?\s*>PROVABLY-FAIR SHA-256<\/span>\s*<span(?: className="([^"]*)")?\s*>SEERTAROT\.NET<\/span>/,
  );
  if (!footerRow) {
    out.push({
      rule: "หาแถวลายน้ำท้ายการ์ดแชร์ไม่เจอ",
      hint: "มาร์กอัปเปลี่ยนไป — แก้ด่านให้ตรงก่อน อย่าปล่อยผ่าน (INC-0211)",
    });
  } else {
    const [, rowCls, a = "", b = ""] = footerRow;
    if (!/\bflex-wrap\b/.test(rowCls)) {
      out.push({
        rule: "แถวลายน้ำท้ายการ์ดแชร์ไม่มี `flex-wrap`",
        hint: "จอแคบแล้วสองก้อนเบียดกันจนตัดกลางคำ — ต้องให้ย้ายลงบรรทัดใหม่ทั้งก้อน (INC-0211)",
      });
    }
    for (const [cls, label] of [[a, "PROVABLY-FAIR SHA-256"], [b, "SEERTAROT.NET"]] as const) {
      if (!/\bwhitespace-nowrap\b/.test(cls)) {
        out.push({
          rule: `ลายน้ำ "${label}" ไม่มี \`whitespace-nowrap\``,
          hint: "บนจอแคบจะถูกตัดกลางคำ (เห็นเป็น SEERTAROT.NE แล้วขึ้นบรรทัดใหม่เป็น T) — INC-0211",
        });
      }
    }
  }
  return out;
}

if (process.argv[1] && process.argv[1].endsWith("test-invisible-element.ts")) {
  const tsxFiles = walkTsx(SRC);
  assertNonEmptyCorpus("ไฟล์ .tsx ใน src/", tsxFiles, "ตรวจว่า walk() ชี้ไปที่ src/ จริง");
  const findings = scanInvisibleOrnaments(tsxFiles);

  if (findings.length > 0) {
    console.error(`\n❌ พบของประดับที่กลืนหายไปกับพื้นหลัง ${findings.length} จุด\n`);
    for (const f of findings) {
      console.error(`   ${f.file}:${f.line}`);
      console.error(`      วงกลมใช้ ${f.bg} — ตรงกับกล่องที่ครอบอยู่ (บรรทัด ${f.parentLine}) จึงมองไม่เห็น`);
      console.error(`      แก้: ใช้สีทึบของสถานะนั้นแทน (เช่น bg-ok / bg-gold-ink)\n`);
    }
    process.exit(1);
  }

  console.log("✅ ไม่มีของประดับทรงกลมที่สีพื้นตรงกับกล่องที่ครอบอยู่");

  const collapsing = scanCollapsingColumns(tsxFiles);
  if (collapsing.length > 0) {
    console.error(`\n❌ พบคอลัมน์ที่จะยุบเหลือกว้าง 0 บน iOS Safari ${collapsing.length} จุด\n`);
    for (const f of collapsing) {
      console.error(`   ${f.file}:${f.line}`);
      console.error(`      \`flex-col min-w-0\` ไม่มีฐานความกว้าง แต่มีลูกที่ใช้ \`truncate\` (บรรทัด ${f.truncateLine})`);
      console.error(`      แก้: เติม \`flex-1\` (หรือ \`w-full\`) ให้คอลัมน์นั้น ไม่งั้นข้อความจะหายทั้งบล็อกบน Safari\n`);
    }
    process.exit(1);
  }

  console.log("✅ ไม่มีคอลัมน์ `flex-col min-w-0` ที่ไร้ฐานความกว้างทั้งที่มีลูกใช้ truncate");

  const share = scanShareCardText(ROOT);
  if (share.length > 0) {
    console.error(`\n❌ การ์ดแชร์ผลคำทำนาย: ตัวหนังสือจะซ้อนกัน/ตกบรรทัด ${share.length} จุด\n`);
    for (const f of share) {
      console.error(`   ${f.rule}`);
      console.error(`      ${f.hint}\n`);
    }
    process.exit(1);
  }

  console.log("✅ การ์ดแชร์: ชื่อตำแหน่งตัดบรรทัดได้และจำกัดบรรทัด · ลายน้ำท้ายการ์ดไม่ตัดกลางคำ");
}
