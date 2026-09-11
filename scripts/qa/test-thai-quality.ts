/**
 * scripts/qa/test-thai-quality.ts
 * ---------------------------------------------------------------------------
 * 🧪 ด่านตรวจภาษาไทยของแม่หมอ (HANDOFF_AI_ACCURACY_THAI A-01 + A-03)
 *
 * ตรวจ 3 ชั้น:
 *   1. `checkThaiQuality()` / `polishThai()` จับผิดจริงและไม่จับผิดของที่ถูก (กันผลบวกลวง)
 *   2. ความเร็ว `polishThai()` — วิ่งบนสตรีมสด ต้องไม่เกิน 1ms ต่อ 2,000 ตัวอักษร
 *   3. 🔴 **ภาษาไทยใน prompt และ persona ของเราเอง** ต้อง 0 fatal
 *      (โมเดลลอกสไตล์การเขียนจาก prompt ตรง ๆ — เราเขียนไม่นิ่ง มันก็เขียนไม่นิ่ง)
 *
 * รันด้วย: npx tsx scripts/qa/test-thai-quality.ts
 */

import {
  checkThaiQuality,
  checkThaiQualityDeep,
  polishThai,
  polishThaiDeep,
} from "../../src/lib/ai/thai-quality";
import { SYSTEM_CORE_KNOWLEDGE } from "../../src/lib/ai/prompt";
import { PERSONAS } from "../../src/data/personas";
import { generateMindfulMicroRitual } from "../../src/lib/ai/ritual";
import { diagnoseQuestionEnergy } from "../../src/lib/ai/intent";
import { EXEMPLARS } from "../../src/data/ai/exemplars";

let passed = 0;
let failed = 0;

