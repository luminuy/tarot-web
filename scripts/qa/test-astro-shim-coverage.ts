/**
 * 🔌 ด่านกัน "ชั้นแปลงปลั๊กมีรูโหว่" — `next/*` ทุกตัวที่ฝั่ง Astro ใช้ ต้องมี shim
 * ===========================================================================
 *
 * ทำไมต้องมีด่านนี้
 * ----------------
 * เว็บนี้ใช้คอมโพเนนต์ชุดเดียวกันกับสองเครื่องมือเรนเดอร์ · คอมโพเนนต์เหล่านั้น
 * นำเข้า `next/*` อยู่แล้วตั้งแต่ยุคที่มีแต่ Next · ตอนบิลด์ด้วย Astro เราไม่ได้แก้โค้ด
 * แต่ **สลับปลายทางของ import** ด้วย alias ใน `astro.config.mjs` ไปที่ `astro/shims/*` แทน
 *
 * ข้อตกลงนี้ถูกเขียนไว้เป็น "คอมเมนต์เตือน" สองที่ (`astro.config.mjs` กับแผนย้าย Astro)
 * ซึ่งแปลว่ามันอยู่รอดได้ด้วยความจำของคนเท่านั้น · วันที่มีคนเติม `import Image from "next/image"`
 * ลงคอมโพเนนต์ที่ใช้ร่วมกัน จะไม่มีอะไรฟ้องเลย:
 *
 *   • ไม่มี alias ➔ Vite วิ่งไปหยิบของจริงจาก `node_modules/next` มาใส่บันเดิลไคลเอนต์
 *   • บิลด์ **ผ่าน** · หน้าเว็บ **ดูปกติ** · แต่ island ลากรันไทม์ของ Next ติดไปด้วย
 *     (นี่คือความพังตระกูลเดียวกับ "เผลอ import ข้อมูล ➔ บันเดิล 24 KB ➔ 980 KB")
 *
 * ด่านนี้ทำให้กติกาข้อนั้นมีเครื่องตรวจ แทนที่จะมีแต่คอมเมนต์
 *
 * ด่านนี้ตรวจสามชั้น
 * -----------------
 *   1. alias ทุกบรรทัดใน `astro.config.mjs` ชี้ไปที่ไฟล์ shim ที่ **มีอยู่จริง**
 *   2. `next/*` ทุกตัวที่ถูกนำเข้าในพื้นที่ที่ Astro ใช้ร่วม ต้องมี alias ครบ
 *   3. shim ทุกตัวต้องไม่ใช่ไฟล์เปล่า (กันไฟล์ที่ถูกล้างไส้แล้วด่านยังเขียว)
 *
 * ℹ️ shim ที่ยังไม่มีใครใช้ **ไม่ใช่ความผิด** — รายงานไว้เฉย ๆ เพราะมันคือของสำรอง
 *    ที่พร้อมรับวันที่มีคนนำเข้าโมดูลนั้นเข้ามา ไม่ได้ทำให้บันเดิลโตขึ้นสักไบต์
 *
 * รันเดี่ยว: npx tsx scripts/qa/test-astro-shim-coverage.ts
 */

import fs from "node:fs";
import path from "node:path";

import { assertNonEmptyCorpus } from "./lib/corpus";
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
console.log("🔌 ASTRO SHIM COVERAGE — `next/*` ที่ฝั่ง Astro ใช้ ต้องมีชั้นแปลงปลั๊กครบ");
console.log("=======================================================\n");

/**
 * พื้นที่ที่ "ถูกบิลด์ด้วย Astro ด้วย" — นำเข้าอะไรที่นี่ ของนั้นจะเข้าบันเดิลของ Astro
 *
 * ⚠️ `src/app/(th)/**` และ `src/app/(en)/**` ไม่อยู่ในรายการนี้โดยตั้งใจ — เป็นหน้าของ Next
 *    ล้วน ๆ (เช่น `/admin/login` นำเข้า `next/image` ได้ตามสบาย ไม่เกี่ยวกับ Astro)
 */
const SHARED_SURFACE = ["astro", "src/components", "src/app/_shared"] as const;

/**
 * ข้อยกเว้น: ไฟล์ในพื้นที่ร่วมที่ **Astro ไม่เคยแตะ** จริง ๆ
 * เติมที่นี่พร้อมเหตุผลเสมอ · ว่างอยู่ = ยังไม่เคยต้องใช้ (และนั่นคือสภาพที่ดี)
 */
const EXEMPT_FILES: { file: string; reason: string }[] = [];

// ── 1. อ่าน alias จาก astro.config.mjs ────────────────────────────────────
console.log("── 1. ชั้นแปลงปลั๊กที่ประกาศไว้ ──");

const configPath = path.join(ROOT, "astro.config.mjs");
const configRaw = fs.readFileSync(configPath, "utf-8");

