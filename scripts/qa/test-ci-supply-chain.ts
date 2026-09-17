/**
 * 🔗 ด่านห่วงโซ่อุปทานของ CI (R-13 · R-16 · R-17 · R-14)
 * ===========================================================================
 *
 * ## ทำไมต้องมีด่านนี้
 *
 * รอบตรวจ 2026-09-17 พบสี่เรื่องในไฟล์ workflow ชุดเดียวกัน:
 *
 * - **R-13** ทุก workflow ติดตั้งด้วย `pnpm install --no-frozen-lockfile` ทั้งที่รีโปนี้
 *   **ไม่มี `pnpm-lock.yaml`** เลย ➔ ทุกครั้งที่ CI รันจึงแก้กราฟ dependency ใหม่จากศูนย์
 *   และอาจได้เวอร์ชัน transitive คนละชุดกับที่ทดสอบ — ใน job ที่ถือคีย์ deploy
 * - **R-16** GitHub Action ทุกตัวผูกกับแท็กที่ขยับได้ ไม่มีตัวไหนผูกกับ commit SHA
 * - **R-17** `daily-digest.yml` ไม่มีบล็อก `permissions:` ➔ ได้สิทธิ์ดีฟอลต์ของรีโปทั้งก้อน
 * - **R-14** ไม่มีขั้นตอนถอยกลับเขียนไว้ที่ไหนเลย ทั้งที่ deploy อัตโนมัติทุกครั้งที่ merge
 *
 * ## ⚠️ หนี้ที่การย้ายมา npm สร้างขึ้น และด่านนี้รับช่วงต่อ
 *
 * pnpm ใช้ node_modules แบบไม่แบน จึง **กันการ import แพ็กเกจที่ไม่ได้ประกาศ** ให้ฟรี ๆ
 * (เคยจับได้จริงใน PR #368 ตอนมีคนเผลอ import `lightningcss` ซึ่งเป็น transitive dep
 * ของ `@tailwindcss/postcss`) — npm ใช้ node_modules แบบแบน ตัวกันนั้นจึงหายไป
 * ข้อ 5 ของด่านนี้ทำหน้าที่แทน: **ทุก import ต้องมีชื่ออยู่ใน `package.json`**
 */

import fs from "node:fs";
import { builtinModules } from "node:module";
import path from "node:path";
import { assertNonEmptyCorpus } from "./lib/corpus";

const ROOT = process.cwd();
const WF_DIR = path.join(ROOT, ".github/workflows");

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

console.log("\n🔗 ห่วงโซ่อุปทานของ CI — lockfile · การผูกแอ็กชัน · สิทธิ์ · ทางถอย\n");

const workflows = fs
  .readdirSync(WF_DIR)
  .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
  .map((f) => ({ name: f, src: fs.readFileSync(path.join(WF_DIR, f), "utf-8") }));

assertNonEmptyCorpus("ไฟล์ workflow ใน .github/workflows", workflows, "ตรวจว่าโฟลเดอร์ยังอยู่ที่เดิม");

// ─────────────────────────────────────────────────────────────────────────────
// 1. R-13 — lockfile ต้องถูกบังคับใช้จริง
// ─────────────────────────────────────────────────────────────────────────────
check(
  "รีโปมี package-lock.json ให้ `npm ci` บังคับใช้",
  fs.existsSync(path.join(ROOT, "package-lock.json")),
);

