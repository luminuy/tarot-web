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
}
