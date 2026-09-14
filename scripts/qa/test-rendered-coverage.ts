/**
 * 🗺️ ด่านกัน "หน้าหายเงียบ" — sitemap กับหน้าที่เรนเดอร์จริงต้องตรงกัน
 * ===========================================================================
 *
 * ทำไมต้องมีด่านนี้
 * ----------------
 * `src/app/sitemap.ts` สร้าง URL จาก **ข้อมูล** (`DECK` · `ARTICLES` · `SPREADS`)
 * ไม่ได้สร้างจากไฟล์ที่เรนเดอร์ออกมาจริง · สองอย่างนี้จึงหลุดจากกันได้โดยไม่มีใครรู้
 *
 * แปลว่าถ้าวันหนึ่งหน้าใดหน้าหนึ่งเลิกถูก prerender (ย้ายเครื่องมือเรนเดอร์ ·
 * `generateStaticParams` พลาด · บิลด์ครึ่ง ๆ กลาง ๆ) **sitemap จะยังประกาศ URL นั้น
 * ต่อ Google เหมือนเดิม** และด่านเดิมทั้ง 56 ด่านก็ยังเขียวหมด เพราะไม่มีด่านไหน
 * เทียบสองฝั่งนี้เลย — ตรวจแล้วเมื่อ 2026-09-14 ว่าช่องโหว่นี้มีอยู่จริง
 *
 * ผลที่ตามมาคืออาการที่แย่ที่สุดแบบหนึ่งของ SEO: Google ตามลิงก์ใน sitemap
 * มาเจอ 404 เอง โดยที่ฝั่งเราไม่มีสัญญาณอะไรเตือนเลยสักอย่าง
 *
 * ด่านนี้ตรวจสองทาง
 * ----------------
 *   1. ทุก URL ใน sitemap ต้องมีหน้าที่เรนเดอร์จริงรองรับ (หรืออยู่ในรายการยกเว้นที่มีเหตุผล)
 *   2. ห้ามมีไฟล์ด่านไหน hardcode `.next/server/app` อีก — ต้องผ่าน
 *      `lib/rendered-pages.ts` เท่านั้น เพื่อให้เพิ่มเครื่องมือเรนเดอร์ตัวที่สอง
 *      แล้วด่านทุกด่านครอบคลุมทันที (ดูเหตุผลเต็มในหัวไฟล์นั้น)
 *
 * รันเดี่ยว: npx tsx scripts/qa/test-rendered-coverage.ts
 */

import fs from "node:fs";
import path from "node:path";

import sitemap from "../../src/app/sitemap";
import { SITE_ORIGIN } from "../../src/lib/config/site";
import { collectRenderedPages, normalizeRoute, ROOT } from "./lib/rendered-pages";

let failed = 0;
const check = (label: string, ok: boolean, detail?: string) => {
  console.log(`  ${ok ? "✅" : "❌"} ${label}`);
  if (!ok) {
    failed++;
    if (detail) console.log(`      ${detail}`);
  }
};

/**
 * เส้นทางใน sitemap ที่ "ไม่มีไฟล์ HTML" ได้อย่างถูกต้อง
 *
 * ⚠️ เติมรายการนี้ได้เฉพาะเมื่อมีเหตุผลที่อธิบายได้ว่าทำไมหน้านั้นถึงไม่ถูก prerender
 *    ห้ามเติมเพื่อให้ด่านเขียวเฉย ๆ — จุดประสงค์ทั้งหมดของด่านนี้คือจับหน้าที่หายไป
 */
const DYNAMIC_ROUTES: Array<{ route: string; reason: string }> = [
  {
    route: "/readers",
    reason: "หน้ารวมแม่หมอตัวจริงเป็น ƒ Dynamic — ดึงรายชื่อจาก D1 ตอนมีคำขอ จึงไม่มีไฟล์ตอนบิลด์",
  },
];

