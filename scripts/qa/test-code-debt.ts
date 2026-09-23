/**
 * 🧱 ด่านหนี้โค้ด — เส้นแบ่งวัน · คีย์ที่เก็บในเบราว์เซอร์ · catch ที่กลืนเงียบ (R-25 · R-27 · R-30)
 * ===========================================================================
 *
 * สามเรื่องนี้มีรูปแบบเดียวกัน: **ความรู้ที่กระจายอยู่หลายที่โดยไม่มีอะไรบังคับให้ตรงกัน**
 * และทั้งสามไม่ทำให้อะไรพังทันที แต่ทำให้คนที่มาแก้ทีหลังแก้ไม่ครบโดยไม่รู้ตัว
 *
 * - **R-25** "วันนี้ที่กรุงเทพฯ" เขียนซ้ำ 6 ที่ 3 วิธี — ค่านี้คือ **คีย์โควตาและคีย์สตรีค**
 *   อาการที่ผู้ใช้เจอเวลาสำเนาเลื่อนออกจากกันคือ "สิทธิ์ฟรีไม่รีเซ็ต" ซึ่งมาถึงเราเป็นตั๋วซัพพอร์ต
 * - **R-27** `catch` 448 จุด 4 แนวทาง และ **0 จุดที่ยิง telemetry** — ความล้มเหลวบน production
 *   มองเห็นได้เฉพาะตอนมีคนนั่งดู log อยู่
 * - **R-30** `localStorage` ถูกเรียกตรงจาก 18 ไฟล์ โดยไม่มีที่ไหนรู้ครบว่าแอปเขียนคีย์อะไรไว้บ้าง
 */

import fs from "node:fs";
import path from "node:path";
import { assertNonEmptyCorpus } from "./lib/corpus";

const ROOT = process.cwd();

let pass = 0;
let fail = 0;

function check(label: string, ok: boolean, detail = ""): void {
  if (ok) {
    pass++;
    console.log(`✅ ${label}`);
  } else {
    fail++;
    console.log(`❌ ${label}${detail ? `\n${detail}` : ""}`);
  }
}

/** ตัดคอมเมนต์ออกก่อนวิเคราะห์ — คอมเมนต์ที่อธิบายแพตเทิร์นไม่ใช่การใช้แพตเทิร์น */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const sources = walk(path.join(ROOT, "src"));
assertNonEmptyCorpus("ไฟล์ต้นฉบับใน src/", sources, "ตรวจว่า src/ ยังอยู่ที่เดิม");

const rel = (p: string): string => path.relative(ROOT, p).split(path.sep).join("/");

console.log("\n🧱 ด่านหนี้โค้ด — เส้นแบ่งวัน · คีย์ในเบราว์เซอร์ · catch ที่กลืนเงียบ\n");

// ─────────────────────────────────────────────────────────────────────────────
// 1. R-25 — เส้นแบ่งวันกรุงเทพฯ ต้องมาจากโมดูลเดียว
// ─────────────────────────────────────────────────────────────────────────────
const BANGKOK_MODULE = "src/lib/time/bangkok.ts";
check(
  `มีโมดูลกลางของเส้นแบ่งวัน (${BANGKOK_MODULE})`,
  fs.existsSync(path.join(ROOT, BANGKOK_MODULE)),
);

/** ไฟล์ที่ได้รับอนุญาตให้เขียนเขตเวลา/ออฟเซ็ตเองได้ — ทุกบรรทัดต้องมีเหตุผล */
const TZ_EXEMPT: Record<string, string> = {
  "src/lib/time/bangkok.ts": "โมดูลกลางเอง",
  "src/lib/platform/db.ts": "ค่า DEFAULT ของคอลัมน์ในสคีมา SQL — ไม่ใช่ตรรกะเส้นแบ่งวัน",
  "src/lib/marketplace/queue.repo.ts": "ค่าที่เขียนลงคอลัมน์ `timezone` ของแม่หมอ — เป็นข้อมูล ไม่ใช่ตรรกะ",
};

