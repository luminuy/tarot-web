/**
 * QA — ด่านที่ 48: สามข้อ a11y ที่พลาดไม่ได้ของหน้าแรก (Critical A11y Guard)
 *
 * ⚠️ ทำไมต้องมีไฟล์นี้ (INC-0130)
 * รอบตรวจ UX/UI 2026-09-11 เจอสามเรื่องที่หลุดมานานโดยไม่มีด่านไหนเห็น:
 *
 *  1. **สายด่วนสุขภาพจิต 1323 (3.11:1) และเหตุฉุกเฉิน 1669 (2.81:1)** บนฟุตเตอร์พื้นมืด
 *     ตกเกณฑ์ WCAG AA (4.5:1) ทั้งคู่ — คนที่ต้องการเบอร์นี้ที่สุดคือคนที่อ่านมันไม่ออก
 *     **ขัดกฎเหล็กข้อ 6 ของโปรเจกต์โดยตรง**
 *  2. **หน้าแรกไม่มี landmark `banner`/`contentinfo` เลย** — `SiteHeader`/`SiteFooter`
 *     ถูกครอบไว้ใน `<main>` ตามสเปก HTML-AAM มันจึงไม่ได้ role ของตัวเอง
 *     (เส้นทางอื่นทั้งเว็บทำถูกผ่าน layout — หน้าแรกเป็นที่เดียวที่หลุดเพราะประกอบร่างเอง)
 *  3. **`<h1>` ของหน้าแรกเป็นหัวข้อลำดับที่ 6** (มาหลัง h2 + h3 อีก 4 อัน)
 *     พังทั้งโครงเอกสารของ screen reader และ outline ที่ Google อ่าน
 *
 * **บทเรียนเดิมของบ้านนี้: กฎที่ไม่มีเครื่องตรวจ คือกฎที่จะถูกละเมิดอีกแน่นอน**
 *
 * ────────────────────────────────────────────────────────────────
 * กฎที่ตรวจ
 *  1. `--color-ok-on-dark` / `--color-err-on-dark` ต้องมีจริงใน globals.css
 *     และคอนทราสต์กับ `--color-dark` ต้อง ≥ 4.5:1 (คำนวณจริงตามสูตร WCAG ไม่ได้ฮาร์ดโค้ดผล)
 *  2. รายการสายด่วนใน `nav-links.ts` ต้องใช้โทเคน `-on-dark` เท่านั้น
 *     ห้ามกลับไปใช้ `text-[#3A7044]` / `text-[#A6392C]` หรือ `text-ok` / `text-err` (ของพื้นสว่าง)
 *  3. `TarotFlow.tsx` ต้องไม่มี `<SiteHeader` / `<SiteFooter` อยู่ระหว่าง `<main` กับ `</main>`
 *  4. (เมื่อมี build แล้ว) HTML ของหน้าแรกจริง: หัวข้อแรกต้องเป็น `h1` · ห้ามข้ามลำดับ ·
 *     `<header>`/`<footer>` ต้องไม่อยู่ใน `<main>`
 *
 * รันด้วย: npx tsx scripts/qa/test-a11y-critical.ts
 */

import fs from "node:fs";
import path from "node:path";
import { primaryOutputDir, renderedOutputDirs } from "./lib/rendered-pages";
import { assertNonEmptyCorpus } from "./lib/corpus";

const ROOT = process.cwd();
const problems: string[] = [];
const notes: string[] = [];


/** ไล่ไฟล์ .tsx ทั้งโฟลเดอร์ */
function walkTsx(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkTsx(full, out);
    else if (entry.name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

const tsxFiles = walkTsx(path.join(ROOT, "src"));
assertNonEmptyCorpus("ไฟล์ .tsx ใน src/", tsxFiles, "ตรวจว่า walk() ชี้ไปที่ src/ จริง");

/** ความสว่างสัมพัทธ์ตามสูตร WCAG 2.1 */
function relativeLuminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`รหัสสีไม่ถูกต้อง: ${hex}`);
  const channels = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255);
  const linear = channels.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// ── กฎ 1 · โทเคนพื้นมืดต้องผ่านเกณฑ์จริง ───────────────────────────────────
