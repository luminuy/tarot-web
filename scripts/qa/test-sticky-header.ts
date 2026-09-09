/**
 * QA — ยามเฝ้าหัวเว็บ sticky (Sticky Site Header Guard)
 *
 * ⚠️ ทำไมต้องมีไฟล์นี้
 * "หัวเว็บไม่อยู่นิ่ง" กลับมาแล้ว 4 รอบด้วยสาเหตุคนละตัวทุกรอบ:
 *   INC-0060/0067 — `overflow-x: hidden` บนบรรพบุรุษ ทำให้เกิด scroll container → sticky ตาย
 *   INC-0081      — กฎ `body > *` ทับ position/z-index ของหัวเว็บ
 *   INC-0107      — หัวเว็บไม่มีเลเยอร์ compositor ของตัวเอง บน iOS จึงถูกวาดใหม่ทุกเฟรม
 *                   แล้วตามหลังตำแหน่งสกรอลล์ เห็นเป็นหัวเว็บสั่นและมีเนื้อหาแวบเหนือหัวเว็บ
 *
 * ทั้งสามรอบก่อนหน้าปิดเคสด้วย "คอมเมนต์เตือน" ในไฟล์เดียวกับที่ถูกละเมิด
 * บทเรียน (หลักการข้อ 0.8): กฎที่ไม่มีเครื่องตรวจ คือกฎที่จะถูกละเมิดอีกแน่นอน
 *
 * ────────────────────────────────────────────────────────────────
 * กฎที่ตรวจ (6 ข้อ):
 *  1. `<header>` ของ SiteHeader ต้องมี `data-site-header` + `sticky` + `top-0` + z-index
 *  2. globals.css ต้องมีบล็อก `[data-site-header]` ที่บังคับเลเยอร์ compositor ด้วย translate3d
 *     และกันพื้นที่ใต้ status bar ด้วย env(safe-area-inset-top)
 *  3. กฎ `body > *` ต้องยกเว้น `[data-site-header]` เสมอ (INC-0081)
 *  4. `html` ต้องเป็น `overflow-x: clip` และห้ามมี `overflow-x: hidden` ที่ html/body (INC-0067)
 *  5. ห้ามมี `position: fixed` ในต้นไม้ของหัวเว็บ — เพราะ transform ในข้อ 2 ทำให้หัวเว็บ
 *     กลายเป็น containing block ของลูกหลานที่เป็น fixed (แผงเมนูจะยึดผิดที่ทันที)
 *  6. ไฟล์ที่เรนเดอร์ `<SiteHeader` ห้ามครอบมันด้วย element ที่เป็น scroll container
 *     (`overflow-hidden` / `overflow-auto` / `overflow-y-*`) — `overflow-x-clip` เท่านั้นที่อนุญาต
 *
 * รันด้วย: npx tsx scripts/qa/test-sticky-header.ts
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), "../..");

const GLOBALS_CSS = path.join(ROOT, "src/app/globals.css");
const SITE_HEADER = path.join(ROOT, "src/components/layout/SiteHeader.tsx");

/** คอมโพเนนต์ที่เรนเดอร์อยู่ "ข้างใน" หัวเว็บ — ต้องเป็น absolute เท่านั้น ห้าม fixed */
const HEADER_SUBTREE = [
  "src/components/layout/SiteHeader.tsx",
  "src/components/layout/LanguageSwitcher.tsx",
  "src/components/ui/SacredNavDropdown.tsx",
  "src/components/auth/UserProfileBadge.tsx",
];

/** คลาส overflow ที่สร้าง scroll container → ฆ่า sticky ของลูกหลาน */
const SCROLL_CONTAINER_CLASSES = [
  "overflow-hidden",
  "overflow-auto",
  "overflow-scroll",
  "overflow-y-hidden",
  "overflow-y-auto",
  "overflow-y-scroll",
  "overflow-x-hidden",
];

const failures: string[] = [];

