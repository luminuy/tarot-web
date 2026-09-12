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
  "TarotEncyclopediaModal",
  "BuyCreditsModal",
  "AccessDialog",
  "BookQueueModal",
];

for (const file of walkTsx(path.join(ROOT, "src"))) {
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

// ── กฎ 4 · ตรวจ HTML ที่ build จริง (ถ้ามี) ────────────────────────────────
const indexHtmlPath = path.join(ROOT, ".next/server/app/index.html");
if (!fs.existsSync(indexHtmlPath)) {
  /*
   * 🔴 ไม่มีไฟล์ build = **ตก** ไม่ใช่ "ข้าม"
   * ---------------------------------------------------------------------------
   * เดิมจุดนี้แค่ push ข้อความเตือนลง notes แล้วปล่อยผ่าน ผลคือบนเครื่องที่ยังไม่เคย
   * build ด่านนี้พิมพ์ "✅ ผ่าน" ทั้งที่ **ไม่ได้ตรวจกฎ 3 ใน 4 ข้อเลย** (ลำดับหัวข้อ ·
   * h1 เดี่ยว · header/footer อยู่นอก <main>) — กฎพวกนี้ตรวจจาก HTML ที่เรนเดอร์จริง
   * เท่านั้น เพราะโครง JSX อ่านแล้วไม่รู้ว่าสุดท้าย DOM ออกมาหน้าตาแบบไหน
   *
   * ด่านที่ผ่านได้ทั้งที่ไม่ได้ตรวจ คือด่านหลอกแบบเดียวกับช่องว่าง G-10
   * ใน `repo:verify` ไม่มีทางเจอเคสนี้อยู่แล้ว เพราะด่านงบบันเดิล (ลำดับที่ 37)
   * สั่ง `npm run build` ให้เองเมื่อไม่พบไฟล์ผลลัพธ์ และด่านนี้อยู่ลำดับสุดท้าย
   * ที่เจอคือตอนรันด่านนี้เดี่ยว ๆ บน checkout ใหม่ ซึ่งควรบอกให้ชัดว่าต้อง build ก่อน
   */
  console.error("♿ ตรวจ a11y ระดับวิกฤตของหน้าแรก\n");
  console.error("❌ ไม่พบ .next/server/app/index.html — ตรวจ HTML ที่เรนเดอร์จริงไม่ได้\n");
  console.error("   กฎ 3 ข้อนี้ตรวจจาก HTML จริงเท่านั้น จึงยังไม่ได้ตรวจเลย:");
  console.error("     • หัวข้อแรกของหน้าเป็น h1 และไม่ข้ามลำดับ");
  console.error("     • หน้าแรกมี <h1> หนึ่งเดียว");
  console.error("     • <header> / <footer> อยู่นอก <main>");
  console.error("\n   ➔ รัน `npm run build` ก่อน แล้วรันด่านนี้ใหม่");
  console.error("   ➔ หรือรัน `npm run repo:verify` ซึ่ง build ให้เองอยู่แล้ว\n");
  process.exit(1);
} else {
  const html = fs.readFileSync(indexHtmlPath, "utf-8");

  const headings = [...html.matchAll(/<(h[1-6])[^>]*>/g)].map((m) => Number(m[1][1]));
  if (headings.length === 0) {
    problems.push("หน้าแรกไม่มีหัวข้อสักอัน");
  } else {
    if (headings[0] !== 1) {
      problems.push(`หน้าแรก: หัวข้อแรกของหน้าเป็น h${headings[0]} ไม่ใช่ h1 — โครงเอกสารพังทั้ง a11y และ SEO`);
    }
    for (let i = 1; i < headings.length; i++) {
      if (headings[i] - headings[i - 1] > 1) {
        problems.push(`หน้าแรก: ข้ามลำดับหัวข้อจาก h${headings[i - 1]} ไป h${headings[i]}`);
        break;
      }
    }
    const h1Count = headings.filter((h) => h === 1).length;
    if (h1Count !== 1) problems.push(`หน้าแรกมี <h1> ${h1Count} อัน — ต้องมีหนึ่งเดียวเท่านั้น`);
  }

  const mOpen = html.indexOf("<main");
  const mClose = html.indexOf("</main>");
  for (const tag of ["<header", "<footer"]) {
    const at = html.indexOf(tag);
    if (at !== -1 && mOpen !== -1 && mClose !== -1 && at > mOpen && at < mClose) {
      problems.push(`HTML หน้าแรก: ${tag}> อยู่ใน <main> — landmark หายไปจริงตอนเรนเดอร์`);
    }
  }
}

console.log("♿ ตรวจ a11y ระดับวิกฤตของหน้าแรก (สายด่วน · landmark · ลำดับหัวข้อ · หน้าต่างลอยนอก <main>)...\n");
for (const n of notes) console.log(`   ${n}`);

if (problems.length > 0) {
  console.error(`\n❌ พบปัญหา ${problems.length} จุด:\n`);
  for (const p of problems) console.error(`  • ${p}`);
  console.error("");
  process.exit(1);
}

console.log("\n✅ ผ่าน: สายด่วนวิกฤตอ่านออกบนพื้นมืด · หัวเว็บ/ฟุตเตอร์/หน้าต่างลอยอยู่นอก <main> · หัวข้อแรกเป็น h1 และไม่ข้ามลำดับ\n");
process.exit(0);
