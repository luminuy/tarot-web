/**
 * QA — ยามเฝ้าตัวเลขในเอกสารแม่บท (Docs Numeric Truth Guard)
 *
 * ⚠️ ทำไมต้องมีไฟล์นี้
 * ตัวเลข "จำนวนด่านตรวจ" และ "จำนวนผัง" ในเอกสารเพี้ยนมาแล้ว 6 รอบใน 6 วัน
 * (21 → 23 → 24 → 27 → 29 → 32 ด่าน · 20 → 25 ผัง) เพราะกระจายอยู่ 8 ไฟล์
 * และไม่มีเครื่องตรวจ AI ตัวถัดไปที่อ่าน CLAUDE.md ก่อนทำงานจึงได้ตัวเลขผิดทุกครั้ง
 *
 * บทเรียน (หลักการข้อ 0.8): กฎที่ไม่มีเครื่องตรวจ คือกฎที่จะถูกละเมิดอีกแน่นอน
 *
 * รันด้วย: npx tsx scripts/qa/test-docs-numbers.ts
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SPREADS } from "../../src/data/spreads";
import { DECK } from "../../src/data/cards";
import { ARTICLES } from "../../src/data/articles";
import { STANDARD_SPREAD_IDS } from "../../src/lib/entitlement/limits";
import { COUNTS } from "../../src/components/layout/nav-links";
import { CHECKS } from "../github-auto";
import { assertNonEmptyCorpus } from "./lib/corpus";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");

const TRUTH = {
  gates: CHECKS.length,
  spreads: SPREADS.length,
  positions: SPREADS.reduce((s, x) => s + x.positions.length, 0),
  cards: DECK.length,
  articles: ARTICLES.length,
  freeSpreads: STANDARD_SPREAD_IDS.size,
};

interface Rule {
  name: string;
  re: RegExp;
  expected: number;
}

const RULES: Rule[] = [
  { name: "จำนวนด่านตรวจ (N ด่าน)", re: /(\d+)\s*(?:\/\s*\d+\s*)?ด่าน/g, expected: TRUTH.gates },
  { name: "สัดส่วนด่าน (N/N gates)", re: /(\d+)\/(\d+)\s*(?:ด่าน|verification gates)/g, expected: TRUTH.gates },
  {
    name: "จำนวนผัง (N ผัง)",
    // (?<!\d) กันไม่ให้ match เริ่มกลางตัวเลข — เดิม "ทั้ง 25 ผัง" ถูก lookbehind ตัดที่เลข 25
    // แล้วเครื่องมือไปเริ่มใหม่ที่ "5" ทำให้อ่านเป็น "5 ผัง" และแจ้งเตือนผิด (งาน D)
    re: /(?<!\d)(?<!ไพ่\s)(?<!ใหม่\s)(?<!ฟรี\s)(?<!ล็อก\s)(?<!เพิ่ม\s)(?<!ทั้ง\s)(?<!เปิด\s)(?<!เลือก\s)(?<!มี\s)(?<!อีก\s)(\d+)\s*ผัง/g,
    expected: TRUTH.spreads,
  },
  { name: "จำนวนผัง (ผัง N แบบ)", re: /ผัง(?:การเปิดไพ่|พยากรณ์)?\s*(?<!\d)(\d+)\s*แบบ/g, expected: TRUTH.spreads },
  { name: "จำนวนผัง (N Spreads)", re: /(?<!\d)(\d+)\s*Spreads/g, expected: TRUTH.spreads },
  { name: "จำนวนตำแหน่ง", re: /(?<!ทศนิยม\s*)(\d+)\s*ตำแหน่ง(?:พยากรณ์)?/g, expected: TRUTH.positions },
];

/** Ratchet — ข้อความที่ตั้งใจอ้างเลขเก่า พร้อมเหตุผลและเลขอ้างอิง */
interface AllowItem {
  file: string;
  match: string | RegExp;
  reason: string;
}

