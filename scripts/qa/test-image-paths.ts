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
   วิธีแก้: ใช้ <CardImage image={...} sizes="..." /> จาก src/components/card/CardImage.tsx
            หรือ getCardImageSrc(image, id) จาก src/lib/tarot/card-image.ts
   เหตุผล: การประกอบ path เองทำให้ (1) resolve ผิดโฟลเดอร์เมื่ออยู่ใน sub-route
           (2) โหลดภาพผิดขนาด และ (3) ชี้ไปโฟลเดอร์ที่ไม่มีอยู่จริงจนยิง 404 (ISSUE-008)
`);
process.exit(1);
