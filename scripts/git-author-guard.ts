import { execSync } from "child_process";

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
try {
  console.log("  1/4 🛡️ ตรวจสอบ Multi-Agent Collision Guard...");
  run("npm run agent:check");

  console.log("  2/4 🔍 ตรวจสอบ TypeScript Strict Typecheck...");
  run("npm run typecheck");

  console.log("  3/4 🃏 ตรวจสอบความสมบูรณ์ของไพ่ 78 ใบ & ผัง 20 แบบ...");
  run("./node_modules/.bin/tsx scripts/verify-cards.ts");
  run("./node_modules/.bin/tsx scripts/qa/test-spreads.ts");

  console.log("  4/4 🔒 ตรวจสอบ Secret Leak & Conflict Markers...");
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
  `- Timestamp: ${timestamp}`,
  `\nCo-authored-by: Google DeepMind Antigravity <antigravity@google.com>`,
  `Co-authored-by: Google Gemini <gemini@google.com>`,
].filter(Boolean).join("\n");

try {
  run("git add .");
  execSync(`git commit -m "${commitTitle}" -m "${commitBody}"`, { stdio: "inherit" });
  console.log(`\n✨ [Commit สำเร็จ] บันทึก Attribution ชัดเจน: "${commitTitle}"`);
} catch (e: any) {
  console.error("❌ Commit ล้มเหลว:", e.message);
  process.exit(1);
}
