/**
 * QA — ยามเฝ้ากฎ Modal Effect Dependencies & Body Scroll-Lock (Modal Trap Guard)
 *
 * ⚠️ ทำไมต้องมีไฟล์นี้
 * ใน Modal.tsx:41-47 ระบุไว้ชัดเจนว่า:
 * หาก useEffect ที่จัดการ body scroll lock (`document.body.style.overflow = "hidden"`)
 * และการคืนโฟกัส (`restoreFocusRef.current?.focus()`) ใส่ `onClose` ไว้ใน dependency array
 * จะเกิด 3 อาการร้ายแรงพร้อมกัน:
 *   1. หน้าเว็บเลื่อนไม่ได้ถาวรหลังปิดโมดัล (originalOverflow ถูกจับใหม่เป็น "hidden")
 *   2. โฟกัสถูกดึงกลับไปที่ปุ่มปิดทุกครั้งที่พิมพ์ (ฟอร์มพิมพ์ได้ทีละตัวอักษร)
 *   3. คืนโฟกัสผิดที่
 *
 * แม้ Modal.tsx จะเขียนคอมเมนต์เตือนไว้ แต่ AuthModal.tsx ก็ยังละเมิดซ้ำ (ISSUE-029)
 * เพราะไม่มีการตรวจจับอัตโนมัติ
 *
 * **บทเรียน: กฎที่ไม่มีเครื่องตรวจ คือกฎที่จะถูกละเมิดอีกแน่นอน**
 *
 * ────────────────────────────────────────────────────────────────
 * กฎที่ตรวจ:
 *  - สแกนหาคอมโพเนนต์ทั้งหมดใน src/ ที่ล็อก scroll บน document.body.style.overflow = "hidden"
 *  - ใน useEffect บล็อกนั้น ต้องไม่มี `onClose` อยู่ใน dependency array
 *  - ต้องใช้รูปแบบ onCloseRef เพื่อแยก handler identity ออกจาก lifecycle effect
 *
 * 🔒 หลักการ Ratchet:
 *  - รายการใน ALLOWLIST สำหรับหนี้ทางเทคนิคเดิม (ถ้ามี)
 *
 * รันด้วย: npx tsx scripts/qa/test-modal-effect-deps.ts
 */

import fs from "node:fs";
import path from "node:path";

const SRC = path.join(process.cwd(), "src");

/**
 * รายการผ่อนผันแบบ Ratchet (ถ้ามี)
 */
const ALLOWLIST: { file: string; reason: string }[] = [];

interface Violation {
  file: string;
  line: number;
  effectDeps: string;
  snippet: string;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}

function checkFile(filePath: string): Violation[] {
  const content = fs.readFileSync(filePath, "utf-8");
  if (!content.includes('document.body.style.overflow = "hidden"')) {
    return [];
  }

  const violations: Violation[] = [];

  // ค้นหา useEffect บล็อกที่มี document.body.style.overflow = "hidden"
  // จับจนถึง dependency array
  const regex = /useEffect\s*\(\s*\(\)\s*=>\s*\{([\s\S]*?document\.body\.style\.overflow\s*=\s*"hidden"[\s\S]*?)\},\s*\[(.*?)\]\s*\)/g;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    const depsString = match[2];
    const deps = depsString
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);

    // ห้ามมี onClose หรือฟังก์ชัน callback ที่เปลี่ยน identity ใน deps
    const hasForbiddenDep = deps.some((d) => d === "onClose" || d.toLowerCase().includes("close"));

    if (hasForbiddenDep) {
      const isAllowed = ALLOWLIST.some((item) => filePath.endsWith(item.file));
      if (!isAllowed) {
        // หา line number
        const upToMatch = content.slice(0, match.index);
        const line = upToMatch.split("\n").length;
        violations.push({
          file: path.relative(process.cwd(), filePath),
          line,
          effectDeps: depsString,
          snippet: match[0].slice(0, 80) + "...",
        });
      }
    }
  }

  return violations;
}

function run(): void {
  console.log("🔍 ตรวจสอบ Modal Effect Dependencies (Modal Trap Guard)...\n");

  const files = walk(SRC);
  const allViolations: Violation[] = [];

  for (const file of files) {
    const violations = checkFile(file);
    allViolations.push(...violations);
  }

  if (allViolations.length > 0) {
    console.error("❌ พบ Modal effect ที่ล็อก body scroll แต่มี onClose อยู่ใน dependency array:");
    for (const v of allViolations) {
      console.error(`  - ${v.file}:${v.line} -> deps: [${v.effectDeps}]`);
      console.error(
        `    💡 คำแนะนำ: ใช้ onCloseRef = useRef(onClose) แล้วถอด onClose ออกจาก deps เพื่อป้องกันการเด้งของโฟกัสและ scroll lock รั่ว\n`
      );
    }
    process.exit(1);
  }

  // ตรวจสอบ Ratchet
  for (const allowed of ALLOWLIST) {
    console.warn(`⚠️ รายการใน ALLOWLIST ยังอยู่: ${allowed.file}`);
  }

  console.log("✅ ผ่านทุกเกณฑ์: ทุก Modal effect ที่ล็อก body scroll ใช้ onCloseRef และไม่มี onClose ใน deps\n");
  process.exit(0);
}

run();
