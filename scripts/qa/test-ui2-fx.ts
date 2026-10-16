/**
 * 🎨 ด่าน SeerTarot UI 2.0 — ของหนักต้องอยู่หลังระดับเอฟเฟกต์ full เท่านั้น (แผน UI_2_0 หัวข้อ 3 · 7)
 * ===========================================================================
 *
 * ทำไมต้องมีด่านนี้
 * ----------------
 * UI 2.0 "ปลดข้อห้าม" backdrop-filter · ภาพเบลอ · อนิเมชันวนไม่รู้จบ ให้คอมและ iPad (ระดับ `full`)
 * แต่มือถือคือที่ที่ INC-0056 เกิด (เบลอพื้นหลังทำ 58 ➔ 30fps) — ถ้ามีกฎหนักหลุดออกมานอกระดับ full
 * แม้แต่บรรทัดเดียว มือถือทุกเครื่องจะจ่ายราคานั้นโดยไม่มีใครเห็นบนจอคอมของคนเขียน
 * ด่านนี้อ่าน **CSS / HTML ที่บิลด์แล้วจริง** ไม่ใช่ซอร์ส (ตัวย่อ CSS อาจย้าย/รวมกฎ)
 *
 * ตรวจ 4 ข้อ
 * ---------
 *   1. กฎของ UI 2.0 (selector มี `ui2-`) ที่ใช้ backdrop-filter · filter: blur() · mix-blend-mode ·
 *      mask-image ต้องขึ้นต้นด้วย `[data-fx="full"]` และอยู่ใต้ `@media (min-width: 768px)` (ล็อกสองชั้น)
 *   2. อนิเมชัน `infinite` ของ UI 2.0 นอกระดับ full ต้องเป็นของที่ "หยุดเองเมื่อพ้นจอ" เท่านั้น
 *      (คลาสใน LITE_LOOPS) และทุกชิ้นใน HTML ต้องมีคลาส `ui2-loop` + อยู่ใต้ `[data-anim-section]`
 *   3. ทุกหน้าใน dist/ และ Next มีสคริปต์ตั้ง `data-fx` ใน `<head>` ก่อนสไตล์ชีตตัวแรก
 *   4. ทุกชิ้นใน HTML ที่มีคลาสวน (ของ full หรือ lite) อยู่ใต้ `[data-anim-section]` (หยุดนอกจอได้จริง)
 *
 * ✅ ทดสอบแบบทำให้พังจริงแล้ว (บันทึกใน WORK_LOG รอบที่เพิ่มด่าน): ย้าย backdrop-filter ไปไว้ใน ui2.css ·
 *    ถอด `[data-fx="full"]` ออกจากกฎหนึ่ง · ถอด data-anim-section ออกจากส่วนหนึ่ง · ถอดสคริปต์ใน <head>
 *    ➔ ตกครบทุกข้อ
 *
 * รันเดี่ยว: npx tsx scripts/qa/test-ui2-fx.ts (ต้อง `npm run build` ก่อน)
 */
import fs from "node:fs";
import path from "node:path";
import postcss, { type AtRule, type Rule } from "postcss";

import { UI2_FX_SCRIPT } from "../../src/app/_shared/ui2-fx";
import { assertNonEmptyCorpus } from "./lib/corpus";
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
console.log("🎨 UI 2.0 FX GUARD — ของหนักอยู่หลังระดับ full · ของวนหยุดนอกจอ");
console.log("=======================================================\n");

/** คลาสที่วนได้ในระดับ lite (หยุดเมื่อพ้นจอด้วย data-inview) — แผนหัวข้อ 3.4 */
const LITE_LOOPS = ["ui2-track", "ui2-btn-ring", "ui2-ring", "ui2-pulse"];
const HEAVY = /(^|-)backdrop-filter$|^mix-blend-mode$|^-webkit-mask-image$|^mask-image$/;

function cssFiles(): string[] {
  const dirs = [path.join(ROOT, "dist/_astro"), path.join(ROOT, ".next/static/css")];
  return dirs.flatMap((d) => (fs.existsSync(d) ? fs.readdirSync(d).filter((f) => f.endsWith(".css")).map((f) => path.join(d, f)) : []));
}

