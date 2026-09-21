/**
 * 🎯 ด่าน "ไพ่ที่คำนวณได้" (คลื่นที่ 2 · `/pick-a-card` · `/cards/birth-card`)
 * ===========================================================================
 *
 * ## ทำไมต้องมีด่านนี้
 *
 * สองหน้านี้เปิดไพ่ที่ **ถูกกำหนดไว้ล่วงหน้า** ไม่ได้มาจากการจั่ว (ไพ่จากวันเกิด ·
 * สำรับประจำวันของกอง) จึงมีเส้นทางพิเศษที่ข้าม `drawCards()` ไปเลย
 * เส้นทางพิเศษแบบนี้คือจุดที่อันตรายที่สุดของทั้งระบบ เพราะถ้าเผลอ:
 *
 * | เผลอทำอะไร | ผลที่ตามมา |
 * | :--- | :--- |
 * | ให้ไคลเอนต์ส่งเลขไพ่/วันที่เองได้ | ผู้ใช้ไล่เปลี่ยนค่าจนได้ไพ่ที่ถูกใจ — คำมั่น Provably Fair ตายทั้งเว็บ |
 * | ลืมตรึงสเปกตั้งแต่ `/start` | ยิง `/shuffle` ซ้ำด้วยสเปกใหม่แล้วเปลี่ยนไพ่กลางคัน |
 * | ปล่อยให้ `pickedIndices` ปนเข้ามา | ไพ่ที่คำนวณได้กับไพ่ที่จั่วมาปนกันโดยไม่มีใครรู้ว่าอันไหนเป็นอันไหน |
 * | เอาผลไปโชว์คู่แผง Provably Fair | ผู้ใช้กดตรวจ ➔ คำนวณซ้ำไม่ตรง ➔ เข้าใจว่าเราโกง ทั้งที่คนละกลไกกัน |
 * | มี fallback หยิบไพ่ใบอื่นเมื่อหาไม่เจอ | ผิดกฎเหล็กข้อ 14 (ห้ามกุไพ่) แบบเงียบที่สุด |
 *
 * ด่านนี้จึงตรวจทั้ง **ผลลัพธ์ของตัวคำนวณ** และ **สัญญาของเส้นทาง API** ที่เรียกมัน
 */
import fs from "node:fs";
import path from "node:path";
import { assertNonEmptyCorpus } from "./lib/corpus";
import { DECK, cardByIndex } from "../../src/data/cards";
import { PICK_A_CARD_TOPICS } from "../../src/data/pick-a-card";
import { PICK_A_CARD_POOLS } from "../../src/data/pick-a-card-readings";
import { PUBLIC_SPREADS, getSpread } from "../../src/data/spreads";
import { calculateBirthCard } from "../../src/lib/tarot/birth-card";
import {
  DERIVED_SPREAD_ID,
  deriveDrawn,
  derivedSpreadIdFor,
  pinDerivedSpec,
} from "../../src/lib/reading/derived-draw";

const ROOT = process.cwd();
const readSrc = (rel: string): string | null => {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) {
    check(`หาไฟล์ที่ด่านนี้ต้องตรวจเจอ: ${rel}`, false, "   ถ้าย้ายไฟล์จริงให้แก้ด่านนี้ด้วย");
    return null;
  }
  return fs.readFileSync(full, "utf-8");
};

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

console.log('🧪 [QA] ไพ่ที่ "คำนวณได้" — ไพ่วันเกิด · สำรับประจำวันของ Pick A Card\n');

// ---------------------------------------------------------------------------
// 1. ผังที่คู่กับการคำนวณต้องเป็น "ผังภายใน" เสมอ
// ---------------------------------------------------------------------------
{
  const problems: string[] = [];
  for (const [kind, spreadId] of Object.entries(DERIVED_SPREAD_ID)) {
    const spread = getSpread(spreadId);
    if (!spread) {
      problems.push(`   ${kind}: ไม่มีผัง ${spreadId} ใน SPREADS`);
      continue;
    }
    if (!spread.internal) problems.push(`   ${kind}: ผัง ${spreadId} ไม่ได้ติดธง internal`);
    if (PUBLIC_SPREADS.some((s) => s.id === spreadId)) {
      problems.push(`   ${kind}: ผัง ${spreadId} โผล่ในคลังผังสาธารณะ`);
    }
    if (derivedSpreadIdFor(kind as keyof typeof DERIVED_SPREAD_ID) !== spreadId) {
      problems.push(`   ${kind}: derivedSpreadIdFor คืนผังไม่ตรงกับทะเบียน`);
    }
  }
  check(
    "ผังของไพ่ที่คำนวณได้เป็นผังภายในทั้งหมด (ไม่โผล่ในคลังผัง · ไม่ทำให้จำนวน 25 ผังเพี้ยน)",
    problems.length === 0,
    problems.join("\n")
  );
}

