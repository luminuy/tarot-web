/**
 * QA — ยามเฝ้าหัวเว็บ sticky (Sticky Site Header Guard)
 *
 * ⚠️ ทำไมต้องมีไฟล์นี้
 * "หัวเว็บไม่อยู่นิ่ง" กลับมาแล้ว 5 รอบด้วยสาเหตุคนละตัวทุกรอบ:
 *   INC-0060/0067 — `overflow-x: hidden` บนบรรพบุรุษ ทำให้เกิด scroll container → sticky ตาย
 *   INC-0081      — กฎ `body > *` ทับ position/z-index ของหัวเว็บ
 *   INC-0107      — หัวเว็บไม่มีเลเยอร์ compositor ของตัวเอง (แต่ถูกตัวย่อ CSS กินทิ้ง)
 *   INC-0108      — เลเยอร์ติดจริงแล้ว + เพิ่มโล่ ➔ ช่องว่างเหนือหัวเว็บหาย แต่ "สั่น" ยังอยู่
 *   INC-0109      — ต้นเหตุจริงของอาการสั่นคือ `position: sticky` เอง ไม่ใช่เลเยอร์
 *                   sticky ต้องคำนวณระยะเยื้องใหม่ทุกเฟรมเทียบ layout viewport ซึ่งบน
 *                   iOS Safari ขอบบนของมันขยับเองระหว่างเลื่อน (แถบ URL ย่อ/ขยาย ·
 *                   rubber-band) ค่าที่ได้จึงแกว่ง ➔ เปลี่ยนเป็น `position: fixed` + ตัวกันที่
 *
 * ทุกรอบก่อนหน้าปิดเคสด้วย "คอมเมนต์เตือน" ในไฟล์เดียวกับที่ถูกละเมิด
 * บทเรียน (หลักการข้อ 0.8): กฎที่ไม่มีเครื่องตรวจ คือกฎที่จะถูกละเมิดอีกแน่นอน
 *
 * ────────────────────────────────────────────────────────────────
 * กฎที่ตรวจ (9 ข้อ):
 *  1. `<header>` ของ SiteHeader ต้องมี `data-site-header` + `fixed` + `top-0` + กางเต็มกว้าง
 *     + z-index — และ **ห้ามกลับไปใช้ `sticky`** (INC-0109)
 *  2. globals.css ต้องมีบล็อก `[data-site-header]` ที่บังคับเลเยอร์ compositor ด้วย translateZ(0)
 *     และกันพื้นที่ใต้ status bar ด้วย env(safe-area-inset-top)
 *  2.5 ต้องมีตัวกันที่: SiteHeader.tsx เรนเดอร์ `data-site-header-spacer` และ globals.css
 *     ตั้งความสูงให้มันจาก `--site-header-h` (ไม่มี = หัวเว็บทับเนื้อหาบรรทัดแรกทุกหน้า)
 *  3. กฎ `body > *` ต้องยกเว้น `[data-site-header]` เสมอ (INC-0081)
 *  4. `html` ต้องเป็น `overflow-x: clip` และห้ามมี `overflow-x: hidden` ที่ html/body (INC-0067)
 *  4.5 CSS ที่ build ออกมาจริงต้องยังมี transform 3 มิติ · โล่ ::before · และตัวกันที่ (INC-0108)
 *  5. ห้ามมี `position: fixed` ในต้นไม้ของหัวเว็บ (ยกเว้นตัว <header> เอง) — เพราะ transform
 *     ในข้อ 2 ทำให้หัวเว็บกลายเป็น containing block ของลูกหลานที่เป็น fixed (แผงเมนูจะยึดผิดที่)
 *  6. ไฟล์ที่เรนเดอร์ `<SiteHeader` ห้ามครอบมันด้วย element ที่เป็น scroll container
 *     (`overflow-hidden` / `overflow-auto` / `overflow-y-*`) — `overflow-x-clip` เท่านั้นที่อนุญาต
 *  7. **ทุกหน้าของทั้งเว็บต้องมีหัวเว็บและฟุตเตอร์จริง** ทั้งใน HTML ที่ build ออกมาและในโครง source
 *     ยกเว้นเฉพาะรายการใน `INTENTIONALLY_BARE` ที่ต้องเขียนเหตุผลกำกับ (INC-0110 · INC-0112)
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
// 1. SiteHeader ต้องเป็น fixed top-0 กางเต็มกว้าง และติดป้าย data-site-header
// ───────────────────────────────────────────────────────────────
const headerSource = read(SITE_HEADER);
if (!headerSource.includes("data-site-header")) {
  failures.push(
    "SiteHeader.tsx: หาย `data-site-header` — ป้ายนี้คือสิ่งที่ globals.css และด่านนี้ใช้ระบุหัวเว็บ",
  );
}
const headerClass = classNameChunks(headerSource)[0]?.value ?? "";
for (const token of ["fixed", "top-0"]) {
  if (!hasClassToken(headerClass, token)) {
    failures.push(`SiteHeader.tsx: <header> ต้องมีคลาส \`${token}\` (พบ: "${headerClass}")`);
  }
}
// `fixed` ไม่กางเต็มกว้างให้เอง — ต้องมี inset-x-0 (หรือ left-0 + right-0) ไม่งั้นหัวเว็บหดตามเนื้อหา
const spansFullWidth =
  hasClassToken(headerClass, "inset-x-0") ||
  (hasClassToken(headerClass, "left-0") && hasClassToken(headerClass, "right-0"));
if (!spansFullWidth) {
  failures.push(
    `SiteHeader.tsx: <header> ที่เป็น \`fixed\` ต้องมี \`inset-x-0\` (หรือ \`left-0\` + \`right-0\`) ` +
      `ไม่งั้นแถบจะหดตามความกว้างของเนื้อหาแทนที่จะเต็มจอ (พบ: "${headerClass}")`,
  );
}
// 🚨 INC-0109 — ห้ามย้อนกลับไป sticky เด็ดขาด นี่คือต้นเหตุของอาการ "หัวเว็บสั่นตอนเลื่อน"
if (hasClassToken(headerClass, "sticky")) {
  failures.push(
    "SiteHeader.tsx: <header> ห้ามใช้ `sticky` — sticky ต้องคำนวณระยะเยื้องใหม่ทุกเฟรมเทียบ " +
      "layout viewport ซึ่งบน iOS Safari ขยับเองระหว่างเลื่อน (แถบ URL ย่อ/ขยาย · rubber-band) " +
      "ค่าที่ได้จึงแกว่งจนหัวเว็บสั่น ใช้ `fixed` + `[data-site-header-spacer]` แทน (INC-0109)",
  );
}
if (!/\bz-\d+\b/.test(headerClass)) {
  failures.push("SiteHeader.tsx: <header> ต้องกำหนด z-index (เช่น `z-50`) ไม่งั้นเนื้อหาหน้าจะทับ");
}
// ตัวกันที่ต้องถูกเรนเดอร์คู่กันเสมอ ไม่งั้นหัวเว็บที่หลุด flow จะทับเนื้อหาบรรทัดแรกทุกหน้า
// ⚠️ ต้องจับ "แอตทริบิวต์ใน JSX" (มี `=` ตาม) ไม่ใช่แค่ชื่อที่โผล่ในคอมเมนต์หัวไฟล์
// (พลาดมาแล้วตอนทดสอบด่าน: ลบ <div> ออกแล้วด่านยังผ่าน เพราะไปเจอชื่อในคอมเมนต์)
if (!/data-site-header-spacer\s*=/.test(headerSource)) {
  failures.push(
    "SiteHeader.tsx: หาย `<div data-site-header-spacer>` — หัวเว็บเป็น `fixed` จึงไม่กินพื้นที่ใน flow " +
      "ถ้าไม่มีตัวกันที่ เนื้อหาบรรทัดแรกของทุกหน้าจะถูกหัวเว็บทับ (INC-0109)",
  );
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
  const transformDecl = body.match(/(?:^|\n)\s*transform:\s*([^;]+);/);
  if (!transformDecl) {
    failures.push(
      "globals.css: `[data-site-header]` ต้องมี `transform:` ที่บังคับเลเยอร์ compositor — ไม่งั้นบน iOS หัวเว็บถูกวาดใหม่ทุกเฟรมแล้วตามหลังการเลื่อน (INC-0107)",
    );
  } else if (/translate3d\(\s*0\s*,\s*0\s*,\s*0(?:px)?\s*\)/.test(transformDecl[1])) {
    // INC-0108 — กับดักที่ทำให้การแก้รอบแรกไร้ผลบน production ทั้งที่ source ถูกต้อง
    failures.push(
      "globals.css: `[data-site-header]` ห้ามใช้ `translate3d(0, 0, 0)` — Lightning CSS ยุบเหลือ `translate(0,0)` ซึ่งเป็น 2D และไม่บังคับเลเยอร์ GPU ให้ใช้ `translateZ(0)` แทน (INC-0108)",
    );
  }

  if (!/(?:^|\n)\s*\[data-site-header\]::before\s*\{/.test(css)) {
    failures.push(
      "globals.css: ต้องมีโล่ `[data-site-header]::before` ที่ยืดพื้นหลังขึ้นไปเหนือหัวเว็บ — กันเนื้อหาโผล่ในช่องว่างตอน Safari ย่อแถบเครื่องมือ / rubber-band / เธรดหลักตัน (INC-0108)",
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

// ตัวกันที่ต้องมีความสูงจริงจาก --site-header-h (ไม่งั้นสูง 0 = เหมือนไม่มี)
const spacerRule = css.match(/\[data-site-header-spacer\]\s*\{([^}]*)\}/);
if (!spacerRule) {
  failures.push(
    "globals.css: ไม่มีบล็อก `[data-site-header-spacer] { ... }` — หัวเว็บเป็น `fixed` ต้องมีตัวกันที่ (INC-0109)",
  );
} else if (!/height:\s*var\(--site-header-h\)/.test(spacerRule[1])) {
  failures.push(
    "globals.css: `[data-site-header-spacer]` ต้องตั้ง `height: var(--site-header-h)` " +
      "เพื่อให้ความสูงตัวกันที่ · scroll-padding-top · และค่าที่ ResizeObserver เขียนทับ เป็นค่าเดียวกันเสมอ (INC-0109)",
  );
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
// 4.5 ตรวจ "CSS ที่ build ออกมาจริง" ไม่ใช่แค่ source (บทเรียน INC-0108)
//
// รอบแรกของการแก้เขียน translate3d(0,0,0) ไว้ถูกต้องใน source และด่านนี้ก็ผ่าน
// แต่ Lightning CSS ยุบมันเหลือ translate(0,0) ตอน build → ของที่ขึ้น production
// เป็น transform 2 มิติที่ไม่บังคับเลเยอร์ GPU เลย = แก้ไปแล้วเหมือนไม่ได้แก้
//
// **บทเรียน: ด่านที่ตรวจแค่ source พิสูจน์ไม่ได้ว่าผู้ใช้ได้ของที่เราตั้งใจส่ง**
//
// ⚠️ ห้าม import `lightningcss` มาย่อเองเด็ดขาด — มันเป็น transitive dependency
// ของ `@tailwindcss/postcss` ไม่ได้ประกาศใน package.json  npm (flat node_modules)
// หาเจอ แต่ CI ใช้ pnpm ที่กันการเข้าถึงแพ็กเกจที่ไม่ได้ประกาศ typecheck จึงล้มทันที
// (เกิดขึ้นจริงใน PR #368 — ล้มต่อกัน 3 ด่าน) อ่านไฟล์ที่ build ออกมาแทน ไม่ต้องพึ่งอะไรเลย
// ───────────────────────────────────────────────────────────────
const THREE_D = /translateZ\(|translate3d\(|matrix3d\(|perspective\(|rotate[XY]\(/;
const builtCssDir = path.join(ROOT, ".next/static/css");

let builtSpacerFound = false;

if (fs.existsSync(builtCssDir)) {
  const builtRules: string[] = [];
  for (const name of fs.readdirSync(builtCssDir)) {
    if (!name.endsWith(".css")) continue;
    const built = fs.readFileSync(path.join(builtCssDir, name), "utf-8");
    // ตัวย่อ CSS เขียน pseudo-element เป็น `:before` แบบโคลอนเดียว (ไวยากรณ์ CSS2 ที่ยังใช้ได้)
    // ต้องรับทั้ง `::before` และ `:before` ไม่งั้นจับโล่ไม่เจอทั้งที่มีอยู่จริง
    for (const m of built.matchAll(/\[data-site-header\](?!\))(::?before)?\s*\{([^}]*)\}/g)) {
      builtRules.push(`${m[1] ? "before" : ""}|${m[2]}`);
    }
    if (/\[data-site-header-spacer\][^{]*\{[^}]*height:/.test(built)) builtSpacerFound = true;
  }

  // ⚠️ ต้องตรวจ "ทุก" กฎที่เจอ ไม่ใช่แค่ตัวแรก — บันเดิล CSS ถูกแยกหลายไฟล์และกฎเดียวกัน
  // โผล่ซ้ำในหลายไฟล์ ถ้าใช้ find() ไฟล์ที่ยังดีจะบังไฟล์ที่พังไว้จนด่านผ่านทั้งที่ผู้ใช้บางหน้าได้ของพัง
  const baseRules = builtRules.filter((r) => r.startsWith("|"));
  const shieldRule = builtRules.find((r) => r.startsWith("before|"));

  if (baseRules.length === 0) {
    failures.push(
      "CSS ที่ build แล้ว: ไม่พบกฎ `[data-site-header]` ใน .next/static/css เลย — กฎหายไประหว่าง build (INC-0108)",
    );
  }
  for (const rule of baseRules) {
    if (!THREE_D.test(rule)) {
      failures.push(
        `CSS ที่ build แล้ว: \`[data-site-header]\` ไม่เหลือ transform 3 มิติ จึงไม่ได้เลเยอร์ compositor บน production ` +
          `(ได้: "${rule.slice(1)}") — ตัวย่อ CSS ยุบ translate3d(0,0,0) เป็น 2D ให้ใช้ translateZ(0) (INC-0108)`,
      );
      break;
    }
  }

  if (!shieldRule) {
    failures.push(
      "CSS ที่ build แล้ว: ไม่พบโล่ `[data-site-header]::before` — ช่องว่างเหนือหัวเว็บจะกลับมาทันที (INC-0108)",
    );
  }

  if (!builtSpacerFound) {
    failures.push(
      "CSS ที่ build แล้ว: ไม่พบ `[data-site-header-spacer]` ที่มี `height` — ตัวกันที่หายไประหว่าง build " +
        "หัวเว็บ `fixed` จะทับเนื้อหาบรรทัดแรกทุกหน้าบน production (INC-0109)",
    );
  }
} else {
  // ด่านนี้อยู่ท้ายสุดของ repo:verify ซึ่งด่านก่อนหน้า build ไว้ให้แล้วเสมอ
  // ถ้ารันเดี่ยว ๆ ตอนยังไม่เคย build ก็ข้ามไป กฎ static ด้านบนคุมไว้อยู่แล้ว (หลัก Ratchet · INC-0007)
  console.warn("   ⚠️  ยังไม่มี .next/static/css — ข้ามการตรวจ CSS ที่ build แล้ว (รัน npm run build ก่อนเพื่อตรวจครบ)");
}

// ───────────────────────────────────────────────────────────────
// 5. ห้ามมี position: fixed ในต้นไม้ของหัวเว็บ
// ───────────────────────────────────────────────────────────────
for (const rel of HEADER_SUBTREE) {
  const source = read(rel);
  const chunks = classNameChunks(source);
  for (const chunk of chunks) {
    // ยกเว้นตัว <header> เอง — มันคือ element ที่ *ต้อง* เป็น fixed (ข้อ 1 บังคับไว้แล้ว)
    // ตัว header เป็น className ตัวแรกของ SiteHeader.tsx เสมอ (ตัวกันที่ไม่มี className)
    if (rel === "src/components/layout/SiteHeader.tsx" && chunk === chunks[0]) continue;
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
// 7. ทุกหน้าของเว็บต้อง "มีหัวเว็บและฟุตเตอร์จริง" — ยกเว้นรายการที่ตั้งใจไม่มีเท่านั้น (INC-0112)
//
// INC-0110 จับได้ว่าหน้าอังกฤษ 115 หน้าไม่มีหัวเว็บ แล้วปิดเคสด้วยด่านที่ตรวจ
// **เฉพาะ `.next/server/app/en/**`** ฝั่งไทยจึงยังไม่มีใครตรวจเลยสักหน้า
// พอไล่ดูจริงก็พบอีก 3 หน้าที่หายไปเงียบ ๆ (404 · ตั้งรหัสผ่านใหม่ · สถานะคิวของลูกค้า)
//
// บทเรียน: ด่านที่ตรวจ "เฉพาะที่ที่เคยพัง" คือด่านที่ปล่อยของแบบเดียวกันหลุดในที่อื่น
// ด่านนี้จึงตรวจ **ทุกหน้าของทั้งเว็บ** สองชั้น:
//   7.1 ชั้น artifact — HTML ที่ build ออกมาจริงทุกไฟล์ต้องมีแอตทริบิวต์ `data-site-header="` และแท็ก `<footer`
//       (โครง layout ที่หายไปอ่านจาก page.tsx มองไม่เห็น — นั่นคือต้นเหตุของ INC-0110)
//   7.2 ชั้น source — หน้าที่เป็น dynamic ไม่มี HTML ให้ตรวจตอน build (`/readers/[id]`,
//       `/readers/queue/[id]`, `/s/[id]`) จึงต้องไล่จาก page.tsx ขึ้นไปตาม layout แม่
//       และตามการ import ลึกไม่เกิน 3 ชั้น (หน้าแรกได้หัวเว็บผ่าน HomePageBody ➔ TarotFlow)
//
// ฟุตเตอร์ถูกตรวจคู่กับหัวเว็บเสมอ เพราะทั้งสองอย่างหายไปพร้อมกันทุกครั้งที่ layout หาย
// (INC-0110 หายทั้งคู่ 115 หน้า) การตรวจแค่หัวเว็บคือการเฝ้าประตูหน้าแล้วเปิดประตูหลังทิ้งไว้
//
// ⚠️ ต้องจับ **แอตทริบิวต์** `data-site-header="` เท่านั้น ห้าม includes("data-site-header")
// เฉย ๆ — สตริงนั้นตรงกับ `data-site-header-spacer=""` และกฎ CSS ที่ inline มาในหน้าด้วย
// ด่านจะผ่านทั้งที่หัวเว็บหายไปจริง (บทเรียนตอนทดสอบด่านของ INC-0110)
// ───────────────────────────────────────────────────────────────

/**
 * หน้าที่ "ตั้งใจ" ไม่มีทั้งหัวเว็บกลางและฟุตเตอร์กลาง
 * เพิ่มรายการใหม่ได้ แต่ต้องเขียนเหตุผลกำกับเสมอ (และรายการนั้นต้องชี้ไปหน้าที่มีอยู่จริง)
 */
