import fs from "node:fs";
import path from "node:path";
import { calculateBirthCard, reduceToTarotNumber } from "../../src/lib/tarot/birth-card";
import { ARTICLES } from "../../src/data/articles";
import sitemap from "../../src/app/sitemap";
import { SITE_ORIGIN } from "../../src/lib/config/site";

console.log("\n🧪 กำลังทดสอบระบบ SEO Wave 4: Differentiators (Birth Card, Positions Table, Learn Tarot & Readers)\n");

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ ${message}`);
    failed++;
  }
}

// 1. Numerology Math & Digit Reduction
assert(reduceToTarotNumber(15) === 15, "reduceToTarotNumber(15) ต้องได้ 15");
assert(reduceToTarotNumber(22) === 22, "reduceToTarotNumber(22) ต้องได้ 22");
assert(reduceToTarotNumber(23) === 5, "reduceToTarotNumber(23) ต้องได้ 5 (2+3)");
assert(reduceToTarotNumber(2018) === 11, "reduceToTarotNumber(2018) ต้องได้ 11 (2+0+1+8)");

// 2. Birth Card Calculation Logic
const bc1 = calculateBirthCard(15, 8, 1995);
assert(!!bc1, "คำนวณวันเกิด 15/08/1995 ต้องได้ผลลัพธ์");
if (bc1) {
  assert(bc1.primaryNumber === 11, `15/08/1995 ต้องได้ไพ่หมายเลข 11 (ปัจจุบัน: ${bc1.primaryNumber})`);
  assert(bc1.primaryCard.id === "major-11", `ไพ่หลักต้องเป็น Justice (major-11)`);
  assert(bc1.secondaryNumber === 2, `ไพ่จิตวิญญาณรองต้องเป็นหมายเลข 2`);
  assert(bc1.secondaryCard?.id === "major-02", `ไพ่รองต้องเป็น The High Priestess (major-02)`);
}

// Buddhist Era (พ.ศ.) test
const bcBe = calculateBirthCard(15, 8, 2538, true);
assert(!!bcBe, "คำนวณวันเกิด 15/08/2538 (พ.ศ.) ต้องได้ผลลัพธ์");
if (bcBe) {
  assert(bcBe.yearCe === 1995, "พ.ศ. 2538 ต้องแปลงเป็น ค.ศ. 1995");
  assert(bcBe.primaryCard.id === "major-11", "ผลลัพธ์ พ.ศ. 2538 ต้องตรงกับ ค.ศ. 1995");
}

// Single Digit test (no secondary card)
const bcSingle = calculateBirthCard(1, 1, 2000);
if (bcSingle) {
  assert(bcSingle.primaryNumber === 4, "1/1/2000 (2002 -> 4) ต้องได้เลข 4");
  assert(bcSingle.primaryCard.id === "major-04", "ไพ่หลักต้องเป็น The Emperor");
  assert(bcSingle.secondaryCard === undefined, "เลขหลักเดียวต้องไม่มี secondaryCard");
}

// Rule 14: Zero Fabricated Cards on invalid input
assert(calculateBirthCard(0, 8, 1995) === undefined, "วันที่ 0 ต้องคืน undefined (ห้ามกุไพ่ปลอม)");
assert(calculateBirthCard(32, 8, 1995) === undefined, "วันที่ 32 ต้องคืน undefined (ห้ามกุไพ่ปลอม)");
assert(calculateBirthCard(15, 13, 1995) === undefined, "เดือน 13 ต้องคืน undefined (ห้ามกุไพ่ปลอม)");
assert(calculateBirthCard(15, 8, 1500) === undefined, "ปีนอกช่วงต้องคืน undefined (ห้ามกุไพ่ปลอม)");

// 3. Birth Card Page & Sitemap
const birthCardPagePath = path.join(process.cwd(), "src/app/cards/birth-card/page.tsx");
assert(fs.existsSync(birthCardPagePath), "ต้องมีหน้า src/app/cards/birth-card/page.tsx");

const calcCompPath = path.join(process.cwd(), "src/components/encyclopedia/BirthCardCalculator.tsx");
assert(fs.existsSync(calcCompPath), "ต้องมีคอมโพเนนต์ src/components/encyclopedia/BirthCardCalculator.tsx");

const generatedSitemap = sitemap();
const sitemapUrls = new Set(generatedSitemap.map((e) => e.url));
assert(
  sitemapUrls.has(`${SITE_ORIGIN}/cards/birth-card`),
  `sitemap.ts ต้องมี URL '${SITE_ORIGIN}/cards/birth-card'`,
);

const explorerPath = path.join(process.cwd(), "src/components/encyclopedia/CardsExplorer.tsx");
const explorerContent = fs.readFileSync(explorerPath, "utf-8");
assert(
  explorerContent.includes("/cards/birth-card"),
  "CardsExplorer.tsx ต้องมีลิงก์ภายในไปยัง '/cards/birth-card'",
);

// 4. Spread Positions Semantic Table (Wave 4.1)
const spreadDetailPath = path.join(process.cwd(), "src/app/spreads/[id]/SpreadDetailClient.tsx");
const spreadDetailContent = fs.readFileSync(spreadDetailPath, "utf-8");
assert(
  spreadDetailContent.includes("<table") && spreadDetailContent.includes("คำถามที่ตำแหน่งนี้ตอบ"),
  "SpreadDetailClient.tsx ต้องมี semantic table สำหรับตำแหน่งไพ่",
);

const spreadPagePath = path.join(process.cwd(), "src/app/spreads/[id]/page.tsx");
const spreadPageContent = fs.readFileSync(spreadPagePath, "utf-8");
assert(
  spreadPageContent.includes("ตำแหน่งไพ่"),
  "spreads/[id]/page.tsx ต้องมี keyword ตำแหน่งไพ่ สำหรับ SEO",
);

// 5. Blog & Readers SEO Copy (Wave 4.3 & 4.4)
const beginnerArticle = ARTICLES.find((a) => a.slug === "how-to-read-tarot-for-beginners");
assert(
  beginnerArticle?.seoTitle.includes("เรียนไพ่ยิปซีฟรี") === true,
  "บทความสำหรับผู้เริ่มต้นต้องมี 'เรียนไพ่ยิปซีฟรี' ใน seoTitle",
);
assert(
  beginnerArticle?.keywords.includes("เรียนไพ่ยิปซีฟรี") === true,
  "บทความสำหรับผู้เริ่มต้นต้องมี 'เรียนไพ่ยิปซีฟรี' ใน keywords",
);

const readersPagePath = path.join(process.cwd(), "src/app/readers/page.tsx");
const readersContent = fs.readFileSync(readersPagePath, "utf-8");
assert(
  readersContent.includes("หมอดูไพ่ยิปซี"),
  "readers/page.tsx metadata ต้องมีคำว่า 'หมอดูไพ่ยิปซี'",
);

// 6. Rule 2: Zero Sparkle / Star Emojis in Wave 4 files
const wave4Files = [
  "src/lib/tarot/birth-card.ts",
  "src/components/encyclopedia/BirthCardCalculator.tsx",
  "src/app/cards/birth-card/page.tsx",
];
for (const file of wave4Files) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    const hasForbiddenEmoji = /[✦✨✧⭐🌟]/.test(content);
    assert(!hasForbiddenEmoji, `ไฟล์ ${file} ต้องไม่มีอิโมจิดวงดาว/แฟนซี (กฎข้อ 2)`);
  }
}

console.log(`\n📊 ผลสรุปการทดสอบ: ผ่าน ${passed} ด่าน | ล้มเหลว ${failed} ด่าน\n`);

if (failed > 0) {
  process.exit(1);
}
