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

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import sitemap from "../../src/app/sitemap";
import { ARTICLES } from "../../src/data/articles";
import { SPREAD_TOPICS } from "../../src/data/spread-topics";
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

// ── 1b. ทุกหมวดอังกฤษที่มีอยู่จริง ต้องมี section layout ของตัวเอง ────────
// บทเรียนจริง 2026-09-09 (INC-0110): ต้นไม้ `(en)` กับ `(th)` เป็น root layout คนละตัว
// ไม่ได้ใช้ layout ร่วมกันแม้แต่ชั้นเดียว ฝั่งไทยแขวนหัวเว็บ/ฟุตเตอร์ไว้ที่ layout ของ
// แต่ละหมวด (`(th)/cards/layout.tsx` ฯลฯ) ตอนสร้างต้นไม้อังกฤษก๊อปแต่ `page.tsx` มา
// หน้าอังกฤษ 115 หน้าจึงไม่มีหัวเว็บและไม่มีฟุตเตอร์เลย — เข้าเว็บมาแล้วไปไหนต่อไม่ได้
// และไม่มีลิงก์ภายในให้บอตเดินต่อสักเส้น
//
// ⚠️ ห้ามแก้ด้วยการยกไปไว้ที่ `(en)/en/layout.tsx` — ชั้นนั้นครอบหน้าแรก `/en`
// ซึ่งเรนเดอร์ <SiteHeader /> เองอยู่แล้วผ่าน TarotFlow จะได้หัวเว็บซ้อนสองอัน
const thSectionLayouts = fs
  .readdirSync(path.join(ROOT, TH_APP), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => fs.existsSync(path.join(ROOT, TH_APP, name, "layout.tsx")))
  .filter((name) =>
    fs.readFileSync(path.join(ROOT, TH_APP, name, "layout.tsx"), "utf-8").includes("<SiteHeader"),
  );

// ตรวจเฉพาะหมวดที่ "มีหน้าอังกฤษอยู่จริง" — หมวดที่ยังไม่มีฝาแฝด (เช่น /privacy) ไม่บังคับ
const enSectionsNeedingLayout = thSectionLayouts.filter((name) =>
  fs.existsSync(path.join(ROOT, EN_APP, name)),
);

for (const name of enSectionsNeedingLayout) {
  const file = path.join(ROOT, EN_APP, name, "layout.tsx");
  const source = fs.existsSync(file) ? fs.readFileSync(file, "utf-8") : "";
  check(
    `/en/${name} มี section layout ที่ให้หัวเว็บ + ฟุตเตอร์ (คู่แฝดของ (th)/${name}/layout.tsx)`,
    source.includes("<SiteHeader") && source.includes("<SiteFooter"),
    source ? "มีไฟล์แต่ไม่ได้เรนเดอร์ <SiteHeader /> + <SiteFooter />" : `ไม่มีไฟล์ ${EN_APP}/${name}/layout.tsx`,
  );
}
check(
  "หมวดอังกฤษที่ต้องมี layout ถูกตรวจครบ (ไม่ใช่ 0 หมวด)",
  enSectionsNeedingLayout.length > 0,
  `พบ ${enSectionsNeedingLayout.length} หมวด`,
);

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

for (const dynamicRoute of ["cards/[id]", "spreads/[id]", "blog/[slug]", "spreads/topic/[category]"]) {
  check(
    `มีหน้าอังกฤษของเส้นทางไดนามิก /en/${dynamicRoute}`,
    fs.existsSync(path.join(ROOT, EN_APP, dynamicRoute, "page.tsx")),
  );
}

// ── 3. หน้าที่ยัง "ไม่มี" ฝาแฝด ต้องไม่ถูกประกาศว่ามี ─────────────────────
// เนื้อหาบรรณาธิการของหน้าเหล่านี้ยังเป็นภาษาไทยล้วน — เปิดหน้าอังกฤษตอนนี้
// = thin content ซึ่งแย่กว่าไม่มีหน้าเลย
for (const withoutTwin of ["/privacy", "/cards/birth-card", "/account"]) {
  check(`${withoutTwin} ต้องไม่ประกาศว่ามีฝาแฝดอังกฤษ`, !hasEnglishTwin(withoutTwin));
  check(`ลิงก์ ${withoutTwin} ในหน้าอังกฤษต้องไม่ถูกเติม /en`, localeHref(withoutTwin, "en") === withoutTwin);
  const rel = withoutTwin === "/" ? "" : withoutTwin;
  check(
    `ต้องไม่มีไฟล์หน้าอังกฤษของ ${withoutTwin} หลงเหลืออยู่`,
    !fs.existsSync(path.join(ROOT, EN_APP, rel, "page.tsx")),
  );
}

