/**
 * scripts/qa/test-ai-reading-golden.ts
 * QA — สัญญาของ prompt คำอ่านไพ่ (Prompt Contract) + โครง ReadingSchema
 * รันแบบออฟไลน์ (ไม่เรียก API) — กัน regression ตอนแก้ prompt / โมดูลวิเคราะห์ 7 ตัว
 * รันด้วย: npx tsx scripts/qa/test-ai-reading-golden.ts
 */

import fs from "node:fs";
import path from "node:path";
import { FOREIGN_LEAK_SWITCH_THRESHOLD } from "../../src/lib/ai/language";
import { SYSTEM_CORE_KNOWLEDGE, buildReadingMessage, type ReadingContext } from "../../src/lib/ai/prompt";
import { ReadingSchema } from "../../src/lib/schema/reading";
import { ALL_CARDS } from "../../src/data/cards";
import { getSpread } from "../../src/data/spreads";
import { WORKING_GROQ_MODELS } from "../../src/lib/ai/groq";
import {
  activeCerebrasModels,
  CEREBRAS_MIN_CARDS,
  CEREBRAS_MODEL_CONFIGS,
  WORKING_CEREBRAS_MODELS,
} from "../../src/lib/ai/cerebras";
import { resolveMaxReadingTokens } from "../../src/lib/ai/reading-stream";
import { PROMPT_VERSION } from "../../src/lib/ai/prompt-version";

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean) {
  if (cond) {
    pass++;
    console.log(`✅ ${name}`);
  } else {
    fail++;
    console.log(`❌ ${name}`);
  }
}

function ctxFor(spreadId: string): ReadingContext {
  const spread = getSpread(spreadId)!;
  const n = spread.positions.length;
  const cards = ALL_CARDS.slice(0, n);
  return {
    personaId: null,
    spread,
    category: "general",
    question: "ช่วงนี้ควรโฟกัสอะไรในชีวิต",
    intake: { situation: "กำลังตัดสินใจเรื่องใหญ่", feeling: "ลังเล", hoped: "อยากมั่นใจ" },
    drawn: cards.map((_, i) => ({ order: i, cardIndex: i, isReversed: i % 2 === 0 })),
    cards: cards as ReadingContext["cards"],
    safety: { flag: "none", block: false },
    nickname: "มะปราง",
  };
}

