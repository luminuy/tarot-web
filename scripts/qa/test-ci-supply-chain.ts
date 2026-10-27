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
 * 🔒 package.json กับ package-lock.json ต้องพูดตรงกัน — ตรวจแบบออฟไลน์
 * ---------------------------------------------------------------------------
 * `npm ci` ตรวจข้อนี้ให้อยู่แล้ว **แต่ตรวจบน CI เท่านั้น** คือหลังจากเปิด PR ไปแล้ว
 * เสียรอบ CI ทั้งรอบกว่าจะรู้ว่าพังเพราะอะไร
 *
 * เคสจริงที่ทำให้ต้องเพิ่มด่านนี้ (INC-0206): dependabot ยิง PR 5 ใบติดกัน
 * โดยแก้ **เฉพาะ `package.json`** ไม่แตะ lockfile เลยสักใบ ทุกใบตายที่
 * `npm ci` วินาทีที่ 13–20 ด้วยข้อความ `lock file's eslint@9.39.5 does not
 * satisfy eslint@10.11.0` — ซึ่งไม่มีใครเห็นจนกว่าจะเปิดล็อกของ job
 *
 * ด่านนี้อ่านสองไฟล์ตรง ๆ ไม่ต่อเน็ต ไม่ติดตั้งอะไร จึงรันได้ตั้งแต่ก่อน commit
 * (pre-commit เรียก repo:verify อยู่แล้ว) และบอกชื่อแพ็กเกจที่เพี้ยนพร้อมทางแก้
 */
const lockRaw = fs.existsSync(path.join(ROOT, "package-lock.json"))
  ? JSON.parse(fs.readFileSync(path.join(ROOT, "package-lock.json"), "utf-8"))
  : null;

if (lockRaw) {
  const pkgJson = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf-8"));
  const lockRoot = lockRaw.packages?.[""] ?? {};
  const FIELDS = ["dependencies", "devDependencies", "optionalDependencies"] as const;

  const drift: string[] = [];
  for (const field of FIELDS) {
    const wanted: Record<string, string> = pkgJson[field] ?? {};
    const locked: Record<string, string> = lockRoot[field] ?? {};
    for (const [name, range] of Object.entries(wanted)) {
      if (locked[name] === undefined) {
        drift.push(`   · ${name} — มีใน package.json (${field}) แต่ lockfile ไม่รู้จักเลย`);
      } else if (locked[name] !== range) {
        drift.push(`   · ${name} — package.json ขอ ${range} · lockfile จำไว้ว่า ${locked[name]}`);
      }
    }
    for (const name of Object.keys(locked)) {
      if (wanted[name] === undefined) {
        drift.push(`   · ${name} — lockfile ยังจำว่าเป็น ${field} แต่ package.json ถอดออกไปแล้ว`);
      }
    }
  }

  check(
    "package.json กับ package-lock.json ตรงกันทุกแพ็กเกจ (`npm ci` จะไม่ตก)",
    drift.length === 0,
    drift.join("\n") + "\n   ➔ แก้ด้วย `npm run deps:relock` แล้ว commit lockfile ไปด้วยกันเสมอ",
  );

  /*
   * ช่วงที่ประกาศไว้ต้องมีของจริงในล็อกให้ติดตั้งด้วย
   * (dependabot รุ่นที่พลาดทิ้ง "Missing: <pkg> from lock file" ไว้เป็นกอง)
   */
  const missingTree: string[] = [];
  for (const field of FIELDS) {
    for (const name of Object.keys(pkgJson[field] ?? {})) {
      if (!lockRaw.packages?.[`node_modules/${name}`]) {
        missingTree.push(`   · ${name} — ไม่มีระเบียน node_modules/${name} ในล็อก`);
      }
    }
  }
  check(
    "ทุกแพ็กเกจที่ประกาศไว้มีระเบียนจริงใน lockfile",
    missingTree.length === 0,
    missingTree.join("\n") + "\n   ➔ แก้ด้วย `npm run deps:relock`",
  );
}

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

/*
 * 🤖 `packageManager` ใน package.json ต้องชี้ไปที่ npm (INC-0258)
 * dependabot เลือกเครื่องมือจากช่องนี้ — ช่องค้างเป็น "pnpm@9.15.4" ตั้งแต่ #39 (2026-08-31)
 * ทั้งที่ย้ายมาใช้ npm + package-lock.json แล้ว ➔ dependabot แก้แต่ package.json ไม่แตะ lockfile
 * PR ของมันจึงตายที่ `npm ci` ทุกสัปดาห์ (INC-0206 #541–#545 · #625 #626 · #652 · #660–#663)
 */
