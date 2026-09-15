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
import { normalizeRoute, primaryOutputDir, renderedRouteMap } from "./lib/rendered-pages";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");

export interface RouteBudget {
  route: string;
  maxJsGzipKb: number;
  maxHtmlGzipKb: number;
}

/**
 * งบประมาณน้ำหนักหน้าเว็บ (Ratchet Budget)
 * ⚠️ ปรับลดลงได้อย่างเดียว ห้ามปรับขึ้นโดยไม่มีเหตุผลกำกับ
 * เกณฑ์ตัดสินใช้ขนาด JS ที่ผู้ใช้จริงโหลด (ไม่นับ polyfills ที่ติด noModule)
 */
/*
 * ⚠️ ตัวเลขงบของเส้นทางที่เรนเดอร์ด้วย Astro ตั้งจาก **ค่าที่ CI วัดได้** ไม่ใช่ค่าบนเครื่อง dev
 * ---------------------------------------------------------------------------
 * รีโปนี้ **ไม่มี lockfile** โดยตั้งใจ (CI รัน `pnpm install --no-frozen-lockfile`)
 * CI จึงติดตั้ง dependency รุ่นใหม่กว่าที่เครื่อง dev มีอยู่ได้เสมอ — วัดจริงเมื่อ 2026-09-15:
 * เครื่อง dev ได้ `/cards` = 112 KB แต่ CI ได้ **121 KB** จากโค้ดชุดเดียวกันเป๊ะ
 * (ต่างกันที่ react/react-dom ซึ่งประกาศเป็น `^19.2.8` — CI หยิบรุ่นใหม่กว่ามาใช้)
 *
 * ➔ ตั้งงบจากค่าที่ CI วัดได้ + ระยะหายใจราว 10% เสมอ · ห้ามตั้งจากค่าบนเครื่องตัวเอง
 *   ไม่งั้น PR จะผ่านบนเครื่องแล้วไปตกที่ CI ทุกครั้ง (เกิดขึ้นจริงกับ PR #484)
 */
