#!/usr/bin/env tsx
import { execSync } from "node:child_process";

/**
 * รัน D1 migrations (`migrations/*.sql`) ด้วย wrangler
 *
 * ค่าเริ่มต้น = ฐานในเครื่องของ wrangler (`--local`) — ฐานจริงบน Cloudflare ต้องสั่ง `--remote` เองเท่านั้น
 * (2026-10-27: เดิมค่าเริ่มต้นเป็น remote พิมพ์ `npm run db:migrate` เปล่า ๆ บนเครื่องตัวเองก็แก้ฐาน production ทันที)
 *
 *   npm run db:migrate              # ฐานในเครื่อง
 *   npm run db:migrate -- --remote  # ฐานจริง (deploy.yml ใช้ตัวนี้ทุกรอบก่อน deploy)
 */
const isRemote = process.argv.includes("--remote");
const target = isRemote ? "--remote" : "--local";

console.log(`🚀 [DB Migrate] กำลังรัน D1 Migrations (${isRemote ? "Remote Cloudflare" : "Local"})...`);

try {
  const cmd = `npx wrangler d1 migrations apply tarot-app-db ${target}`;
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
  console.log("✅ [DB Migrate] Migration สำเร็จเรียบร้อย!");
} catch (err) {
  console.error("❌ [DB Migrate] Migration ล้มเหลว:", err);
  process.exit(1);
}
