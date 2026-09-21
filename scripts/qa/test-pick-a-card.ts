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
 * 3. เล่นยาวแล้วช่องแรกต้องเข้าถึงคลังได้ครบทุกชิ้น — กันกรณี "สลับไปมาอยู่แค่สองชุด"
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
import { composeFromDerived, possibleCombinations } from "@/lib/pick-a-card/compose";
import { dayLabel, seededOrder } from "@/lib/pick-a-card/daily";
import { deriveDrawn } from "@/lib/reading/derived-draw";
import { pickACardTopicMetadata, pickACardTopicParams } from "@/app/_shared/pages/pick-a-card-topic";
import { PICK_A_CARD_TOPICS } from "@/data/pick-a-card";
import { PICK_A_CARD_POOLS } from "@/data/pick-a-card-readings";
import { CARD_SUMMARIES } from "@/data/cards/summary";

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
// เครื่องมือร่วม — เรียกตัวคำนวณฝั่งเซิร์ฟเวอร์เหมือนที่ `/api/reading/[id]/shuffle` เรียก
// ---------------------------------------------------------------------------
/** คีย์วันแบบ `YYYY-MM-DD` ที่เลื่อนจาก 2026-09-18 ไป `offset` วัน */
function dayKeyAt(offset: number): string {
  return new Date(Date.UTC(2026, 8, 18 + offset)).toISOString().slice(0, 10);
}

/** ไพ่ที่เซิร์ฟเวอร์จะเปิดให้กองนั้นในวันนั้น — `null` = คำนวณไม่ออก (ถือว่าตกด่าน) */
function pileCards(topicId: string, slotIndex: number, dayKey: string): number[] | null {
  const derived = deriveDrawn({ kind: "pick-a-card", topicId, slotIndex, dayKey });
  return derived ? derived.drawn.map((d) => d.cardIndex) : null;
}

// ---------------------------------------------------------------------------
// 0. คลังคำอ่านอยู่คนละไฟล์กับตัวตนของหัวข้อ และต้องครบทุกหัวข้อ (ISSUE-050)
// ---------------------------------------------------------------------------
{
  /*
   * ⭐ การแยกไฟล์ทำให้เกิดความพังแบบใหม่ที่ของเดิมไม่มี: หัวข้อที่ **ไม่มีคลังคำอ่านคู่กัน**
   * จะคอมไพล์ผ่านทุกด่านของ TypeScript แต่ผู้ใช้กดเปิดกองนั้นแล้วเปิดไม่ออกเลยสักใบ
   * (`derivePickACard` คืน undefined ➔ API ตอบ "โหลดใหม่อีกครั้ง") ด่านนี้จึงต้องมี
   */
  const missing = PICK_A_CARD_TOPICS.filter((t) => !PICK_A_CARD_POOLS[t.id]?.length).map((t) => t.id);
  check(
    `ทุกหัวข้อมีคลังคำอ่านคู่กันครบ (${PICK_A_CARD_TOPICS.length} หัวข้อ)`,
    missing.length === 0,
    `   หัวข้อที่ไม่มีคลัง: ${missing.join(", ")} — ผู้ใช้จะกดเปิดกองของหัวข้อนี้ไม่ได้เลย`
  );

  const orphanPools = Object.keys(PICK_A_CARD_POOLS).filter(
    (id) => !PICK_A_CARD_TOPICS.some((t) => t.id === id)
  );
  check(
    "ไม่มีคลังคำอ่านกำพร้าที่ไม่มีหัวข้อรองรับ",
    orphanPools.length === 0,
    `   คลังที่ไม่มีหัวข้อ: ${orphanPools.join(", ")}`
  );

  /*
   * คลังคำอ่านหนักราว 1,600 บรรทัด และผู้ใช้เห็นก็ต่อเมื่อเปิดกองแล้ว
   * ถ้าไฟล์ฝั่งเบราว์เซอร์ import มันเข้าไป น้ำหนักทั้งก้อนจะกลับเข้าบันเดิลเงียบ ๆ (ISSUE-050)
   * เซิร์ฟเวอร์เป็นผู้ประกอบย่อหน้าแล้วส่งมากับคำตอบของ `/shuffle` แทน
   */
  const CLIENT_SIDE_DIRS = ["src/components", "src/app/_shared", "astro"];
  const offenders: string[] = [];
  let scanned = 0;
  const walk = (dir: string): void => {
    const full = path.join(ROOT, dir);
    if (!fs.existsSync(full)) return;
    for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(rel);
        continue;
      }
      if (!/\.(ts|tsx|astro)$/.test(entry.name)) continue;
      scanned++;
      const src = fs.readFileSync(path.join(ROOT, rel), "utf-8");
      if (src.includes("pick-a-card-readings")) offenders.push(`   ${rel}`);
    }
  };
  for (const dir of CLIENT_SIDE_DIRS) walk(dir);
  check(
    `ไม่มีไฟล์ฝั่งหน้าจอ import คลังคำอ่านเข้าบันเดิล (สแกน ${scanned} ไฟล์)`,
    offenders.length === 0 && scanned > 0,
    offenders.join("\n") +
      "\n   ➔ ให้เซิร์ฟเวอร์ประกอบแล้วส่งมาใน `derived.script` แทน (ดู src/lib/reading/derived-draw.ts)"
  );
}

