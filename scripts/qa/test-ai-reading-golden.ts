/**
 * scripts/qa/test-ai-reading-golden.ts
 * QA — สัญญาของ prompt คำอ่านไพ่ (Prompt Contract) + โครง ReadingSchema
 * รันแบบออฟไลน์ (ไม่เรียก API) — กัน regression ตอนแก้ prompt / โมดูลวิเคราะห์ 7 ตัว
 * รันด้วย: npx tsx scripts/qa/test-ai-reading-golden.ts
 */

import fs from "node:fs";
import path from "node:path";
import { SYSTEM_CORE_KNOWLEDGE, buildReadingMessage, type ReadingContext } from "../../src/lib/ai/prompt";
import { ReadingSchema } from "../../src/lib/schema/reading";
import { ALL_CARDS } from "../../src/data/cards";
import { getSpread } from "../../src/data/spreads";
import { WORKING_GROQ_MODELS } from "../../src/lib/ai/groq";

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
  check("Circuit breaker threshold ปรับเป็น >= 14", groqSrc.includes("totalForeignChars >= 14"));
  check("นับสถิติ ai_foreign_trip เมื่อ circuit breaker ตัด", groqSrc.includes('recordEvent("ai_foreign_trip:groq")'));
  check("นับสถิติ ai_schema_fail เมื่อ JSON ไม่ตรง schema", groqSrc.includes('recordEvent("ai_schema_fail:groq")'));
  check('generateGroqChatReply มีเพดาน max_tokens เริ่มต้น (2400)', groqSrc.includes("2400"));

  // 3. route — นับ failover Groq → Gemini
  const readRouteSrc = fs.readFileSync(
    path.resolve(process.cwd(), "src/app/api/reading/[id]/read/route.ts"),
    "utf-8",
  );
  check('read/route.ts นับสถิติ ai_groq_failover', readRouteSrc.includes('recordEvent("ai_groq_failover")'));

  // 4. Gold Standard Exemplar ฝังใน system core
  check("system core มี Gold Standard Exemplar", SYSTEM_CORE_KNOWLEDGE.includes("Gold Standard Exemplar"));
  check("exemplar อ้าง Eight of Pentacles", SYSTEM_CORE_KNOWLEDGE.includes("Eight of Pentacles"));
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

  console.log(`\n${fail === 0 ? "✨" : "⚠️"} ผ่าน ${pass} · ล้มเหลว ${fail}`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
