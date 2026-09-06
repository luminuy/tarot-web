/**
 * QA — ยามเฝ้าเส้นทางสองภาษา (Bilingual Routing Guard)
 *
 * ⚠️ ทำไมต้องมีไฟล์นี้
 * ก่อนหน้านี้เว็บประกาศ `hreflang="en-US"` ชี้ไป `?lang=en` ซึ่งเสิร์ฟ HTML ภาษาไทย
 * ชุดเดียวกับ URL สะอาด และ self-canonical กลับมาที่เดิม ตามกฎของ Google ปลายทาง
 * hreflang ต้อง canonical หาตัวเอง — เมื่อไม่ใช่ Google จะ **ทิ้งคำประกาศทั้งชุด**
 * ไม่ใช่แค่ตัวที่ผิด เท่ากับเว็บไม่มีตัวตนในผลค้นหาภาษาอังกฤษเลยสักหน้า
 *
 * บทเรียน (หลักการข้อ 0.8): กฎที่ไม่มีเครื่องตรวจ คือกฎที่จะถูกละเมิดอีกแน่นอน
 *
 * รันด้วย: npx tsx scripts/qa/test-en-routing.ts
 */

import fs from "node:fs";
import path from "node:path";

import sitemap from "../../src/app/sitemap";
import { buildAlternates, SITE_ORIGIN } from "../../src/lib/config/site";
import { EN_TWIN_ROUTES, hasEnglishTwin, localeHref } from "../../src/lib/i18n/paths";

const ROOT = process.cwd();
const TH_APP = "src/app/(th)";
const EN_APP = "src/app/(en)/en";

