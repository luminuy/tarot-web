/**
 * 🔗 ด่านกัน "อัปเกรด Next แล้วตัวแปลงตามไม่ทัน" — คู่ next ↔ @opennextjs/cloudflare
 * ===========================================================================
 *
 * ทำไมต้องมีด่านนี้
 * ----------------
 * เว็บนี้ไม่ได้ deploy Next ตรง ๆ · `@opennextjs/cloudflare` เป็นตัวแปลงผลบิลด์ของ Next
 * ให้กลายเป็น Worker (`.open-next/worker.js` ที่ `wrangler.jsonc` ชี้ไปหา) · ตัวแปลงนี้
 * **ผูกกับโครงสร้างภายในของ Next ที่ไม่ใช่ API สาธารณะ** เวอร์ชันสองตัวจึงต้องเดินคู่กัน
 *
 * ความพังที่ด่านนี้กัน แพงเป็นพิเศษเพราะมันไม่โผล่ตอน PR:
 *
 *   `npm run typecheck` ผ่าน ➔ `next build` ผ่าน ➔ ด่านทั้งชุดเขียว
 *   ➔ merge ➔ **`opennextjs-cloudflare build` ล้มตอน deploy บน main**
 *
 * แปลว่าคนที่เจอคือ production ไม่ใช่ PR · และ `main` จะค้างในสภาพ merge แล้วแต่ deploy ไม่ขึ้น
 *
 * ทำไม `npm ci` ยังไม่พอ
 * ---------------------
 * npm บังคับ peerDependencies ให้อยู่แล้วก็จริง แต่ช่วงที่ตัวแปลงประกาศไว้
 * **เปิดปลายด้านบน** (เช่น `>=16.3.3` ไม่มีเพดาน) · อัปเกรดข้ามรุ่นใหญ่ไป Next 17
 * จึงผ่าน `npm ci` ฉลุยทั้งที่ตัวแปลงยังไม่เคยเห็น Next 17 มาก่อนเลยสักบรรทัด
 * ด่านนี้จึงตรวจ **สองชั้น**: ช่วงที่ประกาศไว้ (ชั้นล่าง) + คู่รุ่นใหญ่ที่พิสูจน์แล้ว (ชั้นบน)
 *
 * 📌 วันที่ต้องขยับคู่นี้จริง ๆ ให้ทำตามนี้แล้วด่านจะเขียวเอง:
 *    1. อัปเกรดทั้งสองตัวพร้อมกัน (`next` และ `@opennextjs/cloudflare`)
 *    2. `npm run build:worker` ให้ผ่านในเครื่องก่อน — นี่คือขั้นที่ล้มจริงถ้าคู่ไม่เข้ากัน
 *    3. อัปเดต `PROVEN_PAIR` และ `PROVEN_EXACT` (รุ่นเต็มของทั้งสองตัว) ข้างล่างให้ตรงกับคู่ใหม่ พร้อมวันที่ที่ยืนยัน
 *       (รุ่นใหญ่ตรงแต่รุ่นเต็มเปลี่ยน = ด่านตก โดยตั้งใจ — INC-0285 พังที่รุ่นรองของ next)
 *
 * ℹ️ เกี่ยวกับแผนย้าย Astro: ตราบใดที่ยังมี 9 หน้าหลังบ้าน + `/api/*` อยู่กับ Next
 *    คู่นี้ต้องอยู่ต่อ · วันที่ตัวแปลงตามรุ่นใหม่ของ Next ไม่ทันจนขวางการอัปเกรด
 *    คือสัญญาณให้เริ่มคลื่น 5 (ดู docs/plans/HANDOFF_ASTRO_MIGRATION_2026-09-15.md)
 *
 * รันเดี่ยว: npx tsx scripts/qa/test-next-adapter-pair.ts
 */

import fs from "node:fs";
import path from "node:path";

import { ROOT } from "./lib/rendered-pages";

/**
 * คู่รุ่นใหญ่ที่ "บิลด์ Worker ผ่านจริง" แล้ว — ไม่ใช่ค่าที่เดาเอา
 * ยืนยันจาก `npm run build:worker` บนคู่นี้ (2026-09-18)
 */
