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
 * กฎที่ตรวจ (8 ข้อ):
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
if (failures.length > 0) {
  console.error("\n❌ ด่านหัวเว็บ sticky ไม่ผ่าน:\n");
  for (const f of failures) console.error(`   • ${f}`);
  console.error(
    `\n   รวม ${failures.length} ข้อ — อ่านเหตุผลเต็มที่หัวไฟล์ scripts/qa/test-sticky-header.ts\n`,
  );
  process.exit(1);
}

console.log(
  "✅ ด่านหัวเว็บผ่านครบ (ป้าย · fixed top-0 เต็มกว้าง ไม่ใช่ sticky · ตัวกันที่ · เลเยอร์ compositor ที่รอดการย่อ CSS · โล่กันเนื้อหาโผล่ · safe-area · body > * · overflow · ไม่มี fixed ซ้อนในลูกหลาน · ไม่มี scroll container ครอบ)",
);
