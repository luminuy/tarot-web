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
// ด่านกันไพ่ไขว้เบียดคอลัมน์ข้างเคียง (บทเรียน ISSUE-032)
//
// `SpreadPositionMap.tsx` วาดไพ่ด้วย width 13% ของกรอบ · aspect-ratio 2/3
// และจัดกึ่งกลางด้วย translate(-50%, -50%)
// ใบที่ `rotate: 90` สลับด้าน กล่องครอบจึงกว้าง 19.5% แทน 13% — กว้างขึ้น 50%
// ความสูงกรอบคือ 78% ของความกว้าง พิกัด y จึงคูณ 0.78 เมื่อเทียบหน่วยเดียวกับ x
//
// ใบไขว้คือใบเดียวที่กว้างผิดจากพวก จึงเป็นใบที่เบียดคอลัมน์ข้างเคียงได้โดยไม่มีใครเห็น
// `monthly-ten` หลุดด่านนี้มาแล้ว: ลอกพิกัดจาก celtic-cross แล้วเลื่อนแกนไขว้
// 0.32 → 0.35 แต่ลืมเลื่อนใบที่ 6 ตาม ระยะปลอดภัยเดิม 0.0175 จึงกลายเป็นทับกัน
// 0.0125 (วัดจริงบน production = 3.6px บนจอ 320px · 4.3px บนจอ 375px)
const CARD_W = 0.13; // width: 13%
const CARD_H = CARD_W * 1.5; // aspect-ratio: 2 / 3
const Y_SCALE = 0.78; // ความสูงกรอบ = 78% ของความกว้าง

function boxOf(pos: { x: number; y: number; rotate?: number }) {
  const rotated = pos.rotate === 90 || pos.rotate === 270;
  const halfW = (rotated ? CARD_H : CARD_W) / 2;
  const halfH = (rotated ? CARD_W : CARD_H) / 2;
  const cy = pos.y * Y_SCALE;
  return { left: pos.x - halfW, right: pos.x + halfW, top: cy - halfH, bottom: cy + halfH };
}

for (const spread of SPREADS) {
  const label = `spread "${spread.id}"`;

  for (const pos of spread.positions) {
    const box = boxOf(pos);

    // ไพ่ทุกใบต้องอยู่ในกรอบ ไม่ล้นซ้าย-ขวา
    check(
      `${label} ตำแหน่ง ${pos.index}: ไม่ล้นกรอบแนวนอน (${box.left.toFixed(3)}..${box.right.toFixed(3)})`,
      box.left >= 0 && box.right <= 1,
    );

    if (pos.rotate !== 90 && pos.rotate !== 270) continue;

    // ใบไขว้ต้องไม่ทับใบอื่น ยกเว้นใบที่วางพิกัดเดียวกันซึ่งคือคู่ไขว้ที่ตั้งใจ
    for (const other of spread.positions) {
      if (other.index === pos.index) continue;
      if (other.x === pos.x && other.y === pos.y) continue;

      const b = boxOf(other);
      const overlapX = Math.min(box.right, b.right) - Math.max(box.left, b.left);
      const overlapY = Math.min(box.bottom, b.bottom) - Math.max(box.top, b.top);
      check(
        `${label}: ใบไขว้ ${pos.index} ไม่เบียดใบ ${other.index} (ระยะแนวนอน ${(-overlapX).toFixed(4)})`,
        overlapX <= 0 || overlapY <= 0,
      );
    }
  }
}

console.log(`\n${pass}/${pass + fail} ผ่าน (${SPREADS.length} spreads, ${SPREADS.reduce((a, s) => a + s.positions.length, 0)} ตำแหน่งรวม)`);
if (fail > 0) process.exit(1);