// ---------------------------------------------------------------------------
// 2. ไพ่วันเกิด — ต้องตรงกับสูตรเลขศาสตร์ที่หน้าเว็บใช้ทุกวันเกิดที่ทดสอบ
// ---------------------------------------------------------------------------
{
  const mismatches: string[] = [];
  let checkedDates = 0;

  for (let year = 1940; year <= 2026; year += 7) {
    for (const month of [1, 2, 6, 9, 12]) {
      for (const day of [1, 9, 17, 28]) {
        checkedDates++;
        const expected = calculateBirthCard(day, month, year, false, DECK);
        const derived = deriveDrawn({ kind: "birth-card", day, month, year, era: "ce" });

        if (!expected) {
          if (derived) mismatches.push(`   ${day}/${month}/${year}: สูตรคำนวณไม่ออกแต่ท่อยังเปิดไพ่ให้`);
          continue;
        }
        if (!derived) {
          mismatches.push(`   ${day}/${month}/${year}: ท่อคำนวณไม่ออกทั้งที่สูตรได้ไพ่ ${expected.primaryCard.id}`);
          continue;
        }

        const wanted = [expected.primaryCard.id, ...(expected.secondaryCard ? [expected.secondaryCard.id] : [])];
        const got = derived.drawn.map((d) => cardByIndex(d.cardIndex)?.id ?? "?");
        if (JSON.stringify(wanted) !== JSON.stringify(got)) {
          mismatches.push(`   ${day}/${month}/${year}: ควรได้ [${wanted.join(",")}] แต่ได้ [${got.join(",")}]`);
        }
        if (derived.drawn.some((d) => d.isReversed)) {
          mismatches.push(`   ${day}/${month}/${year}: ไพ่ประจำตัวออกหัวกลับ — ต้องหงายเสมอ`);
        }
        if (derived.detail.kind !== "birth-card" || derived.detail.primaryNumber !== expected.primaryNumber) {
          mismatches.push(`   ${day}/${month}/${year}: รอยทางเลขศาสตร์ที่ส่งกลับไม่ตรงกับสูตร`);
        }
      }
    }
  }

  check(
    `ไพ่วันเกิดที่เซิร์ฟเวอร์เปิด ตรงกับสูตรเลขศาสตร์ทุกใบ (${checkedDates} วันเกิด)`,
    mismatches.length === 0,
    mismatches.slice(0, 5).join("\n") +
      "\n   ➔ ถ้าไม่ตรง หน้าเว็บจะโชว์ไพ่ชุดหนึ่งแต่แม่หมออ่านอีกชุด (หน้าเว็บกันไว้ด้วยการเทียบรหัสไพ่)"
  );
}

// ---------------------------------------------------------------------------
// 3. ข้อมูลตั้งต้นที่ใช้ไม่ได้ ต้องคืน undefined — ห้ามหยิบไพ่ใบไหนมาแทน (กฎเหล็กข้อ 14)
// ---------------------------------------------------------------------------
{
  const badInputs = [
    { label: "30 ก.พ.", spec: { kind: "birth-card", day: 30, month: 2, year: 1997, era: "ce" } },
    { label: "29 ก.พ. ปีที่ไม่ใช่อธิกสุรทิน", spec: { kind: "birth-card", day: 29, month: 2, year: 1997, era: "ce" } },
    { label: "31 เม.ย.", spec: { kind: "birth-card", day: 31, month: 4, year: 2000, era: "ce" } },
    { label: "เดือน 13", spec: { kind: "birth-card", day: 1, month: 13, year: 2000, era: "ce" } },
    { label: "ปีนอกช่วง", spec: { kind: "birth-card", day: 1, month: 1, year: 1500, era: "ce" } },
    { label: "หัวข้อที่ไม่มีอยู่จริง", spec: { kind: "pick-a-card", topicId: "ไม่มีหัวข้อนี้", slotIndex: 0, dayKey: "2026-09-18" } },
    { label: "กองติดลบ", spec: { kind: "pick-a-card", topicId: PICK_A_CARD_TOPICS[0].id, slotIndex: -1, dayKey: "2026-09-18" } },
    { label: "กองเกินจำนวนที่มี", spec: { kind: "pick-a-card", topicId: PICK_A_CARD_TOPICS[0].id, slotIndex: 99, dayKey: "2026-09-18" } },
    { label: "กองที่เป็นทศนิยม", spec: { kind: "pick-a-card", topicId: PICK_A_CARD_TOPICS[0].id, slotIndex: 1.5, dayKey: "2026-09-18" } },
    { label: "คีย์วันผิดรูปแบบ", spec: { kind: "pick-a-card", topicId: PICK_A_CARD_TOPICS[0].id, slotIndex: 0, dayKey: "18/09/2026" } },
    { label: "คีย์วันว่าง", spec: { kind: "pick-a-card", topicId: PICK_A_CARD_TOPICS[0].id, slotIndex: 0, dayKey: "" } },
  ] as const;

  const leaked: string[] = [];
  for (const { label, spec } of badInputs) {
    const result = deriveDrawn(spec as never);
    if (result) leaked.push(`   ${label}: ยังเปิดไพ่ให้ ${result.drawn.length} ใบ ทั้งที่ข้อมูลใช้ไม่ได้`);
  }
  check(
    `ข้อมูลตั้งต้นที่ใช้ไม่ได้คืน undefined ทุกกรณี (${badInputs.length} กรณี)`,
    leaked.length === 0,
    leaked.join("\n") + "\n   ➔ กฎเหล็กข้อ 14: ไม่มีไพ่ = บอกให้โหลดใหม่ ห้ามกุไพ่ใบไหนขึ้นมาแทน"
  );
  assertNonEmptyCorpus("กรณีข้อมูลตั้งต้นที่ใช้ไม่ได้", badInputs, "คลังว่าง = ด่านนี้ไม่ได้ตรวจอะไรเลย");
}