/** `"next/link": resolve("./astro/shims/next-link.tsx"),` ➔ Map<"next/link", "astro/shims/next-link.tsx"> */
const aliases = new Map<string, string>();
for (const m of configRaw.matchAll(/"(next\/[a-z-]+)"\s*:\s*resolve\(\s*"\.\/([^"]+)"\s*\)/g)) {
  aliases.set(m[1], m[2]);
}

check(
  `astro.config.mjs ประกาศ alias ของ next/* ไว้ ${aliases.size} ตัว`,
  aliases.size > 0,
  "อ่าน alias ไม่ได้เลย — รูปแบบใน astro.config.mjs เปลี่ยนไปหรือเปล่า? ด่านนี้จะไร้ความหมายทันที",
);

for (const [mod, rel] of aliases) {
  const full = path.join(ROOT, rel);
  const exists = fs.existsSync(full);
  const size = exists ? fs.readFileSync(full, "utf-8").trim().length : 0;
  check(
    `${mod} ➔ ${rel}`,
    exists && size > 0,
    exists ? "ไฟล์ shim ว่างเปล่า — โดนล้างไส้ไปแล้วหรือเปล่า?" : "ไฟล์ shim ไม่มีอยู่จริง",
  );
}

// ── 2. ไล่หา next/* ที่ถูกนำเข้าจริงในพื้นที่ร่วม ─────────────────────────
console.log("\n── 2. `next/*` ที่ถูกนำเข้าจริงในพื้นที่ที่ Astro ใช้ร่วม ──");

const exemptSet = new Set(EXEMPT_FILES.map((e) => e.file));

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (/\.(ts|tsx|astro|mjs)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/** ไฟล์ทั้งหมดในพื้นที่ร่วมที่ด่านนี้จะอ่าน */
const corpus: string[] = [];
for (const surface of SHARED_SURFACE) {
  for (const file of walk(path.join(ROOT, surface))) {
    const rel = path.relative(ROOT, file);
    if (exemptSet.has(rel)) continue;
    // ไฟล์ shim เองต้องนำเข้าของจริงไม่ได้อยู่แล้ว และไม่ควรตรวจตัวเอง
    if (rel.startsWith("astro/shims/")) continue;
    corpus.push(rel);
  }
}

assertNonEmptyCorpus(
  "ไฟล์ในพื้นที่ที่ Astro ใช้ร่วม",
  corpus,
  "พื้นที่ร่วมถูกย้ายหรือเปล่า? แก้ SHARED_SURFACE ให้ตรงกับของจริง",
);

/** โมดูล ➔ ไฟล์ที่นำเข้ามัน */
const used = new Map<string, string[]>();
for (const rel of corpus) {
  const src = fs.readFileSync(path.join(ROOT, rel), "utf-8");
  for (const m of src.matchAll(/from\s+"(next\/[a-z-]+)"/g)) {
    const list = used.get(m[1]) ?? [];
    list.push(rel);
    used.set(m[1], list);
  }
}

for (const [mod, files] of [...used].sort()) {
  const covered = aliases.has(mod);
  check(
    `${mod} — ใช้อยู่ ${files.length} ไฟล์ · มี shim: ${covered ? "ใช่" : "ไม่มี"}`,
    covered,
    [
      `ไม่มี alias ของ \`${mod}\` ใน astro.config.mjs`,
      `ผู้ใช้: ${files.slice(0, 5).join(" · ")}${files.length > 5 ? ` (และอีก ${files.length - 5} ไฟล์)` : ""}`,
      "ทางแก้: เขียน shim ที่ astro/shims/ แล้วผูก alias ใน astro.config.mjs",
      "⛔ ห้ามแก้ด้วยการเอา next/* ออกจากคอมโพเนนต์ที่ใช้ร่วม — ฝั่ง Next ยังต้องใช้ไฟล์เดียวกัน",
    ].join("\n      "),
  );
}

// ── 3. shim สำรองที่ยังไม่มีใครใช้ (รายงานเฉย ๆ ไม่ใช่ความผิด) ──────────────
const spare = [...aliases.keys()].filter((mod) => !used.has(mod));
if (spare.length > 0) {
  console.log(`\n  ℹ️  shim สำรองที่ยังไม่มีใครนำเข้า: ${spare.join(" · ")}`);
  console.log("      (เก็บไว้ได้ — ไม่ได้อยู่ในบันเดิลจนกว่าจะมีคน import จริง)");
}

if (EXEMPT_FILES.length > 0) {
  console.log("\n  ℹ️  ไฟล์ที่ยกเว้นไว้:");
  for (const e of EXEMPT_FILES) console.log(`      • ${e.file} — ${e.reason}`);
}

console.log("\n=======================================================");
if (failed > 0) {
  console.error(`❌ ชั้นแปลงปลั๊กมีรูโหว่ ${failed} จุด`);
  process.exit(1);
}
console.log("✅ `next/*` ทุกตัวที่ฝั่ง Astro ใช้ มีชั้นแปลงปลั๊กครบ");
console.log("=======================================================\n");
