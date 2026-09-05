/**
 * scripts/qa/test-feature-gating.ts
 * QA — ตรวจสอบระบบล็อกฟีเจอร์พรีเมียม (Freemium Gating & Locked State)
 * รันด้วย: npx tsx scripts/qa/test-feature-gating.ts
 */

import { SPREADS } from "../../src/data/spreads";
import { PERSONAS } from "../../src/data/personas";
import {
  STANDARD_SPREAD_IDS,
  isStandardSpread,
  MASTER_PERSONA_IDS,
  isMasterPersona,
} from "../../src/lib/entitlement/limits";
import { UPGRADE_COPY } from "../../src/lib/entitlement/copy";

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

function main() {
  console.log("🧪 [QA] ระบบล็อกฟีเจอร์พรีเมียม (ผังใหญ่ & ปรมาจารย์ลับ)\n");

  // ── 1. ผังมาตรฐาน 10 ผัง สำหรับบัญชีฟรี ──
  check("ผังมาตรฐานมีจำนวนตรงตามตารางเปรียบเทียบ (10 ผัง)", STANDARD_SPREAD_IDS.size === 10);

  const standardExpected = [
    "daily",
    "quick",
    "yes-no",
    "three-card",
    "situation-solution",
    "mind-body-spirit",
    "how-they-feel",
    "family",
    "luck",
    "study",
  ];
  for (const id of standardExpected) {
    check(`ผังมาตรฐาน ${id} เป็น free spread`, isStandardSpread(id));
  }

  // ── 2. ผังใหญ่ 15 ผังต้องถูกล็อกสำหรับบัญชีฟรี ──
  const grandExpected = [
    "celtic-cross",
    "year-ahead",
    "chakra",
    "weekly",
    "decision",
    "soulmate",
    "career",
    "career-switch",
    "love",
    "money",
    "monthly",
    "ex-reconciliation",
    "inner-potential",
    "love-six",
    "monthly-ten",
  ];
  for (const id of grandExpected) {
    check(`ผังใหญ่ ${id} ถูกล็อกสำหรับบัญชีฟรี`, !isStandardSpread(id));
  }

  // รวมต้องครบ 25 ผังพอดี
  check("จำนวนผังทั้งหมดในระบบต้องเท่ากับ 25 ผัง", SPREADS.length === 25);
  check(
    "ผังทั้งหมดต้องถูกแบ่งเป็น Standard (10) + Grand (15) ครบ 25 ผัง",
    STANDARD_SPREAD_IDS.size + (SPREADS.length - STANDARD_SPREAD_IDS.size) === 25
  );

  // ── 3. แม่หมอพื้นฐาน 3 ท่าน vs ปรมาจารย์ลับ 2 ท่าน ──
  check("แม่หมอทั้งหมดในระบบมี 5 ท่าน", PERSONAS.length === 5);
  check("ปรมาจารย์ลับมี 2 ท่าน", MASTER_PERSONA_IDS.size === 2);
  check("master (อาจารย์สายฟันธง) เป็นปรมาจารย์ลับ", isMasterPersona("master"));
  check("mystic (แม่หมอสายพลัง) เป็นปรมาจารย์ลับ", isMasterPersona("mystic"));
  check("warm (แม่หมอใจดี) เป็นแม่หมอพื้นฐาน", !isMasterPersona("warm"));
  check("playful (แม่หมอเพื่อนซี้) เป็นแม่หมอพื้นฐาน", !isMasterPersona("playful"));
  check("direct (แม่หมอพูดตรง) เป็นแม่หมอพื้นฐาน", !isMasterPersona("direct"));

  // ── 4. Copy และ Workflow การปลดล็อกใน AccessDialog ──
  const grandCopy = UPGRADE_COPY.grand_spread;
  check("มี copy สำหรับ grand_spread", Boolean(grandCopy));
  check("grand_spread มี primaryAction เป็น credits", grandCopy?.primaryAction === "credits");
  check("grand_spread มีข้อความเริ่ม 59.-", grandCopy?.primaryLabel.includes("59.-") || grandCopy?.primaryLabel.includes("เริ่ม"));

  const masterCopy = UPGRADE_COPY.master_persona;
  check("มี copy สำหรับ master_persona", Boolean(masterCopy));
  check("master_persona มี primaryAction เป็น credits", masterCopy?.primaryAction === "credits");
  check("master_persona มีข้อความเริ่ม 59.-", masterCopy?.primaryLabel.includes("59.-") || masterCopy?.primaryLabel.includes("เริ่ม"));

  console.log(`\nสรุป: ผ่าน ${pass} ข้อ, ล้มเหลว ${fail} ข้อ\n`);
  if (fail > 0) process.exit(1);
}

main();
