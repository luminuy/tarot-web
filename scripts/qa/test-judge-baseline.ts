/**
 * scripts/qa/test-judge-baseline.ts
 * ---------------------------------------------------------------------------
 * 🧑‍⚖️ ด่านกัน "ขึ้น PROMPT_VERSION แล้วไม่มีผลวัด"
 *
 * ที่มา: คลื่น B (PR #410) ขึ้น `PROMPT_VERSION` เป็น `20260911-2` แล้ว merge เข้า `main`
 * โดย **ไม่มีรายงาน `ai:judge` ของเวอร์ชันใหม่เลย** ทั้งที่กติกาข้อ 2 หัวข้อ 8 ของ
 * `HANDOFF_AI_ACCURACY_THAI_2026-09-07.md` เขียนไว้ว่า
 *   "ทุกงานในคลื่น B ต้องแนบผล ai:judge เทียบก่อน/หลังใน PR ไม่มีผลเทียบ = ไม่ merge"
 * ผลคือเปลี่ยนพฤติกรรมที่โมเดลผลิตออกมาแล้วพิสูจน์ไม่ได้ว่าแม่นขึ้นหรือแย่ลง
 * ซึ่งเป็นเหตุผลทั้งหมดที่สร้างเครื่องมือวัดนี้ขึ้นมาตั้งแต่แรก
 *
 * ⚠️ ด่านนี้ **ห้ามเรียกโมเดล** — ตรวจจากไฟล์ในดิสก์ล้วน ต้นทุน AI = 0
 *    (การยิงโมเดลจริงเป็นงานของ `npm run ai:judge` ซึ่งรันด้วยมือเท่านั้น)
 *
 * ตรรกะ 3 ชั้น — ตั้งใจแยกความรุนแรงเพื่อไม่ให้ด่านนี้ไปบล็อกงานที่ไม่เกี่ยวกับ AI:
 *
 *   1. 🔴 ตก — ไฟล์รายงานเสียรูป (JSON พัง · เวอร์ชันในไฟล์ไม่ตรงชื่อไฟล์ · ไม่มีเคส)
 *   2. 🔴 ตก — PR นี้ "ขึ้นเวอร์ชัน" (PROMPT_VERSION ต่างจากของ origin/main) แต่ไม่มีรายงานของเวอร์ชันใหม่
 *      ➔ นี่คือจังหวะเดียวที่กติกาเล็งถึง และเป็นจังหวะที่คนแก้ยังนั่งอยู่หน้าจอ
 *   3. 🟡 เตือน — เวอร์ชันปัจจุบันไม่มีรายงาน (หนี้ค้างจากรอบก่อน) หรือรายงานครอบคลุมเคสต่ำ
 *      ➔ ไม่ตก เพราะจะกลายเป็นบล็อกทุก PR ทั้งเว็บด้วยหนี้ของงาน AI ซึ่งไม่ได้สัดส่วน
 *        แต่พิมพ์ดัง ๆ ทุกครั้งที่รัน เพื่อไม่ให้ลืม
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { PROMPT_VERSION } from "../../src/lib/ai/prompt-version";
import { buildComparison } from "./judge-compare";
import type { CaseResult, JudgeReport } from "./judge-compare";

const REPORT_DIR = path.join(process.cwd(), "scripts/qa/reports");
const VERSION_FILE = "src/lib/ai/prompt-version.ts";

/** ความครอบคลุมขั้นต่ำที่ถือว่า baseline "ใช้เทียบได้จริง" */
const MIN_COVERAGE_PCT = 80;

let failures = 0;
let warnings = 0;

function fail(msg: string) {
  console.log(`  ❌ ${msg}`);
  failures++;
}
function warn(msg: string) {
  console.log(`  🟡 ${msg}`);
  warnings++;
}
function pass(msg: string) {
  console.log(`  ✅ ${msg}`);
}

interface ReportShape {
  promptVersion?: string;
  cases?: unknown[];
  summary?: { total?: number; succeeded?: number };
}

function reportsFor(version: string): string[] {
  if (!fs.existsSync(REPORT_DIR)) return [];
  return fs
    .readdirSync(REPORT_DIR)
    .filter((f) => f.startsWith(`judge-${version}-`) && f.endsWith(".json"))
    .sort();
}

/** อ่าน PROMPT_VERSION ของ origin/main เพื่อรู้ว่า "PR นี้ขึ้นเวอร์ชันเองหรือเปล่า" */
function versionOnMain(): string | null {
  for (const ref of ["origin/main", "origin/HEAD", "main"]) {
    try {
      const src = execFileSync("git", ["show", `${ref}:${VERSION_FILE}`], {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      const m = /PROMPT_VERSION\s*=\s*"([^"]+)"/.exec(src);
      if (m) return m[1];
    } catch {
      // ref นี้ไม่มีในเครื่อง/ใน CI — ลองตัวถัดไป
    }
  }
  return null;
}