/**
 * ตัดคอมเมนต์ออกก่อนตรวจ — ไฟล์เหล่านี้ "อธิบายเหตุผล" ที่ห้ามเรียก headers()/cookies()
 * ไว้ในคอมเมนต์ ถ้าไม่ตัดออกก่อน ด่านจะจับคำในคำอธิบายของตัวเองแล้วล้มทันที
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

let failures = 0;
function check(label: string, ok: boolean, detail?: string) {
  if (ok) {
    console.log(`  ✓ ${label}`);
  } else {
    failures++;
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

console.log("\n=======================================================");
console.log("🌐 BILINGUAL ROUTING GUARD — เส้นทาง /en ต้องมีอยู่จริงและชี้กันครบ");
console.log("=======================================================\n");

// ── 1. โครงสร้าง root layout สองราก ────────────────────────────────────────
check(
  "มี root layout ของทั้งสองภาษา",
  fs.existsSync(path.join(ROOT, TH_APP, "layout.tsx")) &&
    fs.existsSync(path.join(ROOT, "src/app/(en)/layout.tsx")),
);
check(
  "ไม่มี src/app/layout.tsx เดี่ยว ๆ อีก (ต้องอยู่ในกลุ่มเส้นทางเท่านั้น)",
  !fs.existsSync(path.join(ROOT, "src/app/layout.tsx")),
);

const rootHtml = stripComments(fs.readFileSync(path.join(ROOT, "src/app/_shared/RootHtml.tsx"), "utf-8"));
check(
  "RootHtml ไม่แตะ dynamic API (headers/cookies/getServerLocale) — กันซ้ำรอย INC-0091",
  !rootHtml.includes("headers()") &&
    !rootHtml.includes("cookies()") &&
    !rootHtml.includes("getServerLocale"),
);
check('RootHtml ใช้ <html lang={locale}> ตามเส้นทาง', rootHtml.includes("<html lang={locale}"));

for (const [group, locale] of [["(th)", '"th"'], ["(en)", '"en"']] as const) {
  const layout = stripComments(fs.readFileSync(path.join(ROOT, `src/app/${group}/layout.tsx`), "utf-8"));
  check(
    `src/app/${group}/layout.tsx ส่ง locale เป็นค่าคงที่ ${locale}`,
    layout.includes(`locale=${locale}`),
  );
  check(
    `src/app/${group}/layout.tsx ไม่แตะ dynamic API`,
    !layout.includes("headers()") && !layout.includes("cookies()") && !layout.includes("getServerLocale"),
  );
}

// ── 2. ทุกเส้นทางที่ประกาศว่ามีฝาแฝด ต้องมีไฟล์ page.tsx จริง ──────────────
for (const route of EN_TWIN_ROUTES) {
  const rel = route === "/" ? "" : route;
  check(
    `มีไฟล์หน้าอังกฤษจริงสำหรับ ${route === "/" ? "/en" : `/en${route}`}`,
    fs.existsSync(path.join(ROOT, EN_APP, rel, "page.tsx")),
    `${EN_APP}${rel}/page.tsx`,
  );
  check(
    `มีไฟล์หน้าไทยคู่กันสำหรับ ${route}`,
    fs.existsSync(path.join(ROOT, TH_APP, rel, "page.tsx")),
    `${TH_APP}${rel}/page.tsx`,
  );
}

for (const dynamicRoute of ["cards/[id]", "spreads/[id]"]) {
  check(
    `มีหน้าอังกฤษของเส้นทางไดนามิก /en/${dynamicRoute}`,
    fs.existsSync(path.join(ROOT, EN_APP, dynamicRoute, "page.tsx")),
  );
}

// ── 3. หน้าที่ยัง "ไม่มี" ฝาแฝด ต้องไม่ถูกประกาศว่ามี ─────────────────────
// เนื้อหาบรรณาธิการของหน้าเหล่านี้ยังเป็นภาษาไทยล้วน — เปิดหน้าอังกฤษตอนนี้
// = thin content ซึ่งแย่กว่าไม่มีหน้าเลย
for (const withoutTwin of ["/blog", "/blog/how-to-ask-tarot-questions", "/privacy", "/spreads/topic/love", "/cards/birth-card", "/account"]) {
  check(`${withoutTwin} ต้องไม่ประกาศว่ามีฝาแฝดอังกฤษ`, !hasEnglishTwin(withoutTwin));
  check(`ลิงก์ ${withoutTwin} ในหน้าอังกฤษต้องไม่ถูกเติม /en`, localeHref(withoutTwin, "en") === withoutTwin);
  const rel = withoutTwin === "/" ? "" : withoutTwin;
  check(
    `ต้องไม่มีไฟล์หน้าอังกฤษของ ${withoutTwin} หลงเหลืออยู่`,
    !fs.existsSync(path.join(ROOT, EN_APP, rel, "page.tsx")),
  );
}

// ── 4. hreflang ต้องไม่โกหก ────────────────────────────────────────────────
const twinAlternates = buildAlternates("/cards", { locale: "th", englishTwin: true });
check(
  "buildAlternates ของหน้าที่มีฝาแฝด ชี้ th → / และ en → /en",
  twinAlternates.languages?.["th-TH"] === `${SITE_ORIGIN}/cards` &&
    twinAlternates.languages?.["en-US"] === `${SITE_ORIGIN}/en/cards`,
);
check(
  "buildAlternates ไม่ใช้ ?lang= ในค่า hreflang อีกแล้ว",
  !JSON.stringify(twinAlternates).includes("?lang="),
);
const soloAlternates = buildAlternates("/blog", { locale: "th" });
check(
  "หน้าที่ไม่มีฝาแฝด ต้องไม่มี languages เลย (ไม่ประกาศสิ่งที่ไม่มีจริง)",
  !("languages" in soloAlternates),
);
check(
  "canonical ของหน้าอังกฤษชี้มาที่ /en เอง",
  buildAlternates("/cards", { locale: "en", englishTwin: true }).canonical === `${SITE_ORIGIN}/en/cards`,
);

// ── 4b. ทั้งสองฝั่งของทุกคู่ ต้องประกาศ englishTwin: true ─────────────────
// Google ต้องเห็นคำประกาศชี้กันไป-กลับ ขาดข้างเดียวมันจะทิ้งทั้งคู่
// เคยพลาดจริงตอนทำ: `/en/daily` ประกาศคู่ แต่ `/daily` ฝั่งไทยลืมเปิด englishTwin
function metadataSourceFor(group: "(th)" | "(en)", route: string): string {
  const rel = route === "/" ? "" : route;
  const base = group === "(th)" ? TH_APP : EN_APP;
  const pageFile = path.join(ROOT, base, rel, "page.tsx");
  if (!fs.existsSync(pageFile)) return "";
  let source = fs.readFileSync(pageFile, "utf-8");

  // ถ้าหน้านั้นดึง metadata มาจากโมดูลที่ใช้ร่วมกัน ให้ตามไปอ่านโมดูลนั้นด้วย
  for (const match of source.matchAll(/from "([^"]*_shared\/[^"]+)"/g)) {
    const sharedFile = path.join(ROOT, "src/app/_shared", match[1].split("_shared/")[1] + ".tsx");
    if (fs.existsSync(sharedFile)) source += fs.readFileSync(sharedFile, "utf-8");
  }
  return source;
}

for (const route of EN_TWIN_ROUTES) {
  for (const group of ["(th)", "(en)"] as const) {
    const source = metadataSourceFor(group, route);
    check(
      `${group}${route === "/" ? "" : route} ประกาศ englishTwin: true (hreflang ต้องชี้กันครบสองทาง)`,
      source.includes("englishTwin: true"),
    );
  }
}

// ── 5. sitemap ต้องมีคู่ครบและชี้กันไป-กลับ ────────────────────────────────
const entries = sitemap();
const urls = new Set(entries.map((entry) => entry.url));
check("sitemap ไม่มี ?lang= หลงเหลือ", !entries.some((entry) => entry.url.includes("?lang=")));

let reciprocal = true;
let missingTwin: string | null = null;
for (const entry of entries) {
  const languages = entry.alternates?.languages as Record<string, string> | undefined;
  if (!languages) continue;
  for (const target of Object.values(languages)) {
    if (!urls.has(target)) {
      reciprocal = false;
      missingTwin = target;
    }
  }
}
check("ทุก hreflang ใน sitemap ชี้ไปยัง URL ที่มีอยู่ใน sitemap เอง", reciprocal, missingTwin ?? undefined);

const englishEntries = entries.filter((entry) => entry.url.startsWith(`${SITE_ORIGIN}/en`));
check("sitemap มี URL ภาษาอังกฤษ (อย่างน้อย 100 หน้า)", englishEntries.length >= 100, `พบ ${englishEntries.length}`);
check(
  "ทุก URL อังกฤษใน sitemap มีคู่ภาษาไทยเสมอ",
  englishEntries.every((entry) => urls.has(entry.url.replace(`${SITE_ORIGIN}/en`, SITE_ORIGIN) || SITE_ORIGIN)),
);

// ── 6. ลิงก์ภายในในหน้าอังกฤษต้องอยู่ในต้นไม้ภาษาเดียวกัน ─────────────────
const MUST_USE_LOCALE_LINK = [
  "src/components/layout/SiteHeader.tsx",
  "src/components/layout/SiteFooter.tsx",
  "src/components/ui/SacredNavDropdown.tsx",
  "src/components/encyclopedia/RelatedCards.tsx",
  "src/components/encyclopedia/CardsExplorer.tsx",
  "src/components/encyclopedia/CardGroupView.tsx",
  "src/components/encyclopedia/AllCardsTable.tsx",
  "src/components/encyclopedia/CardDetailView.tsx",
  "src/components/spread/SpreadsLibrary.tsx",
  "src/components/spread/SpreadDetailClient.tsx",
  "src/components/home/TarotFlow.tsx",
];
for (const file of MUST_USE_LOCALE_LINK) {
  const source = fs.readFileSync(path.join(ROOT, file), "utf-8");
  check(
    `${file} ใช้ LocaleLink แทน next/link ตรง ๆ`,
    source.includes("@/components/ui/LocaleLink") && !source.includes('import Link from "next/link"'),
  );
}

console.log("");
if (failures > 0) {
  console.error(`❌ ล้มเหลว ${failures} ข้อ — เส้นทางสองภาษายังไม่สอดคล้องกัน\n`);
  process.exit(1);
}
console.log("✅ เส้นทางสองภาษาสอดคล้องกันทั้งหมด (ไฟล์จริง · hreflang · sitemap · ลิงก์ภายใน)\n");
