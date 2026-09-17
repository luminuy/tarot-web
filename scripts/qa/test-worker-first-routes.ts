/**
 * 🚪 ด่านกัน "หน้าใหม่ของ Next 404 เงียบ ๆ บน production" (R-25)
 * ===========================================================================
 *
 * ตั้งแต่ `wrangler.jsonc` เปลี่ยนเป็น `not_found_handling: "404-page"` กติกาการ
 * ส่งคำขอบน Cloudflare เปลี่ยนไปคนละแบบกับเดิม:
 *
 *   เดิม `"none"`      — ไม่ตรงไฟล์ static ➔ **ส่งต่อให้ Worker เสมอ**
 *                        หน้า Next ทุกหน้าจึงทำงานได้โดยไม่ต้องประกาศอะไรเลย
 *   ตอนนี้ `"404-page"` — ไม่ตรงไฟล์ static **และไม่อยู่ใน `run_worker_first`**
 *                        ➔ ตอบ `404.html` จากขอบทันที Worker ไม่เคยเห็นคำขอนั้น
 *
 * ผลคือ `run_worker_first` กลายเป็น **รายการที่ต้องถูกต้องตลอดเวลา** ไม่ใช่
 * ค่าปรับแต่งที่จะลืมก็ได้ — ใครเพิ่ม `page.tsx` ใหม่ใน `src/app` แล้วไม่เติมเส้นทาง
 * ลงรายการนั้น หน้านั้นจะ **404 บน production ทั้งที่ทุกอย่างผ่านในเครื่อง**
 * (ในเครื่องไม่มีชั้น assets ของ Cloudflare มาคั่น จึงไม่มีทางเห็นอาการเลย)
 *
 * ด่านนี้จึงไล่หาหน้า Next ทุกหน้าจากไฟล์จริง แล้วยืนยันว่ามีรูปแบบใน
 * `run_worker_first` ครอบคลุมครบทุกหน้า
 *
 * ⚠️ ด่านนี้ตรวจ "ครอบคลุมครบไหม" ไม่ได้ตรวจ "เกินไหม" — ใส่เส้นทางเกินมาแค่ทำให้
 * Worker ถูกปลุกโดยไม่จำเป็น (เสียเงิน แต่ไม่พัง) ส่วนใส่ขาดคือหน้าหาย
 *
 * รันเดี่ยว: npx tsx scripts/qa/test-worker-first-routes.ts
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "../..");

let failed = 0;
const check = (label: string, ok: boolean, detail?: string) => {
  console.log(`  ${ok ? "✅" : "❌"} ${label}`);
  if (!ok) {
    failed += 1;
    if (detail) console.log(`      ${detail}`);
  }
};

console.log("\n=======================================================");
console.log("🚪 WORKER-FIRST ROUTE GUARD — หน้า Next ต้องไปถึง Worker ได้จริง");
console.log("=======================================================\n");

// ── 1. อ่านคอนฟิกจริง ─────────────────────────────────────────────────────
const wranglerPath = path.join(ROOT, "wrangler.jsonc");
if (!fs.existsSync(wranglerPath)) {
  check("wrangler.jsonc ต้องมีอยู่จริง", false, `หาไม่เจอที่ ${wranglerPath}`);
  process.exit(1);
}

// ตัดคอมเมนต์ // ออกก่อน parse (jsonc)
const raw = fs.readFileSync(wranglerPath, "utf8").replace(/^\s*\/\/.*$/gm, "");
let assets: { not_found_handling?: string; run_worker_first?: unknown } = {};
try {
  assets = JSON.parse(raw).assets ?? {};
} catch (e) {
  check("wrangler.jsonc ต้อง parse ได้", false, String(e));
  process.exit(1);
}

const handling = assets.not_found_handling;
const workerFirst = assets.run_worker_first;

console.log("── 1. คอนฟิกต้องอยู่ในรูปที่ด่านนี้คุ้มครองได้ ──");

check(
  `not_found_handling = "404-page" (ได้ "${handling}")`,
  handling === "404-page",
  "ถ้ากลับไปเป็น \"none\" ให้ลบด่านนี้ทิ้งด้วย — มันจะกลายเป็นด่านที่ตรวจสิ่งที่ไม่มีผลอีกต่อไป",
);

check(
  "run_worker_first ต้องเป็นรายการเส้นทาง ไม่ใช่ true/false",
  Array.isArray(workerFirst),
  `ได้ ${JSON.stringify(workerFirst)} — คู่กับ "404-page" ค่านี้ต้องเป็น array เท่านั้น` +
    " (false = หน้า Next 404 ทั้งหมด · true = ทุกคำขอปลุก Worker เท่ากับยกเลิกประโยชน์ของการย้ายไป Astro)",
);

if (!Array.isArray(workerFirst)) {
  console.log(`\n❌ ไม่ผ่าน ${failed} ข้อ\n`);
  process.exit(1);
}

const patterns = workerFirst as string[];

// ── 2. รวบรวมเส้นทางที่ Next ต้องเป็นคนตอบ ────────────────────────────────
/** แปลงพาธไฟล์ใน src/app เป็น URL — ตัด route group `(th)` `(en)` และ `/page.tsx` ทิ้ง */
function routeFromPageFile(abs: string): string {
  let r = abs
    .replace(path.join(ROOT, "src/app"), "")
    .replace(/\/page\.tsx$/, "")
    .replace(/\/\([^/]+\)/g, "");
  if (r === "") r = "/";
  return r;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(abs, out);
    else if (entry.name === "page.tsx" || entry.name === "route.ts") out.push(abs);
  }
  return out;
}