console.log("\n🧑‍⚖️ ตรวจว่าเวอร์ชัน prompt ปัจจุบันมีผลวัดรองรับ (ไม่เรียกโมเดล)\n");
console.log(`   PROMPT_VERSION ปัจจุบัน : ${PROMPT_VERSION}`);

// ── 1. ไฟล์รายงานทุกไฟล์ต้องอ่านได้และสอดคล้องกับชื่อตัวเอง ──
const allReports = fs.existsSync(REPORT_DIR)
  ? fs.readdirSync(REPORT_DIR).filter((f) => f.startsWith("judge-") && f.endsWith(".json"))
  : [];

for (const file of allReports) {
  let data: ReportShape;
  try {
    data = JSON.parse(fs.readFileSync(path.join(REPORT_DIR, file), "utf-8"));
  } catch {
    fail(`อ่าน JSON ของ ${file} ไม่ได้ — ไฟล์รายงานเสียรูป`);
    continue;
  }
  // ชื่อไฟล์คือ judge-<version>-<timestamp>.json ➔ เวอร์ชันข้างในต้องตรงกัน
  const nameVersion = file.replace(/^judge-/, "").replace(/-\d{4}-\d{2}-\d{2}T.*$/, "");
  if (data.promptVersion !== nameVersion) {
    fail(`${file}: promptVersion ในไฟล์ ("${data.promptVersion}") ไม่ตรงกับชื่อไฟล์ ("${nameVersion}")`);
  }
  if (!Array.isArray(data.cases) || data.cases.length === 0) {
    fail(`${file}: ไม่มีเคสในรายงาน — ไฟล์นี้ใช้เทียบอะไรไม่ได้`);
  }
}
if (allReports.length > 0 && failures === 0) {
  pass(`ไฟล์รายงานทั้ง ${allReports.length} ไฟล์อ่านได้และเวอร์ชันตรงกับชื่อไฟล์`);
}

// ── 2. ขึ้นเวอร์ชันใน PR นี้แล้วไม่มีรายงาน = ตก ──
const mine = reportsFor(PROMPT_VERSION);
const mainVersion = versionOnMain();

if (mainVersion === null) {
  console.log("  ℹ️  เทียบกับ origin/main ไม่ได้ในเครื่องนี้ — ข้ามการตรวจ 'ขึ้นเวอร์ชันแล้วต้องมีผลวัด'");
} else if (mainVersion !== PROMPT_VERSION && mine.length === 0) {
  fail(
    `PR นี้ขึ้น PROMPT_VERSION จาก "${mainVersion}" เป็น "${PROMPT_VERSION}" แต่ไม่มีรายงาน ai:judge ของเวอร์ชันใหม่\n` +
      `      ➔ กติกา: เปลี่ยนพฤติกรรมที่โมเดลผลิต ต้องแนบผลเทียบก่อน/หลัง ไม่มีผลเทียบ = ไม่ merge\n` +
      `      ➔ รัน: npm run ai:judge -- --compare ${mainVersion}\n` +
      `      ➔ แล้ว commit ไฟล์ scripts/qa/reports/judge-${PROMPT_VERSION}-*.json`
  );
} else if (mainVersion !== PROMPT_VERSION) {
  pass(`PR นี้ขึ้นเวอร์ชัน "${mainVersion}" → "${PROMPT_VERSION}" และมีรายงานรองรับแล้ว`);
} else {
  pass(`PR นี้ไม่ได้ขึ้น PROMPT_VERSION (ยังเป็น "${PROMPT_VERSION}")`);
}

// ── 3. หนี้ค้าง: เวอร์ชันปัจจุบันไม่มีรายงาน / รายงานครอบคลุมต่ำ (เตือน ไม่ตก) ──
if (mine.length === 0) {
  warn(
    `ยังไม่มีรายงาน ai:judge ของเวอร์ชัน "${PROMPT_VERSION}" เลย — หนี้ค้างจากรอบก่อน\n` +
      `      ➔ ทีมที่มีคีย์นักพัฒนารัน: npm run ai:judge -- --compare <เวอร์ชันก่อนหน้า>\n` +
      `      ➔ ดูขั้นตอนเต็มที่ docs/plans/HANDOFF_AI_JUDGE_BASELINE_2026-09-11.md`
  );
} else {
  const newest = mine[mine.length - 1];
  const data: ReportShape = JSON.parse(fs.readFileSync(path.join(REPORT_DIR, newest), "utf-8"));
  const total = data.summary?.total ?? 0;
  const ok = data.summary?.succeeded ?? 0;
  const pct = total > 0 ? Math.round((ok / total) * 100) : 0;
  if (pct < MIN_COVERAGE_PCT) {
    warn(
      `${newest}: สำเร็จ ${ok}/${total} เคส (${pct}%) ต่ำกว่าเกณฑ์ ${MIN_COVERAGE_PCT}%\n` +
        `      ➔ คะแนนเฉลี่ยมาจากชุดเคสที่ไม่ครบ จะเอียงไปทางเคสที่ผ่าน และเทียบข้ามรอบได้ไม่ตรง`
    );
  } else {
    pass(`${newest}: สำเร็จ ${ok}/${total} เคส (${pct}%)`);
  }
}