export const BUDGETS: RouteBudget[] = [
  {
    route: "/",
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
    maxJsGzipKb: 232,
    maxHtmlGzipKb: 40,
  },
  {
    route: "/cards",
    /*
     * 🪶 ย้ายมาเรนเดอร์ด้วย Astro แล้ว (2026-09-15) — รัดเพดานลงตามของจริงทันที
     * ไม่มี React runtime + router + เพย์โหลด RSC ติดมากับทุกหน้าอีกต่อไป
     * เหลือเฉพาะ island ที่ต้องโต้ตอบจริง และทั้งหมดโหลดแบบ `client:idle`
     * (หัวเว็บ · เครื่องมือวัดผล · ช่องค้นหาไพ่)
     *
     * ⚠️ ตัวเลขนี้คือ "ของจริงที่วัดได้ + ระยะหายใจราว 10%" ตามหลัก ratchet ของบ้านนี้
     *    ห้ามขยับขึ้นเพื่อให้ผ่าน ให้ไปลดของจริงก่อนเสมอ
     */
    maxJsGzipKb: 133, // CI วัดได้ 121 KB + ระยะหายใจ 10%
    maxHtmlGzipKb: 28, // วัดจริง 2026-09-15: 23 KB
  },
  {
    route: "/cards/major-00",
    /*
     * 🪶 ย้ายมาเรนเดอร์ด้วย Astro แล้ว (2026-09-15) — รัดเพดานลงตามของจริงทันที
     * ไม่มี React runtime + router + เพย์โหลด RSC ติดมากับทุกหน้าอีกต่อไป
     * เหลือเฉพาะ island ที่ต้องโต้ตอบจริง และทั้งหมดโหลดแบบ `client:idle`
     * (หัวเว็บ · เครื่องมือวัดผล · ปุ่มสลับหัวตั้ง/หัวกลับ)
     *
     * ⚠️ ตัวเลขนี้คือ "ของจริงที่วัดได้ + ระยะหายใจราว 10%" ตามหลัก ratchet ของบ้านนี้
     *    ห้ามขยับขึ้นเพื่อให้ผ่าน ให้ไปลดของจริงก่อนเสมอ
     */
    maxJsGzipKb: 119, // CI วัดได้ 108 KB + ระยะหายใจ 10%
    maxHtmlGzipKb: 22, // วัดจริง 2026-09-15: 17 KB
  },
  {
    route: "/blog",
    /*
     * 🪶 ย้ายมาเรนเดอร์ด้วย Astro แล้ว (คลื่นที่ 2 · 2026-09-15) — รัดเพดานลงตามของจริงทันที
     * ไม่มี React runtime + router + เพย์โหลด RSC ติดมากับทุกหน้าอีกต่อไป
     * เหลือเฉพาะ island ที่ต้องโต้ตอบจริง (ช่องค้นหาและตัวกรองหมวดบทความ) และโหลดแบบ `client:idle`
     *
     * ⚠️ ตัวเลขนี้คือ "ของจริงที่วัดได้ + ระยะหายใจราว 10%" ตามหลัก ratchet ของบ้านนี้
     *    ห้ามขยับขึ้นเพื่อให้ผ่าน ให้ไปลดของจริงก่อนเสมอ
     */
    /*
     * 📌 หน้านี้คือหน้าที่ TBT แย่ที่สุดของเว็บมาตลอด (660 ms · ISSUE-043)
     * หลังย้าย: HTML 35 ➔ 23 KB และ JS 174 ➔ 143 KB — **ต้องยิง Lighthouse วัดซ้ำ
     * แล้วบันทึกผลลง KNOWN_ISSUES ก่อนปิดเคส** ห้ามสรุปเองว่าหายจากตัวเลขสองตัวนี้
     */
    maxJsGzipKb: 158, // CI วัดได้ ~152 KB (dev 143 KB) + ระยะหายใจ 10%
    maxHtmlGzipKb: 30, // วัดจริง 2026-09-15: 23 KB
  },
  {
    route: "/daily",
    /*
     * 🪶 ย้ายมาเรนเดอร์ด้วย Astro แล้ว (คลื่นที่ 4b · 2026-09-15) — พิธีเปิดไพ่เป็น island
     * ส่วนเนื้อหา SEO ยาว ๆ ท้ายหน้าเป็น HTML ล้วนที่ไม่ต้อง hydrate เลย
     * ⚠️ ตั้งงบจากค่าที่ CI วัดได้ + ระยะหายใจ 10% เสมอ (ดูคำเตือนเหนือตารางนี้)
     */
    maxJsGzipKb: 145, // dev 122 KB · เผื่อส่วนต่าง CI ~9 KB
    maxHtmlGzipKb: 22, // วัดจริง 2026-09-15: 15 KB
  },
  {
    route: "/love/1-card",
    /*
     * 🪶 ย้ายมาเรนเดอร์ด้วย Astro แล้ว (คลื่นที่ 4b · 2026-09-15) — พิธีเปิดไพ่เป็น island
     * ส่วนเนื้อหา SEO ยาว ๆ ท้ายหน้าเป็น HTML ล้วนที่ไม่ต้อง hydrate เลย
     * ⚠️ ตั้งงบจากค่าที่ CI วัดได้ + ระยะหายใจ 10% เสมอ (ดูคำเตือนเหนือตารางนี้)
     */
    maxJsGzipKb: 145, // dev 122 KB · เผื่อส่วนต่าง CI ~9 KB
    maxHtmlGzipKb: 22, // วัดจริง 2026-09-15: 15 KB
  },
  {
    route: "/spreads",
    /*
     * 🪶 ย้ายมาเรนเดอร์ด้วย Astro แล้ว (คลื่นที่ 2 · 2026-09-15) — รัดเพดานลงตามของจริงทันที
     * ไม่มี React runtime + router + เพย์โหลด RSC ติดมากับทุกหน้าอีกต่อไป
     * เหลือเฉพาะ island ที่ต้องโต้ตอบจริง (แท็บกรองหมวดผัง) และโหลดแบบ `client:idle`
     *
     * ⚠️ ตัวเลขนี้คือ "ของจริงที่วัดได้ + ระยะหายใจราว 10%" ตามหลัก ratchet ของบ้านนี้
     *    ห้ามขยับขึ้นเพื่อให้ผ่าน ให้ไปลดของจริงก่อนเสมอ
     */
    maxJsGzipKb: 136, // CI วัดได้ ~124 KB (dev 115 KB) + ระยะหายใจ 10%
    maxHtmlGzipKb: 26, // วัดจริง 2026-09-15: 20 KB
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
    /*
     * 🪶 ย้ายมาเรนเดอร์ด้วย Astro แล้ว (คลื่นที่ 2 · 2026-09-15) — รัดเพดานลงตามของจริงทันที
     * ไม่มี React runtime + router + เพย์โหลด RSC ติดมากับทุกหน้าอีกต่อไป
     * เหลือเฉพาะ island ที่ต้องโต้ตอบจริง (แผงรายละเอียดตำแหน่งไพ่) และโหลดแบบ `client:idle`
     *
     * ⚠️ ตัวเลขนี้คือ "ของจริงที่วัดได้ + ระยะหายใจราว 10%" ตามหลัก ratchet ของบ้านนี้
     *    ห้ามขยับขึ้นเพื่อให้ผ่าน ให้ไปลดของจริงก่อนเสมอ
     */
    maxJsGzipKb: 136, // CI วัดได้ ~124 KB (dev 115 KB) + ระยะหายใจ 10%
    maxHtmlGzipKb: 28, // วัดจริง 2026-09-15: 22 KB
  },
  {
    route: "/cards/all",
    /*
     * 🪶 ย้ายมาเรนเดอร์ด้วย Astro แล้ว (2026-09-15) — รัดเพดานลงตามของจริงทันที
     * ไม่มี React runtime + router + เพย์โหลด RSC ติดมากับทุกหน้าอีกต่อไป
     * เหลือเฉพาะ island ที่ต้องโต้ตอบจริง และทั้งหมดโหลดแบบ `client:idle`
     * (หัวเว็บ · เครื่องมือวัดผล · ตารางค้นหา 78 ใบ)
     *
     * ⚠️ ตัวเลขนี้คือ "ของจริงที่วัดได้ + ระยะหายใจราว 10%" ตามหลัก ratchet ของบ้านนี้
     *    ห้ามขยับขึ้นเพื่อให้ผ่าน ให้ไปลดของจริงก่อนเสมอ
     */
    maxJsGzipKb: 127, // CI วัดได้ 116 KB + ระยะหายใจ 10%
    maxHtmlGzipKb: 32, // วัดจริง 2026-09-15: 27 KB
  },
  {
    route: "/cards/birth-card",
    /*
     * 🪶 ย้ายมาเรนเดอร์ด้วย Astro แล้ว (2026-09-15) — รัดเพดานลงตามของจริงทันที
     * ไม่มี React runtime + router + เพย์โหลด RSC ติดมากับทุกหน้าอีกต่อไป
     * เหลือเฉพาะ island ที่ต้องโต้ตอบจริง และทั้งหมดโหลดแบบ `client:idle`
     * (หัวเว็บ · เครื่องมือวัดผล · เครื่องคำนวณวันเกิด)
     *
     * ⚠️ ตัวเลขนี้คือ "ของจริงที่วัดได้ + ระยะหายใจราว 10%" ตามหลัก ratchet ของบ้านนี้
     *    ห้ามขยับขึ้นเพื่อให้ผ่าน ให้ไปลดของจริงก่อนเสมอ
     */
    maxJsGzipKb: 127, // CI วัดได้ 116 KB + ระยะหายใจ 10%
    maxHtmlGzipKb: 26, // วัดจริง 2026-09-15: 21 KB
  },
  {
    route: "/en/cards/birth-card",
    /*
     * 🪶 ย้ายมาเรนเดอร์ด้วย Astro แล้ว (2026-09-15) — รัดเพดานลงตามของจริงทันที
     * ไม่มี React runtime + router + เพย์โหลด RSC ติดมากับทุกหน้าอีกต่อไป
     * เหลือเฉพาะ island ที่ต้องโต้ตอบจริง และทั้งหมดโหลดแบบ `client:idle`
     * (หัวเว็บ · เครื่องมือวัดผล · เครื่องคำนวณวันเกิด)
     *
     * ⚠️ ตัวเลขนี้คือ "ของจริงที่วัดได้ + ระยะหายใจราว 10%" ตามหลัก ratchet ของบ้านนี้
     *    ห้ามขยับขึ้นเพื่อให้ผ่าน ให้ไปลดของจริงก่อนเสมอ
     */
    maxJsGzipKb: 127, // CI วัดได้ 116 KB + ระยะหายใจ 10%
    maxHtmlGzipKb: 26, // วัดจริง 2026-09-15: 20 KB
  },
];