// หน้าที่ "มี" ฝาแฝดใหม่ ต้องประกาศครบ
for (const withTwin of ["/blog", "/blog/how-to-ask-tarot-questions", "/spreads/topic/love"]) {
  check(`${withTwin} ประกาศว่ามีฝาแฝดอังกฤษ`, hasEnglishTwin(withTwin));
  check(`ลิงก์ ${withTwin} ในหน้าอังกฤษถูกเติม /en`, localeHref(withTwin, "en") === `/en${withTwin}`);
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
const soloAlternates = buildAlternates("/privacy", { locale: "th" });
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
  "src/app/(th)/blog/BlogIndexClient.tsx",
  "src/app/(th)/blog/[slug]/ArticleReadingClient.tsx",
  "src/components/spread/TopicSpreadList.tsx",
];
for (const file of MUST_USE_LOCALE_LINK) {
  const source = fs.readFileSync(path.join(ROOT, file), "utf-8");
  check(
    `${file} ใช้ LocaleLink แทน next/link ตรง ๆ`,
    source.includes("@/components/ui/LocaleLink") && !source.includes('import Link from "next/link"'),
  );
}

// ── 7. ตรวจสอบคุณภาพคำแปลบทความและหมวดผัง (D-4) ───────────────────────────
const thaiCharRegex = /[\u0E00-\u0E7F]/;