const ALLOWLIST: AllowItem[] = [
  {
    file: "docs/plans/MASTER_PLAN_2026-09-06.md",
    match: 'เขียนว่า "35/35 ด่าน',
    reason: "อ้างถึงตัวเลขที่ฉบับ 2026-09-07 เขียนผิดไว้ เพื่ออธิบายว่าทำไมต้องมีด่านนี้ — ห้ามแก้ย้อนหลัง",
  },
  {
    file: "docs/KNOWN_ISSUES.md",
    match: "24/24 ด่าน",
    reason: "บันทึกผลตรวจ ณ 2026-09-04 ซึ่งวันนั้นมี 24 ด่านจริง — ห้ามแก้ย้อนหลัง",
  },
  {
    file: "docs/KNOWN_ISSUES.md",
    match: "ตรวจสอบ 24 ด่าน ผ่าน 24/24",
    reason: "บันทึกผลตรวจ ณ 2026-09-04 ซึ่งวันนั้นมี 24 ด่านจริง — ห้ามแก้ย้อนหลัง",
  },
  {
    file: "docs/KNOWN_ISSUES.md",
    match: "ผ่าน 24 ด่าน repo:verify",
    reason: "บันทึกผลตรวจ ณ 2026-09-04 สำหรับ ISSUE-023 ซึ่งวันนั้นมี 24 ด่านจริง — ห้ามแก้ย้อนหลัง",
  },
  {
    file: "docs/KNOWN_ISSUES.md",
    match: "ตรวจสอบ 46 ด่าน ผ่านครบ",
    reason: "บันทึกผลตรวจ ISSUE-042 ณ 2026-09-11 ซึ่งวันนั้นมี 46 ด่านจริง — ห้ามแก้ย้อนหลัง",
  },
  {
    file: "docs/KNOWN_ISSUES.md",
    match: "(38/38 ด่าน)",
    reason: "แถว 'รอบก่อนหน้า (ประวัติ)' — บันทึกผลตรวจ ณ 2026-09-06 ซึ่งวันนั้นมี 38 ด่านจริง — ห้ามแก้ย้อนหลัง",
  },
  {
    file: "docs/KNOWN_ISSUES.md",
    match: "(43/43 ด่าน)",
    reason: "แถว 'รอบก่อนหน้า (ประวัติ)' — บันทึกผลตรวจ ณ 2026-09-09 ซึ่งวันนั้นมี 43 ด่านจริง — ห้ามแก้ย้อนหลัง",
  },
  {
    file: "docs/KNOWN_ISSUES.md",
    match: "(รอบก่อน 2026-09-09 · 43 ด่านในวันนั้น)",
    reason: "แถว 'วิธีตรวจ' ท่อนประวัติ — อ้างจำนวนด่าน ณ 2026-09-09 ซึ่งวันนั้นมี 43 ด่านจริง — ห้ามแก้ย้อนหลัง",
  },
];

