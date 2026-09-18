/**
 * 🎯 ไพ่ที่ "คำนวณได้" ไม่ใช่ไพ่ที่สุ่ม — ท่อฝั่งเซิร์ฟเวอร์ของคลื่นที่ 2
 * ===========================================================================
 *
 * ## ปัญหาที่ทำให้ต้องมีไฟล์นี้ (สรุปจากคลื่นที่ 1)
 *
 * สองหน้าสุดท้ายที่ยังไม่ได้ต่อ AI คือ `/pick-a-card` กับ `/cards/birth-card`
 * ทั้งคู่ **ไพ่ถูกกำหนดไว้ล่วงหน้า** ไม่ได้มาจากการจั่ว:
 *
 * | หน้า | ไพ่มาจากไหน |
 * | :--- | :--- |
 * | `/cards/birth-card` | เลขศาสตร์จากวันเดือนปีเกิด (`calculateBirthCard`) — คงที่ตลอดชีวิต |
 * | `/pick-a-card` | สำรับประจำวันของกองนั้น (`dailyDraw` + คลังคำอ่านที่เขียนไว้แล้ว) |
 *
 * ท่อเดิม (`/api/reading/[id]/shuffle`) สั่งไพ่ตรง ๆ ไม่ได้ เพราะ `pickedIndices`
 * คือ **ตำแหน่งในพัด ไม่ใช่เลขไพ่** (`deck[fanIndex]`) ฝั่งเว็บจึงบอกไม่ได้ว่าอยากได้ใบไหน
 * และ **ห้ามเจาะรูตรงนั้น** เพราะการที่ไคลเอนต์สั่งเลขไพ่ได้ = ทำลายหัวใจ Provably Fair
 * ของ "ทั้งเว็บ" ไม่ใช่แค่สองหน้านี้
 *
 * ## ทางที่เลือก
 *
 * แยก "เส้นทางไพ่ที่คำนวณได้" ออกมาเป็นเส้นของตัวเอง โดยมีกติกา 4 ข้อ:
 *
 * 1. **เซิร์ฟเวอร์คำนวณเองทั้งหมด** จากข้อมูลตั้งต้นที่ตรวจสอบได้ (วันเกิด · รหัสกอง + วันของไทย)
 *    ไคลเอนต์ส่งได้แค่ "ข้อมูลตั้งต้น" ไม่ใช่ "คำตอบ"
 * 2. **ตรึงตั้งแต่ `/start`** — สเปกถูกเก็บลง record ตอนเปิดเซสชัน ใครยิง `/shuffle` ซ้ำ
 *    ด้วยสเปกใหม่ก็เปลี่ยนไพ่ไม่ได้ (เส้นนี้ไม่รับสเปกจาก body เลย)
 * 3. **ห้ามปนกับการจั่ว** — เซสชันที่มีสเปกนี้ห้ามส่ง `pickedIndices` มาด้วย และจะไม่เรียก
 *    `drawCards()` เลยสักครั้ง เพื่อไม่ให้ใครเข้าใจผิดว่าไพ่ชุดนี้ "สุ่มมาแบบตรวจสอบได้"
 * 4. **กฎเหล็กข้อ 14** — หาไพ่ในสำรับไม่เจอ ต้องคืน `undefined` ให้เส้นทางข้างบนล้มดัง ๆ
 *    แล้วบอกผู้ใช้ให้โหลดใหม่ ห้ามหยิบไพ่ใบไหนมาแทนเด็ดขาด
 *
 * ## ⚠️ สิ่งที่ห้ามทำกับไฟล์นี้
 *
 * - ห้ามให้ฟังก์ชันในนี้ "สุ่ม" อะไรเองทั้งสิ้น — ทุกผลลัพธ์ต้องคำนวณซ้ำได้จากสเปกเดิมเสมอ
 *   (ด่าน `scripts/qa/test-derived-draw.ts` ยิงซ้ำ 50 รอบเทียบผลทุกไบต์)
 * - ห้ามเอาผลจากเส้นนี้ไปโชว์คู่กับป้าย/แผง Provably Fair ของการจั่ว เพราะมันคนละเรื่องกัน
 *   ไพ่ชุดนี้ "ตรวจสอบได้ด้วยการคำนวณซ้ำจากวันเกิด/วันที่" ไม่ใช่ด้วยการเฉลย serverSeed
 */
