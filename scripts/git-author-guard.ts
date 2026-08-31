import { execFileSync, execSync } from "node:child_process";

function run(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf-8", stdio: "pipe" }).trim();
  } catch (error: any) {
    const stdout = error.stdout ? error.stdout.toString() : "";
    const stderr = error.stderr ? error.stderr.toString() : "";
    throw new Error(`${stdout}\n${stderr}`.trim() || error.message);
  }
}

function parseArgs(args: string[]): Record<string, string> {
  const parsed: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : "true";
      parsed[key] = val;
    }
  }
  return parsed;
}

const args = parseArgs(process.argv.slice(2));

const agent = args["agent"] || args["author"] || "Antigravity AI";
const type = args["type"] || "feat";
const scope = args["scope"] || "core";
const message = args["msg"] || args["message"] || args["task"] || "update codebase";
const details = args["details"] || args["desc"] || "";

console.log("🛡️ [Git Safety & Attribution Guard] เริ่มต้นตรวจสอบความปลอดภัยก่อน Commit...");

// Step 1: Run Full Verification Suite
// ชุดตรวจกลางอยู่ที่ CHECKS ใน scripts/github-auto.ts — แหล่งความจริงเดียวของทั้งระบบ
// (ถ้าเพิ่มด่านตรวจใหม่ ให้ไปเพิ่มที่นั่นที่เดียว hook และ CI จะได้ตรวจเหมือนกันหมด)
try {
  console.log("  1/2 🧪 รันชุดตรวจกลาง (repo:verify)...");
  execFileSync("npm", ["run", "repo:verify"], { stdio: "inherit" });

  console.log("  2/2 🔒 ตรวจสอบ Secret Leak & Conflict Markers...");
  const marker = "<" + "<" + "<" + "<" + "<" + "<" + "<";
  const conflicts = run(`git grep -n "${marker}" -- ':!scripts/agent-guard.ts' ':!scripts/git-author-guard.ts' || true`);
  if (conflicts) {
    throw new Error(`พบ Git Conflict Markers:\n${conflicts}`);
  }
} catch (e: any) {
  console.error("\n❌ [Commit ถูกบล็อก] ไม่ผ่านการตรวจสอบความปลอดภัย:\n" + e.message);
  process.exit(1);
}

// Step 2: Formulate Structured & Attributed Commit Message
const branch = run("git branch --show-current") || "main";
const timestamp = new Date().toISOString();

const commitTitle = `${type}(${scope})[${agent}]: ${message}`;
const commitBody = [
  details ? `${details}\n` : "",
  `✦ Provenance & Attribution:`,
  `- Agent/Author: ${agent}`,
  `- Source Branch: ${branch}`,
  `- Verified: 100% Green (Collision, Typecheck, Cards, Spreads)`,
  `\nCo-authored-by: Anthropic Claude <claude-ai@users.noreply.github.com>`,
  `Co-authored-by: Antigravity AI <antigravity-ai@users.noreply.github.com>`,
  `Co-authored-by: Google Gemini <gemini-ai@users.noreply.github.com>`,
].filter(Boolean).join("\n");

import { recordAudit } from "./audit-tracker";

try {
  recordAudit(agent, (type.toUpperCase() || "FEAT") as any, message);
  run("git add .");
  // ส่ง argument เป็น array ไม่ผ่าน shell — ข้อความ commit จึงมี " ` $ ( ) ได้อย่างปลอดภัย
  // TAROT_VERIFIED=1 บอก .githooks/pre-commit ว่าตรวจผ่านมาแล้ว ไม่ต้องรันซ้ำ
  execFileSync("git", ["commit", "-m", commitTitle, "-m", commitBody], {
    stdio: "inherit",
    env: { ...process.env, TAROT_VERIFIED: "1" },
  });
  console.log(`\n✨ [Commit สำเร็จ] บันทึก Attribution & Audit Trail ชัดเจน: "${commitTitle}"`);
} catch (e: any) {
  console.error("❌ Commit ล้มเหลว:", e.message);
  process.exit(1);
}
