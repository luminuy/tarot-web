/**
 * 🛡️ ด่านที่ตรวจด่านด้วยกันเอง (Gate Integrity Gate · R-05 · R-07)
 * ===========================================================================
 *
 * ## ทำไมต้องมีด่านนี้
 *
 * รอบตรวจ 2026-09-16 พบ **ด่านหลอก 2 ด่าน** (`test-safety` ทดสอบเรกเอ็กซ์กับตัวมันเอง ·
 * `test-no-fake-card` ข้ามการตรวจ 4 หัวข้อเงียบ ๆ เมื่อไฟล์หาย) รอบ 2026-09-17 พบอีก **12 ด่าน**
 * ที่เป็นแพตเทิร์นเดียวกัน — **แก้ทีละด่านไม่มีวันจบ เพราะสาเหตุเชิงโครงสร้างยังอยู่**
 *
 * ด่านนี้จึงตรวจ "ตัวด่าน" ไม่ใช่ตรวจโค้ดผลิตภัณฑ์ จับสามแพตเทิร์นที่ทำให้ด่านผ่านตลอดกาล:
 *
 * ### 1. ข้ามเงียบเมื่อไฟล์หาย
 * ```ts
 * if (fs.existsSync(p)) { check("...", ...) }   // ❌ ไฟล์หาย = ไม่ตรวจ = ผ่าน
 * ```
 * ที่ถูกคือทำให้ไฟล์หายเป็น **การตกด่าน**:
 * ```ts
 * if (!fs.existsSync(p)) { check("หาไฟล์เจอ", false); return; }   // ✅
 * ```
 *
 * ### 2. วนคลังไฟล์โดยไม่ตรวจว่าคลังว่าง
 * "สแกนศูนย์ไฟล์" กับ "ไม่พบข้อผิดพลาด" ให้ผลลัพธ์เหมือนกัน — ต้องเรียก
 * `assertNonEmptyCorpus()` จาก `scripts/qa/lib/corpus.ts`
 *
 * ### 3. พิมพ์ว่า "ข้าม" แล้วจบแบบสำเร็จ
 * ทางออกเงียบที่ไม่ยกธงอะไรเลย ผู้ตรวจอ่านสรุปท้ายแล้วเห็น ✅ เหมือนกันทุกประการ
 *
 * ## ⚠️ รายการยกเว้นต้องมีเหตุผลกำกับเสมอ
 *
 * ทุกรายการใน `EXEMPT_*` ต้องเขียนว่าทำไมถึงไม่ใช่ด่านหลอก — รายการที่ไม่มีเหตุผล
 * คือประตูหลังที่เปิดทิ้งไว้ให้คนถัดไปเดินผ่าน
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const QA_DIR = path.join(ROOT, "scripts/qa");

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

/** ไฟล์ด่านทั้งหมดที่อยู่ในชุดตรวจกลาง */
function gateFiles(): string[] {
  return fs
    .readdirSync(QA_DIR)
    .filter((f) => /^(test-|run-).*\.tsx?$/.test(f))
    .map((f) => path.join(QA_DIR, f));
}

/** ตัดคอมเมนต์ออกก่อนวิเคราะห์ — คอมเมนต์อธิบายแพตเทิร์นไม่ใช่การใช้แพตเทิร์น */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " ")).replace(/(^|[^:])\/\/.*$/gm, "$1");
}