// ---------------------------------------------------------------------------
// 4. ทุกรหัสไพ่ในคลัง Pick A Card ต้องมีอยู่จริงในสำรับ 78 ใบ
// ---------------------------------------------------------------------------
{
  const deckIds = new Set(DECK.map((c) => c.id));
  const ghosts: string[] = [];
  let cardRefs = 0;
  for (const topic of PICK_A_CARD_TOPICS) {
    for (const entry of PICK_A_CARD_POOLS[topic.id] ?? []) {
      for (const card of entry.cards) {
        cardRefs++;
        if (!deckIds.has(card.cardId)) ghosts.push(`   ${topic.id}/${entry.id}: ${card.cardId} ไม่มีในสำรับ`);
      }
    }
  }
  check(
    `ทุกรหัสไพ่ในคลังคำอ่านมีอยู่จริงในสำรับ 78 ใบ (${cardRefs} การอ้างอิง)`,
    ghosts.length === 0,
    ghosts.slice(0, 5).join("\n") + "\n   ➔ รหัสที่ไม่มีจริงจะทำให้ทั้งคำขอล้ม (ตามกฎข้อ 14) ผู้ใช้เปิดกองนั้นไม่ได้เลย"
  );
}

// ---------------------------------------------------------------------------
// 5. สเปกถูกตรึงด้วยวันของเซิร์ฟเวอร์เสมอ — ไคลเอนต์ส่งวันเองไม่ได้
// ---------------------------------------------------------------------------
{
  const pinned = pinDerivedSpec(
    { kind: "pick-a-card", topicId: PICK_A_CARD_TOPICS[0].id, slotIndex: 2 },
    "2026-09-18"
  );
  check(
    "pinDerivedSpec เติมวันของเซิร์ฟเวอร์ให้สเปกของ Pick A Card",
    pinned.kind === "pick-a-card" && pinned.dayKey === "2026-09-18" && pinned.slotIndex === 2
  );

  const startSrc = readSrc("src/app/api/reading/start/route.ts");
  if (startSrc) {
    check(
      "`/start` เติมวันเองด้วย bangkokDayKey() ไม่ได้รับ dayKey จาก body",
      startSrc.includes("pinDerivedSpec(derive, bangkokDayKey())") && !/dayKey:\s*z\./.test(startSrc),
      "   ถ้ารับวันจากไคลเอนต์ ผู้ใช้จะเลื่อนวันไปเรื่อย ๆ จนได้ไพ่ที่ถูกใจ"
    );
    check(
      "`/start` ปฏิเสธเมื่อผังกับชนิดการคำนวณไม่ใช่คู่กัน",
      startSrc.includes("derivedSpreadIdFor(derive.kind) !== spreadId"),
      "   ไม่งั้นไพ่ที่คำนวณได้จะไปโผล่ในผังที่ไม่ได้ออกแบบมารับ"
    );
    check(
      "`/start` ปฏิเสธเมื่อเปิดผังของไพ่คำนวณแต่ไม่ส่งข้อมูลตั้งต้นมา",
      startSrc.includes("requiresDerivation"),
      "   ไม่งั้น `/shuffle` จะตกไปจั่วสุ่มเงียบ ๆ แล้วหน้าเว็บจะเล่าถึงไพ่คนละชุดกับที่เปิดออกมา"
    );
    check(
      "`/start` คำนวณทดก่อนปล่อยให้เสียโควตา",
      startSrc.includes("if (!deriveDrawn(derivation))"),
      "   วันเกิดที่ไม่มีอยู่จริงต้องถูกปฏิเสธก่อน ไม่ใช่กินสิทธิ์เปิดไพ่ของวันไปฟรี ๆ"
    );
  }
}