const css = fs.readFileSync(path.join(ROOT, "src/app/globals.css"), "utf-8");
function readToken(name: string): string | null {
  const m = new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css);
  return m ? m[1] : null;
}

const dark = readToken("dark");
const okOnDark = readToken("ok-on-dark");
const errOnDark = readToken("err-on-dark");

if (!dark) problems.push("globals.css ไม่มีโทเคน --color-dark (พื้นของฟุตเตอร์)");
for (const [label, value] of [["--color-ok-on-dark", okOnDark], ["--color-err-on-dark", errOnDark]] as const) {
  if (!value) {
    problems.push(`globals.css ไม่มีโทเคน ${label} — สายด่วนบนพื้นมืดต้องมีคู่สีของตัวเอง`);
    continue;
  }
  if (!dark) continue;
  const ratio = contrastRatio(value, dark);
  if (ratio < 4.5) {
    problems.push(`${label} (${value}) บนพื้น ${dark} ได้คอนทราสต์ ${ratio.toFixed(2)}:1 — ต่ำกว่าเกณฑ์ WCAG AA 4.5:1`);
  } else {
    notes.push(`${label} ${value} บน ${dark} = ${ratio.toFixed(2)}:1`);
  }
}

// ── กฎ 1ข · เส้นขอบของตัวควบคุมต้องผ่าน WCAG 1.4.11 ที่ 3:1 (R-22) ─────────
/*
 * `--color-line` / `--color-line-warm` วัดจริงได้แค่ 1.27–1.64 : 1 บนพื้นทุกสีที่ใช้คู่กัน
 * บนการ์ดกับเส้นคั่นไม่เป็นไร (เป็นของประดับ) แต่บน **ช่องกรอกและปุ่ม** เส้นขอบ
 * คือสิ่งเดียวที่บอกว่าตัวควบคุมอยู่ตรงไหน — เกณฑ์จึงบังคับ 3:1
 *
 * ด่านนี้คำนวณใหม่ทุกครั้ง ไม่ได้ฮาร์ดโค้ดผล ใครแก้ค่าโทเคนให้จางลงจะถูกฟ้องทันที
 * และเทียบกับ **ทุกพื้นหลังที่ใช้คู่กันจริง** ไม่ใช่เฉพาะพื้นสว่างที่สุด
 */
const CONTROL_SURFACES = ["surface", "canvas", "inset", "inset-warm", "surface-warm"] as const;
for (const token of ["line-interactive", "line-interactive-warm"] as const) {
  const value = readToken(token);
  if (!value) {
    problems.push(
      `globals.css ไม่มีโทเคน --color-${token} — เส้นขอบของช่องกรอก/ปุ่มจะตกกลับไปใช้สีของประดับที่ไม่ผ่านเกณฑ์`,
    );
    continue;
  }
  for (const surface of CONTROL_SURFACES) {
    const bg = readToken(surface);
    if (!bg) {
      problems.push(`globals.css ไม่มีโทเคน --color-${surface} — เทียบคอนทราสต์เส้นขอบไม่ได้`);
      continue;
    }
    const ratio = contrastRatio(value, bg);
    if (ratio < 3) {
      problems.push(
        `--color-${token} (${value}) บนพื้น --color-${surface} (${bg}) ได้ ${ratio.toFixed(2)}:1 — ` +
          "ต่ำกว่าเกณฑ์ WCAG 1.4.11 ที่ 3:1 สำหรับสิ่งที่ไม่ใช่ตัวหนังสือ",
      );
    } else {
      notes.push(`--color-${token} บน --color-${surface} = ${ratio.toFixed(2)}:1`);
    }
  }
}