function check(title: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${title}`);
  } else {
    failed++;
    console.error(`  ❌ ${title}${detail ? ` → ${detail}` : ""}`);
  }
}

function codes(text: string, opts?: Parameters<typeof checkThaiQuality>[1]): string[] {
  return checkThaiQuality(text, opts).issues.map((i) => i.code);
}

async function main() {
  console.log("\n✍️  ด่านตรวจคุณภาพภาษาไทยของคำอ่าน (A-01)");
  console.log("═".repeat(70));

  // ─────────────────────────────────────────────────────────────────
  // 1. กลุ่ม fatal — ต้องจับได้และแก้อัตโนมัติได้
  // ─────────────────────────────────────────────────────────────────
  console.log("\n🔴 1. กลุ่ม fatal (ผิดชัดเจน · แก้อัตโนมัติได้)");

  const broken = "เเสงสว่างนะค่ะ";
  const brokenCodes = codes(broken);
  check("จับ DOUBLE_SARA_E ใน \"เเสงสว่าง\"", brokenCodes.includes("DOUBLE_SARA_E"), brokenCodes.join(","));
  check("จับ PARTICLE_MISMATCH ใน \"นะค่ะ\"", brokenCodes.includes("PARTICLE_MISMATCH"), brokenCodes.join(","));
  check(
    "polishThai(\"เเสงสว่างนะค่ะ\") === \"แสงสว่างนะคะ\"",
    polishThai(broken) === "แสงสว่างนะคะ",
    `ได้ "${polishThai(broken)}"`
  );
  check("ผลตรวจรายงาน fatal = true", checkThaiQuality(broken).fatal);
  check("คะแนนต่ำกว่า 100 เมื่อมีปัญหา", checkThaiQuality(broken).score < 100);

  check("จับ DUP_DIACRITIC ใน \"ก่่อน\"", codes("ก่่อนหน้านี้").includes("DUP_DIACRITIC"));
  check("polishThai แก้วรรณยุกต์ซ้อน", polishThai("ก่่อนหน้านี้") === "ก่อนหน้านี้", polishThai("ก่่อนหน้านี้"));

  const invisible = "ความ​รัก﻿";
  check("จับ INVISIBLE_CHAR", codes(invisible).includes("INVISIBLE_CHAR"));
  check("polishThai ลบอักขระล่องหน", polishThai(invisible) === "ความรัก");

  check("จับ ORPHAN_DIACRITIC (วรรณยุกต์ลอย)", codes("ความ ่รัก").includes("ORPHAN_DIACRITIC"));

  // ─────────────────────────────────────────────────────────────────
  // 2. กันผลบวกลวง — ของที่ถูกต้องห้ามตก (บทเรียนตรงจาก consistency.ts)
  // ─────────────────────────────────────────────────────────────────
  console.log("\n🛡️  2. กันผลบวกลวง (ของที่ถูกต้อง ห้ามตก)");

  const cleanSamples = [
    "ขอบคุณค่ะ",
    "ใช่ไหมคะ",
    "แม่หมอเห็นแล้วนะคะ ว่าคุณพยายามมามากแค่ไหน",
    "ค่อย ๆ ก้าวทีละก้าว แล้วจะถึงแน่นอนค่ะ",
    "น้ำใจของคุณยังอยู่ครบ ไม่ได้หายไปไหนเลยค่ะ",
    "เก่งมากที่ผ่านมาได้ถึงตรงนี้",
  ];
  for (const sample of cleanSamples) {
    const result = checkThaiQuality(sample);
    check(`"${sample.slice(0, 28)}" ไม่มี issue`, result.issues.length === 0, result.issues.map((i) => i.code).join(","));
  }

  check(
    "polishThai ไม่แตะข้อความที่ถูกอยู่แล้ว",
    cleanSamples.every((s) => polishThai(s) === s)
  );

  const cardNames = "ไพ่ The Star คู่กับ Eight of Pentacles และ Page of Cups";
  check("ชื่อไพ่ 1909 ไม่ตก LATIN_LEAK", !codes(cardNames).includes("LATIN_LEAK"), codes(cardNames).join(","));
  check("คำอังกฤษนอกสำรับตก LATIN_LEAK", codes("พลังงาน energy ของคุณ").includes("LATIN_LEAK"));

  // ─────────────────────────────────────────────────────────────────
  // 3. กลุ่ม warn — สไตล์บ้านนี้
  // ─────────────────────────────────────────────────────────────────
  console.log("\n🟠 3. กลุ่ม warn (สไตล์บ้านนี้)");

  check("จับ MAIYAMOK_SPACING ใน \"ค่อยๆ\"", codes("ค่อยๆ ก้าวไป").includes("MAIYAMOK_SPACING"));
  check("polishThai เว้นวรรคไม้ยมกให้", polishThai("ค่อยๆ ก้าวไป") === "ค่อย ๆ ก้าวไป", polishThai("ค่อยๆ ก้าวไป"));
  check("polishThai เว้นวรรคหลังไม้ยมกด้วย", polishThai("ค่อย ๆก้าวไป") === "ค่อย ๆ ก้าวไป", polishThai("ค่อย ๆก้าวไป"));
  check("MAIYAMOK ไม่ใช่ fatal", !checkThaiQuality("ค่อยๆ ไป").fatal);

  check("จับ ROBOT_PHRASE", codes("ตามหลักการของไพ่ระบุว่าคุณจะโชคดี").includes("ROBOT_PHRASE"));

  const barnum =
    "ทุกอย่างจะดีขึ้นเอง ขอให้เชื่อมั่นในตัวเอง จักรวาลกำลังจัดสรรสิ่งที่ดีที่สุด จงเชื่อในสัญชาตญาณ";
  check("จับ BARNUM_PHRASE เมื่อเกิน 2 วลี", codes(barnum).includes("BARNUM_PHRASE"));
  check(
    "วลีกำกวม 1 วลี ยังไม่เตือน (ผ่อนตามเกณฑ์ภาคผนวก A.2)",
    !codes("ขอให้เชื่อมั่นในตัวเองนะคะ").includes("BARNUM_PHRASE")
  );
  // ── เกณฑ์รอบสอง (ISSUE-045): เพดานลดจาก 2 ➔ 1 · พจนานุกรมขยายเป็น 25 วลี ──
  check(
    "วลีกำกวม 2 วลี เตือนแล้ว (เพดานใหม่)",
    codes("ทุกอย่างจะผ่านไปได้ด้วยดี ขอแค่มีความหวังนะคะ").includes("BARNUM_PHRASE")
  );
  check(
    "จับการเลี่ยงตอบที่ปลอมเป็นคำแนะนำ",
    codes("เรื่องนี้ขึ้นอยู่กับตัวคุณเอง คำตอบอยู่ในใจคุณแล้วค่ะ").includes("BARNUM_PHRASE")
  );
  check(
    "จับ \"เมื่อถึงเวลาที่เหมาะสม\" ที่ใช้แทนกรอบเวลาจริง",
    codes("เมื่อถึงเวลาที่เหมาะสม เวลาจะเป็นเครื่องพิสูจน์เองค่ะ").includes("BARNUM_PHRASE")
  );
  check(
    "คำอ่านที่อ้างหน้าไพ่จริงต้องไม่ถูกจับผิด (กันผลบวกลวง)",
    !codes(
      "เรือใน 6 ดาบกำลังพาคุณออกจากน้ำเชี่ยวไปฝั่งที่นิ่งกว่า เรื่องนี้จะคลี่คลายด้วยการย้ายตัวเองออกมาค่ะ"
    ).includes("BARNUM_PHRASE")
  );

  const repetitive = Array.from({ length: 4 }, () => "พลังงานของไพ่ใบนี้กำลังบอกอะไรบางอย่าง").join(" ");
  check("จับ REPETITIVE_NGRAM เมื่อวลีเดิมซ้ำ", codes(repetitive).includes("REPETITIVE_NGRAM"));

  // ─────────────────────────────────────────────────────────────────
  // 4. ข้อยกเว้นตาม persona (ภาคผนวก A.3)
  // ─────────────────────────────────────────────────────────────────
  console.log("\n🎭 4. ข้อยกเว้นตามบุคลิกแม่หมอ");

  const playfulText = "โอ๊ยยย แกรรร ไพ่ใบนี้ฟ้องชััดมาก";
  check(
    "persona playful ผ่อน DUP_DIACRITIC ให้",
    !codes(playfulText, { personaId: "playful" }).includes("DUP_DIACRITIC")
  );
  check(
    "persona อื่นยังบังคับ DUP_DIACRITIC เต็ม",
    codes(playfulText, { personaId: "warm" }).includes("DUP_DIACRITIC")
  );
  check(
    "persona playful ยังบังคับ PARTICLE_MISMATCH เต็ม",
    codes("โอ๊ยยย จริงนะค่ะ", { personaId: "playful" }).includes("PARTICLE_MISMATCH")
  );

  // ─────────────────────────────────────────────────────────────────
  // 5. ความเร็ว — วิ่งบนสตรีมสด ห้ามเกิน 1ms ต่อ 2,000 ตัวอักษร
  // ─────────────────────────────────────────────────────────────────
  console.log("\n⚡ 5. ความเร็ว polishThai() (วิ่งบนสตรีมสด)");

  const longText = "แม่หมอเห็นพลังงานของคุณกำลังค่อย ๆ ฟื้นตัวขึ้นมาอีกครั้งนะคะ ".repeat(34).slice(0, 2000);
  check("ข้อความทดสอบยาว ~2,000 ตัวอักษร", longText.length >= 1900, `${longText.length}`);

  polishThai(longText); // warm-up (กัน JIT ทำให้รอบแรกช้าผิดปกติ)
  const ROUNDS = 200;
  const t0 = performance.now();
  for (let i = 0; i < ROUNDS; i++) polishThai(longText);
  const perCall = (performance.now() - t0) / ROUNDS;
  check(`polishThai ≤ 1ms ต่อ 2,000 ตัวอักษร (วัดได้ ${perCall.toFixed(3)}ms)`, perCall <= 1);

  check("polishThai เป็น idempotent", polishThai(polishThai(broken)) === polishThai(broken));

  // ─────────────────────────────────────────────────────────────────
  // 6. ทำงานกับวัตถุคำอ่านทั้งก้อน
  // ─────────────────────────────────────────────────────────────────
  console.log("\n📦 6. ตรวจ/แก้ทั้งวัตถุคำอ่าน (Reading object)");

  const readingLike = {
    opening: "เเม่หมอเห็นแล้วนะค่ะ",
    cards: [{ position: 0, headline: "ค่อยๆ ฟื้นตัว", reading: "พลังงานกำลังกลับมา" }],
    advice: ["พักผ่อนให้พอนะค่ะ"],
  };
  const deepResult = checkThaiQualityDeep(readingLike);
  check("checkThaiQualityDeep เจอ fatal ในฟิลด์ซ้อนชั้น", deepResult.fatal);
  const polishedReading = polishThaiDeep(readingLike);
  check("polishThaiDeep แก้ทุกฟิลด์", !checkThaiQualityDeep(polishedReading).fatal);
  check("polishThaiDeep คงรูปร่างวัตถุเดิม", polishedReading.cards[0].position === 0 && polishedReading.advice.length === 1);

  // ─────────────────────────────────────────────────────────────────
  // 7. 🔴 ภาษาไทยใน prompt / persona / โมดูลวิเคราะห์ ของเราเอง (A-03)
  // ─────────────────────────────────────────────────────────────────
  console.log("\n🔖 7. ภาษาไทยใน prompt และ persona ของเราเอง (A-03)");

  // prompt มีศัพท์เทคนิคอังกฤษ (Jungian, Gold Standard Exemplar ฯลฯ) โดยตั้งใจ
  // จึงตรวจเฉพาะกลุ่ม fatal + ไม้ยมก ซึ่งเป็นสิ่งที่โมเดลลอกไปเขียนตาม
  const promptResult = checkThaiQuality(SYSTEM_CORE_KNOWLEDGE, { barnumTolerance: 99 });
  const promptFatal = promptResult.issues.filter((i) => i.fatal);
  check(
    "SYSTEM_CORE_KNOWLEDGE ไม่มี fatal issue",
    promptFatal.length === 0,
    promptFatal.map((i) => `${i.code}:${i.sample ?? ""}`).join(" · ")
  );
  const promptMaiyamok = promptResult.issues.find((i) => i.code === "MAIYAMOK_SPACING");
  check(
    "SYSTEM_CORE_KNOWLEDGE เว้นวรรคไม้ยมกถูกทุกจุด",
    !promptMaiyamok,
    promptMaiyamok?.sample
  );

  for (const persona of PERSONAS) {
    const res = checkThaiQuality(`${persona.tagline}\n${persona.voice}`, {
      personaId: persona.id,
      barnumTolerance: 99,
    });
    const blocking = res.issues.filter((i) => i.fatal || i.code === "MAIYAMOK_SPACING");
    check(
      `persona "${persona.id}" ภาษาไทยสะอาด`,
      blocking.length === 0,
      blocking.map((i) => `${i.code}:${i.sample ?? ""}`).join(" · ")
    );
  }

  // โมดูลวิเคราะห์ที่ผลิตข้อความไทยเข้า prompt โดยตรง
  const ritual = generateMindfulMicroRitual(["น้ำ"], "ไฟ");
  const ritualIssues = checkThaiQualityDeep(ritual, { barnumTolerance: 99 }).issues.filter(
    (i) => i.fatal || i.code === "MAIYAMOK_SPACING"
  );
  check(
    "generateMindfulMicroRitual ภาษาไทยสะอาด",
    ritualIssues.length === 0,
    ritualIssues.map((i) => i.code).join(",")
  );

  const intent = diagnoseQuestionEnergy("เขาจะกลับมาไหม", { situation: "เลิกกันมา 2 เดือน" });
  const intentIssues = checkThaiQualityDeep(intent, { barnumTolerance: 99 }).issues.filter(
    (i) => i.fatal || i.code === "MAIYAMOK_SPACING"
  );
  check(
    "diagnoseQuestionEnergy ภาษาไทยสะอาด",
    intentIssues.length === 0,
    intentIssues.map((i) => i.code).join(",")
  );

  // ─────────────────────────────────────────────────────────────────
  // 8. คลังตัวอย่างคำอ่าน 8 ชิ้น (B-02 Exemplar Bank)
  // ─────────────────────────────────────────────────────────────────
  console.log("\n📚 8. คลังตัวอย่างคำอ่าน 8 ชิ้น (B-02 Exemplar Bank)");
  check("มีตัวอย่างครบ 8 ชิ้น", EXEMPLARS.length === 8, `พบ ${EXEMPLARS.length} ชิ้น`);
  for (const ex of EXEMPLARS) {
    const res = checkThaiQualityDeep(ex.reading);
    check(
      `ตัวอย่าง "${ex.id}" (${ex.category} · ${ex.cardCount} ใบ) ภาษาไทย 100/100 (0 issues)`,
      res.score === 100 && res.issues.length === 0,
      res.issues.map((i) => `${i.code}:${i.sample ?? ""}`).join(" · ")
    );
  }

  // ─────────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(70));
  console.log(`📊 สรุป: ผ่าน ${passed} · ตก ${failed}`);
  if (failed > 0) {
    console.error("\n❌ ด่านภาษาไทยไม่ผ่าน — แก้ให้ครบก่อน commit");
    process.exit(1);
  }
  console.log("✨ ด่านภาษาไทยผ่านครบทุกข้อ");
}

main().catch((err) => {
  console.error("💥 test-thai-quality ล้มเหลว:", err);
  process.exit(1);
});
