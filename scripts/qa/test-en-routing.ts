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
import { collectRenderedPages, renderedRouteMap } from "./lib/rendered-pages";
import { assertNonEmptyCorpus } from "./lib/corpus";

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
/* ── 2. ทุกเส้นทางที่ประกาศว่ามีฝาแฝด ต้องมี "หน้าที่เรนเดอร์ออกมาจริง" ──────
 *
 * ⚠️ เดิมด่านนี้เช็กว่ามีไฟล์ `page.tsx` อยู่ตรงนั้นไหม — ซึ่งผูกกับ Next.js
 *    ตั้งแต่หน้าเนื้อหาบางกลุ่มย้ายไปเรนเดอร์ด้วย Astro ไฟล์ต้นทางอยู่คนละที่กันแล้ว
 *    และ "มีไฟล์" ก็ไม่เคยพิสูจน์ว่า "หน้าออกมาจริง" อยู่ดี (ไฟล์พังก็ยังมีไฟล์อยู่)
 *    ตอนนี้เช็กจากผลลัพธ์ที่บิลด์ออกมาจริงทุกเครื่องมือ ผ่าน lib/rendered-pages.ts
 */
const routeMap = renderedRouteMap();
assertNonEmptyCorpus("เส้นทางที่เรนเดอร์แล้ว", routeMap, "รัน `npm run build` ก่อน");

for (const route of EN_TWIN_ROUTES) {
  const englishRoute = route === "/" ? "/en" : `/en${route}`;
  check(`มีหน้าอังกฤษที่เรนเดอร์ออกมาจริงสำหรับ ${englishRoute}`, routeMap.has(englishRoute));
  check(`มีหน้าไทยคู่กันที่เรนเดอร์ออกมาจริงสำหรับ ${route}`, routeMap.has(route));
}

/* ── 1b. หน้าอังกฤษต้องมีหัวเว็บ/ฟุตเตอร์ "เท่ากับ" ฝาแฝดไทยเสมอ ─────────────
 *
 * ⚠️ เดิมด่านนี้ไล่อ่านไฟล์ `layout.tsx` ของแต่ละหมวดในต้นไม้ `(en)` เพื่อดูว่า
 *    เรนเดอร์ `<SiteHeader />` + `<SiteFooter />` ไหม — ผูกกับทั้ง Next.js และ
 *    วิธีจัดโฟลเดอร์ · พอหน้าเนื้อหาย้ายไป Astro หมด หมวดที่เหลือให้ตรวจกลายเป็น **ศูนย์**
 *    (ด่านย่อย "ถูกตรวจครบ ไม่ใช่ 0 หมวด" จับได้ ซึ่งเป็นเหตุผลที่มันถูกใส่ไว้ตั้งแต่แรก)
 *
 * ตอนนี้เทียบจาก **HTML ที่เรนเดอร์ออกมาจริง** แทน: หน้าไทยกับหน้าอังกฤษของคู่เดียวกัน
 * ต้องมีหัวเว็บและฟุตเตอร์ "เหมือนกัน" — จับได้ทั้งกรณีอังกฤษขาด และกรณีไทยขาด
 * และไม่สนใจว่าใครเป็นคนเรนเดอร์
 */
const chromeOf = (route: string): { header: boolean; footer: boolean } | null => {
  const page = routeMap.get(route);
  if (!page) return null;
  const html = fs.readFileSync(page.file, "utf-8");
  return { header: html.includes('data-site-header="'), footer: html.includes("<footer") };
};

let chromePairsChecked = 0;
for (const route of EN_TWIN_ROUTES) {
  const thai = chromeOf(route);
  const english = chromeOf(route === "/" ? "/en" : `/en${route}`);
  if (!thai || !english) continue;
  chromePairsChecked += 1;
  check(
    `/en${route === "/" ? "" : route} มีหัวเว็บ/ฟุตเตอร์เท่ากับฝาแฝดไทย`,
    thai.header === english.header && thai.footer === english.footer,
    `ไทย: header=${thai.header} footer=${thai.footer} · อังกฤษ: header=${english.header} footer=${english.footer}`,
  );
}
check(
  "มีคู่ไทย–อังกฤษให้เทียบหัวเว็บ/ฟุตเตอร์จริง (ไม่ใช่ 0 คู่)",
  chromePairsChecked > 0,
  `พบ ${chromePairsChecked} คู่`,
);


