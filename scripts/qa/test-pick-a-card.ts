/**
 * 🃏 ด่านหน้า Pick A Card (เลือกกองไพ่พยากรณ์ · INC-0198b)
 * ===========================================================================
 *
 * ## ทำไมต้องมีด่านนี้
 *
 * 2026-09-17 เจ้าของโปรเจกต์ทักสองเรื่องในหน้าเดียวกัน หลังหน้านี้ขึ้น production ได้ไม่กี่ชั่วโมง:
 *
 * 1. **"เลือกใหม่จากกองเดิม ไพ่ซ้ำ ซ้ำตลอด ทุกกองเลย"** — กองที่ 1 ผูกกับไพ่ชุดเดิมตายตัว
 *    ย้อนกลับมาเลือกกองเดิมกี่ครั้งก็ได้ไพ่ 3 ใบเดิมและคำทำนายเดิม
 * 2. **"หลังไพ่ไม่เหมือนเราที่ใช้ปกติในเว็บ"** — หน้านี้วาดหลังไพ่ขึ้นมาใหม่เอง
 *    (`bg-[#1e1b18]` + ตัวหนังสือ "SEER 1909 / TAROT") แทนที่จะใช้ลายกลางของบ้านนี้
 *
 * ทั้งสองเรื่อง **typecheck จับไม่ได้ · ด่านเดิมจับไม่ได้** เพราะโค้ดถูกต้องทุกบรรทัด
 * ผิดแค่ "ตรรกะการจั่ว" กับ "หยิบลายผิดชุด" ซึ่งเห็นได้ก็ต่อเมื่อเปิดหน้าจริงแล้วเล่นซ้ำ
 *
 * ## ด่านนี้ตรวจ 4 ข้อ
 *
 * 1. `drawContentOrder()` คืนลำดับที่ไม่มีช่องไหนซ้ำกับรอบก่อนเลย (ทุกขนาด 2–6 ช่อง)
 * 2. คืนค่าเป็นการเรียงสับเปลี่ยนที่ถูกต้องเสมอ (ครบทุกชุด ไม่มีชุดหาย ไม่มีชุดซ้ำ)
 * 3. เล่นยาว 400 รอบแล้วช่องแรกต้องเคยได้ครบทุกชุด — กันกรณี "สลับไปมาอยู่แค่สองชุด"
 * 4. หน้า Pick A Card ยัง import และเรียก `drawContentOrder()` จริง (กันกลับไปผูกกองตายตัว)
 * 5. ทุกไฟล์ที่วาดไพ่คว่ำหน้าใช้คลาสกลาง `card-back-pattern` (ทะเบียนแบบ ratchet)
 *    และหน้า Pick A Card ต้องไม่ผสมสีหลังไพ่เองด้วยเลขฮาร์ดโค้ดอีก
 *
 * ## ⚠️ กับดักที่ต้องรู้ก่อนแก้ด่านนี้
 *
 * - ข้อ 3 เป็นการทดสอบเชิงสถิติ ถ้าเปลี่ยนอัลกอริทึมเป็นแบบ "หมุนทีละช่อง" (rotate)
 *   ข้อนี้จะยังผ่าน แต่ผู้ใช้จะเดาลำดับได้ — ข้อ 1 คือเส้นตายจริง ข้อ 3 คือกันของที่แย่กว่านั้น
 * - ห้ามย้าย `drawContentOrder` กลับเข้าไปอยู่ในไฟล์ `.tsx` — ด่านนี้ import ตรง ๆ ถ้าไฟล์นั้น
 *   ลาก React/เสียง/next มาด้วยจะรันในสคริปต์ไม่ได้ และด่านจะตายทั้งด่าน
 */
import fs from "node:fs";
import path from "node:path";
import { assertNonEmptyCorpus } from "./lib/corpus";
import { drawContentOrder } from "@/lib/pick-a-card/draw-order";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const CLIENT = path.join(SRC, "components/pick-a-card/PickACardClient.tsx");

/** คลาสกลางที่นิยามลายหลังไพ่ของทั้งเว็บ (globals.css) */
const SHARED_BACK_CLASS = "card-back-pattern";