// ---------------------------------------------------------------------------
// 6. `/shuffle` — เส้นไพ่คำนวณต้องไม่แตะการจั่วและไม่รับ pickedIndices
// ---------------------------------------------------------------------------
{
  const shuffleSrc = readSrc("src/app/api/reading/[id]/shuffle/route.ts");
  if (shuffleSrc) {
    check(
      "`/shuffle` อ่านสเปกจาก record เท่านั้น ไม่รับสเปกใหม่จาก body",
      shuffleSrc.includes("record.derivation") && !/derive:\s*z\./.test(shuffleSrc),
      "   ถ้ารับจาก body ผู้ใช้จะเปลี่ยนสเปทกลางคันหลังเห็นคำมั่นแล้ว"
    );
    check(
      "`/shuffle` ปฏิเสธ pickedIndices ในเซสชันไพ่คำนวณ",
      shuffleSrc.includes("DERIVED_SESSION_NO_PICK"),
      "   ไพ่ที่คำนวณได้กับไพ่ที่ผู้ใช้เลือกจากพัด ห้ามปนกันในเซสชันเดียว"
    );

    /*
     * ตรวจโครงจริง ๆ ว่า `drawCards(` ทุกจุดอยู่ในกิ่ง else ของ `if (record.derivation)`
     * (อ่านแบบนับวงเล็บ ไม่ใช่เดาจากลำดับบรรทัด — ย้ายโค้ดแล้วด่านนี้ต้องยังจับได้)
     */
    const branchStart = shuffleSrc.indexOf("if (record.derivation) {");
    const elseIndex = shuffleSrc.indexOf("} else {", branchStart);
    const derivedBranch = branchStart >= 0 && elseIndex > branchStart ? shuffleSrc.slice(branchStart, elseIndex) : "";
    check(
      "เส้นไพ่คำนวณไม่เรียก drawCards() เลยสักครั้ง",
      derivedBranch.length > 0 && !derivedBranch.includes("drawCards("),
      "   ถ้าเรียก แปลว่าไพ่ที่ควรคำนวณกลับถูกสุ่มทับ ผู้ใช้จะได้ไพ่วันเกิดที่ไม่ใช่ของวันเกิดตัวเอง"
    );
    check(
      "เส้นไพ่คำนวณล้มด้วย CARD_DATA_NOT_FOUND เมื่อคำนวณไม่ออก (ไม่มีไพ่สำรอง)",
      derivedBranch.includes("CARD_DATA_NOT_FOUND"),
      "   กฎเหล็กข้อ 14 — ต้องล้มดัง ๆ พร้อมบอกให้โหลดใหม่"
    );
  }
}

// ---------------------------------------------------------------------------
// 7. สเปกต้องเดินทางไปกับโทเคนเซสชัน และความจริงต้องเดินทางไปกับหลักฐาน
// ---------------------------------------------------------------------------
{
  const tokenSrc = readSrc("src/lib/security/session-token.ts");
  if (tokenSrc) {
    check(
      "โทเคนเซสชันพก derivation ไปด้วย (กู้เซสชันแล้วยังรู้ว่าเป็นไพ่คำนวณ)",
      tokenSrc.includes("derivation: record.derivation"),
      "   ถ้าตกหล่น เซสชันที่กู้ด้วยโทเคนจะตกไปจั่วสุ่มแทนการคำนวณ"
    );
  }

  const readSrcFile = readSrc("src/app/api/reading/[id]/read/route.ts");
  if (readSrcFile) {
    const proofCount = (readSrcFile.match(/deckSize:\s*78/g) || []).length;
    const derivationCount = (readSrcFile.match(/derivation: record\.derivation/g) || []).length;
    check(
      `หลักฐานทุกก้อนบอกด้วยว่าไพ่ชุดนี้คำนวณมาหรือจั่วมา (${derivationCount}/${proofCount} ก้อน)`,
      proofCount > 0 && derivationCount === proofCount,
      "   ถ้าบอกไม่ครบ วันหนึ่งจะมีคนเอาหลักฐานไปโชว์คู่แผงตรวจของการจั่วแล้วคำนวณซ้ำไม่ตรง"
    );
  }
}

