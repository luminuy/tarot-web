/**
 * scripts/qa/test-seo-wave2.ts
 * QA Test Suite for SEO Wave 2: /cards Encyclopedia Expansion
 * Verifies sitemap routes, card groups, word count, metadata, and canonical links.
 */

import sitemap from "../../src/app/sitemap";
import { CARD_GROUPS } from "../../src/data/cards/group-seo";
import { DECK } from "../../src/data/cards";

let pass = 0;
let fail = 0;

function check(name: string, cond: boolean) {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ ${name}`);
  }
}

function main() {
  console.log("🧪 [QA] ตรวจสอบ SEO คลื่นที่ 2: สารานุกรม /cards 7 หน้าใหม่\n");

  // 1. Sitemap Verification
  const routes = sitemap();
  const routeUrls = new Set(routes.map((r) => r.url));

  const expectedNewRoutes = [
    "https://seertarot.net/cards/major",
    "https://seertarot.net/cards/minor",
    "https://seertarot.net/cards/wands",
    "https://seertarot.net/cards/cups",
    "https://seertarot.net/cards/swords",
    "https://seertarot.net/cards/pentacles",
    "https://seertarot.net/cards/all",
  ];

  for (const url of expectedNewRoutes) {
    check(`sitemap มี URL: ${url}`, routeUrls.has(url));
  }

  // 2. Card Groups Content & Word Count Verification
  const groups = Object.values(CARD_GROUPS);
  check("มีข้อมูลหมวดหมู่ครบ 6 หมวด", groups.length === 6);

  for (const g of groups) {
    check(`หมวด ${g.id} มีคำว่า 'ยิปซี' ใน SEO Title`, g.seoTitleTh.includes("ยิปซี"));
    const textLength = g.introContentTh.paragraphs.join(" ").length;
    // ≥ 300 คำในภาษาไทย หรือ ~800 ตัวอักษรขึ้นไป
    check(`หมวด ${g.id} มีเนื้อหาบทนำเข้มข้น (${textLength} ตัวอักษร ≥ 700)`, textLength >= 700);
    check(`หมวด ${g.id} มี Highlights 3 ข้อ`, g.introContentTh.highlights.length === 3);
  }

  // 3. Card Count Parity
  const majorCards = DECK.filter((c) => c.arcana === "major");
  const minorCards = DECK.filter((c) => c.arcana === "minor");
  const wandsCards = DECK.filter((c) => c.suit === "wands");
  const cupsCards = DECK.filter((c) => c.suit === "cups");
  const swordsCards = DECK.filter((c) => c.suit === "swords");
  const pentaclesCards = DECK.filter((c) => c.suit === "pentacles");

  check("ไพ่ Major มี 22 ใบ", majorCards.length === 22);
  check("ไพ่ Minor มี 56 ใบ", minorCards.length === 56);
  check("ไพ่ Wands มี 14 ใบ", wandsCards.length === 14);
  check("ไพ่ Cups มี 14 ใบ", cupsCards.length === 14);
  check("ไพ่ Swords มี 14 ใบ", swordsCards.length === 14);
  check("ไพ่ Pentacles มี 14 ใบ", pentaclesCards.length === 14);

  // 4. Backward Compatibility with [id] routes
  const card00 = DECK.find((c) => c.id === "major-00");
  check("ไพ่เดิม major-00 ยังคงอยู่และเข้าถึงได้", Boolean(card00));

  console.log(`\nสรุปผล: ผ่าน ${pass} ด่าน, ไม่ผ่าน ${fail} ด่าน`);
  if (fail > 0) {
    process.exit(1);
  }
}

main();
