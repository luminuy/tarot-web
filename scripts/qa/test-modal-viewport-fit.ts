/**
 * QA — ยามเฝ้ากฎ "หน้าต่างลอยต้องไม่ตกขอบจอ" (Modal Viewport Fit Guard)
 *
 * ⚠️ ทำไมต้องมีไฟล์นี้
 * `AuthModal` วางแผงหน้าต่างไว้ใน `fixed inset-0 flex items-center justify-center`
 * โดยไม่มีเพดานความสูงและไม่มีชั้นที่เลื่อนได้เลย พอเนื้อหาสูงกว่าจอ
 * (เข้าสู่ระบบ + ด่าน Turnstile = 691px · สมัครสมาชิก + แถบวัดความแข็งแรงรหัส = 904px)
 * `items-center` จะดันแผงล้นออกไป **ทั้งบนและล่างพร้อมกัน** —
 * ขอบล่างถูกตัด และขอบบนหายไปแบบ **เลื่อนตามไม่ได้** เพราะตัวครอบเป็น `fixed`
 * ผู้ใช้จึงเห็นโลโก้/หัวข้อแหว่ง และกดปุ่ม Google/LINE ที่ตกขอบล่างไม่ได้
 *
 * วัดจริงด้วย Chromium ก่อนแก้ (แผงสูง 904px):
 *   1280x720 -> top=-92  bottom=812  ❌   1280x640 -> top=-132 bottom=772 ❌
 *   1440x800 -> top=-52  bottom=852  ❌    390x844 -> top=-16  bottom=860 ❌
 *
 * **บทเรียน: กฎที่ไม่มีเครื่องตรวจ คือกฎที่จะถูกละเมิดอีกแน่นอน**
 *
 * ────────────────────────────────────────────────────────────────
 * กฎที่ตรวจ — ทุกแผงที่อยู่ในตัวครอบเต็มจอ (`fixed inset-0` + `flex items-center`)
 * ต้องผ่านอย่างน้อยหนึ่งทาง:
 *
 *   ทาง A (แนะนำ) — แผงมีเพดานความสูงผูกกับจอ (`max-h-[...vh]` / `max-h-[...dvh]` / `max-h-full`)
 *                   **และ** มีชั้นที่เลื่อนได้ (`overflow-y-auto`) อยู่ในแผง
 *   ทาง B — ตัวครอบเลื่อนได้เอง (`overflow-y-auto`) **และ** แผงใช้ margin อัตโนมัติ (`my-auto` / `m-auto`)
 *           ซึ่งเป็นวิธีมาตรฐานที่ทำให้ขอบบนยังเลื่อนถึงได้ (auto margin ชนะ `align-items: center`)
 *
 * ⛔ สิ่งที่ห้ามเด็ดขาด: แผงไม่มีเพดานความสูง และตัวครอบก็ไม่เลื่อน
 *    = เนื้อหาส่วนที่ล้นขอบบน "หายถาวร" ไม่มีทางเข้าถึงด้วยเมาส์ คีย์บอร์ด หรือนิ้ว
 *
 * รันด้วย: npx tsx scripts/qa/test-modal-viewport-fit.ts
 */

import fs from "node:fs";
import path from "node:path";

const SRC = path.join(process.cwd(), "src");

/** รายการผ่อนผันแบบ Ratchet — ต้องว่างเสมอ ถ้าจะเติมต้องเขียนเหตุผลกำกับ */
const ALLOWLIST: { file: string; reason: string }[] = [];

interface Violation {
  file: string;
  line: number;
  panelClass: string;
  reason: string;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx$/.test(name)) out.push(full);
  }
  return out;
}