function mediaChain(rule: Rule): string[] {
  const out: string[] = [];
  for (let p = rule.parent; p && p.type !== "root"; p = p.parent as typeof p) {
    if (p.type === "atrule") out.push(`@${(p as AtRule).name} ${(p as AtRule).params}`);
  }
  return out;
}
const underTablet = (chain: string[]) => chain.some((m) => /^@media\b/.test(m) && /min-width\s*:\s*768px|width\s*>=\s*768px/.test(m));
const allFull = (selector: string) =>
  selector
    .split(",")
    .map((s) => s.trim())
    .every((s) => s.startsWith('[data-fx="full"]') || s.startsWith("[data-fx=full]"));

// ── 1 + 2. CSS ที่บิลด์แล้ว ────────────────────────────────────────────────
console.log("── 1–2. CSS ที่บิลด์แล้ว ──");
const files = cssFiles();
assertNonEmptyCorpus("ไฟล์ CSS ที่บิลด์แล้ว (dist/_astro · .next/static/css)", files, "รัน `npm run build` ก่อน");
const heavyLeaks: string[] = [];
const loopLeaks: string[] = [];
let ui2Rules = 0;
let fullRules = 0;
/** ตัวหนังสือทองยังสั่งวนไม่รู้จบอยู่ไหม — แสงทองวิ่ง "ครั้งเดียว" ตั้งแต่ 2026-10-17 (เจ้าของ "รู้สึกหนักเกินไป")
 *  ถ้ามีใครกลับไปใส่ infinite ด่านข้อ 3–4 จะนับคลาสทองเป็นของวนอีกครั้ง (ต้องมี ui2-loop + data-anim-section) */