let pass = 0;
let fail = 0;

function check(label: string, ok: boolean, detail = ""): void {
  if (ok) {
    pass++;
    console.log(`✅ ${label}`);
  } else {
    fail++;
    console.error(`❌ ${label}${detail ? `\n${detail}` : ""}`);
  }
}

/** ตัดคอมเมนต์ทิ้งก่อนตรวจ — ไม่งั้นคอมเมนต์ที่อธิบายของผิดจะถูกนับเป็นของผิดเสียเอง */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

// ---------------------------------------------------------------------------
// 1 + 2. ไม่ซ้ำช่องเดิม และเป็นการเรียงสับเปลี่ยนที่ถูกต้อง
// ---------------------------------------------------------------------------
{
  const offenders: string[] = [];
  for (let size = 2; size <= 6; size++) {
    let order = Array.from({ length: size }, (_, i) => i);
    for (let round = 0; round < 300; round++) {
      const next = drawContentOrder(size, order);

      const sorted = [...next].sort((a, b) => a - b).join(",");
      const expected = Array.from({ length: size }, (_, i) => i).join(",");
      if (sorted !== expected) {
        offenders.push(`   ขนาด ${size} รอบ ${round}: ไม่ใช่การเรียงสับเปลี่ยน → [${next.join(",")}]`);
        break;
      }

      const stuck = next.findIndex((value, index) => value === order[index]);
      if (stuck >= 0) {
        offenders.push(
          `   ขนาด ${size} รอบ ${round}: ช่องที่ ${stuck + 1} ยังถือชุดเดิม (${next[stuck]}) — ผู้ใช้จะเจอไพ่ซ้ำ`
        );
        break;
      }
      order = next;
    }
  }
  check(
    "จั่วลำดับใหม่แล้วไม่มีกองไหนถือไพ่ชุดเดิมซ้ำรอบก่อน (ขนาด 2–6 ช่อง · 300 รอบต่อขนาด)",
    offenders.length === 0,
    offenders.join("\n")
  );
}

// ---------------------------------------------------------------------------
// 3. เล่นยาวแล้วต้องเข้าถึงทุกชุด ไม่ใช่สลับอยู่แค่สองชุด
// ---------------------------------------------------------------------------
{
  const size = 4;
  let order = Array.from({ length: size }, (_, i) => i);
  const seenInFirstSlot = new Set<number>();
  for (let round = 0; round < 400; round++) {
    order = drawContentOrder(size, order);
    seenInFirstSlot.add(order[0]);
  }
  check(
    `กองแรกเคยได้ครบทุกชุดเมื่อเล่นยาว 400 รอบ (เห็นแล้ว ${seenInFirstSlot.size}/${size} ชุด)`,
    seenInFirstSlot.size === size,
    `   เห็นเพียง [${[...seenInFirstSlot].sort().join(", ")}] — ถ้าเข้าถึงได้แค่ไม่กี่ชุด ผู้ใช้จะรู้สึกว่า "ก็ซ้ำอยู่ดี"`
  );
}