const tzLiterals: string[] = [];
const offsetMath: string[] = [];
for (const file of sources) {
  const r = rel(file);
  if (r in TZ_EXEMPT) continue;
  const src = stripComments(fs.readFileSync(file, "utf-8"));
  for (const [i, line] of src.split("\n").entries()) {
    if (/["']Asia\/Bangkok["']/.test(line)) tzLiterals.push(`   · ${r}:${i + 1} — ${line.trim().slice(0, 90)}`);
    // บวก 7 ชั่วโมงเองในทุกรูปแบบที่เคยเจอในรีโปนี้
    if (/7\s*\*\s*60\s*\*\s*60\s*\*\s*1000|25200000\b/.test(line)) {
      offsetMath.push(`   · ${r}:${i + 1} — ${line.trim().slice(0, 90)}`);
    }
  }
}

check(
  'ไม่มีไฟล์ไหนเขียนสตริง "Asia/Bangkok" เอง (ต้องใช้ APP_TIME_ZONE)',
  tzLiterals.length === 0,
  tzLiterals.join("\n") + "\n   ➔ นำเข้าจาก @/lib/time/bangkok — เขตเวลาเป็นค่าคงที่ของระบบ ไม่ใช่ของแต่ละไฟล์",
);

check(
  "ไม่มีไฟล์ไหนบวกออฟเซ็ต +7 ชั่วโมงเองเพื่อหาวันที่",
  offsetMath.length === 0,
  offsetMath.join("\n") +
    "\n   ➔ ใช้ bangkokDayKey() · bangkokWeekKey() จาก @/lib/time/bangkok" +
    "\n   ➔ ประเด็นไม่ใช่ว่าสูตรไหนถูก (ทั้งสามวิธีให้ผลตรงกันวันนี้) แต่คือมีสำเนาให้เลื่อนออกจากกันได้",
);

/* ห้ามมีฟังก์ชันชื่อ todayISO/todayDateKey/dayKey ที่คำนวณเองอีก — ต้องเป็นชื่อเรียกของโมดูลกลาง */
const rivalDayFns: string[] = [];
for (const file of sources) {
  const r = rel(file);
  if (r === BANGKOK_MODULE) continue;
  const src = stripComments(fs.readFileSync(file, "utf-8"));
  const m = /function\s+(todayISO|todayDateKey|dayKey|yesterdayDateKey|weekKey)\s*\([^)]*\)[^{]*\{([\s\S]{0,400}?)\n\}/g;
  let hit: RegExpExecArray | null;
  while ((hit = m.exec(src)) !== null) {
    const body = hit[2];
    // ยอมรับได้ถ้าตัวมันเรียกโมดูลกลางต่อ
    if (/bangkok(DayKey|WeekKey|YesterdayKey|NextMidnightISO)/.test(body)) continue;
    rivalDayFns.push(`   · ${r} — function ${hit[1]}() คำนวณเส้นแบ่งวันเอง`);
  }
}
check(
  "ไม่มีฟังก์ชันหาวันที่ของตัวเองนอกโมดูลกลาง",
  rivalDayFns.length === 0,
  rivalDayFns.join("\n") + "\n   ➔ เคยมีฟังก์ชันชื่อ `todayISO` อยู่สามไฟล์โดยไม่ใช่ฟังก์ชันเดียวกัน",
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. R-30 — คีย์ที่เขียนลงเบราว์เซอร์ต้องอยู่ในทะเบียนเดียว
// ─────────────────────────────────────────────────────────────────────────────
const KEYS_MODULE = "src/lib/storage/keys.ts";
const keysPath = path.join(ROOT, KEYS_MODULE);
check(`มีทะเบียนคีย์ (${KEYS_MODULE})`, fs.existsSync(keysPath));

/** ไฟล์ที่เรียกที่เก็บข้อมูลได้โดยไม่ต้องอ้างทะเบียน — พร้อมเหตุผล */
const STORAGE_EXEMPT: Record<string, string> = {
  "src/lib/storage/keys.ts": "ทะเบียนเอง",
  "src/lib/account/delete-all-data.ts":
    "ปุ่ม PDPA — เรียก clear() ซึ่งลบทุกคีย์รวมคีย์ที่ทะเบียนยังไม่รู้จัก · ปลอดภัยกว่าวนจากทะเบียน",
};

const literalStorageKeys: string[] = [];
for (const file of sources) {
  const r = rel(file);
  if (r in STORAGE_EXEMPT) continue;
  const src = stripComments(fs.readFileSync(file, "utf-8"));
  // จับเฉพาะการส่ง "สตริงตายตัว" เป็นคีย์ — ตัวแปรที่มาจากทะเบียนผ่านได้
  for (const m of src.matchAll(/\b(?:local|session)Storage\s*\.\s*(?:get|set|remove)Item\s*\(\s*(["'`])([^"'`]*)\1/g)) {
    const line = src.slice(0, m.index ?? 0).split("\n").length;
    literalStorageKeys.push(`   · ${r}:${line} — "${m[2]}"`);
  }
}
check(
  "ไม่มีไฟล์ไหนส่งชื่อคีย์เป็นสตริงตายตัวให้ localStorage / sessionStorage",
  literalStorageKeys.length === 0,
  literalStorageKeys.join("\n") + `\n   ➔ ประกาศไว้ใน ${KEYS_MODULE} แล้วนำเข้ามาใช้`,
);

/* ปุ่ม PDPA ต้องยังลบทุกคีย์จริง — ห้ามเปลี่ยนไปวนจากทะเบียน (ทะเบียนที่ขาดหนึ่งคีย์ = ข้อมูลค้าง)
   ⚠️ ตรรกะย้ายจาก `DeleteAllDataButton.tsx` มาที่ `src/lib/account/delete-all-data.ts` แล้ว (2026-09-18)
   เพราะปุ่มเดียวกันถูกเรียกจากสองปลายทาง: island ของ `/account` และสคริปต์ธรรมดาของ `/privacy` */
const deleteLogic = path.join(ROOT, "src/lib/account/delete-all-data.ts");
if (!fs.existsSync(deleteLogic)) {
  check("มีปุ่มลบข้อมูลทั้งหมดตาม PDPA", false, "   ➔ src/lib/account/delete-all-data.ts หายไป");
} else {
  const btn = fs.readFileSync(deleteLogic, "utf-8");
  check(
    "ปุ่ม PDPA ลบทั้ง localStorage และ sessionStorage ทั้งก้อน",
    /localStorage\.clear\(\)/.test(btn) && /sessionStorage\.clear\(\)/.test(btn),
    "   ➔ ห้ามเปลี่ยนไปวนลบจากทะเบียน — ทะเบียนที่ขาดไปหนึ่งคีย์แปลว่าข้อมูลผู้ใช้ยังค้างอยู่จริง",
  );
  // A4-08 · A7-01: ลบบนเซิร์ฟเวอร์ล้มแล้วต้องไม่ทำเหมือนสำเร็จ
  check(
    "ปุ่ม PDPA ดูผลของ DELETE /api/account (res.ok) ก่อนบอกว่าลบแล้ว",
    /res\.ok/.test(btn) && !/method: "DELETE" \}\)\.catch\(\(\) => \{\}\)/.test(btn),
    "   ➔ fetch ไม่โยนเมื่อได้ 4xx/5xx · ลบบนคลาวด์ล้มแต่ผู้ใช้เข้าใจว่าใช้สิทธิ์ลบข้อมูลแล้ว",
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. R-27 — ห้าม catch ที่ว่างเปล่าโดยไม่อธิบาย
// ─────────────────────────────────────────────────────────────────────────────
check(
  "มีตัวรายงาน error ที่ถูก catch (src/lib/observability/caught.ts)",
  fs.existsSync(path.join(ROOT, "src/lib/observability/caught.ts")),
);

/*
 * ⚠️ ต้องตรวจจาก **ข้อความดิบ** ไม่ใช่ข้อความที่ตัดคอมเมนต์แล้ว
 * `catch { /* เหตุผล *\/ }` คือสิ่งที่เราต้องการ ส่วน `catch {}` เปล่า ๆ คือสิ่งที่ห้าม
 * ถ้าตัดคอมเมนต์ก่อน สองอันนี้จะหน้าตาเหมือนกันทุกประการ — และเราจะไปไล่แก้ของที่ถูกอยู่แล้ว
 *
 * ส่วนการจับตำแหน่ง `catch` ยังต้องใช้ข้อความที่ตัดคอมเมนต์แล้ว ไม่งั้นตัวอย่างโค้ด
 * ที่เขียนอยู่ในคอมเมนต์ (เช่นที่ `journal.repo.ts` อธิบายบั๊กเก่าไว้) จะถูกนับด้วย
 */
const bareCatches: string[] = [];
for (const file of sources) {
  const raw = fs.readFileSync(file, "utf-8");
  const masked = stripComments(raw);
  for (const m of masked.matchAll(/\bcatch\s*(?:\([^)]*\))?\s*\{/g)) {
    const openBrace = (m.index ?? 0) + m[0].length - 1;
    // หา `}` ที่ปิดบล็อกนี้จากข้อความที่ตัดคอมเมนต์แล้ว (วงเล็บในคอมเมนต์จึงไม่กวน)
    let depth = 1;
    let close = openBrace;
    while (++close < masked.length && depth > 0) {
      if (masked[close] === "{") depth++;
      else if (masked[close] === "}") depth--;
    }
    const body = raw.slice(openBrace + 1, close - 1);
    if (body.trim() === "") {
      const line = raw.slice(0, openBrace).split("\n").length;
      bareCatches.push(`   · ${rel(file)}:${line}`);
    }
  }
}
check(
  `ไม่มี catch ที่ว่างเปล่าโดยไม่อธิบายเหตุผล (สแกน ${sources.length} ไฟล์)`,
  bareCatches.length === 0,
  bareCatches.join("\n") +
    "\n   ➔ ถ้ากลืนได้จริง ให้เขียนคอมเมนต์ว่าทำไม (โหมดส่วนตัว · ปลายทางปิดไปแล้ว ฯลฯ)" +
    "\n   ➔ ถ้ากลืนไม่ได้ ให้เรียก recordCaughtError(scope, err) จาก @/lib/observability/caught",
);

/* เส้นทางที่กฎเหล็กข้อ 14 คุ้มครองอยู่ ห้ามเสื่อมลงเงียบ ๆ */
const READ_ROUTE = "src/app/api/reading/[id]/read/route.ts";
const readPath = path.join(ROOT, READ_ROUTE);
if (!fs.existsSync(readPath)) {
  check("มีเส้นทางเปิดไพ่ให้ตรวจ", false, `   ➔ ${READ_ROUTE} หายไป`);
} else {
  const readSrc = fs.readFileSync(readPath, "utf-8");
  check(
    "เส้นทางเปิดไพ่รายงาน error ที่จับได้เข้าท่อสถิติ (ไม่กลืนเงียบ)",
    readSrc.includes("recordCaughtError("),
    "   ➔ กฎเหล็กข้อ 14: ข้อมูลหาย = ต้องบอกผู้ใช้/ต้องรู้ ไม่ใช่เสื่อมลงเงียบ ๆ",
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. R-29 — ซองจดหมายของ API (ratchet: รายชื่อของเก่าลดได้อย่างเดียว)
// ─────────────────────────────────────────────────────────────────────────────
const ENVELOPE_MODULE = "src/lib/api/envelope.ts";
check(`มีโมดูลซองจดหมาย (${ENVELOPE_MODULE})`, fs.existsSync(path.join(ROOT, ENVELOPE_MODULE)));

/**
 * route ที่ยังตอบด้วยรูปเก่า `{ success: ... }` — **ตรึงไว้เป็น ratchet**
 *
 * ⚠️ ตัวเลขนี้ **ห้ามเพิ่ม** route ใหม่ทุกเส้นต้องใช้ `apiOk()` / `apiFail()`
 * ลดได้เมื่อไหร่ให้ลดตัวเลขตาม — การเปลี่ยนรูปคำตอบของเส้นที่มีผู้ใช้อยู่ต้องแก้
 * ทั้งฝั่งส่งและฝั่งรับพร้อมกัน จึงย้ายทีละกลุ่ม ไม่ใช่ทีเดียวทั้งหมด
 */
const LEGACY_SUCCESS_BUDGET = 23;

const apiRoutes = walk(path.join(ROOT, "src/app/api"));
assertNonEmptyCorpus("ไฟล์ route ใน src/app/api", apiRoutes, "ตรวจว่า src/app/api ยังอยู่ที่เดิม");

const legacySuccess: string[] = [];
for (const file of apiRoutes) {
  const src = stripComments(fs.readFileSync(file, "utf-8"));
  for (const m of src.matchAll(/\bsuccess\s*:\s*(true|false)\b/g)) {
    const line = src.slice(0, m.index ?? 0).split("\n").length;
    legacySuccess.push(`   · ${rel(file)}:${line}`);
  }
}
check(
  `route ที่ยังใช้ซองจดหมายรูปเก่าไม่เพิ่มขึ้น (${legacySuccess.length} / เพดาน ${LEGACY_SUCCESS_BUDGET})`,
  legacySuccess.length <= LEGACY_SUCCESS_BUDGET,
  legacySuccess.slice(0, 10).join("\n") +
    "\n   ➔ route ใหม่ต้องใช้ apiOk() / apiFail() จาก @/lib/api/envelope" +
    "\n   ➔ ลดจำนวนลงได้ให้ลดเพดานตามทันที (ratchet ห้ามเพิ่ม)",
);

// ─────────────────────────────────────────────────────────────────────────────
// 5. R-28 — ทุกแผงแอดมินต้องแยก "ไม่มีข้อมูล" ออกจาก "พัง" ได้
// ─────────────────────────────────────────────────────────────────────────────
const adminDir = path.join(ROOT, "src/components/admin");
const adminPanelFiles = fs.existsSync(adminDir)
  ? fs.readdirSync(adminDir).filter((f) => f.endsWith(".tsx") && f !== "AdminErrorBanner.tsx")
  : [];

check(
  "มีแถบแจ้งข้อผิดพลาดกลางของแผงแอดมิน (AdminErrorBanner.tsx)",
  fs.existsSync(path.join(ROOT, "src/components/admin/AdminErrorBanner.tsx")),
);
check(
  "มีฮุกโหลดข้อมูลกลางของแผงแอดมิน (use-admin-resource.ts)",
  fs.existsSync(path.join(ROOT, "src/lib/admin/use-admin-resource.ts")),
);

/*
 * 🔴 R-31: ด่านสองข้อบนตรวจแค่ "ไฟล์มีอยู่" ซึ่งตกไม่ได้เลยตราบใดที่ไม่มีใครลบไฟล์ทิ้ง
 * และมันเคย **ผ่านทั้งที่ของจริงพัง**: `use-admin-resource.ts` ถูกเขียนขึ้นในรอบตรวจก่อนหน้า
 * แต่ไม่มีแผงไหนเรียกใช้เลยสักแผง (knip รายงานว่าเป็นไฟล์กำพร้า) — แผงทั้งหมดยังลอก
 * ชุด fetch/loading/error ของตัวเองไว้เหมือนเดิม ซึ่งคือสิ่งที่ R-28 ตั้งใจกำจัดพอดี
 *
 * สองข้อล่างนี้จึงตรวจ **การถูกใช้จริง** แทนการมีอยู่
 */
const panelsUsingHook = adminPanelFiles.filter((name) =>
  fs.readFileSync(path.join(adminDir, name), "utf-8").includes("useAdminResource"),
);
/** 🔒 ratchet — **เพิ่มได้ ห้ามลด** (ย้ายแผงเข้าฮุกกลางเพิ่มเมื่อไหร่ ให้ขยับเลขนี้ตาม) */
const HOOK_ADOPTION_FLOOR = 6;
check(
  `แผงแอดมินที่โหลดข้อมูลผ่านฮุกกลางจริง (${panelsUsingHook.length} / ขั้นต่ำ ${HOOK_ADOPTION_FLOOR})`,
  panelsUsingHook.length >= HOOK_ADOPTION_FLOOR,
  `ที่ใช้อยู่: ${panelsUsingHook.join(", ") || "(ไม่มีเลย)"}\n` +
    "   ➔ ฮุกที่ไม่มีใครเรียกคือโค้ดตาย ไม่ใช่การรวมศูนย์",
);

/**
 * แผงไหนยังยิง `fetch(..., { cache: "no-store" })` โหลดหน้าจอเอง = ลอกตรรกะฮุกมาอีกชุด
 * (กฎ "ล้มเหลวแล้วล้างของเดิมทิ้ง" ของ R-28 จะอยู่คนละที่กันทันทีที่มีชุดที่สอง)
 */
const panelsWithOwnLoader = adminPanelFiles.filter((name) =>
  /cache:\s*["']no-store["']/.test(fs.readFileSync(path.join(adminDir, name), "utf-8")),
);
check(
  "ไม่มีแผงไหนยิงคำขอโหลดหน้าจอเอง (ทุกการโหลดผ่าน useAdminResource)",
  panelsWithOwnLoader.length === 0,
  `พบที่: ${panelsWithOwnLoader.join(", ")}\n` +
    "   ➔ ใช้ useAdminResource(url) แทน · ปุ่มสั่งงาน (POST/PUT) ไม่เข้าข่ายข้อนี้",
);

/** แผงที่ดึงข้อมูลจาก API — ทุกตัวต้องมีทางแสดงข้อผิดพลาด */
const adminPanels = adminPanelFiles;
assertNonEmptyCorpus("แผงแอดมินใน src/components/admin", adminPanels, "ตรวจว่าโฟลเดอร์ยังอยู่ที่เดิม");

const panelsWithoutErrorUi: string[] = [];
for (const name of adminPanels) {
  const full = path.join(adminDir, name);
  const src = fs.readFileSync(full, "utf-8");
  if (!/\bfetch\s*\(/.test(stripComments(src))) continue; // แผงที่ไม่ดึงข้อมูลเองไม่เข้าข่าย
  const hasErrorUi =
    /AdminErrorBanner/.test(src) || /role=["']alert["']/.test(src) || /aria-live=/.test(src);
  if (!hasErrorUi) panelsWithoutErrorUi.push(`   · src/components/admin/${name}`);
}
check(
  `ทุกแผงแอดมินที่ดึงข้อมูลเองมีทางแสดงข้อผิดพลาด (${adminPanels.length} ไฟล์)`,
  panelsWithoutErrorUi.length === 0,
  panelsWithoutErrorUi.join("\n") +
    "\n   ➔ API คืน 500 แล้วเรนเดอร์ตารางว่าง = ผู้ดูแลอ่านว่า 'ไม่มีข้อมูล' ไม่ใช่ 'พัง'" +
    "\n   ➔ ใช้ <AdminErrorBanner /> จาก @/components/admin/AdminErrorBanner",
);

// ─────────────────────────────────────────────────────────────────────────────
// 6. A4-01 — ทุก `fetch("/api/...")` ฝั่งหน้าเว็บต้องชี้เส้นทางที่มีอยู่จริง
// ─────────────────────────────────────────────────────────────────────────────
/*
 * ปุ่ม "อัปเดตระบบค้นหา" ในแผงแอดมินยิง `/api/admin/rebuild-index` มาตลอด
 * ทั้งที่เส้นทางจริงชื่อ `rebuild-search-index` — ได้ 404 ทุกครั้ง แล้ว toast โทษว่า
 * "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้" ไม่มีด่านไหนจับได้เพราะ typecheck มองสตริงไม่ออก
 * ด่านนี้จับคู่สตริงกับไฟล์ `src/app/api/<เส้นทาง>/route.ts` (`${...}` = ช่องไดนามิก)
 */
const routeSegments = walk(path.join(ROOT, "src/app/api"))
  .filter((f) => /[\\/]route\.ts$/.test(f))
  .map((f) =>
    ["api", ...path.relative(path.join(ROOT, "src/app/api"), path.dirname(f)).split(path.sep)].filter(Boolean),
  );
assertNonEmptyCorpus("เส้นทาง API ใน src/app/api", routeSegments, "ตรวจว่า src/app/api ยังอยู่ที่เดิม");

function apiPathExists(literal: string): boolean {
  const segs = literal.replace(/[?#].*$/, "").replace(/^\/+|\/+$/g, "").split("/");
  return routeSegments.some(
    (route) =>
      route.length === segs.length &&
      route.every((r, i) => {
        // ช่อง `${...}` ในสตริงเดาค่าไม่ได้ ➔ ยอมให้ตรงกับทุกช่อง · ช่อง [param] ของเส้นทางรับทุกค่า
        if (segs[i].includes("${") || /^\[.+\]$/.test(r)) return true;
        return r === segs[i];
      }),
  );
}

const frontendSources = [...sources, ...walk(path.join(ROOT, "astro"))].filter(
  (f) => !rel(f).startsWith("src/app/api/"),
);
const deadApiCalls: string[] = [];
for (const file of frontendSources) {
  const src = stripComments(fs.readFileSync(file, "utf-8"));
  for (const m of src.matchAll(/fetch\(\s*["'`](\/api\/[^"'`\s]*)["'`]/g)) {
    if (!apiPathExists(m[1])) deadApiCalls.push(`   · ${rel(file)} ➔ ${m[1]}`);
  }
}
check(
  "ทุก fetch(\"/api/...\") ฝั่งหน้าเว็บชี้เส้นทางที่มีไฟล์ route.ts จริง",
  deadApiCalls.length === 0,
  deadApiCalls.join("\n") + "\n   ➔ สตริงผิดชื่อ = 404 ทุกครั้งที่กด (A4-01) · แก้ชื่อให้ตรงกับโฟลเดอร์ใน src/app/api",
);

// ─────────────────────────────────────────────────────────────────────────────
// 7. ผลตรวจ 2026-09-23 คลื่น 4 — ฝั่งหน้าเว็บที่ "ทำเหมือนสำเร็จ" ทั้งที่ไม่สำเร็จ
// ─────────────────────────────────────────────────────────────────────────────
{
  const src = (f: string) => stripComments(fs.readFileSync(path.join(ROOT, f), "utf-8"));

  const ritual = src("src/components/reading/one-card/OneCardRitual.tsx");
  check(
    "A3-03: พิธีไพ่ใบเดียวแสดง error ของขั้นเริ่ม/สับไพ่ และจับ error ตอนประกอบไพ่",
    /oracle\.state\.error/.test(ritual) && /setLoadError\(/.test(ritual) && /role="alert"/.test(ritual),
  );
  check(
    "A3-04: /daily ไม่คำนวณวันที่ตอน render (หน้า prerender ตอนบิลด์)",
    !/format\(new Date\(\)\)/.test(src("src/components/daily/DailyClient.tsx").replace(/useEffect\([\s\S]*?\}, \[isEnglish\]\);/, "")),
  );
  const historyModal = src("src/components/history/ReadingHistoryModal.tsx");
  const saveNote = historyModal.match(/const handleSaveNote[\s\S]*?\n  \};/)?.[0] ?? "";
  check(
    "A3-08: บันทึกโน้ตนับรุ่น + fetchServerReadings ถามก่อนเขียนทับ localStorage",
    /mutationRef\.current \+= 1/.test(saveNote) && /shouldCommit/.test(historyModal) && /shouldCommit/.test(src("src/lib/utils/history.ts")),
  );
  check(
    "A3-09: ShareModal ไม่จองแท็บด้วย noopener (ทำให้ window.open คืน null เสมอ)",
    !/window\.open\([^)]*"about:blank"[^)]*noopener/.test(src("src/components/reading/ShareModal.tsx")),
  );
  check(
    "A4-07: สวิตช์ความยินยอมเช็ก res.ok ก่อนเปลี่ยนสถานะ",
    /if \(res\.ok\) return true;/.test(src("src/components/account/AccountClient.tsx")),
  );
  const semantic = src("src/components/encyclopedia/SemanticSearchPanel.tsx");
  check("A4-09: ค้นหาด้วยความรู้สึกมี debounce + ยกเลิกคำขอเก่า", /setTimeout\(/.test(semantic) && /controller\.abort\(\)/.test(semantic));
  check(
    "A4-13: รีเซ็ตกล่อง Turnstile ทุกครั้งหลังส่งฟอร์ม",
    /resetKey=\{`\$\{mode\}-\$\{turnstileAttempt\}`\}/.test(src("src/components/auth/AuthModal.tsx")),
  );
  check(
    "A4-14: token รีเซ็ตรหัสผ่านถูกลบจาก URL + Service Worker ไม่แคชหน้านี้",
    /history\.replaceState/.test(src("src/app/(th)/reset-password/page.tsx")) &&
      /startsWith\("\/reset-password"\)/.test(fs.readFileSync(path.join(ROOT, "public/sw.js"), "utf-8")),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. ผลตรวจ 2026-09-23 คลื่น 5 — คีย์บอร์ด / screen reader
// ─────────────────────────────────────────────────────────────────────────────
{
  const src = (f: string) => stripComments(fs.readFileSync(path.join(ROOT, f), "utf-8"));
  const dialog = src("src/lib/use-dialog-behavior.ts");
  check(
    "A5-01: focus trap ไม่นับปุ่ม disabled + ดึงโฟกัสที่หลุดกลับเข้าหน้าต่าง",
    /button:not\(\[disabled\]\)/.test(dialog) && /contains\(document\.activeElement\)/.test(dialog),
  );
  const history = src("src/components/history/ReadingHistoryModal.tsx");
  check(
    "A5-02 · A5-19: สมุดบันทึกมีปุ่มกาง (aria-expanded) + ยืนยันก่อนลบทีละรายการ",
    /aria-expanded=\{isExpanded\}/.test(history) && /const handleDelete[\s\S]{0,1500}window\.confirm/.test(history),
  );
  check(
    "A5-04: ปุ่มล้างคำค้นหน้าแม่หมอมีชื่อ",
    /aria-label="ล้างคำค้นหา"/.test(src("src/components/readers/ReadersDirectory.tsx")),
  );
  check(
    "A5-05: สวิตช์เปิดรับคิวสดเป็น role=switch พร้อม aria-checked",
    /role="switch"[\s\S]{0,80}aria-checked=\{isLiveOpen\}/.test(src("src/app/(th)/readers/console/page.tsx")),
  );
  for (const f of ["src/app/_shared/pages/reading-chat-th.tsx", "src/app/_shared/pages/reading-chat-en.tsx"]) {
    check(`A5-07: ${f} โหลดห้องแชทผ่าน withMotionScope (เคารพ reduced-motion)`, /withMotionScope\(/.test(src(f)));
  }
  check(
    "A5-12: กล่องข้อผิดพลาดหลักของพิธีเปิดไพ่ประกาศให้ screen reader (role=alert)",
    /\{errorMsg && currentStep !== "SUMMARY" && \(\s*<div role="alert"/.test(src("src/components/home/TarotFlow.tsx")),
  );
  check(
    "A5-13: ปุ่มสลับ พ.ศ./ค.ศ. บอกสถานะด้วย aria-pressed",
    /aria-pressed=\{era === "be"\}/.test(src("src/components/encyclopedia/BirthCardCalculator.tsx")),
  );
  check(
    "A5-17: ช่องไพ่ในผังไม่กลืน Enter/Space ของปุ่มลูก",
    /if \(e\.target !== e\.currentTarget\) return;/.test(src("src/components/spread/SpreadBoard.tsx")),
  );
}

console.log(`\n📊 ผ่าน ${pass} ข้อ | ล้มเหลว ${fail} ข้อ\n`);
if (fail > 0) process.exit(1);
