/**
 * scripts/qa/test-no-fake-card.ts
 * QA — ตรวจสอบระบบป้องกันไพ่ปลอม (No Fabricated 'The Fool' Fallback)
 * รันด้วย: npx tsx scripts/qa/test-no-fake-card.ts
 */

import { cardByIndex, cardById, TOTAL_CARDS } from "../../src/data/cards";
import { resolveCardByIndex } from "../../src/lib/content/overrides";

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
  console.log("🧪 [QA] ตรวจสอบระบบป้องกันไพ่ปลอม (No Fabricated 'The Fool')\n");

  // ── 1. cardByIndex ต้องไม่คืน The Fool เมื่อส่ง undefined / null / นอกขอบเขต ──
  check("cardByIndex(undefined) คืน undefined (ห้ามคืน The Fool)", cardByIndex(undefined) === undefined);
  check("cardByIndex(null) คืน undefined", cardByIndex(null) === undefined);
  check("cardByIndex(-1) คืน undefined", cardByIndex(-1) === undefined);
  check("cardByIndex(78) คืน undefined (นอกสำรับ 0-77)", cardByIndex(78) === undefined);
  check("cardByIndex(999) คืน undefined", cardByIndex(999) === undefined);
  check("cardByIndex(NaN) คืน undefined", cardByIndex(Number.NaN) === undefined);

  // ── 2. cardByIndex(0) ต้องคืน The Fool ของจริงเฉพาะเมื่อจับได้ 0 จริงๆ ──
  const realFool = cardByIndex(0);
  check("cardByIndex(0) คืนไพ่จริง", realFool !== undefined);
  check("cardByIndex(0) เป็น major-00", realFool?.id === "major-00");
  check("cardByIndex(0) มีชื่อไทย คนเขลา", realFool?.nameTh === "คนเขลา");
  check("cardByIndex(0) มีชื่ออังกฤษ The Fool", realFool?.nameEn === "The Fool");

  // ── 3. ไพ่ทุกใบ 0..77 ต้องดึงได้ถูกต้อง ไม่สูญหาย ──
  check(`สำรับมีไพ่ครบ ${TOTAL_CARDS} ใบ`, TOTAL_CARDS === 78);
  let allValid = true;
  for (let i = 0; i < 78; i++) {
    const c = cardByIndex(i);
    if (!c || !c.id || !c.nameTh) {
      allValid = false;
      break;
    }
  }
  check("ไพ่ทุกใบ index 0..77 ดึงได้สมบูรณ์", allValid);

  // ── 4. resolveCardByIndex ต้องคืน undefined เมื่อ index ผิดปกติ ──
  const emptyOverrideDoc = { cards: {} };
  check("resolveCardByIndex คืน undefined เมื่อ index เป็น undefined", resolveCardByIndex(emptyOverrideDoc, undefined) === undefined);
  check("resolveCardByIndex คืน undefined เมื่อ index เป็น null", resolveCardByIndex(emptyOverrideDoc, null) === undefined);
  check("resolveCardByIndex คืน undefined เมื่อ index เป็น 999", resolveCardByIndex(emptyOverrideDoc, 999) === undefined);
  check("resolveCardByIndex คืนไพ่จริงเมื่อ index เป็น 0", resolveCardByIndex(emptyOverrideDoc, 0)?.id === "major-00");

  // ── 5. cardById ต้องคืน undefined เมื่อ id ไม่ถูกต้อง ──
  check("cardById('') คืน undefined", cardById("") === undefined);
  check("cardById('invalid-card-id') คืน undefined", cardById("invalid-card-id") === undefined);
  check("cardById('major-00') คืน The Fool จริง", cardById("major-00")?.id === "major-00");

  console.log(`\nผลการทดสอบ: ผ่าน ${pass} ข้อ, ไม่ผ่าน ${fail} ข้อ`);
  if (fail > 0) process.exit(1);
}

main();
