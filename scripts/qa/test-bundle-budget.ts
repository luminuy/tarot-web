/**
 * QA — ด่านที่ 34: งบน้ำหนักหน้าเว็บและขนาดบันเดิล (Performance Budget Gate)
 *
 * ⚠️ ทำไมต้องมีไฟล์นี้:
 * ปัญหา P-01 (nav-links.ts ดึง DECK เข้าบันเดิลทุกหน้า) โตเงียบ ๆ มาจนถึง 126 KB gzip
 * เพราะไม่เคยมีใครคอยวัดขนาดบันเดิลจริงใน CI
 * บทเรียน (หลักการข้อ 0.8): "กฎที่ไม่มีเครื่องตรวจ คือกฎที่จะถูกละเมิดอีกแน่นอน"
 *
 * กลไก Ratchet:
 * - PR 1: ตั้งงบเท่า Baseline ปัจจุบัน (เพื่อให้ผ่าน CI และมีเครื่องวัดก่อนลงมือ)
 * - PR 2: หลังทำ P-01 ปรับงบ JS ลดลง ~150 KB gzip
 * - PR 3: หลังทำ P-02 ปรับงบ HTML ของ /cards ลดลงเหลือ <= 45 KB
 * - PR 7: ขันงบเข้าสู่เป้าหมายสุดท้าย (<= 250 KB JS / <= 45 KB HTML)
 *
 * รันด้วย: npx tsx scripts/qa/test-bundle-budget.ts
 */

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");

export interface RouteBudget {
  route: string;
  htmlRelativePath: string;
  maxJsGzipKb: number;
  maxHtmlGzipKb: number;
}

/**
 * งบประมาณน้ำหนักหน้าเว็บ (Ratchet Budget)
 * ⚠️ ปรับลดลงได้อย่างเดียว ห้ามปรับขึ้นโดยไม่มีเหตุผลกำกับ
 */
export const BUDGETS: RouteBudget[] = [
  {
    route: "/",
    htmlRelativePath: ".next/server/app/index.html",
    maxJsGzipKb: 500, // PR 1 Baseline (Current: 472 KB) -> PR 2 Target: <= 330 KB -> PR 7: <= 250 KB
    maxHtmlGzipKb: 40, // Current: 30 KB
  },
  {
    route: "/cards",
    htmlRelativePath: ".next/server/app/cards.html",
    maxJsGzipKb: 450, // PR 1 Baseline (Current: 427 KB) -> PR 2 Target: <= 270 KB -> PR 7: <= 220 KB
    maxHtmlGzipKb: 190, // PR 1 Baseline (Current: 174 KB) -> PR 3 Target: <= 45 KB
  },
  {
    route: "/cards/major-00",
    htmlRelativePath: ".next/server/app/cards/major-00.html",
    maxJsGzipKb: 450, // Current: 420 KB -> PR 2: <= 270 KB
    maxHtmlGzipKb: 35, // Current: 22 KB
  },
  {
    route: "/blog",
    htmlRelativePath: ".next/server/app/blog.html",
    maxJsGzipKb: 450, // Current: 427 KB -> PR 2: <= 270 KB
    maxHtmlGzipKb: 65, // Current: 54 KB
  },
  {
    route: "/daily",
    htmlRelativePath: ".next/server/app/daily.html",
    maxJsGzipKb: 460, // Current: 437 KB -> PR 2: <= 290 KB
    maxHtmlGzipKb: 30, // Current: 17 KB
  },
  {
    route: "/love/1-card",
    htmlRelativePath: ".next/server/app/love/1-card.html",
    maxJsGzipKb: 460, // Current: 440 KB -> PR 2: <= 290 KB
    maxHtmlGzipKb: 30, // Current: 18 KB
  },
  {
    route: "/spreads",
    htmlRelativePath: ".next/server/app/spreads.html",
    maxJsGzipKb: 450, // Current: 432 KB -> PR 2: <= 280 KB
    maxHtmlGzipKb: 45, // Current: 37 KB
  },
  {
    route: "/cards/all",
    htmlRelativePath: ".next/server/app/cards/all.html",
    maxJsGzipKb: 400, // Current: 383 KB -> PR 2: <= 250 KB
    maxHtmlGzipKb: 35, // Current: 28 KB
  },
];

function ensureBuildExists(): void {
  const sample = path.join(ROOT, ".next/server/app/index.html");
  if (!fs.existsSync(sample)) {
    console.log("📦 ไม่พบไฟล์ผลลัพธ์ build (.next/server/app) — กำลังรัน npm run build...");
    execSync("npm run build", { cwd: ROOT, stdio: "inherit" });
  }
}

