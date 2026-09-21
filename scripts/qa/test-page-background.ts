/**
 * 🪟 ที่ครอบหน้าต้องไม่ปูพื้นทึบทับพื้นหลังของธีม
 * ===========================================================================
 *
 * ## เรื่องที่เกิดขึ้นจริง (รอบ 123)
 *
 * เจ้าของทักว่า "หน้าอื่นสีพื้นหลังไม่เหมือนหน้าหลัก" ทั้งที่ธีมกระจกลงครบทุกหน้าแล้ว
 * วัดพื้นหลังเปล่า ๆ ของสามหน้าเทียบกัน ได้สีตรงกันทุกพิกเซล — พื้นหลังไม่ได้ผิดเลย
 *
 * ต้นตอคือ `<main className="min-h-screen bg-canvas …">` ใน 30 ไฟล์:
 * มันคือ **แผ่นครีมทึบสูงเต็มจอ** ที่ปูทับแสงไล่สีของ `body::before` ทิ้งทั้งใบ
 * หน้าแรกไม่มีคลาสนี้ พื้นหลังจึงทะลุขึ้นมาได้ — เลยเห็นต่างกันชัดแค่หน้าแรกหน้าเดียว
 *
 * ## ทำไมต้องมีด่าน ไม่ใช่แค่จดไว้ในเอกสาร
 *
 * `bg-canvas` บนที่ครอบหน้า **ดูไม่ผิดเลยตอนอ่าน diff** — มันคือสีพื้นเว็บชื่อตรงตัว
 * และ typecheck/lint ไม่มีทางจับ ที่แย่กว่านั้นคือถ้าเปิดดูหน้าเดียวก็ไม่รู้ว่าผิด
 * ต้องเอาไปวางข้างหน้าแรกถึงจะเห็น (เจ้าของเห็นเพราะสลับแท็บดู)
 *
 * ⚠️ พื้นทึบใน **การ์ดหรือกล่องย่อย** ไม่ผิด ด่านนี้จับเฉพาะก้อนที่สูงเต็มจอ
 *    (`min-h-screen` / `min-h-dvh`) ซึ่งกินพื้นที่ทั้งหน้าเท่านั้น
 */

import fs from "node:fs";
import path from "node:path";

import { assertNonEmptyCorpus } from "./lib/corpus";

const ROOT = process.cwd();
const SCAN_DIRS = ["src", "astro"];
const EXT = new Set([".tsx", ".astro"]);

/** สูงเต็มจอ = ก้อนที่ครอบทั้งหน้า ไม่ใช่การ์ดย่อย */
const FULL_HEIGHT = /\bmin-h-(screen|dvh)\b/;
/** พื้นทึบระดับธีมที่จะบังแสงไล่สีทิ้ง */
const OPAQUE_BG = /\bbg-(canvas|surface|inset)[a-z-]*(?:\/(\d+))?\b/g;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (EXT.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

function run(): void {
  /* "สแกนศูนย์ไฟล์" กับ "ไม่เจอที่ผิด" พิมพ์ผลออกมาหน้าตาเหมือนกันเป๊ะ
     ถ้าวันไหนโครงโฟลเดอร์ขยับแล้วสแกนไม่เจออะไรเลย ด่านนี้ต้องตก ไม่ใช่ขึ้นเขียว */
  const files = SCAN_DIRS.flatMap((dir) => {
    const abs = path.join(ROOT, dir);
    return fs.existsSync(abs) ? walk(abs) : [];
  });
  assertNonEmptyCorpus(
    "ไฟล์ .tsx/.astro ที่ต้องสแกนหาที่ครอบหน้า",
    files,
    "ดูว่า src/ กับ astro/ ยังอยู่ที่เดิมไหม",
  );

  const problems: string[] = [];

  for (const file of files) {
    const lines = fs.readFileSync(file, "utf-8").split("\n");
    lines.forEach((line, idx) => {
      for (const raw of line.match(/"[^"\n]*"|`[^`\n]*`/g) ?? []) {
        const body = raw.slice(1, -1);
        if (!FULL_HEIGHT.test(body)) continue;
        for (const m of body.matchAll(OPAQUE_BG)) {
          // โปร่งกว่า 50% ปล่อยผ่าน แสงไล่สียังทะลุขึ้นมาได้
          const alpha = m[2] ? Number(m[2]) : 100;
          if (alpha <= 50) continue;
          problems.push(
            `${path.relative(ROOT, file)}:${idx + 1} — \`${m[0]}\` อยู่บนก้อนที่สูงเต็มจอ\n` +
              `      ก้อนนั้นคือ: ${body.slice(0, 110)}${body.length > 110 ? "…" : ""}`,
          );
        }
      }
    });
  }

  if (problems.length > 0) {
    console.error(`\n❌ มีที่ครอบหน้าปูพื้นทึบทับพื้นหลังของธีม ${problems.length} จุด:\n`);
    for (const p of problems) console.error(`  • ${p}\n`);
    console.error("  ➔ ถอดคลาสพื้นออกจากก้อนที่สูงเต็มจอ แล้วปล่อยให้แสงไล่สีของ `body` ทะลุขึ้นมา");
    console.error("     ถ้าอยากได้พื้นให้เฉพาะกล่องนั้นจริง ๆ ให้ย้ายคลาสไปไว้ที่กล่องข้างใน");
    console.error("  ⚠️ ห้ามแก้ด่านให้ผ่านโดยไม่เปิดดูหน้านั้นเทียบกับหน้าแรกก่อน\n");
    process.exit(1);
  }

  console.log(
    `✅ ไม่มีที่ครอบหน้าไหนปูพื้นทึบทับพื้นหลัง — แสงไล่สีขึ้นมาได้ครบทุกหน้า (สแกน ${files.length} ไฟล์)`,
  );
}

run();
