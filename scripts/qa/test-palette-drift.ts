/**
 * 🎨 ด่านกันพาเลตแตกเป็นสองชุด (Palette Drift Gate — UX-12 · UX-13 · UX-14)
 * ---------------------------------------------------------------------------
 * ## ทำไมต้องมีด่านนี้
 *
 * ตรวจจริงเมื่อ 2026-09-11 พบสีฮาร์ดโค้ดในรูป `[#XXXXXX]` รวม 4,215 จุด · 40 ค่า
 * ทั้งที่ `globals.css` ประกาศ 8 Core Tokens ไว้อย่างดี
 *
 * แล้ววัดซ้ำอีกครั้งในวันรุ่งขึ้นได้ 4,232 จุด — **โตขึ้นเอง 81 จุดในวันเดียว**
 * โดยไม่มีใครทัก (`#D9C8AC` +41 · `#8F5C1A` +19 · `#2E211A` +4)
 *
 * บทสรุปจากข้อมูลสองวันนั้นชัดมาก: **อะไรที่มีด่านกันก็นิ่งสนิท อะไรที่ไม่มีก็แย่ลงเอง**
 * การไล่กวาดสีโดยไม่มีด่านจึงเป็นการวิ่งไล่ตามสิ่งที่วิ่งเร็วกว่า — ต้องมีด่านก่อนเสมอ
 *
 * ## ด่านนี้ตรวจ 3 เรื่อง
 *
 * 1. **จำนวนสีฮาร์ดโค้ดห้ามเพิ่มขึ้นจากเพดานที่บันทึกไว้** (ratchet — ลดได้อย่างเดียว)
 * 2. **ห้ามใช้ `#756F66` เด็ดขาด** — สีนี้ถูกถอดออกจากระบบไปแล้วเพราะคอนทราสต์ ~4.4:1
 *    ตกเกณฑ์ WCAG AA (`globals.css` เขียนเหตุผลไว้ตรงจุดที่ยกโทเคน `muted` เป็น `#635B4E`)
 *    แต่โค้ดที่เขียนสีเดิมไว้ตรง ๆ ไม่ถูกกวาดตาม เหลือค้าง 30 จุดอยู่หลายเดือน
 * 3. **ห้ามใช้ `text-gold` / `text-[#A58A5C]` กับตัวอักษรขนาดเล็ก** — วัดจริงบน production
 *    ได้ 3.29:1 บนพื้นขาว และ 2.89:1 บนพื้น canvas ทั้งคู่ตกเกณฑ์ AA (4.5:1)
 *    `globals.css` เขียนเจตนาไว้ถูกแล้วว่า gold คือ "สีเน้นพิเศษ <3% visual surface"
 *    แต่ไม่มีอะไรบังคับเจตนานั้น — ตัวอักษรเล็กต้องใช้ `gold-ink` (#8F5C1A = 5.79:1) แทน
 *
 * ## ⚠️ กับดักที่ต้องรู้ก่อนแก้ด่านนี้
 *
 * - **เพดานเป็น ratchet ห้ามปรับขึ้น** ถ้าตัวเลขจริงเกินเพดาน แปลว่ามีคนเติมสีนอกระบบเข้ามา
 *   วิธีแก้คือใช้โทเคน ไม่ใช่ขยับเพดาน · ถ้าลดลงได้ให้ปรับเพดานลงตามทันที
 * - **`#A58A5C` ยังใช้ได้กับเส้นขอบ ไอคอน และของประดับ** ด่านนี้จับเฉพาะตอนที่มันเป็น
 *   สีตัวอักษรคู่กับคลาสขนาดเล็กเท่านั้น ไม่ได้ห้ามใช้ทั้งหมด
 * - ตรวจเฉพาะ `src/**\/*.tsx` — ไฟล์ CSS และสคริปต์ไม่นับ (โทเคนต้องประกาศเป็น hex อยู่แล้ว)
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");

/**
 * เพดานจำนวนสีฮาร์ดโค้ด — **ratchet: ลดได้อย่างเดียว ห้ามเพิ่ม**
 * ค่าเริ่มต้นมาจากจำนวนจริงหลังกวาดรอบแรก (4,232 → 286)
 */
const MAX_HARDCODED_HEX = 286;