const INTENTIONALLY_BARE: { route: string; reason: string }[] = [
  { route: "admin", reason: "แผงแอดมิน — ธีมและเมนูคนละชุดกับหน้าเว็บสาธารณะ (noindex)" },
  { route: "admin/login", reason: "หน้าเข้าสู่ระบบของแผงแอดมิน (noindex)" },
  { route: "tester", reason: "โหมดผู้ทดสอบภายใน — ธีมมืดคนละชุด (noindex)" },
  { route: "readers/console", reason: "แผงทำงานหลังบ้านของแม่หมอ มีแถบของตัวเอง (noindex)" },
  {
    route: "reading/chat",
    reason: "ห้องแชท — มีแถบหัวบางของตัวเองพร้อมปุ่มกลับหน้าคำทำนาย (INC-0109) หัวเว็บเต็มจะกินพื้นที่จอสนทนา",
  },
  { route: "s/[id]", reason: "หน้ารับลิงก์แชร์ที่พาไปหน้าแรกภายใน 1 วินาที (noindex) หัวเว็บจะแวบขึ้นมาแล้วหายทันที" },
  {
    route: "_global-error",
    reason: "อยู่นอก root layout จึงไม่มี LocaleProvider ให้ SiteHeader ใช้ (Next บังคับให้เรนเดอร์ <html> ของตัวเอง)",
  },
];
const BARE_ROUTES = new Set(INTENTIONALLY_BARE.map((x) => x.route));