const PROVEN_PAIR = { nextMajor: 16, adapterMajor: 1 } as const;

/**
 * 🔒 คู่ "รุ่นเต็ม" ที่รันใน worker จริงแล้ว (A10-02 · กฎถาวร INC-0285)
 *
 * รุ่นใหญ่อย่างเดียวไม่พอ: ช่วง peer ของตัวแปลงเปิดปลายด้านบน (`>=16.4.1`) คู่ที่ทำ production ล่มใน INC-0285
 * (next 16.4.1 + ตัวแปลงรุ่นก่อนหน้า) จึงผ่านทั้งด่านชั้นล่างและชั้นรุ่นใหญ่ — พังเฉพาะตอนรันใน workerd
 * ด่านนี้จึงตรึงรุ่นเต็มของทั้งสองตัว: ยกตัวใดตัวหนึ่งแล้วด่านตก ➔ บังคับให้คนลองใน worker ก่อนแก้เลขตรงนี้
 *
 * 📌 เปลี่ยนคู่เมื่อไรต้องทำครบ 3 ข้อก่อนแก้ค่าข้างล่าง:
 *    1. `npm run build:worker` ผ่าน
 *    2. `npx wrangler dev` (หรือ `npm run preview:worker`) แล้วยิง `/api/auth/me` กับ `/readers` ได้ 200
 *    3. จดวันที่ที่ลองไว้ในคอมเมนต์นี้
 * ยืนยันล่าสุด: next 16.4.2 + @opennextjs/cloudflare 1.20.12 — ยืนยันบน production 2026-10-18/19 หลังแก้ INC-0285
 */
const PROVEN_EXACT = { next: "16.4.2", adapter: "1.20.12" } as const;

let failed = 0;
const check = (label: string, ok: boolean, detail?: string) => {
  console.log(`  ${ok ? "✅" : "❌"} ${label}`);
  if (!ok) {
    failed += 1;
    if (detail) console.log(`      ${detail}`);
  }
};

console.log("\n=======================================================");
console.log("🔗 NEXT ↔ OPENNEXT PAIR — ตัวแปลงต้องตามรุ่นของ Next ทัน");
console.log("=======================================================\n");

function readPkg(rel: string): Record<string, unknown> | null {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, "utf-8"));
}

/**
 * ตัดส่วนต่อท้ายของรุ่นทดลอง (`16.4.0-canary.3` ➔ `16.4.0`) ก่อนเทียบเสมอ
 * และเติมเลขที่หายให้ครบสามหลัก — ช่วงของจริงเขียนย่อได้ (`<16` หมายถึง `<16.0.0`)
 */
function parse(version: string): [number, number, number] | null {
  const m = /^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?/.exec(version.trim());
  return m ? [Number(m[1]), Number(m[2] ?? 0), Number(m[3] ?? 0)] : null;
}

function cmp(a: [number, number, number], b: [number, number, number]): number {
  for (let i = 0; i < 3; i += 1) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}

/**
 * ตัวประเมินช่วงเวอร์ชันแบบย่อ — รองรับเท่าที่ peerDependencies ของจริงใช้:
 * `||` (หรือ) · เว้นวรรค (และ) · `>= > <= < =` · `^` · `~` · เลขเปล่า
 * เจออะไรที่อ่านไม่ออก ➔ คืน null เพื่อให้ด่าน **ตก** ไม่ใช่ผ่านเงียบ
 */
function satisfies(version: string, range: string): boolean | null {
  const v = parse(version);
  if (!v) return null;

  for (const clause of range.split("||")) {
    const parts = clause.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) continue;
    let ok = true;
    for (const part of parts) {
      if (part === "*" || part === "x") continue;
      const m = /^(\^|~|>=|<=|>|<|=)?\s*(v?\d+(?:\.\d+)?(?:\.\d+)?.*)$/.exec(part);
      if (!m) return null;
      const target = parse(m[2]);
      if (!target) return null;
      const op = m[1] ?? "=";
      const c = cmp(v, target);
      if (op === ">=") ok = ok && c >= 0;
      else if (op === ">") ok = ok && c > 0;
      else if (op === "<=") ok = ok && c <= 0;
      else if (op === "<") ok = ok && c < 0;
      else if (op === "=") ok = ok && c === 0;
      else if (op === "^") ok = ok && c >= 0 && v[0] === target[0];
      else if (op === "~") ok = ok && c >= 0 && v[0] === target[0] && v[1] === target[1];
      if (!ok) break;
    }
    if (ok) return true;
  }
  return false;
}