/*
 * ช่องกรอกทุกช่องต้องใช้โทเคนเส้นขอบของตัวควบคุม ไม่ใช่โทเคนของประดับ
 * (ถ้าไม่ตรวจข้อนี้ โทเคนใหม่จะถูกเพิ่มไว้เฉย ๆ แล้วไม่มีใครเอาไปใช้ — เกณฑ์ผ่านแต่ผู้ใช้ไม่ได้อะไร)
 */
const ornamentBorderControls: string[] = [];
for (const file of tsxFiles) {
  const src = fs.readFileSync(file, "utf-8");
  const srcLines = src.split("\n");
  for (let i = 0; i < srcLines.length; i++) {
    if (!/<\s*(input|select|textarea)\b/.test(srcLines[i])) continue;
    for (let j = i; j < Math.min(i + 18, srcLines.length); j++) {
      if (/border-line(-warm|-soft)?(?![-\w])/.test(srcLines[j])) {
        ornamentBorderControls.push(`${path.relative(ROOT, file)}:${j + 1}`);
        break;
      }
      if (srcLines[j].includes("/>") || srcLines[j].includes("</")) break;
    }
  }
}
if (ornamentBorderControls.length > 0) {
  problems.push(
    `ช่องกรอก ${ornamentBorderControls.length} จุดยังใช้เส้นขอบของประดับที่คอนทราสต์ต่ำกว่า 3:1 ` +
      `(ต้องใช้ border-line-interactive / border-line-interactive-warm): ${ornamentBorderControls.slice(0, 8).join(", ")}` +
      (ornamentBorderControls.length > 8 ? " …" : ""),
  );
}

// ── กฎ 1ค · ข้อความผิดพลาดในฟอร์มต้องถูกประกาศให้โปรแกรมอ่านหน้าจอ (R-21) ──
/*
 * ผู้ใช้ที่มองไม่เห็นกรอกผิดแล้ว **ไม่รู้ว่าผิด** เพราะข้อความโผล่บนจออย่างเดียว
 * ไม่มี `role="alert"` หรือ `aria-live` ➔ โปรแกรมอ่านหน้าจอไม่รู้ว่ามีอะไรเปลี่ยน
 *
 * ตรวจเฉพาะไฟล์ที่มี `<form` จริง (ข้อความ error ในหน้าอื่นเป็นคนละเรื่อง)
 * และดูเฉพาะการเรนเดอร์แบบมีเงื่อนไขจากตัวแปรสถานะที่ชื่อมีคำว่า error
 */
