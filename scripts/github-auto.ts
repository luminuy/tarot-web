/**
 * 🤖 GitHub Automation Engine
 *
 * คำสั่งที่ใช้:
 *   npm run repo:verify                      ตรวจความสมบูรณ์ของระบบทั้ง 7 ด่าน
 *   npm run pr:auto -- "<title>" "<body>"    ตรวจ + push + สร้าง PR + เปิด auto-merge
 *   npm run pr:auto -- "<title>" --body-file <path>
 *   npm run pr:auto -- "<title>" "<body>" --no-merge    สร้าง PR เฉยๆ ไม่เปิด auto-merge
 *   npm run pr:auto -- "<title>" "<body>" --dry-run     แสดงสิ่งที่จะทำ โดยไม่แตะ remote
 *   npm run pr:auto -- "<title>" "<body>" --wait       รอจน PR ถูก merge แล้วเก็บกวาด branch ให้เอง
 *   npm run git:tidy                         ลบ branch ที่ PR merge ไปแล้วทั้งในเครื่องและบน remote
 *   tsx scripts/github-auto.ts status        ดูสถานะ repo, PR และ CI ล่าสุด
 *
 * ⚠️ หมายเหตุสำคัญสำหรับ AI Agent ทุกตัว:
 * คำสั่ง `gh` ทุกจุดในไฟล์นี้ต้องใส่ `-R <owner/repo>` เสมอ เพื่อบังคับให้ gh ทำงานแบบ
 * remote-only ไม่ไปยุ่งกับ git ในเครื่อง มิฉะนั้นเมื่อรันจาก git worktree
 * (ซึ่ง AI Agent ทำงานใน worktree เสมอ) `gh pr merge` จะพังด้วย error:
 *   fatal: 'main' is already checked out at '<path>'
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// ============================================================================
// Utilities
// ============================================================================

/**
 * รันคำสั่งแบบส่ง argument เป็น array (ไม่ผ่าน shell)
 * สำคัญมาก: หัวข้อ PR และคำอธิบายอาจมีอักขระอย่าง " ` $ ( ) ซึ่งถ้าต่อเป็นสตริง
 * แล้วยิงผ่าน shell จะทำให้คำสั่งเพี้ยนหรือถูกแทรกคำสั่งอื่นได้
 */
function sh(cmd: string, args: string[]): string {
  try {
    return execFileSync(cmd, args, { encoding: "utf-8", stdio: "pipe" }).trim();
  } catch (error: any) {
    const out = [error.stdout?.toString(), error.stderr?.toString()]
      .filter(Boolean)
      .join("\n")
      .trim();
    throw new Error(`คำสั่งล้มเหลว: ${cmd} ${args.join(" ")}\n${out || error.message}`);
  }
}

/** เหมือน sh() แต่คืน null แทนการ throw เมื่อคำสั่งล้มเหลว */
function shQuiet(cmd: string, args: string[]): string | null {
  try {
    return sh(cmd, args);
  } catch {
    return null;
  }
}

/** เยื้องทุกบรรทัดให้เท่ากัน — จำเป็นเพราะ sh() ตัดช่องว่างหัวท้ายทิ้ง */
function indent(text: string | null, fallback: string): string {
  if (!text) return `  ${fallback}`;
  return text.split("\n").map((l) => `  ${l}`).join("\n");
}

/** รันโดยให้ output ไหลออกหน้าจอสด ๆ (ใช้กับคำสั่งที่ใช้เวลานาน) */
function shLive(cmd: string, args: string[]): void {
  execFileSync(cmd, args, { stdio: "inherit" });
}

/** อ่าน owner/repo จาก git remote — รองรับทั้งรูปแบบ https และ ssh */
function getRepoSlug(): string {
  const url = shQuiet("git", ["remote", "get-url", "origin"]);
  if (!url) throw new Error("ไม่พบ git remote 'origin' — ยังไม่ได้ผูก repo กับ GitHub");
  const match = /github\.com[/:]([^/]+)\/(.+?)(?:\.git)?$/.exec(url);
  if (!match) throw new Error(`อ่านชื่อ repo จาก remote ไม่ได้: ${url}`);
  return `${match[1]}/${match[2]}`;
}