function ensureBuildExists(): void {
  const sampleTh = path.join(primaryOutputDir(), "(th)/page.js");
  const sampleRoot = path.join(primaryOutputDir(), "page.js");
  const buildManifest = path.join(ROOT, ".next/build-manifest.json");
  if (!fs.existsSync(sampleTh) && !fs.existsSync(sampleRoot) && !fs.existsSync(buildManifest)) {
    execSync("npm run build", {
      cwd: ROOT,
      stdio: "inherit",
      env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" },
    });
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
  /*
 * 🗺️ หาไฟล์ HTML จาก **เส้นทาง** ไม่ใช่จาก path ที่เขียนมือ
 * ของเดิมตารางงบแบกช่อง `htmlRelativePath` ที่ฝัง `.next/server/app/...` ไว้ 12 บรรทัด
 * ซึ่งแปลว่าถ้าหน้าไหนย้ายไปเรนเดอร์ด้วยเครื่องมืออื่น ด่านนี้จะหาไฟล์ไม่เจอแล้วถอยไป
 * ยิงผ่านเซิร์ฟเวอร์แทนแบบเงียบ ๆ · ตอนนี้ map มาจาก `lib/rendered-pages.ts` ที่เดียว
 */
const routeToFile = renderedRouteMap();
const htmlFileFor = (route: string) => routeToFile.get(normalizeRoute(route))?.file;

const needsServer = BUDGETS.some((b) => !htmlFileFor(b.route));
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
      const fullHtmlPath = htmlFileFor(b.route) ?? "";
      if (fullHtmlPath && fs.existsSync(fullHtmlPath)) {
        html = fs.readFileSync(fullHtmlPath, "utf8");
      } else if (serverProcess) {
        html = await fetchHtml(`http://127.0.0.1:${TEST_PORT}${b.route}`);
      } else {
        console.warn(`⚠️ ไม่พบไฟล์ HTML สำหรับเส้นทาง: ${b.route}`);
        continue;
      }

      const htmlGzipBytes = zlib.gzipSync(Buffer.from(html)).length;
      const htmlGzipKb = Math.round(htmlGzipBytes / 1024);

      /*
       * 🧮 JS ที่หน้านี้ทำให้เบราว์เซอร์ต้องโหลดจริง — ต้องนับให้ครบ **ทั้งสองเครื่องมือ**
       * ---------------------------------------------------------------------------
       * ⚠️ บทเรียน 2026-09-15: ตอนย้ายหน้าไพ่ไป Astro ด่านนี้รายงาน "0 KB" ให้ทุกหน้าที่ย้าย
       *    แล้วขึ้น ✅ ผ่าน — เพราะมันรู้จักแต่ `_next/static/chunks/*.js` อย่างเดียว
       *    ด่านที่มองไม่เห็นของที่ควรตรวจ แย่กว่าไม่มีด่าน เพราะมันให้ความมั่นใจปลอม ๆ
       *
       * Astro ไม่ได้ใส่ `<script src>` ของ island ไว้ใน HTML ตรง ๆ — มันประกาศไว้เป็น
       * แอตทริบิวต์ของ `<astro-island>` (`component-url` · `renderer-url`) แล้วโหลดตอน
       * ถึงเงื่อนไข (`client:idle` ฯลฯ) · แต่ละก้อนยัง `import` ก้อนอื่นต่อเป็นทอด ๆ
       * จึงต้องไล่กราฟ import ให้จบ ไม่งั้นจะนับขาดไปครึ่งหนึ่ง
       */
      const chunkFiles = new Set<string>();

      for (const ref of html.match(/_next\/static\/chunks\/[^"'\s>]+\.js/g) ?? []) {
        chunkFiles.add(path.join(ROOT, ".next", ref.replace(/^_next\//, "")));
      }

      const astroEntries = [
        ...(html.match(/(?:component-url|renderer-url)="([^"]+)"/g) ?? []).map((m) =>
          m.replace(/^[^"]+"/, "").replace(/"$/, ""),
        ),
        ...(html.match(/<script[^>]+src="(\/_astro\/[^"]+)"/g) ?? []).map((m) =>
          (m.match(/src="([^"]+)"/) as RegExpMatchArray)[1],
        ),
      ];

      /** ไล่กราฟ `import` แบบสถิตของก้อน JS ที่ Astro สร้าง จนครบทุกก้อนที่ถูกลากตามมา */
      const walkAstroImports = (entryUrl: string, seen: Set<string>): void => {
        const file = path.join(ROOT, "dist", entryUrl.replace(/^\//, ""));
        if (seen.has(file) || !fs.existsSync(file)) return;
        seen.add(file);
        const code = fs.readFileSync(file, "utf8");
        for (const spec of code.match(/(?:from|import)\s*"(\.[^"]+\.js)"/g) ?? []) {
          const rel = (spec.match(/"(\.[^"]+)"/) as RegExpMatchArray)[1];
          walkAstroImports(path.posix.join(path.posix.dirname(entryUrl), rel), seen);
        }
      };

      for (const entry of new Set(astroEntries)) walkAstroImports(entry, chunkFiles);

      let realJsGzipBytes = 0;
      let totalJsGzipBytes = 0;
      const chunkDetails: { name: string; sizeKb: number; isPolyfill: boolean }[] = [];

      for (const chunkFile of chunkFiles) {
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

