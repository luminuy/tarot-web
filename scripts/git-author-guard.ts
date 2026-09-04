import { execFileSync, execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { recordAudit } from "./audit-tracker";
import { recordIncident, type Severity } from "./incident-log";
import { syncWorkLog } from "./sync-worklog";
import { ownedAndForeignLocks } from "./agent-guard";

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

// ============================================================================
// 🛡️ Engineering Discipline Gate — ห้ามแก้บั๊กโดยไม่บันทึกบทเรียน
// ============================================================================
// การแก้บั๊กโดยไม่ตอบว่า "ทำไมถึงเกิด" และ "จะกันไม่ให้เกิดอีกยังไง"
// คือการแก้ที่ไม่จบ และเปิดทางให้ AI ตัวถัดไปทำผิดซ้ำเรื่องเดิม
// จึงบังคับให้ commit ประเภทแก้บั๊กต้องมี --cause และ --prevention เสมอ
const FIX_TYPES = ["fix", "hotfix", "revert", "bugfix"];
const isFix = FIX_TYPES.includes(type.toLowerCase());

if (isFix) {
  const missing: string[] = [];
  if (!args["symptom"]) missing.push("--symptom");
  if (!args["cause"]) missing.push("--cause");
  if (!args["prevention"]) missing.push("--prevention");

  if (missing.length > 0) {
    console.error("\n❌ [Commit ถูกบล็อก] commit ประเภทแก้บั๊กต้องบันทึกบทเรียนเสมอ");
    console.error(`   ขาด: ${missing.join(", ")}\n`);
    console.error("   เหตุผล: ทุกความผิดพลาดต้องถูกบันทึกลง docs/INCIDENT_LOG.md");
    console.error("   เพื่อไม่ให้ AI ตัวไหนทำผิดซ้ำเรื่องเดิมอีก");
    console.error("   (--symptom / --cause ห้ามก็อป --msg มา ต้องเป็นคนละเนื้อ ไม่งั้น incident-log จะบล็อกซ้ำ)\n");
    console.error("   ตัวอย่าง:");
    console.error(`   npm run commit -- --agent ${agent} --type ${type} --scope ${scope} \\`);
    console.error(`     --msg "${message}" \\`);
    console.error(`     --symptom "อาการที่คนเจอครั้งแรกเห็น (ไม่ใช่ชื่อเรื่อง)" \\`);
    console.error(`     --cause "ทำไมถึงเกิดขึ้นได้ตั้งแต่แรก (สาเหตุราก ไม่ใช่อาการ)" \\`);
    console.error(`     --prevention "กฎถาวรที่ทำให้เกิดซ้ำไม่ได้อีก" \\`);
    console.error(`     --severity high --verify "พิสูจน์ยังไงว่าแก้ได้จริง"\n`);
    process.exit(1);
  }
}

console.log("🛡️ [Git Safety & Attribution Guard] เริ่มต้นตรวจสอบความปลอดภัยก่อน Commit...");

// Step 1: Run Full Verification Suite
// ชุดตรวจกลางอยู่ที่ CHECKS ใน scripts/github-auto.ts — แหล่งความจริงเดียวของทั้งระบบ
// (ถ้าเพิ่มด่านตรวจใหม่ ให้ไปเพิ่มที่นั่นที่เดียว hook และ CI จะได้ตรวจเหมือนกันหมด)
try {
  console.log("  1/2 🧪 รันชุดตรวจกลาง (repo:verify)...");
  execFileSync("npm", ["run", "repo:verify"], {
    stdio: "inherit",
    env: { ...process.env, AGENT_NAME: agent, TAROT_AGENT: agent },
  });

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

// ============================================================================
// 🧹 Scoped Staging — stage เฉพาะไฟล์ของ commit นี้ ไม่ใช่ทั้ง working tree
// ============================================================================
// `git add .` แบบเดิมกวาดทุกไฟล์ที่ถูกแก้ค้างไว้ รวมงานที่ยังไม่เสร็จของเอเจนต์อื่น
// (ที่รันอยู่ในโฟลเดอร์เดียวกัน) เข้า commit/PR ของเราด้วย → งานเขาหาย เราได้ PR ปนเป
// วิธีใหม่: รู้ให้ชัดว่าไฟล์ไหนเป็นของ commit นี้ (--files หรือ .ai-locks.json ของเราเอง)
// แล้ว stage เฉพาะไฟล์นั้น · ถ้ายังไม่รู้และมีเอเจนต์อื่นถือ lock อยู่ → บล็อกทันที
// ถ้าไม่มีเอเจนต์อื่นเลย (รันเดี่ยว) → stage ทั้งหมดได้ตามเดิม
const BOOKKEEPING_FILES = ["docs/WORK_LOG.md", "docs/INCIDENT_LOG.md"];

function changedPaths(): string[] {
  // ห้ามใช้ run() ตรงนี้ — run() เรียก .trim() ทั้งก้อน ทำให้บรรทัดแรกเสียช่องว่างนำหน้า
  // (" M path" → "M path") แล้ว slice(3) จะกินตัวอักษรแรกของ path ไปด้วย
  const out = execSync("git status --porcelain", { encoding: "utf-8" });
  return out
    .split("\n")
    .filter((l) => l.length > 3)
    .map((l) => l.slice(3).replace(/^"(.*)"$/, "$1").split(" -> ").pop()!.trim());
}

function stageForCommit() {
  const explicit = (args["files"] || args["file"] || "")
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);
  const forceAll = args["all"] === "true" || args["add-all"] === "true";

  const changed = changedPaths();
  if (changed.length === 0) return; // ไม่มีอะไรให้ stage — ปล่อยให้ git commit ฟ้องเอง

  if (forceAll) {
    console.warn("  ⚠️  --all: stage ทั้ง working tree (git add -A) — ต้องมั่นใจว่าไม่มีเอเจนต์อื่นทำงานพร้อมกัน");
    run("git add -A");
    return;
  }

  const changedSet = new Set(changed);
  const { ownedFiles, hasWildcardLock, foreign } = ownedAndForeignLocks(agent);
  const owned = explicit.length > 0 ? explicit : ownedFiles;

  if (owned.length === 0) {
    if (foreign.length > 0 && !hasWildcardLock) {
      console.error("\n❌ [Commit ถูกบล็อก] มีเอเจนต์อื่นถือ lock อยู่ แต่ commit นี้ไม่ได้ระบุว่าไฟล์ไหนเป็นของคุณ");
      for (const l of foreign) {
        console.error(`   ✦ [${l.agentName}] ${l.task} — ${l.files.join(", ")}`);
      }
      console.error("\n   `git add .` จะกวาดงานที่ยังไม่เสร็จของเอเจนต์อื่นเข้า PR ของคุณ (INC-0069)");
      console.error("   ทางแก้ (เลือกอย่างใดอย่างหนึ่ง):");
      console.error(`     • ระบุไฟล์ของคุณเอง:  npm run commit -- ... --files "src/a.ts,src/b.ts"`);
      console.error(`     • ล็อคไฟล์ก่อนแก้:     npm run agent:lock -- --agent ${agent} --files "..." --task "..."`);
      console.error(`     • ทำงานใน git worktree แยก (.claude/worktrees/) แล้ว git add . จะปลอดภัยเอง`);
      console.error(`     • ยืนยันว่ารันเดี่ยวจริง:  เพิ่ม --all`);
      process.exit(1);
    }
    console.log(`  ℹ️  ไม่มี lock ของเอเจนต์อื่น — stage ทั้ง ${changed.length} ไฟล์`);
    run("git add -A");
    return;
  }

  const missing = explicit.filter((f) => !changedSet.has(f) && !existsSync(f));
  if (missing.length > 0) {
    console.error(`\n❌ [Commit ถูกบล็อก] --files ระบุไฟล์ที่ไม่มีอยู่จริง: ${missing.join(", ")}`);
    process.exit(1);
  }

  const toAdd = [
    ...new Set([
      ...owned.filter((f) => changedSet.has(f) || existsSync(f)),
      ...BOOKKEEPING_FILES.filter((f) => changedSet.has(f)),
    ]),
  ];
  if (toAdd.length === 0) {
    console.error("\n❌ [Commit ถูกบล็อก] ไฟล์ที่ระบุไม่มีการเปลี่ยนแปลงให้ commit");
    process.exit(1);
  }

  execFileSync("git", ["add", "--", ...toAdd], { stdio: "inherit" });

  const staged = new Set(run("git diff --cached --name-only").split("\n").filter(Boolean));
  const leftForOthers = changed.filter((p) => !staged.has(p));
  console.log(`  ✅ stage เฉพาะไฟล์ของ commit นี้: ${[...staged].join(", ")}`);
  if (leftForOthers.length > 0) {
    console.log(`  📌 ปล่อยไว้ให้เจ้าของอื่น (ไม่ stage): ${leftForOthers.join(", ")}`);
  }
}

async function executeCommit() {
  try {
    recordAudit(agent, (type.toUpperCase() || "FEAT") as any, message);

    // บันทึกบทเรียนลง docs/INCIDENT_LOG.md "ก่อน" git add
    // เพื่อให้ไฟล์บันทึกถูกรวมเข้าไปใน commit เดียวกันกับตัวแก้ อ่านย้อนหลังแล้วเห็นคู่กันเสมอ
    if (isFix) {
      const severity = (args["severity"] || "medium") as Severity;
      const incidentId = recordIncident({
        title: message,
        severity: ["critical", "high", "medium", "low"].includes(severity) ? severity : "medium",
        symptom: args["symptom"] ?? "",   // บังคับมาแล้วจาก gate ด้านบน — ห้าม fallback เป็น message
        impact: args["impact"],
        rootCause: args["cause"],
        evidence: args["evidence"],
        fix: args["fix"] || details || message,
        prevention: args["prevention"],
        verification: args["verify"] || args["verification"],
        agent,
      });
      console.log(`📋 [Incident Log] บันทึกบทเรียน ${incidentId} ลง docs/INCIDENT_LOG.md แล้ว`);
    }

    // Auto-sync work log into docs/WORK_LOG.md automatically on EVERY commit
    await syncWorkLog();

    stageForCommit();
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
}

executeCommit();
