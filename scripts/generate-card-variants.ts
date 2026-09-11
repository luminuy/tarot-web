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
 *
 * ─────────────────────────────────────────────────────────────────────────
 * 📏 อย่าเสียเวลาไล่บีบให้เล็กกว่านี้ — วัดมาแล้ว (2026-09-11)
 * ─────────────────────────────────────────────────────────────────────────
 * เคยมีคนอ่านคอมเมนต์เก่าที่เขียนว่า "w256 ~10KB" แล้วคิดว่าไฟล์บวมเกินจริง 3 เท่า
 * เพราะ remaster pass — **ไม่จริง** ตัวเลขเก่าเป็นเป้าที่ตั้งไว้ลอย ๆ ไม่เคยวัดจริง
 *
 * ทดลองกับ `major-03.jpg` (860×1455) เทียบทุกทาง:
 *   - ย่อ Lanczos เปล่า ๆ ไม่แต่งอะไรเลย q70 → w512 = 94.8KB (ของที่ส่งอยู่ 101KB)
 *     แปลว่า remaster ทำให้บวมแค่ ~6% ไม่ใช่ 3 เท่า
 *   - ลด q75 → q60 ประหยัดได้แค่ 14% (48.2KB → 41.4KB) เส้นโค้งแบนมาก
 *   - `-preset drawing` / `picture` / `-f` / `-sns` ต่างกันไม่ถึง 1%
 *   - สลับลำดับเป็น "ย่อก่อนค่อย sharpen" ก็ไม่ได้เล็กลง (บางขนาดใหญ่ขึ้นด้วยซ้ำ)
 *   - AVIF ผ่าน ImageKit ลดได้ 7–17% แลกกับต้องดูแลอีกฟอร์แมตทั้งชุด
 *
 * สรุป: ภาพสแกนลายเส้น 1909 มี entropy สูงโดยธรรมชาติ ของที่ส่งอยู่ตอนนี้
 * **อยู่ใกล้เพดานที่บีบได้แล้ว** จะเล็กลงกว่านี้อย่างมีนัยต้องยอมให้ภาพแตกจริง
 * ซึ่งขัดกฎเหล็ก 1909 Rider-Waite Only — ทางที่ได้ผลกว่าคือ **เลือกขนาดให้ถูก**
 * (ดู `CARD_IMAGE_VARIANTS` + `sizes` ที่หน้าเรียกใช้) ไม่ใช่บีบให้หนักขึ้น
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const SOURCE_DIR = path.join(process.cwd(), "public", "cards");
const REMASTER_CACHE_DIR = path.join(process.cwd(), "scratch", "remaster_temp");