// ── 4. ตรรกะเทียบก่อน/หลัง ต้องไม่ตัดสินข้ามชุดเคส ──
// (ล็อกบั๊กที่เคยทำให้รายงาน "🟢 ดีขึ้น" ได้ทั้งที่เคสที่สำเร็จคนละชุดกัน)
console.log("\n   ตรวจตรรกะเทียบก่อน/หลัง (ข้อมูลสังเคราะห์ ไม่เรียกโมเดล):");

function mkCase(id: string, ok: boolean, score: number, thai = 90): CaseResult {
  return {
    id, category: "love", spreadId: "three-card", personaId: "seer",
    model: ok ? "test-model" : null, elapsedMs: 1000, ok,
    consistencyIssues: [], thaiScore: thai, thaiIssues: [],
    judge: ok
      ? { onQuestion: score, cardGrounded: score, actionable: score,
          personaFit: score, notVague: score, thaiNatural: score, average: score }
      : {},
  };
}
function mkReport(version: string, cases: CaseResult[]): JudgeReport {
  const ok = cases.filter((c) => c.ok);
  return {
    promptVersion: version, judgeModel: "test", startedAt: new Date().toISOString(), cases,
    summary: {
      total: cases.length, succeeded: ok.length,
      avgThaiScore: 90, avgElapsedMs: 1000, consistencyIssueRate: 0,
      rubric: { onQuestion: 0, cardGrounded: 0, actionable: 0, personaFit: 0, notVague: 0, thaiNatural: 0 },
      overall: 0,
    },
  };
}

// เคสที่ทับกัน (gold-001) คะแนนเท่าเดิม 3 → 3
// แต่รอบใหม่มี gold-002 คะแนน 5 เพิ่มเข้ามา ซึ่งรอบเก่าล้ม
// ถ้าเทียบค่าเฉลี่ยรวมจะกลายเป็น 3.00 → 4.00 = "ดีขึ้น" ทั้งที่เคสเดิมไม่ขยับเลย
const prev = mkReport("v-old", [mkCase("gold-001", true, 3), mkCase("gold-002", false, 0)]);
const curr = mkReport("v-new", [mkCase("gold-001", true, 3), mkCase("gold-002", true, 5)]);
const lines = buildComparison(curr, prev).join("\n");

if (lines.includes("🟢 ดีขึ้น")) {
  fail("เทียบข้ามชุดเคสแล้วยังรายงานว่า 'ดีขึ้น' — ตรรกะกันผลลวงไม่ทำงาน");
} else {
  pass("เคสที่ทับกันคะแนนเท่าเดิม ➔ ไม่รายงานว่าดีขึ้น แม้ค่าเฉลี่ยรวมจะสูงขึ้น");
}
if (!lines.includes("เคสที่สำเร็จทั้งสองรอบ (ใช้เทียบจริง): 1 เคส")) {
  fail("ไม่ได้พิมพ์จำนวนเคสที่ใช้เทียบจริง");
} else {
  pass("พิมพ์ความครอบคลุมและจำนวนเคสที่ใช้เทียบจริงกำกับไว้");
}
if (!lines.includes("🟡 เคสที่ทับกันมีแค่")) {
  fail("เคสทับกันน้อยแต่ไม่เตือน");
} else {
  pass("เคสที่ทับกันน้อยกว่าเกณฑ์ ➔ เตือนว่ายังตัดสินแทนทั้งชุดไม่ได้");
}

// ไม่มีเคสทับกันเลย ➔ ต้องปฏิเสธการเทียบ ไม่ใช่พิมพ์ตัวเลขหลอก
const noOverlap = buildComparison(
  mkReport("v-new", [mkCase("gold-003", true, 5)]),
  mkReport("v-old", [mkCase("gold-001", true, 1)])
).join("\n");
if (!noOverlap.includes("ไม่มีเคสที่สำเร็จทั้งสองรอบเลย")) {
  fail("ไม่มีเคสทับกันเลยแต่ยังพยายามเทียบ");
} else {
  pass("ไม่มีเคสทับกันเลย ➔ ปฏิเสธการเทียบ");
}


console.log("");
if (failures > 0) {
  console.log(`❌ ตก ${failures} ข้อ${warnings > 0 ? ` · เตือน ${warnings} ข้อ` : ""}\n`);
  process.exit(1);
}
console.log(
  warnings > 0
    ? `✨ ผ่าน (มีหนี้ค้าง ${warnings} ข้อที่ต้องตามเก็บ — ดูข้อความ 🟡 ข้างบน)\n`
    : "✨ เวอร์ชัน prompt ปัจจุบันมีผลวัดรองรับครบ\n"
);