/** `src/app/(th)/readers/queue/[id]/page.tsx` ➔ `readers/queue/[id]` (route group ไม่นับเป็น path) */
function routeIdFromPageFile(file: string): string {
  const rel = path.relative(path.join(ROOT, "src/app"), file).split(path.sep).join("/");
  return rel
    .split("/")
    .slice(0, -1)
    .filter((seg) => !(seg.startsWith("(") && seg.endsWith(")")))
    .join("/");
}

/** layout.tsx ทุกชั้นตั้งแต่โฟลเดอร์ของหน้าขึ้นไปจนถึง src/app */
function ancestorLayouts(pageFile: string): string[] {
  const appDir = path.join(ROOT, "src/app");
  const out: string[] = [];
  let dir = path.dirname(pageFile);
  for (;;) {
    const candidate = path.join(dir, "layout.tsx");
    if (fs.existsSync(candidate)) out.push(candidate);
    if (dir === appDir) break;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return out;
}

function resolveLocalImport(spec: string, fromFile: string): string | null {
  let base: string;
  if (spec.startsWith("@/")) base = path.join(ROOT, "src", spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(fromFile), spec);
  else return null; // แพ็กเกจภายนอก — ไม่ต้องตาม
  for (const candidate of [base, `${base}.tsx`, `${base}.ts`, path.join(base, "index.tsx"), path.join(base, "index.ts")]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

const MAX_IMPORT_DEPTH = 3;

/** ชื่อคอมโพเนนต์ที่ไฟล์นี้ import เข้ามาแบบ local ➔ path จริงของไฟล์นั้น */
function localImports(source: string, fromFile: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of source.matchAll(/import\s+([^;]+?)\s+from\s+"([^"]+)"/g)) {
    const target = resolveLocalImport(m[2], fromFile);
    if (!target) continue;
    const clause = m[1];
    // `import Default from "..."` — ชื่อ default อยู่หน้าสุดก่อนเครื่องหมาย {
    const defaultName = clause.match(/^\s*(?:type\s+)?([A-Za-z_$][\w$]*)\s*(?:,|$)/);
    if (defaultName) out.set(defaultName[1], target);
    // `import { A, B as C } from "..."`
    const named = clause.match(/\{([^}]*)\}/);
    if (named) {
      for (const piece of named[1].split(",")) {
        const alias = piece.trim().split(/\s+as\s+/).pop()?.replace(/^type\s+/, "").trim();
        if (alias) out.set(alias, target);
      }
    }
  }
  return out;
}