// ---------------------------------------------------------------------------
// 1. คำนวณซ้ำได้เป๊ะ — สเปกเดิมต้องได้ไพ่ชุดเดิมทุกครั้ง
// ---------------------------------------------------------------------------
{
  const offenders: string[] = [];
  for (const topic of PICK_A_CARD_TOPICS) {
    const first = JSON.stringify(deriveDrawn({ kind: "pick-a-card", topicId: topic.id, slotIndex: 0, dayKey: dayKeyAt(0) }));
    for (let round = 0; round < 50; round++) {
      const again = JSON.stringify(deriveDrawn({ kind: "pick-a-card", topicId: topic.id, slotIndex: 0, dayKey: dayKeyAt(0) }));
      if (again !== first) {
        offenders.push(`   ${topic.id}: รอบที่ ${round + 1} ได้คนละชุดกับรอบแรก`);
        break;
      }
    }
    if (first === "undefined") offenders.push(`   ${topic.id}: คำนวณไพ่ไม่ออกเลย`);
  }
  check(
    `สำรับของเซิร์ฟเวอร์คำนวณซ้ำได้เป๊ะ (${PICK_A_CARD_TOPICS.length} หัวข้อ × 50 รอบ)`,
    offenders.length === 0,
    offenders.join("\n") + "\n   ➔ ถ้าไม่ตรง ผู้ใช้ที่กดซ้ำ/โหลดใหม่จะได้ไพ่คนละชุดกับที่แม่หมอกำลังอ่านอยู่"
  );
}

// ---------------------------------------------------------------------------
// 2. วันเดียวกัน — ทุกกองต้องได้ไพ่คนละชุด
// ---------------------------------------------------------------------------
{
  const offenders: string[] = [];
  for (const topic of PICK_A_CARD_TOPICS) {
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const dayKey = dayKeyAt(dayOffset);
      const sets = topic.slots.map((_, slot) => pileCards(topic.id, slot, dayKey));
      if (sets.some((set) => set === null)) {
        offenders.push(`   ${topic.id} ${dayKey}: มีกองที่คำนวณไพ่ไม่ออก`);
        break;
      }
      const keys = sets.map((set) => set!.join("+"));
      if (new Set(keys).size !== keys.length) {
        offenders.push(`   ${topic.id} ${dayKey}: มีสองกองได้ไพ่ชุดเดียวกัน → ${keys.join(" | ")}`);
        break;
      }
      // ไพ่หลัก (ใบแรก) ต้องคนละใบทุกกองด้วย ไม่ใช่แค่ "ชุดไม่เหมือนกัน"
      const anchors = sets.map((set) => set![0]);
      if (new Set(anchors).size !== anchors.length) {
        offenders.push(`   ${topic.id} ${dayKey}: ไพ่หลักซ้ำกันระหว่างกอง → [${anchors.join(",")}]`);
        break;
      }
    }
  }
  check(
    "วันเดียวกันทุกกองได้ไพ่คนละชุด และไพ่หลักไม่ซ้ำกัน (ทุกหัวข้อ × 30 วัน)",
    offenders.length === 0,
    offenders.slice(0, 5).join("\n")
  );
}

