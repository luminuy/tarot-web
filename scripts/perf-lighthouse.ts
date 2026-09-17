/**
 * ⚡ วัด Lighthouse บน production จริง แบบไม่ต้องพึ่งโควตา PSI — `npm run perf:lh`
 * ===========================================================================
 *
 * ## ทำไมต้องมีสคริปต์นี้
 *
 * รอบตรวจสองรอบที่ผ่านมาเสียเวลาไปกับการ "ประกอบคำสั่ง Lighthouse ใหม่ทุกครั้ง"
 * และตัวเลขที่ได้เทียบกันไม่ได้เพราะแฟล็กไม่เหมือนกัน (คนละ preset · คนละวิธีหน่วง)
 * ไฟล์นี้ตรึงวิธีวัดไว้ที่เดียว: **มือถือ · `--throttling-method=simulate` · หมวด performance**
 *
 * ## ทำไมต้องยิงสองรอบต่อหน้า
 *
 * Cloudflare ฉีดสคริปต์ตรวจบอต (`cdn-cgi/challenge-platform/.../jsd/main.js`) เข้า HTML ทุกหน้า
 * และมันกินเธรดหลักมากกว่าโค้ดของเราทั้งหน้ารวมกัน (ISSUE-047) — ถ้าวัดรอบเดียว
 * จะแยกไม่ออกว่า TBT ที่เห็นเป็นของเราหรือของมัน รอบที่สองจึงบล็อกมันทิ้งเพื่อดู "ของเราล้วน"
 *
 * ## ข้อจำกัดที่ต้องเขียนไว้ทุกครั้งที่รายงานตัวเลขชุดนี้
 *
 * - รันบนเครื่อง dev ที่หน่วง CPU ตามค่าเริ่มต้นของ Lighthouse ➔ บอก **ลำดับความสำคัญ** ได้
 *   แต่ไม่ใช่ ms ที่ผู้ใช้จริงเจอบนมือถือตัวเอง (ของจริงต้องดู CrUX / PSI)
 * - ตัวเลขข้ามเวอร์ชัน Lighthouse เทียบกันตรง ๆ ไม่ได้ — สคริปต์พิมพ์เวอร์ชันกำกับไว้ให้เสมอ
 *
 * ใช้: `npm run perf:lh` (ทุกหน้า) · `npm run perf:lh -- spreads blog` (เลือกหน้า)
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PAGES: Record<string, string> = {
  home: "https://seertarot.net/",
  cards: "https://seertarot.net/cards",
  blog: "https://seertarot.net/blog",
  spreads: "https://seertarot.net/spreads",
};

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = path.join(os.tmpdir(), "seertarot-lh");

const wanted = process.argv.slice(2).filter((a) => a in PAGES);
const pages = wanted.length > 0 ? wanted : Object.keys(PAGES);

fs.mkdirSync(OUT, { recursive: true });

type Row = { page: string; mode: string; perf: number; fcp: number; lcp: number; tbt: number; cls: string };
const rows: Row[] = [];
let lhVersion = "?";

for (const page of pages) {
  for (const mode of ["plain", "noblock"] as const) {
    const out = path.join(OUT, `${page}-${mode}.json`);
    const args = [
      "--yes",
      "lighthouse",
      PAGES[page],
      "--quiet",
      "--chrome-flags=--headless=new --no-sandbox",
      "--throttling-method=simulate",
      "--only-categories=performance",
      "--output=json",
      `--output-path=${out}`,
    ];
    // รอบที่สอง: บล็อกสคริปต์ตรวจบอตของ Cloudflare ทิ้ง เพื่อแยก "ของเรา" ออกจาก "ของมัน"
    if (mode === "noblock") args.push("--blocked-url-patterns=*challenge-platform*");

    process.stdout.write(`  ⏳ ${page} (${mode}) …`);
    try {
      execFileSync("npx", args, {
        stdio: ["ignore", "ignore", "ignore"],
        env: { ...process.env, CHROME_PATH: fs.existsSync(CHROME) ? CHROME : (process.env.CHROME_PATH ?? "") },
      });
    } catch {
      console.log(" ❌ ยิงไม่สำเร็จ (ไม่มี Chrome บนเครื่อง? ต่อเน็ตไม่ได้?)");
      continue;
    }

    const report = JSON.parse(fs.readFileSync(out, "utf-8")) as {
      lighthouseVersion: string;
      categories: { performance: { score: number } };
      audits: Record<string, { numericValue?: number }>;
    };
    lhVersion = report.lighthouseVersion;
    const n = (k: string) => Math.round(report.audits[k]?.numericValue ?? 0);
    rows.push({
      page,
      mode,
      perf: Math.round(report.categories.performance.score * 100),
      fcp: n("first-contentful-paint"),
      lcp: n("largest-contentful-paint"),
      tbt: n("total-blocking-time"),
      cls: (report.audits["cumulative-layout-shift"]?.numericValue ?? 0).toFixed(3),
    });
    console.log(" ✓");
  }
}

console.log(`\n⚡ Lighthouse ${lhVersion} · มือถือ · simulate · production (${new Date().toISOString().slice(0, 10)})\n`);
console.log("| หน้า | รอบ | perf | FCP | LCP | TBT | CLS |");
console.log("| :--- | :--- | ---: | ---: | ---: | ---: | ---: |");
for (const r of rows) {
  const mode = r.mode === "plain" ? "ปกติ" : "บล็อกสคริปต์บอต";
  console.log(`| \`/${r.page === "home" ? "" : r.page}\` | ${mode} | ${r.perf} | ${r.fcp} | ${r.lcp} | ${r.tbt} | ${r.cls} |`);
}
console.log(`\n📂 รายงานเต็มอยู่ที่ ${OUT}\n`);