/**
 * ไฟล์นี้เรนเดอร์คอมโพเนนต์ที่ระบุ (`<SiteHeader` / `<SiteFooter`) เองหรือไม่ — ถ้าไม่
 * ให้ตามเฉพาะคอมโพเนนต์ที่มัน **เรนเดอร์จริงในเจเอสเอ็กซ์** ลึกไม่เกิน 3 ชั้น
 * (หน้าแรก: page ➔ HomePageBody ➔ TarotFlow)
 *
 * ⚠️ ห้ามตามทุก import ที่เจอ — ตอนทดสอบด่านรอบนี้เคยเขียนแบบนั้นแล้วด่าน "ผ่าน"
 * ทั้งที่ลบ <SiteHeader /> ออกจาก layout ของ /cards จริง ๆ เพราะหน้าไปเจอคำว่า
 * SiteHeader ในโมดูลที่มัน import มาแต่ไม่เคยเรนเดอร์เลย = ใบผ่านฟรีให้ของที่พัง
 */
function rendersComponent(
  file: string,
  tag: "SiteHeader" | "SiteFooter",
  depth: number,
  visited: Map<string, number>,
): boolean {
  if (depth > MAX_IMPORT_DEPTH) return false;
  const seenAt = visited.get(file);
  // เคยไปถึงไฟล์นี้ที่ระดับตื้นกว่าแล้ว = เดินซ้ำไม่ได้อะไรเพิ่ม แต่ถ้ารอบนี้ตื้นกว่าต้องเดินใหม่
  if (seenAt !== undefined && seenAt <= depth) return false;
  visited.set(file, depth);

  const source = fs.readFileSync(file, "utf-8");
  if (source.includes(`<${tag}`)) return true;

  for (const [name, target] of localImports(source, file)) {
    const rendered = new RegExp(`<${name}[\\s/>]`).test(source);
    if (rendered && rendersComponent(target, tag, depth + 1, visited)) return true;
  }
  return false;
}

