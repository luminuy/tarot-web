/**
 * 🗺️ ด่านกัน "หน้าเดียวอยู่สองที่" — ใครเรนเดอร์อะไร ต้องตรงกับที่ประกาศไว้
 * ===========================================================================
 *
 * ระหว่างย้ายหน้าเนื้อหาออกจาก Next ทีละกลุ่ม เว็บนี้มีเครื่องมือเรนเดอร์สองตัว
 * และมีรายการกลางประกาศไว้ที่ `src/lib/routing/astro-routes.ts` ว่าเส้นไหนเป็นของใคร
 *
 * รายการนั้นไม่ได้มีไว้เฉย ๆ — `LocaleLink` ใช้มันตัดสินว่าจะเรนเดอร์ `<a>` ธรรมดา
 * หรือ `next/link` · ถ้ารายการกับของจริงหลุดจากกันเมื่อไร อาการจะเป็นแบบนี้:
 *
 *   ประกาศว่าเป็น Astro แต่จริง ๆ ยังเป็น Next  ➔ ลิงก์กลายเป็นโหลดทั้งหน้าใหม่โดยไม่จำเป็น
 *   ประกาศว่าเป็น Next แต่จริง ๆ ย้ายไป Astro   ➔ `next/link` ยิงขอเพย์โหลด RSC ที่ไม่มีอยู่จริง
 *                                                 ทุกครั้งที่คลิก แล้วค่อยถอยไปโหลดทั้งหน้า
 *
 * และกรณีที่ร้ายที่สุด: **หน้าเดียวกันถูกเรนเดอร์ทั้งสองที่** ผู้ใช้จะเห็นฉบับไหน
 * ขึ้นกับลำดับการคัดลอกไฟล์ตอน deploy (ดู `scripts/merge-astro-assets.ts`)
 *
 * รันเดี่ยว: npx tsx scripts/qa/test-astro-routes.ts
 */

import fs from "node:fs";
import path from "node:path";

import { ASTRO_ROUTE_PREFIXES, isAstroRoute } from "../../src/lib/routing/astro-routes";
import { collectRenderedPages, ROOT } from "./lib/rendered-pages";

let failed = 0;
const check = (label: string, ok: boolean, detail?: string) => {
  console.log(`  ${ok ? "✅" : "❌"} ${label}`);
  if (!ok) {
    failed += 1;
    if (detail) console.log(`      ${detail}`);
  }
};

console.log("\n=======================================================");
console.log("🗺️  RENDERER OWNERSHIP GUARD — เส้นทางไหนเป็นของเครื่องมือไหน");
console.log("=======================================================\n");

// ── 0. ตัวตัดสินต้องแยกแยะถูกทั้งสองภาษาและไม่เผลอครอบเส้นข้างเคียง ────────
console.log("── 0. ตรรกะของ isAstroRoute() ──");
for (const [href, expected] of [
  ["/cards", true],
  ["/cards/major-00", true],
  ["/cards/birth-card", true],
  ["/en/cards", true],
  ["/en/cards/major-00", true],
  ["/cards/major-00?x=1#y", true],
  ["/cards/major-00/", true],
  ["/", false],
  ["/spreads", false],
  ["/blog/tarot-daily-card-guide", false],
  /* ⚠️ เส้นที่ "ขึ้นต้นเหมือนกันแต่คนละหน้า" ต้องไม่ถูกครอบ */
  ["/cardsomething", false],
  ["https://example.com/cards", false],
  ["//evil.com/cards", false],
] as const) {
  check(`isAstroRoute("${href}") === ${expected}`, isAstroRoute(href) === expected);
}

console.log("\n── 1. ผลลัพธ์ที่บิลด์ออกมาจริง ──");
const pages = collectRenderedPages().filter((page) => !page.route.startsWith("/_"));

// ── 1. ห้ามมีเส้นทางซ้ำข้ามเครื่องมือ ─────────────────────────────────────
const seen = new Map<string, string>();
const duplicates: string[] = [];
for (const page of pages) {
  const previous = seen.get(page.route);
  if (previous && previous !== page.renderer) duplicates.push(`${page.route} (${previous} + ${page.renderer})`);
  else seen.set(page.route, page.renderer);
}
check(
  "ไม่มีเส้นทางไหนถูกเรนเดอร์ด้วยสองเครื่องมือพร้อมกัน",
  duplicates.length === 0,
  duplicates.slice(0, 5).join(" · "),
);

