import { readFileSync, writeFileSync, existsSync } from "fs";
import { execSync } from "child_process";
import { join } from "path";

const ROOT_DIR = process.cwd();
const LOCKS_FILE = join(ROOT_DIR, ".ai-locks.json");

export interface AgentLock {
  id: string;
  agentName: string;
  agentRole?: string;
  domain: string;
  files: string[];
  task: string;
  acquiredAt: string;
  expiresAt: string;
}

export interface LocksData {
  version: string;
  lastUpdated: string;
  locks: AgentLock[];
}

const DEFAULT_TTL_MINUTES = 30;

function readLocks(): LocksData {
  if (!existsSync(LOCKS_FILE)) {
    return {
      version: "1.0",
      lastUpdated: new Date().toISOString(),
      locks: [],
    };
  }
  try {
    const raw = readFileSync(LOCKS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {
      version: "1.0",
      lastUpdated: new Date().toISOString(),
      locks: [],
    };
  }
}

function saveLocks(data: LocksData) {
  data.lastUpdated = new Date().toISOString();
  writeFileSync(LOCKS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function cleanExpired(data: LocksData): LocksData {
  const now = new Date().getTime();
  const active = data.locks.filter((lock) => {
    const exp = new Date(lock.expiresAt).getTime();
    return exp > now;
  });
  return {
    ...data,
    locks: active,
  };
}

function getGitModifiedFiles(): string[] {
  try {
    const status = execSync("git status --porcelain", { encoding: "utf-8" });
    return status
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.slice(3).trim());
  } catch {
    return [];
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

export function isSameAgent(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  const sa = a.trim().toLowerCase();
  const sb = b.trim().toLowerCase();
  return sa === sb || sa.includes(sb) || sb.includes(sa);
}

export function inferCurrentAgent(): string | undefined {
  if (process.env.AGENT_NAME) return process.env.AGENT_NAME;
  if (process.env.TAROT_AGENT) return process.env.TAROT_AGENT;

  try {
    const branch = execSync("git branch --show-current", { encoding: "utf-8" }).trim();
    if (branch.includes("/")) {
      const prefix = branch.split("/")[0].toLowerCase();
      if (prefix === "claude") return "Claude";
      if (prefix === "gemini") return "Gemini";
      if (prefix === "antigravity") return "Antigravity AI";
    }
  } catch {}

  return undefined;
}

// 1. ACQUIRE LOCK
export function acquireLock(
  agentName: string,
  domain: string,
  files: string[],
  task: string,
  role = "AI Collaborator",
  ttlMinutes = DEFAULT_TTL_MINUTES
): { success: boolean; message: string; conflicts?: AgentLock[] } {
  let data = cleanExpired(readLocks());

  // Check for file overlaps with other agents
  const conflicts = data.locks.filter((lock) => {
    if (isSameAgent(lock.agentName, agentName)) return false; // same agent can extend/update
    const overlapFiles = lock.files.some((f) => files.includes(f) || f === "*" || files.includes("*"));
    const sameDomain = lock.domain.toLowerCase() === domain.toLowerCase() && domain !== "general";
    return overlapFiles || sameDomain;
  });

  if (conflicts.length > 0) {
    const conflictInfo = conflicts
      .map((c) => `  ✦ [${c.agentName}] (${c.agentRole || "Agent"}) Domain: "${c.domain}" | Task: "${c.task}" | Files: ${c.files.join(", ")} (Expires: ${new Date(c.expiresAt).toLocaleTimeString("th-TH")})`)
      .join("\n");
    return {
      success: false,
      message: `🚨 ตรวจพบการชนกันของ Agent!\nไฟล์หรือ Domain ที่คุณต้องการถูกล็อคอยู่โดย:\n${conflictInfo}`,
      conflicts,
    };
  }

  // Remove old lock from same agent if any
  data.locks = data.locks.filter((l) => !isSameAgent(l.agentName, agentName));

  const now = new Date();
  const expires = new Date(now.getTime() + ttlMinutes * 60 * 1000);

  const newLock: AgentLock = {
    id: `lock-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    agentName,
    agentRole: role,
    domain,
    files,
    task,
    acquiredAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };

  data.locks.push(newLock);
  saveLocks(data);

  return {
    success: true,
    message: `✨ [Agent Guard] ล็อคสำเร็จ! Agent "${agentName}" ครอบครอง Domain "${domain}" สำหรับ ${files.length} ไฟล์ (หมดอายุใน ${ttlMinutes} นาที)`,
  };
}

// 2. RELEASE LOCK
export function releaseLock(agentName: string, force = false): { success: boolean; message: string } {
  let data = readLocks();
  const countBefore = data.locks.length;

  if (force) {
    data.locks = [];
    saveLocks(data);
    return { success: true, message: `🧹 ปลดล็อคทั้งหมด (Force Clean) สำเร็จ!` };
  }

  data.locks = data.locks.filter((l) => !isSameAgent(l.agentName, agentName));
  saveLocks(data);

  if (data.locks.length === countBefore) {
    return { success: true, message: `ℹ️ ไม่พบ Lock ของ Agent "${agentName}" ที่ต้องปลด` };
  }

  return { success: true, message: `✨ [Agent Guard] ปลดล็อคสำหรับ Agent "${agentName}" เรียบร้อยแล้ว` };
}

// 3. CHECK COLLISIONS
export function checkCollisions(currentAgent?: string): { hasCollision: boolean; summary: string } {
  const agent = currentAgent || inferCurrentAgent();
  const data = cleanExpired(readLocks());
  saveLocks(data);

  const gitFiles = getGitModifiedFiles();
  const issues: string[] = [];

  // Check 1: Conflict markers in working tree
  try {
    const marker = "<" + "<" + "<" + "<" + "<" + "<" + "<";
    const grepConflict = execSync(`git grep -n "${marker}" -- ':!scripts/agent-guard.ts' ':!scripts/git-author-guard.ts' || true`, { encoding: "utf-8" }).trim();
    if (grepConflict) {
      issues.push(`🚨 ตรวจพบ Git Conflict Markers ในไฟล์:\n${grepConflict}`);
    }
  } catch {}

  // Check 2: Active locks from OTHER agents overlapping with modified git files
  if (gitFiles.length > 0) {
    for (const lock of data.locks) {
      if (isSameAgent(lock.agentName, agent)) continue;

      const overlapping = gitFiles.filter((f) => lock.files.includes(f) || lock.files.includes("*"));
      if (overlapping.length > 0) {
        issues.push(
          `⚠️ ไฟล์ที่คุณกำลังแก้อยู่ชนกับ Lock ของ [${lock.agentName}] (${lock.task}):\n   - ${overlapping.join("\n   - ")}`
        );
      }
    }
  }

  if (issues.length > 0) {
    return {
      hasCollision: true,
      summary: `❌ [ตรวจพบความเสี่ยงการชนกัน]\n${issues.join("\n\n")}`,
    };
  }

  return {
    hasCollision: false,
    summary: `✅ [ปลอดภัย] ไม่พบการชนกันของไฟล์หรือ Agent Lock (${gitFiles.length} ไฟล์ที่กำลังแก้, ${data.locks.length} Locks ที่ใช้งานอยู่)`,
  };
}

// 4. DISPLAY STATUS
export function printStatus() {
  const data = cleanExpired(readLocks());
  saveLocks(data);

  console.log("\n=======================================================");
  console.log("🛡️  AI AGENT COLLISION GUARD & ACTIVE LOCKS REGISTRY");
  console.log("=======================================================");

  if (data.locks.length === 0) {
    console.log("✨ ไม่มี Agent ใดกำลังล็อคไฟล์อยู่ (ระบบพร้อมทำงานแบบ Concurrency ปลอดภัย)\n");
    return;
  }

  console.log(`📌 พบ ${data.locks.length} Active Lock(s):\n`);
  data.locks.forEach((l, idx) => {
    const expDate = new Date(l.expiresAt);
    const timeLeftMin = Math.max(0, Math.round((expDate.getTime() - Date.now()) / 60000));
    console.log(`[${idx + 1}] ✦ Agent: \x1b[33m${l.agentName}\x1b[0m (${l.agentRole || "Agent"})`);
    console.log(`    Domain: \x1b[36m${l.domain}\x1b[0m`);
    console.log(`    Task:   ${l.task}`);
    console.log(`    Files:  ${l.files.join(", ")}`);
    console.log(`    Status: เหลือเวลาอีก \x1b[32m${timeLeftMin} นาที\x1b[0m (หมดอายุ ${expDate.toLocaleTimeString("th-TH")})`);
    console.log("-------------------------------------------------------");
  });
  console.log();
}

// CLI RUNNER
const action = process.argv[2] || "status";
const args = parseArgs(process.argv.slice(3));

switch (action) {
  case "lock": {
    const agent = args["agent"] || args["name"] || "Current-AI";
    const domain = args["domain"] || "general";
    const task = args["task"] || "Modifying codebase";
    const role = args["role"] || "AI Agent";
    const files = args["files"] ? args["files"].split(",").map((f) => f.trim()) : ["*"];
    const ttl = args["ttl"] ? parseInt(args["ttl"], 10) : DEFAULT_TTL_MINUTES;

    const res = acquireLock(agent, domain, files, task, role, ttl);
    console.log(res.message);
    if (!res.success) process.exit(1);
    break;
  }

  case "unlock": {
    const agent = args["agent"] || args["name"] || inferCurrentAgent() || "Current-AI";
    const force = args["force"] === "true" || args["all"] === "true";
    const res = releaseLock(agent, force);
    console.log(res.message);
    break;
  }

  case "check": {
    const agent = args["agent"] || args["name"] || inferCurrentAgent();
    const res = checkCollisions(agent);
    console.log(res.summary);
    if (res.hasCollision) process.exit(1);
    break;
  }

  case "clean": {
    const data = cleanExpired(readLocks());
    saveLocks(data);
    console.log("🧹 [Agent Guard] ล้าง Locks ที่หมดอายุเรียบร้อยแล้ว");
    break;
  }

  case "status":
  default:
    printStatus();
    break;
}