function read(relOrAbs: string): string {
  const full = path.isAbsolute(relOrAbs) ? relOrAbs : path.join(ROOT, relOrAbs);
  return fs.readFileSync(full, "utf-8");
}

function listTsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      out.push(...listTsxFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".tsx")) {
      out.push(full);
    }
  }
  return out;
}

/** ดึงเนื้อในของทุก className ในไฟล์ (รองรับทั้ง "..." และ {`...`}) */
function classNameChunks(source: string): { line: number; value: string }[] {
  const chunks: { line: number; value: string }[] = [];
  const lines = source.split("\n");
  lines.forEach((line, index) => {
    const matches = line.matchAll(/className\s*=\s*(?:"([^"]*)"|\{\s*[`"']([^`"']*))/g);
    for (const m of matches) {
      chunks.push({ line: index + 1, value: m[1] ?? m[2] ?? "" });
    }
  });
  return chunks;
}

/** true เมื่อสตริงคลาสมี token นี้แบบเต็มคำ (กัน `flex-shrink-0` ชนกับ `fixed`) */
function hasClassToken(classValue: string, token: string): boolean {
  return classValue.split(/[\s"'`{}]+/).some((c) => c === token);
}

// ───────────────────────────────────────────────────────────────
// 1. SiteHeader ต้องยัง sticky top-0 และติดป้าย data-site-header
// ───────────────────────────────────────────────────────────────
const headerSource = read(SITE_HEADER);
if (!headerSource.includes("data-site-header")) {
  failures.push(
    "SiteHeader.tsx: หาย `data-site-header` — ป้ายนี้คือสิ่งที่ globals.css และด่านนี้ใช้ระบุหัวเว็บ",
  );
}
const headerClass = classNameChunks(headerSource)[0]?.value ?? "";
for (const token of ["sticky", "top-0"]) {
  if (!hasClassToken(headerClass, token)) {
    failures.push(`SiteHeader.tsx: <header> ต้องมีคลาส \`${token}\` (พบ: "${headerClass}")`);
  }
}
if (!/\bz-\d+\b/.test(headerClass)) {
  failures.push("SiteHeader.tsx: <header> ต้องกำหนด z-index (เช่น `z-50`) ไม่งั้นเนื้อหาหน้าจะทับ");
}

// ───────────────────────────────────────────────────────────────
// 2-4. กฎฝั่ง globals.css
// ───────────────────────────────────────────────────────────────
const css = read(GLOBALS_CSS);

const headerRule = css.match(/\[data-site-header\]\s*\{([^}]*)\}/);
if (!headerRule) {
  failures.push(
    "globals.css: ไม่มีบล็อก `[data-site-header] { ... }` — หัวเว็บต้องถูกบังคับให้มีเลเยอร์ compositor ของตัวเอง (INC-0107)",
  );
} else {
  const body = headerRule[1];
  // ต้องเป็น `transform:` มาตรฐาน ไม่ใช่แค่ `-webkit-transform:` (Safari รุ่นใหม่อ่านตัวมาตรฐาน)
  if (!/(?:^|\n)\s*transform:\s*translate3d\(\s*0\s*,\s*0\s*,\s*0\s*\)/.test(body)) {
    failures.push(
      "globals.css: `[data-site-header]` ต้องมี `transform: translate3d(0, 0, 0)` — ไม่งั้นบน iOS หัวเว็บถูกวาดใหม่ทุกเฟรมแล้วตามหลังการเลื่อน (INC-0107)",
    );
  }
  if (!/padding-top:\s*env\(safe-area-inset-top/.test(body)) {
    failures.push(
      "globals.css: `[data-site-header]` ต้องมี `padding-top: env(safe-area-inset-top, 0px)` — กันเนื้อหาโผล่เหนือหัวเว็บตอนเปิดจากไอคอนหน้าจอโฮม (display: standalone + viewportFit: cover)",
    );
  }
  if (/will-change/.test(body)) {
    failures.push(
      "globals.css: `[data-site-header]` ห้ามใช้ `will-change` — จองเลเยอร์ GPU ค้างตลอด session (INC-0056) ใช้ translate3d แทน",
    );
  }
}

if (!/body\s*>\s*\*[^{]*:not\(\[data-site-header\]\)/.test(css)) {
  failures.push(
    "globals.css: กฎ `body > *` ต้องยกเว้น `:not([data-site-header])` ไม่งั้นมันจะทับ position/z-index ของหัวเว็บ (INC-0081)",
  );
}

const htmlRule = css.match(/(?:^|\n)html\s*\{([^}]*)\}/);
if (!htmlRule || !/overflow-x:\s*clip/.test(htmlRule[1])) {
  failures.push(
    "globals.css: `html` ต้องเป็น `overflow-x: clip` (กันล้นแนวนอนโดยไม่สร้าง scroll container) — INC-0067",
  );
}
if (/(?:^|\n)\s*(?:html|body|html\s*,\s*body)\s*\{[^}]*overflow(?:-x)?:\s*hidden/m.test(css)) {
  failures.push(
    "globals.css: ห้ามตั้ง `overflow: hidden` / `overflow-x: hidden` ที่ `html` หรือ `body` — บังคับ overflow-y เป็น auto ทำให้ sticky ของหัวเว็บตาย (INC-0060 / INC-0067)",
  );
}

// ───────────────────────────────────────────────────────────────
// 5. ห้ามมี position: fixed ในต้นไม้ของหัวเว็บ
// ───────────────────────────────────────────────────────────────
for (const rel of HEADER_SUBTREE) {
  const source = read(rel);
  for (const chunk of classNameChunks(source)) {
    if (hasClassToken(chunk.value, "fixed")) {
      failures.push(
        `${rel}:${chunk.line} — ห้ามใช้ \`fixed\` ในต้นไม้หัวเว็บ: หัวเว็บมี transform จึงเป็น containing block ให้ลูกหลานที่เป็น fixed ทำให้แผงยึดผิดตำแหน่ง (ใช้ \`absolute\` แทน)`,
      );
    }
  }
}

// ───────────────────────────────────────────────────────────────
// 6. ห้ามครอบ <SiteHeader> ด้วย scroll container
// ───────────────────────────────────────────────────────────────
for (const file of listTsxFiles(path.join(ROOT, "src"))) {
  const source = fs.readFileSync(file, "utf-8");
  if (!source.includes("<SiteHeader")) continue;
  const rel = path.relative(ROOT, file);
  const lines = source.split("\n");
  const headerLine = lines.findIndex((l) => l.includes("<SiteHeader"));
  if (headerLine < 0) continue;

  for (const chunk of classNameChunks(lines.slice(0, headerLine).join("\n"))) {
    for (const bad of SCROLL_CONTAINER_CLASSES) {
      if (hasClassToken(chunk.value, bad)) {
        failures.push(
          `${rel}:${chunk.line} — element ที่ครอบ <SiteHeader> ใช้ \`${bad}\` ซึ่งสร้าง scroll container ทำให้ sticky ของหัวเว็บตาย (ใช้ \`overflow-x-clip\` เท่านั้น) — INC-0067`,
        );
      }
    }
  }
}

// ───────────────────────────────────────────────────────────────
if (failures.length > 0) {
  console.error("\n❌ ด่านหัวเว็บ sticky ไม่ผ่าน:\n");
  for (const f of failures) console.error(`   • ${f}`);
  console.error(
    `\n   รวม ${failures.length} ข้อ — อ่านเหตุผลเต็มที่หัวไฟล์ scripts/qa/test-sticky-header.ts\n`,
  );
  process.exit(1);
}

console.log("✅ ด่านหัวเว็บ sticky ผ่านครบ 6 ข้อ (ป้าย · เลเยอร์ compositor · safe-area · body > * · overflow · ไม่มี fixed ซ้อน)");
