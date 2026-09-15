/**
 * 🔗 รวมผลลัพธ์ของ Astro เข้ากับชุดไฟล์ static ที่ Worker เสิร์ฟ
 * ===========================================================================
 *
 * เว็บนี้ถูกเรนเดอร์ด้วยเครื่องมือสองตัว แต่ผู้ใช้ต้องเห็นเป็นเว็บเดียว:
 *
 *   Next.js ➔ `.open-next/assets` + `.open-next/worker.js`  (หน้าแอป · API · sitemap)
 *   Astro   ➔ `dist/`                                        (หน้าเนื้อหา · HTML ล้วน)
 *
 * สคริปต์นี้คัดลอก `dist/` ทับลงใน `.open-next/assets` **หลัง** `opennextjs-cloudflare build`
 * เสมอ (คำสั่งนั้นล้างโฟลเดอร์ทิ้งทุกครั้ง จึงต้องรันตามหลัง ไม่ใช่ก่อน)
 *
 * ทำไมวางไว้ในชุด static assets ไม่ใช่ให้ Worker เสิร์ฟ
 * --------------------------------------------------
 * Cloudflare ตอบไฟล์ใน assets **ตั้งแต่ขอบ โดยไม่ปลุก Worker เลย**
 * หน้าเนื้อหา 174 หน้าจึงไม่มีค่าคำขอ Worker และไม่ต้องบูต runtime ของ Next
 * (เทียบกับเดิมที่ทุกคำขอต้องผ่าน Worker — ดู `docs/plans/HANDOFF_CF_REQUEST_REVIEW_2026-09-08.md`)
 *
 * ⚠️ ห้ามมีไฟล์ชนกันระหว่างสองฝั่ง — ถ้าชน แปลว่ามีหน้าเดียวกันถูกเรนเดอร์สองที่
 *    ซึ่งเป็นบั๊กเสมอ (ผู้ใช้จะเห็นฉบับไหนขึ้นกับลำดับการคัดลอก) สคริปต์นี้จึงหยุดทันที
 *    ยกเว้นไฟล์ที่ "เหมือนกันเป๊ะ" อยู่แล้ว (เช่นของใน `public/` ที่ทั้งสองฝั่งคัดลอกมา)
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const ASTRO_DIST = path.join(ROOT, "dist");
const WORKER_ASSETS = path.join(ROOT, ".open-next/assets");

function walk(dir: string, base = dir, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) walk(full, base, out);
    else out.push(path.relative(base, full));
  }
  return out;
}

function sha(file: string): string {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function main(): void {
  if (!fs.existsSync(ASTRO_DIST)) {
    console.error(`❌ ไม่พบ ${path.relative(ROOT, ASTRO_DIST)} — รัน \`astro build\` ก่อน`);
    process.exit(1);
  }
  if (!fs.existsSync(WORKER_ASSETS)) {
    console.error(
      `❌ ไม่พบ ${path.relative(ROOT, WORKER_ASSETS)} — ต้องรัน \`opennextjs-cloudflare build\` ก่อนเสมอ`,
    );
    process.exit(1);
  }

  const files = walk(ASTRO_DIST);
  const clashes: string[] = [];
  let copied = 0;

  for (const rel of files) {
    const from = path.join(ASTRO_DIST, rel);
    const to = path.join(WORKER_ASSETS, rel);

    if (fs.existsSync(to) && sha(from) !== sha(to)) {
      clashes.push(rel);
      continue;
    }

    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
    copied += 1;
  }

  if (clashes.length > 0) {
    console.error("❌ ไฟล์ชนกันระหว่าง Astro กับ Next — มีหน้าเดียวกันถูกเรนเดอร์สองที่:");
    for (const c of clashes.slice(0, 20)) console.error(`   • ${c}`);
    if (clashes.length > 20) console.error(`   … อีก ${clashes.length - 20} ไฟล์`);
    console.error("\n   ➔ ลบเส้นทางนั้นออกจากฝั่ง Next (`src/app/**/page.tsx`) ให้เหลือที่เดียว");
    process.exit(1);
  }

  const pages = files.filter((f) => f.endsWith(".html")).length;
  console.log(`✅ รวมผลลัพธ์ Astro เข้ากับ Worker assets แล้ว — ${pages} หน้า (${copied} ไฟล์)`);
}

main();
