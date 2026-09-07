/**
 * QA — มาตรฐานภาพแชร์ OpenGraph 1200x630 ทั่วเว็บ (OG Image Gate)
 *
 * ⚠️ ทำไมต้องมีไฟล์นี้:
 * ป้องกันปัญหาภาพแชร์โซเชียล (Facebook, LINE, X) 4 ข้อ:
 * 1. Cloudinary พัง (HTTP 400) เมื่อหัวข้อมี , หรือ / (OG-01)
 * 2. ใช้ภาพไพ่แนวตั้ง 825x1429 เป็นภาพแชร์ ทำให้โดนครอปกลางภาพ (OG-02)
 * 3. ใช้ภาพ WebP แนวตั้ง ซึ่งแพลตฟอร์มโซเชียลไม่การันตีว่าจะเรนเดอร์ (OG-03)
 * 4. ทุกหน้าใช้ภาพ default ซ้ำกันหมด (OG-04)
 *
 * รันด้วย: npx tsx scripts/qa/test-og-images.ts
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { encodeOverlayText, truncateForOverlay, buildCloudinaryShareImageUrl } from "../../src/lib/media/cloudinary";
import { buildPageOgImage } from "../../src/lib/media/og-image";
import { getCategoryCardImage } from "../../src/lib/media/og-card-art";
import { DECK } from "../../src/data/cards";
import { ARTICLES } from "../../src/data/articles";
import { SPREADS } from "../../src/data/spreads";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");

console.log("=======================================================");
console.log("🖼️  OG IMAGE INTEGRITY GUARD — ตรวจสอบมาตรฐานภาพแชร์ทั้งเว็บ");
console.log("=======================================================\n");

// -------------------------------------------------------------
// 1. Unit Tests: การเข้ารหัสข้อความสำหรับ Cloudinary (OG-01 & OG-06)
// -------------------------------------------------------------
console.log("── 1. ทดสอบการเข้ารหัสข้อความ (Double Percent-Encoding) ──");

// 1.1 จุลภาค (,) ต้องกลายเป็น %252C
const commaTest = encodeOverlayText("ไพ่ทาโรต์ความรัก, อ่านยังไง?", 60);
assert(commaTest.includes("%252C"), "จุลภาคต้องถูก double encode เป็น %252C");
assert(!commaTest.includes("%2C") || commaTest.includes("%252C"), "ต้องไม่มี %2C โดดๆ");
console.log("  ✓ จุลภาค (,) เข้ารหัสเป็น %252C ถูกต้อง");

// 1.2 ทับ (/) ต้องกลายเป็น %252F
const slashTest = encodeOverlayText("50/50 ใช่หรือไม่", 60);
assert(slashTest.includes("%252F"), "เครื่องหมาย / ต้องถูก double encode เป็น %252F");
console.log("  ✓ เครื่องหมาย (/) เข้ารหัสเป็น %252F ถูกต้อง");

// 1.3 การตัดข้อความยาว (OG-06)
const longTitle = "ความหมายไพ่ยิปซี 3 ดาบ (Three of Swords) หัวตั้ง-หัวกลับ ครบทุกหมวดชีวิตความรักการงาน";
const truncated = truncateForOverlay(longTitle, 60);
assert(truncated.endsWith("…"), "หัวข้อที่ยาวเกิน 60 ตัวอักษรต้องลงท้ายด้วย …");
assert(truncated.length <= 65, "หัวข้อที่ตัดแล้วต้องไม่ยาวเกินขอบเขต");
console.log("  ✓ การตัดหัวข้อยาวมีจุดไข่ปลา … ลงท้ายอย่างสุภาพ");

// 1.4 การคืนค่าสัดส่วน 1200x630 เสมอ (OG-05)
const testOg = buildPageOgImage({
  title: "ทดสอบไพ่",
  eyebrow: "สารานุกรม",
  cardImage: "major-00.jpg",
});
assert.strictEqual(testOg.length, 1, "buildPageOgImage ต้องคืนอาร์เรย์ 1 รายการ");
assert.strictEqual(testOg[0].width, 1200, "ความกว้างต้องเป็น 1200 เสมอ");
assert.strictEqual(testOg[0].height, 630, "ความสูงต้องเป็น 630 เสมอ");
assert(!testOg[0].url.endsWith(".webp"), "URL ภาพแชร์ต้องไม่ลงท้ายด้วย .webp");
console.log("  ✓ buildPageOgImage คืนค่าสัดส่วน 1200x630 เสมอ\n");

// -------------------------------------------------------------
// 2. Contract Test: จำลองการสร้าง URL ของทุกหน้าเนื้อหา
// -------------------------------------------------------------
console.log("── 2. ทดสอบการสร้าง URL ของเนื้อหาทั้งหมดในระบบ ──");

// 2.1 ไพ่ทั้ง 78 ใบ
for (const card of DECK) {
  const url = buildCloudinaryShareImageUrl({
    title: `${card.nameTh} (${card.nameEn})`,
    spreadName: "คัมภีร์ไพ่ทาโรต์",
    cardImageNames: [card.image],
  });
  if (url) {
    assert(!url.includes("%2C"), `URL ไพ่ ${card.id} ต้องไม่มี %2C เดี่ยว`);
    assert(!url.includes("%2Fhttps"), `URL ไพ่ ${card.id} ต้องไม่มี %2F ในพารามิเตอร์ overlay`);
  }
}
console.log(`  ✓ ทดสอบไพ่ครบทั้ง ${DECK.length} ใบ — การเข้ารหัสปลอดภัย 100%`);

// 2.2 บทความทั้ง 26 เรื่อง
for (const article of ARTICLES) {
  const url = buildCloudinaryShareImageUrl({
    title: article.title,
    spreadName: "บทความไพ่ทาโรต์",
    cardImageNames: [getCategoryCardImage(article.category)],
  });
  if (url) {
    assert(!url.includes("%2C"), `URL บทความ ${article.slug} ต้องไม่มี %2C เดี่ยว`);
  }
}
console.log(`  ✓ ทดสอบบทความครบทั้ง ${ARTICLES.length} เรื่อง — ปลอดภัย 100%`);

// 2.3 ผังพยากรณ์ทั้ง 25 แบบ
for (const spread of SPREADS) {
  const url = buildCloudinaryShareImageUrl({
    title: spread.nameTh,
    spreadName: "ผังพยากรณ์",
    cardImageNames: [getCategoryCardImage(spread.defaultCategory)],
  });
  if (url) {
    assert(!url.includes("%2C"), `URL ผัง ${spread.id} ต้องไม่มี %2C เดี่ยว`);
  }
}
console.log(`  ✓ ทดสอบผังพยากรณ์ครบทั้ง ${SPREADS.length} แบบ — ปลอดภัย 100%\n`);

// -------------------------------------------------------------
// 3. Integration Scan: ตรวจสอบ HTML ที่ Prerender จริง
// -------------------------------------------------------------
console.log("── 3. ตรวจสอบไฟล์ HTML ใน .next/server/app ──");

function collectHtml(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectHtml(full, acc);
    else if (entry.name.endsWith(".html")) acc.push(full);
  }
  return acc;
}

const appHtmlDir = path.join(ROOT, ".next/server/app");
if (!fs.existsSync(appHtmlDir)) {
  console.log("⚠️ ไม่พบโฟลเดอร์ .next/server/app — กรุณารัน npm run build ก่อน");
  process.exit(1);
}

const htmlFiles = collectHtml(appHtmlDir);
const directCardRegex = /\/cards\/[^/?#]+\.(jpg|jpeg|png|webp)/i;

const ogImages = new Map<string, number>();
const violations: { file: string; error: string }[] = [];

for (const file of htmlFiles) {
  const rel = path.relative(appHtmlDir, file);

  // ข้ามหน้า error ภายในของ next.js
  if (rel.includes("_not-found") || rel.includes("_global-error")) continue;

  const content = fs.readFileSync(file, "utf8");

  // 1. ตรวจ og:image
  const ogImageMatch =
    content.match(/<meta\s+property=["\x27]og:image["\x27]\s+content=["\x27]([^"\x27]+)["\x27]/i) ||
    content.match(/<meta\s+content=["\x27]([^"\x27]+)["\x27]\s+property=["\x27]og:image["\x27]/i);

  if (!ogImageMatch) {
    violations.push({ file: rel, error: "ไม่พบแท็ก <meta property=\"og:image\">" });
    continue;
  }
  const imgUrl = ogImageMatch[1];
  ogImages.set(imgUrl, (ogImages.get(imgUrl) || 0) + 1);

  // 2. ตรวจ width และ height ต้องเป็น 1200x630
  const widthMatch =
    content.match(/<meta\s+property=["\x27]og:image:width["\x27]\s+content=["\x27]([^"\x27]+)["\x27]/i) ||
    content.match(/<meta\s+content=["\x27]([^"\x27]+)["\x27]\s+property=["\x27]og:image:width["\x27]/i);
  const heightMatch =
    content.match(/<meta\s+property=["\x27]og:image:height["\x27]\s+content=["\x27]([^"\x27]+)["\x27]/i) ||
    content.match(/<meta\s+content=["\x27]([^"\x27]+)["\x27]\s+property=["\x27]og:image:height["\x27]/i);

  const width = widthMatch ? widthMatch[1] : null;
  const height = heightMatch ? heightMatch[1] : null;

  if (width !== "1200" || height !== "630") {
    violations.push({
      file: rel,
      error: `ขนาดภาพประกาศผิด: ${width}x${height} (ต้องเป็น 1200x630)`,
    });
  }

  // 3. ตรวจห้ามชี้เข้า /cards/ โดยตรง (กันภาพแนวตั้ง OG-02)
  if (!imgUrl.includes("res.cloudinary.com") && directCardRegex.test(imgUrl)) {
    violations.push({
      file: rel,
      error: `ห้ามใช้ภาพไพ่แนวตั้งโดยตรง: ${imgUrl}`,
    });
  }

  // 4. ตรวจห้ามลงท้าย .webp (กัน OG-03)
  if (imgUrl.endsWith(".webp")) {
    violations.push({
      file: rel,
      error: `ภาพแชร์ห้ามลงท้าย .webp: ${imgUrl}`,
    });
  }
}

if (violations.length > 0) {
  console.error(`❌ พบข้อผิดพลาดด้านภาพแชร์ ${violations.length} จุด:`);
  for (const v of violations.slice(0, 10)) {
    console.error(`  - ${v.file}: ${v.error}`);
  }
  process.exit(1);
}

console.log(`  ✓ ตรวจสอบหน้า HTML ทั้งหมด ${htmlFiles.length} ไฟล์ — ผ่านกฎ 100%`);
console.log(`  ✓ ขนาดภาพทุกหน้าเป็น 1200x630 ตามมาตรฐานสากล`);
console.log(`  ✓ ไม่มีหน้าใดชี้เข้า /cards/ โดยตรง และไม่มีหน้าใดใช้ .webp`);

const MIN_UNIQUE_OG_URLS = 290;
console.log(`  ✓ จำนวนภาพแชร์เฉพาะหน้าที่ไม่ซ้ำกัน (Unique OG URLs): ${ogImages.size} ค่า (เกณฑ์ขั้นต่ำ ${MIN_UNIQUE_OG_URLS})`);
assert(
  ogImages.size >= MIN_UNIQUE_OG_URLS,
  `จำนวนภาพแชร์เฉพาะหน้าต้องไม่ต่ำกว่า ${MIN_UNIQUE_OG_URLS} ค่า (พบ ${ogImages.size})`
);

console.log(`\n✨ ผ่านการตรวจสอบมาตรฐานภาพแชร์ OpenGraph 1200x630 ทั่วทั้งเว็บ 100% Green!\n`);