function getBranch(): string {
  return shQuiet("git", ["branch", "--show-current"]) || "";
}

const TSX = "./node_modules/.bin/tsx";

/**
 * ด่านตรวจทั้งหมดก่อนขึ้น GitHub
 * ⚠️ ถ้าเพิ่มสคริปต์ทดสอบใหม่ใน scripts/qa/ ต้องมาเพิ่มในรายการนี้ด้วยเสมอ
 *    ไม่งั้นเทสต์จะไม่เคยถูกรันโดยอัตโนมัติเลย
 */
const CHECKS: { label: string; cmd: string; args: string[] }[] = [
  { label: "🛡️  ไม่มี Agent อื่นล็อคไฟล์ทับ", cmd: "npm", args: ["run", "agent:check"] },
  { label: "🔍 TypeScript Typecheck (0 errors)", cmd: "npm", args: ["run", "typecheck"] },
  { label: "🃏 ไพ่ 78 ใบครบถ้วนสมบูรณ์", cmd: TSX, args: ["scripts/verify-cards.ts"] },
  { label: "📐 ผังพยากรณ์ 20 แบบพิกัดถูกต้อง", cmd: TSX, args: ["scripts/qa/test-spreads.ts"] },
  { label: "🚨 ตัวกรองคำถามอันตราย (Safety Guardrails)", cmd: TSX, args: ["scripts/qa/test-safety.ts"] },
  { label: "🎲 ระบบสับไพ่ Provably Fair", cmd: TSX, args: ["scripts/qa/test-shuffle.ts"] },
  { label: "🖼️  การอ้างอิง path ภาพไพ่ถูกต้อง", cmd: TSX, args: ["scripts/qa/test-image-paths.ts"] },
];

/**
 * รันด่านตรวจทั้งหมด — รันจนครบทุกด่านแม้จะเจอที่ล้มเหลวแล้ว
 * เพื่อให้เห็นปัญหาทั้งหมดในรอบเดียว ไม่ต้องแก้ทีละอันแล้วรันใหม่
 */
function runAllChecks(): boolean {
  console.log("\n🔍 [Verification Suite] ตรวจความสมบูรณ์ของระบบ 7 ด่าน\n");
  const failures: { label: string; detail: string }[] = [];

  for (const check of CHECKS) {
    try {
      sh(check.cmd, check.args);
      console.log(`  ✓ ${check.label}`);
    } catch (e: any) {
      console.log(`  ✗ ${check.label}`);
      failures.push({ label: check.label, detail: e.message });
    }
  }

  if (failures.length === 0) {
    console.log("\n✨ ผ่านครบทั้ง 7 ด่าน พร้อมสร้าง/Merge PR ได้ทันที!\n");
    return true;
  }

  console.error(`\n❌ ไม่ผ่าน ${failures.length} จาก ${CHECKS.length} ด่าน:\n`);
  for (const f of failures) {
    console.error(`── ${f.label} ──\n${f.detail}\n`);
  }
  return false;
}

// ============================================================================
// Actions
// ============================================================================

function actionVerify(): void {
  process.exit(runAllChecks() ? 0 : 1);
}