console.log("\n🗺️  ตรวจความครบถ้วนของหน้าที่เรนเดอร์จริง (sitemap ↔ HTML)\n");

// ── 1. sitemap ทุกเส้นต้องมีหน้ารองรับ ──────────────────────────────────────
const rendered = collectRenderedPages();
const renderedRoutes = new Set(rendered.map((p) => p.route));
const allowed = new Map(DYNAMIC_ROUTES.map((d) => [normalizeRoute(d.route), d.reason]));

const sitemapRoutes = sitemap().map((entry) =>
  normalizeRoute(entry.url.replace(SITE_ORIGIN, "") || "/"),
);

const missing = sitemapRoutes.filter((r) => !renderedRoutes.has(r) && !allowed.has(r));

console.log(`   หน้าที่เรนเดอร์จริง ${rendered.length} หน้า · URL ใน sitemap ${sitemapRoutes.length} เส้น`);
const byRenderer = rendered.reduce<Record<string, number>>((acc, p) => {
  acc[p.renderer] = (acc[p.renderer] ?? 0) + 1;
  return acc;
}, {});
console.log(`   แยกตามเครื่องมือเรนเดอร์: ${Object.entries(byRenderer).map(([k, v]) => `${k}=${v}`).join(" · ")}\n`);

check(
  "ทุก URL ใน sitemap มีหน้าที่เรนเดอร์จริงรองรับ",
  missing.length === 0,
  missing.length ? `หายไป ${missing.length} เส้น: ${missing.slice(0, 10).join(", ")}` : undefined,
);

for (const [route, reason] of allowed) {
  const listed = sitemapRoutes.includes(route);
  check(`ข้อยกเว้น ${route} ยังอยู่ใน sitemap และยังมีเหตุผลรองรับ (${reason})`, listed);
}

// ── 2. sitemap ต้องไม่มีเส้นซ้ำ ─────────────────────────────────────────────
const dupes = sitemapRoutes.filter((r, i) => sitemapRoutes.indexOf(r) !== i);
check("sitemap ไม่มี URL ซ้ำ", dupes.length === 0, dupes.slice(0, 5).join(", "));

// ── 3. ห้ามด่านไหน hardcode path ของ Next อีก ───────────────────────────────
/*
 * นี่คือข้อที่ทำให้การย้ายเครื่องมือเรนเดอร์ปลอดภัย — ถ้าด่านยังเดา path เอง
 * มันจะมองไม่เห็นหน้าที่ย้ายออกไป แล้วขึ้นเขียวทั้งที่ไม่ได้ตรวจอะไรเลย
 */
const QA_DIR = path.join(ROOT, "scripts/qa");
const SELF = path.basename(import.meta.filename);
const offenders: string[] = [];
for (const file of fs.readdirSync(QA_DIR)) {
  if (!file.endsWith(".ts") || file === SELF) continue;
  const body = fs.readFileSync(path.join(QA_DIR, file), "utf-8");
  // มองเฉพาะโค้ดจริง ไม่นับบรรทัดคอมเมนต์ที่อธิบายประวัติ
  const code = body
    .split("\n")
    .filter((line) => !/^\s*(\*|\/\/|\/\*)/.test(line))
    .join("\n");
  if (code.includes(".next/server/app")) offenders.push(file);
}
check(
  "ไม่มีด่านไหน hardcode `.next/server/app` (ต้องผ่าน lib/rendered-pages.ts)",
  offenders.length === 0,
  offenders.length
    ? `ยังฝัง path อยู่: ${offenders.join(", ")} — เปลี่ยนไปใช้ collectRenderedPages()`
    : undefined,
);

console.log(
  failed === 0
    ? "\n✨ ผ่านครบ — sitemap กับหน้าจริงตรงกัน และด่านทุกด่านไม่ผูกกับเครื่องมือเรนเดอร์ตัวใดตัวหนึ่ง\n"
    : `\n❌ ตก ${failed} ข้อ\n`,
);
process.exit(failed === 0 ? 0 : 1);