// ── 2. รายการที่ประกาศ ต้องตรงกับของจริงทั้งสองทาง ────────────────────────
const wrongOwner: string[] = [];
for (const page of pages) {
  const declaredAstro = isAstroRoute(page.route);
  const actuallyAstro = page.renderer === "astro";
  if (declaredAstro !== actuallyAstro) {
    wrongOwner.push(
      `${page.route} — ประกาศว่า ${declaredAstro ? "astro" : "next"} แต่เรนเดอร์จริงด้วย ${page.renderer}`,
    );
  }
}
check(
  "ทุกหน้าที่เรนเดอร์จริง ตรงกับที่ ASTRO_ROUTE_PREFIXES ประกาศไว้",
  wrongOwner.length === 0,
  wrongOwner.length ? `${wrongOwner.length} หน้าไม่ตรง · เช่น ${wrongOwner.slice(0, 3).join(" · ")}` : undefined,
);

// ── 3. ทุก prefix ที่ประกาศ ต้องมีหน้าจริงรองรับ ──────────────────────────
for (const prefix of ASTRO_ROUTE_PREFIXES) {
  const count = pages.filter((page) => page.renderer === "astro" && isAstroRoute(page.route) && (page.route === prefix || page.route.startsWith(`${prefix}/`))).length;
  check(`prefix "${prefix}" มีหน้าที่เรนเดอร์จริงรองรับ`, count > 0, `พบ ${count} หน้า`);
}

// ── 4. ฝาแฝดอังกฤษต้องย้ายตามกันเสมอ ─────────────────────────────────────
const astroRoutes = new Set(pages.filter((p) => p.renderer === "astro").map((p) => p.route));
const orphanTwins: string[] = [];
for (const route of astroRoutes) {
  if (route.startsWith("/en/") || route === "/en") continue;
  const twin = `/en${route}`;
  /* ตรวจเฉพาะเส้นที่มีฝาแฝดอยู่จริงในเว็บ — ถ้าฝั่งอังกฤษยังอยู่กับ Next แปลว่าย้ายมาครึ่งเดียว */
  const twinPage = pages.find((p) => p.route === twin);
  if (twinPage && twinPage.renderer !== "astro") orphanTwins.push(`${route} ➔ ${twin} (${twinPage.renderer})`);
}
check(
  "ฝาแฝดไทย–อังกฤษของหน้าที่ย้ายแล้ว ถูกย้ายไปด้วยกันทั้งคู่",
  orphanTwins.length === 0,
  orphanTwins.slice(0, 5).join(" · "),
);

// ── 5. ห้ามลิงก์ไปหน้า Astro ด้วย next/link ตรง ๆ ─────────────────────────
console.log("\n── 5. ลิงก์ข้ามเครื่องมือเรนเดอร์ ──");

function walkSource(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkSource(full, acc);
    else if (/\.tsx?$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

/** ไฟล์ที่ได้รับอนุญาตให้นำเข้า `next/link` ตรง ๆ — เป็นตัวห่อที่ตัดสินใจแทนคนอื่น */
const LINK_WRAPPERS = ["src/components/ui/RouteLink.tsx"];

const rawLinkOffenders: string[] = [];
for (const file of walkSource(path.join(ROOT, "src"))) {
  const rel = path.relative(ROOT, file).split(path.sep).join("/");
  if (LINK_WRAPPERS.includes(rel)) continue;
  const source = fs.readFileSync(file, "utf-8");
  if (!/from "next\/link"/.test(source)) continue;
  /* มีลิงก์ที่ชี้ไปยังกลุ่มหน้าที่ย้ายไป Astro แล้วหรือไม่ (ทั้งสตริงตรงและ template) */
  const linksToAstro = ASTRO_ROUTE_PREFIXES.some((prefix) =>
    new RegExp(`href=(?:"|\`|\\{"|\\{\`)${prefix}(?:/|"|\`)`).test(source),
  );
  if (linksToAstro) rawLinkOffenders.push(rel);
}

check(
  "ไม่มีไฟล์ไหนลิงก์ไปหน้าที่ย้ายไป Astro ด้วย `next/link` ตรง ๆ",
  rawLinkOffenders.length === 0,
  rawLinkOffenders.length
    ? `${rawLinkOffenders.join(" · ")}\n      ➔ เปลี่ยนไปใช้ RouteLink หรือ LocaleLink · ไม่งั้นทุกคลิกจะยิงขอ RSC ที่ไม่มีอยู่จริงก่อนหนึ่งเส้น`
    : undefined,
);

console.log(
  `\n  📊 สรุป: astro ${pages.filter((p) => p.renderer === "astro").length} หน้า · next ${pages.filter((p) => p.renderer === "next").length} หน้า\n`,
);

if (failed > 0) {
  console.error(`❌ ล้มเหลว ${failed} ข้อ — แก้รายการที่ src/lib/routing/astro-routes.ts หรือย้ายหน้าให้ครบ\n`);
  process.exit(1);
}
console.log("✅ เส้นทางทุกเส้นมีเจ้าของเครื่องมือเรนเดอร์เดียว และตรงกับรายการกลาง\n");
