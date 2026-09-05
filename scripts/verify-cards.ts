import { DECK } from "../src/data/cards";
import type { Category, TarotCard } from "../src/data/cards/types";
import { RELATED_CARDS } from "../src/data/cards/related.generated";

/**
 * ตรวจความสมบูรณ์ของสำรับก่อนขึ้นเว็บจริง
 * ข้อมูลไพ่ถูกเขียนแยกหลายไฟล์ จึงต้องมีที่เดียวที่ยืนยันว่าทั้งสำรับใช้ได้จริง
 * รันด้วย: pnpm verify:cards
 */

const CATEGORIES: Category[] = ["general", "love", "work", "money", "self"];
const errors: string[] = [];
const warnings: string[] = [];

const fail = (msg: string) => errors.push(msg);
const warn = (msg: string) => warnings.push(msg);

if (DECK.length !== 78) fail(`สำรับมี ${DECK.length} ใบ ต้องมี 78 ใบ`);

const ids = new Set<string>();
for (const card of DECK) {
  if (ids.has(card.id)) fail(`id ซ้ำ: ${card.id}`);
  ids.add(card.id);
}

/** ลำดับสำรับต้องตรงกับที่ระบบใช้จั่วไพ่ ไม่งั้นผลเปิดไพ่เก่าทั้งหมดเพี้ยน */
const expectedOrder = [
  ...Array.from({ length: 22 }, (_, i) => `major-${String(i).padStart(2, "0")}`),
  ...(["wands", "cups", "swords", "pentacles"] as const).flatMap((suit) =>
    Array.from({ length: 14 }, (_, i) => `${suit}-${String(i + 1).padStart(2, "0")}`),
  ),
];
expectedOrder.forEach((expected, i) => {
  if (DECK[i]?.id !== expected) {
    fail(`ตำแหน่ง ${i} ควรเป็น ${expected} แต่พบ ${DECK[i]?.id ?? "ว่าง"}`);
  }
});

const allTexts = new Map<string, string>();

for (const card of DECK as TarotCard[]) {
  const where = `${card.id} (${card.nameEn})`;

  if (!card.nameTh?.trim()) fail(`${where}: ไม่มี nameTh`);
  if (card.image !== `${card.id}.jpg`) fail(`${where}: image ควรเป็น ${card.id}.jpg แต่เป็น ${card.image}`);
  if (!card.numerology?.trim()) fail(`${where}: ไม่มี numerology`);
  if (!card.astrology?.trim()) fail(`${where}: ไม่มี astrology`);

  const up = card.keywords?.upright ?? [];
  const rev = card.keywords?.reversed ?? [];
  if (up.length < 4 || up.length > 6) warn(`${where}: keywords.upright มี ${up.length} คำ (ควร 4-6)`);
  if (rev.length < 3 || rev.length > 5) warn(`${where}: keywords.reversed มี ${rev.length} คำ (ควร 3-5)`);

  for (const category of CATEGORIES) {
    const entry = card.meanings?.[category];
    if (!entry) {
      fail(`${where}: ขาดหมวด ${category}`);
      continue;
    }
    for (const orientation of ["upright", "reversed"] as const) {
      const text = entry[orientation]?.trim();
      if (!text) {
        fail(`${where}: ขาดข้อความ ${category}.${orientation}`);
        continue;
      }
      if (text.length < 80) warn(`${where}: ${category}.${orientation} สั้นเกินไป (${text.length} ตัวอักษร)`);

      const seenAt = allTexts.get(text);
      if (seenAt) fail(`ข้อความซ้ำระหว่าง ${seenAt} กับ ${where} ${category}.${orientation}`);
      else allTexts.set(text, `${where} ${category}.${orientation}`);
    }
  }
}

const tally = { yes: 0, no: 0, maybe: 0 };
for (const card of DECK) tally[card.yesNo]++;
if (Math.abs(tally.yes - tally.no) > 20) {
  warn(
    `yesNo เอียงไปด้านเดียวมาก (ใช่ ${tally.yes} / ไม่ใช่ ${tally.no} / ไม่แน่ ${tally.maybe}) — spread ใช่/ไม่ใช่ จะตอบเอียงผิดปกติ`,
  );
}

// ตรวจแผนที่ไพ่ใกล้เคียง (Rule 14 Zero Fabricated Cards) — ทุก id ต้องมีจริงในสำรับ 78 ใบ
if (Object.keys(RELATED_CARDS).length !== 78) fail(`RELATED_CARDS ต้องมีครบ 78 คีย์ (พบ ${Object.keys(RELATED_CARDS).length})`);
for (const [id, refs] of Object.entries(RELATED_CARDS)) {
  if (!ids.has(id)) fail(`RELATED_CARDS มีคีย์ที่ไม่มีในสำรับ: ${id}`);
  if (refs.length !== 4) fail(`${id} ต้องมีไพ่ใกล้เคียง 4 ใบพอดี (พบ ${refs.length})`);
  if (new Set(refs).size !== 4) fail(`${id} มีไพ่ซ้ำในรายการ`);
  if (refs.includes(id as any)) fail(`${id} อ้างถึงตัวเอง`);
  for (const r of refs) if (!ids.has(r)) fail(`${id} อ้างไพ่ที่ไม่มีจริง: ${r}`);
}

console.log(`ตรวจไพ่ ${DECK.length} ใบ · ข้อความความหมายทั้งหมด ${allTexts.size} ข้อความ · แผนที่ไพ่ใกล้เคียง 78×4 ใบ`);
console.log(`yesNo — ใช่ ${tally.yes} / ไม่ใช่ ${tally.no} / ไม่แน่ ${tally.maybe}`);

if (warnings.length) {
  console.log(`\nคำเตือน ${warnings.length} รายการ:`);
  for (const w of warnings.slice(0, 25)) console.log(`  · ${w}`);
  if (warnings.length > 25) console.log(`  · ...อีก ${warnings.length - 25} รายการ`);
}

if (errors.length) {
  console.error(`\nพบข้อผิดพลาด ${errors.length} รายการ:`);
  for (const e of errors.slice(0, 40)) console.error(`  ✗ ${e}`);
  process.exit(1);
}

console.log("\nสำรับผ่านการตรวจทั้งหมด");
