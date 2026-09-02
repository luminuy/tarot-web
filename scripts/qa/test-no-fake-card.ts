/**
 * scripts/qa/test-no-fake-card.ts
 * QA — ตรวจสอบนโยบายความโปร่งใสเด็ดขาด: ห้ามกุหรือมโนไพ่ปลอมทุกใบในสำรับ 78 ใบ (Zero Fabricated Cards Policy)
 * รันด้วย: npx tsx scripts/qa/test-no-fake-card.ts
 */

import fs from "node:fs";
import path from "node:path";
import { cardByIndex, cardById, DECK, TOTAL_CARDS } from "../../src/data/cards";
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
  console.log("🧪 [QA] Zero Fabricated Cards Policy — ห้ามกุไพ่ปลอมทุกใบในสำรับ 78 ใบเด็ดขาด\n");

  // ── 1. cardByIndex ต้องคืน undefined สำหรับทุกดัชนีที่ผิดปกติ (ห้ามคืนไพ่ใดๆ ทั้ง 78 ใบ) ──
  const invalidIndices = [
    undefined,
    null,
    -1,
    -100,
    78,
    79,
    100,
    999,
    Number.NaN,
    1.5,
    -0.5,
    "0" as any,
    "major-00" as any,
    {} as any,
    [] as any,
  ];

  for (const inv of invalidIndices) {
    const res = cardByIndex(inv);
    check(`cardByIndex(${JSON.stringify(inv)}) คืน undefined (ห้ามคืนไพ่สำรอง)`, res === undefined);
  }

  // ── 2. cardById ต้องคืน undefined สำหรับทุก id ที่ผิดปกติ (ห้ามคืนไพ่ใดๆ ทั้งสิ้น) ──
  const invalidIds = ["", "   ", "undefined", "null", "major-99", "fool", "the-fool", "unknown"];
  for (const id of invalidIds) {
    check(`cardById("${id}") คืน undefined`, cardById(id) === undefined);
  }

  // ── 3. ตรวจสอบว่าไพ่ของจริงทั้ง 78 ใบ (0..77) แต่ละใบต้องคืนเฉพาะใบของตัวเองเท่านั้น ──
  check(`สำรับมาตรฐานมีครบถ้วน ${TOTAL_CARDS} ใบ`, TOTAL_CARDS === 78);
  let allMatched = true;
  for (let i = 0; i < 78; i++) {
    const card = cardByIndex(i);
    if (!card || card.id !== DECK[i].id) {
      allMatched = false;
      break;
    }
  }
  check("ไพ่จริงทุกใบ index 0..77 คืนไพ่ตรงตามดัชนีแท้จริง 100%", allMatched);

  // ── 4. resolveCardByIndex ต้องคืน undefined เสมอเมื่อ index ผิดปกติ ──
  const emptyOverrideDoc = { cards: {} };
  check("resolveCardByIndex(undefined) คืน undefined", resolveCardByIndex(emptyOverrideDoc, undefined) === undefined);
  check("resolveCardByIndex(null) คืน undefined", resolveCardByIndex(emptyOverrideDoc, null) === undefined);
  check("resolveCardByIndex(-1) คืน undefined", resolveCardByIndex(emptyOverrideDoc, -1) === undefined);
  check("resolveCardByIndex(78) คืน undefined", resolveCardByIndex(emptyOverrideDoc, 78) === undefined);
  check("resolveCardByIndex(999) คืน undefined", resolveCardByIndex(emptyOverrideDoc, 999) === undefined);

  // ── 5. Static Analysis: ตรวจสอบซอร์สโค้ดทั่วทั้งระบบ src/ ──
  const rootDir = path.resolve(process.cwd(), "src");

  // 5.1 ตรวจ chat/route.ts ว่าไม่มีการสร้างไพ่ปลอมหรือ mock card
  const chatRoutePath = path.join(rootDir, "app/api/reading/[id]/chat/route.ts");
  if (fs.existsSync(chatRoutePath)) {
    const chatSrc = fs.readFileSync(chatRoutePath, "utf-8");
    check("chat/route.ts ไม่มีการ fallback ไพ่ใบใดทั้งสิ้น", !chatSrc.includes("order: 0, cardIndex: 0") && !chatSrc.includes("cardIndex: 0"));
    check("chat/route.ts คืน 404 เมื่อไม่พบสำรับไพ่", chatSrc.includes("reading_not_found"));
  }

  // 5.2 ตรวจ shuffle/route.ts ว่าตรวจไพ่ทุกใบ และไม่ปล่อยผ่านข้อมูลที่ไม่สมบูรณ์
  const shuffleRoutePath = path.join(rootDir, "app/api/reading/[id]/shuffle/route.ts");
  if (fs.existsSync(shuffleRoutePath)) {
    const shuffleSrc = fs.readFileSync(shuffleRoutePath, "utf-8");
    check("shuffle/route.ts ตรวจสอบ CARD_DATA_NOT_FOUND ชัดเจน", shuffleSrc.includes("CARD_DATA_NOT_FOUND"));
  }

  // 5.3 ตรวจ read/route.ts ว่าส่ง error ทันทีถ้าไพ่ใบใดใบหนึ่งไม่พบ
  const readRoutePath = path.join(rootDir, "app/api/reading/[id]/read/route.ts");
  if (fs.existsSync(readRoutePath)) {
    const readSrc = fs.readFileSync(readRoutePath, "utf-8");
    check("read/route.ts ตรวจสอบ resolvedCards และคืน CARD_DATA_NOT_FOUND", readSrc.includes("CARD_DATA_NOT_FOUND"));
  }

  // 5.4 ตรวจ page.tsx ว่าไม่มี cardIndex ?? 0
  const pagePath = path.join(rootDir, "app/page.tsx");
  if (fs.existsSync(pagePath)) {
    const pageSrc = fs.readFileSync(pagePath, "utf-8");
    check("page.tsx ไม่มี cardIndex ?? 0", !pageSrc.includes("cardIndex ?? 0"));
    check("page.tsx มีการตรวจสอบความสมบูรณ์ของไพ่และแจ้งเตือนให้โหลดใหม่", pageSrc.includes("ไม่พบข้อมูลไพ่ที่เปิด กรุณากดโหลดใหม่อีกครั้ง"));
  }

  // 5.5 ตรวจ StreamReader.tsx ว่าไม่มี fallback ภาพไพ่เดี่ยวใดๆ
  const streamReaderPath = path.join(rootDir, "components/reading/StreamReader.tsx");
  if (fs.existsSync(streamReaderPath)) {
    const streamReaderSrc = fs.readFileSync(streamReaderPath, "utf-8");
    check("StreamReader.tsx ไม่มี fallback image || 'major-00.jpg'", !streamReaderSrc.includes('image || "major-00.jpg"'));
  }

  // 5.6 ตรวจสอบไฟล์ทั้งหมดใน src ว่าไม่มีการ fallback ไปหา DECK ใดๆ
  function scanDirForDeckFallback(dir: string): boolean {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const f of files) {
      const full = path.join(dir, f.name);
      if (f.isDirectory()) {
        if (!scanDirForDeckFallback(full)) return false;
      } else if (f.isFile() && /\.(ts|tsx)$/.test(f.name) && !f.name.endsWith(".d.ts")) {
        const content = fs.readFileSync(full, "utf-8");
        if (content.includes("|| DECK[") || content.includes("?? DECK[")) {
          return false;
        }
      }
    }
    return true;
  }
  check("ทุกไฟล์ใน src/ ไม่มี || DECK[...] หรือ ?? DECK[...] เป็นไพ่สำรอง", scanDirForDeckFallback(rootDir));

  console.log(`\nผลการทดสอบ: ผ่าน ${pass} ข้อ, ไม่ผ่าน ${fail} ข้อ`);
  if (fail > 0) process.exit(1);
}

main();
