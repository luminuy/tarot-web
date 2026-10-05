import { DECK, cardById } from "../../src/data/cards";
import { CARD_THEMES, THEME_IDS } from "../../src/data/cards/themes";
import { analyzeRelations, MAX_PAIRS } from "../../src/lib/tarot/relations";

/**
 * QA — แผนที่ความเชื่อมโยงของไพ่ + แก่นเรื่อง 78 ใบ (REFLECTION_JOURNAL_PLAN 1.1)
 * รันด้วย: npx tsx scripts/qa/test-card-relations.ts
 *
 * ⚠️ ยังไม่ได้ลงทะเบียนใน `repo:verify` — เพิ่มตอนเปิด PR พร้อมแก้ตัวเลขจำนวนด่านในเอกสาร (test-docs-numbers)
 */

let pass = 0;
let fail = 0;
function check(label: string, ok: boolean) {
  if (ok) pass++;
  else {
    fail++;
    console.log(`❌ ${label}`);
  }
}

// ── แก่นเรื่องครบ 78 × 2 ทิศ และไม่มีรหัสแปลกปลอม ──
for (const card of DECK) {
  const pair = CARD_THEMES[card.id];
  check(`${card.id}: มีแก่นเรื่อง`, Boolean(pair));
  if (!pair) continue;
  for (const [dir, list] of [["หัวตั้ง", pair[0]], ["กลับหัว", pair[1]]] as const) {
    check(`${card.id} ${dir}: 1–3 แก่นเรื่อง`, list.length >= 1 && list.length <= 3);
    check(`${card.id} ${dir}: ไม่ซ้ำ`, new Set(list).size === list.length);
    check(`${card.id} ${dir}: รหัสถูกต้อง`, list.every((t) => (THEME_IDS as readonly string[]).includes(t)));
  }
}
check("ไม่มีรหัสไพ่เกินสำรับ", Object.keys(CARD_THEMES).every((id) => Boolean(cardById(id))));
check("แก่นเรื่องครบ 78 ใบพอดี", Object.keys(CARD_THEMES).length === DECK.length);

const c = (id: string, isReversed = false) => ({ card: cardById(id)!, isReversed });

// ── ผังใบเดียว: ไม่มีคู่ ไม่มีสัญญาณ ──
{
  const r = analyzeRelations([c("major-19")]);
  check("ใบเดียว: ไม่มีคู่", r.pairs.length === 0);
  check("ใบเดียว: ไม่มีสัญญาณ", r.signals.length === 0);
}

// ── ธาตุตามกติกา alchemy.ts ──
{
  // Sun (ไฟ) + Six of Wands (ไฟ) — ธาตุเดียวกัน + แก่นเรื่อง success ตรงกัน
  const r = analyzeRelations([c("major-19"), c("wands-06")]);
  const p = r.pairs[0];
  check("Sun + Six of Wands: เสริมกัน", p?.kind === "support");
  check("Sun + Six of Wands: 2 หลักฐาน (ธาตุ + แก่นเรื่อง)", p?.strength === 2);
}
{
  // Ace of Wands (ไฟ) + Ace of Cups (น้ำ) = ขัดกัน
  const r = analyzeRelations([c("wands-01"), c("cups-01")]);
  check("ไฟ + น้ำ: ขัดกัน", r.pairs[0]?.kind === "tension");
}
{
  // Ace of Wands (ไฟ) + Ace of Pentacles (ดิน) = กลาง แต่ beginning ตรงกัน ➔ echo
  const r = analyzeRelations([c("wands-01"), c("pentacles-01")]);
  check("ไฟ + ดิน + แก่นเรื่องเดียวกัน: สะท้อนกัน", r.pairs[0]?.kind === "echo" && r.pairs[0]?.sources.join() === "theme");
}

// ── สัญญาณโครงสร้าง ──
{
  const r = analyzeRelations([c("major-00"), c("major-13"), c("cups-02")]);
  check("เมเจอร์ 2/3: major-heavy", r.signals.some((s) => s.id === "major-heavy"));
}
{
  const r = analyzeRelations([c("cups-05"), c("swords-05"), c("wands-02")]);
  check("เลข 5 ซ้ำ: number-echo", r.signals.some((s) => s.id === "number-echo" && s.positions.join() === "0,1"));
}
{
  const r = analyzeRelations([c("cups-12", true), c("swords-13", true), c("wands-02", true), c("major-01")]);
  check("ราชสำนัก 2 ใบ: court-crowd", r.signals.some((s) => s.id === "court-crowd"));
  check("กลับหัว 3/4: reversal-heavy", r.signals.some((s) => s.id === "reversal-heavy"));
  check("ไม่มีธาตุดิน: missing-element", r.signals.some((s) => s.id === "missing-element" && s.noteTh.includes("ดิน")));
}

// ── ผังใหญ่: ตำแหน่งอยู่ในผังเสมอ + เพดานจำนวนคู่ + ผลซ้ำเดิม ──
{
  const ids = ["major-16", "cups-03", "swords-09", "pentacles-10", "wands-07", "major-17", "cups-14", "swords-01", "major-10", "pentacles-04"];
  const input = ids.map((id, i) => c(id, i % 3 === 0));
  const r1 = analyzeRelations(input);
  const r2 = analyzeRelations(input);
  check("ผัง 10 ใบ: ไม่เกินเพดานคู่", r1.pairs.length <= MAX_PAIRS);
  check(
    "ผัง 10 ใบ: ทุกตำแหน่งที่อ้างอยู่ในผัง",
    [...r1.pairs.flatMap((p) => [p.a, p.b]), ...r1.clusters.flatMap((x) => x.positions), ...r1.signals.flatMap((s) => s.positions)].every(
      (i) => Number.isInteger(i) && i >= 0 && i < ids.length,
    ),
  );
  check("ผัง 10 ใบ: a < b ทุกคู่", r1.pairs.every((p) => p.a < p.b));
  check("ผลแน่นอน (เรียกซ้ำได้ผลเดิม)", JSON.stringify(r1) === JSON.stringify(r2));
  check("ไม่มีข้อความว่าง", r1.pairs.every((p) => p.noteTh && p.noteEn) && r1.signals.every((s) => s.noteTh && s.noteEn));
}

// ── ข้อความห้ามพูดเชิงพยากรณ์/ความแม่น ──
{
  const all = DECK.flatMap((card) => [c(card.id), c(card.id, true)]);
  const texts: string[] = [];
  for (let i = 0; i + 4 <= all.length; i += 4) {
    const r = analyzeRelations(all.slice(i, i + 4).filter((x, j, arr) => arr.findIndex((y) => y.card.id === x.card.id) === j));
    texts.push(...r.pairs.map((p) => p.noteTh), ...r.signals.map((s) => s.noteTh));
  }
  const banned = /แม่นยำ|รับประกัน|จะเกิดขึ้นแน่|ฟันธง|เปอร์เซ็นต์|%/;
  check("ไม่มีคำเชิงพยากรณ์/ความแม่นในข้อความ", texts.every((t) => !banned.test(t)));
}

console.log(`\n✦ card-relations: ผ่าน ${pass} · ไม่ผ่าน ${fail}`);
if (fail > 0) process.exit(1);
