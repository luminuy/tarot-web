/**
 * 🖼️ สร้างภาพไพ่ย่อขนาดหลายระดับในรูปแบบ WebP (Responsive Card Image Variant Generator)
 *
 * ปัญหาที่แก้: ภาพไพ่ 1909 Rider-Waite ต้นฉบับกว้าง ~820px หนักใบละ ~280KB
 * แต่ถูกนำไปแสดงที่ขนาดเล็กมาก (34-112px) ทำให้หน้าเลือกผังโหลดภาพเกิน 4MB โดยไม่จำเป็น
 *
 * วิธีทำงาน: ย่อภาพต้นฉบับใน `public/cards/*.jpg` เป็น WebP 2 ขนาด
 *   - `public/cards/w256/<ชื่อ>.webp` — สำหรับพรีวิวผัง, โลโก้, พัดไพ่ (แสดง <= 85px)
 *   - `public/cards/w512/<ชื่อ>.webp` — สำหรับผังวางไพ่, สารานุกรมไพ่ 78 ใบ (แสดง <= 170px)
 * ส่วนภาพความละเอียดเต็มยังใช้ `.jpg` ต้นฉบับเหมือนเดิม (หน้ารายละเอียดไพ่ / ซูม / Export)
 *
 * ⚠️ ห้ามแก้ไขหรือลบไฟล์ต้นฉบับ `public/cards/*.jpg` เด็ดขาด (กฎเหล็ก 1909 Rider-Waite Only)
 *
 * วิธีใช้: npm run cards:variants
 * ต้องมี `cwebp` (Google WebP encoder) ติดตั้งไว้ — macOS: `brew install webp`
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const SOURCE_DIR = path.join(process.cwd(), "public", "cards");

/** ขนาดที่ต้องสร้าง — ต้องตรงกับ CARD_IMAGE_VARIANTS ใน src/lib/tarot/card-image.ts */
const VARIANTS = [
  { dir: "w256", width: 256, quality: 82 },
  { dir: "w512", width: 512, quality: 82 },
] as const;

function ensureCwebp(): void {
  try {
    execFileSync("cwebp", ["-version"], { stdio: "ignore" });
  } catch {
    console.error("\n❌ ไม่พบคำสั่ง `cwebp` ในเครื่อง");
    console.error("   ติดตั้งก่อนด้วย: brew install webp   (หรือ apt-get install webp)\n");
    process.exit(1);
  }
}

function main(): void {
  ensureCwebp();

  const sources = fs
    .readdirSync(SOURCE_DIR)
    .filter((f) => f.toLowerCase().endsWith(".jpg"))
    .sort();

  if (sources.length === 0) {
    console.error(`❌ ไม่พบไฟล์ .jpg ใน ${SOURCE_DIR}`);
    process.exit(1);
  }

  console.log("\n=======================================================");
  console.log("🖼️  RESPONSIVE CARD IMAGE VARIANT GENERATOR (WebP)");
  console.log("=======================================================");
  console.log(`✦ ภาพต้นฉบับ: ${sources.length} ใบ`);

  let created = 0;
  let skipped = 0;
  let totalBytes = 0;

  for (const variant of VARIANTS) {
    const outDir = path.join(SOURCE_DIR, variant.dir);
    fs.mkdirSync(outDir, { recursive: true });

    for (const file of sources) {
      const inPath = path.join(SOURCE_DIR, file);
      const outPath = path.join(outDir, file.replace(/\.jpg$/i, ".webp"));

      // ข้ามถ้าไฟล์ย่อใหม่กว่าต้นฉบับอยู่แล้ว (idempotent — รันซ้ำได้ไม่เปลืองเวลา)
      if (
        fs.existsSync(outPath) &&
        fs.statSync(outPath).mtimeMs >= fs.statSync(inPath).mtimeMs
      ) {
        skipped++;
        totalBytes += fs.statSync(outPath).size;
        continue;
      }

      execFileSync("cwebp", [
        "-quiet",
        "-q", String(variant.quality),
        "-m", "6",          // ใช้เวลาบีบอัดนานขึ้นเพื่อไฟล์เล็กที่สุด
        "-sharp_yuv",       // ลดการเพี้ยนของสีตามขอบเส้น ทำให้ลายเส้นไพ่คมกว่าเดิม
        "-resize", String(variant.width), "0",
        inPath,
        "-o", outPath,
      ]);

      created++;
      totalBytes += fs.statSync(outPath).size;
    }

    console.log(`✅ ${variant.dir.padEnd(5)} (กว้าง ${variant.width}px, q${variant.quality}) — เสร็จสมบูรณ์`);
  }

  const originalBytes = sources.reduce(
    (sum, f) => sum + fs.statSync(path.join(SOURCE_DIR, f)).size,
    0,
  );

  console.log("-------------------------------------------------------");
  console.log(`✦ สร้างใหม่: ${created} ไฟล์ | ข้าม (ของเดิมใหม่กว่า): ${skipped} ไฟล์`);
  console.log(`✦ ขนาดรวมภาพย่อทั้งหมด: ${(totalBytes / 1048576).toFixed(2)} MB`);
  console.log(`✦ เทียบภาพต้นฉบับ: ${(originalBytes / 1048576).toFixed(2)} MB`);
  console.log("=======================================================\n");
}

main();