let goldLoops = false;
for (const file of files) {
  const root = postcss.parse(fs.readFileSync(file, "utf-8"));
  root.walkRules((rule) => {
    if (!rule.selector.includes("ui2-")) return;
    // คีย์เฟรมไม่ใช่ selector ของหน้า
    if (rule.parent && rule.parent.type === "atrule" && /keyframes$/.test((rule.parent as AtRule).name)) return;
    ui2Rules += 1;
    const chain = mediaChain(rule);
    const gated = allFull(rule.selector) && underTablet(chain);
    if (gated) fullRules += 1;
    rule.walkDecls((decl) => {
      const where = `${path.basename(file)} · ${rule.selector.slice(0, 90)} { ${decl.prop}: ${decl.value.slice(0, 50)} }`;
      const heavy = HEAVY.test(decl.prop) || (/^filter$/.test(decl.prop) && /blur\(/.test(decl.value));
      if (heavy && !gated) heavyLeaks.push(where);
      const infinite = /^animation(-iteration-count)?$/.test(decl.prop) && /\binfinite\b/.test(decl.value);
      if (infinite && /\.ui2-gold-(?:day|night)(?![\w-])/.test(rule.selector)) goldLoops = true;
      if (infinite && !gated) {
        const okLoop = LITE_LOOPS.some((c) => new RegExp(`\\.${c}(?![\\w-])`).test(rule.selector));
        if (!okLoop) loopLeaks.push(where);
      }
    });
  });
}
check("พบกฎของ UI 2.0 ใน CSS ที่บิลด์แล้ว", ui2Rules > 50, `เจอ ${ui2Rules} กฎ — ถ้าเป็น 0 แปลว่า src/styles/ui2-home.css ไม่ถูก import ใน astro/islands/TarotFlowRoot.tsx`);
check("พบกฎระดับ full ที่ล็อกสองชั้นครบ", fullRules > 5, `เจอ ${fullRules} กฎ`);

/*
 * สไตล์หน้าแรกต้องโหลดเฉพาะหน้าที่มี TarotFlow — เคยอยู่ใน globals.css แล้วทุกหน้าโหลด CSS 36 KB gzip
 * เกินงบ 32 KB (test-bundle-budget · 2026-10-12) ทั้งที่หน้าอื่นไม่ได้ใช้สักกฎ
 */
const globalsCss = fs.readFileSync(path.join(ROOT, "src/app/globals.css"), "utf-8");
const homeOnlyInGlobals = ["ui2-core.css", "ui2.css", "ui2-fx-full.css", "ui2-home.css", "ui2-spreads.css", "ui2-spreads-fx.css", "ui2-daily.css", "ui2-daily-fx.css", "ui2-page.css", "ui2-page-fx.css", "ui2-dark-shell.css"].filter((f) =>
  new RegExp(`@import\\s+["'][^"']*/${f.replace(".", "\\.")}["']`).test(globalsCss),
);
check(
  "สไตล์หน้าแรก UI 2.0 ไม่อยู่ใน globals.css (โหลดเฉพาะหน้าที่มี TarotFlow)",
  homeOnlyInGlobals.length === 0 &&
    fs.readFileSync(path.join(ROOT, "astro/islands/TarotFlowRoot.tsx"), "utf-8").includes('import "@/styles/ui2-home.css"'),
  `globals.css นำเข้า: ${homeOnlyInGlobals.join(", ") || "-"} ➔ ใช้ ui2-base.css ทั้งเว็บ · ui2-home.css นำเข้าใน astro/islands/TarotFlowRoot.tsx`,
);
check(
  "backdrop-filter · filter: blur · mix-blend-mode · mask-image ของ UI 2.0 อยู่ใต้ [data-fx=\"full\"] + min-width 768px เท่านั้น",
  heavyLeaks.length === 0,
  heavyLeaks.slice(0, 6).join("\n      ") + "\n      ➔ ย้ายไป src/styles/ui2-fx-full.css (ทุกกฎขึ้นต้น [data-fx=\"full\"] ใต้ @media (min-width: 768px))",
);
check(
  `อนิเมชันวนของ UI 2.0 นอกระดับ full มีเฉพาะของที่หยุดนอกจอได้ (${LITE_LOOPS.join(" · ")})`,
  loopLeaks.length === 0,
  loopLeaks.slice(0, 6).join("\n      ") + "\n      ➔ ของวนใหม่ใส่ไว้ใน ui2-fx-full.css · ถ้าจำเป็นต้องวนบนมือถือ เพิ่มลง LITE_LOOPS พร้อมเหตุผล",
);

// ── 3 + 4. HTML ทุกหน้า ─────────────────────────────────────────────────────
console.log("\n── 3–4. HTML ที่บิลด์แล้ว ──");
const pages = collectRenderedPages().filter((p) => !p.route.startsWith("/_") && !p.file.endsWith(".rsc"));
assertNonEmptyCorpus("หน้าที่เรนเดอร์แล้ว", pages, "รัน `npm run build` ก่อน");

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr", "path", "circle", "line", "rect", "use", "stop"]);
/** คลาสเป็นโทเคนเต็มตัวเท่านั้น — `ui2-fc` ต้องไม่จับ `ui2-fc-card` (`\b` นับขีดเป็นขอบคำ) */
const token = (names: string[]) => new RegExp(`(?:^|\\s)(?:${names.join("|")})(?=\\s|$)`);
const LOOP_CLASS = token(["ui2-loop"]);
const ANY_LOOP = token([
  ...LITE_LOOPS,
  "ui2-fc",
  "ui2-blob",
  "ui2-stars",
  "ui2-note",
  ...(goldLoops ? ["ui2-gold-day", "ui2-gold-night"] : []),
  "ui2-morning-back",
  "ui2-morning-burst",
]);

const missingScript: string[] = [];
const scriptAfterCss: string[] = [];
const unpausable: string[] = [];
let scanned = 0;
let loopsSeen = 0;
for (const page of pages) {
  const html = fs.readFileSync(page.file, "utf-8");
  if (html.includes('id="__next_error__"') || !html.includes("<head")) continue;
  scanned += 1;
  const where = `${page.route} [${page.renderer}]`;
  const head = html.slice(0, html.indexOf("</head>") > 0 ? html.indexOf("</head>") : html.length);
  const at = head.indexOf("d.setAttribute('data-fx',f)");
  if (at < 0) missingScript.push(where);
  // ⚠️ ลำดับเทียบสไตล์ชีตตรวจเฉพาะหน้า Astro (เราคุมลำดับ <head> เอง) — หน้า Next ใช้ React 19 ซึ่งยก
  //    <link rel="stylesheet" precedence> ขึ้นต้น <head> ให้เองเสมอ สคริปต์ยังอยู่ใน <head> และรันก่อน <body>
  //    ถูกวาด (สคริปต์ inline รอสไตล์ชีตก่อนหน้าโหลดเสร็จ ซึ่งเฟรมแรกก็ต้องรออยู่แล้ว) จึงไม่มีเฟรมที่ผิดระดับ
  else if (page.renderer === "astro") {
    const firstCss = head.search(/<link[^>]+rel="stylesheet"|<style[\s>]/);
    if (firstCss >= 0 && firstCss < at) scriptAfterCss.push(where);
  }
  if (!html.includes("ui2-")) continue;
  // เดินแท็กด้วยสแต็ก — รู้ว่าชิ้นไหนอยู่ใต้ [data-anim-section]
  const stack: { tag: string; anim: boolean }[] = [];
  const re = /<(\/?)([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const [, closing, rawTag, attrs, selfClose] = m;
    const tag = rawTag.toLowerCase();
    if (tag === "script" || tag === "style") {
      if (!closing) {
        const end = html.indexOf(`</${tag}`, re.lastIndex);
        if (end > 0) re.lastIndex = end;
      }
      continue;
    }
    if (closing) {
      const i = stack.map((s) => s.tag).lastIndexOf(tag);
      if (i >= 0) stack.length = i;
      continue;
    }
    const cls = /class="([^"]*)"/.exec(attrs)?.[1] ?? "";
    const anim = /\sdata-anim-section(?=[\s=>]|$)/.test(attrs);
    if (ANY_LOOP.test(cls) && cls.includes("ui2-")) {
      loopsSeen += 1;
      const inside = anim || stack.some((s) => s.anim);
      if (!LOOP_CLASS.test(cls) || !inside) unpausable.push(`${where} · <${tag} class="${cls.slice(0, 70)}">${LOOP_CLASS.test(cls) ? "" : " (ไม่มี ui2-loop)"}${inside ? "" : " (ไม่อยู่ใต้ data-anim-section)"}`);
    }
    if (!selfClose && !VOID.has(tag)) stack.push({ tag, anim });
  }
}
check("ตรวจหน้าได้มากพอ (เกิน 250 หน้า)", scanned > 250, `ตรวจได้ ${scanned} หน้า`);
check(
  "ทุกหน้ามีสคริปต์ตั้ง data-fx ใน <head>",
  missingScript.length === 0,
  `ขาดใน ${missingScript.length} หน้า · เช่น ${missingScript.slice(0, 3).join(" · ")} ➔ ใส่ UI2_FX_SCRIPT ทั้ง BaseLayout.astro และ RootHtml.tsx`,
);
check(
  "สคริปต์ data-fx มาก่อนสไตล์ชีตตัวแรก (ตั้งระดับก่อนวาดเฟรมแรก · กับดักข้อ 3)",
  scriptAfterCss.length === 0,
  scriptAfterCss.slice(0, 3).join(" · "),
);
check("สคริปต์ใน <head> คือค่าเดียวกับ UI2_FX_SCRIPT", UI2_FX_SCRIPT.includes("d.setAttribute('data-fx',f)"));
check("พบของวนของ UI 2.0 ในหน้าแรก", loopsSeen > 10, `เจอ ${loopsSeen} ชิ้น`);

