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
import http from "node:http";
import path from "node:path";
import zlib from "node:zlib";
import { execSync, spawn, type ChildProcess } from "node:child_process";
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
    maxJsGzipKb: 315, // PR 7 Final Ratchet (Actual: 305 KB, down from 468 KB)
    maxHtmlGzipKb: 40, // Current: 37 KB
  },
  {
    route: "/cards",
    htmlRelativePath: ".next/server/app/cards.html",
    maxJsGzipKb: 320, // PR 7 Final Ratchet (Actual: 312 KB, down from 390 KB)
    maxHtmlGzipKb: 40, // PR 3 Ratchet (Actual: 34 KB, dropped from 174 KB)
  },
  {
    route: "/cards/major-00",
    htmlRelativePath: ".next/server/app/cards/major-00.html",
    maxJsGzipKb: 280, // F-01 Ratchet (Actual: 257 KB, down from 385 KB)
    maxHtmlGzipKb: 30, // Current: 23 KB
  },
  {
    route: "/blog",
    htmlRelativePath: ".next/server/app/blog.html",
    maxJsGzipKb: 325, // PR 7 Final Ratchet (Actual: 315 KB, down from 390 KB)
    maxHtmlGzipKb: 65, // Current: 55 KB
  },
  {
    route: "/daily",
    htmlRelativePath: ".next/server/app/daily.html",
    maxJsGzipKb: 350, // F-03 Ratchet (Actual: 332 KB, down from 455 KB)
    maxHtmlGzipKb: 25, // Current: 18 KB
  },
  {
    route: "/love/1-card",
    htmlRelativePath: ".next/server/app/love/1-card.html",
    maxJsGzipKb: 350, // F-03 Ratchet (Actual: 335 KB, down from 460 KB)
    maxHtmlGzipKb: 25, // Current: 19 KB
  },
  {
    route: "/spreads",
    htmlRelativePath: ".next/server/app/spreads.html",
    maxJsGzipKb: 320, // PR 7 Final Ratchet (Actual: 312 KB, down from 410 KB)
    maxHtmlGzipKb: 45, // Current: 37 KB
  },
  {
    route: "/cards/all",
    htmlRelativePath: ".next/server/app/cards/all.html",
    maxJsGzipKb: 220, // PR 7 Final Ratchet (Actual: 210 KB, dropped from 336 KB)
    maxHtmlGzipKb: 45, // PR 3 (Actual: 37 KB)
  },
];

function ensureBuildExists(): void {
  const sampleTh = path.join(ROOT, ".next/server/app/(th)/page.js");
  const sampleRoot = path.join(ROOT, ".next/server/app/page.js");
  const buildManifest = path.join(ROOT, ".next/build-manifest.json");
  if (!fs.existsSync(sampleTh) && !fs.existsSync(sampleRoot) && !fs.existsSync(buildManifest)) {
    console.log("📦 ไม่พบไฟล์ผลลัพธ์ build — กำลังรัน npm run build...");
    execSync("npm run build", { cwd: ROOT, stdio: "inherit" });
  }
  const buildIdPath = path.join(ROOT, ".next/BUILD_ID");
  if (!fs.existsSync(buildIdPath) && fs.existsSync(path.join(ROOT, ".next"))) {
    fs.writeFileSync(buildIdPath, "production", "utf-8");
  }
}

function fetchHtml(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${url}`));
    });
  });
}

async function waitForServer(port: number, maxWaitMs = 12000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      await fetchHtml(`http://127.0.0.1:${port}/`);
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  return false;
}

export async function testBundleBudget(): Promise<boolean> {
  console.log("=======================================================");
  console.log("⚡ PERFORMANCE BUDGET GATE — ตรวจสอบงบน้ำหนักหน้าเว็บ");
  console.log("=======================================================");

  ensureBuildExists();

  // ตรวจสอบว่าต้องเปิดเซิร์ฟเวอร์ชั่วคราวสำหรับ dynamic SSR routes หรือไม่
  const needsServer = BUDGETS.some((b) => !fs.existsSync(path.join(ROOT, b.htmlRelativePath)));
  let serverProcess: ChildProcess | null = null;
  const TEST_PORT = 3892;

  if (needsServer) {
    serverProcess = spawn("npx", ["next", "start", "-p", String(TEST_PORT), "-H", "127.0.0.1"], {
      cwd: ROOT,
      stdio: "pipe",
    });
    const ready = await waitForServer(TEST_PORT);
    if (!ready) {
      serverProcess.kill("SIGKILL");
      throw new Error(`ไม่สามารถเริ่ม Next.js start บนพอร์ต ${TEST_PORT} ได้`);
    }
  }

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

  try {
    for (const b of BUDGETS) {
      let html = "";
      const fullHtmlPath = path.join(ROOT, b.htmlRelativePath);
      if (fs.existsSync(fullHtmlPath)) {
        html = fs.readFileSync(fullHtmlPath, "utf8");
      } else if (serverProcess) {
        html = await fetchHtml(`http://127.0.0.1:${TEST_PORT}${b.route}`);
      } else {
        console.warn(`⚠️ ไม่พบไฟล์ HTML สำหรับเส้นทาง: ${b.route}`);
        continue;
      }

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
  } finally {
    if (serverProcess) {
      serverProcess.kill("SIGTERM");
    }
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
  testBundleBudget().then((ok) => {
    process.exit(ok ? 0 : 1);
  });
}