const TARGET_FILES = [
  /*
   * ⚠️ ไฟล์ workflow ต้องอยู่ในรายการนี้ด้วย (บทเรียน 2026-09-09)
   * `pr.yml` พิมพ์ "รายงานตรวจสอบคุณภาพ" ลงทุก PR โดยมีตัวเลขฝังตายอยู่ในข้อความ
   * ("20 Spreads · 541/541 Assertions") ซึ่งไม่ตรงกับของจริงมานาน (25 ผัง · 1,295 assertion)
   * = รายงานที่คนอ่านทุกครั้งที่เปิด PR กำลังพูดเลขผิด และไม่มีใครตรวจเลยเพราะ
   * ด่านนี้เคยส่องแต่ไฟล์ .md ในโฟลเดอร์เอกสารเท่านั้น
   *
   * บทเรียนเดิมของด่านนี้ ("ตัวเลขที่เขียนด้วยมือจะเพี้ยนเสมอถ้าไม่มีเครื่องตรวจ")
   * ใช้กับข้อความที่ CI พ่นออกมาเหมือนกันทุกประการ
   */
  ".github/workflows/pr.yml",
  ".github/workflows/auto-release.yml",
  "CLAUDE.md",
  "GEMINI.md",
  "README.md",
  "docs/INDEX.md",
  "docs/ARCHITECTURE.md",
  "docs/AI_COLLABORATION_GUIDELINES.md",
  "docs/KNOWN_ISSUES.md",
  "docs/LOCAL_SETUP.md",
  "docs/ADMIN_PANEL.md",
  "docs/PENDING_SETUP.md",
  "docs/WORK_LOG.md",

  /**
   * ⚠️ แผนแม่บทต้องอยู่ในขอบเขตด้วย (บทเรียน 2026-09-14)
   * `MASTER_PLAN` คือเอกสารที่เจ้าของโปรเจกต์อ่านเป็นอันดับแรกเพื่อดูว่า "เหลืออะไร"
   * แต่ `docs/plans/` ไม่เคยอยู่ในรายการนี้เลย ตัวเลขในนั้นจึงเน่าเงียบอยู่ 7 วัน
   * โดยยังเขียนว่า "35/35 ด่าน" ขณะที่ของจริงเดินไปถึง 56 ด่านแล้ว
   *
   * เอาเฉพาะ MASTER_PLAN เข้ามา ไม่เหมาเอา `docs/plans/` ทั้งโฟลเดอร์
   * เพราะแผนส่งต่อฉบับอื่นเป็น "บันทึก ณ เวลานั้น" โดยเจตนา — ตัวเลขเก่าในนั้นคือหลักฐาน ไม่ใช่บั๊ก
   */
  "docs/plans/MASTER_PLAN_2026-09-06.md",
];

interface Discrepancy {
  file: string;
  line: number;
  ruleName: string;
  found: string;
  foundVal: number;
  expectedVal: number;
  lineContent: string;
}

