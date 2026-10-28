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
  // 2.5 Claude เป็นตัวหลัก ยิงคู่กับ Groq (เจ้าของสั่ง 2026-10-28 "ใช้ claude เป็นแกนหลัก")
  // ─────────────────────────────────────────────────────────────────
  console.log("\n🟠 2.5 Claude Haiku ก่อน · Groq ยิงคู่ไว้รับแทน");
  {
    const realFetch = globalThis.fetch;
    const prevA = process.env.ANTHROPIC_API_KEY;
    const prevG = process.env.GROQ_API_KEY;
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    process.env.GROQ_API_KEY = "gsk-test";
    const claudeQ = "เรื่องนี้คุณอยากรู้ว่าเขาคิดยังไง หรืออยากรู้ว่าควรทำยังไงต่อ";
    const groqQ = "ช่วยเล่าเพิ่มอีกนิดได้ไหมว่าตอนนี้ความสัมพันธ์เป็นแบบไหน";
    const calls: string[] = [];
    let claudeBody: { model?: string; thinking?: { type?: string } } = {};
    const mock = (claudeOk: boolean) =>
      (async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes("anthropic")) {
          calls.push("claude");
          claudeBody = JSON.parse(String(init?.body ?? "{}"));
          if (!claudeOk) return new Response("overloaded", { status: 529 });
          return new Response(
            JSON.stringify({ stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify({ needsClarification: true, question: claudeQ, reason: "ok" }) }] }),
            { status: 200 },
          );
        }
        calls.push("groq");
        return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ needsClarification: true, question: groqQ }) } }] }), { status: 200 });
      }) as typeof fetch;

    globalThis.fetch = mock(true);
    const viaClaude = await evaluateClarification({ question: "เขาจะกลับมาไหม", category: "love" });
    check(
      "มีคีย์ Claude ➔ ใช้คำถามจาก Claude Haiku (ปิดโหมดคิด) · ยิง Groq คู่กันไว้แล้ว",
      viaClaude.needsClarification === true && viaClaude.question === claudeQ && calls.includes("groq") && claudeBody.model === "claude-haiku-5-5" && claudeBody.thinking?.type === "disabled",
      JSON.stringify(viaClaude),
    );

    calls.length = 0;
    globalThis.fetch = mock(false);
    const viaGroq = await evaluateClarification({ question: "เขาจะกลับมาไหม", category: "love" });
    check("Claude ล้ม ➔ ใช้คำตอบ Groq ที่ยิงไปพร้อมกัน (ไม่ข้ามการถามกลับ)", viaGroq.needsClarification === true && viaGroq.question === groqQ, JSON.stringify(viaGroq));

    globalThis.fetch = realFetch;
    if (prevA === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = prevA;
    if (prevG === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = prevG;
  }

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
  // A3-04: คำถามกลับจาก AI ต้องผ่านตัวกวาดกลาง — regex เขียนเองเคยตัดอิโมจิแค่ครึ่งตัวจนจอขึ้นอักขระพัง
  check(
    "A3-04: คำถามกลับผ่าน stripEmoji() ก่อนถึงจอ (ไม่ใช้ character class เขียนเอง)",
    /finalQuestion = stripEmoji\(finalQuestion\)/.test(clarifySrc) && !/\\uD83D/.test(clarifySrc),
  );
  {
    const { stripEmoji } = await import("../../src/lib/text/no-emoji");
    const sample = "เรื่องงานหรือความรักคะ \u{1F52E}\u{1F495} → เลือกได้เลย";
    const cleaned = stripEmoji(sample);
    check(
      "A3-04: stripEmoji ตัดอิโมจิทั้งตัวและลูกศร ไม่เหลือ surrogate เดี่ยว",
      !/[\uD800-\uDFFF]/.test(cleaned) && !cleaned.includes("→") && cleaned.includes("เลือกได้เลย"),
      JSON.stringify(cleaned),
    );
  }

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