/** ตัวครอบเต็มจอที่จัดกลางแนวตั้ง — รูปแบบเดียวกับที่โมดัลทั้งเว็บใช้ */
const SCRIM_RE = /className=\{?["'`]([^"'`]*fixed inset-0[^"'`]*flex[^"'`]*items-center[^"'`]*)["'`]/g;

/** ดึงค่า className ทุกตัวพร้อมตำแหน่ง เพื่อไล่หาแผงที่อยู่ถัดจากตัวครอบ */
const CLASSNAME_RE = /className=\{?[`"']([^`"']*)[`"']/g;

/** เพดานความสูงที่ผูกกับขนาดจอจริง */
const VIEWPORT_CAP_RE = /max-h-(?:full|screen|\[[^\]]*(?:vh|dvh|svh|lvh)[^\]]*\])/;

function lineOf(content: string, index: number): number {
  return content.slice(0, index).split("\n").length;
}

function checkFile(filePath: string): Violation[] {
  const content = fs.readFileSync(filePath, "utf-8");
  if (!content.includes("fixed inset-0")) return [];

  const violations: Violation[] = [];
  const rel = path.relative(process.cwd(), filePath);

  // เก็บ className ทั้งไฟล์ไว้ก่อน แล้วค่อยจับคู่ตัวครอบ -> แผง
  const all: { cls: string; index: number }[] = [];
  let m: RegExpExecArray | null;
  CLASSNAME_RE.lastIndex = 0;
  while ((m = CLASSNAME_RE.exec(content)) !== null) {
    all.push({ cls: m[1], index: m.index });
  }

  SCRIM_RE.lastIndex = 0;
  let scrim: RegExpExecArray | null;
  while ((scrim = SCRIM_RE.exec(content)) !== null) {
    const scrimClass = scrim[1];
    const scrimIndex = scrim.index;

    // แผง = className ตัวถัดไปที่กำหนดความกว้างของกล่อง (`w-full` / `max-w-*`) — ข้ามฉากหลัง `absolute inset-0`
    // ⚠️ ห้ามดูแค่ `max-w-` อย่างเดียว: `Modal.tsx` ส่งความกว้างมาทาง `${maxWidthClass}`
    //    ถ้าตรวจแค่ตัวอักษรตรง ๆ จะหาแผงไม่เจอแล้วปล่อยผ่านเงียบ ๆ (จับพลาดตอนทดสอบทำให้พังจริง เคสที่ 6)
    const panel = all.find((c) => c.index > scrimIndex && /\bw-full\b|\bmax-w-/.test(c.cls));
    if (!panel) continue;

    // แผงต้องอยู่ใกล้ตัวครอบ ไม่ใช่คนละโมดัลกัน (กันจับคู่ผิดเมื่อไฟล์เดียวมีหลายโมดัล)
    const nextScrim = all.find((c) => c.index > scrimIndex && /fixed inset-0/.test(c.cls) && /items-center/.test(c.cls));
    if (nextScrim && nextScrim.index < panel.index) continue;

    const hasCap = VIEWPORT_CAP_RE.test(panel.cls);
    const scrimScrolls = /overflow-y-auto/.test(scrimClass);
    const panelAutoMargin = /\b(?:my-auto|m-auto)\b/.test(panel.cls);

    // ชั้นที่เลื่อนได้ — บนตัวแผงเอง หรือบนลูกของแผง (ดูจนถึงโมดัลถัดไป)
    const scopeEnd = nextScrim ? nextScrim.index : content.length;
    const subtree = content.slice(panel.index, scopeEnd);
    const hasScroller = /overflow-y-auto/.test(subtree);

    let reason = "";
    if (hasCap && !hasScroller) {
      reason = "มีเพดานความสูงแล้ว แต่ไม่มีชั้นที่เลื่อนได้ (`overflow-y-auto`) เนื้อหาส่วนเกินจะถูกตัดทิ้งเงียบ ๆ";
    } else if (!hasCap && !(scrimScrolls && panelAutoMargin)) {
      reason = scrimScrolls
        ? "ตัวครอบเลื่อนได้ แต่แผงไม่มี `my-auto` — `items-center` จะดันขอบบนออกนอกจอแบบเลื่อนตามไม่ได้"
        : "แผงไม่มีเพดานความสูงผูกกับจอ และตัวครอบก็ไม่เลื่อน — เนื้อหาที่ล้นขอบบนจะเข้าถึงไม่ได้ถาวร";
    }

    if (reason && !ALLOWLIST.some((a) => rel.endsWith(a.file))) {
      violations.push({
        file: rel,
        line: lineOf(content, panel.index),
        panelClass: panel.cls.length > 110 ? panel.cls.slice(0, 110) + "…" : panel.cls,
        reason,
      });
    }
  }

  return violations;
}

function run(): void {
  console.log("🔍 ตรวจสอบว่าหน้าต่างลอยทุกบานไม่ตกขอบจอ (Modal Viewport Fit Guard)...\n");

  const files = walk(SRC);
  const all: Violation[] = [];
  let checked = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    if (/fixed inset-0[^"'`]*flex[^"'`]*items-center/.test(content)) checked += 1;
    all.push(...checkFile(file));
  }

  if (all.length > 0) {
    console.error(`❌ พบหน้าต่างลอยที่จะตกขอบจอเมื่อเนื้อหาสูงกว่าจอ ${all.length} จุด:\n`);
    for (const v of all) {
      console.error(`  - ${v.file}:${v.line}`);
      console.error(`    เหตุผล : ${v.reason}`);
      console.error(`    class  : ${v.panelClass}`);
      console.error(
        `    💡 วิธีแก้: ใส่ \`max-h-[calc(100dvh-2rem)]\` ที่แผง แล้วย้ายเนื้อหาไปไว้ในชั้น \`min-h-0 overflow-y-auto overscroll-contain\`\n`
      );
    }
    process.exit(1);
  }

  for (const allowed of ALLOWLIST) {
    console.warn(`⚠️ รายการใน ALLOWLIST ยังอยู่: ${allowed.file} — ${allowed.reason}`);
  }

  console.log(`✅ ผ่านทุกเกณฑ์: ไฟล์ที่มีหน้าต่างลอยเต็มจอ ${checked} ไฟล์ มีเพดานความสูงและชั้นที่เลื่อนได้ครบ\n`);
  process.exit(0);
}

run();