/** ตัวเรียกที่ถือว่าเป็น "การยืนยัน" ของด่าน */
const ASSERT_CALL = /\b(check|assert|assertUi|fail|expect)\s*\(/;

// ─────────────────────────────────────────────────────────────────────────────
// 1. ห้ามข้ามเงียบเมื่อไฟล์หาย
// ─────────────────────────────────────────────────────────────────────────────
/**
 * ยกเว้นได้เฉพาะเมื่อบล็อกนั้น **ไม่ได้ห่อการยืนยัน** เช่นเป็นการสั่ง build
 * หรืออ่านค่าประกอบที่มีทางถอยชัดเจน — เขียนเหตุผลกำกับทุกบรรทัด
 */
const EXEMPT_SILENT_SKIP: Record<string, string> = {
  "test-bundle-budget.ts:297":
    "ensureBuildExists() — บล็อกนี้สั่ง build ไม่ได้ห่อการยืนยัน · ไม่มี build = build ให้",
  "test-meta-length.ts:53": "ensureBuildExists() — เหมือนข้างบน",
  "test-en-routing.ts:398": "ensureBuildExists() — เหมือนข้างบน",
  "test-no-fake-card.ts:15":
    "readRequiredFile() — ตัวช่วยที่บันทึกการตกด่านให้เองเมื่อไฟล์หาย (เป็นทางแก้ ไม่ใช่ปัญหา)",
};

const silentSkips: string[] = [];

for (const file of gateFiles()) {
  const rel = path.relative(QA_DIR, file);
  const src = stripComments(fs.readFileSync(file, "utf-8"));
  const lines = src.split("\n");

  lines.forEach((line, idx) => {
    // สนใจเฉพาะรูป `if (existsSync(...))` แบบ **ไม่ปฏิเสธ** — รูปปฏิเสธคือ guard ที่ถูกต้อง
    // ⚠️ ต้องผูกกับต้นบรรทัด ไม่งั้นจะไปจับข้อความตัวอย่างที่อยู่ในสตริงของด่านนี้เอง
    if (!/^\s*(\}\s*else\s+)?if\s*\(\s*(fs\.)?existsSync\s*\(/.test(line)) return;

    // หาขอบเขตของบล็อกแบบนับวงเล็บปีกกา
    let depth = 0;
    let started = false;
    let body = "";
    let endIdx = idx;
    for (let i = idx; i < Math.min(lines.length, idx + 60); i++) {
      for (const ch of lines[i]) {
        if (ch === "{") {
          depth++;
          started = true;
        } else if (ch === "}") depth--;
      }
      body += lines[i] + "\n";
      endIdx = i;
      if (started && depth <= 0) break;
    }

    if (!ASSERT_CALL.test(body)) return; // ไม่ได้ห่อการยืนยัน — ไม่ใช่ด่านหลอก
    // มี else ที่บันทึกการตกด่าน = ครอบคลุมแล้ว
    const after = lines.slice(endIdx, endIdx + 3).join("\n");
    if (/\belse\b/.test(after)) return;

    const key = `${rel}:${idx + 1}`;
    if (key in EXEMPT_SILENT_SKIP) return;
    silentSkips.push(`   · ${key}`);
  });
}

check(
  "ไม่มีด่านไหนห่อการยืนยันด้วย `if (existsSync(...))` โดยไม่มี else",
  silentSkips.length === 0,
  silentSkips.length > 0
    ? `   ไฟล์หาย = ไม่ตรวจ = รายงานผ่าน · เปลี่ยนเป็น \`if (!existsSync) { check("...", false); return; }\`\n${silentSkips.join("\n")}`
    : "",
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. ด่านที่วนคลังไฟล์ต้องยืนยันว่าคลังไม่ว่าง
// ─────────────────────────────────────────────────────────────────────────────
/** ตัวบ่งชี้ว่าด่านนี้ "อ่านคลังไฟล์แล้ววนตรวจ" */
const READS_CORPUS = /\breaddirSync\s*\(|\bwalk\s*\(|renderedRouteMap\s*\(|readAllRenderedPages\s*\(/;

/**
 * ยกเว้นได้เฉพาะด่านที่อ่านไฟล์แบบ "ระบุชื่อตายตัว" ไม่ได้วนคลัง
 * หรือมีการยืนยันจำนวนด้วยวิธีของตัวเองที่ชัดเจนกว่า
 */
const EXEMPT_CORPUS: Record<string, string> = {
  "test-gate-integrity.ts": "ตัวด่านนี้เอง — ยืนยันจำนวนไฟล์ด่านด้วยตัวเองที่ข้อ 4",
  "test-judge-baseline.ts":
    "คลังของด่านนี้คือรายงาน ai:judge ซึ่ง **ว่างได้โดยชอบ** (ยังไม่มีใครรันด้วยคีย์จริง) " +
    "และความว่างนั้นไม่ได้เงียบ — ด่านพิมพ์ warn() ระบุว่าเป็นหนี้ค้างพร้อมคำสั่งที่ต้องรัน " +
    "ดู scripts/qa/test-judge-baseline.ts หัวข้อ 3",
};

const missingCorpusGuard: string[] = [];

for (const file of gateFiles()) {
  const rel = path.relative(QA_DIR, file);
  if (rel in EXEMPT_CORPUS) continue;
  const src = stripComments(fs.readFileSync(file, "utf-8"));
  if (!READS_CORPUS.test(src)) continue;
  if (src.includes("assertNonEmptyCorpus(")) continue;
  // ยอมรับการยืนยันจำนวนที่เขียนเองด้วย ถ้าผูกกับ check()/assert() จริง
  if (/(check|assert)\([^)]*,\s*[A-Za-z_.[\]]+\.(length|size)\s*>\s*0/.test(src)) continue;
  missingCorpusGuard.push(`   · ${rel}`);
}

check(
  "ด่านที่วนคลังไฟล์ทุกตัวยืนยันว่าคลังไม่ว่าง",
  missingCorpusGuard.length === 0,
  missingCorpusGuard.length > 0
    ? `   "สแกนศูนย์ไฟล์" กับ "ไม่พบข้อผิดพลาด" หน้าตาเหมือนกัน · เรียก assertNonEmptyCorpus() จาก scripts/qa/lib/corpus.ts\n${missingCorpusGuard.join("\n")}`
    : "",
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. ห้ามพิมพ์ว่า "ข้าม" แล้วจบแบบสำเร็จโดยไม่ยกธงอะไรเลย
// ─────────────────────────────────────────────────────────────────────────────
/**
 * คำที่บอกว่ากำลังจะข้ามการตรวจ
 * ⚠️ ห้ามจับคำว่า "ข้าม" ลอย ๆ — ในภาษาไทยมันแปลว่า "across/cross" ได้ด้วย
 * ("ลิงก์ข้ามเครื่องมือเรนเดอร์" · "ค้นหาบัญชีข้าม Identity") ซึ่งไม่เกี่ยวกับการข้ามการตรวจเลย
 */
const SKIP_WORD = /ข้าม(ด่าน|กฎ|การตรวจ|ข้อ|หัวข้อ|เคส)|⏭|\bskipping\b/i;
/** สิ่งที่ยอมรับได้ว่า "ยกธงแล้ว" */
const RAISES_FLAG = /process\.exitCode\s*=\s*1|process\.exit\(1\)|\bfail\s*\(|\bwarn\s*\(|check\([^)]*,\s*false/;

const quietSkips: string[] = [];

for (const file of gateFiles()) {
  const rel = path.relative(QA_DIR, file);
  const src = stripComments(fs.readFileSync(file, "utf-8"));
  const lines = src.split("\n");

  lines.forEach((line, idx) => {
    if (!/console\.(log|info)\s*\(/.test(line)) return;
    if (!SKIP_WORD.test(line)) return;
    // ดูรอบ ๆ 6 บรรทัดว่ามีการยกธงไหม
    const around = lines.slice(Math.max(0, idx - 3), idx + 4).join("\n");
    if (RAISES_FLAG.test(around)) return;
    quietSkips.push(`   · ${rel}:${idx + 1} — ${line.trim().slice(0, 96)}`);
  });
}

check(
  "ไม่มีด่านไหนพิมพ์ว่าข้ามการตรวจแล้วจบแบบสำเร็จเงียบ ๆ",
  quietSkips.length === 0,
  quietSkips.length > 0
    ? `   ทางออกเงียบทำให้ผู้ตรวจเห็น ✅ เหมือนกับตอนตรวจแล้วผ่านจริง · ต้อง warn() หรือ fail()\n${quietSkips.join("\n")}`
    : "",
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. ตัวด่านนี้เองต้องไม่กลายเป็นด่านหลอก
// ─────────────────────────────────────────────────────────────────────────────
const gates = gateFiles();
check(`สแกนไฟล์ด่านได้ ${gates.length} ไฟล์`, gates.length >= 50, "อ่านคลังด่านไม่เจอ — ตรวจ QA_DIR");
check(
  "ตัวช่วย assertNonEmptyCorpus มีอยู่จริง",
  fs.existsSync(path.join(QA_DIR, "lib/corpus.ts")),
);

console.log(`\n${pass}/${pass + fail} ผ่าน`);
if (fail > 0) process.exit(1);