// ---------------------------------------------------------------------------
// 3. วันใหม่ต้องไม่ซ้ำเมื่อวาน — คำสัญญาเดิมของ INC-0198b ในเวอร์ชันเซิร์ฟเวอร์
// ---------------------------------------------------------------------------
{
  const offenders: string[] = [];
  for (const topic of PICK_A_CARD_TOPICS) {
    for (let slot = 0; slot < topic.slots.length; slot++) {
      for (let dayOffset = 1; dayOffset <= 60; dayOffset++) {
        const today = pileCards(topic.id, slot, dayKeyAt(dayOffset));
        const yesterday = pileCards(topic.id, slot, dayKeyAt(dayOffset - 1));
        if (!today || !yesterday) {
          offenders.push(`   ${topic.id} กองที่ ${slot + 1}: คำนวณไพ่ไม่ออก`);
          break;
        }
        const repeated = today.filter((cardIndex, i) => cardIndex === yesterday[i]);
        if (repeated.length > 0) {
          offenders.push(
            `   ${topic.id} กองที่ ${slot + 1} วันที่ ${dayKeyAt(dayOffset)}: ตำแหน่งเดิมได้ไพ่เดิมกับเมื่อวาน (${repeated.join(",")})`
          );
          break;
        }
      }
    }
  }
  check(
    "เปิดกองเดิมวันถัดไปต้องไม่ได้ไพ่ใบเดิมในตำแหน่งเดิม (ทุกหัวข้อ × ทุกกอง × 60 วันติด)",
    offenders.length === 0,
    offenders.slice(0, 5).join("\n") +
      "\n   ➔ นี่คือเรื่องที่เจ้าของทักไว้ตรง ๆ ว่า \"เลือกกองเดิม ไพ่ซ้ำ ซ้ำตลอด\" (INC-0198b)"
  );
}

// ---------------------------------------------------------------------------
// 4. เล่นยาวหลายวัน กองแรกต้องเข้าถึงคลังได้ครบทุกชิ้น
// ---------------------------------------------------------------------------
{
  const topic = PICK_A_CARD_TOPICS[0];
  const poolSize = PICK_A_CARD_POOLS[topic.id].length;
  const seenAnchors = new Set<number>();
  for (let dayOffset = 0; dayOffset < 400; dayOffset++) {
    const derived = deriveDrawn({ kind: "pick-a-card", topicId: topic.id, slotIndex: 0, dayKey: dayKeyAt(dayOffset) });
    if (derived?.detail.kind === "pick-a-card") seenAnchors.add(derived.detail.anchor);
  }
  check(
    `กองแรกเข้าถึงคลังได้ครบทุกชิ้นเมื่อเดิน 400 วัน (เห็นแล้ว ${seenAnchors.size}/${poolSize} ชิ้น)`,
    seenAnchors.size === poolSize,
    `   เห็นเพียง [${[...seenAnchors].sort((a, b) => a - b).join(", ")}] — ถ้าเข้าถึงได้แค่ไม่กี่ชิ้น ผู้ใช้จะรู้สึกว่า "ก็ซ้ำอยู่ดี"`
  );

  // ความหลากหลายที่เข้าถึงได้จริงของกองเดียว ต้องมากกว่าจำนวนชิ้นในคลัง (ไม่ใช่ผูกเป็นกองตายตัว)
  const seenSets = new Set<string>();
  for (let dayOffset = 0; dayOffset < 400; dayOffset++) {
    const cards = pileCards(topic.id, 0, dayKeyAt(dayOffset));
    if (cards) seenSets.add(cards.join("+"));
  }
  check(
    `กองเดียวเข้าถึงไพ่ได้ ${seenSets.size} ชุดใน 400 วัน (เพดานเชิงทฤษฎี ${possibleCombinations(poolSize)} ชุด · ต้องมากกว่า ${poolSize})`,
    seenSets.size > poolSize,
    "   ถ้าเท่ากับจำนวนชิ้นในคลังพอดี แปลว่าไพ่สามใบถูกมัดเป็นกองเหมือนก่อน INC-0199b"
  );
}

