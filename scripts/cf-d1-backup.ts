#!/usr/bin/env tsx
/**
 * 🗄️ สำรองฐานข้อมูล D1 (`tarot-app-db`) ลง R2 แบบส่วนตัว — รันจาก `.github/workflows/d1-backup.yml`
 * ===========================================================================
 *
 * ## ทำไมต้องมี (ตรวจ 2026-10-24)
 *
 * ข้อมูลผู้ใช้ การจ่ายเงิน และนัดแม่หมอทั้งหมดอยู่ใน D1 ฐานเดียว ที่ผ่านมาพึ่งแค่ Time Travel
 * ของ Cloudflare (ย้อนได้ราว 30 วัน) ซึ่งหายไปพร้อมฐานถ้าฐานถูกลบ — สคริปต์นี้เก็บสำเนาไว้อีกที่
 *
 * ## ทำอะไรบ้าง (ล้มขั้นไหน = workflow แดง ไม่มีขั้นไหนกลืนเงียบ)
 *
 * 1. เตรียม bucket `seertarot-d1-backups` — ยืนยันว่าไม่มีทางเข้าสาธารณะ + กฎลบไฟล์เก่าอัตโนมัติ
 * 2. `wrangler d1 export --remote` ได้ไฟล์ .sql ทั้งฐาน
 *    ⚠️ ระหว่าง export ฐานจะไม่รับคำขออื่น (เอกสาร D1) — workflow จึงตั้งเวลาตีสามวันอาทิตย์ (เวลาไทย)
 * 3. พิสูจน์ว่าไฟล์กู้คืนได้จริง: โหลดทั้งไฟล์ลง SQLite ในหน่วยความจำ + `PRAGMA integrity_check`
 *    + ต้องมีตารางหลักครบ — ไฟล์สำรองที่กู้ไม่ได้ = ไม่มีไฟล์สำรอง
 * 4. บีบอัด gzip แล้วอัปโหลด จากนั้นดาวน์โหลดกลับมาเทียบ SHA-256 ให้ตรงทุกไบต์
 * 5. สรุปผลลง log / step summary เป็นตัวเลขล้วน (ขนาด · จำนวนแถวต่อตาราง) ไม่มีข้อมูลส่วนบุคคล
 *
 * ไฟล์สำรองมีข้อมูลส่วนบุคคล — อยู่ใน bucket ส่วนตัวเท่านั้น **ห้ามแนบเป็น artifact ของ GitHub**
 * ไฟล์ชั่วคราวบนเครื่องรันถูกลบทิ้งท้ายสคริปต์เสมอ
 *
 * ## วิธีใช้
 *
 *   npm run cf:d1-backup                      # สำรองจริง (ต้องมี CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID)
 *   npm run cf:d1-backup -- --local --dry-run # ลองกับ D1 ในเครื่องของ wrangler · ไม่แตะ R2
 *
 * วิธีกู้คืน: docs/CLOUDFLARE_DEPLOYMENT_GUIDE.md หัวข้อ "สำรองและกู้คืน D1"
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { gzipSync } from "node:zlib";
import {
  assertR2BucketPrivate,
  cloudflareCredentials,
  ensureR2Bucket,
  ensureR2ExpireRules,
} from "./lib/cloudflare-r2";

const DB_NAME = "tarot-app-db";
const BACKUP_BUCKET = "seertarot-d1-backups";
const BACKUP_PREFIX = `d1/${DB_NAME}/`;
/**
 * เก็บย้อนหลัง 35 วัน = สำเนารายสัปดาห์อย่างน้อย 4 ชุดเสมอ
 * ไม่เก็บนานกว่านี้: ผู้ใช้ที่สั่งลบบัญชีควรหายจากสำเนาด้วยในเวลาที่สั้นที่สุดที่ยังพอใช้กู้คืนได้ (PDPA)
 */
const BACKUP_RETENTION_DAYS = 35;
/** ตารางที่ต้องเจอในไฟล์สำรอง — ไม่เจอ = export ผิดฐานหรือได้ไฟล์ไม่ครบ */
const REQUIRED_TABLES = ["users", "payments", "readers", "reading_journal"];
/** wrangler อัปโหลดไฟล์เดียวได้ไม่เกิน 300 MiB */
const MAX_UPLOAD_BYTES = 290 * 1024 * 1024;

const LOCAL = process.argv.includes("--local");
const DRY_RUN = process.argv.includes("--dry-run");

function wrangler(args: string[]): void {
  execFileSync("npx", ["wrangler", ...args], { stdio: "inherit" });
}