const rendersHeader = (file: string) => rendersComponent(file, "SiteHeader", 0, new Map());
const rendersFooter = (file: string) => rendersComponent(file, "SiteFooter", 0, new Map());

const pageFiles = listTsxFiles(path.join(ROOT, "src/app")).filter((f) => path.basename(f) === "page.tsx");
const sourceRoutes = new Set(pageFiles.map(routeIdFromPageFile));

// 7.1 ชั้น source — ครอบคลุมหน้า dynamic ที่ไม่มี HTML ให้ตรวจตอน build
for (const file of pageFiles) {
  const route = routeIdFromPageFile(file);
  if (BARE_ROUTES.has(route)) continue;
  const chain = [file, ...ancestorLayouts(file)];
  const missing = [
    chain.some(rendersHeader) ? null : "<SiteHeader />",
    chain.some(rendersFooter) ? null : "<SiteFooter />",
  ].filter(Boolean);
  if (missing.length > 0) {
    failures.push(
      `/${route} — ไม่มี ${missing.join(" และ ")} ทั้งในหน้าเองและใน layout ชั้นใดเลย ` +
        `(ถ้าตั้งใจไม่มีจริง ให้เพิ่มลง INTENTIONALLY_BARE พร้อมเหตุผล) — INC-0110 · INC-0112`,
    );
  }
}

