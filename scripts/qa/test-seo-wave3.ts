import fs from "node:fs";
import path from "node:path";
import { SPREADS } from "../../src/data/spreads";
import { STANDARD_SPREAD_IDS, isStandardSpread } from "../../src/lib/entitlement/limits";
import { SPREAD_TOPICS, getAllTopicSlugs, getSpreadsForTopic } from "../../src/data/spread-topics";

console.log("\n🧪 กำลังทดสอบระบบ SEO Wave 3: Spreads Expansion & Topic Hubs (25 ผัง)\n");

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

// 1. Spreads Count & Integrity
assert(SPREADS.length === 25, `ผังพยากรณ์ต้องมีครบ 25 แบบ (ปัจจุบัน: ${SPREADS.length})`);

const expectedNewSpreads = ["love-six", "monthly-ten", "family", "luck", "study"];
for (const id of expectedNewSpreads) {
  const spread = SPREADS.find((s) => s.id === id);
  assert(!!spread, `ผังใหม่ '${id}' ต้องมีอยู่ใน SPREADS`);
  if (spread) {
    assert(spread.positions.length > 0, `ผัง '${id}' ต้องมีตำแหน่งไพ่ครบถ้วน (${spread.positions.length} ใบ)`);
    assert(
      spread.positions.every((p) => p.meaning && p.nameTh && p.x !== undefined && p.y !== undefined),
      `ตำแหน่งทุกใบของผัง '${id}' ต้องมีพิกัด x, y, nameTh และ meaning`,
    );
  }
}

// 2. Entitlement Gating Check
const freeSpreads = ["family", "luck", "study"];
for (const id of freeSpreads) {
  const spread = SPREADS.find((s) => s.id === id);
  assert(spread?.credits === 0, `ผังฟรี '${id}' ต้องมี credits === 0`);
  assert(spread?.guestAllowed === true, `ผังฟรี '${id}' ต้องมี guestAllowed === true`);
  assert(isStandardSpread(id), `ผัง '${id}' ต้องอยู่ใน STANDARD_SPREAD_IDS`);
}

const lockedSpreads = ["love-six", "monthly-ten"];
for (const id of lockedSpreads) {
  const spread = SPREADS.find((s) => s.id === id);
  assert((spread?.credits ?? 0) > 0, `ผังล็อก '${id}' ต้องใช้ credits > 0`);
  assert(spread?.guestAllowed === false, `ผังล็อก '${id}' ต้องไม่ให้ guest ใช้`);
  assert(!isStandardSpread(id), `ผัง '${id}' ต้องไม่อยู่ใน STANDARD_SPREAD_IDS`);
}

assert(STANDARD_SPREAD_IDS.size === 10, `STANDARD_SPREAD_IDS ต้องมี 10 ผัง (ปัจจุบัน: ${STANDARD_SPREAD_IDS.size})`);

// 3. Spreads Artworks Check
const artIconsPath = path.join(process.cwd(), "src/components/ui/TarotArtIcons.tsx");
const artContent = fs.readFileSync(artIconsPath, "utf-8");
for (const artName of [
  "LoveSixSpreadArt",
  "MonthlyTenSpreadArt",
  "FamilySpreadArt",
  "LuckSpreadArt",
  "StudySpreadArt",
]) {
  assert(artContent.includes(`export const ${artName}`), `TarotArtIcons.tsx ต้องส่งออกคอมโพเนนต์ '${artName}'`);
}

// 4. Topic Spreads Hubs (Wave 3.3)
const topicSlugs = getAllTopicSlugs();
assert(topicSlugs.length === 6, `ต้องมีหมวดหมู่ Topic Spreads ครบ 6 หมวด (ปัจจุบัน: ${topicSlugs.length})`);

const expectedTopics = ["love", "career", "money", "health", "family", "study"];
for (const topicKey of expectedTopics) {
  const topic = SPREAD_TOPICS[topicKey];
  assert(!!topic, `ต้องมีข้อมูล topic '${topicKey}' ใน SPREAD_TOPICS`);
  if (topic) {
    const topicSpreads = getSpreadsForTopic(topic);
    assert(topicSpreads.length > 0, `หมวด '${topicKey}' ต้องมีผังพยากรณ์อย่างน้อย 1 ผัง (มี: ${topicSpreads.length})`);
    assert(topic.faqs.length >= 2, `หมวด '${topicKey}' ต้องมีคำถาม FAQ อย่างน้อย 2 ข้อ`);
    assert(topic.editorialIntro.length >= 2, `หมวด '${topicKey}' ต้องมีบทความ editorialIntro อย่างน้อย 2 ย่อหน้า`);
  }
}

// 5. Check Page Files Exist
const topicPagePath = path.join(process.cwd(), "src/app/spreads/topic/[category]/page.tsx");
assert(fs.existsSync(topicPagePath), `ต้องมีหน้า src/app/spreads/topic/[category]/page.tsx`);
const topicListCompPath = path.join(process.cwd(), "src/components/spread/TopicSpreadList.tsx");
assert(fs.existsSync(topicListCompPath), `ต้องมีคอมโพเนนต์ src/components/spread/TopicSpreadList.tsx`);

// 6. Check Sitemap Contains All 6 Topic URLs
import sitemap from "../../src/app/sitemap";
import { SITE_ORIGIN } from "../../src/lib/config/site";

const generatedSitemap = sitemap();
const sitemapUrls = new Set(generatedSitemap.map((entry) => entry.url));

for (const topicKey of expectedTopics) {
  const expectedUrl = `${SITE_ORIGIN}/spreads/topic/${topicKey}`;
  assert(
    sitemapUrls.has(expectedUrl),
    `sitemap.ts ต้องสร้าง URL '${expectedUrl}'`,
  );
}

// 7. Check 20 -> 25 Spreads Zero Remaining in src/
const srcDir = path.join(process.cwd(), "src");
function scanFor20Spreads(dir: string): string[] {
  let matches: string[] = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      matches = matches.concat(scanFor20Spreads(fullPath));
    } else if (file.name.endsWith(".ts") || file.name.endsWith(".tsx")) {
      const content = fs.readFileSync(fullPath, "utf-8");
      if (/20 (ผัง|แบบ|spreads|รูปแบบ)/i.test(content)) {
        matches.push(fullPath);
      }
    }
  }
  return matches;
}

const remainingMatches = scanFor20Spreads(srcDir);
assert(
  remainingMatches.length === 0,
  `ต้องไม่มีคำว่า "20 ผัง / 20 Spreads / 20 แบบ" หลงเหลือใน src/ (พบใน: ${remainingMatches.join(", ")})`,
);

// 8. Rule 2: Zero Sparkle / Star Emojis in New Files
const newFiles = [
  "src/data/spread-topics.ts",
  "src/app/spreads/topic/[category]/page.tsx",
  "src/components/spread/TopicSpreadList.tsx",
];
for (const file of newFiles) {
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