// ---------------------------------------------------------------------------
// 5. ย่อหน้าที่เขียนไว้ต้องมากับไพ่ของตำแหน่งตัวเองเสมอ
// ---------------------------------------------------------------------------
{
  const FIELDS = ["currentSituation", "hiddenLayer", "oracleAdvice"] as const;
  const mismatched: string[] = [];

  for (const topic of PICK_A_CARD_TOPICS) {
    for (let dayOffset = 0; dayOffset < 20; dayOffset++) {
      const dayKey = dayKeyAt(dayOffset);
      for (let slot = 0; slot < topic.slots.length; slot++) {
        const derived = deriveDrawn({ kind: "pick-a-card", topicId: topic.id, slotIndex: slot, dayKey });
        if (!derived || derived.detail.kind !== "pick-a-card") {
          mismatched.push(`${topic.id} ${dayKey} กอง ${slot + 1}: คำนวณไม่ออก`);
          continue;
        }
        for (const isEn of [false, true]) {
          const composed = composeFromDerived(PICK_A_CARD_POOLS[topic.id], derived.detail, isEn);
          if (!composed) {
            mismatched.push(`${topic.id} ${dayKey} กอง ${slot + 1}: ประกอบเนื้อหาไม่ได้`);
            continue;
          }
          composed.cards.forEach((card, idx) => {
            const home = PICK_A_CARD_POOLS[topic.id].find((entry) => {
              const reading = isEn ? entry.readingEn : entry.readingTh;
              return entry.cards[idx].cardId === card.cardId && reading[FIELDS[idx]] === composed.bodies[idx];
            });
            if (!home) mismatched.push(`${topic.id} กอง ${slot + 1} ตำแหน่ง ${idx + 1}: ข้อความไม่ใช่ของไพ่ ${card.cardId}`);
          });
        }
      }
    }
  }
  check(
    "ทุกย่อหน้ามากับไพ่ของตำแหน่งตัวเองเสมอ (ทุกหัวข้อ × 20 วัน × ทุกกอง × 2 ภาษา)",
    mismatched.length === 0,
    [...new Set(mismatched)].slice(0, 5).map((l) => `   ${l}`).join("\n")
  );
}

