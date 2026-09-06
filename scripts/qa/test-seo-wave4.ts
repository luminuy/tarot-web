import fs from "node:fs";
import path from "node:path";
import { calculateBirthCard, reduceToTarotNumber } from "../../src/lib/tarot/birth-card";
import { ARTICLES } from "../../src/data/articles";
import sitemap from "../../src/app/sitemap";
import { SITE_ORIGIN } from "../../src/lib/config/site";

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
const birthCardPagePath = path.join(process.cwd(), "src/app/(th)/cards/birth-card/page.tsx");
assert(fs.existsSync(birthCardPagePath), "ต้องมีหน้า src/app/cards/birth-card/page.tsx");

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
  "src/app/(th)/cards/birth-card/page.tsx",
];
for (const file of wave4Files) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    const hasForbiddenEmoji = /[✦✨✧⭐🌟]/.test(content);
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

// 8. S-03: /account/layout.tsx must declare robots noindex
const accountLayoutPath = path.join(process.cwd(), "src/app/(th)/account/layout.tsx");
const accountLayoutContent = fs.readFileSync(accountLayoutPath, "utf-8");
assert(
  accountLayoutContent.includes("robots:") && accountLayoutContent.includes("index: false"),
  "src/app/account/layout.tsx ต้องประกาศ robots: { index: false } (S-03)",
);

// 9. S-04: /tarot must be redirected in next.config.ts and src/app/tarot must not exist
const tarotPageExists = fs.existsSync(path.join(process.cwd(), "src/app/(th)/tarot"));
assert(!tarotPageExists, "src/app/tarot ต้องถูกลบออก (ย้ายไป redirects ใน next.config.ts แทน)");
const nextConfigContent = fs.readFileSync(path.join(process.cwd(), "next.config.ts"), "utf-8");
assert(
  nextConfigContent.includes('source: "/tarot"') && nextConfigContent.includes('destination: "/"'),
  "next.config.ts ต้องมี redirect จาก /tarot ไปที่ / แบบ permanent (S-04)",
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
const serverI18nPath = path.join(process.cwd(), "src/lib/i18n/server.ts");
const serverI18nContent = stripComments(fs.readFileSync(serverI18nPath, "utf-8"));
assert(
  !serverI18nContent.includes("getServerLocale") &&
  !serverI18nContent.includes('from "next/headers"'),
  "src/lib/i18n/server.ts ห้าม import next/headers หรือมี getServerLocale อีก (PERF)",
);

// 14. PERF: หน้าแรกต้องเป็น static prerender — ห้ามดึง locale จากเซิร์ฟเวอร์
const homePagePath = path.join(process.cwd(), "src/app/(th)/page.tsx");
const homePageContent = stripComments(fs.readFileSync(homePagePath, "utf-8"));
const homeBodyContent = stripComments(
  fs.readFileSync(path.join(process.cwd(), "src/app/_shared/pages/home.tsx"), "utf-8"),
);
assert(
  !homePageContent.includes("getServerLocale()") &&
  !homeBodyContent.includes("getServerLocale()") &&
  homeBodyContent.includes("<HomeSeoContent isEnglish={isEnglish} />"),
  "หน้าแรกห้ามเรียก getServerLocale() — ต้อง prerender ได้ และรับภาษาจากเส้นทางเท่านั้น (PERF)",
);
assert(
  homePageContent.includes('HomePageBody locale="th"'),
  'src/app/(th)/page.tsx ต้องส่ง locale="th" เป็นค่าคงที่',
);

console.log(`\n📊 ผลสรุปการทดสอบ: ผ่าน ${passed} ด่าน | ล้มเหลว ${failed} ด่าน\n`);

if (failed > 0) {
  process.exit(1);
}