const looseInstalls: string[] = [];
const pnpmUsers: string[] = [];
for (const wf of workflows) {
  for (const [i, line] of wf.src.split("\n").entries()) {
    if (/^\s*#/.test(line)) continue; // คอมเมนต์อธิบายบทเรียน ไม่ใช่การใช้งานจริง
    if (/\bnpm\s+install\b|--no-frozen-lockfile|\byarn\s+install\b/.test(line)) {
      looseInstalls.push(`   · ${wf.name}:${i + 1} — ${line.trim()}`);
    }
    if (/\bpnpm\b/.test(line)) {
      pnpmUsers.push(`   · ${wf.name}:${i + 1} — ${line.trim()}`);
    }
  }
}

check(
  "ไม่มี workflow ไหนติดตั้ง dependency แบบไม่บังคับ lockfile",
  looseInstalls.length === 0,
  looseInstalls.join("\n") + "\n   ➔ ใช้ `npm ci` ซึ่งล้มทันทีเมื่อ lockfile ไม่ตรงกับ package.json",
);

/*
 * ถ้าวันหนึ่งจะกลับไปใช้ pnpm ก็ทำได้ — แต่ต้อง commit `pnpm-lock.yaml` มาด้วย
 * สิ่งที่ห้ามคือ "ประกาศว่าใช้ pnpm แต่ไม่มี lockfile ของ pnpm" ซึ่งคือสภาพเดิม
 */
const hasPnpmLock = fs.existsSync(path.join(ROOT, "pnpm-lock.yaml"));
check(
  "ถ้ายังอ้างถึง pnpm ใน workflow ต้องมี pnpm-lock.yaml อยู่จริง",
  pnpmUsers.length === 0 || hasPnpmLock,
  pnpmUsers.join("\n"),
);

for (const wf of workflows) {
  if (!/npm ci/.test(wf.src)) continue;
  check(
    `${wf.name}: ใช้แคช npm ของ setup-node ได้ (ไม่ต้องปิดแคชอีกแล้ว)`,
    !/package-manager-cache:\s*false/.test(wf.src),
    "   ➔ กับดักเดิมมาจากการไม่มี pnpm-lock.yaml · ตอนนี้ package-lock.json มีอยู่จริงแล้ว",
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. R-16 — ทุก `uses:` ต้องผูกกับ commit SHA เต็ม 40 ตัว
// ─────────────────────────────────────────────────────────────────────────────
const unpinned: string[] = [];
let pinnedCount = 0;
for (const wf of workflows) {
  for (const [i, line] of wf.src.split("\n").entries()) {
    const m = /^\s*uses:\s*([^\s#]+)/.exec(line);
    if (!m) continue;
    const ref = m[1];
    if (ref.startsWith("./") || ref.startsWith("docker://")) continue; // แอ็กชันในรีโปเอง
    const at = ref.lastIndexOf("@");
    const rev = at >= 0 ? ref.slice(at + 1) : "";
    if (/^[0-9a-f]{40}$/.test(rev)) {
      pinnedCount++;
      // ต้องมีคอมเมนต์กำกับเวอร์ชันไว้ด้วย ไม่งั้นไม่มีใครรู้ว่า SHA นี้คือรุ่นไหน
      if (!/#\s*v?\d/.test(line)) {
        unpinned.push(`   · ${wf.name}:${i + 1} — ผูก SHA แล้วแต่ไม่มีคอมเมนต์บอกเวอร์ชัน`);
      }
    } else {
      unpinned.push(`   · ${wf.name}:${i + 1} — ${ref}`);
    }
  }
}

check(
  `GitHub Action ทุกตัวผูกกับ commit SHA พร้อมคอมเมนต์เวอร์ชัน (${pinnedCount} ตัว)`,
  unpinned.length === 0,
  unpinned.join("\n") +
    "\n   ➔ แท็กอย่าง `@v4` ขยับได้ · เจ้าของแอ็กชันถูกยึดบัญชีเมื่อไหร่ workflow ที่ถือคีย์ deploy รันโค้ดใหม่ทันที" +
    "\n   ➔ หา SHA ด้วย: git ls-remote https://github.com/<owner>/<repo>.git 'refs/tags/<tag>' 'refs/tags/<tag>^{}'",
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. R-17 — ทุก workflow ต้องประกาศ `permissions:` ของตัวเอง
// ─────────────────────────────────────────────────────────────────────────────
const noPermissions = workflows
  .filter((wf) => !/^permissions:/m.test(wf.src) && !/^\s{4}permissions:/m.test(wf.src))
  .map((wf) => `   · ${wf.name}`);

check(
  "ทุก workflow ประกาศ `permissions:` ของตัวเอง (ไม่รับสิทธิ์ดีฟอลต์ของรีโปมาทั้งก้อน)",
  noPermissions.length === 0,
  noPermissions.join("\n") + "\n   ➔ งานที่ไม่เขียนอะไรกลับเข้ารีโปให้ใส่ `permissions: {}`",
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. R-14 — ต้องมีทางถอยที่กดได้จริง ไม่ใช่แค่เขียนไว้ในเอกสาร
// ─────────────────────────────────────────────────────────────────────────────
const rollback = workflows.find((wf) => wf.name === "rollback.yml");
check("มี workflow ถอยกลับ `.github/workflows/rollback.yml`", !!rollback);
if (rollback) {
  check("workflow ถอยกลับกดเองได้ (`workflow_dispatch`)", /workflow_dispatch:/.test(rollback.src));
  check("workflow ถอยกลับสั่ง `wrangler rollback` จริง", /wrangler rollback/.test(rollback.src));
  check(
    "workflow ถอยกลับยืนยันว่าเว็บกลับมาตอบ 200 หลังถอย",
    /http_code/.test(rollback.src) && /200/.test(rollback.src),
    "   ➔ ถอยแล้วไม่เช็ก = ไม่รู้ว่าถอยแล้วดีขึ้นหรือแย่ลง",
  );
  /*
   * ⚠️ ต้องเทียบกับ **ค่าจริงใน deploy.yml** ไม่ใช่ฮาร์ดโค้ดชื่อกลุ่มไว้ในด่าน
   * ตอนเขียนด่านนี้รอบแรกเผลอเช็กชื่อที่คิดเองแล้วผ่าน ทั้งที่สองไฟล์ใช้คนละกลุ่ม
   * = ถอยกลับกับ deploy รันทับกันได้จริง ด่านเลยกลายเป็นตราประทับปลอม
   */
  const deployWf = workflows.find((wf) => wf.name === "deploy.yml");
  const deployGroup = /concurrency:\s*\n\s*group:\s*([^\s#]+)/.exec(deployWf?.src ?? "")?.[1] ?? "";
  const rollbackGroup = /concurrency:\s*\n\s*group:\s*([^\s#]+)/.exec(rollback.src)?.[1] ?? "";
  check(
    `workflow ถอยกลับใช้ concurrency group เดียวกับ deploy (กันถอยชนกับ deploy)`,
    !!deployGroup && deployGroup === rollbackGroup,
    `   ➔ deploy.yml = "${deployGroup}" · rollback.yml = "${rollbackGroup}"`,
  );
}

const guide = path.join(ROOT, "docs/CLOUDFLARE_DEPLOYMENT_GUIDE.md");
if (!fs.existsSync(guide)) {
  check("มีคู่มือ deploy ให้ตรวจ", false, "   ➔ docs/CLOUDFLARE_DEPLOYMENT_GUIDE.md หายไป");
} else {
  const guideSrc = fs.readFileSync(guide, "utf-8");
  check(
    "คู่มือ deploy มีหัวข้อขั้นตอนถอยกลับ (Rollback Playbook)",
    /wrangler rollback/.test(guideSrc),
  );
  check(
    "คู่มือเตือนว่า migration ของ D1 ไม่ย้อนตามการถอยกลับ",
    /migration/i.test(guideSrc) && /ไม่.{0,4}ย้อน/.test(guideSrc),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. หนี้ที่รับช่วงจาก pnpm — ห้าม import แพ็กเกจที่ไม่ได้ประกาศใน package.json
// ─────────────────────────────────────────────────────────────────────────────
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf-8"));
const declared = new Set([
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.devDependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
  ...Object.keys(pkg.optionalDependencies ?? {}),
]);

/**
 * แพ็กเกจที่ไม่ได้ประกาศแต่ไม่ถือว่าเป็นหนี้ — **ทุกบรรทัดต้องมีเหตุผลกำกับ**
 */
const IMPLICIT_OK: Record<string, string> = {
  "server-only":
    "Next ติดตั้งมาให้เองเป็นส่วนหนึ่งของเฟรมเวิร์ก (ใช้กันไฟล์ฝั่งเซิร์ฟเวอร์หลุดเข้าบันเดิลไคลเอนต์)",
};

/** โมดูลในตัวของ Node ที่เขียนได้ทั้งแบบมีและไม่มีคำนำหน้า `node:` */
const NODE_BUILTINS = new Set(builtinModules);

/** รูปแบบชื่อแพ็กเกจที่ถูกต้องตามกติกาของ npm — กันเศษสตริงที่บังเอิญตรงเรกเอ็กซ์ */
const VALID_PACKAGE_NAME = /^(@[a-z0-9~][\w.-]*\/)?[a-z0-9~][\w.-]*$/;

function walkSources(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkSources(full, out);
    else if (/\.(ts|tsx|mts|astro)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const sources = [
  ...walkSources(path.join(ROOT, "src")),
  ...walkSources(path.join(ROOT, "scripts")),
  ...walkSources(path.join(ROOT, "astro")),
];
assertNonEmptyCorpus("ไฟล์ต้นฉบับที่ตรวจ import", sources, "ตรวจว่า src/ · scripts/ · astro/ ยังอยู่ที่เดิม");

/**
 * จับเฉพาะ `from "x"` · `import "x"` · `import("x")` · `require("x")` ที่เป็นคำสั่งจริง
 * (ตัดคอมเมนต์ทิ้งก่อน แล้วบังคับว่าชื่อต้องเป็นชื่อแพ็กเกจที่ถูกต้องตามกติกา npm)
 */
const IMPORT_SPEC =
  /(?:\bfrom\s*|(?:^|[^.\w])\bimport\s*\(?\s*|(?:^|[^.\w])\brequire\s*\(\s*)["']([^"'\n]+)["']/g;

function stripCommentsAndStrings(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

const undeclared = new Map<string, string>();
for (const file of sources) {
  const text = stripCommentsAndStrings(fs.readFileSync(file, "utf-8"));
  for (const m of text.matchAll(IMPORT_SPEC)) {
    const spec = m[1];
    if (spec.startsWith(".") || spec.startsWith("/")) continue;
    if (spec.startsWith("node:") || spec.startsWith("cloudflare:") || spec.startsWith("bun:")) continue;
    if (spec.startsWith("@/") || spec.startsWith("~/")) continue; // path alias ของ tsconfig

    const parts = spec.split("/");
    const name = spec.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
    if (!VALID_PACKAGE_NAME.test(name)) continue; // เศษสตริง ไม่ใช่ชื่อแพ็กเกจ
    if (NODE_BUILTINS.has(name)) continue;
    if (declared.has(name) || name in IMPLICIT_OK) continue;
    if (!undeclared.has(name)) undeclared.set(name, path.relative(ROOT, file));
  }
}

check(
  `ทุก import ในซอร์สมีชื่ออยู่ใน package.json (${sources.length} ไฟล์)`,
  undeclared.size === 0,
  [...undeclared].map(([name, file]) => `   · "${name}" — ${file}`).join("\n") +
    "\n   ➔ npm ใช้ node_modules แบบแบน จึงหา transitive dependency เจอทั้งที่ไม่ได้ประกาศ" +
    "\n   ➔ วันที่แพ็กเกจแม่เลิกพึ่งมัน โค้ดเราจะพังโดยไม่มีอะไรเตือนล่วงหน้า (บทเรียน PR #368)" +
    "\n   ➔ ถ้าเป็นของที่เฟรมเวิร์กให้มาจริง ให้เพิ่มลง IMPLICIT_OK **พร้อมเหตุผล**",
);

console.log(`\n📊 ผ่าน ${pass} ข้อ | ล้มเหลว ${fail} ข้อ\n`);
if (fail > 0) process.exit(1);
