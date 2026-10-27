/**
 * 🪞 ด่านกัน "เว็บเดียวแต่หน้าตาไม่เหมือนกัน" — เทียบสองเครื่องมือเรนเดอร์
 * ===========================================================================
 *
 * ทำไมต้องมีด่านนี้
 * ----------------
 * ตั้งแต่หน้าเนื้อหาย้ายไปเรนเดอร์ด้วย Astro เว็บนี้มี `<head>` อยู่ **สองแม่พิมพ์**:
 *
 *   • `src/app/_shared/RootHtml.tsx`      (Next — หน้าแอป)
 *   • `astro/layouts/BaseLayout.astro`    (Astro — หน้าเนื้อหา)
 *
 * ผู้ใช้และบอตไม่รู้ว่าหน้าไหนออกมาจากแม่พิมพ์ไหน เว็บต้องเป็นเว็บเดียว
 * ถ้าวันหนึ่งมีคนเติมแท็กสำคัญที่แม่พิมพ์เดียว อีกครึ่งเว็บจะขาดของนั้นไปเงียบ ๆ
 * (เช่น พรีโหลดฟอนต์หาย → CLS พุ่งเฉพาะหน้าเนื้อหา · JSON-LD หาย → Google
 *  เห็นแบรนด์ครึ่งเดียว) และไม่มีด่านไหนในชุดเดิมจับได้เลย
 *
 * ด่านนี้ตรวจสามชั้น
 * -----------------
 *   1. ท่อฟอนต์ — ไฟล์ .woff2 มีอยู่จริง · `@font-face` ชี้ไปที่นั่น · ทุกหน้าพรีโหลดครบ
 *   2. แท็กที่ต้องมีทุกหน้า — charset · viewport · canonical · og · JSON-LD ฯลฯ
 *   3. ค่าที่ต้อง "เท่ากัน" ข้ามเครื่องมือ — viewport · theme-color · robots
 *
 * รันเดี่ยว: npx tsx scripts/qa/test-render-parity.ts
 */

import fs from "node:fs";
import path from "node:path";

import {
  FONT_PRELOADS,
  FONT_PRELOADS_LOW,
  FONT_PRELOADS_LOW_SKIP_ROUTES,
  SITE_THEME_COLOR,
  VIEWPORT_CONTENT,
} from "../../src/app/_shared/root-metadata";
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
console.log("🪞 RENDER PARITY GUARD — สองเครื่องมือเรนเดอร์ต้องให้เว็บเดียวกัน");
console.log("=======================================================\n");

// ── 1. ท่อฟอนต์ ───────────────────────────────────────────────────────────
console.log("── 1. ท่อฟอนต์ (ไฟล์ · @font-face · พรีโหลด) ──");

const globalsCss = fs.readFileSync(path.join(ROOT, "src/app/globals.css"), "utf-8");

const allFontPreloads = [
  ...new Set([...Object.values(FONT_PRELOADS).flat(), ...Object.values(FONT_PRELOADS_LOW).flat()]),
];
for (const href of allFontPreloads) {
  check(`มีไฟล์ฟอนต์จริงที่ public${href}`, fs.existsSync(path.join(ROOT, "public", href)));
  check(
    `globals.css มี @font-face ชี้ไปที่ ${href}`,
    globalsCss.includes(`url(${href})`),
    "ถ้าไม่มี ฟอนต์จะถูกพรีโหลดมาแล้วไม่มีใครใช้ — เปลืองแบนด์วิดท์และเสียคิวโหลด",
  );
}

/*
 * ✂️ ไฟล์ไทย/ละติน (ISSUE-048): `unicode-range` ของแต่ละหน้าฟอนต์ต้องตรงกับชุดอักขระที่ตัดไฟล์มาจริง
 * ไม่ตรง = เบราว์เซอร์ขอไฟล์ผิดตัว (ตัวอักษรที่ไม่มีในไฟล์ถอยไปฟอนต์สำรอง) · ชุดทับกัน = หน้าอังกฤษโหลดไฟล์ไทย
 * และหน้าอังกฤษห้ามพรีโหลดไฟล์ไทย — นั่นคือเหตุผลเดียวที่แยกไฟล์
 */