// ---------------------------------------------------------------------------
// 4. หน้า Pick A Card ต้องยังใช้ตัวจั่วนี้จริง (กันเผลอกลับไปผูกกองตายตัว)
// ---------------------------------------------------------------------------
{
  if (!fs.existsSync(CLIENT)) {
    check("หาไฟล์ PickACardClient.tsx เจอ", false, `   ไม่พบ ${path.relative(ROOT, CLIENT)} — ถ้าย้ายไฟล์จริงให้แก้ด่านนี้ด้วย`);
  } else {
    const src = fs.readFileSync(CLIENT, "utf-8");
    check(
      "หน้า Pick A Card ยังจั่วลำดับใหม่ทุกรอบ (import + เรียก drawContentOrder จริง)",
      src.includes("drawContentOrder") && /drawContentOrder\s*\(/.test(src),
      "   ถ้าเลิกเรียก แปลว่ากองกลับไปผูกไพ่ชุดเดิมตายตัวเหมือนตอนเกิด INC-0198b"
    );
  }
}

// ---------------------------------------------------------------------------
// 5. ห้ามวาดหลังไพ่เอง — ทุกที่ที่มีไพ่คว่ำหน้าต้องใช้ลายกลางชุดเดียว
// ---------------------------------------------------------------------------
{
  const css = path.join(SRC, "app/globals.css");
  if (!fs.existsSync(css)) {
    check("หาไฟล์ globals.css เจอ", false, `   ไม่พบ ${path.relative(ROOT, css)}`);
  } else {
    check(
      `ลายหลังไพ่กลาง \`.${SHARED_BACK_CLASS}\` ยังถูกนิยามไว้ที่ globals.css`,
      fs.readFileSync(css, "utf-8").includes(`.${SHARED_BACK_CLASS}`)
    );
  }

  /**
   * ทะเบียนไฟล์ที่วาดไพ่คว่ำหน้า — เป็น ratchet: เพิ่มได้ ห้ามหลุด
   * (ไฟล์ไหนเลิกใช้ลายกลาง = กลับไปมีหลังไพ่คนละแบบในเว็บเดียวกันเหมือน INC-0198b)
   */
  const BACK_CONSUMERS = [
    { file: "src/components/card/TarotCard.tsx", why: "ไพ่ทุกใบในผังพยากรณ์" },
    { file: "src/components/deck/InteractiveCardFan.tsx", why: "สำรับพัดไพ่ให้ผู้ใช้จับเอง" },
    { file: "src/components/deck/ShuffleRitual.tsx", why: "พิธีสับไพ่" },
    { file: "src/components/pick-a-card/PickACardClient.tsx", why: "กองไพ่ 4 กองในหน้า Pick A Card" },
  ];

  const missing: string[] = [];
  for (const entry of BACK_CONSUMERS) {
    const full = path.join(ROOT, entry.file);
    if (!fs.existsSync(full)) {
      missing.push(`   ${entry.file} — หาไฟล์ไม่เจอ (${entry.why}) ถ้าย้ายไฟล์จริงให้แก้ทะเบียนในด่านนี้`);
      continue;
    }
    if (!fs.readFileSync(full, "utf-8").includes(SHARED_BACK_CLASS)) {
      missing.push(`   ${entry.file} — ${entry.why} แต่ไม่ได้ใช้ \`${SHARED_BACK_CLASS}\` แล้ว`);
    }
  }
  check(
    `ทุกที่ที่มีไพ่คว่ำหน้า (${BACK_CONSUMERS.length} ไฟล์) ใช้ลายหลังไพ่ชุดเดียวกัน`,
    missing.length === 0,
    missing.join("\n")
  );

  const clientSrc = fs.existsSync(CLIENT) ? stripComments(fs.readFileSync(CLIENT, "utf-8")) : "";
  check(
    "หน้า Pick A Card ไม่ผสมสีหลังไพ่เองด้วยเลขฮาร์ดโค้ด (bg-[#...])",
    !/bg-\[#/.test(clientSrc),
    "   เดิมหน้านี้ใช้ `bg-[#1e1b18]` วาดหลังไพ่ของตัวเอง จึงไม่เหมือนหลังไพ่ที่เหลือทั้งเว็บ"
  );

  // ยืนยันว่าคลังที่เดินตรวจไม่ว่าง — ด่านที่วนคลังว่างแล้วขึ้น ✅ คือด่านหลอก
  assertNonEmptyCorpus("ไฟล์ที่ต้องใช้ลายหลังไพ่กลาง", BACK_CONSUMERS, "ทะเบียนว่าง = ด่านนี้ไม่ได้ตรวจอะไรเลย");
}

console.log(`\n📊 สรุป: ผ่าน ${pass} · ตก ${fail}`);
if (fail > 0) process.exit(1);
console.log("✅ หน้า Pick A Card ผ่านครบ: ไพ่ไม่ซ้ำรอบก่อน · เข้าถึงได้ทุกชุด · หลังไพ่เป็นลายเดียวกับทั้งเว็บ");