const appDir = path.join(ROOT, "src/app");
const pageFiles = walk(appDir);

check(
  `หาไฟล์หน้า/ปลายทางใน src/app เจอ (${pageFiles.length} ไฟล์)`,
  pageFiles.length > 0,
  "คลังว่าง = ด่านนี้ไม่ได้ตรวจอะไรเลย ถือว่าตก (บทเรียน R-05)",
);

const nextRoutes = pageFiles
  .filter((f) => f.endsWith("page.tsx"))
  .map(routeFromPageFile)
  // หน้าอังกฤษอยู่ใต้ /en ซึ่ง Astro เป็นคนเรนเดอร์แล้ว — ตัดออกถ้าไม่มีไฟล์ Next จริง
  .filter((r) => r !== "/");

// ไฟล์พิเศษของ Next ที่สร้าง URL ขึ้นมาเองโดยไม่มี page.tsx
const specialFiles: Array<[string, string]> = [
  ["sitemap.ts", "/sitemap.xml"],
  ["robots.ts", "/robots.txt"],
  ["manifest.ts", "/manifest.webmanifest"],
];
for (const [file, url] of specialFiles) {
  if (fs.existsSync(path.join(appDir, file))) nextRoutes.push(url);
}

// ปลายทาง API — พอเช็กด้วยตัวแทนเส้นเดียว เพราะทั้งหมดอยู่ใต้ /api
if (fs.existsSync(path.join(appDir, "api"))) nextRoutes.push("/api/health-check-probe");

console.log(`\n── 2. เส้นทางที่ Worker ต้องได้รับ (${nextRoutes.length} เส้น) ──`);

// ── 3. เทียบกับรูปแบบในรายการ ─────────────────────────────────────────────
/** รองรับรูปแบบเท่าที่ Cloudflare ใช้จริง: ตรงตัว และ `*` ต่อท้าย */
function matches(route: string, pattern: string): boolean {
  if (pattern.endsWith("*")) return route.startsWith(pattern.slice(0, -1));
  return route === pattern;
}

const uncovered = nextRoutes.filter(
  (r) => !patterns.some((p) => matches(r.replace(/\[[^\]]+\]/g, "x"), p)),
);

check(
  `ทุกเส้นทางของ Next ถูกครอบคลุมใน run_worker_first`,
  uncovered.length === 0,
  uncovered.length
    ? `ขาด ${uncovered.length} เส้น: ${uncovered.join(" · ")}\n      ` +
      "➔ เติมเส้นทางเหล่านี้ลง assets.run_worker_first ใน wrangler.jsonc ไม่งั้นจะ 404 บน production"
    : undefined,
);

// ── 4. หน้า 404 ที่ขอบต้องมีอยู่จริง ───────────────────────────────────────
console.log("\n── 3. ไฟล์ 404 ที่ Cloudflare จะเสิร์ฟ ──");

const astro404 = path.join(ROOT, "astro/pages/404.astro");
const astro404En = path.join(ROOT, "astro/pages/en/404.astro");

check(
  "astro/pages/404.astro ต้องมี — ไม่งั้น \"404-page\" ไม่มีอะไรให้เสิร์ฟ",
  fs.existsSync(astro404),
  "Cloudflare จะถอยไปหน้า error ของตัวเองซึ่งไม่มีแบรนด์ ไม่มีทางกลับเข้าเว็บ (INC-0112)",
);

check(
  "astro/pages/en/404.astro ต้องมี — URL มั่วใต้ /en ต้องได้หน้าอังกฤษ",
  fs.existsSync(astro404En),
  "ถ้าไม่มี คนที่พิมพ์ /en/zzz ผิดจะเจอหน้า 404 ภาษาไทย",
);

// ทั้งสองหน้าต้องดึงข้อความจากแหล่งเดียวกัน ห้ามก๊อปไปเขียนซ้ำ
for (const [label, file] of [["ไทย", astro404], ["อังกฤษ", astro404En]] as const) {
  if (!fs.existsSync(file)) continue;
  const src = fs.readFileSync(file, "utf8");
  check(
    `หน้า 404 ${label} ดึงเนื้อหาจาก _shared/pages/not-found ไม่ได้เขียนข้อความซ้ำ`,
    src.includes("NotFoundMain") && src.includes("not-found"),
    "ข้อความต้องอยู่ที่ `COPY` ใน src/app/_shared/pages/not-found.tsx ที่เดียว (INC-0112)",
  );
}

// ── สรุป ──────────────────────────────────────────────────────────────────
if (failed > 0) {
  console.log(`\n❌ ไม่ผ่าน ${failed} ข้อ\n`);
  process.exit(1);
}
console.log("\n✨ ผ่านครบ — หน้า Next ทุกหน้าไปถึง Worker ได้ และ URL ตายถูกตอบจากขอบ\n");