// ---------------------------------------------------------------------------
// 6. หน้า Pick A Card ต้องเปิดไพ่ผ่านท่อ AI เท่านั้น — ห้ามมีตัวจั่วฝั่งเบราว์เซอร์หลงเหลือ
// ---------------------------------------------------------------------------
{
  if (!fs.existsSync(CLIENT)) {
    check("หาไฟล์ PickACardClient.tsx เจอ", false, `   ไม่พบ ${path.relative(ROOT, CLIENT)} — ถ้าย้ายไฟล์จริงให้แก้ด่านนี้ด้วย`);
  } else {
    const src = stripComments(fs.readFileSync(CLIENT, "utf-8"));
    check(
      "หน้า Pick A Card เปิดไพ่ผ่านท่อ AI (useAiReading + derive ของ pick-a-card)",
      /useAiReading\s*\(/.test(src) && /kind:\s*"pick-a-card"/.test(src),
      "   ถ้าไม่เรียก แปลว่าหน้านี้กลับไปเปิดไพ่เองโดยไม่มีทั้งคำอ่าน AI และกำแพงสมาชิก"
    );
    check(
      "หน้า Pick A Card ไม่มีตัวจั่วฝั่งเบราว์เซอร์หลงเหลือ (dailyDraw / drawPicks / Math.random)",
      !/dailyDraw\s*\(/.test(src) && !/drawPicks\s*\(/.test(src) && !/Math\.random\s*\(/.test(src),
      "   ไพ่ที่เบราว์เซอร์จั่วเองจะไม่ใช่ไพ่ใบเดียวกับที่แม่หมอกำลังอ่าน ผู้ใช้จะเห็นไพ่ชุดหนึ่งแต่ได้ยินคำอ่านอีกชุด"
    );
    check(
      "หน้า Pick A Card ต่อกำแพงสิทธิ์และกล่องสมัครสมาชิกไว้ครบ",
      src.includes("AccessDialog") && src.includes("AuthModal"),
      "   ถูกเซิร์ฟเวอร์ปฏิเสธแล้วไม่มีกล่องอธิบาย ผู้ใช้จะเจอหน้าค้างโดยไม่รู้ว่าต้องสมัครสมาชิก"
    );
  }
}

// ---------------------------------------------------------------------------
// 4.55 ไพ่ใบเดียวกันต้องไม่โผล่สองตำแหน่งในหัวข้อเดียว (กันจั่วแล้วเห็นไพ่ซ้ำใบในรอบเดียว)
// ---------------------------------------------------------------------------
{
  const offenders: string[] = [];
  for (const t of PICK_A_CARD_TOPICS) {
    const seen = new Map<string, string>();
    PICK_A_CARD_POOLS[t.id].forEach((entry, entryIndex) => {
      entry.cards.forEach((card, position) => {
        const key = card.cardId;
        const where = `ชิ้นที่ ${entryIndex + 1} ตำแหน่ง ${position + 1}`;
        const prev = seen.get(key);
        if (prev) offenders.push(`${t.id}: ${key} อยู่ทั้ง ${prev} และ ${where}`);
        else seen.set(key, where);
      });
    });
  }
  check(
    "ไพ่ใบเดียวกันไม่โผล่ซ้ำในหัวข้อเดียวกัน (จั่วแล้วไม่มีทางเห็นไพ่ใบเดิมสองช่องพร้อมกัน)",
    offenders.length === 0,
    offenders.slice(0, 5).map((l) => `   ${l}`).join("\n")
  );
}

// ---------------------------------------------------------------------------
// 4.6 กติกาเนื้อหา — ย่อหน้าไหนอ้างชื่อไพ่ ต้องเป็นไพ่ของตำแหน่งตัวเองเท่านั้น
// ---------------------------------------------------------------------------
{
  /**
   * ⭐ นี่คือกฎที่กันไม่ให้ INC-0199b เกิดซ้ำ
   * ตอนที่เนื้อหายังมัดเป็นกอง ข้อความ "พลังงานหลัก" เล่าอาร์คของไพ่ทั้งสามใบรวมกัน
   * พอแยกคลังรายตำแหน่ง ข้อความแบบนั้นจะพูดถึงไพ่ที่ไม่ได้อยู่ตรงหน้าผู้ใช้ทันที
   */
  const names = CARD_SUMMARIES.map((c) => ({ id: c.id, names: [c.nameEn, c.nameTh].filter(Boolean) }));
  const FRAME_FIELDS = ["theme", "overview", "affirmation"] as const;
  const BODY_FIELDS = { currentSituation: 0, hiddenLayer: 1, oracleAdvice: 2 } as const;

  function mentionedCards(text: string): string[] {
    const hits: string[] = [];
    for (const card of names) {
      if (card.names.some((n) => n.length > 4 && text.includes(n))) hits.push(card.id);
    }
    return hits;
  }

  const offenders: string[] = [];
  for (const t of PICK_A_CARD_TOPICS) {
    for (const pile of PICK_A_CARD_POOLS[t.id]) {
      for (const lang of ["readingTh", "readingEn"] as const) {
        const reading = pile[lang];
        for (const field of FRAME_FIELDS) {
          const allowed = [pile.cards[0].cardId]; // กรอบเดินทางไปกับ "ไพ่หลัก" เท่านั้น
          const foreign = mentionedCards(reading[field]).filter((id) => !allowed.includes(id));
          if (foreign.length) offenders.push(`${t.id}/${pile.id}/${lang}.${field} อ้างถึง ${foreign.join(",")}`);
        }
        for (const [field, index] of Object.entries(BODY_FIELDS)) {
          const allowed = [pile.cards[index].cardId];
          const foreign = mentionedCards(reading[field as keyof typeof reading]).filter((id) => !allowed.includes(id));
          if (foreign.length) offenders.push(`${t.id}/${pile.id}/${lang}.${field} อ้างถึง ${foreign.join(",")}`);
        }
      }
    }
  }
  check(
    "ไม่มีย่อหน้าไหนอ้างชื่อไพ่ที่ไม่ได้อยู่ในตำแหน่งของตัวเอง",
    offenders.length === 0,
    offenders.slice(0, 6).map((l) => `   ${l}`).join("\n") +
      "\n   ➔ เขียนใหม่ให้พูดถึงไพ่ของตำแหน่งนั้นใบเดียว ไม่งั้นผู้ใช้จะอ่านเจอไพ่ที่ไม่ได้อยู่ตรงหน้า"
  );
}

// ---------------------------------------------------------------------------
// 4.7 สำรับประจำวัน — เมล็ดเดียวกันต้องได้ชุดเดิมเสมอ และคนละวันต้องได้คนละชุด
// ---------------------------------------------------------------------------
{
  const topic = PICK_A_CARD_TOPICS[0];
  const poolSize = PICK_A_CARD_POOLS[topic.id].length;

  // (ก) ทำซ้ำได้ — ถ้าเมล็ดเดียวกันให้คนละลำดับ คำว่า "ประจำวัน" จะไม่มีความหมาย
  const a = seededOrder(`${topic.id}:anchor`, poolSize);
  const b = seededOrder(`${topic.id}:anchor`, poolSize);
  check(
    "ลำดับประจำตำแหน่งทำซ้ำได้ (เมล็ดเดียวกัน ➔ ลำดับเดิมเป๊ะ)",
    JSON.stringify(a) === JSON.stringify(b),
    `   ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`
  );

  // (ข) ต้องเป็นการเรียงสับเปลี่ยนที่สมบูรณ์ — ไม่งั้นมีชิ้นในคลังที่ผู้ใช้ไม่มีวันได้เห็น
  check(
    `ลำดับประจำตำแหน่งครบทุกชิ้นในคลัง (${poolSize} ชิ้น ไม่ขาดไม่เกิน)`,
    a.length === poolSize && new Set(a).size === poolSize && a.every((v: number) => v >= 0 && v < poolSize),
    `   ${JSON.stringify(a)}`
  );

  // (ค) สามตำแหน่งต้องใช้ลำดับคนละชุด ไม่งั้นไพ่สามใบจะเดินพร้อมกันเป็นชุดเดิมตลอดไป
  const anchorOrder = JSON.stringify(seededOrder(`${topic.id}:anchor`, poolSize));
  const hiddenOrder = JSON.stringify(seededOrder(`${topic.id}:hidden`, poolSize));
  const adviceOrder = JSON.stringify(seededOrder(`${topic.id}:advice`, poolSize));
  check(
    "สามตำแหน่งใช้ลำดับคนละชุด (ไพ่สามใบไม่เดินเป็นก้อนเดียวกัน)",
    new Set([anchorOrder, hiddenOrder, adviceOrder]).size === 3,
    "   ถ้าลำดับซ้ำกัน คู่ไพ่ 3 ใบจะวนอยู่แค่ไม่กี่ชุดเหมือนก่อน INC-0199b"
  );

  // (ง) ป้ายวันที่อ่านออกทั้งสองภาษา
  check(
    "ป้ายวันที่ของสำรับประจำวันอ่านออกทั้งสองภาษา",
    dayLabel("2026-09-17", false) === "17 ก.ย." && dayLabel("2026-09-17", true) === "Sep 17",
    `   ได้ "${dayLabel("2026-09-17", false)}" / "${dayLabel("2026-09-17", true)}"`
  );

  // (จ) สำรับประจำวันต้องถูกคำนวณฝั่งเซิร์ฟเวอร์เท่านั้น และหน้าเว็บยังโชว์ป้ายวันอยู่
  // ⚠️ ไฟล์หาย = ตกด่าน ห้ามข้ามเงียบ (กฎของ test-gate-integrity.ts)
  const clientForDaily = fs.existsSync(CLIENT) ? stripComments(fs.readFileSync(CLIENT, "utf-8")) : "";
  check(
    "หน้า Pick A Card ยังบอกผู้ใช้ว่าเป็นสำรับประจำวัน (ใช้ dayLabel กับวันที่เซิร์ฟเวอร์ส่งมา)",
    /dayLabel\s*\(/.test(clientForDaily) && clientForDaily.includes("dayKey"),
    "   ถ้าป้ายหาย ผู้ใช้จะไม่รู้ว่าพรุ่งนี้สำรับเปลี่ยน — เหตุผลที่ต้องกลับมาพรุ่งนี้หายไปด้วย"
  );

  const derivedSrc = fs.readFileSync(path.join(SRC, "lib/reading/derived-draw.ts"), "utf-8");
  check(
    "ตัวคำนวณฝั่งเซิร์ฟเวอร์เป็นผู้ประกอบสำรับประจำวันแทน (deriveDrawn ใช้ seededOrder + เลขวัน)",
    /seededOrder\s*\(/.test(derivedSrc) && derivedSrc.includes("dayNumber"),
    "   ถ้าไม่ได้ใช้ แปลว่าสำรับประจำวันถูกเปลี่ยนเป็นการสุ่มรายครั้ง คำว่า 'ประจำวัน' จะไม่มีความหมาย"
  );
}

// ---------------------------------------------------------------------------
// 4.8 ทุกหัวข้อต้องมีหน้าของตัวเอง พร้อมเนื้อหา SEO สองภาษาและชื่อเรื่องไม่เกินเพดาน
// ---------------------------------------------------------------------------
{
  /** เพดาน SERP 60 ตัวอักษร ลบท้าย " · SeerTarot" ที่ layout เติมให้เอง (12 ตัว) */
  const TITLE_BUDGET = 60 - " · SeerTarot".length;

  const problems: string[] = [];
  for (const topic of PICK_A_CARD_TOPICS) {
    for (const locale of ["th", "en"] as const) {
      let meta;
      try {
        meta = pickACardTopicMetadata(topic, locale);
      } catch (error) {
        problems.push(`${topic.id}/${locale}: ${(error as Error).message}`);
        continue;
      }
      const title = String(meta.title ?? "");
      if (!title) problems.push(`${topic.id}/${locale}: ไม่มีชื่อเรื่อง`);
      if (title.length > TITLE_BUDGET) {
        problems.push(`${topic.id}/${locale}: ชื่อเรื่องยาว ${title.length} เกินเพดาน ${TITLE_BUDGET}`);
      }
      if (!meta.description) problems.push(`${topic.id}/${locale}: ไม่มีคำอธิบาย`);
      const canonical = String((meta.alternates as { canonical?: string } | undefined)?.canonical ?? "");
      if (!canonical.includes(`/pick-a-card/${topic.slug}`)) {
        problems.push(`${topic.id}/${locale}: canonical ไม่ได้ชี้มาที่หน้าหัวข้อ (${canonical})`);
      }
    }
  }

  check(
    `ทุกหัวข้อมีหน้าของตัวเองพร้อมเนื้อหา SEO สองภาษา (${PICK_A_CARD_TOPICS.length} หัวข้อ · ${pickACardTopicParams().length} เส้นทาง)`,
    problems.length === 0 && pickACardTopicParams().length === PICK_A_CARD_TOPICS.length,
    problems.slice(0, 6).map((l) => `   ${l}`).join("\n") +
      "\n   ➔ หัวข้อใหม่ต้องเพิ่มเนื้อหาใน TOPIC_COPY ของ src/app/_shared/pages/pick-a-card-topic.tsx ด้วยเสมอ"
  );
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
