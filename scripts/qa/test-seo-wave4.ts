import fs from "node:fs";
import path from "node:path";
import { calculateBirthCard, reduceToTarotNumber } from "../../src/lib/tarot/birth-card";
import { ARTICLES } from "../../src/data/articles";
import sitemap from "../../src/app/sitemap";
import { SITE_ORIGIN } from "../../src/lib/config/site";
import { assertNonEmptyCorpus } from "./lib/corpus";
import { ZODIAC_SIGNS } from "../../src/data/zodiac";
import { CARD_SUMMARIES } from "../../src/data/cards/summary";
import { decanRanges, findZodiacByDate } from "../../src/lib/tarot/zodiac";

console.log("\n🧪 กำลังทดสอบระบบ SEO Wave 4: Differentiators (Birth Card, Positions Table, Learn Tarot & Readers)\n");

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ ${message}`);
    failed++;
  }
}

// 1. Numerology Math & Digit Reduction
assert(reduceToTarotNumber(15) === 15, "reduceToTarotNumber(15) ต้องได้ 15");
assert(reduceToTarotNumber(22) === 22, "reduceToTarotNumber(22) ต้องได้ 22");
assert(reduceToTarotNumber(23) === 5, "reduceToTarotNumber(23) ต้องได้ 5 (2+3)");
assert(reduceToTarotNumber(2018) === 11, "reduceToTarotNumber(2018) ต้องได้ 11 (2+0+1+8)");

// 2. Birth Card Calculation Logic
const bc1 = calculateBirthCard(15, 8, 1995);
assert(!!bc1, "คำนวณวันเกิด 15/08/1995 ต้องได้ผลลัพธ์");
if (bc1) {
  assert(bc1.primaryNumber === 11, `15/08/1995 ต้องได้ไพ่หมายเลข 11 (ปัจจุบัน: ${bc1.primaryNumber})`);
  assert(bc1.primaryCard.id === "major-11", `ไพ่หลักต้องเป็น Justice (major-11)`);
  assert(bc1.secondaryNumber === 2, `ไพ่จิตวิญญาณรองต้องเป็นหมายเลข 2`);
  assert(bc1.secondaryCard?.id === "major-02", `ไพ่รองต้องเป็น The High Priestess (major-02)`);
}

// Buddhist Era (พ.ศ.) test
const bcBe = calculateBirthCard(15, 8, 2538, true);
assert(!!bcBe, "คำนวณวันเกิด 15/08/2538 (พ.ศ.) ต้องได้ผลลัพธ์");
if (bcBe) {
  assert(bcBe.yearCe === 1995, "พ.ศ. 2538 ต้องแปลงเป็น ค.ศ. 1995");
  assert(bcBe.primaryCard.id === "major-11", "ผลลัพธ์ พ.ศ. 2538 ต้องตรงกับ ค.ศ. 1995");
}

// Single Digit test (no secondary card)
const bcSingle = calculateBirthCard(1, 1, 2000);
if (bcSingle) {
  assert(bcSingle.primaryNumber === 4, "1/1/2000 (2002 -> 4) ต้องได้เลข 4");
  assert(bcSingle.primaryCard.id === "major-04", "ไพ่หลักต้องเป็น The Emperor");
  assert(bcSingle.secondaryCard === undefined, "เลขหลักเดียวต้องไม่มี secondaryCard");
}

// Rule 14: Zero Fabricated Cards on invalid input
assert(calculateBirthCard(0, 8, 1995) === undefined, "วันที่ 0 ต้องคืน undefined (ห้ามกุไพ่ปลอม)");
assert(calculateBirthCard(32, 8, 1995) === undefined, "วันที่ 32 ต้องคืน undefined (ห้ามกุไพ่ปลอม)");
assert(calculateBirthCard(15, 13, 1995) === undefined, "เดือน 13 ต้องคืน undefined (ห้ามกุไพ่ปลอม)");
assert(calculateBirthCard(15, 8, 1500) === undefined, "ปีนอกช่วงต้องคืน undefined (ห้ามกุไพ่ปลอม)");

// 3. Birth Card Page & Sitemap
/* ⚠️ หน้านี้ย้ายไปเรนเดอร์ด้วย Astro แล้ว — เนื้อหาอยู่ที่ `_shared/pages/birth-card-th.tsx`
   และหน้าจริงอยู่ที่ `astro/pages/cards/birth-card.astro` (ดู src/lib/routing/astro-routes.ts)
   ตรวจ "เนื้อหา" ที่ใช้ร่วมกันทั้งสองภาษา ไม่ใช่ path ของเครื่องมือเรนเดอร์ตัวใดตัวหนึ่ง */
const birthCardPagePath = path.join(process.cwd(), "src/app/_shared/pages/birth-card-th.tsx");
assert(fs.existsSync(birthCardPagePath), "ต้องมีเนื้อหาหน้าไพ่ประจำตัวที่ _shared/pages/birth-card-th.tsx");
assert(
  fs.existsSync(path.join(process.cwd(), "astro/pages/cards/birth-card.astro")),
  "ต้องมีหน้า astro/pages/cards/birth-card.astro",
);

const calcCompPath = path.join(process.cwd(), "src/components/encyclopedia/BirthCardCalculator.tsx");
assert(fs.existsSync(calcCompPath), "ต้องมีคอมโพเนนต์ src/components/encyclopedia/BirthCardCalculator.tsx");

const generatedSitemap = sitemap();
const sitemapUrls = new Set(generatedSitemap.map((e) => e.url));
assert(
  sitemapUrls.has(`${SITE_ORIGIN}/cards/birth-card`),
  `sitemap.ts ต้องมี URL '${SITE_ORIGIN}/cards/birth-card'`,
);

const explorerPath = path.join(process.cwd(), "src/components/encyclopedia/CardsExplorer.tsx");
const explorerContent = fs.readFileSync(explorerPath, "utf-8");
assert(
  explorerContent.includes("/cards/birth-card"),
  "CardsExplorer.tsx ต้องมีลิงก์ภายในไปยัง '/cards/birth-card'",
);

// 4. Spread Positions Semantic Table (Wave 4.1)
const spreadDetailPath = path.join(process.cwd(), "src/components/spread/SpreadDetailClient.tsx");
const spreadDetailContent = fs.readFileSync(spreadDetailPath, "utf-8");
assert(
  spreadDetailContent.includes("<table") && spreadDetailContent.includes("คำถามที่ตำแหน่งนี้ตอบ"),
  "SpreadDetailClient.tsx ต้องมี semantic table สำหรับตำแหน่งไพ่",
);

// metadata ของหน้าผังย้ายไปอยู่ในโมดูลที่ใช้ร่วมกันสองภาษาแล้ว (`_shared/pages/spread-detail.tsx`)
const spreadPagePath = path.join(process.cwd(), "src/app/_shared/pages/spread-detail.tsx");
const spreadPageContent = fs.readFileSync(spreadPagePath, "utf-8");
assert(
  spreadPageContent.includes("ตำแหน่งไพ่"),
  "_shared/pages/spread-detail.tsx ต้องมี keyword ตำแหน่งไพ่ สำหรับ SEO ฝั่งไทย",
);
assert(
  spreadPageContent.includes("tarot spread positions"),
  "_shared/pages/spread-detail.tsx ต้องมี keyword ฝั่งอังกฤษของหน้าผังด้วย",
);

// 5. Blog & Readers SEO Copy (Wave 4.3 & 4.4)
const beginnerArticle = ARTICLES.find((a) => a.slug === "how-to-read-tarot-for-beginners");
assert(
  beginnerArticle?.seoTitle.includes("เรียนไพ่ยิปซีฟรี") === true,
  "บทความสำหรับผู้เริ่มต้นต้องมี 'เรียนไพ่ยิปซีฟรี' ใน seoTitle",
);
assert(
  beginnerArticle?.keywords.includes("เรียนไพ่ยิปซีฟรี") === true,
  "บทความสำหรับผู้เริ่มต้นต้องมี 'เรียนไพ่ยิปซีฟรี' ใน keywords",
);

const readersPagePath = path.join(process.cwd(), "src/app/(th)/readers/page.tsx");
const readersContent = fs.readFileSync(readersPagePath, "utf-8");
assert(
  readersContent.includes("หมอดูไพ่ยิปซี"),
  "readers/page.tsx metadata ต้องมีคำว่า 'หมอดูไพ่ยิปซี'",
);

// 6. Rule 2: Zero Sparkle / Star Emojis in Wave 4 files
const wave4Files = [
  "src/lib/tarot/birth-card.ts",
  "src/components/encyclopedia/BirthCardCalculator.tsx",
  "src/app/_shared/pages/birth-card-th.tsx",
  "src/app/_shared/pages/birth-card-en.tsx",
];
for (const file of wave4Files) {
  const filePath = path.join(process.cwd(), file);
  // ⚠️ R-07: ไฟล์หาย = **ตกด่าน** ไม่ใช่ข้ามเงียบ
  // เปลี่ยนชื่อ/ย้ายไฟล์หน้าเมื่อไหร่ ด่านนี้เคยหายไปเฉย ๆ ซึ่งคือสิ่งที่มันมีไว้จับพอดี
  if (!fs.existsSync(filePath)) {
    assert(false, `หาไฟล์ที่ด่านนี้ต้องตรวจไม่เจอ: ${file}`);
  } else {
    const content = fs.readFileSync(filePath, "utf-8");
    /*
     * ⚠️ ต้องมีธง `u` — ถ้าไม่มี JavaScript จะมองอิโมจินอกระนาบพื้นฐาน (🌟) เป็น
     * "คู่ surrogate" สองตัวแยกกัน แล้วยัดตัวหน้า (\uD83C) ลงในคลาสอักขระนี้ด้วย
     * ผลคือคลาสนี้จับ **อิโมจิทุกตัวที่ขึ้นต้นด้วย \uD83C** (🎂 🃏 🎯 …) ทั้งที่ไม่ได้ตั้งใจ
     * เจอจริงตอนเพิ่ม `birth-card-en.tsx` เข้ารายการ: ด่านฟ้อง 🎂 ในคอมเมนต์ว่าเป็น
     * "อิโมจิดวงดาว" ซึ่งไม่จริง · ทั้ง repo ใช้อิโมจิในคอมเมนต์เป็นปกติอยู่แล้ว
     * กฎข้อ 2 ห้ามอิโมจิการ์ตูนใน **ข้อความที่ผู้ใช้เห็น** ไม่ใช่ในคอมเมนต์ของโค้ด
     */
    const hasForbiddenEmoji = /[✦✨✧⭐🌟]/u.test(content);
    assert(!hasForbiddenEmoji, `ไฟล์ ${file} ต้องไม่มีอิโมจิดวงดาว/แฟนซี (กฎข้อ 2)`);
  }
}

// 7. S-01: All alternates in src/app must use buildAlternates (no raw alternates: {)
function walkFiles(dir: string): string[] {
  let results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(walkFiles(full));
    } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
      results.push(full);
    }
  }
  return results;
}

// `src/app/sitemap.ts` ใช้ฟิลด์ `alternates.languages` ของ MetadataRoute.Sitemap
// ซึ่งเป็นคนละเรื่องกับ `metadata.alternates` ของหน้า — และมันสร้างคู่ hreflang
// จาก `hasEnglishTwin()` ซึ่งเป็นแหล่งความจริงเดียวกับ buildAlternates อยู่แล้ว
const SITEMAP_EXEMPT = path.join(process.cwd(), "src/app/sitemap.ts");
const appFiles = walkFiles(path.join(process.cwd(), "src/app")).filter((f) => f !== SITEMAP_EXEMPT);
assertNonEmptyCorpus("ไฟล์ใน src/app", appFiles, "ตรวจว่า walkFiles() ชี้ไปที่ src/app จริง");
let rawAlternatesCount = 0;
for (const file of appFiles) {
  const content = fs.readFileSync(file, "utf-8");
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("//") || line.startsWith("*")) continue;
    if (/alternates\s*:\s*\{/.test(line)) {
      console.error(`❌ พบ raw alternates: { ใน ${file}:${i + 1} — ต้องใช้ buildAlternates(path) เท่านั้น`);
      rawAlternatesCount++;
    }
  }
}
assert(
  rawAlternatesCount === 0,
  "ห้ามเขียน alternates: { เองใน src/app (ต้องใช้ buildAlternates จาก site.ts เพื่อคง hreflang)",
);

// 8. S-03: หน้า /account ต้องประกาศ robots noindex ในตัวเอง (ไม่พึ่ง robots.txt อย่างเดียว)
//    ⚠️ หน้านี้ย้ายจาก Next ไป Astro แล้ว metadata จึงอยู่ที่โมดูลกลางที่ Astro อ่าน
//       ถ้าย้ายกลับหรือย้ายไฟล์อีก ให้แก้พาธตรงนี้ด้วย — ห้ามลบด่านทิ้ง
const accountMetaPath = path.join(process.cwd(), "src/app/_shared/pages/account-th.ts");
assert(fs.existsSync(accountMetaPath), "ไม่พบโมดูล metadata ของหน้า /account (src/app/_shared/pages/account-th.ts)");
const accountMetaContent = fs.readFileSync(accountMetaPath, "utf-8");
assert(
  accountMetaContent.includes("robots:") && accountMetaContent.includes("index: false"),
  "metadata ของหน้า /account ต้องประกาศ robots: { index: false } (S-03)",
);
const accountAstroPath = path.join(process.cwd(), "astro/pages/account.astro");
assert(
  fs.existsSync(accountAstroPath) &&
    fs.readFileSync(accountAstroPath, "utf-8").includes("accountMetadataTh"),
  "astro/pages/account.astro ต้องใช้ accountMetadataTh (ไม่งั้น noindex จะหายไปเงียบ ๆ)",
);

// 9. S-04: /tarot must be redirected to / and src/app/tarot must not exist
// ⚠️ redirect อยู่ที่ `public/_redirects` (ทำงานที่ขอบของ Cloudflare) ไม่ใช่ next.config.ts แล้ว (A6-05)
//    ด่านเดิมตรวจ next.config.ts ซึ่ง "ผ่าน" มาตลอดทั้งที่ production ตอบ 404 — กฎใน redirects()
//    ของเส้นที่ไม่อยู่ใน run_worker_first ไม่เคยถึง Worker
const tarotPageExists = fs.existsSync(path.join(process.cwd(), "src/app/(th)/tarot"));
assert(!tarotPageExists, "src/app/tarot ต้องถูกลบออก (ใช้ redirect แทน)");
const edgeRedirects = fs.existsSync(path.join(process.cwd(), "public/_redirects"))
  ? fs.readFileSync(path.join(process.cwd(), "public/_redirects"), "utf-8")
  : "";
assert(
  /^\/tarot\s+\/\s+30[18]\s*$/m.test(edgeRedirects),
  "public/_redirects ต้องมี redirect จาก /tarot ไปที่ / แบบถาวร (S-04 · A6-05)",
);

/**
 * ตัดคอมเมนต์ออกก่อนตรวจ — ด่านด้านล่างห้าม "โค้ด" บางอย่าง แต่ไฟล์เหล่านั้นมีคอมเมนต์
 * อธิบายว่าทำไมถึงห้าม (ซึ่งต้องเอ่ยชื่อฟังก์ชันที่ห้าม) ถ้าเทียบสตริงดิบจะจับคอมเมนต์เอง
 */
function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

// 10. PERF: root layout ต้อง "ไม่" แตะ dynamic API (กลับด้านจากด่าน S-02 เดิม)
// ---------------------------------------------------------------------------
// เดิมด่านนี้บังคับให้ root layout เรียก `getServerLocale()` แล้วส่ง `initialLocale`
// ให้ LocaleProvider (S-02 · PR #306) ซึ่งกลายเป็นต้นเหตุปัญหาประสิทธิภาพที่หนักที่สุด:
// การแตะ `headers()`/`cookies()` ใน root layout ทำให้ **ทุก route ในเว็บเป็น dynamic**
// วัดจริง 2026-09-06: prerender ได้ 0 หน้า · Next ตอบ no-store ทุกหน้า ·
// `enableCacheInterception` ของ OpenNext ไม่มีอะไรให้เสิร์ฟ · Worker boot เต็มทุกคำขอ
// หลังแก้: prerender ได้ 167 หน้า
// ด่านนี้จึงถูกกลับด้านเพื่อ "ล็อกไม่ให้ของเดิมกลับมา"
// อัปเดต 2026-09-06: root layout ถูกแยกเป็นสองรากตามกลุ่มเส้นทาง `(th)` และ `(en)`
// เพื่อให้หน้า `/en/**` ได้ `<html lang="en">` ใน HTML ดิบ โดยยัง prerender ได้ทั้งหมด
// โครง `<html>` จริงอยู่ที่ `src/app/_shared/RootHtml.tsx` — ตรวจทั้งสามไฟล์
const ROOT_HTML_FILES = [
  "src/app/(th)/layout.tsx",
  "src/app/(en)/layout.tsx",
  "src/app/_shared/RootHtml.tsx",
];
for (const relPath of ROOT_HTML_FILES) {
  const content = stripComments(fs.readFileSync(path.join(process.cwd(), relPath), "utf-8"));
  assert(
    !content.includes("getServerLocale()") &&
    !content.includes("await headers()") &&
    !content.includes("await cookies()"),
    `${relPath} ห้ามเรียก getServerLocale()/headers()/cookies() — จะทำให้ทุกหน้าเป็น dynamic ทั้งเว็บ (PERF)`,
  );
}
assert(
  !fs.existsSync(path.join(process.cwd(), "src/app/layout.tsx")),
  "ต้องไม่มี src/app/layout.tsx เดี่ยว ๆ อีก — root layout อยู่ในกลุ่มเส้นทาง (th)/(en) เท่านั้น",
);
const rootHtmlContent = stripComments(
  fs.readFileSync(path.join(process.cwd(), "src/app/_shared/RootHtml.tsx"), "utf-8"),
);
assert(
  rootHtmlContent.includes("<html lang={locale}"),
  'RootHtml ต้องใช้ <html lang={locale}> โดย locale มาจากเส้นทางที่เขียนตรง ๆ ใน layout ของแต่ละกลุ่ม',
);

// 11. P-03: HomeSeoContent must be a Server Component (no 'use client')
// ยังคงเดิม — เนื้อหา SEO 800+ บรรทัดต้องไม่ถูกส่งไปเป็น JS ให้เบราว์เซอร์
const homeSeoPath = path.join(process.cwd(), "src/components/seo/HomeSeoContent.tsx");
const homeSeoContent = fs.readFileSync(homeSeoPath, "utf-8");
assert(
  !homeSeoContent.includes('"use client"') && !homeSeoContent.includes("'use client'"),
  "src/components/seo/HomeSeoContent.tsx ต้องเป็น Server Component (ห้ามมี 'use client') (P-03)",
);

// 12. PERF: ต้องไม่มี middleware/proxy ที่รันทุกคำขอหน้าเว็บ
// เดิมด่านนี้บังคับให้ "ต้องมี" src/proxy.ts (S-02) — ถอดออกแล้วเพราะไม่มีใครอ่าน
// header `x-locale` ที่มันฉีดอีกต่อไป (ภาษาย้ายไปตัดสินฝั่ง client) เหลือไว้ = จ่าย
// ค่ารันโค้ดบน Worker ทุกคำขอหน้าเว็บฟรี ๆ
assert(
  !fs.existsSync(path.join(process.cwd(), "src/proxy.ts")) &&
  !fs.existsSync(path.join(process.cwd(), "src/middleware.ts")),
  "ห้ามมี src/proxy.ts หรือ src/middleware.ts — รันทุกคำขอบน Worker โดยไม่มีใครใช้ผลลัพธ์ (PERF)",
);

// 13. PERF: server.ts ต้องไม่มี getServerLocale ที่อ่าน headers()/cookies() อีก
// ไฟล์นี้ถูกลบทิ้งแล้ว (ไม่มีใคร import เลยตั้งแต่ S-02 ขึ้น) — ถ้ายังอยู่ต้องสะอาดตามเดิม
const serverI18nPath = path.join(process.cwd(), "src/lib/i18n/server.ts");
if (fs.existsSync(serverI18nPath)) {
  const serverI18nContent = stripComments(fs.readFileSync(serverI18nPath, "utf-8"));
  assert(
    !serverI18nContent.includes("getServerLocale") &&
    !serverI18nContent.includes('from "next/headers"'),
    "src/lib/i18n/server.ts ห้าม import next/headers หรือมี getServerLocale อีก (PERF)",
  );
}

// 14. PERF: หน้าแรกต้องเป็น static prerender — ห้ามดึง locale จากเซิร์ฟเวอร์
/* ⚠️ หน้าแรกย้ายไปเรนเดอร์ด้วย Astro แล้ว — ไฟล์หน้าอยู่ที่ `astro/pages/index.astro`
   ส่วนเนื้อหาที่ใช้ร่วมกันสองภาษายังอยู่ที่ `_shared/pages/home.tsx` เหมือนเดิม */
const homePagePath = path.join(process.cwd(), "astro/pages/index.astro");
const homePageContent = stripComments(fs.readFileSync(homePagePath, "utf-8"));
const homeBodyContent = stripComments(
  fs.readFileSync(path.join(process.cwd(), "src/app/_shared/pages/home.tsx"), "utf-8"),
);
/* A7-02: ตัวห่อ `HomePageBody` ฝั่ง Next ถูกลบแล้ว — เนื้อหา SEO หน้าแรกเรนเดอร์ผ่าน `HomeSeoRoot` ของ Astro */
const homeSeoRootContent = stripComments(
  fs.readFileSync(path.join(process.cwd(), "astro/components/HomeSeoRoot.tsx"), "utf-8"),
);
assert(
  !homePageContent.includes("getServerLocale()") &&
  !homeBodyContent.includes("getServerLocale()") &&
  homePageContent.includes("<HomeSeoRoot") &&
  homeSeoRootContent.includes('<HomeSeoContent isEnglish={locale === "en"} />'),
  "หน้าแรกห้ามเรียก getServerLocale() — ต้อง prerender ได้ และรับภาษาจากเส้นทางเท่านั้น (PERF)",
);
assert(
  homePageContent.includes('const locale = "th" as const;'),
  'astro/pages/index.astro ต้องกำหนด locale="th" เป็นค่าคงที่ (ห้ามคำนวณจากคำขอ)',
);
assert(
  fs.existsSync(path.join(process.cwd(), "astro/pages/en/index.astro")),
  "ต้องมีหน้าแรกภาษาอังกฤษที่ astro/pages/en/index.astro",
);

// 15. ✦ ไพ่ × 12 ราศี (`src/data/zodiac.ts`) — ข้อมูลหน้าราศีต้องเล่าเรื่องเดียวกับสารานุกรมไพ่
{
  assert(ZODIAC_SIGNS.length === 12, "ต้องมีราศีครบ 12 ราศี");
  assert(new Set(ZODIAC_SIGNS.map((s) => s.id)).size === 12, "slug ราศีห้ามซ้ำ");
  const cardById = new Map(CARD_SUMMARIES.map((c) => [c.id, c]));
  const suitOf = { fire: "wands", earth: "pentacles", air: "swords", water: "cups" } as const;
  /* สารานุกรมเขียน "ดาวพฤหัส" บางใบ "ดาวพฤหัสบดี" บางใบ — เทียบแบบตัดคำว่า "บดี" ทิ้ง */
  const norm = (t: string) => t.replace("ดาวพฤหัสบดี", "ดาวพฤหัส");
  const decanCards = ZODIAC_SIGNS.flatMap((s) => s.decans.map((d) => d.cardId));
  assert(new Set(decanCards).size === 36, "ไพ่ประจำช่วง (decan) ต้องครบ 36 ใบไม่ซ้ำกัน");
  for (const sign of ZODIAC_SIGNS) {
    const major = cardById.get(sign.majorCardId);
    assert(major?.astrology === sign.nameTh, `${sign.id}: ไพ่ประจำราศีต้องมี astrology = "${sign.nameTh}" (ได้ "${major?.astrology}")`);
    const ruler = cardById.get(sign.rulerCardId);
    assert(norm(ruler?.astrology ?? "") === norm(sign.rulerTh), `${sign.id}: ไพ่ดาวผู้ครองต้องตรงกับ astrology ของไพ่ (${sign.rulerCardId})`);
    for (const d of sign.decans) {
      const card = cardById.get(d.cardId);
      assert(
        !!card && card.suit === suitOf[sign.element] &&
          norm(card.astrology) === norm(`${d.planetTh}ใน${sign.nameTh}`),
        `${sign.id}: ${d.cardId} ต้องเป็น "${d.planetTh}ใน${sign.nameTh}" ชุด ${suitOf[sign.element]} (ได้ "${card?.astrology}")`,
      );
    }
    for (const [lang, copy] of [["th", sign.th], ["en", sign.en]] as const) {
      const text = Object.values(copy).join(" ");
      assert(!/[✦✨✧⭐🌟]|\p{Extended_Pictographic}/u.test(text), `${sign.id}.${lang}: ห้ามอิโมจิในข้อความ (กฎข้อ 2)`);
      if (lang === "en") assert(!/[฀-๿]/.test(text), `${sign.id}.en: ห้ามมีอักษรไทยหลุดในข้อความอังกฤษ`);
      else assert(/[฀-๿]/.test(copy.nature), `${sign.id}.th: ข้อความไทยต้องเป็นภาษาไทย`);
    }
  }

  // ทุกวันในปี (รวม 29 ก.พ.) ต้องได้ราศีเดียว และจุดรอยต่อต้องตรงตาราง
  const days = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let unmapped = 0;
  for (let m = 1; m <= 12; m++) for (let d = 1; d <= days[m - 1]; d++) if (!findZodiacByDate(ZODIAC_SIGNS, m, d)) unmapped++;
  assert(unmapped === 0, `ทุกวันในปีต้องหาราศีเจอ (หาไม่เจอ ${unmapped} วัน)`);
  const at = (m: number, d: number) => {
    const r = findZodiacByDate(ZODIAC_SIGNS, m, d);
    return r ? `${r.sign.id}:${r.decanIndex}` : "none";
  };
  for (const [m, d, want] of [
    [3, 21, "aries:0"], [4, 20, "aries:2"], [4, 21, "taurus:0"], [7, 21, "cancer:2"], [7, 22, "leo:0"],
    [12, 21, "sagittarius:2"], [12, 22, "capricorn:0"], [12, 31, "capricorn:1"], [1, 1, "capricorn:1"],
    [1, 19, "capricorn:2"], [1, 20, "aquarius:0"], [2, 29, "pisces:0"], [3, 1, "pisces:1"], [3, 20, "pisces:2"],
  ] as const) {
    assert(at(m, d) === want, `${d}/${m} ต้องได้ ${want} (ได้ ${at(m, d)})`);
  }
  // กฎข้อ 14 ฉบับราศี: วันที่ไม่มีจริงห้ามเดาราศีให้
  for (const [m, d] of [[2, 30], [4, 31], [13, 1], [0, 5], [6, 0]] as const) {
    assert(findZodiacByDate(ZODIAC_SIGNS, m, d) === undefined, `${d}/${m} ไม่มีจริง ต้องคืน undefined`);
  }
  const ranges = decanRanges(ZODIAC_SIGNS);
  const capRanges = ranges.get("capricorn");
  assert(
    capRanges?.[1]?.start.month === 12 && capRanges?.[1]?.end.month === 1 && capRanges?.[1]?.end.day === 9,
    "ช่วงที่ 2 ของมังกรต้องข้ามปี 31 ธ.ค. – 9 ม.ค.",
  );
  assert(ranges.get("aquarius")?.[2]?.end.day === 18, "ช่วงสุดท้ายของกุมภ์ต้องจบ 18 ก.พ.");

  // หน้าราศีต้องมีจริงทั้งสองภาษา + อยู่ใน sitemap
  for (const f of [
    "astro/pages/cards/zodiac.astro",
    "astro/pages/cards/zodiac/[sign].astro",
    "astro/pages/en/cards/zodiac.astro",
    "astro/pages/en/cards/zodiac/[sign].astro",
  ]) {
    assert(fs.existsSync(path.join(process.cwd(), f)), `ต้องมีหน้า ${f}`);
  }
  assert(sitemapUrls.has(`${SITE_ORIGIN}/cards/zodiac`), "sitemap ต้องมี /cards/zodiac");
  for (const sign of ZODIAC_SIGNS) {
    assert(sitemapUrls.has(`${SITE_ORIGIN}/cards/zodiac/${sign.id}`), `sitemap ต้องมี /cards/zodiac/${sign.id}`);
  }
}

console.log(`\n📊 ผลสรุปการทดสอบ: ผ่าน ${passed} ด่าน | ล้มเหลว ${failed} ด่าน\n`);

if (failed > 0) {
  process.exit(1);
}
