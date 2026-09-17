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
import { drawAnchors } from "@/lib/pick-a-card/draw-order";
import { composeReading, drawPicks, initialDraw, possibleCombinations } from "@/lib/pick-a-card/compose";
import { dailyDraw, dayLabel } from "@/lib/pick-a-card/daily";
import { pickACardTopicMetadata, pickACardTopicParams } from "@/app/_shared/pages/pick-a-card-topic";
import { PICK_A_CARD_TOPICS } from "@/data/pick-a-card";
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
// 1 + 2. ไม่ซ้ำช่องเดิม และในรอบเดียวกันทุกกองต้องได้คนละชิ้น
// ---------------------------------------------------------------------------
{
  const offenders: string[] = [];
  for (const poolSize of [4, 5, 6, 8, 12]) {
    const slotCount = 4;
    let order = Array.from({ length: slotCount }, (_, i) => i);
    for (let round = 0; round < 300; round++) {
      const next = drawAnchors(poolSize, slotCount, order);

      if (next.length !== slotCount || next.some((v) => v < 0 || v >= poolSize)) {
        offenders.push(`   คลัง ${poolSize} รอบ ${round}: ดัชนีหลุดขอบคลัง → [${next.join(",")}]`);
        break;
      }
      if (new Set(next).size !== slotCount) {
        offenders.push(`   คลัง ${poolSize} รอบ ${round}: มีสองกองได้คำอ่านชิ้นเดียวกัน → [${next.join(",")}]`);
        break;
      }
      const stuck = next.findIndex((value, index) => value === order[index]);
      if (stuck >= 0) {
        offenders.push(
          `   คลัง ${poolSize} รอบ ${round}: กองที่ ${stuck + 1} ยังได้ชิ้นเดิม (${next[stuck]}) — ผู้ใช้จะเจอไพ่ซ้ำ`
        );
        break;
      }
      order = next;
    }
  }
  check(
    "จั่วรอบใหม่แล้วไม่มีกองไหนได้คำอ่านชิ้นเดิมซ้ำรอบก่อน และทุกกองได้คนละชิ้น (คลัง 4–12 · 300 รอบต่อขนาด)",
    offenders.length === 0,
    offenders.join("\n")
  );
}