/* เส้นทางไดนามิก — ต้องมีลูกอย่างน้อยหนึ่งใบโผล่ออกมาจริงในต้นไม้อังกฤษ */
for (const [label, prefix] of [
  ["/en/cards/[id]", "/en/cards/"],
  ["/en/spreads/[id]", "/en/spreads/"],
  ["/en/blog/[slug]", "/en/blog/"],
  ["/en/spreads/topic/[category]", "/en/spreads/topic/"],
] as const) {
  const count = [...routeMap.keys()].filter((r) => r.startsWith(prefix)).length;
  check(`มีหน้าอังกฤษของเส้นทางไดนามิก ${label}`, count > 0, `พบ ${count} หน้า`);
}

// ── 3. หน้าที่ยัง "ไม่มี" ฝาแฝด ต้องไม่ถูกประกาศว่ามี ─────────────────────
// เนื้อหาบรรณาธิการของหน้าเหล่านี้ยังเป็นภาษาไทยล้วน — เปิดหน้าอังกฤษตอนนี้
// = thin content ซึ่งแย่กว่าไม่มีหน้าเลย
for (const withoutTwin of ["/account"]) {
  check(`${withoutTwin} ต้องไม่ประกาศว่ามีฝาแฝดอังกฤษ`, !hasEnglishTwin(withoutTwin));
  check(`ลิงก์ ${withoutTwin} ในหน้าอังกฤษต้องไม่ถูกเติม /en`, localeHref(withoutTwin, "en") === withoutTwin);
  const rel = withoutTwin === "/" ? "" : withoutTwin;
  check(
    `ต้องไม่มีไฟล์หน้าอังกฤษของ ${withoutTwin} หลงเหลืออยู่`,
    !fs.existsSync(path.join(ROOT, EN_APP, rel, "page.tsx")),
  );
}

