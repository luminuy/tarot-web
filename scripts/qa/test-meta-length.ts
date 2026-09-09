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
import { fileURLToPath } from "node:url";

import { BRAND_SUFFIX, TITLE_MAX, DESCRIPTION_MAX } from "../../src/lib/config/meta-length";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");
const APP_DIR = path.join(ROOT, ".next/server/app");

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

function collectHtml(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectHtml(full, acc);
    else if (entry.name.endsWith(".html")) acc.push(full);
  }
  return acc;
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

  const files = collectHtml(APP_DIR);
  if (files.length === 0) {
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

  for (const file of files) {
    const rel = path.relative(APP_DIR, file);
    if (allowed.has(rel)) continue;

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

  console.log(`\n  ตรวจแล้ว ${checked} หน้า (จาก ${files.length} ไฟล์ HTML)`);
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

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(testMetaLength() ? 0 : 1);
}