// ── 5. ฟอนต์ลายมือของกระดาษโน้ตตัดเฉพาะตัวอักษรที่ใช้ — ข้อความโน้ตทุกตัวต้องมีในไฟล์ ─────────────
const noteGlyphs = new Set(fs.readFileSync(path.join(ROOT, "public/fonts/itim-notes.txt"), "utf-8"));
const missingGlyphs = new Set<string>();
let notesSeen = 0;
for (const page of pages.filter((p) => p.route === "/" || p.route === "/en")) {
  const html = fs.readFileSync(page.file, "utf-8");
  // คำถามไทยถูกแบ่งเป็นวลี (<span class="ui2-note-phrase"> + <wbr>) — ถอดแท็กข้างในออกก่อนอ่านตัวอักษร
  for (const m of html.matchAll(/<span class="ui2-note-q">((?:(?!<\/span><span class="ui2-note-spread").)*)<\/span>/gs)) {
    notesSeen += 1;
    const text = m[1].replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');
    for (const ch of text) if (ch.trim() && !noteGlyphs.has(ch)) missingGlyphs.add(ch);
  }
}
check("พบกระดาษโน้ตในหน้าแรกทั้งสองภาษา", notesSeen >= 12, `เจอ ${notesSeen} ใบ`);
check(
  "ตัวอักษรบนกระดาษโน้ตทุกตัวมีในฟอนต์ลายมือที่ตัดไว้ (itim-notes)",
  missingGlyphs.size === 0,
  `ขาด: ${[...missingGlyphs].join(" ")} ➔ เติมลง public/fonts/itim-notes.txt แล้วรัน \`npm run fonts:subset -- itim\``,
);
check(
  "ของวนทุกชิ้นมี ui2-loop และอยู่ใต้ [data-anim-section] (หยุดเมื่อพ้นจอ)",
  unpausable.length === 0,
  unpausable.slice(0, 6).join("\n      "),
);

