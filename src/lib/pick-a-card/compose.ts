/**
 * 🧩 ประกอบคำทำนายของหน้า Pick A Card จาก "คลังรายใบ" ไม่ใช่จากกองตายตัว
 * ===========================================================================
 * ## เรื่องเดิม
 *
 * ตอนเปิดหน้านี้ ไพ่ 3 ใบถูกมัดติดกับกองเป็นก้อนเดียว ผู้ใช้จึงเจอชุดเดิมซ้ำ ๆ
 * (INC-0198b แก้ไปหนึ่งชั้นด้วยการสลับว่ากองไหนถือชุดไหน — เพดานยังอยู่ที่ 4 ชุดต่อหัวข้อ)
 *
 * ## โครงใหม่ (INC-0199b)
 *
 * เนื้อหาที่เขียนไว้แล้วมีโครงที่ดีอยู่ในตัว — **แต่ละย่อหน้าพูดถึงไพ่ของตำแหน่งตัวเองใบเดียว**
 * (ตรวจด้วยเครื่องแล้วทั้ง 96 ย่อหน้า ไม่มีย่อหน้าไหนอ้างไพ่ของตำแหน่งอื่นเลย)
 * จึงแยกออกเป็น "คลังต่อตำแหน่ง" ได้โดยไม่ต้องเขียนใหม่:
 *
 * | ตำแหน่ง | คลัง | ที่มา |
 * |---|---|---|
 * | 1 · ไพ่หลัก (สมอ) | 4 ใบ | `piles[i].cards[0]` + `readingX.currentSituation` |
 * | 2 · สิ่งที่ซ่อนอยู่ | 4 ใบ | `piles[i].cards[1]` + `readingX.hiddenLayer` |
 * | 3 · คำแนะนำ | 4 ใบ | `piles[i].cards[2]` + `readingX.oracleAdvice` |
 *
 * จั่วอิสระตำแหน่งละใบ ➔ **4 × 4 × 4 = 64 ชุดต่อหัวข้อ** (เดิม 4)
 *
 * ## "ไพ่หลัก" คือสมอของรอบนั้น
 *
 * `theme` · `overview` · `affirmation` ถูกเขียนใหม่ทั้ง 16 กองให้พูดถึง **ไพ่ใบแรกเท่านั้น**
 * จึงเดินทางไปพร้อมไพ่ใบแรกได้โดยไม่ขัดกับใบที่ 2–3 ที่จั่วมาจากกองอื่น
 * เช่นเดียวกับ `targetSpreadId` (ผังที่แนะนำให้ไปเปิดต่อ) ที่ผูกกับไพ่หลัก
 *
 * ## ⚠️ กฎที่ห้ามแตะ
 *
 * - **ห้ามจับคู่ข้อความข้ามตำแหน่ง** — ย่อหน้าของตำแหน่ง 2 ต้องมากับไพ่ของตำแหน่ง 2 เสมอ
 *   ไม่งั้นคำอ่านจะพูดถึงไพ่ที่ไม่ได้อยู่ตรงหน้า = กุไพ่ ผิดกฎเหล็กข้อ 14
 * - **ห้ามสุ่มตอนเรนเดอร์ฝั่งเซิร์ฟเวอร์** หน้านี้เป็น HTML นิ่งที่เสิร์ฟจากขอบ
 *   ต้องจั่วใน `useEffect` เท่านั้น ไม่งั้น hydration ไม่ตรงกับ HTML ที่ส่งมา
 */
import type { PickACardCardItem, PickACardTopic } from "@/data/pick-a-card";
import { drawContentOrder } from "./draw-order";

/** ผลการจั่วหนึ่งรอบ — เก็บแยกตามตำแหน่ง ไม่ได้ผูกเป็นกองอีกแล้ว */
export interface PickACardDraw {
  /** ช่องกองที่ N ได้ "ไพ่หลัก" ของกองไหน — เป็นการเรียงสับเปลี่ยน ทุกช่องได้ไพ่หลักไม่ซ้ำกัน */
  anchorOrder: number[];
  /** คลังใบที่ 2 (สิ่งที่ซ่อนอยู่) ที่จั่วได้รอบนี้ */
  hiddenPick: number;
  /** คลังใบที่ 3 (คำแนะนำ) ที่จั่วได้รอบนี้ */
  advicePick: number;
}

export function initialDraw(poolSize: number): PickACardDraw {
  return {
    anchorOrder: Array.from({ length: poolSize }, (_, i) => i),
    hiddenPick: 0,
    advicePick: 0,
  };
}

/** สุ่มดัชนีใหม่ที่ไม่ซ้ำกับรอบก่อน — คลังมี ≥ 2 ใบเสมอจึงมีทางเลือกเหลือแน่นอน */
function drawDifferent(poolSize: number, previous: number): number {
  if (poolSize < 2) return 0;
  let next = previous;
  while (next === previous) next = Math.floor(Math.random() * poolSize);
  return next;
}

/**
 * จั่วรอบใหม่ทั้งสามตำแหน่ง โดย **ทุกตำแหน่งต้องเปลี่ยนจากรอบก่อน**
 * ผู้ใช้ที่เลือกกองเดิมซ้ำจึงไม่มีทางได้ไพ่ใบเดิมแม้แต่ใบเดียว
 */
export function drawPicks(poolSize: number, previous: PickACardDraw): PickACardDraw {
  return {
    anchorOrder: drawContentOrder(poolSize, previous.anchorOrder),
    hiddenPick: drawDifferent(poolSize, previous.hiddenPick),
    advicePick: drawDifferent(poolSize, previous.advicePick),
  };
}

/** คำอ่านที่ประกอบเสร็จแล้วสำหรับกองที่ผู้ใช้เลือก (ภาษาเดียว) */
export interface ComposedReading {
  cards: [PickACardCardItem, PickACardCardItem, PickACardCardItem];
  /** ย่อหน้าประจำใบ เรียงตามลำดับไพ่ด้านบน */
  bodies: [string, string, string];
  theme: string;
  overview: string;
  affirmation: string;
  targetSpreadId: string;
}

/**
 * ประกอบคำอ่านของช่องกองที่เลือก จากผลจั่วของรอบนี้
 * @param slotIndex ช่องกองที่ผู้ใช้กด (0-3) — ตัวตนของกอง/คริสตัลยังเป็นของช่องนี้เสมอ
 */
export function composeReading(
  topic: PickACardTopic,
  draw: PickACardDraw,
  slotIndex: number,
  isEnglish: boolean
): ComposedReading {
  const size = topic.piles.length;
  const anchor = topic.piles[draw.anchorOrder[slotIndex] ?? slotIndex];
  const hidden = topic.piles[draw.hiddenPick % size];
  const advice = topic.piles[draw.advicePick % size];

  const frame = isEnglish ? anchor.readingEn : anchor.readingTh;

  return {
    cards: [anchor.cards[0], hidden.cards[1], advice.cards[2]],
    bodies: [
      (isEnglish ? anchor.readingEn : anchor.readingTh).currentSituation,
      (isEnglish ? hidden.readingEn : hidden.readingTh).hiddenLayer,
      (isEnglish ? advice.readingEn : advice.readingTh).oracleAdvice,
    ],
    theme: frame.theme,
    overview: frame.overview,
    affirmation: frame.affirmation,
    targetSpreadId: anchor.targetSpreadId,
  };
}

/** จำนวนชุดคำอ่านที่เป็นไปได้ของหัวข้อหนึ่ง — ใช้โชว์ในด่านตรวจและเอกสาร */
export function possibleCombinations(poolSize: number): number {
  return poolSize ** 3;
}