import { DECK } from "@/data/cards";
import { PICK_A_CARD_TOPICS } from "@/data/pick-a-card";
import { seededOrder } from "@/lib/pick-a-card/daily";
import { calculateBirthCard } from "@/lib/tarot/birth-card";
import type { DrawnCard } from "@/lib/tarot/shuffle";

/** ผังภายในที่คู่กับการคำนวณแต่ละแบบ — ผิดคู่เมื่อไหร่ถือว่าคำขอไม่ถูกต้อง */
export const DERIVED_SPREAD_ID = {
  "birth-card": "birth-card",
  "pick-a-card": "pick-a-card",
} as const;

export type DerivedDrawKind = keyof typeof DERIVED_SPREAD_ID;

/** ข้อมูลตั้งต้นที่ไคลเอนต์ส่งมาได้ — ยังไม่ใช่สเปกที่ใช้คำนวณจริง */
export type DerivedDrawInput =
  | { kind: "birth-card"; day: number; month: number; year: number; era: "be" | "ce" }
  | { kind: "pick-a-card"; topicId: string; slotIndex: number };

/**
 * สเปกที่ถูกตรึงลง record แล้ว
 *
 * ⚠️ `dayKey` ของ `pick-a-card` **เซิร์ฟเวอร์เป็นคนใส่** ตอน `/start` เท่านั้น
 * ถ้ารับจากไคลเอนต์ ใครก็เลื่อนวันไปเรื่อย ๆ เพื่อไล่หาไพ่ที่ถูกใจได้ (สำรับประจำวันจะไม่มีความหมาย)
 */
export type DerivedDrawSpec =
  | { kind: "birth-card"; day: number; month: number; year: number; era: "be" | "ce" }
  | { kind: "pick-a-card"; topicId: string; slotIndex: number; dayKey: string };

/** รายละเอียดที่ปลอดภัยจะส่งกลับหน้าเว็บ — ใช้ประกอบเนื้อหาเสริมให้ตรงกับไพ่ที่เปิดจริง */
export type DerivedDrawDetail =
  | {
      kind: "birth-card";
      calculatedSum: number;
      primaryNumber: number;
      secondaryNumber?: number;
      yearCe: number;
      yearBe: number;
    }
  | {
      kind: "pick-a-card";
      topicId: string;
      slotIndex: number;
      dayKey: string;
      /** ดัชนีในคลังคำอ่านของแต่ละตำแหน่ง — หน้าเว็บใช้หยิบย่อหน้าที่เขียนคู่กับไพ่ใบนั้น */
      anchor: number;
      hidden: number;
      advice: number;
    };

export interface DerivedDrawResult {
  drawn: DrawnCard[];
  detail: DerivedDrawDetail;
}

/** เลขไพ่ในสำรับจากรหัสไพ่ — สร้างครั้งเดียวต่อกระบวนการ */
const INDEX_BY_CARD_ID: ReadonlyMap<string, number> = new Map(
  DECK.map((card, index) => [card.id, index] as const),
);

/**
 * แปลงรหัสไพ่เป็นเลขไพ่ในสำรับ
 *
 * 🃏 กฎเหล็กข้อ 14 — ไม่เจอคือ `undefined` ห้ามคืนใบสำรอง ห้ามคืน 0 (นั่นคือ The Fool)
 */
function cardIndexOf(cardId: string): number | undefined {
  const index = INDEX_BY_CARD_ID.get(cardId);
  return index === undefined ? undefined : index;
}

