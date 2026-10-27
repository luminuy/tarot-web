#!/usr/bin/env tsx
/**
 * 📖 นำเข้านิยายจากไฟล์ Markdown ที่ส่งออกจาก Google Docs ➔ `src/data/novel-chapters.ts`
 * ===========================================================================
 *
 *   npx tsx scripts/novel-import.ts <ไฟล์.md>
 *
 * ต้นฉบับ: Google Docs "นิยาย" (เจ้าของแชร์ 2026-10-27) — File ➔ Download ➔ Markdown (.md)
 * หัวบทต้องเป็นบรรทัดตัวหนา `**บทที่ N: ชื่อบท**` เรียงเลขต่อกันตั้งแต่ 1 (สคริปต์หยุดถ้าไม่ครบ)
 * หัวภาค `# ภาคที่ N: ชื่อภาค` และบรรทัดปิด `[จบภาคที่ N: …]` ➔ `NOVEL_PARTS` (ภาคไหนมีบรรทัดปิด = จบแล้ว)
 *
 * สิ่งที่สคริปต์แก้ให้ (ไม่แตะถ้อยคำของผู้แต่ง):
 * - ถอดเครื่องหมายหนีของ Markdown ที่ Google Docs ใส่มา (`\!` ➔ `!`)
 * - ไม้ยมกเว้นวรรคหน้า-หลังตามราชบัณฑิตยสภา ("ค่อยๆ" ➔ "ค่อย ๆ") — ด่าน `test-thai-content-quality` บังคับทั้งเว็บ
 * - "เเ" (สระ เ สองตัว) ➔ "แ"
 * - บรรทัดว่างเกินและช่องว่างท้ายบรรทัด
 * - บทที่ตัวหนาทั้งบท (คัดลอกวางใน Google Docs แล้วติดตัวหนามาทุกย่อหน้า) ➔ ถอดตัวหนาที่ครอบทั้งย่อหน้าออก
 * - ฉากท้ายบทที่ซ้ำกับต้นบทถัดไปทุกย่อหน้า (ย้ายฉากไปบทใหม่แล้วลืมลบของเดิม) ➔ ตัดออกจากบทเดิม พร้อมแจ้งเตือน
 *
 * ชื่อเรื่อง · ไพ่ประจำบท · คำเตือนเนื้อหา อยู่ที่ `src/data/novel.ts` (เขียนมือ) — ไฟล์นี้สร้างแค่ตัวบท
 */
import fs from "node:fs";
import path from "node:path";

const input = process.argv[2];
if (!input || !fs.existsSync(input)) {
  console.error("❌ ใช้: npx tsx scripts/novel-import.ts <ไฟล์ Markdown ที่ส่งออกจาก Google Docs>");
  process.exit(1);
}