// 7.2 ชั้น artifact — HTML ที่ build ออกมาจริง (ครอบคลุมทั้งไทยและอังกฤษ)
const appBuildDir = path.join(ROOT, ".next/server/app");
if (fs.existsSync(appBuildDir)) {
  const htmlFiles: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".html")) htmlFiles.push(full);
    }
  };
  walk(appBuildDir);

  const headerless: string[] = [];
  const footerless: string[] = [];
  /** หน้าที่มีเนื้อหาโผล่ต่อท้ายฟุตเตอร์ (ฟุตเตอร์ลอยขึ้นมากลางหน้า) */
  const tailAfterFooter: string[] = [];
  let scanned = 0;
  for (const file of htmlFiles) {
    const route = path.relative(appBuildDir, file).split(path.sep).join("/").replace(/\.html$/, "");
    if (BARE_ROUTES.has(route)) continue;
    const html = fs.readFileSync(file, "utf-8");
    // ข้ามไฟล์ที่ไม่ใช่ "หน้าจริงที่ prerender สำเร็จ" — สังเกตจาก `id="__next_error__"`
    // ซึ่ง Next ใช้กับสองกรณี: หน้าที่ redirect (NEXT_REDIRECT ตาม `redirects` ใน next.config)
    // และเปลือกของ `notFound()` ที่ `next start` เขียนลง .next/server/app ตอนมีคนขอ URL ที่ไม่มีจริง
    // ทั้งสองแบบไม่มีเนื้อหาใน HTML เลย (เรนเดอร์ฝั่งไคลเอนต์จาก RSC payload) จึงตรวจอะไรไม่ได้
    // และเปลือกแบบหลังไม่ได้มาจาก build ด้วยซ้ำ — ตรวจมันคือการฟ้องหน้าที่ไม่มีอยู่จริง
    if (html.includes('id="__next_error__"')) continue;
    scanned += 1;
    if (!html.includes('data-site-header="')) headerless.push(`/${route}`);
    // ฟุตเตอร์กลางเป็น <footer> เพียงตัวเดียวของหน้า จึงจับด้วยแท็กตรง ๆ ได้
    if (!html.includes("<footer")) footerless.push(`/${route}`);

    // 7.2 ฟุตเตอร์ต้องเป็น "ท้ายหน้า" จริง ๆ — ห้ามมีเนื้อหาหลักต่อท้ายอีก
    //
    // ⚠️ เกิดจริงบนหน้าแรก (INC-0136): บล็อกเนื้อหา SEO ถูกวางไว้ท้าย fragment ของ
    // `TarotFlow` ซึ่งอยู่ **หลัง** `<SiteFooter />` ผู้ใช้จึงเห็นฟุตเตอร์โผล่กลางหน้า
    // แล้วมีเนื้อหายาวต่อจากใต้ฟุตเตอร์อีกจอ — ด่านข้อ 7.1 ไม่จับเพราะฟุตเตอร์ "มีอยู่" ครบ
    //
    // ⚠️ ตรวจได้เฉพาะหน้าที่ **ไม่ได้สตรีม** เท่านั้น: หน้าที่ React สตรีมจะเขียนเนื้อหาจริง
    // ไว้ใน `<div hidden id="S:n">` ท้ายไฟล์ แล้วให้สคริปต์ `$RC` ย้ายเข้าที่ตอนรัน
    // ลำดับไบต์ในไฟล์จึงไม่ใช่ลำดับที่ผู้ใช้เห็น — เช็กแบบนี้กับหน้าพวกนั้นได้ false positive
    // ทันที 285 หน้า (ลองมาแล้ว) จึงข้ามไปโดยตั้งใจ ดีกว่ามีด่านที่ไม่มีใครเชื่อ
    const isStreamed = html.includes('id="S:') || html.includes("$RC");
    if (!isStreamed) {
      const lastFooterEnd = html.lastIndexOf("</footer>");
      const lastSection = html.lastIndexOf("<section");
      if (lastFooterEnd !== -1 && lastSection > lastFooterEnd) {
        tailAfterFooter.push(`/${route}`);
      }
    }
  }

  if (headerless.length > 0) {
    failures.push(
      `HTML ที่ build แล้ว: ${headerless.length} หน้าไม่มีแอตทริบิวต์ \`data-site-header="\` — ` +
        `${headerless.slice(0, 5).join(", ")}${headerless.length > 5 ? " …" : ""} (INC-0110 · INC-0112)`,
    );
  }

  if (footerless.length > 0) {
    failures.push(
      `HTML ที่ build แล้ว: ${footerless.length} หน้าไม่มี \`<footer\` — ` +
        `${footerless.slice(0, 5).join(", ")}${footerless.length > 5 ? " …" : ""} ` +
        `(ผู้ใช้ที่มาจากผลค้นหาจะไม่มีลิงก์ภายในให้เดินต่อเลย — INC-0110)`,
    );
  }
  if (tailAfterFooter.length > 0) {
    failures.push(
      `HTML ที่ build แล้ว: ${tailAfterFooter.length} หน้ามี <section> อยู่ **ใต้** ฟุตเตอร์ — ` +
        `${tailAfterFooter.slice(0, 5).join(", ")}${tailAfterFooter.length > 5 ? " …" : ""} ` +
        `(ผู้ใช้เห็นฟุตเตอร์โผล่กลางหน้าแล้วมีเนื้อหาต่อท้ายอีก — INC-0136)`,
    );
  }

  // กันด่าน "ผ่านเพราะไม่มีอะไรให้ตรวจ" — เว็บนี้มีหน้าที่ prerender ได้หลายร้อยหน้า
  if (scanned < 200) {
    failures.push(
      `HTML ที่ build แล้ว: ตรวจได้แค่ ${scanned} หน้า (คาดว่าต้องเกิน 200) — build ไม่ครบหรือเส้นทางเปลี่ยน ด่านนี้จึงพิสูจน์อะไรไม่ได้`,
    );
  }
} else {
  console.warn("   ⚠️  ยังไม่มี .next/server/app — ข้ามการตรวจหัวเว็บ/ฟุตเตอร์ใน HTML ที่ build แล้ว (รัน npm run build ก่อนเพื่อตรวจครบ)");
}

