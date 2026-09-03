import { computeDailyCard } from "../../src/lib/tarot/daily-card";
import { DECK } from "../../src/data/cards";

/**
 * QA — ไพ่ประจำวันของทุกคน ต้อง deterministic + กระจายทั่วสำรับ
 * รันด้วย: npx tsx scripts/qa/test-daily-card.ts
 */

let pass = 0;
let fail = 0;
const ok = (cond: boolean, label: string) => {
  if (cond) {
    pass++;
    console.log(`✅ ${label}`);
  } else {
    fail++;
    console.log(`❌ ${label}`);
  }
};

async function main() {
  // 1. deterministic — วันเดียวกันต้องได้ไพ่เดิมเป๊ะทุกครั้ง
  const a = await computeDailyCard("2026-09-03");
  const b = await computeDailyCard("2026-09-03");
  ok(a.cardId === b.cardId && a.proof === b.proof, "วันเดียวกัน → ไพ่เดิม + proof เดิม");

  // 2. ดัชนีอยู่ในช่วง 0..77 และตรงกับ cardId จริง
  ok(a.cardIndex >= 0 && a.cardIndex < DECK.length, "ดัชนีไพ่อยู่ในช่วง 0-77");
  ok(DECK[a.cardIndex].id === a.cardId, "ดัชนีตรงกับ cardId");

  // 3. proof เป็น SHA-256 hex 64 ตัว
  ok(/^[0-9a-f]{64}$/.test(a.proof), "proof เป็น SHA-256 hex 64 ตัว");

  // 4. ข้อมูลครบสำหรับ UI
  ok(
    Boolean(a.nameTh && a.nameEn && a.image && a.message) && a.keywords.length > 0,
    "ข้อมูลครบสำหรับ UI (ชื่อ/ภาพ/คำสำคัญ/ข้อความ)",
  );

  // 5. การกระจาย — สุ่ม 365 วันติดต่อกัน ต้องแตะไพ่อย่างน้อย ~40 ใบจาก 78 (ไม่กระจุก)
  const seen = new Set<number>();
  const base = new Date("2026-01-01T00:00:00Z");
  for (let i = 0; i < 365; i++) {
    const d = new Date(base.getTime() + i * 86400000).toISOString().slice(0, 10);
    seen.add((await computeDailyCard(d)).cardIndex);
  }
  ok(seen.size >= 45, `กระจายทั่วสำรับใน 1 ปี (แตะ ${seen.size}/78 ใบ)`);

  // 6. วันต่างกันมักได้ไพ่ต่างกัน (ไม่ค้างใบเดิม)
  const c = await computeDailyCard("2026-09-04");
  ok(c.cardId !== a.cardId || c.proof !== a.proof, "วันถัดไป → proof ต่าง (ไม่ค้าง)");

  console.log(`\n${pass}/${pass + fail} ผ่าน`);
  if (fail > 0) process.exit(1);
}

main();