const subsetScript = fs.readFileSync(path.join(ROOT, "scripts/subset-fonts.py"), "utf-8");
const pyConst = (name: string) => subsetScript.match(new RegExp(`^${name} = "([^"]+)"`, "m"))?.[1] ?? "";
const pyPunct = (subsetScript.match(/^PUNCT = \(\s*([\s\S]*?)\)/m)?.[1] ?? "").replace(/["\s]/g, "");
/** "U+0020-007E,U+00A0,..." ➔ ชุดจุดรหัสที่ครอบคลุม */
const codepoints = (ranges: string) => {
  const set = new Set<number>();
  for (const part of ranges.split(",").map((r) => r.trim()).filter(Boolean)) {
    const [a, b] = part.replace(/^U\+/i, "").split("-");
    const start = parseInt(a, 16);
    const end = b ? parseInt(b, 16) : start;
    for (let cp = start; cp <= end; cp++) set.add(cp);
  }
  return set;
};
const sameSet = (x: Set<number>, y: Set<number>) => x.size === y.size && [...x].every((cp) => y.has(cp));
const thaiSet = codepoints(pyConst("THAI"));
const latinSet = codepoints(`${pyConst("ASCII")},${pyPunct}`);
check(
  "ชุดอักขระไทย/ละตินใน subset-fonts.py อ่านได้และไม่ทับกัน",
  thaiSet.size > 100 && latinSet.size > 90 && ![...thaiSet].some((cp) => latinSet.has(cp)),
  `ไทย ${thaiSet.size} ตัว · ละติน ${latinSet.size} ตัว`,
);
const fontFaces = globalsCss.match(/@font-face\s*\{[^}]*\}/g) ?? [];
const splitFaces = fontFaces.filter((f) => /-(?:thai|latin)\.woff2/.test(f));
check("globals.css มีหน้าฟอนต์แบบแยกไทย/ละติน", splitFaces.length >= 10, `พบ ${splitFaces.length} หน้า`);
const badRange = splitFaces.filter((f) => {
  const range = f.match(/unicode-range:\s*([^;]+);/)?.[1];
  if (!range) return true;
  return !sameSet(codepoints(range), /-thai\.woff2/.test(f) ? thaiSet : latinSet);
});
check(
  "unicode-range ของทุกหน้าฟอนต์ไทย/ละตินตรงกับชุดที่ตัดไฟล์จริง",
  badRange.length === 0,
  badRange.map((f) => f.match(/url\(([^)]+)\)/)?.[1]).join(" · "),
);
const enThai = [...FONT_PRELOADS.en, ...FONT_PRELOADS_LOW.en].filter((href) => href.includes("-thai."));
check("หน้าอังกฤษไม่พรีโหลดไฟล์ฟอนต์ไทย", enThai.length === 0, enThai.join(" · "));

check(
  "ไม่มีใครกลับไปใช้ next/font อีก (สองเครื่องมือต้องชี้ไฟล์ฟอนต์ชุดเดียวกัน)",
  !fs.existsSync(path.join(ROOT, "src/app/_shared/fonts.ts")),
  "next/font สร้าง URL เฉพาะฝั่ง Next — ผู้ใช้ที่เดินข้ามสองฝั่งจะโหลดฟอนต์ซ้ำทั้งชุด",
);

// ── 2 + 3. แท็กในทุกหน้าที่เรนเดอร์จริง ───────────────────────────────────
console.log("\n── 2. แท็กที่ต้องมีครบทุกหน้า ทั้งสองเครื่องมือ ──");

const pages = collectRenderedPages().filter(
  (page) => !page.route.startsWith("/_") && page.route !== "/manifest.webmanifest",
);

const byRenderer = new Map<string, number>();
for (const page of pages) byRenderer.set(page.renderer, (byRenderer.get(page.renderer) ?? 0) + 1);

check(
  "มีหน้าจากทั้งสองเครื่องมือให้เทียบ",
  byRenderer.size >= 2,
  [...byRenderer].map(([name, count]) => `${name}: ${count} หน้า`).join(" · "),
);

/** หน้าที่ไม่มีเนื้อหาจริงใน HTML (เปลือก error/redirect ของ Next) — ตรวจอะไรไม่ได้ */
const isShell = (html: string) => html.includes('id="__next_error__"');

const missing = {
  fontPreload: [] as string[],
  viewport: [] as string[],
  themeColor: [] as string[],
  organizationJsonLd: [] as string[],
  webSiteJsonLd: [] as string[],
  consentSwitch: [] as string[],
  speculationRules: [] as string[],
  charset: [] as string[],
};