// ── 1. ต้องมีของติดตั้งจริงให้ตรวจ ────────────────────────────────────────
console.log("── 1. เวอร์ชันที่ติดตั้งอยู่จริง ──");

const nextPkg = readPkg("node_modules/next/package.json");
const adapterPkg = readPkg("node_modules/@opennextjs/cloudflare/package.json");
const wranglerPkg = readPkg("node_modules/wrangler/package.json");

if (!nextPkg || !adapterPkg) {
  console.error("❌ ยังไม่ได้ติดตั้ง dependency — รัน `npm ci` ก่อน");
  console.error("   (ด่านนี้ตรวจของที่ติดตั้งจริง ไม่ใช่ตัวเลขใน package.json — จึงข้ามไม่ได้)");
  process.exit(1);
}

const nextVersion = String(nextPkg.version);
const adapterVersion = String(adapterPkg.version);
const wranglerVersion = wranglerPkg ? String(wranglerPkg.version) : "";

console.log(`  ℹ️  next                     : ${nextVersion}`);
console.log(`  ℹ️  @opennextjs/cloudflare   : ${adapterVersion}`);
console.log(`  ℹ️  wrangler                 : ${wranglerVersion || "—"}`);

// ── 2. ชั้นล่าง: ต้องอยู่ในช่วงที่ตัวแปลงประกาศรองรับ ────────────────────
console.log("\n── 2. ช่วงที่ตัวแปลงประกาศรองรับ (peerDependencies) ──");

const peers = (adapterPkg.peerDependencies ?? {}) as Record<string, string>;
const nextRange = peers.next;

check(
  "ตัวแปลงประกาศช่วงของ next ไว้จริง",
  Boolean(nextRange),
  "อ่าน peerDependencies.next ไม่ได้ — ตัวแปลงเปลี่ยนวิธีประกาศหรือเปล่า? ด่านนี้จะไร้ความหมายทันที",
);

if (nextRange) {
  const ok = satisfies(nextVersion, nextRange);
  check(
    `next ${nextVersion} อยู่ในช่วง "${nextRange}"`,
    ok === true,
    ok === null
      ? `อ่านช่วง "${nextRange}" ไม่ออก — ต้องสอนตัวประเมินในด่านนี้ให้รู้จักรูปแบบใหม่`
      : "อัปเกรด/ดาวน์เกรดให้อยู่ในช่วง หรือขยับตัวแปลงให้รองรับ",
  );
}

const wranglerRange = peers.wrangler;
if (wranglerRange && wranglerVersion) {
  const ok = satisfies(wranglerVersion, wranglerRange);
  check(
    `wrangler ${wranglerVersion} อยู่ในช่วง "${wranglerRange}"`,
    ok === true,
    "wrangler เป็นตัวที่ deploy Worker จริง — หลุดช่วงเมื่อไร ตัวแปลงเรียกใช้ผิดสัญญาทันที",
  );
}

// ── 3. ชั้นบน: คู่รุ่นใหญ่ที่พิสูจน์แล้วว่าบิลด์ Worker ผ่าน ─────────────────
console.log("\n── 3. คู่รุ่นใหญ่ที่พิสูจน์แล้ว (ชั้นที่ `npm ci` มองไม่เห็น) ──");

const nextMajor = parse(nextVersion)?.[0];
const adapterMajor = parse(adapterVersion)?.[0];

check(
  `next รุ่นใหญ่ = ${nextMajor} (พิสูจน์ไว้ที่ ${PROVEN_PAIR.nextMajor})`,
  nextMajor === PROVEN_PAIR.nextMajor,
  [
    "ข้ามรุ่นใหญ่แล้วแต่ยังไม่ได้พิสูจน์ว่าตัวแปลงตามทัน",
    "ช่วงที่ตัวแปลงประกาศเปิดปลายด้านบน `npm ci` จึงไม่ฟ้อง — แต่ `opennextjs-cloudflare build` ล้มได้",
    "ทำตามขั้นตอนในหัวไฟล์นี้: อัปเกรดคู่กัน ➔ `npm run build:worker` ผ่าน ➔ อัปเดต PROVEN_PAIR",
  ].join("\n      "),
);