// 7.4 หน้า 404 ทั้งสองไฟล์ต้องมีอยู่จริงและต้องมีหัวเว็บ
//
// เว็บนี้มี root layout สองตัวและอยู่ใน route group ทั้งคู่ (`(th)` · `(en)`)
// Next จึงหา "root not-found" ไม่เจอถ้าไม่มีไฟล์วางไว้นอกกลุ่มที่ `src/app/not-found.tsx`
// ผลที่วัดได้จริงก่อนแก้: `/zzz-unknown` และ `/en/zzz` ได้หน้า 404 ดีฟอลต์ของ Next
// ("This page could not be found.") ภาษาอังกฤษล้วน ไม่มีแบรนด์ ไม่มีหัวเว็บ ไม่มีลิงก์กลับ
// ทั้งที่โปรเจกต์มีหน้า 404 ภาษาไทยสวย ๆ อยู่แล้วใน `(th)/not-found.tsx` (INC-0112)
for (const rel of ["src/app/not-found.tsx", "src/app/(th)/not-found.tsx"]) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) {
    failures.push(
      `${rel} หายไป — ${rel.includes("(th)") ? "`notFound()` ในต้นไม้ไทยจะตกไปหน้า 404 ดีฟอลต์ของ Next" : "URL ที่ไม่ตรง route ไหนเลยจะตกไปหน้า 404 ดีฟอลต์ของ Next"} (INC-0112)`,
    );
    continue;
  }
  const missing404 = [
    rendersHeader(full) ? null : "<SiteHeader />",
    rendersFooter(full) ? null : "<SiteFooter />",
  ].filter(Boolean);
  if (missing404.length > 0) {
    failures.push(`${rel} — หน้า 404 ต้องมี ${missing404.join(" และ ")} เหมือนหน้าอื่นทั้งเว็บ (INC-0112)`);
  }
}

