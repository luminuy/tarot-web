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
 * | 1 · ไพ่หลัก (สมอ) | ทุกชิ้นในคลัง | `pool[i].cards[0]` + `readingX.currentSituation` |
 * | 2 · สิ่งที่ซ่อนอยู่ | ทุกชิ้นในคลัง | `pool[i].cards[1]` + `readingX.hiddenLayer` |
 * | 3 · คำแนะนำ | ทุกชิ้นในคลัง | `pool[i].cards[2]` + `readingX.oracleAdvice` |
 *
 * จั่วอิสระตำแหน่งละใบ ➔ **n³ ชุดต่อหัวข้อ** เมื่อคลังมี n ชิ้น (เดิมได้แค่ n)
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
 * ## 🔁 เปลี่ยนมือผู้จั่วแล้ว (คลื่นที่ 2 · 2026-09-18)
 *
 * เดิมหน้าเว็บเป็นผู้จั่วเองในเบราว์เซอร์ (`drawPicks` + `dailyDraw`) แล้วแสดงคำอ่านที่เขียนไว้
 * ตอนนี้ **เซิร์ฟเวอร์เป็นผู้คำนวณว่ากองไหนได้ไพ่ชุดไหน** (`src/lib/reading/derived-draw.ts`)
 * เพราะทุกทางเข้าเปิดไพ่ต้องผ่านท่อ AI + กำแพงสมาชิก ซึ่งบังคับที่เซิร์ฟเวอร์เท่านั้น
 *
 * ไฟล์นี้จึงเหลือหน้าที่เดียว: **ประกอบเนื้อหาที่เขียนไว้แล้วให้ตรงกับผลที่เซิร์ฟเวอร์คำนวณมา**
 * (`composeFromDerived`) — ตัวจั่วฝั่งเบราว์เซอร์ถูกถอดออกทั้งหมด ห้ามเอากลับมา
 * เพราะไพ่ที่หน้าเว็บจั่วเองจะไม่ตรงกับไพ่ที่แม่หมอกำลังอ่านอยู่
 */
import type { PickACardCardItem, PickACardTopic } from "@/data/pick-a-card";

/** ผลการจั่วหนึ่งรอบ — เก็บแยกตามตำแหน่ง ไม่ได้ผูกเป็นกองอีกแล้ว */
export interface PickACardDraw {
  /** ช่องกองที่ N ได้ "ไพ่หลัก" จากคลังชิ้นไหน — ในรอบเดียวกันทุกช่องได้คนละชิ้น */
  anchorOrder: number[];
  /** คลังใบที่ 2 (สิ่งที่ซ่อนอยู่) ที่จั่วได้รอบนี้ */
  hiddenPick: number;
  /** คลังใบที่ 3 (คำแนะนำ) ที่จั่วได้รอบนี้ */
  advicePick: number;
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
 * ประกอบเนื้อหาที่เขียนไว้แล้ว ให้ตรงกับผลที่ **เซิร์ฟเวอร์** คำนวณมาในรอบนี้
 *
 * @param picks ดัชนีคลังของแต่ละตำแหน่งที่ได้จาก `/api/reading/[id]/shuffle`
 *
 * ⚠️ ผู้เรียกต้องเทียบรหัสไพ่ที่ได้กับไพ่ที่เซิร์ฟเวอร์เปิดจริงก่อนแสดงย่อหน้าเสมอ
 * ถ้าไม่ตรง (เช่นคลังถูกแก้คนละรอบกับที่เซิร์ฟเวอร์คำนวณ) ให้ทิ้งย่อหน้าไป ห้ามแสดงคู่กัน
 * เพราะย่อหน้าจะพูดถึงไพ่ที่ไม่ได้อยู่ตรงหน้า = กุไพ่ ผิดกฎเหล็กข้อ 14
 */
export function composeFromDerived(
  topic: PickACardTopic,
  picks: { anchor: number; hidden: number; advice: number },
  isEnglish: boolean
): ComposedReading | null {
  const size = topic.pool.length;
  if (size === 0) return null;

  const anchor = topic.pool[picks.anchor % size];
  const hidden = topic.pool[picks.hidden % size];
  const advice = topic.pool[picks.advice % size];
  if (!anchor || !hidden || !advice) return null;

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
