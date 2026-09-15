/**
 * QA — ด่านที่ 41: ความยาว title / description ของทุกหน้าที่ build ออกมาจริง
 *
 * ⚠️ ทำไมต้องมีไฟล์นี้:
 * ตรวจ production 2026-09-09 พบว่า 226 จาก 299 หน้ามี title ยาวเกินที่ Google แสดงได้
 * และ 180 หน้ามี description ยาวเกิน · หนักสุดคือหน้าผังอังกฤษ title 118 ตัวอักษร
 * (ชื่อผังมี "(10 Cards)" อยู่แล้ว แต่เทมเพลตต่อ "Tarot Spread: 10-Card Layout…" ซ้ำอีก)
 * และ description 326 ตัวอักษร — คนที่เห็นใน SERP อ่านได้ไม่ถึงครึ่ง
 *
 * ต้นเหตุคือ "ไม่มีใครวัดผลลัพธ์สุดท้ายเลยสักที่" เทมเพลตต่อข้อความกันไปเรื่อย ๆ
 * ทั้งที่ layout ยังเติมท้าย " · SeerTarot" ให้อีก 12 ตัวอักษรโดยไม่มีใครนับรวม
 * (หลักการข้อ 0.8: "กฎที่ไม่มีเครื่องตรวจ คือกฎที่จะถูกละเมิดอีกแน่นอน")
 *
 * ด่านนี้ไม่เชื่อโค้ด — อ่าน HTML ที่ build ออกมาจริงทุกไฟล์ แล้ววัดของจริง
 *
 * รันด้วย: npx tsx scripts/qa/test-meta-length.ts
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { BRAND_SUFFIX, TITLE_MAX, DESCRIPTION_MAX } from "../../src/lib/config/meta-length";
import { collectRenderedPages, primaryOutputDir } from "./lib/rendered-pages";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");
/* 🗺️ รากของไฟล์ HTML มาจาก `lib/rendered-pages.ts` ที่เดียว — ห้ามเขียน path เอง
   เพื่อให้วันที่เพิ่มเครื่องมือเรนเดอร์ตัวที่สอง ด่านนี้ครอบคลุมทันทีโดยไม่ต้องแก้
   (ด่าน `test-rendered-coverage.ts` บังคับข้อนี้อยู่) */
const APP_DIR = primaryOutputDir();

/** เผื่อระยะหายใจให้ description ที่ต่อท้ายด้วยข้อมูลจริงของแต่ละหน้า (เช่นชื่อไพ่ยาว) */
const DESCRIPTION_HARD_MAX = DESCRIPTION_MAX + 5;

/**
 * หน้าที่ยกเว้นได้ พร้อมเหตุผล — ต้องระบุเหตุผลเสมอ ห้ามใส่ไว้เฉย ๆ เพื่อให้ด่านผ่าน
 * (ตอนนี้ว่าง: ทุกหน้าที่ผู้ใช้เปิดได้ต้องอยู่ในเพดาน)
 */
const ALLOW: { file: string; reason: string }[] = [
  {
    file: "_global-error.html",
    reason:
      "หน้า error boundary ชั้นนอกสุดของ Next เอง — ไม่ใช่ route ที่ผู้ใช้เปิดได้และไม่ถูก index " +
      "จึงไม่มี metadata ให้วัด (ตรวจแล้วว่าเป็นไฟล์ที่ Next สร้างเอง ไม่ใช่หน้าที่เราลืมใส่)",
  },
];

function ensureBuildExists(): void {
  const buildManifest = path.join(ROOT, ".next/build-manifest.json");
  if (!fs.existsSync(APP_DIR) || !fs.existsSync(buildManifest)) {
    console.log("📦 ไม่พบไฟล์ผลลัพธ์ build — กำลังรัน npm run build...");
    execSync("npm run build", { cwd: ROOT, stdio: "inherit" });
  }
}


/** คืนข้อความที่ผู้ใช้เห็นจริง — HTML entity ต้องถูกถอดก่อนนับ ("&amp;" คือ 1 ตัวอักษร ไม่ใช่ 5) */
function decodeEntities(raw: string): string {
  return raw
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extract(html: string): { title: string | null; description: string | null } {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const descMatch =
    html.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i) ||
    html.match(/<meta[^>]+content="([^"]*)"[^>]+name="description"/i);
  return {
    title: titleMatch ? decodeEntities(titleMatch[1]) : null,
    description: descMatch ? decodeEntities(descMatch[1]) : null,
  };
}

