#!/usr/bin/env tsx
import { execSync } from "node:child_process";

const isLocal = process.argv.includes("--local");
const target = isLocal ? "--local" : "--remote";

console.log(`🚀 [DB Migrate] กำลังรัน D1 Migrations (${isLocal ? "Local" : "Remote Cloudflare"})...`);

try {
  const cmd = `npx wrangler d1 migrations apply tarot-app-db ${target}`;
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
  console.log("✅ [DB Migrate] Migration สำเร็จเรียบร้อย!");
} catch (err) {
  console.error("❌ [DB Migrate] Migration ล้มเหลว:", err);
  process.exit(1);
}
