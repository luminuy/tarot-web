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
 * เกณฑ์ตัดสินใช้ขนาด JS ที่ผู้ใช้จริงโหลด (ไม่นับ polyfills ที่ติด noModule)
 */
export const BUDGETS: RouteBudget[] = [
  {
    route: "/",
    htmlRelativePath: ".next/server/app/index.html",
    /*
     * Motion Shell Diet 2026-09-09: ถอด `motion` ออกจาก **เปลือก** ของหน้าแรกทั้งหมด
     * (`TarotFlow` · `SpreadCardSelector` · `ToastNotification` · `lib/motion`)
     * ไลบรารีย้ายไปอยู่หลัง `next/dynamic` ครบทุกตัวผ่าน `withMotionScope()`
     * วัดจริง 267 → **227 KB** (−40 KB) · รวม polyfill 306 → 266 KB
     */
    maxJsGzipKb: 232,
    /*
     * ⚠️ ปรับขึ้น 40 → 42 KB เมื่อ 2026-09-11 พร้อมเหตุผลที่วัดมาแล้ว (AVIF Rollout)
     *
     * หน้าแรกมีภาพไพ่ราว 100 ใบ (ไพ่ประจำวัน · การ์ดทำนายด่วน · ภาพตัวอย่างผัง 25 แบบ)
     * การเพิ่ม `<source type="image/avif">` ทำให้ HTML โตขึ้น **+3 KB gzip** (38 → 41 KB)
     * แต่ซื้อภาพที่เบาลง **13–45% ต่อใบ** กลับมา — วัดจริงที่หน้า `/cards`
     * ประหยัดได้ **~832 KB ต่อการเปิดหน้าหนึ่งครั้ง** (2,725 → 1,893 KB)
     *
     * คิดเป็นผลตอบแทนราว 100–300 เท่าของไบต์ HTML ที่จ่ายเพิ่ม จึงยอมขยับเพดาน
     * ⚠️ นี่คือ**การขยับเพดานครั้งเดียวที่มีเหตุผลกำกับ** ห้ามใช้เป็นบรรทัดฐานขยับซ้ำ
     *    ถ้ารอบหน้าชนเพดานอีก ให้ไปลดของจริงก่อนเสมอ
     */
    maxHtmlGzipKb: 42, // Current: 41 KB (38 KB ก่อนเปิด AVIF)
  },
  {
    /*
     * หน้าแรกภาษาอังกฤษ — เนื้อเดียวกับ `/` เป๊ะ ๆ (ใช้ `HomePageBody` ตัวเดียวกัน)
     *
     * ⚠️ เพิ่มเข้ามาเพราะ **ไม่เคยมีด่านคุมเลย** ทั้งที่หนักเท่า `/` ทุกไบต์
     * และเป็นหนึ่งในสองหน้าที่หนักที่สุดของเว็บมาตลอด · ถ้าคุมแต่ `/` การถอยหลัง
     * ฝั่งอังกฤษจะหลุดออก production ไปเงียบ ๆ โดยไม่มีด่านไหนเห็น
     */
    route: "/en",
    htmlRelativePath: ".next/server/app/en.html",
    maxJsGzipKb: 232,
    maxHtmlGzipKb: 40,
  },
  {
    route: "/cards",
    htmlRelativePath: ".next/server/app/cards.html",
    // Motion Diet Ratchet 2026-09-07: ถอด motion (39.9 KB gz) ออกจากหน้านี้ · วัดจริง 178 KB
    maxJsGzipKb: 190,
    maxHtmlGzipKb: 40, // Current: 35 KB
  },
  {
    route: "/cards/major-00",
    htmlRelativePath: ".next/server/app/cards/major-00.html",
    // Motion Diet Ratchet 2026-09-07: ถอด motion ออกจากหน้าไพ่ทั้ง 156 หน้า · วัดจริง 187 KB
    maxJsGzipKb: 198,
    maxHtmlGzipKb: 30, // Current: 23 KB
  },
  {
    route: "/blog",
    htmlRelativePath: ".next/server/app/blog.html",
    maxJsGzipKb: 180, // W-01/W-02 Ratchet (Actual Real User: 171 KB, total w/ polyfills: 210 KB)
    maxHtmlGzipKb: 65, // Current: 35 KB
  },
  {
    route: "/daily",
    htmlRelativePath: ".next/server/app/daily.html",
    maxJsGzipKb: 198, // รัดหลังถอด motion ออกจากไพ่+พิธีไพ่ใบเดียว (วัดจริง 194 KB · รวม polyfill 232 KB)
    maxHtmlGzipKb: 25, // Current: 18 KB
  },
  {
    route: "/love/1-card",
    htmlRelativePath: ".next/server/app/love/1-card.html",
    maxJsGzipKb: 201, // รัดหลังถอด motion ออกจากไพ่+พิธีไพ่ใบเดียว (วัดจริง 197 KB · รวม polyfill 236 KB)
    maxHtmlGzipKb: 25, // Current: 19 KB
  },
  {
    route: "/spreads",
    htmlRelativePath: ".next/server/app/spreads.html",
    // รัดหลังแยกฟังก์ชันช่วยออกจากข้อมูลผัง 85 KB (วัดจริง 171 KB · เดิม 188 KB)
    maxJsGzipKb: 175,
    maxHtmlGzipKb: 45, // Current: 42 KB
  },
  {
    /*
     * หน้าคู่มือผังรายผัง — ตัวแทนของ 54 หน้า (`/spreads/*` และ `/en/spreads/*`)
     *
     * ⚠️ เพิ่มเข้ามาเพราะ **ไม่เคยมีด่านคุมกลุ่มนี้เลย** ทั้งที่เป็นกลุ่มหน้าที่ใหญ่ที่สุด
     * รองจากหน้าไพ่รายใบ · ข้อมูลผังทั้ง 85 KB เคยรั่วเข้าบันเดิลของทั้ง 54 หน้านี้
     * (17.2 KB gzip ต่อหน้า) โดยไม่มีใครเห็น เพราะด่านวัดแต่ `/spreads` ซึ่งเป็นหน้ารวม
     * คนละเส้นทางกับหน้ารายผัง
     */
    route: "/spreads/celtic-cross",
    htmlRelativePath: ".next/server/app/spreads/celtic-cross.html",
    maxJsGzipKb: 175,
    maxHtmlGzipKb: 30,
  },
  {
    route: "/cards/all",
    htmlRelativePath: ".next/server/app/cards/all.html",
    maxJsGzipKb: 178, // W-01/W-02 Ratchet (Actual Real User: 173 KB, total w/ polyfills: 212 KB)
    maxHtmlGzipKb: 45, // Current: 38 KB
  },
  {
    route: "/cards/birth-card",
    htmlRelativePath: ".next/server/app/cards/birth-card.html",
    maxJsGzipKb: 190, // W-03 Ratchet (Actual Real User: 182 KB, target was <= 200 KB)
    /**
     * ⚠️ ตัวเลขในคอมเมนต์เดิมเขียนว่า "Current: 15 KB" ซึ่ง **ไม่ตรงกับของจริงมานานแล้ว**
     * วัดจริงตอนตั้งงบใหม่นี้ = 30.5 KB (ดิบ 97 KB · flight payload ของ RSC กินไป 49 KB
     * เพราะหน้านี้เรนเดอร์ตารางไพ่ประจำตัวตามวันเกิดทั้งชุดออกมาเป็นเนื้อหาฝั่งเซิร์ฟเวอร์)
     *
     * หน้านี้จึงนั่งชนเพดาน 30 KB พอดีเป๊ะมาสักพัก และล้มทันทีที่มีอะไรเพิ่มเข้ามาแม้แต่ 1 KB
     * (เกิดขึ้นจริงหลัง PR #351 — deploy ของ main ล้มด้วย "31 KB > 30 KB")
     * ค่าที่วัดได้ต่างกันเล็กน้อยระหว่างเครื่อง dev กับ CI ด้วย เพราะความยาวของค่า env จริง
     * (GA id / pixel id / ImageKit endpoint) ที่ถูกฝังลงไปไม่เท่ากัน
     *
     * ✅ หนี้ก้อนนั้นถูกใช้คืนแล้วใน PR #354 (INC-0103):
     * หน้านี้ส่ง `keywords` + `keywordsEn` ของไพ่ชุดใหญ่ 22 ใบ (12 KB ดิบ) เป็น prop
     * ให้ client component `BirthCardCalculator` ทั้งที่คอมโพเนนต์ไม่เคยเรียกใช้เลย
     * ตัดออกแล้ววัดจริงได้ 26 KB ➔ จึงรัดเพดานกลับลงจาก 34 KB เหลือ 29 KB
     * (เผื่อระยะหายใจ 3 KB สำหรับความต่างระหว่างเครื่อง dev กับ CI ตามที่อธิบายไว้ข้างบน)
     */
    maxHtmlGzipKb: 29, // วัดจริง 2026-09-07 หลังตัด keywords ที่ไม่มีใครใช้: 26 KB
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
    totalJsGzipKb: number;
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

      let realJsGzipBytes = 0;
      let totalJsGzipBytes = 0;
      const chunkDetails: { name: string; sizeKb: number; isPolyfill: boolean }[] = [];

      for (const chunkRef of uniqueChunks) {
        const chunkRel = chunkRef.replace(/^_next\//, "");
        const chunkFile = path.join(ROOT, ".next", chunkRel);
        if (fs.existsSync(chunkFile)) {
          const chunkContent = fs.readFileSync(chunkFile);
          const chunkGz = zlib.gzipSync(chunkContent).length;
          const isPolyfill = path.basename(chunkFile).startsWith("polyfills");
          totalJsGzipBytes += chunkGz;
          if (!isPolyfill) {
            realJsGzipBytes += chunkGz;
          }
          chunkDetails.push({
            name: path.basename(chunkFile),
            sizeKb: Math.round(chunkGz / 1024),
            isPolyfill,
          });
        }
      }

      chunkDetails.sort((a, b) => b.sizeKb - a.sizeKb);
      const jsGzipKb = Math.round(realJsGzipBytes / 1024);
      const totalJsGzipKb = Math.round(totalJsGzipBytes / 1024);

      const jsOk = jsGzipKb <= b.maxJsGzipKb;
      const htmlOk = htmlGzipKb <= b.maxHtmlGzipKb;

      if (!jsOk || !htmlOk) {
        hasFailure = true;
      }

      results.push({
        route: b.route,
        jsGzipKb,
        totalJsGzipKb,
        maxJsGzipKb: b.maxJsGzipKb,
        htmlGzipKb,
        maxHtmlGzipKb: b.maxHtmlGzipKb,
        jsOk,
        htmlOk,
        topChunks: chunkDetails.filter((c) => !c.isPolyfill).slice(0, 3),
      });
    }
  } finally {
    if (serverProcess) {
      serverProcess.kill("SIGTERM");
    }
  }

  // Print results table
  console.log(
    "เส้นทาง".padEnd(16) +
      "JS จริง (รวม polyfill)".padEnd(26) +
      "งบ JS".padEnd(12) +
      "HTML (gzip)".padEnd(14) +
      "งบ HTML".padEnd(12) +
      "สถานะ",
  );
  console.log("-".repeat(88));

  for (const r of results) {
    const jsText = `${r.jsGzipKb} KB (${r.totalJsGzipKb} KB)`.padEnd(26);
    const maxJsText = `≤ ${r.maxJsGzipKb} KB`.padEnd(12);
    const htmlText = `${r.htmlGzipKb} KB`.padEnd(14);
    const maxHtmlText = `≤ ${r.maxHtmlGzipKb} KB`.padEnd(12);
    const status = r.jsOk && r.htmlOk ? "✅ ผ่าน" : "❌ เกินงบ";

    console.log(
      r.route.padEnd(16) + jsText + maxJsText + htmlText + maxHtmlText + status,
    );

    if (!r.jsOk) {
      console.log(`  ❌ JS เกินงบ (${r.jsGzipKb} KB ผู้ใช้จริง > ${r.maxJsGzipKb} KB)! Chunks ใหญ่สุด 3 อันดับ:`);
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

