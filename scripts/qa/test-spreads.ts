import { SPREADS } from "../../src/data/spreads";
import { DECK_SIZE } from "../../src/data/cards";

/**
 * QA — ตรวจความสมบูรณ์ของทุก spread
 * รันด้วย: npx tsx scripts/qa/test-spreads.ts
 */

let pass = 0;
let fail = 0;
function check(label: string, ok: boolean) {
  if (ok) {
    pass++;
  } else {
    fail++;
    console.log(`❌ ${label}`);
  }
}

check("มี spread อย่างน้อย 1 แบบ", SPREADS.length > 0);

const seenIds = new Set<string>();
for (const spread of SPREADS) {
  const label = `${spread.id} (${spread.nameTh})`;

  check(`${label}: id ไม่ซ้ำ`, !seenIds.has(spread.id));
  seenIds.add(spread.id);

  check(`${label}: มีตำแหน่งอย่างน้อย 1 ตำแหน่ง`, spread.positions.length > 0);
  check(`${label}: จำนวนไพ่ไม่เกินขนาดสำรับ (${DECK_SIZE})`, spread.positions.length <= DECK_SIZE);

  // index ของตำแหน่งต้องเรียงต่อกันตั้งแต่ 0 ไม่มีช่องว่างหรือซ้ำ
  const indices = spread.positions.map((p) => p.index).sort((a, b) => a - b);
  const expectedIndices = spread.positions.map((_, i) => i);
  check(
    `${label}: index ของตำแหน่งเรียงต่อกันตั้งแต่ 0 ไม่มีช่องว่าง`,
    JSON.stringify(indices) === JSON.stringify(expectedIndices),
  );

  for (const pos of spread.positions) {
    check(`${label} ตำแหน่ง ${pos.index}: มีชื่อ`, !!pos.nameTh?.trim());
    check(`${label} ตำแหน่ง ${pos.index}: มีความหมาย`, !!pos.meaning?.trim());
    check(`${label} ตำแหน่ง ${pos.index}: x อยู่ในช่วง 0-1`, pos.x >= 0 && pos.x <= 1);
    check(`${label} ตำแหน่ง ${pos.index}: y อยู่ในช่วง 0-1`, pos.y >= 0 && pos.y <= 1);
  }

  check(`${label}: credits ไม่ติดลบ`, spread.credits >= 0);
  check(`${label}: มี description`, !!spread.description?.trim());
  check(`${label}: มี tagline`, !!spread.tagline?.trim());
}

// เช็คจำนวนตำแหน่งของ spread สำคัญให้ตรงตามที่โฆษณาไว้
const expectedCounts: Record<string, number> = {
  daily: 1,
  quick: 1,
  "yes-no": 3,
  "three-card": 3,
  "situation-solution": 3,
  "mind-body-spirit": 3,
  love: 5,
  "how-they-feel": 4,
  "ex-reconciliation": 4,
  soulmate: 5,
  career: 5,
  money: 4,
  "career-switch": 5,
  decision: 5,
  "inner-potential": 4,
  weekly: 7,
  monthly: 4,
  chakra: 7,
  "celtic-cross": 10,
  "year-ahead": 12,
};
for (const [id, count] of Object.entries(expectedCounts)) {
  const spread = SPREADS.find((s) => s.id === id);
  if (!spread) {
    fail++;
    console.log(`❌ ไม่พบ spread "${id}" ที่คาดว่าต้องมี`);
    continue;
  }
  check(`spread "${id}" มี ${count} ตำแหน่งตามที่ตั้งใจไว้`, spread.positions.length === count);
}

console.log(`\n${pass}/${pass + fail} ผ่าน (${SPREADS.length} spreads, ${SPREADS.reduce((a, s) => a + s.positions.length, 0)} ตำแหน่งรวม)`);
if (fail > 0) process.exit(1);