check(
  `@opennextjs/cloudflare รุ่นใหญ่ = ${adapterMajor} (พิสูจน์ไว้ที่ ${PROVEN_PAIR.adapterMajor})`,
  adapterMajor === PROVEN_PAIR.adapterMajor,
  "ตัวแปลงข้ามรุ่นใหญ่ — ต้องบิลด์ Worker ผ่านในเครื่องก่อน แล้วค่อยอัปเดต PROVEN_PAIR",
);

check(
  `next ที่ติดตั้ง = ${PROVEN_EXACT.next} (รุ่นเต็มที่พิสูจน์ใน worker แล้ว · ติดตั้งจริง ${nextVersion})`,
  nextVersion === PROVEN_EXACT.next,
  [
    "รุ่นของ next เปลี่ยนไปจากคู่ที่ลองใน worker แล้ว — บิลด์และด่านอื่นผ่านได้แต่ Worker ล้มตอนรันจริง (INC-0285)",
    "ลองตามขั้นตอนใน `PROVEN_EXACT` แล้วจึงแก้เลขในด่านนี้",
  ].join("\n      "),
);

check(
  `@opennextjs/cloudflare ที่ติดตั้ง = ${PROVEN_EXACT.adapter} (ติดตั้งจริง ${adapterVersion})`,
  adapterVersion === PROVEN_EXACT.adapter,
  "ตัวแปลงเปลี่ยนรุ่น — ต้องลองใน worker จริงก่อนแล้วจึงแก้ `PROVEN_EXACT` (รุ่นรองก็พังได้ เช่น 1.20.5 ไม่รองรับ next 16.4)",
);

// ── 4. package.json กับของที่ติดตั้งต้องเป็นเรื่องเดียวกัน ─────────────────
console.log("\n── 4. package.json ประกาศคู่นี้ไว้ครบ ──");

const rootPkg = readPkg("package.json") as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};
const declaredNext = rootPkg.dependencies?.next;
const declaredAdapter = rootPkg.devDependencies?.["@opennextjs/cloudflare"];

check("package.json ประกาศ next", Boolean(declaredNext));
check("package.json ประกาศ @opennextjs/cloudflare", Boolean(declaredAdapter));

// ตรึงแบบ exact (ไม่มี ^ ~ >) — ไม่งั้น `npm update` / dependabot ยกรุ่นเองโดยไม่ผ่านด่านรุ่นเต็มด้านบน
check(
  `package.json ตรึง next เป็นรุ่นเต็ม (ประกาศ ${declaredNext ?? "—"})`,
  declaredNext === PROVEN_EXACT.next,
  `ต้องเป็น "${PROVEN_EXACT.next}" ตรงตัว ไม่ใช้ช่วงเวอร์ชัน`,
);
check(
  `package.json ตรึง @opennextjs/cloudflare เป็นรุ่นเต็ม (ประกาศ ${declaredAdapter ?? "—"})`,
  declaredAdapter === PROVEN_EXACT.adapter,
  `ต้องเป็น "${PROVEN_EXACT.adapter}" ตรงตัว ไม่ใช้ช่วงเวอร์ชัน`,
);

if (declaredNext) {
  const ok = satisfies(nextVersion, declaredNext);
  check(
    `next ที่ติดตั้ง (${nextVersion}) ตรงกับที่ประกาศ (${declaredNext})`,
    ok === true,
    "ของที่ติดตั้งกับที่ประกาศไม่ใช่เรื่องเดียวกัน — lockfile ค้างหรือเปล่า?",
  );
}

console.log("\n=======================================================");
if (failed > 0) {
  console.error(`❌ คู่ next ↔ ตัวแปลง มีปัญหา ${failed} จุด`);
  console.error("   ปล่อยผ่านไป = merge ได้แต่ deploy ล้มบน main");
  process.exit(1);
}
console.log("✅ next กับ @opennextjs/cloudflare เดินคู่กันอยู่ · deploy ได้");
console.log("=======================================================\n");