export function testBundleBudget(): boolean {
  console.log("=======================================================");
  console.log("⚡ PERFORMANCE BUDGET GATE — ตรวจสอบงบน้ำหนักหน้าเว็บ");
  console.log("=======================================================");

  ensureBuildExists();

  let hasFailure = false;
  const results: {
    route: string;
    jsGzipKb: number;
    maxJsGzipKb: number;
    htmlGzipKb: number;
    maxHtmlGzipKb: number;
    jsOk: boolean;
    htmlOk: boolean;
    topChunks: { name: string; sizeKb: number }[];
  }[] = [];

  for (const b of BUDGETS) {
    const fullHtmlPath = path.join(ROOT, b.htmlRelativePath);
    if (!fs.existsSync(fullHtmlPath)) {
      console.warn(`⚠️ ไม่พบไฟล์ HTML สำหรับเส้นทาง: ${b.route} (${b.htmlRelativePath})`);
      continue;
    }

    const html = fs.readFileSync(fullHtmlPath, "utf8");
    const htmlGzipBytes = zlib.gzipSync(Buffer.from(html)).length;
    const htmlGzipKb = Math.round(htmlGzipBytes / 1024);

    const chunkMatches = html.match(/_next\/static\/chunks\/[^"'\s>]+\.js/g) || [];
    const uniqueChunks = Array.from(new Set(chunkMatches));

    let totalJsGzipBytes = 0;
    const chunkDetails: { name: string; sizeKb: number }[] = [];

    for (const chunkRef of uniqueChunks) {
      const chunkRel = chunkRef.replace(/^_next\//, "");
      const chunkFile = path.join(ROOT, ".next", chunkRel);
      if (fs.existsSync(chunkFile)) {
        const chunkContent = fs.readFileSync(chunkFile);
        const chunkGz = zlib.gzipSync(chunkContent).length;
        totalJsGzipBytes += chunkGz;
        chunkDetails.push({
          name: path.basename(chunkFile),
          sizeKb: Math.round(chunkGz / 1024),
        });
      }
    }

    chunkDetails.sort((a, b) => b.sizeKb - a.sizeKb);
    const jsGzipKb = Math.round(totalJsGzipBytes / 1024);

    const jsOk = jsGzipKb <= b.maxJsGzipKb;
    const htmlOk = htmlGzipKb <= b.maxHtmlGzipKb;

    if (!jsOk || !htmlOk) {
      hasFailure = true;
    }

    results.push({
      route: b.route,
      jsGzipKb,
      maxJsGzipKb: b.maxJsGzipKb,
      htmlGzipKb,
      maxHtmlGzipKb: b.maxHtmlGzipKb,
      jsOk,
      htmlOk,
      topChunks: chunkDetails.slice(0, 3),
    });
  }

  // Print results table
  console.log(
    "เส้นทาง".padEnd(18) +
      "JS (gzip)".padEnd(16) +
      "งบ JS".padEnd(12) +
      "HTML (gzip)".padEnd(16) +
      "งบ HTML".padEnd(12) +
      "สถานะ",
  );
  console.log("-".repeat(80));

  for (const r of results) {
    const jsText = `${r.jsGzipKb} KB`.padEnd(16);
    const maxJsText = `≤ ${r.maxJsGzipKb} KB`.padEnd(12);
    const htmlText = `${r.htmlGzipKb} KB`.padEnd(16);
    const maxHtmlText = `≤ ${r.maxHtmlGzipKb} KB`.padEnd(12);
    const status = r.jsOk && r.htmlOk ? "✅ ผ่าน" : "❌ เกินงบ";

    console.log(
      r.route.padEnd(18) + jsText + maxJsText + htmlText + maxHtmlText + status,
    );

    if (!r.jsOk) {
      console.log(`  ❌ JS เกินงบ (${r.jsGzipKb} KB > ${r.maxJsGzipKb} KB)! Chunks ใหญ่สุด 3 อันดับ:`);
      for (const c of r.topChunks) {
        console.log(`     • ${c.name}: ~${c.sizeKb} KB (gzip)`);
      }
    }
    if (!r.htmlOk) {
      console.log(`  ❌ HTML เกินงบ (${r.htmlGzipKb} KB > ${r.maxHtmlGzipKb} KB)!`);
    }
  }

  console.log("-".repeat(80));

  if (hasFailure) {
    console.error("\n❌ [Performance Budget Failed] มีหน้าเว็บที่ขนาดบันเดิลเกินงบที่กำหนด!");
    return false;
  }

  console.log("\n✨ ผ่านการตรวจสอบงบประมาณน้ำหนักหน้าเว็บทุกเส้นทาง 100%!\n");
  return true;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const ok = testBundleBudget();
  process.exit(ok ? 0 : 1);
}
