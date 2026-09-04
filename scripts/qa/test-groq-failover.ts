/**
 * scripts/qa/test-groq-failover.ts
 * QA — ตรวจสอบระบบ AI สองประสาน (Multi-Provider Failover) ด้วย Groq LPU
 * รันด้วย: npx tsx scripts/qa/test-groq-failover.ts
 */

import fs from "node:fs";
import path from "node:path";
import {
  WORKING_GROQ_MODELS,
  generateGroqChatReply,
  probeGroqHealth,
} from "../../src/lib/ai/groq";
import {
  FOREIGN_LEAK_SWITCH_THRESHOLD,
  SEVERE_FOREIGN_LEAK_THRESHOLD,
  isSevereForeignLeak,
} from "../../src/lib/ai/language";

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

async function main() {
  console.log("🧪 [QA] Groq LPU Multi-Provider Failover & High-Availability Audit\n");

  // 1. ตรวจสอบโมเดล Groq ที่รองรับ
  check(
    "WORKING_GROQ_MODELS มีโมเดลอย่างน้อย 2 ตัว",
    Array.isArray(WORKING_GROQ_MODELS) && WORKING_GROQ_MODELS.length >= 2,
  );
  check(
    "WORKING_GROQ_MODELS มี qwen/qwen3.8-27b เป็นตัวแรก (เก่งภาษาไทย)",
    WORKING_GROQ_MODELS[0] === "qwen/qwen3.8-27b",
  );
  check(
    "WORKING_GROQ_MODELS มี openai/gpt-oss-120b เป็นตัวสำรองเชิงลึก",
    (WORKING_GROQ_MODELS as readonly string[]).includes("openai/gpt-oss-120b"),
  );

  // 2. ตรวจสอบลำดับ WORKING_GEMINI_MODELS ใน gemini.ts ต้องเอา gemini-3.5-flash-lite ขึ้นก่อน (1500 โควตาฟรี/วัน)
  const geminiPath = path.resolve(process.cwd(), "src/lib/ai/gemini.ts");
  const geminiSource = fs.readFileSync(geminiPath, "utf-8");
  check(
    "WORKING_GEMINI_MODELS เอา gemini-3.5-flash-lite ขึ้นก่อน เพื่อหลีกเลี่ยงโควตา 20 ครั้งของ 3.6",
    geminiSource.includes('WORKING_GEMINI_MODELS = ["gemini-3.5-flash-lite", "gemini-3.6-flash"]'),
  );

  // 3. ตรวจสอบ static wiring ใน chat route
  const chatRoutePath = path.resolve(process.cwd(), "src/app/api/reading/[id]/chat/route.ts");
  const chatSource = fs.readFileSync(chatRoutePath, "utf-8");

  check(
    "chat/route.ts มีการเรียก generateGroqChatReply เมื่อ Gemini ล้มเหลว",
    chatSource.includes("generateGroqChatReply") && chatSource.includes("GROQ_API_KEY"),
  );
  check(
    "chat/route.ts ส่งคืน provider: 'groq' เมื่อตอบผ่าน Groq สำเร็จ",
    chatSource.includes('provider: "groq"'),
  );

  // 4. ตรวจสอบ static wiring ใน ai-health route
  const aiHealthPath = path.resolve(process.cwd(), "src/app/api/admin/ai-health/route.ts");
  const aiHealthSource = fs.readFileSync(aiHealthPath, "utf-8");

  check(
    "ai-health/route.ts รองรับการตรวจสุขภาพ Groq ผ่าน probeGroqHealth",
    aiHealthSource.includes("probeGroqHealth") && aiHealthSource.includes("GROQ_API_KEY"),
  );
  check(
    "ai-health/route.ts ทำการ scrub ค่า GROQ_API_KEY ออกจากข้อความ error",
    aiHealthSource.includes("if (groqKey) s = s.split(groqKey).join(\"***\")"),
  );

  // 5. ทดสอบยิง Groq จริง (ถ้ามีคีย์ในเครื่อง)
  const apiKey = process.env.GROQ_API_KEY;
  if (apiKey) {
    console.log("\n⚡ พบ GROQ_API_KEY ในเครื่อง ทำการทดสอบยิงสดผ่าน Groq LPU...");
    try {
      const probe = await probeGroqHealth(apiKey);
      const passedProbe = probe.filter((p) => p.ok);
      check(
        `probeGroqHealth สำเร็จ ${passedProbe.length}/${probe.length} โมเดล`,
        passedProbe.length > 0,
      );

      const reply = await generateGroqChatReply({
        systemInstruction: "คุณคือแม่หมอไพ่ทาโรต์ผู้หยั่งรู้",
        messages: [{ role: "user", content: "สวัสดีค่ะแม่หมอ" }],
        apiKey,
      });

      check(
        `generateGroqChatReply ตอบกลับสำเร็จจริง (${reply?.model}) [${reply?.elapsedMs}ms]: "${reply?.reply.slice(0, 50)}..."`,
        typeof reply?.reply === "string" && reply.reply.length > 0,
      );
    } catch (err: any) {
      check(`การทดสอบยิงสดผ่าน Groq: ${err?.message}`, false);
    }
  } else {
    console.log("\n⚠️ ไม่พบ GROQ_API_KEY ใน environment สำหรับการทดสอบยิงสด (ข้ามขั้นยิงจริง)");
  }

  // ── เกณฑ์ตัดวงจรภาษาต่างด้าว ต้องมาจากค่าคงที่ที่เดียว ────────────────
  // ⚠️ ด่านนี้มีไว้กันเลข 14 / 20 หลุดกลับไปฮาร์ดโค้ดใน groq.ts อีก
  // ถ้าปรับเกณฑ์ที่ language.ts แล้วอีกที่ยังใช้เลขเดิม เกณฑ์ "สลับโมเดล"
  // กับ "เลิกกับ Groq ทั้งชุด" จะเพี้ยนไปคนละทางโดยไม่มีอะไรเตือน
  console.log("\n🚦 เกณฑ์ตัดวงจรเมื่อคำอ่านหลุดภาษาต่างด้าว");

  check(
    `SEVERE ต้องสูงกว่า SWITCH (${SEVERE_FOREIGN_LEAK_THRESHOLD} > ${FOREIGN_LEAK_SWITCH_THRESHOLD})`,
    SEVERE_FOREIGN_LEAK_THRESHOLD > FOREIGN_LEAK_SWITCH_THRESHOLD,
  );

  const cn = (n: number) => "中".repeat(n);
  check(
    `isSevereForeignLeak: อักษรจีน ${SEVERE_FOREIGN_LEAK_THRESHOLD} ตัว → true`,
    isSevereForeignLeak(cn(SEVERE_FOREIGN_LEAK_THRESHOLD)) === true,
  );
  check(
    `isSevereForeignLeak: อักษรจีน ${SEVERE_FOREIGN_LEAK_THRESHOLD - 1} ตัว → false`,
    isSevereForeignLeak(cn(SEVERE_FOREIGN_LEAK_THRESHOLD - 1)) === false,
  );
  check("isSevereForeignLeak: ข้อความไทยล้วน → false", isSevereForeignLeak("แม่หมอทักทายคุณอย่างอบอุ่น") === false);
  check("isSevereForeignLeak: null / undefined → false", !isSevereForeignLeak(null) && !isSevereForeignLeak(undefined));

  const groqSrc = fs.readFileSync(path.join(process.cwd(), "src/lib/ai/groq.ts"), "utf-8");
  check(
    "groq.ts ใช้ค่าคงที่จาก language.ts ไม่ฮาร์ดโค้ดตัวเลขเกณฑ์เอง",
    !/totalForeignChars\s*>=\s*\d/.test(groqSrc),
  );
  check(
    "groq.ts import ค่าคงที่เกณฑ์ทั้งสองระดับมาใช้จริง",
    groqSrc.includes("FOREIGN_LEAK_SWITCH_THRESHOLD") && groqSrc.includes("SEVERE_FOREIGN_LEAK_THRESHOLD"),
  );
  check(
    "streamGroqReading ต่อ isSevereForeignLeak ไว้จริง (circuit breaker ไม่ใช่โค้ดตาย)",
    groqSrc.includes("isSevereForeignLeak("),
  );

  console.log(`\n📊 ผลสรุป: ผ่าน ${pass} / ล้มเหลว ${fail}`);
  if (fail > 0) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("FATAL in test-groq-failover:", e);
  process.exit(1);
});