const ERROR_RENDER = /\{\s*([A-Za-z_$][\w$]*(?:[Ee]rror|ERROR)[\w$]*)\s*&&\s*\(/;
const ANNOUNCES = /role=["']alert["']|aria-live=/;
const silentErrors: string[] = [];
for (const file of tsxFiles) {
  const src = fs.readFileSync(file, "utf-8");
  if (!/<form\b/.test(src)) continue;
  const srcLines = src.split("\n");
  for (let i = 0; i < srcLines.length; i++) {
    if (!ERROR_RENDER.test(srcLines[i])) continue;
    const block = srcLines.slice(i, Math.min(i + 8, srcLines.length)).join("\n");
    if (!ANNOUNCES.test(block)) silentErrors.push(`${path.relative(ROOT, file)}:${i + 1}`);
  }
}
if (silentErrors.length > 0) {
  problems.push(
    `ข้อความผิดพลาดในฟอร์ม ${silentErrors.length} จุดไม่ถูกประกาศให้โปรแกรมอ่านหน้าจอ ` +
      `(ต้องมี role="alert" หรือ aria-live): ${silentErrors.slice(0, 8).join(", ")}` +
      (silentErrors.length > 8 ? " …" : ""),
  );
} else {
  notes.push("ข้อความผิดพลาดในฟอร์มทุกจุดมี role=\"alert\" / aria-live");
}

// ── กฎ 1ง · ลิงก์ในรายการต้องมีชื่อที่แยกจากกันได้ (R-23) ───────────────────
/*
 * ผู้ใช้ที่ไล่ฟัง "รายการลิงก์" ได้ยินแค่ชื่อลิงก์ — ถ้าทุกการ์ดในรายการใช้คำว่า
 * "อ่านต่อ" เหมือนกันหมด จะไม่มีทางรู้ว่าลิงก์ไหนไปไหน (WCAG 2.4.4)
 * แก้ด้วย `aria-label` ที่มีชื่อเรื่องอยู่ด้วย โดยที่คนมองเห็นยังเห็นคำสั้นเหมือนเดิม
 */
const GENERIC_LINK_TEXT = /อ่านต่อ|ดูเพิ่มเติม|Read Codex|Read more|Learn more/i;
const genericLinks: string[] = [];
for (const file of tsxFiles) {
  const src = fs.readFileSync(file, "utf-8");
  const srcLines = src.split("\n");
  for (let i = 0; i < srcLines.length; i++) {
    if (!GENERIC_LINK_TEXT.test(srcLines[i])) continue;
    // ต้องเป็นข้อความที่อยู่ในลิงก์ — ไล่ขึ้นไปหาแท็กเปิดภายใน 10 บรรทัด
    const above = srcLines.slice(Math.max(0, i - 10), i + 1).join("\n");
    const openTag = /<(?:Link|a)\b[\s\S]*$/.exec(above);
    if (!openTag) continue;
    if (/aria-label=/.test(openTag[0])) continue;
    // ลิงก์เดี่ยว ๆ ที่ไม่ได้อยู่ในรายการซ้ำ ๆ ไม่เข้าข่ายกฎนี้
    const context = srcLines.slice(Math.max(0, i - 60), i).join("\n");
    if (!/\.map\(/.test(context)) continue;
    genericLinks.push(`${path.relative(ROOT, file)}:${i + 1}`);
  }
}
if (genericLinks.length > 0) {
  problems.push(
    `ลิงก์ในรายการ ${genericLinks.length} จุดใช้ชื่อเรียกซ้ำกันทุกใบโดยไม่มี aria-label ` +
      `(ผู้ใช้ที่ไล่ฟังรายการลิงก์จะไม่รู้ว่าลิงก์ไหนไปไหน): ${genericLinks.slice(0, 8).join(", ")}` +
      (genericLinks.length > 8 ? " …" : ""),
  );
} else {
  notes.push("ลิงก์ในรายการทุกจุดมีชื่อที่แยกจากกันได้");
}

// ── กฎ 2 · รายการสายด่วนต้องใช้โทเคนพื้นมืด ────────────────────────────────
const navLinks = fs.readFileSync(path.join(ROOT, "src/components/layout/nav-links.ts"), "utf-8");
const HOTLINE_MARKERS = ["1323", "1669", "988", "911"];
const lines = navLinks.split("\n");
for (let i = 0; i < lines.length; i++) {
  if (!HOTLINE_MARKERS.some((k) => lines[i].includes(k) && lines[i].includes("title"))) continue;
  // สีของรายการอยู่ภายใน 4 บรรทัดถัดไปของ object เดียวกัน
  const block = lines.slice(i, i + 5).join("\n");
  const colorMatch = /color:\s*"([^"]+)"/.exec(block);
  if (!colorMatch) continue;
  const color = colorMatch[1];
  if (!color.includes("-on-dark")) {
    problems.push(
      `nav-links.ts บรรทัด ${i + 1}: รายการสายด่วนใช้ \`${color}\` ซึ่งเป็นสีของพื้นสว่าง — ` +
        "ฟุตเตอร์เป็นพื้นมืด ต้องใช้ text-ok-on-dark / text-err-on-dark เท่านั้น",
    );
  }
}

// ── กฎ 3 · หัวเว็บ/ฟุตเตอร์ต้องอยู่นอก <main> ในซอร์สของหน้าแรก ─────────────
const flowRaw = fs.readFileSync(path.join(ROOT, "src/components/home/TarotFlow.tsx"), "utf-8");
/*
 * ⚠️ ต้องตัดคอมเมนต์ทิ้งก่อนเสมอ ไม่งั้นด่านนี้จะเป็นด่านหลอก
 * คอมเมนต์ที่อธิบายกฎข้อนี้เองเขียนคำว่า `<main>` ไว้ในเนื้อความ
 * ถ้าค้นดิบ ๆ `indexOf("<main")` จะไปเจอคอมเมนต์ก่อนแท็กจริง แล้วรายงานผิดทันที
 * (เจอจริงตอนเขียนด่านนี้รอบแรก — ฟ้องว่าผิดทั้งที่แก้ถูกแล้ว)
 */
const flow = flowRaw
  .replace(/\/\*[\s\S]*?\*\//g, " ")
  .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
const mainOpen = flow.indexOf("<main");
const mainClose = flow.indexOf("</main>");
if (mainOpen === -1 || mainClose === -1) {
  problems.push("TarotFlow.tsx หา <main> ไม่เจอ — โครงหน้าแรกเปลี่ยนไปแล้ว ต้องอัปเดตด่านนี้ด้วย");
} else {
  for (const tag of ["<SiteHeader", "<SiteFooter"]) {
    const at = flow.indexOf(tag);
    if (at > mainOpen && at < mainClose) {
      problems.push(
        `TarotFlow.tsx: ${tag}> อยู่ข้างใน <main> — ตามสเปก HTML-AAM มันจะไม่ได้ role banner/contentinfo ` +
          "ผู้ใช้ screen reader จะกระโดดไปเมนู/ท้ายเว็บไม่ได้",
      );
    }
  }
}

// ── กฎ 3.5 · หน้าต่างลอยต้องไม่อยู่ใน <main> (INC-0131) ────────────────────
/*
 * 🚨 บั๊กที่มองไม่เห็นจากการอ่านโค้ด และ z-index เท่าไหร่ก็แก้ไม่ได้
 *
 * `globals.css` บังคับ `position: relative; z-index: 1` ให้ลูกตรงของ `<body>` ทุกตัว
 * `<main>` จึงกลายเป็น **stacking context** · หน้าต่างลอยที่เรนเดอร์อยู่ข้างในมัน
 * ต่อให้เขียน `z-50` ก็ยังอยู่ใต้หัวเว็บที่เป็น `fixed z-50` ระดับ `<body>` เสมอ
 *
 * อาการจริงที่เจ้าของถ่ายมา: ฉากหลังโมดัลคลุมทั้งจอ แต่หัวเว็บลอยทับอยู่ข้างบนไม่โดนหรี่
 * และบนมือถือจอเตี้ย หัวเว็บบังขอบบนของแผงจนโลโก้กับปุ่มปิดหาย กดปิดไม่ได้
 */
const MODAL_COMPONENTS = [
  "AuthModal",
  "ShareModal",
  "CardZoomModal",
  "ReadingHistoryModal",
  "BuyCreditsModal",
  "AccessDialog",
  "BookQueueModal",
];

for (const file of tsxFiles) {
  const raw = fs.readFileSync(file, "utf-8");
  if (!raw.includes("<main")) continue;
  const text = raw
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
  const open = text.indexOf("<main");
  const close = text.indexOf("</main>");
  if (open === -1 || close === -1 || close < open) continue;
  const inside = text.slice(open, close);
  const rel = path.relative(ROOT, file).split(path.sep).join("/");
  for (const name of MODAL_COMPONENTS) {
    if (new RegExp(`<${name}[\\s/>]`).test(inside)) {
      problems.push(
        `${rel}: <${name}> เรนเดอร์อยู่ใน <main> — <main> เป็น stacking context (z-index:1) ` +
          "หน้าต่างลอยจึงไม่มีวันขึ้นเหนือหัวเว็บ `fixed z-50` ได้ ต้องย้ายออกไปนอก <main>",
      );
    }
  }
  if (/className="[^"]*\bmodal-scrim\b/.test(inside)) {
    problems.push(
      `${rel}: มี element ที่ใช้คลาส modal-scrim อยู่ใน <main> — ต้องย้ายออกไปนอก <main> (ดูเหตุผลในด่านนี้)`,
    );
  }
}

// ── กฎ 4 · ตรวจ HTML ที่ build จริง — **ทุกหน้า ไม่ใช่แค่หน้าแรก** ─────────
/*
 * 📈 ขยายขอบเขตจากหน้าแรกอย่างเดียว → ทั้งเว็บ
 * ---------------------------------------------------------------------------
 * ตอนเขียนด่านนี้รอบแรก (PR #416) ตรวจแค่ `.next/server/app/index.html`
 * เพราะบั๊กสามข้อที่เพิ่งแก้อยู่บนหน้าแรกทั้งหมด
 *
 * แต่ผลคือ **อีกกว่า 300 หน้าที่เหลือไม่มีด่านตรวจ landmark หรือลำดับหัวข้อเลย**
 * ซึ่งเป็นช่องว่างแบบเดียวกับที่ทำให้สามข้อนั้นหลุดมาได้ตั้งแต่แรก
 *
 * ⚠️ **ต้องกรองหน้าที่ React สตรีมออกก่อนเสมอ** (บทเรียนเดียวกับด่าน INC-0136 ข้อ 7.2)
 * หน้าที่สตรีมเขียนเนื้อหาจริงไว้ใน `<div hidden id="S:n">` ท้ายไฟล์ แล้วให้สคริปต์
 * `$RC` ย้ายเข้าที่ตอนรัน — **ลำดับไบต์ในไฟล์จึงไม่ใช่ลำดับที่ผู้ใช้เห็น**
 * ถ้าไม่กรองจะได้ false positive มหาศาลทันที
 *
 * ⚠️ หน้าที่มี `<h1>` มากกว่าหนึ่งอันไม่ได้ผิดเสมอไปถ้ามันเป็นหน้าที่ประกอบจาก
 * หลาย template — แต่ในเว็บนี้ทุกหน้าเป็นเอกสารเดี่ยว จึงบังคับ h1 เดียวได้
 */
/* 🗺️ รากของไฟล์ HTML มาจาก `lib/rendered-pages.ts` ที่เดียว — ห้ามเขียน path เอง
   เพื่อให้วันที่เพิ่มเครื่องมือเรนเดอร์ตัวที่สอง ด่านนี้ครอบคลุมทันทีโดยไม่ต้องแก้
   (ด่าน `test-rendered-coverage.ts` บังคับข้อนี้อยู่) */
/*
 * 🔴 R-24: ของเดิมใช้ `primaryOutputDir()` ซึ่งคืนรากแรกเพียงรากเดียว (`.next/server/app`)
 * ผลจริงที่วัดได้: ด่านนี้ตรวจแค่ **8 หน้า** ทั้งที่ป้ายของมันบอกว่า "ทั้งเว็บ 309 หน้า"
 * หน้าเนื้อหา 300 กว่าหน้าที่ Astro เรนเดอร์ (`dist/`) ไม่เคยถูกตรวจเลยสักหน้า
 *
 * ตอนนี้ไล่ **ทุกรากที่ `lib/rendered-pages.ts` ประกาศไว้** ➔ ครอบคลุมทั้งสองเครื่องมือเรนเดอร์
 */
const APP_DIRS = renderedOutputDirs();
const APP_DIR = primaryOutputDir();

function collectHtml(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectHtml(full, acc);
    else if (entry.name.endsWith(".html")) acc.push(full);
  }
  return acc;
}

/** หน้าที่ React สตรีม — ลำดับไบต์ไม่ใช่ลำดับที่ผู้ใช้เห็น จึงตรวจลำดับไม่ได้ */
function isStreamed(html: string): boolean {
  return html.includes('<div hidden id="S:') || html.includes("$RC(");
}

/**
 * หน้าที่เป็น "ตัวส่งต่อ" (redirect stub) — ไม่ใช่หน้าเนื้อหาจริง
 *
 * Next.js สร้างไฟล์ HTML ให้ทุก slug สำรองใน `ARTICLE_SLUG_ALIASES` โดยข้างในมีแค่
 * `<meta http-equiv="refresh">` ชี้ไปหน้าจริง + เปลือกเว็บ (หัวเว็บ/ฟุตเตอร์)
 * มันจึง **ไม่มี `<h1>` โดยชอบธรรม** เพราะไม่มีเนื้อหาให้ตั้งหัวข้อ
 *
 * ⚠️ อย่าไปบังคับให้มี h1 — นั่นคือการแก้ด่านให้ตรงกับความเข้าใจผิด
 * ผู้ใช้อยู่กับหน้านี้ไม่ถึงวินาทีแล้วถูกพาไปหน้าจริงซึ่งมี h1 ครบอยู่แล้ว
 */
function isRedirectStub(html: string): boolean {
  return html.includes('http-equiv="refresh"');
}

const htmlFiles = APP_DIRS.flatMap((dir) => collectHtml(dir));

if (htmlFiles.length === 0) {
  /*
   * 🔴 ไม่มีไฟล์ build = **ตก** ไม่ใช่ "ข้าม"
   * ---------------------------------------------------------------------------
   * เดิมจุดนี้แค่ push ข้อความเตือนลง notes แล้วปล่อยผ่าน ผลคือบนเครื่องที่ยังไม่เคย
   * build ด่านนี้พิมพ์ "✅ ผ่าน" ทั้งที่ **ไม่ได้ตรวจกฎ 3 ใน 4 ข้อเลย**
   * ด่านที่ผ่านได้ทั้งที่ไม่ได้ตรวจ คือด่านหลอก
   */
  console.error("♿ ตรวจ a11y ระดับวิกฤตทั้งเว็บ\n");
  console.error(`❌ ไม่พบ HTML ใน ${APP_DIRS.join(" / ")} — ตรวจ HTML ที่เรนเดอร์จริงไม่ได้\n`);
  console.error("   กฎ 3 ข้อนี้ตรวจจาก HTML จริงเท่านั้น จึงยังไม่ได้ตรวจเลย:");
  console.error("     • หัวข้อแรกของหน้าเป็น h1 และไม่ข้ามลำดับ");
  console.error("     • แต่ละหน้ามี <h1> หนึ่งเดียว");
  console.error("     • <header> / <footer> อยู่นอก <main>");
  console.error("\n   ➔ รัน `npm run build` ก่อน แล้วรันด่านนี้ใหม่");
  console.error("   ➔ หรือรัน `npm run repo:verify` ซึ่ง build ให้เองอยู่แล้ว\n");
  process.exit(1);
}

let checkedPages = 0;
let orderFreeChecked = 0;
let skippedStreamed = 0;
const pageProblems: string[] = [];

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf-8");
  /* ไฟล์มาจากหลายราก — ถอดชื่อเส้นทางจากรากที่ไฟล์นั้นอยู่จริง ไม่ใช่รากแรกเสมอ */
  const ownerDir = APP_DIRS.find((dir) => file.startsWith(dir + path.sep)) ?? APP_DIR;
  const rel = path.relative(ownerDir, file).split(path.sep).join("/");

  if (isRedirectStub(html)) {
    skippedStreamed++;
    continue;
  }

  /*
   * 📊 หน้าที่ React สตรีม — ตรวจได้บางกฎ ไม่ใช่ตรวจไม่ได้เลย
   * ---------------------------------------------------------------------------
   * ตอนแรกข้ามหน้าสตรีมทั้งก้อน ผลคือตรวจได้แค่ 18 จาก 311 หน้า — **ตาบอด 94%**
   *
   * ความจริงคือ "ลำดับไบต์เชื่อไม่ได้" ไม่ได้แปลว่า "ทุกกฎเชื่อไม่ได้"
   * กฎที่ **ไม่ขึ้นกับลำดับ** ยังตรวจได้ปกติ เพราะไม่ว่า `$RC` จะย้ายชิ้นส่วนไปไว้ไหน
   * จำนวน `<h1>` ในเอกสารก็เท่าเดิม:
   *
   *   ✅ ตรวจได้ทุกหน้า  — จำนวน `<h1>` ต้องมีหนึ่งเดียว
   *   ❌ ตรวจได้เฉพาะหน้าที่ไม่สตรีม — หัวข้อแรกเป็น h1 · ไม่ข้ามลำดับ · header/footer นอก main
   *
   * ⚠️ อย่าเผลอเอากฎที่ขึ้นกับลำดับมาใส่ในบล็อกนี้ จะได้ false positive ทันที
   */
  const h1All = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1All !== 1) {
    pageProblems.push(`${rel}: มี <h1> ${h1All} อัน — ต้องมีหนึ่งเดียวเท่านั้น`);
  }
  orderFreeChecked++;

  if (isStreamed(html)) {
    skippedStreamed++;
    continue;
  }
  checkedPages++;

  const headings = [...html.matchAll(/<(h[1-6])[^>]*>/g)].map((m) => Number(m[1][1]));
  if (headings.length > 0) {
    if (headings[0] !== 1) {
      pageProblems.push(`${rel}: หัวข้อแรกของหน้าเป็น h${headings[0]} ไม่ใช่ h1 — โครงเอกสารพังทั้ง a11y และ SEO`);
    }
    for (let i = 1; i < headings.length; i++) {
      if (headings[i] - headings[i - 1] > 1) {
        pageProblems.push(`${rel}: ข้ามลำดับหัวข้อจาก h${headings[i - 1]} ไป h${headings[i]}`);
        break;
      }
    }
    const h1Count = headings.filter((h) => h === 1).length;
    if (h1Count !== 1) pageProblems.push(`${rel}: มี <h1> ${h1Count} อัน — ต้องมีหนึ่งเดียวเท่านั้น`);
  }

  const mOpen = html.indexOf("<main");
  const mClose = html.indexOf("</main>");
  for (const tag of ["<header", "<footer"]) {
    const at = html.indexOf(tag);
    if (at !== -1 && mOpen !== -1 && mClose !== -1 && at > mOpen && at < mClose) {
      pageProblems.push(`${rel}: ${tag}> อยู่ใน <main> — landmark หายไปจริงตอนเรนเดอร์`);
    }
  }
}