function actionPr(argv: string[]): void {
  const flags = new Set(argv.filter((a) => a.startsWith("--")));
  const dryRun = flags.has("--dry-run");
  const noMerge = flags.has("--no-merge");

  const bodyFileIdx = argv.indexOf("--body-file");
  const positional = argv.filter((a, i) => {
    if (a.startsWith("--")) return false;
    if (bodyFileIdx !== -1 && i === bodyFileIdx + 1) return false;
    return true;
  });

  const title = positional[0] || "chore: automated improvements";
  const body =
    bodyFileIdx !== -1
      ? fs.readFileSync(argv[bodyFileIdx + 1], "utf-8")
      : positional[1] || "✦ Pull Request สร้างโดยระบบอัตโนมัติ ผ่านการตรวจครบทุกด่านแล้ว";

  const branch = getBranch();
  if (!branch) {
    console.error("❌ อ่านชื่อ branch ปัจจุบันไม่ได้ (อาจอยู่ในสถานะ detached HEAD)");
    process.exit(1);
  }
  if (branch === "main") {
    console.error("❌ ตอนนี้อยู่ที่ branch 'main' — ต้องย้ายไป feature branch ก่อนสร้าง PR");
    console.error("   ตัวอย่าง: git checkout -b claude/ชื่องานของคุณ");
    process.exit(1);
  }

  const repo = getRepoSlug();
  console.log(`\n🚀 [GitHub Auto] repo: ${repo} | branch: ${branch}`);
  if (dryRun) console.log("🧪 โหมด --dry-run: จะไม่แตะ remote จริง\n");

  // ด่านตรวจต้องผ่านก่อนเสมอ — กันไม่ให้ push ของเสียขึ้น GitHub
  if (!runAllChecks()) {
    console.error("❌ ยกเลิกการสร้าง PR เพราะยังตรวจไม่ผ่าน");
    process.exit(1);
  }

  if (dryRun) {
    console.log("จะทำสิ่งเหล่านี้:");
    console.log(`  1. git push -u origin ${branch}`);
    console.log(`  2. gh pr create --title "${title}" --base main -R ${repo}`);
    if (!noMerge) console.log(`  3. gh pr merge <number> --auto --squash --delete-branch -R ${repo}`);
    process.exit(0);
  }

  try {
    console.log(`📤 กำลัง push branch '${branch}' ขึ้น GitHub...`);
    shLive("git", ["push", "-u", "origin", branch]);

    // ถ้ามี PR ของ branch นี้เปิดค้างอยู่แล้ว ให้ใช้ตัวเดิม ไม่สร้างซ้ำ
    const existing = shQuiet("gh", [
      "pr", "list", "-R", repo, "--head", branch, "--state", "open",
      "--json", "number", "-q", ".[0].number",
    ]);

    let prNumber: string;
    if (existing) {
      prNumber = existing;
      console.log(`ℹ️  มี PR #${prNumber} ของ branch นี้อยู่แล้ว — push ล่าสุดถูกเพิ่มเข้า PR เดิม`);
    } else {
      // ส่ง body ผ่านไฟล์ชั่วคราว รองรับข้อความยาวและอักขระพิเศษได้ทุกแบบ
      const tmp = path.join(os.tmpdir(), `pr-body-${process.pid}.md`);
      fs.writeFileSync(tmp, body, "utf-8");
      try {
        const url = sh("gh", [
          "pr", "create", "-R", repo, "--base", "main",
          "--title", title, "--body-file", tmp,
        ]);
        prNumber = url.trim().split("/").pop() || "";
        console.log(`✨ สร้าง PR สำเร็จ: ${url}`);
      } finally {
        fs.rmSync(tmp, { force: true });
      }
    }

    if (noMerge) {
      console.log("⏸️  ข้ามการเปิด auto-merge ตามที่สั่งด้วย --no-merge");
      console.log(`   เปิดเองภายหลังได้ด้วย: gh pr merge ${prNumber} --auto --squash --delete-branch -R ${repo}`);
      return;
    }

    // GitHub native auto-merge ใช้ได้เฉพาะเมื่อเปิดสวิตช์ไว้ในตั้งค่า repo เท่านั้น
    // ถ้ายังปิดอยู่แล้วเรียก --auto จะได้ error: "Auto merge is not allowed for this repository"
    // เช็กก่อนจะได้ไม่ต้องล้มทั้งคำสั่งทั้งที่ PR สร้างสำเร็จไปแล้ว
    const autoMergeAllowed =
      shQuiet("gh", ["api", `repos/${repo}`, "--jq", ".allow_auto_merge"]) === "true";

    if (autoMergeAllowed) {
      // -R บังคับให้ gh ทำงานแบบ remote-only จึงใช้ใน git worktree ได้
      sh("gh", ["pr", "merge", prNumber, "--auto", "--squash", "--delete-branch", "-R", repo]);
      console.log(`🔀 เปิด Auto-Merge ให้ PR #${prNumber} แล้ว — จะ merge เข้า main ทันทีที่ CI ผ่าน`);
    } else {
      console.log(`ℹ️  repo นี้ปิด GitHub native auto-merge ไว้ (allow_auto_merge = false) จึงข้ามขั้นตอนนั้น`);
      console.log(`   ไม่ต้องกังวล — workflow .github/workflows/pr.yml จะ squash merge PR #${prNumber}`);
      console.log(`   ให้เองอัตโนมัติเมื่อการตรวจใน CI ผ่านครบ`);
      console.log(`   ถ้าอยากใช้ auto-merge ของ GitHub จริง ๆ ให้เปิดที่:`);
      console.log(`   Settings > General > Pull Requests > Allow auto-merge`);
    }
    console.log("⚡ เมื่อ merge เข้า main แล้ว deploy.yml จะ deploy ขึ้น Cloudflare Workers อัตโนมัติ");

    if (flags.has("--wait")) waitForMergeThenTidy(repo, prNumber, branch);
    else console.log(`\n💡 เมื่อ PR merge แล้ว สั่ง \`npm run git:tidy\` เพื่อเก็บกวาด branch (หรือใช้ --wait ให้ทำให้เอง)`);
  } catch (e: any) {
    console.error(`\n❌ ผิดพลาด: ${e.message}`);
    console.error("\n💡 ถ้าติดที่ขั้นตอน merge: PR ถูกสร้างไว้แล้ว สั่ง merge เองได้จากหน้าเว็บ GitHub");
    process.exit(1);
  }
}