function checkDocs() {
  console.log("=======================================================");
  console.log("📚 DOCS NUMERIC TRUTH GUARD — ตรวจสอบตัวเลขในเอกสารแม่บท");
  console.log("=======================================================");
  console.log(`แหล่งความจริงจาก Codebase:`);
  console.log(`  - จำนวนด่านตรวจ (CHECKS.length)    : ${TRUTH.gates}`);
  console.log(`  - จำนวนผังพยากรณ์ (SPREADS.length) : ${TRUTH.spreads}`);
  console.log(`  - จำนวนตำแหน่งรวม (positions)      : ${TRUTH.positions}`);
  console.log(`  - จำนวนไพ่ในสำรับ (DECK.length)    : ${TRUTH.cards}`);
  console.log(`  - จำนวนบทความ (ARTICLES.length)    : ${TRUTH.articles}`);
  console.log(`  - จำนวนผังฟรี (STANDARD_SPREADS)   : ${TRUTH.freeSpreads}`);
  console.log("");

  const discrepancies: Discrepancy[] = [];

  for (const relPath of TARGET_FILES) {
    const fullPath = path.join(ROOT, relPath);
    if (!fs.existsSync(fullPath)) {
      /* 🔴 R-07: ไฟล์เป้าหมายหาย = ตัวเลขในไฟล์นั้นไม่ถูกตรวจเลย ไม่ใช่ "ไม่มีเลขผิด" */
      console.error(`❌ ไฟล์ที่ด่านนี้ต้องตรวจหายไป: ${relPath} — แก้ TARGET_FILES ถ้าย้ายไฟล์จริง`);
      process.exit(1);
    }

    const raw = fs.readFileSync(fullPath, "utf8");
    const lines = raw.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const line = lines[i];

      // WORK_LOG.md: ตรวจเฉพาะบล็อกก่อนหัวข้อ ### 🗓️ อันแรก
      if (relPath === "docs/WORK_LOG.md" && line.startsWith("### 🗓️")) {
        break;
      }

      for (const rule of RULES) {
        rule.re.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = rule.re.exec(line)) !== null) {
          const numStr = match[1];
          const val = parseInt(numStr, 10);
          if (isNaN(val)) continue;

          // ตรวจ allowlist
          const isAllowed = ALLOWLIST.some((al) => {
            if (al.file !== relPath) return false;
            if (typeof al.match === "string") {
              return line.includes(al.match);
            }
            return al.match.test(line);
          });

          if (isAllowed) continue;

          if (val !== rule.expected) {
            discrepancies.push({
              file: relPath,
              line: lineNum,
              ruleName: rule.name,
              found: match[0],
              foundVal: val,
              expectedVal: rule.expected,
              lineContent: line.trim(),
            });
          }
        }
      }
    }
  }

  if (discrepancies.length > 0) {
    console.error(`❌ พบตัวเลขในเอกสารที่ไม่ตรงกับของจริง (${discrepancies.length} จุด):`);
    for (const d of discrepancies) {
      console.error(`  - ${d.file}:${d.line} [${d.ruleName}] → พบ "${d.found}" (${d.foundVal}) แต่ของจริงคือ ${d.expectedVal}`);
      console.error(`    เนื้อหา: ${d.lineContent}`);
    }
    console.error(`\n💡 วิธีแก้: อัปเดตตัวเลขในเอกสารให้ตรงกับ codebase หรือใส่ใน ALLOWLIST หากเป็นบันทึกประวัติ\n`);
    process.exit(1);
  }

  // -------------------------------------------------------------
  // ตรวจสอบ P-01: COUNTS ใน nav-links.ts ต้องตรงกับ dataset เสมอ
  // -------------------------------------------------------------
  if (COUNTS.cards !== DECK.length || COUNTS.articles !== ARTICLES.length || COUNTS.spreads !== SPREADS.length) {
    console.error(`❌ COUNTS ใน nav-links.ts ไม่ตรงกับ dataset จริง:`);
    console.error(`  - cards: พบ ${COUNTS.cards} (ควรเป็น ${DECK.length})`);
    console.error(`  - articles: พบ ${COUNTS.articles} (ควรเป็น ${ARTICLES.length})`);
    console.error(`  - spreads: พบ ${COUNTS.spreads} (ควรเป็น ${SPREADS.length})`);
    process.exit(1);
  }
  console.log(`✅ COUNTS ใน nav-links.ts ตรงกับ dataset จริง (${COUNTS.cards} ไพ่ / ${COUNTS.articles} บทความ / ${COUNTS.spreads} ผัง)`);

  checkIncidentIds();

  console.log(`✅ เอกสารทั้งหมด ${TARGET_FILES.length} ไฟล์ สอดคล้องกับความจริงของระบบ 100%\n`);
}

/**
 * ตรวจทะเบียนเลข INC ใน INCIDENT_LOG.md
 *
 * ⚠️ ทำไมต้องมี (เจอจริง 2026-09-14)
 * มีเลข INC ซ้ำกันอยู่ 10 คู่ และมีบล็อกที่ถูกแปะซ้ำคำต่อคำ 1 ก้อน
 * เพราะหลาย agent เขียนขนานกันแล้วต่างคนต่างหยิบ "เลขถัดไป" จาก snapshot คนละเวลา
 * ผลคือการอ้าง "INC-0136" ในโค้ดหรือเอกสาร ชี้ไปได้สองเหตุการณ์ที่ไม่เกี่ยวกันเลย
 * และยังมีการอ้างเลข INC ที่ไม่มีอยู่จริงในแฟ้มด้วย
 *
 * บทเรียนเดิมของไฟล์นี้ใช้ได้ตรง ๆ: กฎที่ไม่มีเครื่องตรวจ คือกฎที่จะถูกละเมิดอีกแน่นอน
 *
 * กติกา: เลขซ้ำให้ผู้ที่บันทึกทีหลังเติมท้ายด้วย b (เช่น INC-0136b) ตามแบบเดียวกับ ISSUE-010b
 */