// ---------------------------------------------------------------------------
// 8. ห้ามหน้าไหนเอาไพ่ที่คำนวณได้ไปโชว์คู่แผงตรวจ Provably Fair ของการจั่ว
// ---------------------------------------------------------------------------
{
  const DERIVED_UI = [
    { file: "src/components/pick-a-card/PickACardClient.tsx", why: "หน้าเลือกกองไพ่" },
    { file: "src/components/encyclopedia/BirthCardCalculator.tsx", why: "เครื่องคำนวณไพ่วันเกิด" },
    { file: "src/components/reading/ai/AiReadingPanel.tsx", why: "แผงคำอ่านที่สองหน้านี้ใช้ร่วมกัน" },
  ];
  const offenders: string[] = [];
  for (const entry of DERIVED_UI) {
    const src = readSrc(entry.file);
    if (src === null) continue;
    if (src.includes("ProvablyFairPanel")) {
      offenders.push(`   ${entry.file} — ${entry.why} แต่ดึงแผงตรวจของการจั่วมาแสดง`);
    }
  }
  check(
    `หน้าไพ่คำนวณไม่มีแผงตรวจของการจั่วปนอยู่ (${DERIVED_UI.length} ไฟล์)`,
    offenders.length === 0,
    offenders.join("\n") +
      "\n   ➔ ไพ่ชุดนี้ตรวจได้ด้วยการคำนวณซ้ำจากวันเกิด/วันที่ ไม่ใช่ด้วยการเฉลย serverSeed"
  );
  assertNonEmptyCorpus("ไฟล์หน้าจอของไพ่คำนวณ", DERIVED_UI, "ทะเบียนว่าง = ด่านนี้ไม่ได้ตรวจอะไรเลย");
}

// ---------------------------------------------------------------------------
// 9. หน้าไพ่วันเกิดต้องเทียบไพ่ของเซิร์ฟเวอร์กับสูตรในเครื่องก่อนแสดงผล
// ---------------------------------------------------------------------------
{
  const src = readSrc("src/components/encyclopedia/BirthCardCalculator.tsx");
  if (src) {
    check(
      "หน้าไพ่วันเกิดเปิดไพ่ผ่านท่อ AI (useAiReading + derive ของ birth-card)",
      /useAiReading\s*\(/.test(src) && /kind:\s*"birth-card"/.test(src),
      "   ถ้าไม่เรียก หน้านี้จะกลับไปเฉลยไพ่ให้ฟรีโดยไม่มีคำอ่าน AI และไม่มีกำแพงสมาชิก"
    );
    check(
      "หน้าไพ่วันเกิดเทียบรหัสไพ่ของเซิร์ฟเวอร์กับสูตรในเครื่องก่อนแสดงผล",
      src.includes("oracle.serverCards") && src.includes("expected.every"),
      "   สองฝั่งคำนวณคนละสูตรเมื่อไหร่ ต้องเห็น ไม่ใช่กลบด้วยการโชว์ของฝั่งใดฝั่งหนึ่ง"
    );
    check(
      "หน้าไพ่วันเกิดต่อกำแพงสิทธิ์และกล่องสมัครสมาชิกไว้ครบ",
      src.includes("AccessDialog") && src.includes("AuthModal"),
      "   ถูกเซิร์ฟเวอร์ปฏิเสธแล้วไม่มีกล่องอธิบาย ผู้ใช้จะเจอหน้าค้างโดยไม่รู้ว่าต้องสมัครสมาชิก"
    );
    check(
      "ลิงก์ที่แชร์มาพร้อมวันเกิดต้องไม่เปิดไพ่ให้เองอัตโนมัติ (กินโควตาของผู้ใช้)",
      !/setResult\(res\)/.test(src),
      "   เดิม `?d=&m=&y=` เฉลยไพ่ทันทีที่เปิดหน้า — ตอนนี้ต้องให้เจ้าของเครื่องกดเอง"
    );
  }
}

console.log(`\n📊 สรุป: ผ่าน ${pass} · ตก ${fail}`);
if (fail > 0) process.exit(1);
console.log('✅ ไพ่ที่คำนวณได้ผ่านครบ: ตรงสูตร · ตรึงที่เซิร์ฟเวอร์ · ไม่ปนกับการจั่ว · ไม่มีไพ่สำรอง');
