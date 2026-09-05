/**
 * QA — ยามเฝ้ากฎ will-change ใน CSS (Will-Change GPU Layer Guard)
 *
 * ⚠️ ทำไมต้องมีไฟล์นี้
 * กฎใน globals.css:367 และบทเรียน INC-0056 เขียนไว้ชัดว่า:
 * "ห้ามตั้ง will-change ถาวรบน element ที่ไม่ได้กำลังอนิเมต เพราะมันจอง GPU layer ค้างไว้
 * ทำให้กินหน่วยความจำ GPU และเฟรมเรตตก (fps ตกจาก 58 -> 30)"
 * แต่กฎที่เป็นเพียงคอมเมนต์ก็ยังถูกละเมิดใน globals.css:486 (.dropdown-panel-base) (ISSUE-027)
 *
 * **บทเรียน: กฎที่ไม่มีเครื่องตรวจ คือกฎที่จะถูกละเมิดอีกแน่นอน**
 *
 * ────────────────────────────────────────────────────────────────
 * กฎที่ตรวจ:
 *  - สแกนไฟล์ .css ใน src/
 *  - ทุกบล็อก selector ที่ประกาศ `will-change:` ต้องเป็น selector ที่สื่อถึงสถานะกำลังเคลื่อนไหว/อนิเมต
 *    เช่น มี `-entering`, `-exiting`, `-active`, `-animating`, `:hover`, `:focus`, `:active`, `[data-state=...]`
 *  - ห้ามประกาศบนคลาสฐานที่คงอยู่ถาวร เช่น `.dropdown-panel-base`
 *
 * 🔒 หลักการ Ratchet:
 *  - ถ้ามีจุดละเมิดเก่าให้ระบุใน ALLOWLIST
 *  - ห้ามเพิ่มรายการใหม่
 *
 * รันด้วย: npx tsx scripts/qa/test-will-change.ts
 */

import fs from "node:fs";
import path from "node:path";

const SRC = path.join(process.cwd(), "src");

/**
 * รายการผ่อนผันแบบ Ratchet (ถ้ามี)
 */
const ALLOWLIST: { file: string; selector: string; reason: string }[] = [];

/** คำบ่งบอกสถานะที่กำลังเกิด interaction หรือ animation */
const ACTIVE_STATE_KEYWORDS = [
  "-entering",
  "-exiting",
  "-active",
  "-animating",
  ":hover",
  ":focus",
  ":active",
  "[data-state=",
  "[aria-expanded=\"true\"]",
  "[aria-busy=\"true\"]",
];

interface Violation {
  file: string;
  line: number;
  selector: string;
  code: string;
}

function findCssFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findCssFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".css")) {
      results.push(fullPath);
    }
  }
  return results;
}

function checkCssFile(filePath: string): Violation[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const violations: Violation[] = [];

  let currentSelector = "";
  let inRuleBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // ละเว้นบรรทัดคอมเมนต์ล้วน
    if (line.startsWith("/*") || line.startsWith("*") || line.endsWith("*/")) {
      continue;
    }

    if (line.includes("{")) {
      const parts = line.split("{");
      currentSelector = (currentSelector + " " + parts[0]).trim();
      inRuleBlock = true;
    } else if (!inRuleBlock && line.length > 0 && !line.startsWith("@")) {
      currentSelector = (currentSelector + " " + line).trim();
    }

    if (inRuleBlock && line.includes("will-change:")) {
      const isAllowed = ALLOWLIST.some(
        (item) => filePath.endsWith(item.file) && item.selector === currentSelector
      );

      const isDynamic = ACTIVE_STATE_KEYWORDS.some((kw) =>
        currentSelector.toLowerCase().includes(kw.toLowerCase())
      );

      if (!isAllowed && !isDynamic) {
        violations.push({
          file: path.relative(process.cwd(), filePath),
          line: i + 1,
          selector: currentSelector || "(unknown)",
          code: line,
        });
      }
    }

    if (line.includes("}")) {
      inRuleBlock = false;
      currentSelector = "";
    }
  }

  return violations;
}

function run(): void {
  console.log("🔍 ตรวจสอบ will-change ในไฟล์ CSS ทั้งหมด (GPU Layer Guard)...\n");

  const cssFiles = findCssFiles(SRC);
  const allViolations: Violation[] = [];

  for (const file of cssFiles) {
    const violations = checkCssFile(file);
    allViolations.push(...violations);
  }

  if (allViolations.length > 0) {
    console.error("❌ พบ will-change ที่ประกาศใน selector คงที่ (ไม่ได้อยู่ในสถานะ active/animating):");
    for (const v of allViolations) {
      console.error(`  - ${v.file}:${v.line} -> selector: "${v.selector}"`);
      console.error(`    โค้ด: ${v.code}`);
      console.error(
        `    💡 คำแนะนำ: will-change ควรประกาศเฉพาะในสถานะ active/entering หรือ hover เท่านั้น เพื่อคืนหน่วยความจำ GPU เมื่อไม่ได้ใช้งาน\n`
      );
    }
    process.exit(1);
  }

  // ตรวจสอบ Ratchet: ถ้า ALLOWLIST มีแต่โค้ดแก้ไปแล้ว ให้เตือนนำออกจาก ALLOWLIST
  for (const allowed of ALLOWLIST) {
    console.warn(`⚠️ รายการใน ALLOWLIST ยังอยู่: ${allowed.file} (${allowed.selector})`);
  }

  console.log("✅ ผ่านทุกเกณฑ์: will-change ทั้งหมดอยู่ในสถานะ active/entering เท่านั้น ไม่มี element ใดจอง GPU layer ค้างไว้\n");
  process.exit(0);
}

run();