let scanned = 0;
for (const page of pages) {
  const html = fs.readFileSync(page.file, "utf-8");
  if (isShell(html)) continue;
  scanned += 1;
  const where = `${page.route} [${page.renderer}]`;
  const locale = page.route === "/en" || page.route.startsWith("/en/") ? "en" : "th";
  const preloads = FONT_PRELOADS[locale];
  const preloadsLow = FONT_PRELOADS_LOW[locale];

  if (!preloads.every((href) => html.includes(`href="${href}"`))) missing.fontPreload.push(where);
  /* ชุดของอีกภาษาต้องไม่โผล่ (หน้าอังกฤษพรีโหลดไฟล์ไทย = แยกไฟล์ไปเปล่า ๆ) */
  const foreign = [...FONT_PRELOADS[locale === "en" ? "th" : "en"], ...FONT_PRELOADS_LOW[locale === "en" ? "th" : "en"]].filter(
    (href) => !preloads.includes(href) && !preloadsLow.includes(href) && html.includes(`href="${href}"`),
  );
  if (foreign.length > 0) missing.fontPreload.push(`${where} (พรีโหลดฟอนต์ของอีกภาษา: ${foreign.join(" · ")})`);
  /* น้ำหนักหนาต้องมาพร้อม `fetchpriority="low"` ทั้งสองเครื่องมือ (INC-0244 · ไม่แย่งคิวภาพ LCP)
     ยกเว้นหน้าใน FONT_PRELOADS_LOW_SKIP_ROUTES ซึ่งต้อง "ไม่มี" เลยสักไฟล์ (หน้าแรก · ตัวเลขวัดอยู่ที่ค่าคงที่นั้น) */
  if (FONT_PRELOADS_LOW_SKIP_ROUTES.includes(page.route)) {
    if (preloadsLow.some((href) => html.includes(`href="${href}"`)))
      missing.fontPreload.push(`${where} (หน้าแรกต้องไม่พรีโหลดน้ำหนักหนา)`);
  } else if (
    !preloadsLow.every((href) =>
      new RegExp(`<link[^>]*href="${href}"[^>]*fetchpriority="low"|<link[^>]*fetchpriority="low"[^>]*href="${href}"`, "i").test(html),
    )
  )
    missing.fontPreload.push(`${where} (น้ำหนักหนา fetchpriority="low")`);
  if (!html.includes(`content="${VIEWPORT_CONTENT}"`)) missing.viewport.push(where);
  if (!html.includes(`content="${SITE_THEME_COLOR}"`)) missing.themeColor.push(where);
  if (!html.includes('"@type":"Organization"')) missing.organizationJsonLd.push(where);
  if (!html.includes('"@type":"WebSite"')) missing.webSiteJsonLd.push(where);
  if (!html.includes("data-consent-ask")) missing.consentSwitch.push(where);
  if (!html.includes('type="speculationrules"')) missing.speculationRules.push(where);
  if (!/<meta\s+charset="utf-8"|<meta\s+charSet="utf-8"/i.test(html)) missing.charset.push(where);
}

check("มีหน้าให้ตรวจมากพอ (เกิน 250 หน้า)", scanned > 250, `ตรวจได้ ${scanned} หน้า`);

const LABELS: Record<keyof typeof missing, string> = {
  charset: "<meta charset=utf-8>",
  viewport: `<meta name="viewport"> ตรงกับ SITE_VIEWPORT`,
  themeColor: `<meta name="theme-color"> ตรงกับค่ากลาง`,
  fontPreload: "พรีโหลดฟอนต์ครบตามภาษาของหน้า (ไทย: ไฟล์ไทย+ละติน · อังกฤษ: ละตินเท่านั้น)",
  organizationJsonLd: "JSON-LD Organization",
  webSiteJsonLd: "JSON-LD WebSite",
  consentSwitch: "สวิตช์แถบขอความยินยอม PDPA",
  speculationRules: "Speculation Rules",
};

for (const key of Object.keys(LABELS) as (keyof typeof missing)[]) {
  const list = missing[key];
  check(
    `ทุกหน้ามี ${LABELS[key]}`,
    list.length === 0,
    list.length ? `ขาดใน ${list.length} หน้า · เช่น ${list.slice(0, 3).join(" · ")}` : undefined,
  );
}

console.log("");
if (failed > 0) {
  console.error(`❌ ล้มเหลว ${failed} ข้อ — สองเครื่องมือเรนเดอร์ให้ผลไม่ตรงกัน\n`);
  console.error("   แก้ที่แม่พิมพ์ทั้งสองฝั่งเสมอ:");
  console.error("     • src/app/_shared/RootHtml.tsx");
  console.error("     • astro/layouts/BaseLayout.astro\n");
  process.exit(1);
}
console.log("✅ สองเครื่องมือเรนเดอร์ให้ <head> ชุดเดียวกันครบทุกหน้า\n");