const OUT = path.join(process.cwd(), "src/data/novel-chapters.ts");
const HEADING = /^#*\s*\*\*บทที่\s*(\d+)\s*[:：]\s*(.+?)\s*\*\*\s*$/;
const PART_HEADING = /^#+\s*\**\s*ภาคที่\s*(\d+)\s*[:：]\s*(.+?)\s*\**\s*$/;
const PART_END = /^\**\s*\\?\[?\s*จบภาคที่\s*(\d+)/;

export function normalizeNovelText(text: string): string {
  return (
    text
      .replace(/\\([!\[\]()#*_`>~.+-])/g, "$1")
      .replace(/เเ/g, "แ")
      .replace(/([ก-๎])ๆ/g, "$1 ๆ")
      .replace(/ๆ(?=[ก-ฮเ-ไ])/g, "ๆ ")
      .replace(/[ \t]+$/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

/** ย่อหน้าที่ตัวหนาครอบทั้งก้อน (`**…**` โดยข้างในไม่มี `**` อีก) */
const isWrappedBold = (p: string) => p.length > 4 && p.startsWith("**") && p.endsWith("**") && !p.slice(2, -2).includes("**");

/** บทที่ตัวหนาเกือบทุกย่อหน้า = ตัวหนาติดมาจากการคัดลอกวาง ไม่ใช่ผู้แต่งตั้งใจเน้น ➔ ถอดเฉพาะตัวหนาที่ครอบทั้งย่อหน้า */
export function unwrapAccidentalBold(body: string): string {
  const paras = body.split(/\n{2,}/);
  if (paras.filter(isWrappedBold).length < paras.length * 0.8) return body;
  return paras.map((p) => (isWrappedBold(p) ? p.slice(2, -2) : p)).join("\n\n");
}

const plain = (p: string) => p.replace(/\*/g, "").replace(/\s+/g, " ").trim();

/** ย่อหน้าท้ายบทนี้ที่ซ้ำกับต้นบทถัดไปทุกย่อหน้า (อย่างน้อย 3 ย่อหน้า) — คืนตำแหน่งย่อหน้าแรกที่ซ้ำ หรือ -1 */
export function duplicatedTailStart(body: string, nextBody: string): number {
  const a = body.split(/\n{2,}/).map(plain);
  const b = nextBody.split(/\n{2,}/).map(plain);
  for (let i = 0; i < a.length; i++) {
    const tail = a.slice(i);
    if (tail.length >= 3 && tail.length <= b.length && tail.every((p, k) => p === b[k])) return i;
  }
  return -1;
}

const lines = fs.readFileSync(input, "utf-8").replace(/\r\n/g, "\n").split("\n");
const chapters: { number: number; title: string; body: string }[] = [];
const parts: { number: number; title: string; from: number; complete: boolean }[] = [];
let pendingPart: { number: number; title: string } | null = null;
let current: { number: number; title: string; lines: string[] } | null = null;

const closeChapter = () => {
  if (current) chapters.push({ number: current.number, title: current.title, body: unwrapAccidentalBold(normalizeNovelText(current.lines.join("\n"))) });
};

for (const line of lines) {
  const part = line.match(PART_HEADING);
  if (part) {
    pendingPart = { number: Number(part[1]), title: normalizeNovelText(part[2]) };
    continue;
  }
  const end = line.match(PART_END);
  if (end) {
    const done = parts.find((p) => p.number === Number(end[1]));
    if (!done) {
      console.error(`❌ เจอบรรทัด "จบภาคที่ ${end[1]}" แต่ไม่มีหัว "ภาคที่ ${end[1]}" ก่อนหน้า`);
      process.exit(1);
    }
    done.complete = true;
    continue;
  }
  const m = line.match(HEADING);
  if (m) {
    closeChapter();
    current = { number: Number(m[1]), title: normalizeNovelText(m[2]), lines: [] };
    if (pendingPart) parts.push({ ...pendingPart, from: current.number, complete: false });
    pendingPart = null;
    continue;
  }
  if (current) current.lines.push(line);
}
closeChapter();

for (let i = 0; i + 1 < chapters.length; i++) {
  const at = duplicatedTailStart(chapters[i].body, chapters[i + 1].body);
  if (at === -1) continue;
  const paras = chapters[i].body.split(/\n{2,}/);
  console.warn(`⚠️  ท้ายบทที่ ${chapters[i].number} ซ้ำกับต้นบทที่ ${chapters[i + 1].number} ${paras.length - at} ย่อหน้า ➔ ตัดออกจากบทที่ ${chapters[i].number} (ควรลบในต้นฉบับด้วย)`);
  chapters[i].body = paras.slice(0, at).join("\n\n");
}

// ต้นฉบับที่ยังไม่มีหัวภาค = ทั้งเรื่องคือภาคเดียวที่ยังไม่จบ
if (parts.length === 0) parts.push({ number: 1, title: "", from: 1, complete: false });
if (parts[0].from !== 1 || parts.some((p, i) => p.number !== i + 1)) {
  console.error(`❌ หัวภาคต้องเริ่มที่บทที่ 1 และเรียงเลข 1..N — ได้ ${parts.map((p) => `ภาค ${p.number} เริ่มบท ${p.from}`).join(", ")}`);
  process.exit(1);
}

const numbers = chapters.map((c) => c.number);
if (chapters.length === 0 || numbers.some((n, i) => n !== i + 1)) {
  console.error(`❌ หัวบทต้องเรียง 1..N ไม่ขาดไม่ซ้ำ — ได้ ${numbers.join(", ") || "ไม่มีเลย"}`);
  process.exit(1);
}
const empty = chapters.filter((c) => c.body.length < 500);
if (empty.length) {
  console.error(`❌ บทที่สั้นผิดปกติ (น้อยกว่า 500 ตัวอักษร): ${empty.map((c) => c.number).join(", ")}`);
  process.exit(1);
}

const header = `/**
 * 📖 ตัวบทนิยาย — ไฟล์นี้สร้างจาก \`scripts/novel-import.ts\` ห้ามแก้มือ
 * แก้ที่ต้นฉบับ Google Docs แล้วส่งออกเป็น Markdown และรันสคริปต์ใหม่
 * ชื่อเรื่อง · ไพ่ประจำบท · คำเตือนเนื้อหา อยู่ที่ \`src/data/novel.ts\`
 */

export interface NovelChapterText {
  number: number;
  title: string;
  /** ย่อหน้าคั่นด้วยบรรทัดว่าง · \`**ตัวหนา**\` · \`*ตัวเอียง*\` (เรนเดอร์ด้วย \`src/lib/novel/render.ts\`) */
  body: string;
}

export interface NovelPartText {
  number: number;
  title: string;
  /** เลขบทแรกของภาค */
  from: number;
  /** ต้นฉบับมีบรรทัด "จบภาคที่ N" แล้ว */
  complete: boolean;
}

export const NOVEL_PARTS: readonly NovelPartText[] = ${JSON.stringify(parts, null, 2).replace(/"(\w+)":/g, "$1:")};

export const NOVEL_CHAPTER_TEXT: readonly NovelChapterText[] = [
`;
const body = chapters
  .map((c) => `  {\n    number: ${c.number},\n    title: ${JSON.stringify(c.title)},\n    body: ${JSON.stringify(c.body)},\n  },\n`)
  .join("");
fs.writeFileSync(OUT, `${header}${body}];\n`);

const chars = chapters.reduce((a, c) => a + c.body.length, 0);
console.log(`✅ เขียน ${path.relative(process.cwd(), OUT)} — ${chapters.length} บท · ${chars.toLocaleString()} ตัวอักษร`);
for (const p of parts) console.log(`   ภาคที่ ${p.number}${p.title ? `: ${p.title}` : ""} — เริ่มบทที่ ${p.from}${p.complete ? " · จบแล้ว" : ""}`);
for (const c of chapters) console.log(`   บทที่ ${c.number}: ${c.title} (${c.body.length.toLocaleString()} ตัวอักษร)`);
