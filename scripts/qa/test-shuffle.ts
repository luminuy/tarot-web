import { createCommitment, drawCards, normalizeClientSeed, verifyCommitment } from "../../src/lib/shuffle";

/**
 * QA — ทดสอบคณิตศาสตร์ของระบบสุ่มที่พิสูจน์ได้ (commit-reveal)
 * รันด้วย: npx tsx scripts/qa/test-shuffle.ts
 */

let pass = 0;
let fail = 0;
function check(label: string, ok: boolean, detail?: string) {
  if (ok) {
    pass++;
    console.log(`✅ ${label}`);
  } else {
    fail++;
    console.log(`❌ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

// 1. commitment ตรวจสอบได้จริง
const { serverSeed, commitment } = createCommitment();
check("verifyCommitment ผ่านเมื่อ seed ตรงกับ commitment", verifyCommitment(serverSeed, commitment));
check("verifyCommitment ล้มเหลวเมื่อ seed ผิด", !verifyCommitment("ปลอมแปลง", commitment));
check(
  "verifyCommitment ไม่ throw เมื่อ commitment เป็น hex ผิดรูปแบบ",
  (() => {
    try {
      return verifyCommitment(serverSeed, "not-a-hex-string!!") === false;
    } catch {
      return false;
    }
  })(),
);

// 2. ความตายตัว — seed เดิมต้องให้ผลเดิมเสมอ
const clientSeed = normalizeClientSeed("การสับไพ่ของผู้ใช้ครั้งนี้");
const draw1 = drawCards({ serverSeed, clientSeed, count: 10 });
const draw2 = drawCards({ serverSeed, clientSeed, count: 10 });
check(
  "seed เดิมให้ผลไพ่เดิมทุกครั้ง (deterministic)",
  JSON.stringify(draw1) === JSON.stringify(draw2),
);

// 3. seed ต่างกันต้องให้ผลต่างกัน (ไม่ใช่ค่าคงที่ที่ซ่อนอยู่)
const draw3 = drawCards({ serverSeed, clientSeed: normalizeClientSeed("อีกครั้งหนึ่ง"), count: 10 });
check(
  "seed ต่างกันให้ผลไพ่ต่างกัน",
  JSON.stringify(draw1) !== JSON.stringify(draw3),
);

// 4. ไม่มีไพ่ซ้ำในชุดเดียวกัน แม้จั่วครบสำรับ
const fullDraw = drawCards({ serverSeed, clientSeed, count: 78 });
const uniqueIndices = new Set(fullDraw.map((d) => d.cardIndex));
check("จั่วครบสำรับ 78 ใบไม่มีไพ่ซ้ำ", uniqueIndices.size === 78);
check(
  "จั่วครบสำรับ 78 ใบ ครอบคลุมทุก index 0-77",
  fullDraw.every((d) => d.cardIndex >= 0 && d.cardIndex < 78) && uniqueIndices.size === 78,
);

// 5. pickedIndices — ฟีเจอร์ที่ Gemini เพิ่ม (เลือกไพ่เองจากพัด)
const picked = [5, 12, 40];
const pickedDraw = drawCards({ serverSeed, clientSeed, count: 3, pickedIndices: picked });
check("pickedIndices ให้จำนวนไพ่ตรงกับที่ขอ", pickedDraw.length === 3);
const pickedUnique = new Set(pickedDraw.map((d) => d.cardIndex));
check("pickedIndices ไม่ให้ไพ่ซ้ำกัน", pickedUnique.size === 3);

check(
  "pickedIndices ที่ index ซ้ำกันต้อง throw (กันเลือกไพ่ใบเดียวกันสองตำแหน่ง)",
  (() => {
    try {
      drawCards({ serverSeed, clientSeed, count: 2, pickedIndices: [5, 5] });
      return false;
    } catch {
      return true;
    }
  })(),
);

check(
  "pickedIndices ที่จำนวนไม่ตรง count ต้อง throw",
  (() => {
    try {
      drawCards({ serverSeed, clientSeed, count: 3, pickedIndices: [1, 2] });
      return false;
    } catch {
      return true;
    }
  })(),
);

check(
  "count เกินขนาดสำรับต้อง throw",
  (() => {
    try {
      drawCards({ serverSeed, clientSeed, count: 79 });
      return false;
    } catch {
      return true;
    }
  })(),
);

// 6. อัตราไพ่หัวกลับต้องสมเหตุสมผล (ไม่ใช่ 0% หรือ 100%) — สุ่มจริง
const largeSample = drawCards({ serverSeed, clientSeed: normalizeClientSeed("sample-run"), count: 78 });
const reversedCount = largeSample.filter((d) => d.isReversed).length;
check(
  `อัตราไพ่หัวกลับอยู่ในช่วงสมเหตุสมผล (ได้ ${reversedCount}/78 ≈ ${Math.round((reversedCount / 78) * 100)}%, คาดหวัง 40% ±15)`,
  reversedCount > 78 * 0.25 && reversedCount < 78 * 0.55,
);

// 7. ความกระจายของการสุ่ม — รันหลายซีดแล้วดูว่าไพ่ใบแรกกระจายทั่วสำรับ ไม่เอนไปใบต้น ๆ (มาตรฐาน rejection sampling)
const firstCardCounts = new Map<number, number>();
for (let i = 0; i < 780; i++) {
  const seed = normalizeClientSeed(`dist-test-${i}`);
  const [first] = drawCards({ serverSeed, clientSeed: seed, count: 1 });
  firstCardCounts.set(first.cardIndex, (firstCardCounts.get(first.cardIndex) ?? 0) + 1);
}
const expectedPerCard = 780 / 78; // = 10
const maxDeviation = Math.max(
  ...Array.from(firstCardCounts.values()).map((c) => Math.abs(c - expectedPerCard)),
);
check(
  `การสุ่มกระจายทั่วสำรับ ไม่เอนเอียงไปใบใดใบหนึ่ง (เบี่ยงเบนสูงสุด ${maxDeviation} จากค่าเฉลี่ย ${expectedPerCard})`,
  maxDeviation < expectedPerCard * 3,
);

console.log(`\n${pass}/${pass + fail} ผ่าน`);
if (fail > 0) process.exit(1);