// จำกัดจำนวนที่พิมพ์ แต่รายงานยอดจริงเสมอ
if (pageProblems.length) {
  problems.push(
    `HTML ที่ build แล้วมีปัญหา ${pageProblems.length} จุด (ตรวจ h1 เดี่ยว ${orderFreeChecked} หน้า · ตรวจลำดับ+landmark ${checkedPages} หน้า):\n` +
      pageProblems.slice(0, 12).map((p) => `      • ${p}`).join("\n"),
  );
} else {
  notes.push(
    `HTML ที่ build แล้วผ่าน — ตรวจ "h1 เดี่ยว" ครบ ${orderFreeChecked} หน้า · ตรวจ "ลำดับหัวข้อ + landmark" ได้ ${checkedPages} หน้า (อีก ${skippedStreamed} หน้าสตรีมหรือเป็นตัวส่งต่อ ลำดับไบต์จึงเชื่อไม่ได้)`,
  );
}

console.log("♿ ตรวจ a11y ระดับวิกฤตทั้งเว็บ (สายด่วน · landmark · ลำดับหัวข้อ · หน้าต่างลอยนอก <main>)...\n");
for (const n of notes) console.log(`   ${n}`);

if (problems.length > 0) {
  console.error(`\n❌ พบปัญหา ${problems.length} จุด:\n`);
  for (const p of problems) console.error(`  • ${p}`);
  console.error("");
  process.exit(1);
}

console.log("\n✅ ผ่าน: สายด่วนวิกฤตอ่านออกบนพื้นมืด · หัวเว็บ/ฟุตเตอร์/หน้าต่างลอยอยู่นอก <main> · หัวข้อแรกเป็น h1 และไม่ข้ามลำดับ\n");
process.exit(0);