async function main() {
  console.log("🧪 [QA] AI Reading — Prompt Contract & Schema Golden Set\n");

  // 1. โมเดล Groq — gpt-oss-120b ต้องอยู่ในสายพาน (Tier ก่อนตกไป Gemini)
  check(
    "WORKING_GROQ_MODELS มี openai/gpt-oss-120b",
    (WORKING_GROQ_MODELS as readonly string[]).includes("openai/gpt-oss-120b"),
  );

  // 2. groq.ts — การตั้งค่าที่กันบั๊ก reasoning model + คำอ่านโดนตัดกลาง
  const groqSrc = fs.readFileSync(path.resolve(process.cwd(), "src/lib/ai/groq.ts"), "utf-8");
  check('streamGroqReading ตั้ง reasoning_format: "hidden"', groqSrc.includes('reasoning_format: "hidden"'));
  check("streamGroqReading กำหนด max_tokens ตามจำนวนไพ่ (maxReadingTokens)", groqSrc.includes("max_tokens: maxReadingTokens"));
  // ⚠️ เดิมด่านนี้ grep หาสตริง "totalForeignChars >= 14" ตรง ๆ
  // พอเลขถูกย้ายไปเป็นค่าคงที่ใน language.ts (แหล่งความจริงเดียว) ด่านก็ล้มทันที
  // ต้องตรวจที่ "ค่าจริง" ไม่ใช่ที่หน้าตาของโค้ด — ไม่งั้นด่านจะขวางการ refactor ที่ถูกต้อง
  check(
    `Circuit breaker threshold (สลับโมเดล) = ${FOREIGN_LEAK_SWITCH_THRESHOLD}`,
    FOREIGN_LEAK_SWITCH_THRESHOLD === 14,
  );
  /*
   * ⚠️ บทเรียนซ้ำรอบสอง (อ่านคอมเมนต์ด้านบนประกอบ):
   * ด่านสามข้อล่างนี้เคย grep หาสตริงใน `groq.ts` ตรง ๆ พอตรรกะถูกยกออกมาไว้ที่
   * `reading-stream.ts` เพื่อให้ Cerebras ใช้ร่วมได้ ด่านก็ล้มทันทีทั้งที่พฤติกรรมไม่เปลี่ยน
   *
   * คราวนี้จึงตรวจสองชั้นแทน:
   *   (1) "ด่านนิรภัยมีอยู่จริง" — ตรวจที่เครื่องยนต์กลางซึ่งเป็นแหล่งความจริงเดียว
   *   (2) "ผู้ให้บริการทุกเจ้าเดินผ่านเครื่องยนต์นั้น" — ตรวจว่าแต่ละไฟล์เรียกใช้จริง
   * แบบนี้ย้ายโค้ดได้โดยด่านไม่ขวาง แต่ถ้าใครลบด่านนิรภัยออกจริง ๆ จะจับได้ทันที
   */
  const engineSrc = fs.readFileSync(
    path.resolve(process.cwd(), "src/lib/ai/reading-stream.ts"),
    "utf-8",
  );
  check(
    "เครื่องยนต์กลางใช้ค่าคงที่ FOREIGN_LEAK_SWITCH_THRESHOLD ไม่ฮาร์ดโค้ดตัวเลขเอง",
    engineSrc.includes("state.totalForeignChars >= FOREIGN_LEAK_SWITCH_THRESHOLD"),
  );
  check(
    "นับสถิติ ai_foreign_trip เมื่อ circuit breaker ตัด",
    engineSrc.includes("recordEvent(`ai_foreign_trip:${meta.provider}`)"),
  );
  check(
    "นับสถิติ ai_schema_fail เมื่อ JSON ไม่ตรง schema",
    engineSrc.includes("recordEvent(`ai_schema_fail:${meta.provider}`)"),
  );
  check(
    "เครื่องยนต์กลางไม่มีโค้ดกุไพ่ — schema ไม่ผ่านต้องคืน retryNextModel (กฎเหล็กข้อ 14)",
    engineSrc.includes("return { ok: false, retryNextModel: true };") &&
      !/fallbackCard|mockCard|DEFAULT_CARD/i.test(engineSrc),
  );
  check('generateGroqChatReply มีเพดาน max_tokens เริ่มต้น (2400)', groqSrc.includes("2400"));

  // 2.1 ผู้ให้บริการทุกเจ้าต้องเดินผ่านเครื่องยนต์กลาง ห้ามเขียนลูปถอดสตรีมของตัวเอง
  const cerebrasSrc = fs.readFileSync(
    path.resolve(process.cwd(), "src/lib/ai/cerebras.ts"),
    "utf-8",
  );
  for (const [label, src] of [
    ["groq.ts", groqSrc],
    ["cerebras.ts", cerebrasSrc],
  ] as const) {
    check(
      `${label} เดินผ่านเครื่องยนต์กลาง (consumeReadingDelta + finalizeReading)`,
      src.includes("consumeReadingDelta(") && src.includes("finalizeReading("),
    );
  }

  /*
   * 2.2 Groq ต้องถอยเองเมื่อคำขอใหญ่เกินเพดาน TPM แทนที่จะยิงทิ้งครบทุกโมเดล
   * เพดานของ Groq นับ prompt + max_tokens รวมกันต่อคำขอเดียวที่ 8,000 (INC-0136)
   * ผัง 4 ใบขึ้นไปจึงไม่มีทางผ่าน — ยิงไปก็ได้แค่ 429 แลกกับเวลาที่ผู้ใช้นั่งรอ
   */
  check(
    "groq.ts ถอยทันทีเมื่อตัดของเสริมแล้วยังเกินเพดาน TPM (ไม่ยิงคำขอที่รู้ว่าจะโดนปฏิเสธ)",
    /if \(!fitsNow\) \{[\s\S]{0,400}?return;/.test(groqSrc),
  );

  /*
   * 2.3 Cerebras รับเฉพาะผังใหญ่ — ชั้นฟรีมีแค่ 5 คำขอ/นาที
   * ถ้าเผลอปล่อยให้รับผังเล็กด้วย โควตาจะหมดก่อนที่ผังใหญ่ (ซึ่งไม่มีทางเลือกอื่น) จะได้ใช้
   */
  check(
    "cerebras.ts กันไม่ให้รับผังเล็ก (CEREBRAS_MIN_CARDS = 4)",
    CEREBRAS_MIN_CARDS === 4 && cerebrasSrc.includes("cardCount >= CEREBRAS_MIN_CARDS"),
  );
  check(
    "cerebras.ts ใช้ชื่อโมเดลแบบไม่มี prefix ผู้ผลิต (ต่างจาก Groq)",
    (WORKING_CEREBRAS_MODELS as readonly string[]).every((m) => !m.includes("/")),
  );
  check(
    "cerebras.ts เพดานผลลัพธ์กว้างพอให้ผัง 12 ใบ (1,600 + 12 × 480 = 7,360) เขียนจบ",
    resolveMaxReadingTokens(12, 8000) === 7360,
  );

  /*
   * 2.4 โทเค็นความคิดต้องไม่กินงบคำอ่าน
   * ---------------------------------------------------------------------------
   * เอกสาร Cerebras เขียนชัดว่า "Reasoning tokens count toward max_completion_tokens"
   * และ `qwen-3.8-27b` ตั้งค่าปริยายไว้ที่ `reasoning_effort: "high"`
   * ➔ ถ้าไม่ส่งค่าคุม โมเดลจะคิดยาวจนคำอ่านโดนตัดกลาง = อาการเดิมที่เรากำลังแก้อยู่
   *
   * กติกาถาวร: ตัวที่ปิดความคิดได้ต้องปิด · ตัวที่ปิดไม่ได้ต้องเผื่องบมากกว่าหนึ่งเท่า
   */
  check(
    "cerebras.ts ส่ง reasoning_effort ทุกคำขอ (ไม่ปล่อยให้ Qwen ใช้ค่าปริยาย high)",
    cerebrasSrc.includes("reasoning_effort: config.reasoningEffort"),
  );
  check(
    "qwen-3.8-27b ปิดความคิดสนิท (reasoning_effort = none) เพราะปิดได้และงานนี้ไม่ต้องคิดหลายชั้น",
    CEREBRAS_MODEL_CONFIGS.find((c) => c.id === "qwen-3.8-27b")?.reasoningEffort === "none",
  );
  check(
    "qwen-3.8-27b ไม่ส่ง reasoning_format: hidden (เอกสารระบุว่าไม่รองรับ ส่งไปเสี่ยง 400)",
    CEREBRAS_MODEL_CONFIGS.find((c) => c.id === "qwen-3.8-27b")?.supportsHiddenReasoning === false,
  );
  check(
    "ทุกโมเดลที่ปิดความคิดไม่ได้ ต้องเผื่องบผลลัพธ์มากกว่า 1 เท่า",
    CEREBRAS_MODEL_CONFIGS.every(
      (c) => c.reasoningEffort === "none" || c.reasoningBudgetMultiplier > 1,
    ),
  );
  // ต้องตัดคอมเมนต์ทิ้งก่อนตรวจ ไม่งั้นคำเตือนที่เขียนไว้ในคอมเมนต์เองจะทำให้ด่านตกทั้งที่โค้ดถูก
  const stripComments = (src: string) =>
    src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  check(
    "cerebras.ts อ่านเฉพาะ delta.content ไม่ดูด delta.reasoning เข้ามาปน (จะพังตัวถอด JSON + ด่านอักษรต่างด้าว)",
    !/delta\??\.reasoning/.test(stripComments(cerebrasSrc)),
  );

  /*
   * 2.5 งบรวมของทุกผัง × ทุกโมเดล ต้องอยู่ใต้เพดาน TPM ของ Cerebras
   * คำนวณด้วยสูตรเดียวกับที่ `cerebras.ts` ใช้จริง — ไม่คัดลอกตัวเลขมาเขียนซ้ำ
   * (บทเรียน INC-0136: เพดานที่นับ prompt รวมกับ max_tokens ต้องคำนวณก่อนทุกครั้งที่ขยับงบ)
   */
  const worstBudget = Math.max(
    ...CEREBRAS_MODEL_CONFIGS.map((c) =>
      Math.min(8000 * 2, resolveMaxReadingTokens(12, 8000) * c.reasoningBudgetMultiplier),
    ),
  );
  check(
    `งบผลลัพธ์หนักสุด (${worstBudget}) บวก prompt ผัง 12 ใบ ยังอยู่ใต้เพดาน TPM 28,000`,
    worstBudget + 9011 <= 28000,
  );

  // 2.6 probe ต้องยิงด้วยค่าชุดเดียวกับ production ไม่งั้นวัดคนละอย่างกับของจริง
  const probeSrc = fs.readFileSync(
    path.resolve(process.cwd(), "scripts/qa/probe-cerebras.ts"),
    "utf-8",
  );
  check(
    "probe-cerebras.ts ส่ง reasoning_effort ชุดเดียวกับ production",
    probeSrc.includes("reasoning_effort: config.reasoningEffort") &&
      probeSrc.includes("config.reasoningBudgetMultiplier"),
  );

  /*
   * 2.7 💸 ห้ามใช้โมเดลที่คิดเงินโดยไม่ได้ขอ
   * ---------------------------------------------------------------------------
   * โควตา Cerebras แยกรายโมเดลและอยู่คนละชั้นบริการกันได้ในบัญชีเดียว
   * `qwen-3.8-27b` ของบัญชีนี้อยู่ชั้น PayGo ($0.99/$1.49 ต่อล้านโทเค็น)
   * ขณะที่ `gpt-oss-120b` ยังเป็น Free Trial
   *
   * เจ้าของโปรเจกต์สั่งไว้ชัด (2026-09-14) ว่า **เอาแบบฟรีล้วน ไม่จ่ายเลย**
   * ด่านนี้จึงล็อกไว้ว่าสายพานปริยายต้องไม่มีโมเดลที่คิดเงินแม้แต่ตัวเดียว
   * ใครจะเปิดต้องตั้ง CEREBRAS_ALLOW_PAID=1 เองโดยรู้ตัว
   */
  const paidInDefault = activeCerebrasModels().filter((c) => c.billed);
  check(
    `สายพานปริยายต้องไม่มีโมเดลที่คิดเงิน (พบ ${paidInDefault.length} ตัว)`,
    paidInDefault.length === 0,
  );
  check(
    "qwen-3.8-27b ถูกทำเครื่องหมายว่าคิดเงิน (บัญชีนี้อยู่ชั้น PayGo)",
    CEREBRAS_MODEL_CONFIGS.find((c) => c.id === "qwen-3.8-27b")?.billed === true,
  );
  check(
    "gpt-oss-120b เป็นตัวฟรีและอยู่ในสายพานปริยาย",
    activeCerebrasModels().some((c) => c.id === "gpt-oss-120b" && !c.billed),
  );
  check(
    "ทุกโมเดลต้องระบุราคาไว้ให้คนอ่านโค้ดเห็น (priceNote ไม่ว่าง)",
    CEREBRAS_MODEL_CONFIGS.every((c) => c.priceNote.trim().length > 0),
  );
  check(
    "cerebras.ts วนลูปบน activeCerebrasModels() ไม่ใช่รายการดิบที่มีตัวคิดเงินปน",
    cerebrasSrc.includes("for (const config of activeCerebrasModels())") &&
      !cerebrasSrc.includes("for (const config of CEREBRAS_MODEL_CONFIGS)"),
  );
  check(
    "probe-cerebras.ts ก็ยิงเฉพาะตัวฟรีโดยปริยายเช่นกัน",
    probeSrc.includes("[...activeCerebrasModels()]"),
  );

  // 3. route — นับ failover Groq → Gemini
  const readRouteSrc = fs.readFileSync(
    path.resolve(process.cwd(), "src/app/api/reading/[id]/read/route.ts"),
    "utf-8",
  );
  check('read/route.ts นับสถิติ ai_groq_failover', readRouteSrc.includes('recordEvent("ai_groq_failover")'));

  // 4. Gold Standard Exemplar ฝังใน user message ตามบริบท (B-02 ย้ายออกจาก system core เพื่อ prompt caching)
  const workMsg1 = buildReadingMessage({ ...ctxFor("daily"), category: "work" });
  check("user message มี Gold Standard Exemplar", workMsg1.includes("Gold Standard Exemplar"));
  check("exemplar อ้าง Eight of Pentacles", workMsg1.includes("Eight of Pentacles"));
  check(
    "system core บังคับปิดท้ายด้วย Power Reflection Question",
    SYSTEM_CORE_KNOWLEDGE.includes("Power Reflection Question"),
  );

  // 5. ความยาวคำอ่านปรับตามจำนวนไพ่
  const msg1 = buildReadingMessage(ctxFor("daily")); // 1 ใบ
  const msg3 = buildReadingMessage(ctxFor("three-card")); // 3 ใบ
  const msg10 = buildReadingMessage(ctxFor("celtic-cross")); // 10 ใบ
  check("ผัง 1 ใบ → reading 5-7 ประโยค", msg1.includes("5-7 ประโยค"));
  check("ผัง 10 ใบ → reading กระชับ 2-3 ประโยค", msg10.includes("2-3 ประโยค คมชัดตรงแก่น"));
  check("ผัง 3 ใบ ใช้โหมดกลาง (3-4 ประโยค)", msg3.includes("3-4 ประโยค"));

  // 6. โครงสร้าง prompt ครบ
  for (const [label, msg, n] of [
    ["1 ใบ", msg1, 1],
    ["3 ใบ", msg3, 3],
    ["10 ใบ", msg10, 10],
  ] as const) {
    check(`ผัง ${label}: มี Grandmaster Cognitive Matrix`, msg.includes("Grandmaster Cognitive Matrix"));
    check(`ผัง ${label}: มี Cosmic & User Context`, msg.includes("Cosmic & User Context"));
    check(`ผัง ${label}: ระบุจำนวนไพ่ถูกต้อง (${n})`, msg.includes(`ผังนี้มี ${n} ใบ`));
    check(`ผัง ${label}: ไม่มี undefined หลุด`, !msg.includes("undefined"));
  }

  // 7. ReadingSchema — รับ gold sample, ปฏิเสธ malformed
  const gold = {
    opening: "พอเห็นไพ่ชุดนี้ แม่หมอรู้สึกถึงพลังของการเปลี่ยนผ่านที่คุณกำลังก้าวเข้าไป",
    cards: [
      { position: 0, headline: "รากฐานที่มั่นคง", reading: "ไพ่ใบนี้ในตำแหน่งนี้ชี้ว่าคุณมีพื้นฐานที่ดีกว่าที่คิด ลองมองย้อนกลับไปดูสิ่งที่สร้างมาแล้ว" },
    ],
    connections: "ผังใบเดียวจึงเน้นที่ธาตุดินของไพ่ ซึ่งย้ำเรื่องความมั่นคงและการลงมือทำอย่างเป็นระบบ",
    summary:
      "โดยสรุป ทางข้างหน้าชัดเจนกว่าที่ใจกังวล ขอแค่เดินทีละก้าวอย่างตั้งใจ คุณพร้อมกว่าที่ตัวเองยอมรับ แล้วอะไรคือก้าวเล็กที่สุดที่คุณลงมือได้ในวันนี้",
    advice: ["เขียนสิ่งที่ทำสำเร็จแล้ว 3 ข้อ", "เลือกงานสำคัญ 1 อย่างทำให้เสร็จวันนี้", "🧘 หายใจลึก ๆ 1 นาที นึกถึงสิ่งที่มีอยู่แล้ว"],
    timing: "ราว 1 ฤดูกาลข้างหน้า",
    mood: "สงบ",
  };
  check("ReadingSchema รับ gold sample", ReadingSchema.safeParse(gold).success);
  check("ReadingSchema ปฏิเสธเมื่อ cards ว่าง", !ReadingSchema.safeParse({ ...gold, cards: [] }).success);
  check(
    "ReadingSchema ปฏิเสธเมื่อ advice น้อยกว่า 2 ข้อ",
    !ReadingSchema.safeParse({ ...gold, advice: ["ข้อเดียว"] }).success,
  );
  check(
    "ReadingSchema ปฏิเสธ mood นอกชุด",
    !ReadingSchema.safeParse({ ...gold, mood: "หื่น" }).success,
  );

  // 8. schema description sync กับ prompt
  const schemaSrc = fs.readFileSync(path.resolve(process.cwd(), "src/lib/schema/reading.ts"), "utf-8");
  check("reading.ts: summary describe ระบุ 5-8 ประโยค + Power Reflection Question", schemaSrc.includes("5-8 ประโยค") && schemaSrc.includes("Power Reflection Question"));
  check("reading.ts: advice describe ระบุกิจกรรมฝึกสติ 🧘", schemaSrc.includes("🧘"));

  // 9. PROMPT_VERSION sync guard (AI_INTELLIGENCE_PLAN W1.1)
  check("PROMPT_VERSION มีการระบุและขึ้นรูปแบบ YYYYMMDD-X", /^\d{8}-\d+$/.test(PROMPT_VERSION));
  check("PROMPT_VERSION ไม่ว่างเปล่า", typeof PROMPT_VERSION === "string" && PROMPT_VERSION.length >= 8);

  console.log(`\n${fail === 0 ? "✨" : "⚠️"} ผ่าน ${pass} · ล้มเหลว ${fail}`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