function checkIncidentIds() {
  const LOG = "docs/INCIDENT_LOG.md";
  const logPath = path.join(ROOT, LOG);
  if (!fs.existsSync(logPath)) {
    /* 🔴 R-07: ไม่มีทะเบียน = กฎ "ห้ามอ้างเลข INC ที่ไม่มีจริง" กลายเป็น no-op เงียบ ๆ */
    console.error(`❌ ไม่พบ ${LOG} — ตรวจทะเบียนเลข INC ไม่ได้เลย (กฎเหล็กข้อ 0 บังคับให้ไฟล์นี้มีอยู่)`);
    process.exit(1);
  }

  const raw = fs.readFileSync(logPath, "utf8");
  const lines = raw.split("\n");

  const seen = new Map<string, number>();
  const dupes: { id: string; line: number; firstLine: number }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const m = /^### (INC-\d{4}[a-z]?) /.exec(lines[i]);
    if (!m) continue;
    const id = m[1];
    const prev = seen.get(id);
    if (prev !== undefined) {
      dupes.push({ id, line: i + 1, firstLine: prev });
      continue;
    }
    seen.set(id, i + 1);
  }

  if (dupes.length > 0) {
    console.error(`❌ เลข INC ซ้ำใน ${LOG} (${dupes.length} รายการ):`);
    for (const d of dupes) {
      console.error(`  - ${LOG}:${d.line} ใช้เลข ${d.id} ซ้ำกับบรรทัด ${d.firstLine}`);
    }
    console.error(`\n💡 วิธีแก้: ให้รายการที่บันทึกทีหลังเติมท้ายด้วย b (เช่น ${dupes[0].id}b) แล้วตามแก้จุดที่อ้างถึงให้ตรง\n`);
    process.exit(1);
  }

  // เลข INC ที่ถูกอ้างถึงจากที่อื่น ต้องมีอยู่จริงในแฟ้ม
  const REF_GLOBS = ["CLAUDE.md", "GEMINI.md", "README.md", "docs", "scripts", "src"];
  const dangling: { file: string; line: number; id: string }[] = [];
  /** ไฟล์ที่ถูกเปิดอ่านจริง — คลังว่าง = ด่านนี้ไม่ได้ตรวจอะไรเลย (R-05) */
  const scannedRefFiles: string[] = [];

  const walk = (rel: string) => {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) return;
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(abs)) {
        if (name === "node_modules" || name.startsWith(".")) continue;
        walk(path.join(rel, name));
      }
      return;
    }
    if (!/\.(md|ts|tsx)$/.test(rel)) return;
    if (rel === LOG) return;
    scannedRefFiles.push(rel);
    const content = fs.readFileSync(abs, "utf8").split("\n");
    for (let i = 0; i < content.length; i++) {
      const re = /INC-(\d{4})([a-z]?)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(content[i])) !== null) {
        const id = `INC-${m[1]}${m[2]}`;
        if (!seen.has(id)) dangling.push({ file: rel, line: i + 1, id });
      }
    }
  };
  for (const g of REF_GLOBS) walk(g);
  assertNonEmptyCorpus("ไฟล์ที่สแกนหาเลข INC", scannedRefFiles, "ตรวจว่า REF_GLOBS ยังชี้ไปที่โฟลเดอร์ที่มีอยู่จริง");

  if (dangling.length > 0) {
    console.error(`❌ มีการอ้างเลข INC ที่ไม่มีอยู่จริงใน ${LOG} (${dangling.length} จุด):`);
    for (const d of dangling) console.error(`  - ${d.file}:${d.line} → ${d.id}`);
    console.error(`\n💡 วิธีแก้: แก้เลขให้ตรงกับรายการจริง หรือบันทึกเหตุการณ์นั้นลง ${LOG} ให้ครบ\n`);
    process.exit(1);
  }

  console.log(`✅ ทะเบียนเลข INC ไม่ซ้ำและไม่มีการอ้างเลขที่ไม่มีอยู่จริง (${seen.size} รายการ)`);
}

checkDocs();