// ---------------------------------------------------------------------------
// 3. เล่นยาวแล้วกองแรกต้องเข้าถึงคลังได้ครบทุกชิ้น
// ---------------------------------------------------------------------------
{
  const poolSize = PICK_A_CARD_TOPICS[0].pool.length;
  let order = Array.from({ length: 4 }, (_, i) => i);
  const seenInFirstSlot = new Set<number>();
  for (let round = 0; round < 2000; round++) {
    order = drawAnchors(poolSize, 4, order);
    seenInFirstSlot.add(order[0]);
  }
  check(
    `กองแรกเข้าถึงคลังได้ครบทุกชิ้นเมื่อเล่นยาว 2,000 รอบ (เห็นแล้ว ${seenInFirstSlot.size}/${poolSize} ชิ้น)`,
    seenInFirstSlot.size === poolSize,
    `   เห็นเพียง [${[...seenInFirstSlot].sort((a, b) => a - b).join(", ")}] — ถ้าเข้าถึงได้แค่ไม่กี่ชิ้น ผู้ใช้จะรู้สึกว่า "ก็ซ้ำอยู่ดี"`
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
      "หน้า Pick A Card ยังจั่วใหม่ทุกรอบและประกอบคำอ่านจากคลัง (เรียก drawPicks + composeReading จริง)",
      /drawPicks\s*\(/.test(src) && /composeReading\s*\(/.test(src),
      "   ถ้าเลิกเรียก แปลว่ากองกลับไปผูกไพ่ชุดเดิมตายตัวเหมือนตอนเกิด INC-0198b/INC-0199b"
    );
  }
}

// ---------------------------------------------------------------------------
// 4.5 คลังรายตำแหน่ง — ทุกตำแหน่งต้องเปลี่ยนทุกรอบ และข้อความต้องมากับไพ่ของมันเสมอ
// ---------------------------------------------------------------------------
{
  const topic = PICK_A_CARD_TOPICS[0];
  const size = topic.pool.length;
  const slots = topic.slots.length;

  // (ก) จั่วรอบใหม่แล้วต้องเปลี่ยนทั้งสามตำแหน่ง
  let draw = initialDraw(slots);
  const stuck: string[] = [];
  for (let round = 0; round < 300; round++) {
    const next = drawPicks(size, slots, draw);
    if (next.hiddenPick === draw.hiddenPick) stuck.push(`รอบ ${round}: ใบที่ 2 ซ้ำเดิม (${next.hiddenPick})`);
    if (next.advicePick === draw.advicePick) stuck.push(`รอบ ${round}: ใบที่ 3 ซ้ำเดิม (${next.advicePick})`);
    if (next.anchorOrder.some((v, i) => v === draw.anchorOrder[i])) stuck.push(`รอบ ${round}: ไพ่หลักของบางช่องซ้ำเดิม`);
    if (stuck.length) break;
    draw = next;
  }
  check(
    "จั่วรอบใหม่แล้วเปลี่ยนครบทั้งสามตำแหน่ง (ไพ่หลัก · สิ่งที่ซ่อนอยู่ · คำแนะนำ) 300 รอบ",
    stuck.length === 0,
    stuck.slice(0, 3).map((l) => `   ${l}`).join("\n")
  );

  // (ข) ความหลากหลายที่เข้าถึงได้จริงต้องเท่ากับ poolSize³ ไม่ใช่ poolSize
  const seen = new Set<string>();
  let probe = initialDraw(slots);
  for (let round = 0; round < 6000; round++) {
    probe = drawPicks(size, slots, probe);
    const r = composeReading(topic, probe, 0, false);
    seen.add(r.cards.map((c) => c.cardId).join("+"));
  }
  check(
    `กองเดียวเข้าถึงคำอ่านได้ ${possibleCombinations(size)} ชุด (เจอจริง ${seen.size} ชุดจากการสุ่ม 6,000 รอบ)`,
    seen.size === possibleCombinations(size),
    `   ถ้าน้อยกว่านี้แปลว่าคลังรายตำแหน่งถูกมัดกลับเป็นกองเหมือนเดิม`
  );

  // (ค) ข้อความต้องมากับไพ่ของตำแหน่งนั้นเสมอ — จับคู่ข้ามตำแหน่ง = พูดถึงไพ่ที่ไม่ได้อยู่ตรงหน้า
  const FIELDS = ["currentSituation", "hiddenLayer", "oracleAdvice"] as const;
  const mismatched: string[] = [];
  for (const t of PICK_A_CARD_TOPICS) {
    let d = initialDraw(t.slots.length);
    for (let round = 0; round < 60; round++) {
      d = drawPicks(t.pool.length, t.slots.length, d);
      for (let slot = 0; slot < t.slots.length; slot++) {
        for (const isEn of [false, true]) {
          const r = composeReading(t, d, slot, isEn);
          r.cards.forEach((card, idx) => {
            const home = t.pool.find((entry) => {
              const reading = isEn ? entry.readingEn : entry.readingTh;
              return entry.cards[idx].cardId === card.cardId && reading[FIELDS[idx]] === r.bodies[idx];
            });
            if (!home) mismatched.push(`${t.id} ช่อง ${slot + 1} ตำแหน่ง ${idx + 1}: ข้อความไม่ใช่ของไพ่ ${card.cardId}`);
          });
        }
      }
    }
  }
  check(
    "ทุกย่อหน้ามากับไพ่ของตำแหน่งตัวเองเสมอ (สุ่มตรวจ 4 หัวข้อ × 60 รอบ × 2 ภาษา)",
    mismatched.length === 0,
    [...new Set(mismatched)].slice(0, 5).map((l) => `   ${l}`).join("\n")
  );
}

// ---------------------------------------------------------------------------
// 4.55 ไพ่ใบเดียวกันต้องไม่โผล่สองตำแหน่งในหัวข้อเดียว (กันจั่วแล้วเห็นไพ่ซ้ำใบในรอบเดียว)
// ---------------------------------------------------------------------------
{
  const offenders: string[] = [];
  for (const t of PICK_A_CARD_TOPICS) {
    const seen = new Map<string, string>();
    t.pool.forEach((entry, entryIndex) => {
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
    for (const pile of t.pool) {
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
  const poolSize = topic.pool.length;
  const slotCount = topic.slots.length;

  // (ก) ทำซ้ำได้ — ถ้าเมล็ดเดียวกันให้คนละผล คำว่า "ประจำวัน" จะไม่มีความหมาย
  const a = dailyDraw("2026-09-17:love-feelings", poolSize, slotCount);
  const b = dailyDraw("2026-09-17:love-feelings", poolSize, slotCount);
  check(
    "สำรับประจำวันทำซ้ำได้ (เมล็ดเดียวกัน ➔ ชุดเดิมเป๊ะ)",
    JSON.stringify(a) === JSON.stringify(b),
    `   ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`
  );

  // (ข) ดัชนีต้องอยู่ในคลังจริง และกองทั้งสี่ต้องได้คนละชิ้น
  const valid = (d: typeof a) =>
    d.anchorOrder.length === slotCount &&
    new Set(d.anchorOrder).size === slotCount &&
    d.anchorOrder.every((v) => v >= 0 && v < poolSize) &&
    d.hiddenPick >= 0 && d.hiddenPick < poolSize &&
    d.advicePick >= 0 && d.advicePick < poolSize;
  check("สำรับประจำวันชี้ไปที่คลังจริงและทุกกองได้คนละชิ้น", valid(a), `   ${JSON.stringify(a)}`);

  // (ค) 60 วันติดกันต้องไม่จมอยู่กับชุดเดิมไม่กี่ชุด
  const seen = new Set<string>();
  for (let day = 1; day <= 60; day++) {
    const key = `2026-10-${String(day % 31 || 1).padStart(2, "0")}-${day}:${topic.id}`;
    const d = dailyDraw(key, poolSize, slotCount);
    seen.add(`${d.anchorOrder[0]}-${d.hiddenPick}-${d.advicePick}`);
  }
  check(
    `สำรับประจำวัน 60 วันติดกันได้ชุดต่างกัน ${seen.size} ชุด (ต้องมากกว่า 20)`,
    seen.size > 20,
    "   ถ้าน้อยกว่านี้แปลว่าเมล็ดกระจายไม่ดี ผู้ใช้จะเจอสำรับเดิมบ่อยเกินไป"
  );

  // (ง) ป้ายวันที่อ่านออกทั้งสองภาษา
  check(
    "ป้ายวันที่ของสำรับประจำวันอ่านออกทั้งสองภาษา",
    dayLabel("2026-09-17", false) === "17 ก.ย." && dayLabel("2026-09-17", true) === "Sep 17",
    `   ได้ "${dayLabel("2026-09-17", false)}" / "${dayLabel("2026-09-17", true)}"`
  );

  // (จ) หน้าเว็บต้องเริ่มที่สำรับประจำวันจริง ไม่ใช่สุ่มทันที
  // ⚠️ ไฟล์หาย = ตกด่าน ห้ามข้ามเงียบ (กฎของ test-gate-integrity.ts)
  const clientForDaily = fs.existsSync(CLIENT) ? stripComments(fs.readFileSync(CLIENT, "utf-8")) : "";
  check(
    "หน้า Pick A Card เริ่มด้วยสำรับประจำวัน (เรียก dailyDraw + bangkokDayKey)",
    /dailyDraw\s*\(/.test(clientForDaily) && clientForDaily.includes("bangkokDayKey"),
    "   ถ้าไม่เรียก ผู้ใช้จะเห็นคนละสำรับกันหมดและไม่มีเหตุผลให้กลับมาพรุ่งนี้ (หรือหาไฟล์ไม่เจอ)"
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