/** ขนาดที่ต้องสร้าง — ต้องตรงกับ CARD_IMAGE_VARIANTS ใน src/lib/tarot/card-image.ts */
const VARIANTS = [
  // w64 — ภาพพรีวิวผังขนาดจิ๋ว (18-32px) เช่น เซลติกครอส, ผัง 12 เดือน, ผังจักระ, ไอคอน Footer
  // วัดจริง ~2KB/ใบ ช่วยลด LCP และ Payload หน้าแรกบนมือถือลงมาก
  { dir: "w64", width: 64, quality: 72, useRemaster: true },
  // w128 — ขนาดสำหรับพรีวิวการ์ด 36-68px · วัดจริง ~7KB/ใบ
  { dir: "w128", width: 128, quality: 75, useRemaster: true },
  // w256 — สำหรับการ์ดขนาดกลาง 80-128px · วัดจริง ~35KB/ใบ
  { dir: "w256", width: 256, quality: 78, useRemaster: true },
  // w320 — ขั้นกลางที่ขาดหายไประหว่าง 256 กับ 512 · วัดจริง ~35KB/ใบ
  // กริดไพ่ใน /cards แสดงที่ 130–151 CSS px → จอ DPR 2 ต้องการ 261–301 px
  // ถ้าไม่มีขั้นนี้ เบราว์เซอร์ต้องกระโดดไป w512b (101KB) ทั้งที่ใช้จริงไม่ถึงครึ่ง
  // ข้าม unsharp mask เหมือน w512b เพราะความถี่สูงที่เพิ่มเข้ามาทำให้ไฟล์บวมโดยไม่คมขึ้นจริง
  { dir: "w320", width: 320, quality: 75, useRemaster: false },
  // w512b — สำหรับผังวางไพ่, สารานุกรมไพ่ 78 ใบ · วัดจริง ~91KB/ใบ ข้าม unsharp mask เพื่อไม่เพิ่มความถี่สูง
  { dir: "w512b", width: 512, quality: 78, useRemaster: false },
  // w768b — ภาพใบใหญ่บนจอ 2x–3x (ผังวางไพ่, พรีวิว, สารานุกรม) ให้คมชัดไม่เบลอ · วัดจริง ~138KB/ใบ ข้าม unsharp mask
  { dir: "w768b", width: 768, quality: 72, useRemaster: false },
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

function runRemasterPass(): boolean {
  const remasterScript = path.join(process.cwd(), "scripts", "remaster-cards.py");
  if (fs.existsSync(remasterScript)) {
    try {
      execFileSync("python3", [remasterScript, SOURCE_DIR, REMASTER_CACHE_DIR], {
        stdio: "inherit",
      });
      return true;
    } catch (e) {
      console.warn("⚠️ Python remaster pass skipped, falling back to direct source images.");
    }
  }
  return false;
}

function main(): void {
  ensureCwebp();
  const hasRemaster = runRemasterPass();

  const sources = fs
    .readdirSync(SOURCE_DIR)
    .filter((f) => f.toLowerCase().endsWith(".jpg"))
    .sort();

  if (sources.length === 0) {
    console.error(`❌ ไม่พบไฟล์ .jpg ใน ${SOURCE_DIR}`);
    process.exit(1);
  }

  console.log("\n=======================================================");
  console.log("🖼️  RESPONSIVE CARD IMAGE VARIANT GENERATOR (Ultra-HD WebP)");
  console.log("=======================================================");
  console.log(`✦ ภาพต้นฉบับ: ${sources.length} ใบ | Remaster Pass: ${hasRemaster ? "Active (Pillow Unsharp + Color)" : "Standard"}`);

  let created = 0;
  let skipped = 0;
  let totalBytes = 0;

  for (const variant of VARIANTS) {
    const outDir = path.join(SOURCE_DIR, variant.dir);
    fs.mkdirSync(outDir, { recursive: true });

    for (const file of sources) {
      const rawInPath = path.join(SOURCE_DIR, file);
      const remasteredInPath = path.join(REMASTER_CACHE_DIR, file);
      const inPath =
        variant.useRemaster && hasRemaster && fs.existsSync(remasteredInPath)
          ? remasteredInPath
          : rawInPath;
      const outPath = path.join(outDir, file.replace(/\.jpg$/i, ".webp"));

      // ข้ามถ้าไฟล์ย่อใหม่กว่าต้นฉบับอยู่แล้ว (idempotent — รันซ้ำได้ไม่เปลืองเวลา) เว้นแต่สั่ง --force
      const forceRebuild = process.argv.includes("--force");
      if (
        !forceRebuild &&
        fs.existsSync(outPath) &&
        fs.statSync(outPath).mtimeMs >= fs.statSync(rawInPath).mtimeMs &&
        (!variant.useRemaster || !hasRemaster || fs.statSync(outPath).mtimeMs >= fs.statSync(remasteredInPath).mtimeMs)
      ) {
        skipped++;
        totalBytes += fs.statSync(outPath).size;
        continue;
      }

      execFileSync("cwebp", [
        "-quiet",
        "-q", String(variant.quality),
        "-m", "6",          // ใช้เวลาบีบอัดนานขึ้นเพื่อไฟล์เล็กที่สุดและคุณภาพสูงสุด
        "-sharp_yuv",       // ลดการเพี้ยนของสีตามขอบเส้น ทำให้ลายเส้นไพ่คมกริบ
        "-resize", String(variant.width), "0",
        inPath,
        "-o", outPath,
      ]);

      const webpSize = fs.statSync(outPath).size;
      const rawJpgSize = fs.statSync(rawInPath).size;
      if (webpSize > rawJpgSize) {
        throw new Error(
          `❌ WebP variant (${outPath}: ${webpSize}B) is LARGER than original JPEG (${rawInPath}: ${rawJpgSize}B)!`,
        );
      }

      created++;
      totalBytes += webpSize;
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