/** สีที่ถูกถอดออกจากระบบแล้ว — ห้ามกลับมาไม่ว่ากรณีใด */
const BANNED: { hex: string; reason: string }[] = [
  {
    hex: "#756F66",
    reason:
      "คอนทราสต์ ~4.4:1 ตกเกณฑ์ WCAG AA — ถูกแทนที่ด้วยโทเคน `muted` (#635B4E ~6:1) ไปแล้ว",
  },
];

/** คลาสขนาดตัวอักษรที่ถือว่า "เล็ก" จึงต้องผ่านเกณฑ์ 4.5:1 */
const SMALL_TEXT =
  /text-\[1[0-3]px\]|text-\[12px\]|\btext-xs\b|\btext-sm\b|\btext-base\b/;

const GOLD_AS_TEXT = /\btext-gold\b(?!-)|text-\[#A58A5C\]/;

/*
 * ── กฎ 4 · ทองบนพื้นมืด ────────────────────────────────────────────────────
 * บทเรียนจากการวัดซ้ำบน production หลัง deploy รอบ UX-14:
 * กฎข้อ 3 จับ `text-gold` บนพื้นสว่างได้หมด แต่ยังเหลือ 2 จุดที่หลุด เพราะ
 *
 *   1. `text-gold-ink` (#8F5C1A) ผ่านเกณฑ์เฉพาะบนพื้นสว่าง — บนฟุตเตอร์พื้นมืด
 *      (`--color-dark` #171512) มันได้แค่ 3.22:1 ซึ่งตกเกณฑ์ AA เหมือนกัน
 *      **โทเคนสีไม่ได้ผูกกับความหมายอย่างเดียว แต่ผูกกับพื้นที่มันไปวางด้วย**
 *      (บทเรียนซ้ำกับ `ok`/`err` ที่ต้องมีคู่ `-on-dark` — INC-0130)
 *
 *   2. บางจุด `text-gold` อยู่บน element แม่ ส่วนคลาสขนาดอยู่บนลูกหรือปู่
 *      การเช็กทีละ element จึงมองไม่เห็น — ต้องเช็กทั้งไฟล์ว่ามีทองคู่กับพื้นมืดไหม
 *
 * ⚠️ กฎนี้ตรวจแบบ "ทั้งไฟล์" จึงอาจมี false positive ถ้าไฟล์เดียวมีทั้งโซนมืดและสว่าง
 * ถ้าเจอเคสแบบนั้นให้แยกคอมโพเนนต์ ไม่ใช่ปิดกฎ
 *
 * ⚠️ ต้องไม่จับ `hover:bg-dark` — นั่นคือ "สีปุ่มตอนเอาเมาส์ชี้" ไม่ใช่พื้นของคอนเทนเนอร์
 * ตัวหนังสือบนปุ่มนั้นเป็นสีขาวอยู่แล้ว ไม่เกี่ยวกับทองเลย
 * (เจอ false positive จริง 3 ไฟล์ในแผงแอดมินตอนเขียนกฎนี้รอบแรก)
 */
const DARK_SURFACE = /(?<![:\w-])bg-dark\b|(?<![:\w-])bg-\[#171512\]/;
const GOLD_INK_AS_TEXT = /\btext-gold-ink\b(?!-)|text-\[#8F5C1A\]/;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (p.endsWith(".tsx")) out.push(p);
  }
  return out;
}

const files = walk(SRC);
const problems: string[] = [];
const notes: string[] = [];

// ── กฎ 1 · จำนวนสีฮาร์ดโค้ดต้องไม่เกินเพดาน ────────────────────────────────
let hardcoded = 0;
for (const f of files) {
  hardcoded += (fs.readFileSync(f, "utf8").match(/\[#[0-9A-Fa-f]{6}\]/g) ?? []).length;
}
if (hardcoded > MAX_HARDCODED_HEX) {
  problems.push(
    `สีฮาร์ดโค้ด \`[#XXXXXX]\` มี ${hardcoded} จุด เกินเพดาน ${MAX_HARDCODED_HEX} จุด\n` +
      `      ➔ ใช้โทเคนใน globals.css แทน (เช่น \`text-gold-ink\` ไม่ใช่ \`text-[#8F5C1A]\`)\n` +
      `      ➔ ห้ามขยับเพดานขึ้นเพื่อให้ด่านผ่าน — นั่นคือการยอมให้พาเลตแตกต่อ`
  );
} else {
  notes.push(
    `สีฮาร์ดโค้ด ${hardcoded} จุด (เพดาน ${MAX_HARDCODED_HEX})` +
      (hardcoded < MAX_HARDCODED_HEX
        ? ` — ลดลงแล้ว ปรับเพดานลงเป็น ${hardcoded} ได้เลย`
        : "")
  );
}

// ── กฎ 2 · สีต้องห้าม ─────────────────────────────────────────────────────
for (const { hex, reason } of BANNED) {
  const hits: string[] = [];
  for (const f of files) {
    const src = fs.readFileSync(f, "utf8");
    const re = new RegExp(hex, "gi");
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) {
      hits.push(`${path.relative(ROOT, f)}:${src.slice(0, m.index).split("\n").length}`);
    }
  }
  if (hits.length) {
    problems.push(
      `พบสีต้องห้าม ${hex} จำนวน ${hits.length} จุด — ${reason}\n` +
        hits.slice(0, 8).map((h) => `      • ${h}`).join("\n")
    );
  }
}
if (!problems.length) notes.push("ไม่พบสีที่ถูกถอดออกจากระบบแล้วกลับมาใช้ซ้ำ");

// ── กฎ 3 · gold ห้ามเป็นสีตัวอักษรขนาดเล็ก ────────────────────────────────
const goldHits: string[] = [];
for (const f of files) {
  const src = fs.readFileSync(f, "utf8");
  const classRe = /className=\{?[`"']([^`"']*)[`"']/g;
  let m: RegExpExecArray | null;
  while ((m = classRe.exec(src))) {
    const cls = m[1];
    if (GOLD_AS_TEXT.test(cls) && SMALL_TEXT.test(cls)) {
      goldHits.push(
        `${path.relative(ROOT, f)}:${src.slice(0, m.index).split("\n").length}`
      );
    }
  }
}
if (goldHits.length) {
  problems.push(
    `\`text-gold\` (#A58A5C) ถูกใช้กับตัวอักษรขนาดเล็ก ${goldHits.length} จุด\n` +
      `      วัดจริงบน production: 3.29:1 บนพื้นขาว · 2.89:1 บนพื้น canvas — ตกเกณฑ์ AA (4.5:1)\n` +
      `      ➔ ใช้ \`text-gold-ink\` (#8F5C1A = 5.79:1) แทนสำหรับตัวอักษร\n` +
      `      ➔ \`gold\` สงวนไว้ให้เส้นขอบ ไอคอน และของประดับที่ไม่ใช่ตัวอักษร\n` +
      goldHits.slice(0, 8).map((h) => `      • ${h}`).join("\n")
  );
} else {
  notes.push("ไม่มี `text-gold` บนตัวอักษรขนาดเล็ก");
}

// ── กฎ 4 · ทองห้ามเป็นตัวอักษรบนพื้นมืด ───────────────────────────────────
const darkGoldHits: string[] = [];
for (const f of files) {
  const src = fs.readFileSync(f, "utf8");
  if (!DARK_SURFACE.test(src)) continue;
  if (!GOLD_INK_AS_TEXT.test(src) && !GOLD_AS_TEXT.test(src)) continue;
  darkGoldHits.push(path.relative(ROOT, f));
}
if (darkGoldHits.length) {
  problems.push(
    `ไฟล์ที่มีพื้นมืด (\`bg-dark\`) แต่ยังใช้ทองเป็นสีตัวอักษร ${darkGoldHits.length} ไฟล์\n` +
      `      \`gold-ink\` บนพื้น #171512 ได้แค่ 3.22:1 · \`gold\` ได้ 2.4:1 — ตกเกณฑ์ AA ทั้งคู่\n` +
      `      ➔ ใช้ \`text-gold-on-dark\` (#D2A354 = 7.9:1) สำหรับตัวอักษรบนพื้นมืด\n` +
      darkGoldHits.slice(0, 8).map((h) => `      • ${h}`).join("\n")
  );
} else {
  notes.push("ไม่มีทองเป็นสีตัวอักษรบนพื้นมืด");
}

// ── สรุปผล ────────────────────────────────────────────────────────────────
if (problems.length) {
  console.error(`❌ QA FAILED — พาเลตแตก ${problems.length} เรื่อง:`);
  for (const p of problems) console.error(`   - ${p}`);
  process.exit(1);
}

console.log("✅ ผ่าน — พาเลตยังเป็นชุดเดียว");
for (const n of notes) console.log(`   - ${n}`);