// 7.3 กันรายการยกเว้นค้าง — ทุกข้อในลิสต์ต้องชี้ไปยังหน้าที่มีอยู่จริง
for (const item of INTENTIONALLY_BARE) {
  const specialExists =
    (item.route === "_global-error" && fs.existsSync(path.join(ROOT, "src/app/global-error.tsx"))) ||
    (item.route === "_not-found" && fs.existsSync(path.join(ROOT, "src/app/(th)/not-found.tsx")));
  if (!sourceRoutes.has(item.route) && !specialExists) {
    failures.push(
      `INTENTIONALLY_BARE มีรายการค้าง: "${item.route}" ไม่มีหน้านั้นในโปรเจกต์แล้ว — ลบออกจากลิสต์ ` +
        `(ไม่งั้นวันหนึ่งมีหน้าชื่อเดิมกลับมา แล้วมันจะได้ใบผ่านฟรีโดยไม่มีใครรู้)`,
    );
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

console.log(
  "✅ ด่านหัวเว็บผ่านครบ (ป้าย · fixed top-0 เต็มกว้าง ไม่ใช่ sticky · ตัวกันที่ · เลเยอร์ compositor ที่รอดการย่อ CSS · โล่กันเนื้อหาโผล่ · safe-area · body > * · overflow · ไม่มี fixed ซ้อนในลูกหลาน · ไม่มี scroll container ครอบ · ทุกหน้าทั้งเว็บมีหัวเว็บและฟุตเตอร์จริง)",
);
