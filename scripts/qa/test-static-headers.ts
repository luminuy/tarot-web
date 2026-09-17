/**
 * 🛡️ ด่านกัน "ครึ่งเว็บไม่มี CSP" — `_headers` ต้องพูดตรงกับ `next.config.ts`
 * ===========================================================================
 *
 * ทำไมต้องมีด่านนี้
 * ----------------
 * คำตอบของเว็บนี้ออกมาจากสองทาง และ **ตั้งส่วนหัวคนละที่กัน**:
 *
 *   • หน้าที่ Worker เรนเดอร์ ➔ `next.config.ts` → `headers()`
 *   • ไฟล์ static ที่ Cloudflare ตอบเองที่ขอบ ➔ `public/_headers`
 *     (หน้าเนื้อหาที่เรนเดอร์ด้วย Astro อยู่ทางนี้ทั้งหมด — **ไม่ผ่าน Worker เลย**)
 *
 * ถ้าสองที่นี้หลุดจากกัน ครึ่งหนึ่งของเว็บจะไม่มี CSP · ไม่มี HSTS · ถูกฝังใน iframe ได้
 * โดยไม่มีอะไรพัง ไม่มีหน้าไหนเพี้ยน และไม่มีด่านไหนฟ้อง — จนกว่าจะมีคนโจมตีจริง
 *
 * ด่านนี้ยังกันกับดักอีกสองข้อที่เคยเกือบเกิด
 * ----------------------------------------
 *   • `/cards/*` แบบไม่ระบุนามสกุล จะครอบ **หน้าเว็บ** ไพ่รายใบ 156 หน้าด้วย
 *     แล้วสั่งเบราว์เซอร์แคชหน้าเว็บไว้ 1 ปีแบบ `immutable` = แก้เนื้อหาแล้วไม่ถึงผู้ใช้อีกเลย
 *   • `/fonts/*` ห้ามเป็น `immutable` เพราะชื่อไฟล์ฟอนต์ไม่มี hash (ต่างจากยุค next/font)
 *
 * รันเดี่ยว: npx tsx scripts/qa/test-static-headers.ts
 */

import fs from "node:fs";
import path from "node:path";

import { SECURITY_HEADERS } from "../../src/lib/config/security-headers";
import { ROOT } from "./lib/rendered-pages";

let failed = 0;
const check = (label: string, ok: boolean, detail?: string) => {
  console.log(`  ${ok ? "✅" : "❌"} ${label}`);
  if (!ok) {
    failed += 1;
    if (detail) console.log(`      ${detail}`);
  }
};

console.log("\n=======================================================");
console.log("🛡️  STATIC HEADERS GUARD — ไฟล์ static ต้องได้ส่วนหัวชุดเดียวกับ Worker");
console.log("=======================================================\n");

const headersFile = path.join(ROOT, "public/_headers");
const raw = fs.readFileSync(headersFile, "utf-8");

/** แปลง `_headers` เป็นแผนที่ `รูปแบบ path ➔ { ชื่อหัว: ค่า }` */
function parseHeaders(text: string): Map<string, Map<string, string>> {
  const rules = new Map<string, Map<string, string>>();
  let current: Map<string, string> | null = null;
  for (const line of text.split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    if (!line.startsWith(" ") && !line.startsWith("\t")) {
      current = new Map();
      rules.set(line.trim(), current);
      continue;
    }
    const idx = line.indexOf(":");
    if (idx === -1 || !current) continue;
    current.set(line.slice(0, idx).trim(), line.slice(idx + 1).trim());
  }
  return rules;
}

const rules = parseHeaders(raw);

// ── 1. บล็อก `/*` ต้องมีส่วนหัวความปลอดภัยครบและตรงค่าทุกตัว ───────────────
console.log("── 1. ส่วนหัวความปลอดภัยของไฟล์ static ──");

const globalRule = rules.get("/*");
check("มีบล็อก `/*` ใน public/_headers", Boolean(globalRule));

if (globalRule) {
  for (const header of SECURITY_HEADERS) {
    const actual = globalRule.get(header.key);
    check(
      `บล็อก /* มี ${header.key} ตรงกับ src/lib/config/security-headers.ts`,
      actual === header.value,
      actual === undefined
        ? "ไม่มีหัวนี้เลย — ไฟล์ static ทั้งหมดจะไม่ได้รับการป้องกันข้อนี้"
        : `ค่าไม่ตรง\n      _headers: ${actual}\n      โค้ดกลาง : ${header.value}`,
    );
  }
}

// ── 2. กฎแคชที่ห้ามผิด ────────────────────────────────────────────────────
console.log("\n── 2. กฎอายุแคชที่ห้ามผิด ──");

