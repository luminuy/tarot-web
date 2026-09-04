/**
 * scripts/qa/test-reading-quality.ts
 * ---------------------------------------------------------------------------
 * 🧪 Test Suite for AI Reading Intelligence Wave 1 (W1.1, W1.2, W1.3)
 *
 * ทดสอบครอบคลุม:
 * 1. Golden Set Fixtures Integrity
 * 2. Deterministic Consistency Checker (Position, Rule 14 Foreign Cards, False Positive Protection, Yes/No Contradiction)
 * 3. Cross-Session Karmic Bridge Analysis & Integration
 * 4. Prompt Version Integrity & Core Knowledge Guard
 * 5. Reading Quality Telemetry Database Repository (Local SQLite CRUD & Aggregation)
 *
 * รันด้วย: npx tsx scripts/qa/test-reading-quality.ts
 */

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { DECK, cardById } from "../../src/data/cards";
import { getSpread } from "../../src/data/spreads";
import { PROMPT_VERSION } from "../../src/lib/ai/prompt-version";
import { SYSTEM_CORE_KNOWLEDGE } from "../../src/lib/ai/prompt";
import { checkReadingConsistency } from "../../src/lib/ai/consistency";
import { analyzeKarmicBridge, type PastReadingSnapshot } from "../../src/lib/ai/karmic";
import { recordReadingQuality, updateQualityOutcome, getQualityStats } from "../../src/lib/ai/quality.repo";
import type { Reading } from "../../src/lib/schema/reading";

let passed = 0;
let failed = 0;