const declaredPm = String((JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf-8")) as { packageManager?: string }).packageManager ?? "");
check(
  `package.json "packageManager" ตรงกับ lockfile ที่ใช้จริง (ได้มา: "${declaredPm || "ไม่ได้ระบุ"}")`,
  declaredPm === "" || declaredPm.startsWith("npm@") || (declaredPm.startsWith("pnpm@") && hasPnpmLock),
  '   ➔ รีโปนี้ใช้ npm (package-lock.json) — ตั้งเป็น "npm@<เวอร์ชัน>" ไม่งั้น dependabot จะไม่อัปเดต lockfile ให้',
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
    "workflow ถอยกลับยืนยัน Worker ด้วยสคริปต์ smoke (ไม่ใช่เช็กหน้าแรกที่เป็นไฟล์ static)",
    /worker-smoke\.sh/.test(rollback.src) && !/curl[^\n]*https:\/\/seertarot\.net\/\s/.test(rollback.src),
    "   ➔ หน้าแรกถูกชั้น assets ตอบก่อน Worker — ถอยไปเวอร์ชันที่ Worker ยังล้มก็ยังเขียว (A10-03 · INC-0285)",
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
  check(
    "คู่มือ deploy มีขั้นตอนกู้คืน D1 จากไฟล์สำรอง",
    /สำรองและกู้คืน D1/.test(guideSrc) && /seertarot-d1-backups/.test(guideSrc),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4b. สำรองฐาน D1 นอกฐาน (ตรวจ 2026-10-24) — สำรองที่ไม่รันหรือรั่วออกนอก bucket ส่วนตัว = ไม่มีสำรอง
// ─────────────────────────────────────────────────────────────────────────────
const backupWf = workflows.find((wf) => wf.name === "d1-backup.yml");
check("มี workflow สำรองฐาน `.github/workflows/d1-backup.yml`", !!backupWf);
if (backupWf) {
  check(
    "d1-backup.yml รันตามเวลาและกดเองได้ (`schedule` + `workflow_dispatch`)",
    /schedule:\s*\n\s*- cron:/.test(backupWf.src) && /workflow_dispatch:/.test(backupWf.src),
  );
  check("d1-backup.yml เรียกสคริปต์สำรอง `npm run cf:d1-backup`", /npm run cf:d1-backup/.test(backupWf.src));
  check(
    "d1-backup.yml ไม่แนบไฟล์สำรองเป็น artifact (มีข้อมูลส่วนบุคคล)",
    !/actions\/upload-artifact/.test(backupWf.src),
    "   ➔ artifact ของ GitHub ดาวน์โหลดได้ทุกคนที่อ่าน Actions ของรีโป — ไฟล์สำรองอยู่ใน R2 ส่วนตัวเท่านั้น",
  );
  check("d1-backup.yml เปิด issue เมื่อสำรองล้ม (ไม่ล้มเงียบ)", /if: always\(\)/.test(backupWf.src) && /gh issue create/.test(backupWf.src));
  // นโยบายความเป็นส่วนตัวบอกอายุสำเนาสำรองตามจริง — ข้อมูลที่ผู้ใช้สั่งลบยังค้างในสำเนาจนหมดอายุ (เจ้าของสั่ง 2026-10-26)
  const keepDays = fs.readFileSync(path.join(ROOT, "scripts/cf-d1-backup.ts"), "utf-8").match(/BACKUP_RETENTION_DAYS = (\d+);/)?.[1];
  const privacyTh = fs.readFileSync(path.join(ROOT, "src/app/_shared/pages/privacy-th.tsx"), "utf-8");
  const privacyEn = fs.readFileSync(path.join(ROOT, "src/app/_shared/pages/privacy-en.tsx"), "utf-8");
  check(
    `หน้านโยบายความเป็นส่วนตัวทั้งสองภาษาบอกอายุสำเนาสำรอง ${keepDays ?? "?"} วันตรงกับสคริปต์สำรอง`,
    !!keepDays && privacyTh.includes(`${keepDays} วัน`) && privacyEn.includes(`${keepDays} days`),
    "   ➔ แก้ BACKUP_RETENTION_DAYS แล้วต้องแก้ข้อ 3 ของ privacy-th.tsx / privacy-en.tsx ด้วย",
  );
}

// 4c. R2 แยกตามอายุข้อมูล (PDPA · 2026-10-26) — การ์ดแชร์ลบทั้ง bucket ทุก 90 วัน · โลโก้แม่หมออยู่ bucket ถาวรของตัวเอง
{
  const deployWf = workflows.find((wf) => wf.name === "deploy.yml")?.src ?? "";
  const previewWf = workflows.find((wf) => wf.name === "preview.yml")?.src ?? "";
  check("deploy.yml ตั้งกฎลบการ์ดแชร์ทุกรอบ (`npm run cf:r2-lifecycle`)", /npm run cf:r2-lifecycle/.test(deployWf));
  const deployAt = (src: string, re: RegExp) => src.search(re);
  check(
    "deploy.yml / preview.yml สร้าง R2 bucket ที่ขาดก่อน `wrangler deploy` (`npm run cf:r2-buckets`)",
    [
      [deployWf, /name: 🚀 Build & Deploy to Cloudflare Workers/],
      [previewWf, /opennextjs-cloudflare deploy/],
    ].every(([src, re]) => {
      const prep = deployAt(src as string, /npm run cf:r2-buckets/);
      return prep >= 0 && prep < deployAt(src as string, re as RegExp);
    }),
    "   ➔ bucket ใหม่ใน wrangler.jsonc ที่ยังไม่มีจริง = wrangler deploy ล้มทั้งรอบ",
  );
  const wrangler = fs.readFileSync(path.join(ROOT, "wrangler.jsonc"), "utf-8");
  const lc = fs.readFileSync(path.join(ROOT, "scripts/cf-r2-lifecycle.ts"), "utf-8");
  check(
    "โลโก้แม่หมออยู่ bucket แยก (`STUDIO_BUCKET`) และสคริปต์กฎลบยืนยันว่าไม่มีกฎครอบ `studio-logo/`",
    /"binding"\s*:\s*"STUDIO_BUCKET"/.test(wrangler) && /STUDIO_MUST_KEEP = \["studio-logo\/"\]/.test(lc),
    "   ➔ โลโก้ปนกับ bucket การ์ดแชร์ = กฎลบ 90 วันลบโลโก้ทิ้ง",
  );
  const studioSrc = ["src/lib/studio/logo.ts", "src/app/api/marketplace/studio/logo/route.ts", "src/app/api/studio/logo/[readerId]/[file]/route.ts"]
    .map((f) => fs.readFileSync(path.join(ROOT, f), "utf-8"))
    .join("\n");
  check(
    "โค้ดโลโก้แม่หมออ่าน/เขียน/ลบผ่าน `getStudioBucket()` เท่านั้น (ไม่แตะ bucket การ์ดแชร์)",
    /getStudioBucket\(\)/.test(studioSrc) && !/getShareBucket/.test(studioSrc),
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

// ─────────────────────────────────────────────────────────────────────────────
// 6. A10-02 · A10-03 — ต้องมีด่านที่จับ "Worker ล้มตอนรันจริง" ทั้งหลัง deploy และหลังถอย
// ─────────────────────────────────────────────────────────────────────────────
const smokePath = path.join(ROOT, ".github/scripts/worker-smoke.sh");
const smokeSrc = fs.existsSync(smokePath) ? fs.readFileSync(smokePath, "utf-8") : "";
check("มีสคริปต์ยืนยัน Worker `.github/scripts/worker-smoke.sh`", smokeSrc.length > 0);
check(
  "สคริปต์ smoke ยิงเส้นที่ต้องผ่าน Worker (/readers + /api/cron/*) ไม่ใช่หน้า static",
  /\/readers/.test(smokeSrc) && /\/api\/cron\//.test(smokeSrc),
  "   ➔ เส้นที่ขอบตอบเองไม่ปลุก Worker — Worker ล้ม (1101) ก็ยังเขียว",
);
{
  const deployWf = workflows.find((wf) => wf.name === "deploy.yml")?.src ?? "";
  const iDeploy = deployWf.indexOf("npm run deploy");
  const iSmoke = deployWf.indexOf("worker-smoke.sh");
  const iStripe = deployWf.indexOf("wrangler secret put");
  check(
    "deploy.yml ยืนยัน Worker หลัง deploy และก่อนขั้น Stripe sync (ไม่สร้างเวอร์ชันใหม่ทับเวอร์ชันที่จะถอย)",
    iDeploy >= 0 && iSmoke > iDeploy && iStripe > iSmoke,
    "   ➔ ลำดับต้องเป็น: npm run deploy ➔ worker-smoke.sh ➔ wrangler secret put",
  );
  check(
    "deploy.yml จดเวอร์ชันก่อน deploy และถอยด้วย version id เจาะจง (ไม่ถอยแบบเว้นว่าง)",
    /PREV_VERSION_ID/.test(deployWf) && /wrangler rollback "\$PREV_VERSION_ID"/.test(deployWf),
    "   ➔ ถอยแบบเว้นว่างอาจไปหาเวอร์ชันที่เกิดจาก `secret put` ซึ่งเป็นโค้ดชุดเดียวกับที่พัง (INC-0285)",
  );
  const rbWf = workflows.find((wf) => wf.name === "rollback.yml")?.src ?? "";
  check(
    "rollback.yml ไม่ยืนยันด้วย curl หน้าแรกอย่างเดียว",
    !/curl[^\n]*seertarot\.net\/["\s]/.test(rbWf),
  );
}

// ── dependabot: ตัวแปลงห้ามยกเอง · มี cooldown (A10-02 · A10-04) ───────────────
{
  const depPath = path.join(ROOT, ".github/dependabot.yml");
  const dep = fs.existsSync(depPath) ? fs.readFileSync(depPath, "utf-8") : "";
  const live = dep.split("\n").filter((l) => !/^\s*#/.test(l)).join("\n");
  check("dependabot ไม่ยกรุ่น @opennextjs/* เอง (ตัวแปลงต้องยกด้วยมือคู่กับ next)", /dependency-name:\s*"@opennextjs\/\*"/.test(live));
  check("dependabot ตั้ง cooldown (รอก่อนเปิด PR รุ่นใหม่)", /cooldown:\s*\n\s+default-days:\s*\d+/.test(live));
}

// ── pr.yml: สิทธิ์แคบ + ไม่ auto-merge ของที่ประกอบเป็น Worker (A10-02 · A10-04) ─────
{
  const prWf = workflows.find((wf) => wf.name === "pr.yml")?.src ?? "";
  const topPerm = /^permissions:\s*\n((?:[ \t]+\S.*\n?)*)/m.exec(prWf)?.[1] ?? "";
  check(
    "pr.yml: สิทธิ์ระดับ workflow เป็น `contents: read` เท่านั้น (ไม่มี write ให้ทุก job)",
    /contents:\s*read/.test(topPerm) && !/write/.test(topPerm),
    "   ➔ job ที่รัน `npm ci` ได้โทเคนเขียนกว้าง = แพ็กเกจที่ถูกยึดสร้าง check run ปลอม/สั่ง deploy ได้",
  );
  check("pr.yml: checkout ของ job ตรวจ PR ตั้ง `persist-credentials: false`", /persist-credentials:\s*false/.test(prWf));
  check(
    "pr.yml: ไม่ auto-merge PR ของ dependabot ที่แตะ next / wrangler / @opennextjs",
    /dependabot\[bot\]/.test(prWf) && /opennextjs/.test(prWf) && /touchesWorker/.test(prWf),
  );
}

// ── A10-07: โฮสต์ workers.dev ใช้เฉพาะ /api/cron/* — ที่เหลือส่งกลับโดเมนหลัก ───────────
{
  const stray: string[] = [];
  for (const wf of workflows) {
    for (const [i, line] of wf.src.split("\n").entries()) {
      if (/^\s*#/.test(line)) continue;
      const m = /workers\.dev(\/api\/\S*)/.exec(line);
      if (m && !m[1].startsWith("/api/cron/")) stray.push(`   · ${wf.name}:${i + 1} — ${line.trim()}`);
    }
  }
  check(
    "workflow ยิง /api/* เข้า workers.dev เฉพาะ /api/cron/* (เส้นอื่นถูกส่งกลับโดเมนหลักแล้ว)",
    stray.length === 0,
    stray.join("\n"),
  );
  const nextCfg = fs.readFileSync(path.join(ROOT, "next.config.ts"), "utf-8");
  check(
    "next.config.ts ส่ง /api/* (ยกเว้น /api/cron/) บนโฮสต์ workers.dev กลับโดเมนหลัก",
    nextCfg.includes("workers\\\\.dev") && nextCfg.includes("PRODUCTION_WORKERS_DEV_HOST") && nextCfg.includes("(?!cron/)"),
    "   ➔ โฮสต์นี้อยู่นอกโซน — กฎ WAF/เพดานถี่ของโซนไม่ครอบ (A10-07)",
  );
}

console.log(`\n📊 ผ่าน ${pass} ข้อ | ล้มเหลว ${fail} ข้อ\n`);
if (fail > 0) process.exit(1);