check(
  "ไม่มีกฎ `/cards/*` แบบไม่ระบุนามสกุล (จะครอบหน้าไพ่รายใบ 156 หน้าด้วย)",
  !rules.has("/cards/*"),
  "ต้องเขียนแยกเป็น /cards/*.jpg และ /cards/*.webp เท่านั้น",
);

const fontsRule = rules.get("/fonts/*");
check("มีกฎแคชของ /fonts/*", Boolean(fontsRule));
check(
  "/fonts/* ต้องไม่เป็น immutable (ชื่อไฟล์ฟอนต์ไม่มี hash)",
  !(fontsRule?.get("Cache-Control") ?? "").includes("immutable"),
  "ถ้าเปลี่ยนชุดอักขระแล้วชื่อไฟล์เท่าเดิม ผู้ใช้เดิมจะติดฟอนต์เก่าไปตลอด",
);

for (const pattern of ["/cards/*.jpg", "/cards/*.webp", "/_astro/*", "/_next/static/*"]) {
  const rule = rules.get(pattern);
  check(
    `${pattern} แคชยาวแบบ immutable (ชื่อไฟล์เปลี่ยนเมื่อเนื้อหาเปลี่ยน)`,
    (rule?.get("Cache-Control") ?? "").includes("immutable"),
  );
}

console.log("\n── 3. Early Hints: ส่วนหัว `Link` ของสไตล์ชีต (R-11/R-12) ──");

/*
 * เจ้าของเปิด Early Hints ของ Cloudflare ไว้แล้ว (2026-09-17) — ขอบจะอ่านส่วนหัว `Link`
 * ของหน้า HTML แล้วส่งเป็น `103` ให้เบราว์เซอร์เริ่มโหลดสไตล์ชีตก่อน HTML จะมาถึง
 *
 * ส่วนหัวนั้น **สร้างตอนบิลด์** โดย `scripts/merge-astro-assets.ts` เพราะชื่อไฟล์ CSS มีแฮช
 * ด่านนี้จึงตรวจ "สัญญา" ระหว่างสองไฟล์นี้แทน — สิ่งที่ตัวสร้างต้องพึ่ง ห้ามหายไปเงียบ ๆ:
 *
 *   1. ตัวสร้างยังอยู่และยังมองหาบล็อกที่มี `s-maxage`
 *   2. `public/_headers` ยังมีบล็อกหน้า HTML ให้มันเจอจริง (ถ้าเหลือศูนย์ = พรีโหลดหายทั้งเว็บ)
 *
 * ⚠️ ห้ามลดด่านนี้เหลือ `fs.existsSync(...)` เฉย ๆ — บทเรียน INC-0195
 */
const mergerPath = path.join(ROOT, "scripts/merge-astro-assets.ts");
const merger = fs.existsSync(mergerPath) ? fs.readFileSync(mergerPath, "utf-8") : "";
check(
  "ตัวสร้างส่วนหัว Link ยังอยู่ใน scripts/merge-astro-assets.ts",
  merger.includes("EARLY_HINTS_MARKER") && merger.includes("rel=preload; as=style"),
  "ถ้าถอดออก หน้าเว็บทุกหน้าจะไม่มี Link header ➔ Early Hints ที่เปิดไว้จะไม่มีอะไรให้ส่งเลย",
);

/** เลียนแบบเงื่อนไขที่ตัวสร้างใช้เลือกเส้นทาง — ต้องได้ผลตรงกันเสมอ */
const htmlRoutes: string[] = [];
{
  let current = "";
  for (const line of raw.split("\n")) {
    if (/^\/\S*\s*$/.test(line)) current = line.trim();
    else if (current && /^\s+\S/.test(line) && line.includes("s-maxage")) {
      htmlRoutes.push(current);
      current = "";
    }
  }
}
check(
  `เจอเส้นทางหน้า HTML ให้พรีโหลดสไตล์ชีต (${htmlRoutes.length} เส้นทาง)`,
  htmlRoutes.length >= 20,
  "บล็อกหน้า HTML ใน public/_headers ต้องตั้ง `s-maxage` เสมอ — ตัวสร้าง Link ใช้ค่านี้เป็นตัวเลือกเส้นทาง",
);
for (const mustHave of ["/", "/spreads", "/cards", "/blog", "/en/*"]) {
  check(
    `เส้นทางหลัก ${mustHave} อยู่ในชุดที่จะได้ Link header`,
    htmlRoutes.includes(mustHave),
  );
}

console.log("");
if (failed > 0) {
  console.error(`❌ ล้มเหลว ${failed} ข้อ — แก้ที่ public/_headers ให้ตรงกับโค้ดกลาง\n`);
  process.exit(1);
}
console.log("✅ ไฟล์ static ได้ส่วนหัวความปลอดภัยชุดเดียวกับที่ Worker ตั้งไว้ครบทุกตัว\n");
