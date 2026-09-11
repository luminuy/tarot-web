/**
 * scripts/qa/test-clarify.ts
 * ---------------------------------------------------------------------------
 * 🧪 Test Suite for AI Clarification Question Engine (HANDOFF_AI_ACCURACY_THAI B-04)
 *
 * ทดสอบครอบคลุม:
 * 1. Fast heuristic: คำถามที่มีบริบท/ตัวเลือกชัดเจน ต้องไม่ถามเพิ่ม (needsClarification: false)
 * 2. มี situation ละเอียดแล้ว ต้องไม่ถามเพิ่ม
 * 3. คำถามว่างเปล่า ต้องคืน needsClarification: false
 * 4. กรณีไม่มี API key หรือ API ล้มเหลว ต้อง Graceful Skip (ไม่ throw)
 * 5. ตรวจสอบว่า Prompt แม่แบบไม่มีอิโมจิหรือสัญลักษณ์แฟนซี (Rule 2)
 * 6. คำถามตัวอย่างต้องผ่าน checkThaiQuality() 0 fatal issues
 *
 * รันด้วย: npx tsx scripts/qa/test-clarify.ts
 */

import { evaluateClarification } from "../../src/lib/ai/clarify";
import { checkThaiQuality } from "../../src/lib/ai/thai-quality";
import fs from "node:fs";
import path from "node:path";

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
  console.log("🔮 [QA] AI Clarification Engine Suite (B-04)");
  console.log("══════════════════════════════════════════════════════════════════\n");

  // ─────────────────────────────────────────────────────────────────
  // 1. Fast Heuristic & Clear Questions Guard
  // ─────────────────────────────────────────────────────────────────
  console.log("🔍 1. Fast Heuristic & Clear Questions Guard");

  const clearDetailedQuestion = "ควรย้ายไปทำงานบริษัท A ที่เสนอเงินเดือนสูงกว่า 20% แต่ต้องย้ายจังหวัดไหม หรืออยู่ที่เดิมดีกว่า";
  const clearRes = await evaluateClarification({
    question: clearDetailedQuestion,
    category: "work",
  });
  check(
    "คำถามที่มีตัวเลือกและบริบทชัดเจน ไม่ต้องถามเพิ่ม (needsClarification: false)",
    clearRes.needsClarification === false
  );

  const emptyRes = await evaluateClarification({
    question: "   ",
  });
  check("คำถามว่างเปล่า คืน needsClarification: false", emptyRes.needsClarification === false);

  const existingSituationRes = await evaluateClarification({
    question: "เขาจะกลับมาไหม",
    situation: "เราคบกันมา 3 ปี เลิกรากันได้ประมาณ 2 เดือนแล้วเพราะระยะทางห่างไกล",
  });
  check(
    "มีบริบท situation ละเอียดแล้ว ไม่ต้องถามเพิ่ม",
    existingSituationRes.needsClarification === false
  );

  // ─────────────────────────────────────────────────────────────────
  // 2. Fail-Safe & Graceful Skip Guard
  // ─────────────────────────────────────────────────────────────────
  console.log("\n🛡️ 2. Fail-Safe & Graceful Skip Guard");

  // ใน environment ที่ไม่มีคีย์ หรือเรียกไม่สำเร็จ ต้องคืน needsClarification: false อย่างสุภาพ ไม่ throw
  const shortQuestionRes = await evaluateClarification({
    question: "เขาจะกลับมาไหม",
    category: "love",
  });
  check("กรณีไม่มี API key คืนค่าสุภาพ ไม่โยน Error", typeof shortQuestionRes.needsClarification === "boolean");

  // ─────────────────────────────────────────────────────────────────
  // 3. Prompt & Codebase Discipline (Rule 2: No Fancy Emojis / Stars)
  // ─────────────────────────────────────────────────────────────────
  console.log("\n📐 3. Prompt Discipline & Quality Standards");

  const clarifySrc = fs.readFileSync(path.resolve(process.cwd(), "src/lib/ai/clarify.ts"), "utf-8");
  const forbiddenSymbols = /[✦✨✧★☆💫]/;
  check(
    "clarify.ts ไม่มีสัญลักษณ์ดวงดาวหรืออิโมจิแฟนซี (Rule 2)",
    !forbiddenSymbols.test(clarifySrc.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*/g, ""))
  );

  // ─────────────────────────────────────────────────────────────────
  // 4. Sample Clarification Thai Quality (A-01 / B-04)
  // ─────────────────────────────────────────────────────────────────
  console.log("\n✍️ 4. Sample Clarification Thai Quality");

  const sampleClarifications = [
    "คนในใจคนนี้คือใคร และสถานะระหว่างคุณทั้งคู่ในตอนนี้เป็นอย่างไรบ้างคะ",
    "งานที่คุณกำลังตัดสินใจลาออก มีแผนการรองรับไว้แล้วหรือรู้สึกหมดพลังคะ",
    "ในห้วงเวลานี้ คุณกำลังมีความกังวลใจเรื่องใดเป็นพิเศษเป็นเรื่องหลักคะ",
  ];

  for (const q of sampleClarifications) {
    const res = checkThaiQuality(q);
    check(`คำถามตัวอย่าง "${q.slice(0, 30)}..." ผ่านเกณฑ์ภาษาไทย (0 fatal)`, !res.fatal, res.issues.map((i) => i.code).join(","));
  }

  // ─────────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════════════════════════");
  console.log(`🏁 [สรุปผล] ผ่าน: ${passed} | ไม่ผ่าน: ${failed}`);
  console.log("══════════════════════════════════════════════════════════════════\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
