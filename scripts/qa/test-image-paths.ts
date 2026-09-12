/**
 * QA — ยามเฝ้ากฎการอ้างอิงภาพหน้าไพ่ (Card Image Path Guard)
 *
 * ⚠️ ทำไมต้องมีไฟล์นี้
 * กฎข้อ 9 ในคู่มือและบทเรียน INC-0002 เขียนไว้ชัดว่า
 * "ทุกจุดที่แสดง/อ้างอิงภาพหน้าไพ่ต้องผ่าน <CardImage /> หรือ getCardImageSrc()"
 * แต่กฎที่เป็นแค่ตัวหนังสือก็ยังถูกละเมิดจนได้ — `src/lib/utils/cache.ts`
 * เขียน `/cards/variants/w320/...` เองซึ่งเป็นโฟลเดอร์ที่ไม่มีอยู่จริง
 * ทำให้ยิง 404 ทุกครั้งที่เปิดหน้า และระบบพรีโหลดภาพไม่ทำงานเลย (ISSUE-008)
 *
 * **บทเรียน: กฎที่ไม่มีเครื่องตรวจ คือกฎที่จะถูกละเมิดอีกแน่นอน**
 *
 * ────────────────────────────────────────────────────────────────
 * กฎที่ตรวจ (ตั้งใจให้แคบและแม่น เพื่อไม่ให้มี false positive)
 *
 *  A) ห้ามเขียน path ที่ชี้เข้า "โฟลเดอร์ย่อย" ของ /cards/ เอง
 *     เช่น `/cards/w256/x.webp` หรือ `/cards/variants/w320/x.webp`
 *     เพราะชื่อโฟลเดอร์ขนาดภาพเป็นรายละเอียดภายในที่เปลี่ยนได้
 *     ต้องให้ card-image.ts เป็นคนสร้าง path เท่านั้น
 *     ✅ อนุญาต: `"major-00.jpg"` หรือ `/cards/major-00.jpg` (ชื่อไฟล์ต้นฉบับ ใช้เป็นข้อมูลส่งต่อได้)
 *
 *  B) ห้ามเขียน <img> ที่ src ชี้ไป /cards/ โดยตรง — ต้องใช้ <CardImage /> แทน
 *
 *  D) ห้ามพรีโหลดภาพไพ่ด้วย <link rel="preload" as="image"> เด็ดขาด
 *     <CardImage /> เรนเดอร์เป็น <picture> ที่มี <source type="image/avif"> มาก่อน WebP
 *     (ตั้งแต่ PR #415) เบราว์เซอร์จึงเจรจาชนิดไฟล์เองทุกครั้ง
 *     แต่ <link rel="preload"> ระบุ `type` ได้ชนิดเดียว — พอชนิดไม่ตรงกับที่ <picture> เลือก
 *     ไฟล์ที่พรีโหลดมาจะถูกทิ้งทั้งก้อน แล้วภาพ LCP ตัวจริงก็ไม่ได้พรีโหลดสักนิด
 *     (วัดจริงบน production 2026-09-12: หน้าแรกเสียเปล่า 40.0 KB · /daily 40.0 KB
 *      · /love/1-card 43.4 KB ทุกครั้งที่เปิดหน้า ทั้งที่ยิงด้วย fetchPriority="high")
 *     ✅ วิธีที่ถูก: ใส่ loading="eager" + fetchPriority="high" ที่ <CardImage /> ตัวนั้นเลย
 *        ตัวสแกนพรีโหลดของเบราว์เซอร์อ่าน <picture> ที่เรนเดอร์มากับ HTML อยู่แล้ว
 *        จึงได้ทั้งลำดับความสำคัญสูงสุดและชนิดไฟล์ที่ถูกต้องพร้อมกัน
 *
 * ────────────────────────────────────────────────────────────────
 * 🔒 หลักการ Ratchet (กันถอยหลัง)
 * รายการใน ALLOWLIST คือจุดที่ละเมิดอยู่ "ก่อน" มีด่านตรวจนี้
 * ใส่ไว้เพื่อไม่ให้ CI พังทันทีแล้วไปกั้นการ deploy (บทเรียน INC-0007)
 * แต่การละเมิด **จุดใหม่** จะถูกจับทันที
 * เมื่อแก้จุดใน ALLOWLIST เสร็จ **ต้องลบออกจากรายการทันที** — สคริปต์จะเตือนให้เอง
 *
 * รันด้วย: npx tsx scripts/qa/test-image-paths.ts
 */
import fs from "node:fs";
import path from "node:path";

const SRC = path.join(process.cwd(), "src");

/** ไฟล์ที่เป็น "ตัวจัดการ path" เอง จึงได้รับอนุญาตให้ประกอบ path ได้ */
const INFRASTRUCTURE = ["src/lib/tarot/card-image.ts"];

/**
 * 🚧 หนี้ที่ค้างอยู่ก่อนมีด่านตรวจนี้ — ต้องแก้แล้วลบออกจากรายการ
 * ⚠️ ห้ามเพิ่มรายการใหม่เข้ามาเด็ดขาด
 */
const ALLOWLIST: { file: string; reason: string }[] = [];