function sha256(file: string): string {
  return createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function mib(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
}

interface VerifyResult {
  tables: Array<{ name: string; rows: number }>;
  migrations: number | null;
}

/** โหลดไฟล์ .sql ทั้งไฟล์ลงฐานเปล่าในหน่วยความจำ — พิสูจน์ว่าไฟล์นี้กู้คืนได้จริง */
function verifyDump(sqlFile: string): VerifyResult {
  const db = new DatabaseSync(":memory:");
  try {
    db.exec(fs.readFileSync(sqlFile, "utf-8"));
    const integrity = db.prepare("PRAGMA integrity_check").get() as { integrity_check: string };
    if (integrity.integrity_check !== "ok") {
      throw new Error(`integrity_check ไม่ผ่าน: ${integrity.integrity_check}`);
    }
    const names = (
      db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
        .all() as Array<{ name: string }>
    ).map((r) => r.name);
    const missing = REQUIRED_TABLES.filter((t) => !names.includes(t));
    if (missing.length > 0) throw new Error(`ไฟล์สำรองไม่มีตารางหลัก: ${missing.join(", ")}`);
    const tables = names.map((name) => ({
      name,
      rows: (db.prepare(`SELECT count(*) AS n FROM "${name}"`).get() as { n: number }).n,
    }));
    const migrations = names.includes("d1_migrations")
      ? (db.prepare("SELECT count(*) AS n FROM d1_migrations").get() as { n: number }).n
      : null;
    return { tables, migrations };
  } finally {
    db.close();
  }
}

function writeSummary(lines: string[]): void {
  console.log(`\n${lines.join("\n")}\n`);
  const file = process.env.GITHUB_STEP_SUMMARY;
  if (file) fs.appendFileSync(file, `${lines.join("\n")}\n`);
}

async function main(): Promise<void> {
  if (!LOCAL) cloudflareCredentials();
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "d1-backup-"));
  try {
    if (!DRY_RUN) {
      const created = await ensureR2Bucket(BACKUP_BUCKET);
      console.log(created ? `🪣 สร้าง bucket ${BACKUP_BUCKET} แล้ว` : `🪣 bucket ${BACKUP_BUCKET} มีอยู่แล้ว`);
      await assertR2BucketPrivate(BACKUP_BUCKET);
      console.log("🔒 bucket ไม่มีทางเข้าสาธารณะ (r2.dev ปิด · ไม่มีโดเมนผูก)");
      const rule = await ensureR2ExpireRules(BACKUP_BUCKET, [
        { id: "expire-d1-backups", prefix: BACKUP_PREFIX, days: BACKUP_RETENTION_DAYS },
      ]);
      console.log(
        `🧹 กฎลบไฟล์สำรองอายุเกิน ${BACKUP_RETENTION_DAYS} วัน: ${rule.unchanged.length > 0 ? "มีอยู่แล้ว" : "ตั้งใหม่แล้ว"}`,
      );
    }

    const sqlFile = path.join(work, `${DB_NAME}.sql`);
    console.log(`\n📤 export ${DB_NAME} (${LOCAL ? "local" : "remote"}) ...`);
    wrangler(["d1", "export", DB_NAME, LOCAL ? "--local" : "--remote", "--output", sqlFile, "--skip-confirmation"]);
    const rawBytes = fs.statSync(sqlFile).size;
    if (rawBytes === 0) throw new Error("ไฟล์ export ว่างเปล่า");

    console.log("\n🔍 ลองกู้ไฟล์ลง SQLite ในหน่วยความจำ ...");
    const verified = verifyDump(sqlFile);
    const totalRows = verified.tables.reduce((sum, t) => sum + t.rows, 0);
    console.log(`✅ กู้ได้ครบ ${verified.tables.length} ตาราง · ${totalRows.toLocaleString()} แถว · integrity ok`);

    const gzFile = `${sqlFile}.gz`;
    fs.writeFileSync(gzFile, gzipSync(fs.readFileSync(sqlFile), { level: 9 }));
    fs.rmSync(sqlFile);
    const gzBytes = fs.statSync(gzFile).size;
    const digest = sha256(gzFile);
    if (gzBytes > MAX_UPLOAD_BYTES) {
      throw new Error(`ไฟล์บีบอัดแล้ว ${mib(gzBytes)} เกินเพดานอัปโหลด ${mib(MAX_UPLOAD_BYTES)} — ต้องเปลี่ยนไปอัปโหลดแบบ multipart`);
    }

    const now = new Date();
    const stamp = now.toISOString().slice(0, 16).replace(/:/g, "");
    const key = `${BACKUP_PREFIX}${now.toISOString().slice(0, 7).replace("-", "/")}/${DB_NAME}-${stamp}Z.sql.gz`;

    if (!DRY_RUN) {
      console.log(`\n☁️  อัปโหลด ${BACKUP_BUCKET}/${key} ...`);
      wrangler([
        "r2", "object", "put", `${BACKUP_BUCKET}/${key}`,
        "--file", gzFile, "--remote", "--content-type", "application/gzip",
      ]);
      const back = path.join(work, "readback.sql.gz");
      wrangler(["r2", "object", "get", `${BACKUP_BUCKET}/${key}`, "--remote", "--file", back]);
      if (sha256(back) !== digest) throw new Error("ไฟล์ที่ดาวน์โหลดกลับมา SHA-256 ไม่ตรงกับที่อัปโหลด");
      console.log("✅ ดาวน์โหลดกลับมาเทียบแล้วตรงทุกไบต์");
    }

    writeSummary([
      `### สำรองฐานข้อมูล ${DB_NAME}${DRY_RUN ? " (ทดลอง ไม่ได้อัปโหลด)" : ""}`,
      "",
      `- ไฟล์: \`${DRY_RUN ? "(ไม่ได้อัปโหลด)" : `${BACKUP_BUCKET}/${key}`}\``,
      `- ขนาด: SQL ${mib(rawBytes)} · บีบอัดแล้ว ${mib(gzBytes)}`,
      `- SHA-256: \`${digest}\``,
      `- ตาราง ${verified.tables.length} · รวม ${totalRows.toLocaleString()} แถว · migration ที่รันแล้ว ${verified.migrations ?? "(ไม่มีตาราง d1_migrations)"}`,
      `- เก็บไว้ ${BACKUP_RETENTION_DAYS} วันแล้วลบอัตโนมัติ`,
      "",
      "| ตาราง | แถว |",
      "| :--- | ---: |",
      ...verified.tables.map((t) => `| ${t.name} | ${t.rows.toLocaleString()} |`),
    ]);
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(`❌ สำรอง D1 ไม่สำเร็จ: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