// หน้าที่ "มี" ฝาแฝดใหม่ ต้องประกาศครบ
for (const withTwin of ["/blog", "/blog/how-to-ask-tarot-questions", "/spreads/topic/love", "/cards/birth-card", "/privacy", "/contact"]) {
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
const soloAlternates = buildAlternates("/account", { locale: "th" });
check(
  "หน้าที่ไม่มีฝาแฝด ต้องไม่มี languages เลย (ไม่ประกาศสิ่งที่ไม่มีจริง)",
  !("languages" in soloAlternates),
);
check(
  "canonical ของหน้าอังกฤษชี้มาที่ /en เอง",
  buildAlternates("/cards", { locale: "en", englishTwin: true }).canonical === `${SITE_ORIGIN}/en/cards`,
);

/* ── 4b. ทั้งสองฝั่งของทุกคู่ ต้องประกาศ hreflang ชี้กันไป-กลับ ─────────────
 *
 * Google ต้องเห็นคำประกาศชี้กันไป-กลับ ขาดข้างเดียวมันจะทิ้งทั้งคู่
 * เคยพลาดจริงตอนทำ: `/en/daily` ประกาศคู่ แต่ `/daily` ฝั่งไทยลืมเปิด englishTwin
 *
 * ⚠️ เดิมด่านนี้ไล่อ่านซอร์สหา `englishTwin: true` — ผูกกับทั้ง Next.js และวิธีเขียนโค้ด
 *    ตอนนี้ตรวจจาก **HTML ที่เรนเดอร์ออกมาจริง** แทน ซึ่งคือสิ่งที่ Google เห็นจริง ๆ
 *    แข็งแรงกว่าเดิมด้วย เพราะจับได้แม้ประกาศถูกแต่ถูกอะไรบางอย่างทับหายไปตอนเรนเดอร์
 */
function hreflangHrefs(route: string): string[] {
  const page = routeMap.get(route);
  if (!page) return [];
  const html = fs.readFileSync(page.file, "utf-8");
  return [...html.matchAll(/<link[^>]+rel="alternate"[^>]*>/gi)]
    .map((m) => m[0])
    .filter((tag) => /hreflang=/i.test(tag))
    .map((tag) => tag.match(/href="([^"]+)"/i)?.[1] ?? "")
    .filter(Boolean);
}

// ฝาแฝดที่ทั้งคู่ noindex (หน้าส่วนตัว) — ไม่ประกาศ hreflang โดยตั้งใจ · เช็กแทนว่า noindex ไม่หาย
const NOINDEX_TWIN_ROUTES: readonly string[] = ["/journal"];

for (const route of EN_TWIN_ROUTES) {
  const thaiRoute = route;
  const englishRoute = route === "/" ? "/en" : `/en${route}`;
  if (NOINDEX_TWIN_ROUTES.includes(route)) {
    for (const current of [thaiRoute, englishRoute]) {
      const page = routeMap.get(current);
      const html = page ? fs.readFileSync(page.file, "utf-8") : "";
      check(
        `${current} เป็นหน้า noindex และไม่ประกาศ hreflang (ฝาแฝดส่วนตัว)`,
        /<meta[^>]+name="robots"[^>]*noindex/i.test(html) && hreflangHrefs(current).length === 0,
      );
    }
    continue;
  }
  const thaiUrl = `${SITE_ORIGIN}${thaiRoute === "/" ? "" : thaiRoute}`;
  const englishUrl = `${SITE_ORIGIN}${englishRoute}`;

  for (const [label, current] of [
    [`(th)${thaiRoute}`, thaiRoute],
    [`(en)${thaiRoute}`, englishRoute],
  ] as const) {
    const hrefs = hreflangHrefs(current);
    check(
      `${label} ประกาศ hreflang ชี้กันครบสองทาง (ไทย ↔ อังกฤษ)`,
      hrefs.includes(thaiUrl) && hrefs.includes(englishUrl),
      hrefs.length ? hrefs.join(" · ") : "ไม่มีแท็ก hreflang เลย",
    );
  }
}

// ── 5. sitemap ต้องมีคู่ครบและชี้กันไป-กลับ ────────────────────────────────
const entries = sitemap();
const urls = new Set(entries.map((entry) => entry.url));
check("sitemap ไม่มี ?lang= หลงเหลือ", !entries.some((entry) => entry.url.includes("?lang=")));
{
  // B3-03: คู่ไทย/อังกฤษที่ hreflang ผูกกันต้องมี lastmod เท่ากัน · B3-02: ไม่มีหน้าไหนเก่ากว่าแม่แบบทั้งเว็บ
  const { SITE_TEMPLATE_UPDATED_AT, formatPageDate } = await import("../../src/lib/seo/lastmod");
  check(
    "B3-04: วันที่ที่มองเห็นตามนาฬิกาไทย (ข้ามเที่ยงคืน UTC ถูกวัน · เดือนถูก)",
    formatPageDate("2026-10-16T18:00:00Z", false) === "17 ต.ค. 2569" && formatPageDate("2026-01-31T16:59:00Z", true) === "Jan 31, 2026",
  );
  const byUrl = new Map(entries.map((e) => [e.url, e.lastModified ? new Date(e.lastModified).getTime() : 0]));
  const mismatched = entries
    .filter((e) => e.url.startsWith(`${SITE_ORIGIN}/en`))
    .filter((e) => {
      const th = e.url.replace(`${SITE_ORIGIN}/en`, SITE_ORIGIN) || SITE_ORIGIN;
      return byUrl.has(th) && byUrl.get(th) !== byUrl.get(e.url);
    })
    .map((e) => e.url.replace(SITE_ORIGIN, ""));
  check("B3-03: คู่ไทย/อังกฤษใน sitemap มี lastmod เท่ากันทุกคู่", mismatched.length === 0, mismatched.slice(0, 5).join(" · "));
  const floor = new Date(SITE_TEMPLATE_UPDATED_AT).getTime();
  const stale = entries.filter((e) => (e.lastModified ? new Date(e.lastModified).getTime() : 0) < floor).map((e) => e.url.replace(SITE_ORIGIN, ""));
  check("B3-02: ไม่มี lastmod เก่ากว่าวันแม่แบบทั้งเว็บ (UI 2.0)", stale.length === 0, stale.slice(0, 5).join(" · "));
}

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
  "src/components/spread/SpreadCard.tsx",
  "src/components/spread/SpreadDetailClient.tsx",
  "src/components/home/TarotFlow.tsx",
  "src/components/blog/BlogIndexClient.tsx",
  "src/components/blog/ArticleReadingClient.tsx",
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
  {
    text: "ภาษาไทย",
    reason:
      "ชื่อภาษาไทยในตัวเลือกภาษาของหัวเว็บ — มาตรฐานสากลเขียนชื่อภาษาด้วยภาษาของมันเอง (endonym) ให้คนไทยที่หลงมาหน้าอังกฤษหาเจอ · ติด lang=\"th\"",
  },
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

/* หน้าอังกฤษทั้งหมดที่เรนเดอร์ออกมาจริง — รวมทุกเครื่องมือเรนเดอร์ */
const englishPages = collectRenderedPages().filter(
  (page) => page.route === "/en" || page.route.startsWith("/en/"),
);
assertNonEmptyCorpus("หน้าอังกฤษที่เรนเดอร์แล้ว", englishPages, "รัน `npm run build` ก่อน");
const englishHtml = englishPages.map((page) => page.file);
const routeOf = new Map(englishPages.map((page) => [page.file, page.route]));
const relOf = (file: string) => routeOf.get(file) ?? file;

check("build มีหน้าอังกฤษให้ตรวจ (อย่างน้อย 100 หน้า)", englishHtml.length >= 100, `พบ ${englishHtml.length}`);

// ทุกหน้าอังกฤษที่ build ออกมาต้องมีหัวเว็บจริงใน HTML ดิบ (INC-0110)
// ตรวจ artifact ไม่ใช่ source — เพราะบั๊กรอบนี้เกิดจาก "โครง layout ที่หายไป"
// ซึ่งอ่านจาก page.tsx อย่างเดียวมองไม่เห็นเลย
// ⚠️ ต้องจับ **แอตทริบิวต์** `data-site-header="` เท่านั้น ห้ามใช้ includes("data-site-header")
// เฉย ๆ — สตริงนั้นไปตรงกับ `data-site-header-spacer=""` และกฎ CSS ที่ inline มาในหน้าด้วย
// ด่านจึงผ่านทั้งที่หัวเว็บหายไปจริง (พลาดมาแล้วตอนทดสอบด่านรอบนี้)
const headerless = englishHtml
  .filter((file) => !fs.readFileSync(file, "utf-8").includes('data-site-header="'))
  .map(relOf);

check(
  "ทุกหน้าอังกฤษที่ build ออกมามีหัวเว็บอยู่ใน HTML ดิบ",
  headerless.length === 0,
  headerless.length ? `${headerless.length} หน้าไม่มีหัวเว็บ · เช่น ${headerless.slice(0, 3).join(", ")}` : undefined,
);

const leaking = englishHtml
  .map((file) => ({ file: relOf(file), ratio: thaiRatioPercent(file) }))
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
    file: relOf(file),
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

// ── ลิงก์ภายในใน HTML ที่บิลด์จริง (ผลตรวจ 2026-09-23 · A6-03 · A6-07 · A6-09) ────
{
  const allPages = collectRenderedPages();
  const knownRoutes = new Set(allPages.map((p) => p.route));
  const redirectSources = new Set(
    (fs.existsSync(path.join(ROOT, "public/_redirects"))
      ? fs.readFileSync(path.join(ROOT, "public/_redirects"), "utf-8").split("\n")
      : []
    )
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"))
      .map((l) => l.split(/\s+/)[0]),
  );
  // เส้นที่ Worker เป็นคนตอบ (ไม่มีไฟล์ static) — ดู run_worker_first ใน wrangler.jsonc
  const WORKER_PREFIXES = ["/api/", "/admin", "/readers", "/reset-password", "/s/", "/tester", "/_next/"];
  const isStaticFile = (href: string) =>
    /\.[a-z0-9]{2,5}$/i.test(href) &&
    ["public", "dist"].some((dir) => fs.existsSync(path.join(ROOT, dir, decodeURIComponent(href))));

  const broken = new Map<string, string>();
  const crossLocale = new Map<string, string>();
  const jsonLdThai = new Map<string, string>();
  for (const page of allPages) {
    const html = fs.readFileSync(page.file, "utf-8");
    for (const tag of html.matchAll(/<a\b[^>]*>/g)) {
      const m = tag[0].match(/\shref="(\/[^"#?]*)/);
      if (!m) continue;
      const href = m[1].replace(/\/$/, "") || "/";
      // ลิงก์ที่ประกาศ hreflang = ลิงก์ไปฉบับภาษาอื่น "โดยตั้งใจ" (ตัวเลือกภาษาในหัวเว็บ) — ไม่ใช่ลิงก์หลงต้นไม้ภาษา
      const declaredAlternate = /\shreflang="/i.test(tag[0]);
      if (href.startsWith("//")) continue;
      const ok =
        knownRoutes.has(href) ||
        redirectSources.has(href) ||
        WORKER_PREFIXES.some((p) => href.startsWith(p)) ||
        isStaticFile(href);
      if (!ok && !broken.has(href)) broken.set(href, page.route);
      const isEnPage = page.route === "/en" || page.route.startsWith("/en/");
      if (isEnPage && !declaredAlternate && !href.startsWith("/en") && hasEnglishTwin(href) && !crossLocale.has(`${page.route} ➔ ${href}`)) {
        crossLocale.set(`${page.route} ➔ ${href}`, page.route);
      }
    }
    if (page.route === "/en" || page.route.startsWith("/en/")) {
      for (const block of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
        for (const u of block[1].matchAll(new RegExp(`"(?:url|item|@id)":"${SITE_ORIGIN.replace(/[.]/g, "\\.")}(\\/[^"]*)?"`, "g"))) {
          const p = (u[1] ?? "/").replace(/\\\//g, "/").replace(/#.*$/, "") || "/";
          // "/" = url ของ Organization/WebSite (ตัวตนของเว็บ ไม่ใช่หน้า) — ไม่นับ
          if (p !== "/" && !p.startsWith("/en") && !/\.[a-z]{3,4}$/i.test(p) && hasEnglishTwin(p)) jsonLdThai.set(`${page.route} ➔ ${p}`, page.route);
        }
      }
    }
  }
  check(
    "A6-03: ลิงก์ภายในทุกเส้นใน HTML ที่บิลด์จริงชี้หน้าที่มีอยู่ (ไม่มีลิงก์ 404)",
    broken.size === 0,
    broken.size ? [...broken].slice(0, 6).map(([h, from]) => `${h} (จาก ${from})`).join(" · ") : undefined,
  );
  check(
    "A6-09: หน้าอังกฤษไม่ลิงก์ข้ามไปหน้าไทยที่มีฝาแฝดอังกฤษ",
    crossLocale.size === 0,
    crossLocale.size ? `${crossLocale.size} ลิงก์ · เช่น ${[...crossLocale.keys()].slice(0, 4).join(" · ")}` : undefined,
  );
  check(
    "A6-07: JSON-LD ของหน้าอังกฤษไม่ชี้ URL ไทยที่มีฝาแฝดอังกฤษ",
    jsonLdThai.size === 0,
    jsonLdThai.size ? `${jsonLdThai.size} จุด · เช่น ${[...jsonLdThai.keys()].slice(0, 4).join(" · ")}` : undefined,
  );
}

/* ── 7b. ลิงก์ fragment (`href="#x"` หรือ `href="/path#x"`) ต้องมี `id="x"` ในหน้าปลายทางจริง (A7-07 · A7-08) ──
 * เคยพลาด: สารบัญบทความ 60 หน้ากดแล้วไม่เลื่อน (`<h2>` ไม่มี id) · ลิงก์ข้ามไปเนื้อหาของหน้าสร้างผังไม่มีเป้าหมาย
 * ข้าม fragment ที่ JS ใช้จัดการเอง (`#` ว่าง · `#!`) */
{
  const pages = collectRenderedPages();
  const htmlOf = new Map<string, string>();
  const routeKey = (r: string) => (r.length > 1 && r.endsWith("/") ? r.slice(0, -1) : r);
  for (const page of pages) htmlOf.set(routeKey(page.route), fs.readFileSync(page.file, "utf-8"));
  const hasId = (html: string, id: string) =>
    html.includes(`id="${id}"`) || html.includes(`id='${id}'`) || html.includes(`name="${id}"`);
  const dead = new Map<string, string>();
  // สตูดิโอแม่หมอ (noindex · วาดทั้งหน้าฝั่งไคลเอนต์ — `<main>` เกิดหลังโหลด) ยังไม่มีเป้าหมายใน HTML ดิบ · เจ้าของโค้ด: ระบบแม่หมอ ➔ ตามแก้แล้วลบบรรทัดนี้
  const FRAGMENT_PENDING = new Set(["/readers/studio#main-content"]);
  for (const page of pages) {
    const html = htmlOf.get(routeKey(page.route)) ?? "";
    for (const m of html.matchAll(/<a\b[^>]*?\shref="([^"]*#[^"]+)"/g)) {
      const [pathPart, frag] = m[1].split("#");
      if (!frag || frag === "!" || /^[:\/]|^https?:/.test(pathPart)) continue;
      const targetRoute = routeKey(pathPart === "" ? page.route : pathPart);
      const targetHtml = htmlOf.get(targetRoute);
      if (targetHtml === undefined) continue; // เส้นที่ Worker ตอบ — เทียบไม่ได้ (ด่านลิงก์ข้างบนตรวจแล้ว)
      let id = frag;
      try {
        id = decodeURIComponent(frag);
      } catch {
        /* ใช้ค่าดิบ */
      }
      if (FRAGMENT_PENDING.has(`${targetRoute}#${id}`)) continue;
      if (!hasId(targetHtml, id)) dead.set(`${targetRoute}#${id}`, page.route);
    }
  }
  check(
    "A7-07/08: ลิงก์ fragment ในหน้าที่บิลด์จริงทุกเส้นมี id รองรับในหน้าปลายทาง",
    dead.size === 0,
    dead.size ? `${dead.size} จุด · เช่น ${[...dead].filter(([t]) => !/^(\/en)?\/blog\//.test(t)).slice(0, 12).map(([t, from]) => `${t} (จาก ${from})`).join(" · ")}` : undefined,
  );
}

/* ── 8. ลิงก์ `/en/...` ที่เขียนตายตัวในโค้ด React/Astro ต้องชี้หน้าที่เรนเดอร์ออกมาจริง ──
 * ด่านลิงก์จาก HTML ที่บิลด์ไม่เห็นลิงก์ที่ island วาดหลัง hydrate (เคยพลาด: ปุ่มเข้าสู่ระบบในสมุดดวงอังกฤษชี้ `/en/account` ที่ไม่มีหน้า · A8-08)
 * ข้ามคอมเมนต์ · ข้ามลิงก์ที่ลงท้าย `/` (ต่อสตริงเป็นพาธไดนามิก) */
{
  const literalRe = /["'`](\/en(?:\/[a-z0-9][a-z0-9-]*)+)["'`]/g;
  const missing = new Map<string, string>();
  const walk = (dir: string) => {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (/\.(tsx?|astro)$/.test(name)) {
        for (const [, lit] of stripComments(fs.readFileSync(full, "utf-8")).matchAll(literalRe)) {
          const known = routeMap.has(lit) || [...routeMap.keys()].some((r) => r.startsWith(`${lit}/`));
          if (!known) missing.set(lit, path.relative(ROOT, full));
        }
      }
    }
  };
  for (const dir of ["src/components", "astro"]) walk(path.join(ROOT, dir));
  check(
    "A8-08: ลิงก์ /en/... ที่เขียนตายตัวในโค้ดชี้หน้าอังกฤษที่มีอยู่จริงทุกเส้น",
    missing.size === 0,
    missing.size ? [...missing].slice(0, 6).map(([l, f]) => `${l} (${f})`).join(" · ") : undefined,
  );
}

console.log("");
if (failures > 0) {
  console.error(`❌ ล้มเหลว ${failures} ข้อ — เส้นทางสองภาษายังไม่สอดคล้องกัน\n`);
  process.exit(1);
}
console.log("✅ เส้นทางสองภาษาสอดคล้องกันทั้งหมด (ไฟล์จริง · hreflang · sitemap · ลิงก์ภายใน)\n");
