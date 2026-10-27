#!/usr/bin/env tsx
/**
 * 📖 นำเข้านิยายจากไฟล์ Markdown ที่ส่งออกจาก Google Docs ➔ `src/data/novel-chapters.ts`
 * ===========================================================================
 *
 *   npx tsx scripts/novel-import.ts <ไฟล์.md>
 *
 * ต้นฉบับ: Google Docs "นิยาย" (เจ้าของแชร์ 2026-10-27) — File ➔ Download ➔ Markdown (.md)
 * หัวบทต้องเป็นบรรทัดตัวหนา `**บทที่ N: ชื่อบท**` เรียงเลขต่อกันตั้งแต่ 1 (สคริปต์หยุดถ้าไม่ครบ)
 *
 * สิ่งที่สคริปต์แก้ให้ (ไม่แตะถ้อยคำของผู้แต่ง):
 * - ถอดเครื่องหมายหนีของ Markdown ที่ Google Docs ใส่มา (`\!` ➔ `!`)
 * - ไม้ยมกเว้นวรรคหน้า-หลังตามราชบัณฑิตยสภา ("ค่อยๆ" ➔ "ค่อย ๆ") — ด่าน `test-thai-content-quality` บังคับทั้งเว็บ
 * - "เเ" (สระ เ สองตัว) ➔ "แ"
 * - บรรทัดว่างเกินและช่องว่างท้ายบรรทัด
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

const lines = fs.readFileSync(input, "utf-8").replace(/\r\n/g, "\n").split("\n");
const chapters: { number: number; title: string; body: string }[] = [];
let current: { number: number; title: string; lines: string[] } | null = null;

for (const line of lines) {
  const m = line.match(HEADING);
  if (m) {
    if (current) chapters.push({ number: current.number, title: current.title, body: normalizeNovelText(current.lines.join("\n")) });
    current = { number: Number(m[1]), title: normalizeNovelText(m[2]), lines: [] };
    continue;
  }
  if (current) current.lines.push(line);
}
if (current) chapters.push({ number: current.number, title: current.title, body: normalizeNovelText(current.lines.join("\n")) });

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

export const NOVEL_CHAPTER_TEXT: readonly NovelChapterText[] = [
`;
const body = chapters
  .map((c) => `  {\n    number: ${c.number},\n    title: ${JSON.stringify(c.title)},\n    body: ${JSON.stringify(c.body)},\n  },\n`)
  .join("");
fs.writeFileSync(OUT, `${header}${body}];\n`);

const chars = chapters.reduce((a, c) => a + c.body.length, 0);
console.log(`✅ เขียน ${path.relative(process.cwd(), OUT)} — ${chapters.length} บท · ${chars.toLocaleString()} ตัวอักษร`);
for (const c of chapters) console.log(`   บทที่ ${c.number}: ${c.title} (${c.body.length.toLocaleString()} ตัวอักษร)`);