// ── 6. อนิเมชันผูกการเลื่อนต้องไม่ถูกตัวย่อ CSS รวมเข้า shorthand (INC-0264) ─────────────────
// lightningcss ที่ไม่มี targets รวม `animation-timeline: view()` เข้าไปใน `animation:` ซึ่ง Chrome/Safari ไม่รับ
// ➔ ทั้งกฎถูกทิ้ง motion ตอนเลื่อนหายทั้งหน้าแบบเงียบ ๆ · กันไว้ที่ `vite.build.cssTarget` ใน astro.config.mjs
const mergedTimelines: string[] = [];
for (const file of files) {
  const css = fs.readFileSync(file, "utf-8");
  for (const m of css.matchAll(/(?:^|[;{])\s*animation\s*:([^;{}]*\b(?:view|scroll)\([^;{}]*)/g)) {
    mergedTimelines.push(`${path.basename(file)}: animation:${m[1].slice(0, 80)}`);
  }
}
check(
  "ไม่มี view()/scroll() อยู่ใน shorthand `animation:` ของ CSS ที่บิลด์แล้ว (เบราว์เซอร์จะทิ้งทั้งกฎ)",
  mergedTimelines.length === 0,
  mergedTimelines.slice(0, 4).join("\n      ") + "\n      ➔ ตรวจ `vite.build.cssTarget` ใน astro.config.mjs (INC-0264)",
);

// ── 7. ไพ่ตกแต่งหัวหน้า /spreads ต้องจางหมดก่อนแตะหัวเว็บ (INC-0269) ─────────────────────────
// ไพ่แถวบนอยู่ใต้หัวเว็บแค่ ~6px ถ้าผูกการจางกับ view() ของกล่องหัวหน้า (สูง ~530px) ไพ่จะถูกขอบจอตัดค้างครึ่งใบ
// ที่มุมบนก่อนจางหมด — ต้องผูกกับระยะเลื่อนของหน้า (scroll()) · จางถึง 0 · และเลื่อนลงเท่าช่วงพอดี (นิ่งกับที่ระหว่างจาง)
const decoRules: string[] = [];
const decoKeyframes: string[] = [];
for (const file of files) {
  const css = fs.readFileSync(file, "utf-8");
  for (const m of css.matchAll(/\.ui2-sp-deco\{([^}]*animation-timeline[^}]*)\}/g)) decoRules.push(m[1]);
  for (const m of css.matchAll(/@keyframes ui2-sp-deco-out\{(.*?)\}\}/g)) decoKeyframes.push(m[1]);
}
const decoRangeEnd = decoRules.map((r) => /animation-range:\s*0(?:px)?\s+(\d+)px/.exec(r)?.[1]).find(Boolean);
const decoPinned = decoKeyframes.some((k) => /opacity:\s*0\b/.test(k) && decoRangeEnd !== undefined && new RegExp(`translateY\\(${decoRangeEnd}px\\)`).test(k));
check(
  "ไพ่ตกแต่งหัวหน้า /spreads จางหมดตามระยะเลื่อนของหน้า (scroll() ≤ 160px · นิ่งกับที่ระหว่างจาง) ไม่ใช่ view() ของกล่องหัวหน้า",
  decoRules.length > 0 &&
    decoRules.every((r) => /animation-timeline:\s*scroll\(/.test(r)) &&
    decoRangeEnd !== undefined &&
    Number(decoRangeEnd) <= 160 &&
    decoPinned,
  `กฎ: ${decoRules.join(" / ").slice(0, 160) || "(ไม่พบ)"} · คีย์เฟรม: ${decoKeyframes.join(" / ").slice(0, 120) || "(ไม่พบ)"}\n      ➔ ดู src/styles/ui2-spreads-fx.css (INC-0269)`,
);

// ── 8. แจกไพ่ตอนสลับหมวด /spreads ต้องอยู่ในกรอบหน้าต่าง (INC-0270) ─────────────────────────────────
// เดิมไพ่พุ่งขึ้นจากใต้โต๊ะ 260px และรวมจากกองกลาง ➔ ระหว่างอนิเมชันไพ่ล้นออกนอกหน้าต่างและวิ่งตัดกันเป็นกองโปร่ง
// ตรวจจากซอร์ส (ไม่ต้องบิลด์): ระยะลอยขึ้น ≤ 40px · ไม่มีการเลื่อนแนวนอน (translate X / cqw) · หมวดเก่าหายภายใน ≤ 0.2 วิ
{
  const fxSrc = fs.readFileSync(path.join(ROOT, "src/styles/ui2-spreads-fx.css"), "utf-8");
  const dealKf = /@keyframes ui2-sp-deal\s*\{([\s\S]*?)\n\}/.exec(fxSrc)?.[1] ?? "";
  const lift = Math.max(0, ...[...dealKf.matchAll(/translateY\((\d+(?:\.\d+)?)px\)/g)].map((m) => Number(m[1])));
  const sideways = /translate\(|translateX\(|cqw/.test(dealKf);
  const shelfCss = fs.readFileSync(path.join(ROOT, "src/styles/ui2-spreads.css"), "utf-8");
  const outRule = /\.ui2-sp-show\.is-scrolly \.ui2-sp-shelf \{([^}]*)\}/.exec(shelfCss)?.[1] ?? "";
  const outSec = Number(/transition:\s*opacity\s+([\d.]+)s/.exec(outRule)?.[1] ?? "9");
  check(
    "แจกไพ่ตอนสลับหมวด /spreads อยู่ในกรอบหน้าต่าง (ลอยขึ้น ≤ 40px · ไม่เลื่อนข้าง · หมวดเก่าหาย ≤ 0.2 วิ)",
    dealKf.length > 0 && lift <= 40 && !sideways && outSec <= 0.2,
    `ลอยขึ้น ${lift}px · เลื่อนข้าง ${sideways} · หมวดเก่าหาย ${outSec} วิ\n      ➔ ดู src/styles/ui2-spreads-fx.css + ui2-spreads.css (INC-0270)`,
  );
}

if (failed > 0) {
  console.log(`\n❌ ไม่ผ่าน ${failed} ข้อ\n`);
  process.exit(1);
}
console.log("\n✅ ผ่าน: ของหนักล็อกสองชั้นครบ · ของวนหยุดนอกจอได้ · ทุกหน้าตั้งระดับเอฟเฟกต์ก่อนเฟรมแรก\n");