/** ผังภายในที่สเปกนี้บังคับให้ใช้ — ใช้ตรวจว่า `spreadId` ที่เปิดเซสชันมาถูกคู่กัน */
export function derivedSpreadIdFor(kind: DerivedDrawKind): string {
  return DERIVED_SPREAD_ID[kind];
}

/**
 * ตรึงข้อมูลตั้งต้นจากไคลเอนต์ให้กลายเป็นสเปกที่คำนวณได้
 * @param dayKey วันของกรุงเทพฯ ที่เซิร์ฟเวอร์อ่าน ณ ตอนเปิดเซสชัน
 */
export function pinDerivedSpec(input: DerivedDrawInput, dayKey: string): DerivedDrawSpec {
  if (input.kind === "pick-a-card") {
    return { kind: "pick-a-card", topicId: input.topicId, slotIndex: input.slotIndex, dayKey };
  }
  return input;
}

/**
 * ไพ่ประจำตัวจากวันเกิด — 1 หรือ 2 ใบ
 *
 * ได้ใบเดียวเมื่อเลขที่ลดทอนแล้วเป็นเลขหลักเดียว (1–9) ซึ่งตามหลักเลขศาสตร์ทาโรต์
 * ไพ่บุคลิกภาพกับไพ่จิตวิญญาณเป็นใบเดียวกัน — หน้าเว็บก็แสดงใบเดียวมาตั้งแต่ต้น
 * ผัง `birth-card` มี 2 ตำแหน่ง แต่ท่ออ่านคำทำนายเดินตาม `drawn` ไม่ได้เดินตามผัง
 * จึงรองรับกรณีใบเดียวได้โดยไม่ต้องมีผังแยก
 *
 * ไพ่ประจำตัว **ไม่มีหัวกลับ** — มันคือต้นแบบประจำตัวของเจ้าของวันเกิด ไม่ใช่ไพ่ที่จั่วขึ้นมา
 */
function deriveBirthCard(spec: Extract<DerivedDrawSpec, { kind: "birth-card" }>): DerivedDrawResult | undefined {
  const result = calculateBirthCard(spec.day, spec.month, spec.year, spec.era === "be", DECK);
  if (!result) return undefined;

  const ids = [result.primaryCard.id, ...(result.secondaryCard ? [result.secondaryCard.id] : [])];
  const drawn: DrawnCard[] = [];
  for (const [order, cardId] of ids.entries()) {
    const cardIndex = cardIndexOf(cardId);
    // 🃏 กฎเหล็กข้อ 14 — สำรับไม่มีใบนี้ = ล้มทั้งคำขอ ห้ามหยิบใบอื่นมาแทน
    if (cardIndex === undefined) return undefined;
    drawn.push({ order, cardIndex, isReversed: false });
  }

  return {
    drawn,
    detail: {
      kind: "birth-card",
      calculatedSum: result.calculatedSum,
      primaryNumber: result.primaryNumber,
      secondaryNumber: result.secondaryNumber,
      yearCe: result.yearCe,
      yearBe: result.yearBe,
    },
  };
}

/**
 * ไพ่ 3 ใบของกองที่ผู้ใช้เลือกใน Pick A Card
 *
 * ใช้ **สำรับประจำวันชุดเดียวกับที่หน้าเว็บเคยคำนวณเอง** (`dailyDraw`) แต่ย้ายมาคำนวณ
 * ฝั่งเซิร์ฟเวอร์ทั้งหมด — วันเดียวกัน หัวข้อเดียวกัน กองเดียวกัน ต้องได้ไพ่ชุดเดิมเสมอ
 * ไม่ว่าจะเปิดจากเครื่องไหน (นั่นคือสิ่งที่ทำให้คำว่า "สำรับประจำวัน" มีความหมาย)
 *
 * ไพ่แต่ละตำแหน่งมาจากคลังคนละชิ้นตามโครง INC-0199b (ตำแหน่ง 1 จาก anchor · 2 จาก hidden ·
 * 3 จาก advice) จึงต้องหยิบใบให้ตรงตำแหน่งเป๊ะ ๆ ไม่งั้นย่อหน้าที่เขียนคู่กันไว้จะพูดถึงไพ่ผิดใบ
 */
