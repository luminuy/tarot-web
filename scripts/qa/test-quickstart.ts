import { SPREADS } from "../../src/data/spreads";

/**
 * QA — ตรวจว่าตารางแมป หมวด × จำนวนใบ ใน QuickStartWelcome ชี้ไปหา spread ที่มีจริง
 * (คัดลอกตารางมาตรวจตรง ๆ เพราะ DEPTH_OPTIONS ไม่ได้ export จาก component —
 *  ถ้าแก้ตารางในคอมโพเนนต์ ต้องแก้ที่นี่ให้ตรงกันด้วย)
 * รันด้วย: npx tsx scripts/qa/test-quickstart.ts
 */

const DEPTH_OPTIONS: Record<string, { cards: number; spreadId: string }[]> = {
  love: [
    { cards: 1, spreadId: "quick" },
    { cards: 3, spreadId: "three-card" },
    { cards: 5, spreadId: "love" },
  ],
  work: [
    { cards: 1, spreadId: "quick" },
    { cards: 3, spreadId: "three-card" },
    { cards: 5, spreadId: "career" },
  ],
  money: [
    { cards: 1, spreadId: "quick" },
    { cards: 3, spreadId: "three-card" },
  ],
  general: [
    { cards: 1, spreadId: "quick" },
    { cards: 3, spreadId: "three-card" },
  ],
};

let pass = 0;
let fail = 0;
function check(label: string, ok: boolean) {
  if (ok) {
    pass++;
    console.log(`✅ ${label}`);
  } else {
    fail++;
    console.log(`❌ ${label}`);
  }
}

for (const [category, options] of Object.entries(DEPTH_OPTIONS)) {
  for (const opt of options) {
    const spread = SPREADS.find((s) => s.id === opt.spreadId);
    check(`${category} + ${opt.cards} ใบ → spread "${opt.spreadId}" มีอยู่จริง`, !!spread);
    if (spread) {
      check(
        `${category} + ${opt.cards} ใบ → "${opt.spreadId}" มีจำนวนตำแหน่งตรงกับป้าย (${opt.cards} ใบ)`,
        spread.positions.length === opt.cards,
      );
    }
  }
}

console.log(`\n${pass}/${pass + fail} ผ่าน`);
if (fail > 0) process.exit(1);
