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

/* ────────────────────────────────────────────────────────────────────────────
 * ⚡ Early Hints — เติมส่วนหัว `Link: rel=preload` ของสไตล์ชีตให้หน้า HTML ทุกหน้า
 * ────────────────────────────────────────────────────────────────────────────
 *
 * ## ทำไมต้องสร้างตอนบิลด์ ไม่เขียนมือลง `public/_headers`
 *
 * ชื่อไฟล์สไตล์ชีตของ Astro มีแฮชอยู่ในชื่อ (`BaseLayout.C4MwRXdL.css`) และเปลี่ยนทุกครั้ง
 * ที่สไตล์เปลี่ยน — เขียนมือเมื่อไหร่ก็ค้างเป็นชื่อเก่าทันทีที่แก้ CSS ครั้งถัดไป
 * แล้วจะได้ **การพรีโหลดไฟล์ที่ไม่มีอยู่จริง** ซึ่งแย่กว่าไม่ทำอะไรเลย
 *
 * ## ทำไมถึงคุ้ม
 *
 * เจ้าของเปิด **Early Hints** ของ Cloudflare ไว้แล้ว (2026-09-17) — ขอบจะอ่านส่วนหัว `Link`
 * ของหน้า HTML แล้วส่งกลับเป็น `103 Early Hints` ให้เบราว์เซอร์เริ่มโหลดสไตล์ชีต
 * **ก่อน** ที่ HTML จะมาถึงด้วยซ้ำ · สไตล์ชีตก้อนเดียวของเว็บนี้คือทรัพยากรที่ถ่วงการเรนเดอร์
 * อยู่รายการเดียว (R-11/R-12 · วัดได้ 100–400 ms แล้วแต่หน้า)
 *
 * ## กติกา
 *
 * - เลือกเส้นทางจาก `_headers` ที่คัดลอกมาแล้วเอง โดยดูว่าบล็อกไหนมี `s-maxage`
 *   ซึ่งในไฟล์นั้นแปลว่า "หน้า HTML ที่ขอบเสิร์ฟเอง" — **ไม่ต้องมีรายการเส้นทางซ้ำสองที่**
 *   (เพิ่มหน้าใหม่ใน `public/_headers` เมื่อไหร่ ที่นี่ตามไปเอง)
 * - Cloudflare **ต่อท้าย** ส่วนหัวที่ชื่อซ้ำ ไม่ใช่แทนที่ การเติมบล็อกใหม่ของเส้นทางเดิม
 *   จึงไม่ไปทับ `Cache-Control` ที่ตั้งไว้แล้ว
 * - ถ้าหาไฟล์ CSS ไม่เจอ หรือหาเส้นทาง HTML ไม่เจอเลย = **หยุดบิลด์** ไม่ใช่ข้ามเงียบ
 *   (บทเรียน R-07: ด่าน/ขั้นตอนที่ข้ามเงียบเมื่อไม่เจอของ คือด่านที่ตกไม่ได้)
 */
const EARLY_HINTS_MARKER = "# ⚡ EARLY-HINTS-LINKS (สร้างอัตโนมัติโดย scripts/merge-astro-assets.ts)";

function writeEarlyHintLinks(): void {
  const headersPath = path.join(WORKER_ASSETS, "_headers");
  if (!fs.existsSync(headersPath)) {
    console.error("❌ ไม่พบ `_headers` ใน .open-next/assets — ส่วนหัวของไฟล์ static หายไปทั้งชุด");
    process.exit(1);
  }

  const astroDir = path.join(ASTRO_DIST, "_astro");
  const css = fs.existsSync(astroDir) ? fs.readdirSync(astroDir).filter((f) => f.endsWith(".css")) : [];
  if (css.length === 0) {
    console.error("❌ ไม่พบไฟล์ .css ใน dist/_astro — บิลด์ของ Astro ไม่สมบูรณ์");
    process.exit(1);
  }

  const original = fs.readFileSync(headersPath, "utf-8");
  const base = original.split(EARLY_HINTS_MARKER)[0].trimEnd();

  /** เส้นทางหน้า HTML = บล็อกที่ตั้ง `s-maxage` ไว้ (ดูเหตุผลในคอมเมนต์ด้านบน) */
  const htmlRoutes: string[] = [];
  let current = "";
  for (const line of base.split("\n")) {
    if (/^\/\S*\s*$/.test(line)) current = line.trim();
    else if (current && /^\s+\S/.test(line) && line.includes("s-maxage")) {
      htmlRoutes.push(current);
      current = "";
    }
  }

  if (htmlRoutes.length === 0) {
    console.error("❌ หาเส้นทางหน้า HTML ใน `_headers` ไม่เจอเลยสักเส้น (มองหาบล็อกที่มี `s-maxage`)");
    process.exit(1);
  }

  const links = css.map((f) => `</_astro/${f}>; rel=preload; as=style`).join(", ");
  const generated = [
    "",
    "",
    EARLY_HINTS_MARKER,
    "# แก้ที่สคริปต์เท่านั้น — เขียนทับทุกครั้งที่บิลด์ (ชื่อไฟล์ CSS มีแฮชจึงเขียนมือไม่ได้)",
    `# ไฟล์ที่พรีโหลด: ${css.join(" · ")}`,
    ...htmlRoutes.flatMap((route) => [route, `  Link: ${links}`, ""]),
  ].join("\n");

  fs.writeFileSync(headersPath, `${base}${generated}`);
  console.log(
    `⚡ เติมส่วนหัว Link (Early Hints) ให้ ${htmlRoutes.length} เส้นทาง — พรีโหลด ${css.length} ไฟล์ CSS`,
  );
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

  writeEarlyHintLinks();
}

main();