export function testMetaLength(): boolean {
  console.log("=======================================================");
  console.log("📏 META LENGTH GATE — ความยาว title / description ทุกหน้า");
  console.log("=======================================================");

  ensureBuildExists();

  /*
   * ⚠️ ต้องอ่านจาก **ทุกเครื่องมือเรนเดอร์** ไม่ใช่แค่รากแรก
   * ของเดิมใช้ `primaryOutputDir()` ตัวเดียว ซึ่งคือของ Next — ตั้งแต่หน้าเนื้อหา
   * 297 หน้าย้ายไป Astro ด่านนี้จึงเลิกตรวจหน้าเหล่านั้นไปเงียบ ๆ ทั้งที่เป็น
   * หน้าที่คนมาจากผลค้นหาลงจริงเกือบทั้งหมด (ปัญหาเดียวกับ INC-0165 ของด่านงบน้ำหนัก)
   */
  const pages = collectRenderedPages();
  if (pages.length === 0) {
    console.error("❌ ไม่พบไฟล์ HTML ที่ build ออกมาเลย — ด่านนี้ตรวจอะไรไม่ได้");
    return false;
  }

  const allowed = new Set(ALLOW.map((a) => a.file));
  const longTitles: string[] = [];
  const longDescriptions: string[] = [];
  const missing: string[] = [];
  const doubleBrand: string[] = [];
  let checked = 0;
  let worstTitle = 0;
  let worstDescription = 0;

  for (const page of pages) {
    const file = page.file;
    /* ชื่อที่ใช้รายงานและเทียบกับรายการยกเว้น — ใช้ path แบบเดิมเพื่อไม่ให้ ALLOW เดิมเพี้ยน */
    const rel = path.relative(page.renderer === "next" ? APP_DIR : ROOT, file);
    if (allowed.has(rel) || allowed.has(path.basename(rel))) continue;

    const { title, description } = extract(fs.readFileSync(file, "utf-8"));
    checked++;

    if (!title) {
      missing.push(`${rel} — ไม่มี <title>`);
    } else {
      // วัดเฉพาะใจความที่หน้าเขียนเอง — ท้ายแบรนด์ที่ layout เติมให้ถูกตัดใน SERP ได้ ไม่เสียหาย
      const body = title.endsWith(BRAND_SUFFIX) ? title.slice(0, -BRAND_SUFFIX.length) : title;
      worstTitle = Math.max(worstTitle, body.length);
      if (body.length > TITLE_MAX) longTitles.push(`${rel} — ${body.length} ตัวอักษร: "${body}"`);
      // "| SeerTarot" ที่เขียนมือ + " · SeerTarot" ที่ layout เติมให้ = แบรนด์โผล่สองรอบ
      if ((title.match(/SeerTarot/g) || []).length > 1) doubleBrand.push(`${rel} — "${title}"`);
    }

    if (!description) {
      missing.push(`${rel} — ไม่มี meta description`);
    } else {
      worstDescription = Math.max(worstDescription, description.length);
      if (description.length > DESCRIPTION_HARD_MAX) {
        longDescriptions.push(`${rel} — ${description.length} ตัวอักษร: "${description.slice(0, 90)}…"`);
      }
    }
  }

  console.log(`\n  ตรวจแล้ว ${checked} หน้า (จาก ${pages.length} ไฟล์ HTML)`);
  console.log(`  เพดาน: title ≤ ${TITLE_MAX} · description ≤ ${DESCRIPTION_HARD_MAX}`);
  console.log(`  ยาวสุดที่วัดได้: title ${worstTitle} · description ${worstDescription}`);

  const report = (label: string, items: string[]): void => {
    if (items.length === 0) {
      console.log(`  ✅ ${label}: 0`);
      return;
    }
    console.error(`\n  ❌ ${label}: ${items.length}`);
    for (const item of items.slice(0, 12)) console.error(`     - ${item}`);
    if (items.length > 12) console.error(`     … อีก ${items.length - 12} หน้า`);
  };

  report("title ยาวเกินเพดาน", longTitles);
  report("description ยาวเกินเพดาน", longDescriptions);
  report("ไม่มี title / description", missing);
  report("ชื่อแบรนด์ซ้ำสองรอบใน title", doubleBrand);

  const failed = longTitles.length + longDescriptions.length + missing.length + doubleBrand.length;
  if (failed > 0) {
    console.error(`\n❌ ไม่ผ่าน — ${failed} รายการ`);
    console.error("   วิธีแก้: สร้าง title ด้วย pickTitle() และ description ด้วย clampDescription()");
    console.error("   จาก src/lib/config/meta-length.ts (อย่าต่อสตริงเองแล้วเดาความยาว)\n");
    return false;
  }

  console.log("\n✨ ผ่าน — ทุกหน้าอยู่ในเพดานที่ Google แสดงได้ครบ\n");
  return true;
}

/*
 * ⚠️ ห้ามเทียบด้วย `file://${process.argv[1]}` เด็ดขาด — ต้องผ่าน `pathToFileURL()` เสมอ
 * ---------------------------------------------------------------------------
 * `import.meta.url` เข้ารหัสอักขระที่ไม่ใช่ ASCII เป็น percent-encoding
 * ส่วน `process.argv[1]` เป็น path ดิบ · บนเครื่องที่ path ของโปรเจกต์มีภาษาไทย
 * (เช่นโฟลเดอร์ `เว็บไพ่` ของเจ้าของ) สองค่านี้ **ไม่มีวันเท่ากัน**
 * ➔ ด่านนี้จึงไม่ทำงานเลยสักบรรทัดเมื่อรันบนเครื่อง dev และเงียบสนิท (exit 0 ทุกครั้ง)
 * แต่ทำงานปกติบน CI ซึ่ง path เป็น ASCII ล้วน — เป็นด่านที่ "ผ่านบนเครื่องแต่ตกที่ CI"
 * แบบที่หาสาเหตุยากที่สุด (เจอจริง 2026-09-15 · ดู INCIDENT_LOG)
 */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(testMetaLength() ? 0 : 1);
}
