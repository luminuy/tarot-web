import { SPREADS } from "../../src/data/spreads";
import { DECK_SIZE } from "../../src/data/cards";
import {
  mapLayout,
  boxOf,
  MAP_CARD_W_MIN,
  MAP_MIN_COLUMN_PX,
  MAP_CARD_MIN_PX,
} from "../../src/lib/tarot/spread-map-geometry";

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
  "love-six": 6,
  "monthly-ten": 10,
  family: 5,
  luck: 4,
  study: 4,
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


// ──────────────────────────────────────────────────────────────────────────────
// ด่านกันไพ่ทับกันในแผนผัง SEO (บทเรียน ISSUE-032 · ISSUE-034)
//
// ⚠️ รุ่นก่อนหน้าของด่านนี้มีช่องโหว่ 2 ข้อที่ทำให้ ISSUE-034 หลุดมาได้:
//
//   1. **คัดลอกตัวเลขมาเขียนไว้เอง** (`CARD_W = 0.13`, `Y_SCALE = 0.78`)
//      แทนที่จะอ่านจากที่เดียวกับคอมโพเนนต์ที่วาดจริง
//      ด่านจึงรับรอง "ผังในจินตนาการ" ไม่ใช่ผังที่ผู้ใช้เห็น
//
//   2. **ตรวจเฉพาะใบไขว้** (`rotate: 90`) เทียบกับใบอื่น
//      ไพ่ธรรมดาที่วางเรียงลงมาในคอลัมน์เดียวกันจึงทับกันได้โดยไม่มีใครเห็น
//      ซึ่งเป็นเคสที่เกิดจริงใน 4 ผัง: chakra (ทับ 48–52%) · year-ahead (24–44%) ·
//      celtic-cross และ monthly-ten (20%)
//
// รอบนี้ตรวจ **ทุกคู่** ด้วยเรขาคณิตชุดเดียวกับที่ `SpreadPositionMap.tsx` ใช้วาดจริง
// (`@/lib/tarot/spread-map-geometry`) จึงไม่มีทางเลื่อนออกจากกันได้อีก
for (const spread of SPREADS) {
  const label = `spread "${spread.id}"`;
  const layout = mapLayout(spread.positions);

  // การ์ดต้องไม่เล็กจน `min-width: 26px` เข้ามาแทนที่ความกว้างที่คำนวณไว้
  // ถ้าเกิดขึ้น การ์ดจะกว้างกว่าที่เรขาคณิตคิด แล้วกลับมาทับกันโดยด่านนี้มองไม่เห็น
  check(
    `${label}: การ์ดไม่เล็กกว่าพื้น min-width (${(layout.cardW * MAP_MIN_COLUMN_PX).toFixed(1)}px บนคอลัมน์ ${MAP_MIN_COLUMN_PX}px)`,
    layout.cardW >= MAP_CARD_W_MIN - 1e-9 &&
      layout.cardW * MAP_MIN_COLUMN_PX >= MAP_CARD_MIN_PX - 1e-9,
  );

  for (const pos of spread.positions) {
    const box = boxOf(pos, layout);

    // ไพ่ทุกใบต้องอยู่ในกรอบ ไม่ล้นซ้าย-ขวา-บน-ล่าง
    check(
      `${label} ตำแหน่ง ${pos.index}: ไม่ล้นกรอบแนวนอน (${box.left.toFixed(3)}..${box.right.toFixed(3)})`,
      box.left >= -1e-9 && box.right <= 1 + 1e-9,
    );
    check(
      `${label} ตำแหน่ง ${pos.index}: ไม่ล้นกรอบแนวตั้ง (${box.top.toFixed(3)}..${box.bottom.toFixed(3)} ในกรอบสูง ${layout.boxHeight.toFixed(3)})`,
      box.top >= -1e-9 && box.bottom <= layout.boxHeight + 1e-9,
    );
  }

  // ไพ่ทุกคู่ต้องไม่ทับกัน ยกเว้นคู่ที่วางพิกัดเดียวกันซึ่งคือคู่ไขว้ที่ตั้งใจ
  for (let i = 0; i < spread.positions.length; i++) {
    for (let j = i + 1; j < spread.positions.length; j++) {
      const a = spread.positions[i];
      const b = spread.positions[j];
      if (a.x === b.x && a.y === b.y) continue;

      const A = boxOf(a, layout);
      const B = boxOf(b, layout);
      const overlapX = Math.min(A.right, B.right) - Math.max(A.left, B.left);
      const overlapY = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top);
      const deep = Math.min(overlapX, overlapY);

      check(
        `${label}: ใบ ${a.index + 1} ไม่ทับใบ ${b.index + 1} (ซ้อนลึก ${deep > 0 ? deep.toFixed(4) : "0"})`,
        overlapX <= 1e-9 || overlapY <= 1e-9,
      );
    }
  }
}

console.log(`\n${pass}/${pass + fail} ผ่าน (${SPREADS.length} spreads, ${SPREADS.reduce((a, s) => a + s.positions.length, 0)} ตำแหน่งรวม)`);
if (fail > 0) process.exit(1);