/** กฎ A: path ที่ชี้เข้าโฟลเดอร์ย่อยของ /cards/ */
const SUBFOLDER_PATH = /["'`]\/cards\/[A-Za-z0-9_-]+\//;
/** กฎ B: <img> ที่ src ชี้ไป /cards/ โดยตรง */
const RAW_IMG_TAG = /<img[^>]*src\s*=\s*[{"'`][^>]*\/cards\//;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}

const rel = (abs: string) => path.relative(process.cwd(), abs).split(path.sep).join("/");

const violations: { file: string; line: number; rule: string; text: string }[] = [];
const allowlistHits = new Set<string>();

for (const abs of walk(SRC)) {
  const file = rel(abs);
  if (INFRASTRUCTURE.includes(file)) continue;

  const allowed = ALLOWLIST.some((a) => a.file === file);
  const raw = fs.readFileSync(abs, "utf-8");
  const lines = raw.split("\n");

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    // ข้ามคอมเมนต์ — เอกสารอ้างถึง path ได้
    if (trimmed.startsWith("*") || trimmed.startsWith("//")) return;

    let rule = "";
    if (SUBFOLDER_PATH.test(line)) rule = "A: เขียน path เข้าโฟลเดอร์ย่อยของ /cards/ เอง";
    else if (RAW_IMG_TAG.test(line)) rule = "B: ใช้ <img> กับภาพไพ่แทนที่จะใช้ <CardImage />";
    if (!rule) return;

    if (allowed) allowlistHits.add(file);
    else violations.push({ file, line: i + 1, rule, text: trimmed.slice(0, 110) });
  });
}

console.log("\n🖼️  ตรวจกฎการอ้างอิงภาพหน้าไพ่ (ต้องผ่าน CardImage / getCardImageSrc)\n");

for (const entry of ALLOWLIST) {
  if (allowlistHits.has(entry.file)) {
    console.log(`⚠️  ยกเว้นชั่วคราว: ${entry.file}`);
    console.log(`    ${entry.reason}`);
  } else {
    console.log(`🎉 ${entry.file} ไม่มีการละเมิดแล้ว`);
    console.log(`    → ลบรายการนี้ออกจาก ALLOWLIST ใน scripts/qa/test-image-paths.ts ได้เลย`);
  }
}


// D) ห้ามพรีโหลดภาพไพ่ด้วย <link rel="preload" as="image"> (อ่านข้ามบรรทัด — JSX เขียนหลายบรรทัด)
const PRELOAD_LINK_TAG = /<link\b[^>]*?\/>/gs;
/** ตัวชี้วัดว่า <link> ก้อนนี้กำลังพูดถึง "ภาพไพ่" ไม่ใช่โลโก้หรือภาพแชร์ */
const CARD_IMAGE_HINT = /getCardWebpSrcSet|getCardAvifSrcSet|getCardWebpVariantSrc|getCardImageSrc|heroCard|\/cards\//;

for (const abs of walk(SRC)) {
  const file = rel(abs);
  const raw = fs.readFileSync(abs, "utf-8");
  if (!raw.includes("rel=\"preload\"")) continue;

  for (const match of raw.matchAll(PRELOAD_LINK_TAG)) {
    const tag = match[0];
    if (!/rel="preload"/.test(tag)) continue;
    if (!/as="image"/.test(tag)) continue;
    if (!CARD_IMAGE_HINT.test(tag)) continue;

    violations.push({
      file,
      line: raw.slice(0, match.index).split("\n").length,
      rule: 'D: พรีโหลดภาพไพ่ด้วย <link rel="preload" as="image"> (ชนิดไฟล์ไม่มีทางตรงกับที่ <picture> เลือก)',
      text: tag.replace(/\s+/g, " ").slice(0, 110),
    });
  }
}

// C) ตรวจว่าไฟล์ภาพย่อทั้งหมดตาม CARD_IMAGE_VARIANTS มีอยู่จริงบนดิสก์สำหรับไพ่ทั้ง 78 ใบ
import { ALL_CARDS } from "../../src/data/cards";
import { CARD_IMAGE_VARIANTS } from "../../src/lib/tarot/card-image";

for (const card of ALL_CARDS) {
  const match = /([^/]+)\.jpe?g$/i.exec(card.image);
  if (!match) continue;
  const name = match[1];
  for (const variant of CARD_IMAGE_VARIANTS) {
    const filePath = path.join(process.cwd(), "public", "cards", variant.dir, `${name}.webp`);
    if (!fs.existsSync(filePath)) {
      violations.push({
        file: `public/cards/${variant.dir}/${name}.webp`,
        line: 0,
        rule: "C: ไฟล์ภาพย่อ WebP ไม่มีอยู่จริงบนดิสก์",
        text: `ขาดไฟล์ ${filePath}`,
      });
    }
  }
}

if (violations.length === 0) {
  console.log(`\n✅ ไม่พบการละเมิดจุดใหม่ (ยกเว้นชั่วคราว ${allowlistHits.size} ไฟล์)\n`);
  process.exit(0);
}

console.error(`\n❌ พบการละเมิด ${violations.length} จุด — ผิดกฎข้อ 9 และบทเรียน INC-0002\n`);
for (const v of violations) {
  console.error(`   ${v.file}:${v.line}  [กฎ ${v.rule}]`);
  console.error(`      ${v.text}`);
}
console.error(`
   วิธีแก้ (กฎ A · B): ใช้ <CardImage image={...} sizes="..." /> จาก src/components/card/CardImage.tsx
            หรือ getCardImageSrc(image, id) จาก src/lib/tarot/card-image.ts
   วิธีแก้ (กฎ D): ลบ <link rel="preload"> ทิ้ง แล้วใส่ loading="eager" fetchPriority="high"
            ที่ <CardImage /> ใบนั้นแทน — ตัวสแกนพรีโหลดอ่าน <picture> ใน HTML ให้อยู่แล้ว
   เหตุผล: การประกอบ path เองทำให้ (1) resolve ผิดโฟลเดอร์เมื่ออยู่ใน sub-route
           (2) โหลดภาพผิดขนาด และ (3) ชี้ไปโฟลเดอร์ที่ไม่มีอยู่จริงจนยิง 404 (ISSUE-008)
`);
process.exit(1);