/**
 * เก็บกวาด branch ที่ PR ถูก merge ไปแล้ว ทั้งในเครื่องและบน remote
 *
 * ⚠️ ทำไมต้องมี: repo นี้ปิด GitHub native auto-merge ไว้ การ merge จริงทำโดย
 * step ใน `.github/workflows/pr.yml` ซึ่ง "ไม่ได้ลบ branch ให้" ผลคือ branch
 * ค้างสะสมทั้งในเครื่องและบน GitHub และ IDE จะขึ้นปุ่ม "Create PR" ค้างไว้
 * เพราะ branch ที่ถูก squash-merge จะยังดูเหมือนนำหน้า main อยู่ 1 commit
 *
 * 🔒 ความปลอดภัย: ลบเฉพาะ branch ที่ยืนยันจาก GitHub แล้วว่า PR อยู่ในสถานะ MERGED
 * และจะไม่แตะ branch ปัจจุบัน หรือ branch ที่ถูก checkout อยู่ใน worktree อื่น
 */
function actionTidy(dryRun = false): void {
  const repo = getRepoSlug();
  const current = getBranch();

  console.log(`\n🧹 [Tidy] เก็บกวาด branch ที่ merge ไปแล้ว — repo: ${repo}`);
  if (dryRun) console.log("🧪 โหมด --dry-run: จะไม่ลบอะไรจริง");

  shQuiet("git", ["fetch", "origin", "--prune"]);

  // branch ที่ถูก checkout ค้างไว้ใน worktree อื่น — ห้ามลบเด็ดขาด
  const worktreeBranches = new Set(
    (shQuiet("git", ["worktree", "list", "--porcelain"]) ?? "")
      .split("\n")
      .filter((l) => l.startsWith("branch "))
      .map((l) => l.replace("branch refs/heads/", "").trim()),
  );

  // กรอง "(HEAD detached at ...)" ที่ git แสดงเป็นบรรทัดหนึ่งในรายการ branch ออกด้วย
  // เพราะไม่ใช่ branch จริง (เกิดขึ้นเสมอหลัง --wait detach ไปที่ origin/main ใน worktree)
  const locals = (shQuiet("git", ["branch", "--format=%(refname:short)"]) ?? "")
    .split("\n")
    .map((b) => b.trim())
    .filter((b) => b && b !== "main" && !b.startsWith("("));

  let removed = 0;
  let skipped = 0;

  for (const branch of locals) {
    // อ่าน JSON ดิบแล้ว parse ในโค้ด แทนการใช้ jq interpolation
    // (สตริง `\(...)` ของ jq จะถูก JS กลืน backslash ทิ้งจนคำสั่งเพี้ยน)
    const raw = shQuiet("gh", [
      "pr", "list", "-R", repo, "--head", branch, "--state", "all",
      "--json", "state,number", "--limit", "1",
    ]);
    const pr = raw ? (JSON.parse(raw)[0] as { state?: string; number?: number } | undefined) : undefined;

    if (!pr || pr.state !== "MERGED") {
      console.log(`  ⏭️  ${branch} — ${pr ? `PR #${pr.number} ยังเป็น ${pr.state}` : "ไม่มี PR"} (ข้าม)`);
      skipped++;
      continue;
    }

    const prNumber = String(pr.number);

    if (branch === current) {
      console.log(`  ⚠️  ${branch} — PR #${prNumber} merged แล้ว แต่เป็น branch ที่อยู่ตอนนี้`);
      console.log(`      สลับไปที่ main ก่อนแล้วรัน git:tidy ใหม่: git checkout main`);
      skipped++;
      continue;
    }
    if (worktreeBranches.has(branch)) {
      console.log(`  ⚠️  ${branch} — ถูก checkout อยู่ใน worktree อื่น (ข้ามเพื่อความปลอดภัย)`);
      skipped++;
      continue;
    }

    if (dryRun) {
      console.log(`  🗑️  ${branch} — PR #${prNumber} merged (จะถูกลบ)`);
      removed++;
      continue;
    }

    // -D จำเป็นเพราะ squash-merge ทำให้ commit hash ไม่ตรงกับบน main
    shQuiet("git", ["branch", "-D", branch]);
    const remoteGone = shQuiet("git", ["ls-remote", "--exit-code", "--heads", "origin", branch]) === null;
    if (!remoteGone) shQuiet("gh", ["api", "-X", "DELETE", `repos/${repo}/git/refs/heads/${branch}`]);
    console.log(`  ✅ ${branch} — ลบแล้ว (PR #${prNumber}${remoteGone ? "" : " + ลบบน remote ด้วย"})`);
    removed++;
  }

  console.log(`\n✨ เก็บกวาดเสร็จ: ลบ ${removed} branch | ข้าม ${skipped} branch\n`);
}

/** รอจน PR ถูก merge (pr.yml จะ merge ให้เองหลัง CI ผ่าน) แล้วเก็บกวาด branch */
function waitForMergeThenTidy(repo: string, prNumber: string, branch: string): void {
  console.log(`\n⏳ รอ PR #${prNumber} ถูก merge (workflow pr.yml จะจัดการให้หลัง CI ผ่าน)...`);
  const MAX_MINUTES = 15;
  const deadline = Date.now() + MAX_MINUTES * 60_000;

  while (Date.now() < deadline) {
    const state = shQuiet("gh", ["pr", "view", prNumber, "-R", repo, "--json", "state", "-q", ".state"]);
    if (state === "MERGED") {
      console.log(`✅ PR #${prNumber} merged แล้ว`);
      // ต้องออกจาก branch ที่จะลบก่อน ถึงจะลบมันได้
      if (getBranch() === branch) {
        // `.ai-locks.json` เป็นไฟล์สถานะที่ `npm run agent:check` เขียนใหม่ระหว่างการตรวจ
        // (ตัดล็อคที่หมดอายุออก) ทำให้ working tree สกปรกค้างไว้
        // ถ้าไฟล์นี้ถูกแก้บน main ด้วย git จะปฏิเสธการสลับ branch ทันที
        // คืนค่าไฟล์นี้ได้อย่างปลอดภัยเพราะเป็น state ที่สร้างใหม่ได้ และตอนนี้ปลดล็อคไปแล้ว
        shQuiet("git", ["checkout", "--", ".ai-locks.json"]);

        // ⚠️ `git checkout main` ใช้ไม่ได้เมื่ออยู่ใน git worktree
        // เพราะ main ถูก checkout ค้างไว้ที่โฟลเดอร์หลักอยู่แล้ว (บทเรียน INC-0004)
        // จึงต้องลองแบบปกติก่อน แล้วถอยไป detach ที่ origin/main ซึ่งทำงานได้ทุก worktree
        let moved = shQuiet("git", ["checkout", "main"]) !== null;
        if (moved) {
          shQuiet("git", ["pull", "--ff-only", "origin", "main"]);
          console.log("🔄 สลับกลับมาที่ main และดึงโค้ดล่าสุดแล้ว");
        } else {
          moved = shQuiet("git", ["checkout", "--detach", "origin/main"]) !== null;
          if (moved) {
            console.log("🔄 อยู่ใน git worktree (main ถูก checkout ที่โฟลเดอร์หลัก)");
            console.log("   จึง detach ไปที่ origin/main แทน — โค้ดล่าสุดพร้อมใช้งานแล้ว");
          }
        }

        // อย่ารายงานว่าสำเร็จถ้ายังออกจาก branch ไม่ได้จริง — และต้องบอกด้วยว่าติดเพราะอะไร
        if (!moved) {
          console.log(`⚠️ ออกจาก branch '${branch}' ไม่ได้ จึงลบ branch นี้ไม่ได้`);
          const dirty = shQuiet("git", ["status", "--porcelain"]);
          if (dirty) {
            console.log(`   สาเหตุที่เป็นไปได้: มีไฟล์ค้างใน working tree`);
            console.log(indent(dirty, ""));
          }
          console.log(`   จัดการไฟล์ค้างแล้วสั่ง: npm run git:tidy`);
          return;
        }
      }
      actionTidy();
      return;
    }
    if (state === "CLOSED") {
      console.log(`ℹ️  PR #${prNumber} ถูกปิดโดยไม่ merge — ไม่เก็บกวาด branch`);
      return;
    }
    execFileSync("sleep", ["20"]);
  }
  console.log(`⏰ รอครบ ${MAX_MINUTES} นาทีแล้วแต่ PR ยังไม่ merge — ตรวจสถานะเองที่ GitHub`);
  console.log(`   เมื่อ merge แล้วสั่งเก็บกวาดด้วย: npm run git:tidy`);
}

function actionStatus(): void {
  console.log("\n=======================================================");
  console.log("🤖 GITHUB AUTOMATION ENGINE & REPO HEALTH");
  console.log("=======================================================");

  const repo = shQuiet("git", ["remote", "get-url", "origin"]) ? getRepoSlug() : null;
  const branch = getBranch();
  console.log(`Repo   : ${repo ?? "(ยังไม่ได้ผูก remote)"}`);
  console.log(`Branch : ${branch || "(detached HEAD)"}`);

  const auth = shQuiet("gh", ["auth", "status"]);
  console.log(`\nGitHub Auth:\n${indent(auth, "ยังไม่ได้ login — สั่ง gh auth login ก่อน")}`);

  if (!repo) return;

  const mine = shQuiet("gh", [
    "pr", "list", "-R", repo, "--head", branch, "--state", "open",
    "--json", "number,title,url", "-q", '.[] | "#\\(.number) \\(.title)\\n   \\(.url)"',
  ]);
  console.log(`\nPR ของ branch นี้:\n${indent(mine, "ยังไม่มี PR สำหรับ branch นี้")}`);

  const open = shQuiet("gh", [
    "pr", "list", "-R", repo, "--state", "open",
    "--json", "number,title", "-q", '.[] | "#\\(.number) \\(.title)"',
  ]);
  console.log(`\nPR ที่เปิดค้างทั้งหมด:\n${indent(open, "ไม่มี PR ที่เปิดค้างอยู่")}`);

  const runs = shQuiet("gh", [
    "run", "list", "-R", repo, "--limit", "3",
    "--json", "status,conclusion,headBranch,workflowName",
    "-q", '.[] | "\\(.conclusion // .status) · \\(.headBranch) · \\(.workflowName)"',
  ]);
  console.log(`\nCI ล่าสุด 3 รอบ:\n${indent(runs, "(อ่านไม่ได้)")}`);
  console.log("");
}

// ============================================================================
// Entry point
// ============================================================================

for (let i = 0; i < process.argv.length; i++) {
  if (process.argv[i] === "--agent" && process.argv[i + 1]) {
    process.env.AGENT_NAME = process.argv[i + 1];
    process.env.TAROT_AGENT = process.argv[i + 1];
  }
}

const argv = process.argv.slice(2);
const action = argv[0] && !argv[0].startsWith("--") ? argv[0] : "status";

switch (action) {
  case "verify-all":
    actionVerify();
    break;
  case "pr":
    actionPr(argv.slice(1));
    break;
  case "tidy":
    actionTidy(argv.includes("--dry-run"));
    break;
  case "status":
  default:
    actionStatus();
    break;
}
