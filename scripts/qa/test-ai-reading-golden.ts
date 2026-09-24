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
  resolveMaxReadingTokens,
  resolveThinkingOutputBudget,
} from "../../src/lib/ai/reading-stream";
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
   * `reading-stream.ts` (ตอนจะเพิ่มผู้ให้บริการรายที่สอง) ด่านก็ล้มทันทีทั้งที่พฤติกรรมไม่เปลี่ยน
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

  /*
   * 2.1 Groq ต้องถอยเองเมื่อคำขอใหญ่เกินเพดาน TPM แทนที่จะยิงทิ้งครบทุกโมเดล
   * เพดานของ Groq นับ prompt + max_tokens รวมกันต่อคำขอเดียวที่ 8,000 (INC-0136)
   * ผัง 4 ใบขึ้นไปจึงไม่มีทางผ่าน — ยิงไปก็ได้แค่ 429 แลกกับเวลาที่ผู้ใช้นั่งรอ
   * ➔ ผังใหญ่เป็นของ Gemini ทั้งหมดในตอนนี้
   */
  check(
    "groq.ts ถอยทันทีเมื่อตัดของเสริมแล้วยังเกินเพดาน TPM (ไม่ยิงคำขอที่รู้ว่าจะโดนปฏิเสธ)",
    /if \(!fitsNow\) \{[\s\S]{0,400}?return;/.test(groqSrc),
  );

  /*
   * 2.2 เพดานผลลัพธ์ต้องเป็นเลข "ของเจ้านั้น" ไม่ใช่เลขตายตัวที่ยืมกันไปมา
   * เดิมโค้ดเขียน Math.min(7000, ...) ไว้ตรง ๆ ทำให้ผัง 12 ใบซึ่งต้องการ 7,360
   * ถูกหั่นทิ้ง 360 โทเค็น = ไพ่ใบสุดท้ายเขียนไม่จบ
   */
  check(
    "groq.ts ใช้ resolveMaxReadingTokens() ไม่ฮาร์ดโค้ดเพดานเอง",
    groqSrc.includes("resolveMaxReadingTokens(ctx.drawn.length, GROQ_OUTPUT_CEILING)") &&
      !/Math\.min\(7000,/.test(groqSrc),
  );
  check(
    "สูตรเพดานคืนค่าถูกต้อง (ผัง 12 ใบ = 1,600 + 12 × 480 = 7,360 เมื่อเพดานกว้างพอ)",
    resolveMaxReadingTokens(12, 8000) === 7360 && resolveMaxReadingTokens(12, 7000) === 7000,
  );

  /*
   * 2.3 🃏 Gemini ต้องไม่เสิร์ฟคำอ่านไพ่ไม่ครบแบบเงียบ ๆ (กฎเหล็กข้อ 14 · INC-0155)
   * ---------------------------------------------------------------------------
   * เดิมเมื่อ Gemini เขียนไม่จบ โค้ดจะประกอบคำอ่านสำรองจากไพ่เท่าที่สตรีมมาทัน
   * แล้วเติมท้ายด้วยข้อความสำเร็จรูปที่ไม่เกี่ยวกับไพ่ที่จั่วเลย จากนั้นส่ง `done`
   * พร้อม usage จริง ➔ ระบบนับว่าสำเร็จและ **หักโควตาผู้ใช้ไปด้วย**
   * ผัง 12 ใบที่ถูกตัดตอนใบที่ 7 ผู้ใช้จึงได้ 7 ใบโดยไม่มีใครบอก
   *
   * ตอนนี้ต้อง: ลองโมเดลถัดไปก่อน ➔ ถ้ายังไม่ได้ให้ส่ง `error` ให้ผู้ใช้โหลดใหม่
   * ซึ่ง route จะคืนสิทธิ์ให้เองผ่าน `refundIfConsumed()`
   */
  const geminiSrc = fs.readFileSync(path.resolve(process.cwd(), "src/lib/ai/gemini.ts"), "utf-8");
  for (const filler of [
    "จงเชื่อมั่นในสัญชาตญาณและก้าวต่อไปอย่างมีสติ",
    "ไพ่ทุกใบสะท้อนถึงการเปลี่ยนแปลงที่กำลังดำเนินไป",
    "ตั้งสติและลงมือทำสิ่งที่ทำได้จริง",
  ]) {
    check(
      `gemini.ts ไม่มีข้อความสำเร็จรูปยัดแทนคำอ่านจริง ("${filler.slice(0, 24)}…")`,
      !geminiSrc.includes(filler),
    );
  }
  check(
    "gemini.ts อ่าน finishReason เพื่อรู้ว่าคำอ่านโดนตัดหรือเขียนจบจริง",
    geminiSrc.includes("finishReason") && geminiSrc.includes('=== "MAX_TOKENS"'),
  );
  check(
    "gemini.ts บันทึกสถิติเมื่อคำอ่านโดนตัด (เดิมเส้นทางนี้ไม่มีสถิติเลยสักตัว)",
    geminiSrc.includes('recordEvent("ai_truncated:gemini")') &&
      geminiSrc.includes('recordEvent("ai_schema_fail:gemini")'),
  );
  /*
   * INC-0155 → 2026-09-24: เขียนไม่จบทุกโมเดล = คำอ่านสำรอง **เต็มฉบับ** (ไม่ใช่ error อีกต่อไป)
   * สิ่งที่ INC-0155 ห้ามยังห้ามอยู่: ห้ามเติมคำอ่านครึ่งทางด้วยข้อความสำเร็จรูป และห้ามหักสิทธิ์
   * ➔ ตรวจว่าเส้นนี้เรียกคำอ่านสำรองเต็มฉบับ (usage = 0 · route คืนสิทธิ์) และยังจดสถิติไว้
   */
  check(
    "gemini.ts เขียนไม่จบทุกโมเดล ➔ คำอ่านสำรองเต็มฉบับ (ไม่เติมของครึ่งทาง · ไม่หักสิทธิ์) + จดสถิติ",
    geminiSrc.includes("ai_incomplete_reading") &&
      geminiSrc.includes('streamMockGeminiReading(ctx, "incomplete_output")') &&
      // ตัดคอมเมนต์ทิ้งก่อนตรวจ — คอมเมนต์เล่าประวัติข้อความเก่าไว้ได้ แต่โค้ดห้ามมี
      !/cardsResult\.push|FALLBACK_TEXT|จงเชื่อมั่นในสัญชาตญาณ/.test(
        geminiSrc.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, ""),
      ),
  );
  check(
    "gemini.ts ลองโมเดลถัดไปก่อนยอมแพ้ (ลูปครอบทั้งยิง+สตรีม+ตรวจ ไม่ใช่แค่ตอนขอ response)",
    /for \(const \[modelIdx, model\] of WORKING_GEMINI_MODELS\.entries\(\)\)[\s\S]*?yield \{\s*type: "done"/.test(
      geminiSrc,
    ),
  );
  check(
    "gemini.ts มีตาข่ายกัน 400 จากเพดานผลลัพธ์ (ยิงซ้ำแบบไม่ส่งเพดาน)",
    geminiSrc.includes("ai_gemini_budget_rejected"),
  );
  /*
   * สูตรงบอยู่ที่ `reading-stream.ts` (กลาง ไม่ผูกกับเจ้าไหน) ส่วนตัวเลขเป็นของ Gemini
   * จึงตรวจสองชั้น: สูตรคำนวณถูก + gemini.ts ส่งตัวเลขของตัวเองเข้าไปจริง
   * (`gemini.ts` มี `import "server-only"` จึง import เข้าสคริปต์ตรง ๆ ไม่ได้ ต้องอ่านเป็นข้อความ)
   */
  const geminiBudget = { ceiling: 8000, multiplier: 3, floor: 8192 };
  check(
    "สูตรงบเผื่อโทเค็นความคิดคำนวณถูก (ผังเล็กได้พื้นขั้นต่ำ · ผัง 12 ใบได้ 3 เท่า)",
    resolveThinkingOutputBudget(1, geminiBudget) === 8192 &&
      resolveThinkingOutputBudget(12, geminiBudget) === 7360 * 3,
  );
  check(
    "gemini.ts ประกาศตัวเลขงบของตัวเองและเรียกสูตรกลาง ไม่คำนวณเอง",
    geminiSrc.includes("GEMINI_OUTPUT_BUDGET = { ceiling: 8000, multiplier: 3, floor: 8192 }") &&
      geminiSrc.includes("resolveThinkingOutputBudget(ctx.drawn.length, GEMINI_OUTPUT_BUDGET)"),
  );
  check(
    "คำอ่านสำรองออฟไลน์เหลือไว้เฉพาะตอนไม่มีโมเดลไหนตอบเลย (usage = 0 จึงไม่หักสิทธิ์)",
    geminiSrc.includes("if (!sawAnyResponse)"),
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

  // 5b. ✦ ราศีของผู้ถาม — ไม่ส่งมาต้องไม่แตะ prompt เลย (ผลวัด ai:judge ของเวอร์ชันนี้ยังใช้ได้)
  const zBase = ctxFor("celtic-cross"); // ไพ่ major-00..09 → มี Strength (ราศีสิงห์) แต่ไม่มี The Sun / The Tower
  const noZodiac = buildReadingMessage(zBase);
  const leo = buildReadingMessage({ ...zBase, zodiac: { tropical: "leo", thai: "cancer", decan: 2 } });
  check("ไม่ส่งราศี → ไม่มีบล็อก <zodiac>", !noZodiac.includes("<zodiac>"));
  check(
    "ส่งราศี → ต่างจากเดิมแค่บล็อก <zodiac> (ส่วนอื่นเหมือนเดิมทุกตัวอักษร)",
    leo.replace(/\n  <zodiac>[\s\S]*?<\/zodiac>/, "") === noZodiac,
  );
  check("ราศีสิงห์ + เปิดได้ Strength → บอกโมเดลว่าเป็นไพ่ประจำราศีของผู้ถาม", /Strength\) ที่เปิดได้ คือไพ่ประจำราศีสิงห์/.test(leo));
  check("ราศีไทยกรกฎ + เปิดได้ The Chariot / The High Priestess → ทักทั้งคู่", leo.includes("ไพ่ประจำราศีกรกฎ") && leo.includes("เจ้าเรือนราศีไทย"));
  check("ไม่มีไพ่ The Sun ในผัง → ห้ามอ้างถึงดาวผู้ครอง", !leo.includes("ดาวผู้ครองราศีสิงห์"));
  const capri = buildReadingMessage({ ...ctxFor("three-card"), zodiac: { tropical: "capricorn" } }); // The Devil · The World · 2–4 เหรียญ ไม่อยู่ใน major-00..02
  check("ราศีที่ไม่มีไพ่ในผังเลย → สั่งห้ามอ้างว่าไพ่ใดเป็นของราศีผู้ถาม", capri.includes("ไม่มีไพ่ใบไหนเป็นไพ่ประจำราศีของผู้ถาม"));
  check("ราศีไม่ถูกต้อง → ไม่มีบล็อก", !buildReadingMessage({ ...zBase, zodiac: { tropical: "xyz" } }).includes("<zodiac>"));
  const leoEn = buildReadingMessage({ ...zBase, lang: "en", zodiac: { tropical: "leo" } });
  check("ภาษาอังกฤษ → บล็อกเป็นอังกฤษล้วน", /<zodiac>[^\u0E00-\u0E7F]*<\/zodiac>/.test(leoEn) && leoEn.includes("the card of Leo"));

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
