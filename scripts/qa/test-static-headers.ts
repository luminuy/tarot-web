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

console.log("");
if (failed > 0) {
  console.error(`❌ ล้มเหลว ${failed} ข้อ — แก้ที่ public/_headers ให้ตรงกับโค้ดกลาง\n`);
  process.exit(1);
}
console.log("✅ ไฟล์ static ได้ส่วนหัวความปลอดภัยชุดเดียวกับที่ Worker ตั้งไว้ครบทุกตัว\n");
