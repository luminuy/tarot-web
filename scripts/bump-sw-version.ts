/**
 * ⚡ อัปเดตเวอร์ชัน Service Worker Cache อัตโนมัติ (M-05)
 *
 * รันก่อน opennextjs-cloudflare build เสมอ เพื่อให้ CACHE_VERSION ใน public/sw.js
 * ผูกกับ Git Commit SHA หรือ Timestamp ของ build นั้นๆ โดยอัตโนมัติ
 * ทำให้ static precache assets (เช่น /offline.html, /icons/*, manifest) ถูก invalidate
 * และอัปเดตใหม่ในเครื่องของผู้ใช้อัตโนมัติเมื่อ deploy เวอร์ชันใหม่
 */

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

function getBuildVersion(): string {
  if (process.env.GITHUB_SHA) {
    return process.env.GITHUB_SHA.slice(0, 8);
  }

  try {
    const hash = execSync("git rev-parse --short HEAD", {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (hash) return hash;
  } catch {
    // fallback
  }

  return Date.now().toString(36);
}

export function bumpSwVersion(): string {
  const swPath = resolve(process.cwd(), "public/sw.js");
  const content = readFileSync(swPath, "utf-8");

  const buildId = getBuildVersion();
  const version = `v-${buildId}`;

  const updated = content.replace(
    /const CACHE_VERSION = ["'][^"']+["'];/,
    `const CACHE_VERSION = "${version}";`
  );

  if (content !== updated) {
    writeFileSync(swPath, updated, "utf-8");
    console.log(`✨ [SW Version] อัปเดต CACHE_VERSION ใน public/sw.js เป็น "${version}" เรียบร้อยแล้ว`);
  } else {
    console.log(`ℹ️ [SW Version] CACHE_VERSION ใน public/sw.js เป็น "${version}" อยู่แล้ว`);
  }

  return version;
}

if (process.argv[1] && process.argv[1].endsWith("bump-sw-version.ts")) {
  bumpSwVersion();
}