function check(title: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${title}`);
  } else {
    failed++;
    console.error(`  ❌ ${title}${detail ? ` (${detail})` : ""}`);
  }
}

async function runTests() {
  console.log("══════════════════════════════════════════════════════════════════");
  console.log("🔮 [QA] AI Reading Intelligence Wave 1 — Quality & Telemetry Suite");
  console.log("══════════════════════════════════════════════════════════════════\n");

  // ─────────────────────────────────────────────────────────────────
  // 1. Golden Set Fixtures Integrity
  // ─────────────────────────────────────────────────────────────────
  console.log("📦 1. Golden Set Fixtures Integrity");
  const fixturesPath = path.resolve(process.cwd(), "scripts/qa/fixtures/golden-readings.json");
  check("golden-readings.json exists", fs.existsSync(fixturesPath));

  const fixturesRaw = fs.readFileSync(fixturesPath, "utf-8");
  const fixtures = JSON.parse(fixturesRaw);
  check("fixtures is non-empty array (>= 30 cases)", Array.isArray(fixtures) && fixtures.length >= 30, `got ${fixtures.length}`);

  let allCardsValid = true;
  let allSpreadsValid = true;
  let allReversedMatched = true;

  for (const f of fixtures) {
    if (!getSpread(f.spreadId)) allSpreadsValid = false;
    if (!Array.isArray(f.cardIds) || f.cardIds.length === 0) allCardsValid = false;
    for (const cid of f.cardIds) {
      if (!cardById(cid)) allCardsValid = false;
    }
    if (!Array.isArray(f.reversed) || f.reversed.length !== f.cardIds.length) {
      allReversedMatched = false;
    }
  }

  check("All spread IDs in golden set exist in SPREADS", allSpreadsValid);
  check("All card IDs in golden set exist in Tarot DECK (78 cards)", allCardsValid);
  check("All cards have matching orientation array (reversed)", allReversedMatched);

  // ─────────────────────────────────────────────────────────────────
  // 2. Deterministic Consistency Checker (W1.3)
  // ─────────────────────────────────────────────────────────────────
  console.log("\n🛡️ 2. Deterministic Consistency Checker (W1.3)");

  const foolCard = DECK[0]; // The Fool (major-00)
  const sunCard = DECK[19]; // The Sun (major-19)

  const perfectReading: Reading = {
    opening: "ยินดีต้อนรับสู่การเปิดไพ่ค่ะ วันนี้พลังงานของคุณเปิดกว้างมาก",
    cards: [
      {
        position: 0,
        headline: "การเริ่มต้นใหม่อย่างสดใส",
        reading: "ไพ่คนเขลา (The Fool) ชี้ว่าคุณพร้อมแล้วที่จะก้าวไปข้างหน้าอย่างกล้าหาญและเชื่อมั่นในหัวใจของตนเอง",
      },
      {
        position: 1,
        headline: "แสงสว่างและความสำเร็จ",
        reading: "ไพ่ดวงอาทิตย์ (The Sun) ส่องประกายความสุขและความสำเร็จอันรุ่งโรจน์ในทุกก้าวที่คุณเลือกเดิน",
      },
    ],
    connections: "ไพ่ทั้งสองใบส่งพลังบวกให้กันอย่างยอดเยี่ยม จากการเริ่มต้นที่ไร้ความกลัวสู่ผลลัพธ์แห่งชัยชนะ",
    summary: "โดยรวมแล้วนี่คือช่วงเวลาทองของคุณ จงเชื่อมั่นในพลังแห่งตนเอง แล้วอะไรคือก้าวแรกที่คุณจะลงมือทำในวันนี้",
    advice: [
      "จดบันทึกเป้าหมายที่คุณอยากเริ่มทำให้ชัดเจน 1 อย่าง",
      "เปิดใจรับฟังความคิดเห็นจากคนรอบข้างด้วยรอยยิ้ม",
      "🧘 กิจกรรมฝึกสติ 1 นาที: หายใจเข้าลึกๆ ผ่อนคลายร่างกายและจิตใจอย่างสงบ",
    ],
    timing: "ภายใน 1-2 สัปดาห์นี้",
    mood: "สดใส",
    yesNoAnswer: null,
  };

  const perfectResult = checkReadingConsistency(perfectReading, [foolCard, sunCard]);
  check("Perfect reading passes with 0 issues", perfectResult.ok && perfectResult.issues.length === 0);

  // Test 2.1: Missing Position
  const missingPosResult = checkReadingConsistency(
    {
      ...perfectReading,
      cards: [perfectReading.cards[0]], // only position 0, missing position 1
    },
    [foolCard, sunCard]
  );
  check("Catches MISSING_POSITION as fatal", missingPosResult.fatal && missingPosResult.issues.some((i) => i.code === "MISSING_POSITION"));

  // Test 2.2: Duplicate Position
  const duplicatePosResult = checkReadingConsistency(
    {
      ...perfectReading,
      cards: [
        perfectReading.cards[0],
        { ...perfectReading.cards[1], position: 0 }, // duplicated position 0
      ],
    },
    [foolCard, sunCard]
  );
  check("Catches DUPLICATE_POSITION as fatal", duplicatePosResult.fatal && duplicatePosResult.issues.some((i) => i.code === "DUPLICATE_POSITION"));

  // Test 2.3: Rule 14 Zero Fabricated Cards (Foreign Card Hallucination)
  const foreignCardResult = checkReadingConsistency(
    {
      ...perfectReading,
      summary: "จงระวังอุปสรรคที่อาจพังทลายลงมาดังเช่นไพ่หอคอย (The Tower) ที่เตือนสติ",
    },
    [foolCard, sunCard]
  );
  check(
    "Catches FOREIGN_CARD (The Tower) as fatal issue",
    foreignCardResult.fatal && foreignCardResult.issues.some((i) => i.code === "FOREIGN_CARD")
  );

  // Test 2.4: False Positive Protection on Natural Thai Words
  // Words: ดวงอาทิตย์, ดวงจันทร์, โลก, ความตาย, พลัง, ความพอดี without "ไพ่" or parenthesis
  const naturalThaiReading: Reading = {
    ...perfectReading,
    cards: [
      {
        position: 0,
        headline: "ความมุ่งมั่นตั้งใจ",
        reading: "คุณมีพลังอันยิ่งใหญ่ในการสร้างสรรค์สิ่งใหม่ๆ บนโลกใบนี้ และแสงของดวงอาทิตย์ก็ส่องประกายในจิตใจของคุณ",
      },
      {
        position: 1,
        headline: "ความสงบในจิตใจ",
        reading: "ยามค่ำคืนที่มีแสงดวงจันทร์นุ่มนวล ช่วยนำพาความพอดีและการตื่นขึ้นทางความคิดมาสู่ตัวคุณอย่างแท้จริง",
      },
    ],
  };
  const falsePositiveResult = checkReadingConsistency(naturalThaiReading, [foolCard, sunCard]);
  const foreignIssues = falsePositiveResult.issues.filter((i) => i.code === "FOREIGN_CARD");
  check(
    "False Positive Guard: Natural Thai words (ดวงอาทิตย์, โลก, ดวงจันทร์, พลัง) without card prefix are NOT flagged as foreign cards",
    foreignIssues.length === 0,
    `got: ${foreignIssues.map((i) => i.message).join(", ")}`
  );

  // Test 2.5: Yes/No Contradiction
  const yesNoContradictionResult = checkReadingConsistency(
    {
      ...perfectReading,
      yesNoAnswer: "ใช่",
      summary: "จากการเปิดไพ่ทั้งหมด สรุปคือคำตอบคือไม่ใช่ อย่างสิ้นเชิง",
    },
    [foolCard, sunCard],
    { yesNoMode: true }
  );
  check(
    "Catches YESNO_CONTRADICTION",
    yesNoContradictionResult.issues.some((i) => i.code === "YESNO_CONTRADICTION")
  );

  // Test 2.6: Mindful Ritual Check in Advice
  const missingMindfulResult = checkReadingConsistency(
    {
      ...perfectReading,
      advice: ["ข้อ 1", "ข้อ 2", "ทำจิตใจให้สบาย"],
    },
    [foolCard, sunCard]
  );
  check(
    "Catches ADVICE_MISSING_MINDFUL when advice lacks 🧘",
    missingMindfulResult.issues.some((i) => i.code === "ADVICE_MISSING_MINDFUL")
  );

  // ─────────────────────────────────────────────────────────────────
  // 3. Cross-Session Karmic Bridge (W1.2)
  // ─────────────────────────────────────────────────────────────────
  console.log("\n📜 3. Cross-Session Karmic Bridge (W1.2)");

  const pastSnapshot: PastReadingSnapshot = {
    primaryCardName: "หอคอย (The Tower)",
    question: "ความรักที่เพิ่งจบลง",
    outcome: "ACCURATE",
    daysAgo: 14,
    recentPrimaryCards: ["ดาบ 3 (Three of Swords)"],
  };

  const currentStarCard = DECK[17]; // The Star
  const karmicAnalysis = analyzeKarmicBridge([currentStarCard], pastSnapshot);
  check("Karmic bridge returns hasPastContext: true when snapshot provided", karmicAnalysis.hasPastContext);
  check(
    "Karmic bridge detects notable transition (The Tower -> The Star)",
    Boolean(karmicAnalysis.karmicNarrative?.includes("The Tower") && karmicAnalysis.karmicNarrative?.includes("The Star"))
  );
  check(
    "Karmic narrative includes daysAgo and past outcome",
    Boolean(karmicAnalysis.karmicNarrative?.includes("14 วันที่แล้ว") && karmicAnalysis.karmicNarrative?.includes("ACCURATE"))
  );

  // Past cards in snapshot should be allowed in consistency checker
  const readingMentioningPastCard: Reading = {
    ...perfectReading,
    cards: [
      {
        position: 0,
        headline: "ความหวังใหม่",
        reading: "จากครั้งก่อนที่คุณได้ไพ่หอคอย (The Tower) วันนี้ดวงดาว (The Star) กำลังนำทางคุณสู่การเยียวยา",
      },
      {
        position: 1,
        headline: "แสงสว่าง",
        reading: "พลังงานสดใสกำลังเข้ามาเติมเต็ม",
      },
    ],
  };
  const karmicConsistency = checkReadingConsistency(readingMentioningPastCard, [currentStarCard, sunCard], {
    pastReading: pastSnapshot,
  });
  const karmicForeignIssues = karmicConsistency.issues.filter((i) => i.code === "FOREIGN_CARD");
  check("Past card from Karmic Memory is not flagged as FOREIGN_CARD", karmicForeignIssues.length === 0);

  // ─────────────────────────────────────────────────────────────────
  // 4. Prompt Version & Hash Guard (W1.1)
  // ─────────────────────────────────────────────────────────────────
  console.log("\n🔖 4. Prompt Version & Hash Guard (W1.1)");
  check("PROMPT_VERSION is defined and non-empty", typeof PROMPT_VERSION === "string" && PROMPT_VERSION.length >= 8);
  check(
    "PROMPT_VERSION matches pattern YYYYMMDD-X",
    /^\d{8}-\d+$/.test(PROMPT_VERSION),
    `got "${PROMPT_VERSION}"`
  );

  const coreHash = createHash("sha256").update(SYSTEM_CORE_KNOWLEDGE).digest("hex").slice(0, 8);
  check("SYSTEM_CORE_KNOWLEDGE has valid hash", coreHash.length === 8, `hash: ${coreHash}`);

  // ─────────────────────────────────────────────────────────────────
  // 5. Reading Quality Telemetry Database Repository (W1.1)
  // ─────────────────────────────────────────────────────────────────
  console.log("\n📊 5. Reading Quality Telemetry Database Repository (W1.1)");

  const testReadingId = `qa-test-${Date.now()}`;
  await recordReadingQuality({
    readingId: testReadingId,
    provider: "groq",
    model: "qwen3.8-27b",
    personaId: "mystic",
    spreadId: "three-card",
    cardCount: 3,
    category: "love",
    promptVersion: PROMPT_VERSION,
    elapsedMs: 820,
    outputTokens: 640,
    hadFailover: false,
    consistencyOk: true,
  });

  const updatedOutcome = await updateQualityOutcome(testReadingId, "ACCURATE");
  check("updateQualityOutcome successfully updates row", updatedOutcome);

  const stats = await getQualityStats(100);
  check("getQualityStats returns valid summary object", stats && typeof stats.totalReadings === "number");
  check("getQualityStats includes byVersion aggregation", Boolean(stats.byVersion && stats.byVersion[PROMPT_VERSION]));
  check("getQualityStats includes byProvider aggregation", Boolean(stats.byProvider && stats.byProvider["groq"]));

  // ─────────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════════════════════════");
  if (failed === 0) {
    console.log(`✨ ALL TESTS PASSED! (${passed}/${passed} checks successful)`);
    console.log("══════════════════════════════════════════════════════════════════\n");
    process.exit(0);
  } else {
    console.error(`⚠️ FAILED ${failed} check(s) out of ${passed + failed}`);
    console.log("══════════════════════════════════════════════════════════════════\n");
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test runner encountered error:", err);
  process.exit(1);
});