/**
 * ก้าวที่ปลอดภัยของ "บล็อกวัน" — บวกแล้วต้องไม่มีทางตกกลับที่เดิมในวันถัดไป
 *
 * ทุกตำแหน่งเดินวันละ 1 ช่องอยู่แล้ว (บวก 1 ไม่มีทางเป็น 0 เมื่อคลังใหญ่กว่า 1)
 * ส่วนก้าวของบล็อกจะถูกบวกเพิ่มเฉพาะวันที่ข้ามบล็อก จึงต้องเช็กว่า `1 + ก้าวบล็อก`
 * ยังไม่เป็นศูนย์เมื่อหารด้วยขนาดคลัง ไม่งั้นจะมีวันที่เปิดมาแล้วเจอไพ่เดิมของเมื่อวานพอดี
 */
function safeBlockStep(poolSize: number, preferred: number): number {
  return (1 + preferred) % poolSize === 0 ? 0 : preferred;
}

/** เลขวันแบบนับต่อเนื่องจากคีย์ `YYYY-MM-DD` — ใช้เป็น "เข็มนาฬิกา" ของสำรับ */
function dayNumberOf(dayKey: string): number {
  const [year, month, day] = dayKey.split("-").map((part) => Number.parseInt(part, 10));
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

/** หารเอาเศษแบบไม่ติดลบ */
function mod(value: number, size: number): number {
  return ((value % size) + size) % size;
}

/**
 * ไพ่ 3 ใบของกองที่ผู้ใช้เลือกใน Pick A Card
 *
 * ## โครงสร้าง: "ลำดับคงที่ต่อหัวข้อ + เข็มที่เดินทุกวัน"
 *
 * แต่ละตำแหน่งมีลำดับของตัวเอง (สับครั้งเดียวจากรหัสหัวข้อ — เหมือนกันทุกเครื่องตลอดกาล)
 * แล้วหยิบตามเข็มที่เดินไปข้างหน้าวันละก้าว ผลคือคุณสมบัติสองข้อที่ **การันตีด้วยโครงสร้าง**
 * ไม่ใช่ด้วยความน่าจะเป็น:
 *
 * | คำสัญญา | ได้มาจาก |
 * | :--- | :--- |
 * | วันเดียวกัน 4 กองได้คนละชิ้น | เข็มของกองที่ N ห่างกันทีละ 1 ช่อง และคลังใหญ่กว่าจำนวนกอง |
 * | เปิดกองเดิมพรุ่งนี้ต้องไม่ได้ใบเดิม | ก้าวต่อวันเป็นจำนวนเฉพาะสัมพัทธ์กับขนาดคลัง (บวกแล้วไม่มีทางตกที่เดิม) |
 *
 * ⚠️ นี่คือเหตุผลที่ **ห้ามเปลี่ยนกลับไปเป็นการสุ่มรายวันล้วน ๆ** — การสุ่มให้คำสัญญาข้อสอง
 * ได้แค่ "ส่วนใหญ่ไม่ซ้ำ" ซึ่งแปลว่าจะมีวันที่ผู้ใช้เปิดมาแล้วเจอไพ่เดิม (เรื่องที่เจ้าของทักไว้
 * ตรง ๆ ใน INC-0198b) · ด่าน `scripts/qa/test-pick-a-card.ts` เดินจริงทุกหัวข้อ ทุกกอง 60 วันติด
 *
 * ไพ่แต่ละตำแหน่งมาจากคลังคนละชิ้นตามโครง INC-0199b (ตำแหน่ง 1 จาก anchor · 2 จาก hidden ·
 * 3 จาก advice) จึงต้องหยิบใบให้ตรงตำแหน่งเป๊ะ ๆ ไม่งั้นย่อหน้าที่เขียนคู่กันไว้จะพูดถึงไพ่ผิดใบ
 */
function derivePickACard(spec: Extract<DerivedDrawSpec, { kind: "pick-a-card" }>): DerivedDrawResult | undefined {
  const topic = PICK_A_CARD_TOPICS.find((t) => t.id === spec.topicId);
  if (!topic) return undefined;
  if (!Number.isInteger(spec.slotIndex) || spec.slotIndex < 0 || spec.slotIndex >= topic.slots.length) {
    return undefined;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(spec.dayKey)) return undefined;

  const poolSize = topic.pool.length;
  if (poolSize === 0) return undefined;

  const dayNumber = dayNumberOf(spec.dayKey);
  if (!Number.isFinite(dayNumber)) return undefined;

  /* ลำดับประจำตำแหน่ง — สับครั้งเดียวจากรหัสหัวข้อ ไม่ขึ้นกับวันหรือกอง */
  const anchorOrder = seededOrder(`${topic.id}:anchor`, poolSize);
  const hiddenOrder = seededOrder(`${topic.id}:hidden`, poolSize);
  const adviceOrder = seededOrder(`${topic.id}:advice`, poolSize);

  /*
   * เข็มของแต่ละตำแหน่ง = "วันที่" + "ช่องกอง" + "บล็อกวัน"
   *
   * ตัวบล็อก (`dayNumber / poolSize`) คือสิ่งที่ทำให้ไพ่สามใบ **ไม่เดินเป็นก้อนเดียวกัน**
   * ถ้าไม่มีมัน ทั้งสามใบจะขึ้นกับ `dayNumber % poolSize` ตัวเดียว ➔ วนอยู่แค่ 8 ชุดตลอดกาล
   * (ซึ่งคือเพดานเดิมของ INC-0199b) · เมื่อมีบล็อก เพดานขยับเป็น poolSize² ชุดต่อกอง
   */
  const dayBlock = Math.floor(dayNumber / poolSize);
  const hiddenBlockStep = safeBlockStep(poolSize, 1);
  const adviceBlockStep = safeBlockStep(poolSize, 2);

  const anchorIndex = anchorOrder[mod(dayNumber + spec.slotIndex, poolSize)];
  const hiddenIndex = hiddenOrder[mod(dayNumber + spec.slotIndex + hiddenBlockStep * dayBlock, poolSize)];
  const adviceIndex = adviceOrder[mod(dayNumber + 2 * spec.slotIndex + adviceBlockStep * dayBlock, poolSize)];

  const picked = [
    topic.pool[anchorIndex]?.cards[0],
    topic.pool[hiddenIndex]?.cards[1],
    topic.pool[adviceIndex]?.cards[2],
  ];

  const drawn: DrawnCard[] = [];
  for (const [order, item] of picked.entries()) {
    if (!item) return undefined;
    const cardIndex = cardIndexOf(item.cardId);
    // 🃏 กฎเหล็กข้อ 14 — คลังอ้างถึงไพ่ที่ไม่มีในสำรับ = ล้มทั้งคำขอ
    if (cardIndex === undefined) return undefined;
    drawn.push({ order, cardIndex, isReversed: item.isReversed });
  }

  return {
    drawn,
    detail: {
      kind: "pick-a-card",
      topicId: topic.id,
      slotIndex: spec.slotIndex,
      dayKey: spec.dayKey,
      anchor: anchorIndex,
      hidden: hiddenIndex,
      advice: adviceIndex,
    },
  };
}

/**
 * คำนวณไพ่จากสเปกที่ตรึงไว้แล้ว
 *
 * @returns `undefined` เมื่อสเปกใช้ไม่ได้หรือหาไพ่ไม่เจอ — ผู้เรียกต้องตอบผู้ใช้ว่า
 * "กรุณาโหลดใหม่อีกครั้ง" ห้ามเดินต่อด้วยไพ่ที่กุขึ้นมาเอง (กฎเหล็กข้อ 14)
 */
export function deriveDrawn(spec: DerivedDrawSpec): DerivedDrawResult | undefined {
  return spec.kind === "birth-card" ? deriveBirthCard(spec) : derivePickACard(spec);
}