for (const article of ARTICLES) {
  if (article.contentEn) {
    check(
      `บทความ ${article.slug} มี contentEn และประกาศฝาแฝดอังกฤษ`,
      hasEnglishTwin(`/blog/${article.slug}`),
    );
    const thH2Count = (article.content.match(/## /g) || []).length;
    const enH2Count = (article.contentEn.match(/## /g) || []).length;
    check(
      `บทความ ${article.slug} มีจำนวนหัวข้อ ## เท่ากัน (${thH2Count} หัวข้อ)`,
      thH2Count === enH2Count,
      `th: ${thH2Count}, en: ${enH2Count}`,
    );
    check(
      `บทความ ${article.slug} contentEn ไม่มีอักขระไทย`,
      !thaiCharRegex.test(article.contentEn),
    );
    if (article.titleEn) {
      check(
        `บทความ ${article.slug} titleEn ไม่มีอักขระไทย`,
        !thaiCharRegex.test(article.titleEn),
      );
    }
  } else {
    check(
      `บทความ ${article.slug} ยังไม่มี contentEn ต้องไม่มีฝาแฝด`,
      !hasEnglishTwin(`/blog/${article.slug}`),
    );
  }
}

for (const topic of Object.values(SPREAD_TOPICS)) {
  check(
    `หมวดผัง ${topic.slug} ประกาศฝาแฝดอังกฤษ`,
    hasEnglishTwin(`/spreads/topic/${topic.slug}`),
  );
  if (topic.nameEn) {
    check(
      `หมวดผัง ${topic.slug} nameEn ไม่มีอักขระไทย`,
      !thaiCharRegex.test(topic.nameEn),
    );
  }
  if (topic.editorialIntroEn) {
    check(
      `หมวดผัง ${topic.slug} editorialIntroEn ไม่มีอักขระไทย`,
      !thaiCharRegex.test(topic.editorialIntroEn.join(" ")),
    );
  }
}

// ── 7. หน้าอังกฤษต้องไม่มีภาษาไทยหลุดปน ────────────────────────────────────
// บทเรียนจริง 2026-09-07: หลังเปิด `/en/blog` และ `/en/spreads/topic/*` พบภาษาไทย
// หลุดไปอยู่ในหน้าอังกฤษถึง **79 หน้า** (สูงสุด 14.7% ของข้อความทั้งหน้า)
// สาเหตุคนละจุดกันหมด — ป้ายคีย์เวิร์ดที่มีแต่ไทย · ชื่อหมวดที่ไม่มี `nameEn` ·
// ชื่อไพ่ไทยที่โชว์เป็นบรรทัดรอง — พิสูจน์ว่า "ตรวจจากโค้ด" อย่างเดียวจับไม่ได้
// ต้องวัดจาก HTML ที่ build ออกมาจริงเท่านั้น
//
// เกณฑ์ 1.5% เผื่อไว้ให้ชื่อไพ่ไทยที่แสดงเป็น alternateName บนหน้ารายละเอียดไพ่
// ซึ่งเป็นข้อมูลอ้างอิงสองภาษาที่ตั้งใจให้มี ไม่ใช่การแปลตกหล่น
const MAX_THAI_RATIO_PERCENT = 1.5;

// ── 7b. รูรั่วของเกณฑ์ "สัดส่วน" ที่ทำให้ด่านนี้ตกไม่ได้ (UX-17) ──────────────
// บทเรียนจริง 2026-09-12: คำว่า "คำถามที่พบบ่อย (FAQ)" โผล่กลางหน้า /en/daily
// และ /en/love/1-card อยู่หลายวัน ขณะที่ด่านนี้ผ่านเขียวตลอด
//
// เหตุผลคือเกณฑ์เป็น **สัดส่วนต่อทั้งหน้า** — หัวข้อไทยหนึ่งบรรทัดบนหน้าอังกฤษยาว ๆ
// คิดเป็นราว 0.1% เท่านั้น จึงไม่มีทางแตะเพดาน 1.5% ไม่ว่าจะรั่วกี่จุดก็ตาม
// เกณฑ์สัดส่วนจับได้แค่ "หน้าที่ยังไม่ได้แปลทั้งหน้า" ซึ่งเป็นปัญหาคนละแบบกัน
//
// จึงเพิ่มเกณฑ์ที่สองแบบ allowlist: คำไทยที่ยาวพอจะเป็น "ข้อความ" จริง ๆ
// ต้องอยู่ในรายการที่ขึ้นทะเบียนไว้เท่านั้น ถ้าไม่อยู่ = ตกทันทีแม้จะยาวบรรทัดเดียว
//
// ⚠️ เวลาจะเพิ่มรายการใหม่ ต้องเขียนเหตุผลกำกับเสมอว่าทำไมคำไทยนั้น "ต้องมี"
// ในหน้าอังกฤษ ห้ามเติมเพื่อให้ด่านผ่านเฉย ๆ
const INTENTIONAL_THAI_ON_EN: { text: string; reason: string }[] = [
  { text: "ไพ่ยิปซี", reason: "คำไทยที่บทความอังกฤษอธิบายความหมายให้ผู้อ่านต่างชาติโดยตั้งใจ" },
  { text: "สลับภาษา", reason: "ป้ายปุ่มสลับภาษา เขียนคู่กันสองภาษาเป็นดีไซน์ตั้งใจ" },
  { text: "ทาโรต์", reason: "คำทับศัพท์ไทยที่บทความอังกฤษยกมาอธิบายคู่กับคำอังกฤษ" },
];

/** คำไทยที่ "ยาวพอจะเป็นข้อความจริง" — สั้นกว่านี้มักเป็นเศษอักขระในชื่อไฟล์/สคริปต์ */
const THAI_PHRASE_MIN_CHARS = 4;

/**
 * ดึงวลีไทยที่ยังไม่ได้ขึ้นทะเบียนออกมาจากหน้าอังกฤษหนึ่งหน้า
 * ตรวจทั้งเนื้อความและแอตทริบิวต์ที่ผู้ใช้ "ได้ยิน" (aria-label · alt · title · placeholder)
 * เพราะ `aria-label` ภาษาไทยบนหน้าอังกฤษคือรอยรั่วที่ผู้ใช้ screen reader เจอเต็ม ๆ
 * แต่เกณฑ์สัดส่วนเดิมมองไม่เห็นเลยสักตัว
 */
function unregisteredThaiPhrases(htmlFile: string): string[] {
  const html = fs.readFileSync(htmlFile, "utf-8");
  const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/g, "");

  const attrValues = [...withoutScripts.matchAll(/(?:aria-label|alt|title|placeholder)="([^"]*)"/g)].map(
    (m) => m[1],
  );
  const bodyText = withoutScripts.replace(/<[^>]+>/g, " ");

  const phrases = new Set<string>();
  for (const chunk of [bodyText, ...attrValues]) {
    for (const m of chunk.matchAll(/[\u0E00-\u0E7F][\u0E00-\u0E7F\s]*/g)) {
      const phrase = m[0].trim();
      if (phrase.replace(/\s/g, "").length < THAI_PHRASE_MIN_CHARS) continue;
      if (INTENTIONAL_THAI_ON_EN.some((entry) => phrase.includes(entry.text))) continue;
      phrases.add(phrase.slice(0, 60));
    }
  }
  return [...phrases];
}

function ensureBuildExists(): void {
  const buildManifest = path.join(ROOT, ".next/build-manifest.json");
  if (!fs.existsSync(buildManifest)) {
    console.log("\n📦 ไม่พบไฟล์ผลลัพธ์ build — กำลังรัน npm run build...");
    execSync("npm run build", { cwd: ROOT, stdio: "inherit" });
  }
}

function collectHtml(dir: string, acc: string[]): string[] {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectHtml(full, acc);
    else if (entry.name.endsWith(".html")) acc.push(full);
  }
  return acc;
}

/** สัดส่วนอักขระไทยในเนื้อหาที่ผู้อ่านเห็นจริง (ตัด <script> และแท็กออกก่อน) */
function thaiRatioPercent(htmlFile: string): number {
  const html = fs.readFileSync(htmlFile, "utf-8");
  const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/g, "");
  const text = withoutScripts.replace(/<[^>]+>/g, " ");
  const thai = (text.match(/[\u0E00-\u0E7F]/g) ?? []).length;
  const visible = (text.match(/\S/g) ?? []).length;
  return visible === 0 ? 0 : (100 * thai) / visible;
}

