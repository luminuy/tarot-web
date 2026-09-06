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
    re: /(?<!ไพ่\s)(?<!ใหม่\s)(?<!ฟรี\s)(?<!ล็อก\s)(?<!เพิ่ม\s)(?<!ทั้ง\s)(?<!เปิด\s)(?<!เลือก\s)(?<!มี\s)(?<!อีก\s)(\d+)\s*ผัง/g,
    expected: TRUTH.spreads,
  },
  { name: "จำนวนผัง (ผัง N แบบ)", re: /ผัง(?:การเปิดไพ่|พยากรณ์)?\s*(\d+)\s*แบบ/g, expected: TRUTH.spreads },
  { name: "จำนวนผัง (N Spreads)", re: /(\d+)\s*Spreads/g, expected: TRUTH.spreads },
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
];

const TARGET_FILES = [
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
    if (!fs.existsSync(fullPath)) continue;

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

  console.log(`✅ เอกสารทั้งหมด ${TARGET_FILES.length} ไฟล์ สอดคล้องกับความจริงของระบบ 100%\n`);
}

checkDocs();