ensureBuildExists();

const englishHtml = collectHtml(path.join(ROOT, ".next/server/app/en"), []);
const englishRoot = path.join(ROOT, ".next/server/app/en.html");
if (fs.existsSync(englishRoot)) englishHtml.push(englishRoot);

check("build มีหน้าอังกฤษให้ตรวจ (อย่างน้อย 100 หน้า)", englishHtml.length >= 100, `พบ ${englishHtml.length}`);

// ทุกหน้าอังกฤษที่ build ออกมาต้องมีหัวเว็บจริงใน HTML ดิบ (INC-0110)
// ตรวจ artifact ไม่ใช่ source — เพราะบั๊กรอบนี้เกิดจาก "โครง layout ที่หายไป"
// ซึ่งอ่านจาก page.tsx อย่างเดียวมองไม่เห็นเลย
// ⚠️ ต้องจับ **แอตทริบิวต์** `data-site-header="` เท่านั้น ห้ามใช้ includes("data-site-header")
// เฉย ๆ — สตริงนั้นไปตรงกับ `data-site-header-spacer=""` และกฎ CSS ที่ inline มาในหน้าด้วย
// ด่านจึงผ่านทั้งที่หัวเว็บหายไปจริง (พลาดมาแล้วตอนทดสอบด่านรอบนี้)
const headerless = englishHtml
  .filter((file) => !fs.readFileSync(file, "utf-8").includes('data-site-header="'))
  .map((file) => path.relative(path.join(ROOT, ".next/server/app"), file));

check(
  "ทุกหน้าอังกฤษที่ build ออกมามีหัวเว็บอยู่ใน HTML ดิบ",
  headerless.length === 0,
  headerless.length ? `${headerless.length} หน้าไม่มีหัวเว็บ · เช่น ${headerless.slice(0, 3).join(", ")}` : undefined,
);

const leaking = englishHtml
  .map((file) => ({ file: path.relative(path.join(ROOT, ".next/server/app"), file), ratio: thaiRatioPercent(file) }))
  .filter((entry) => entry.ratio > MAX_THAI_RATIO_PERCENT)
  .sort((a, b) => b.ratio - a.ratio);

check(
  `ไม่มีหน้าอังกฤษที่มีภาษาไทยเกิน ${MAX_THAI_RATIO_PERCENT}% ของเนื้อหา`,
  leaking.length === 0,
  leaking.length ? `${leaking.length} หน้า · หนักสุด ${leaking[0].file} ${leaking[0].ratio.toFixed(1)}%` : undefined,
);
for (const entry of leaking.slice(0, 10)) {
  console.log(`      ↳ ${entry.file} — ${entry.ratio.toFixed(1)}%`);
}

// เกณฑ์ที่สอง — จับวลีไทยแม้จะมีจุดเดียวในหน้า (รูรั่วของเกณฑ์สัดส่วน · UX-17)
const phraseLeaks = englishHtml
  .map((file) => ({
    file: path.relative(path.join(ROOT, ".next/server/app"), file),
    phrases: unregisteredThaiPhrases(file),
  }))
  .filter((entry) => entry.phrases.length > 0);

check(
  "ไม่มีวลีภาษาไทยที่ไม่ได้ขึ้นทะเบียนในหน้าอังกฤษ (รวม aria-label · alt · title · placeholder)",
  phraseLeaks.length === 0,
  phraseLeaks.length
    ? `${phraseLeaks.length} หน้า · เช่น ${phraseLeaks[0].file} → "${phraseLeaks[0].phrases[0]}"`
    : undefined,
);
for (const entry of phraseLeaks.slice(0, 10)) {
  console.log(`      ↳ ${entry.file} — ${entry.phrases.slice(0, 3).map((p) => `"${p}"`).join(", ")}`);
}

console.log("");
if (failures > 0) {
  console.error(`❌ ล้มเหลว ${failures} ข้อ — เส้นทางสองภาษายังไม่สอดคล้องกัน\n`);
  process.exit(1);
}
console.log("✅ เส้นทางสองภาษาสอดคล้องกันทั้งหมด (ไฟล์จริง · hreflang · sitemap · ลิงก์ภายใน)\n");
