import type { SpreadPosition } from "@/data/spreads";

/**
 * 📐 เรขาคณิตของแผนผังตำแหน่งไพ่ (Spread Position Map Geometry)
 *
 * ⚠️ **แหล่งความจริงเดียว** ของตัวเลขที่ `SpreadPositionMap.tsx` ใช้วาด
 * และที่ `scripts/qa/test-spreads.ts` ใช้ตรวจ
 *
 * ทำไมต้องแยกออกมาเป็นโมดูล — ISSUE-034 หลุดมาได้เพราะตัวเลขชุดนี้เคยอยู่ **สองที่**
 * คือในคอมโพเนนต์ที่วาดจริง กับในด่านตรวจที่คัดลอกค่าไปเขียนไว้เอง
 * พอค่าใดค่าหนึ่งขยับ อีกฝั่งไม่รู้เรื่อง ด่านจึงรับรองสิ่งที่ผู้ใช้ไม่ได้เห็นจริง
 * และซ้ำร้ายกว่านั้น ด่านเดิมตรวจเฉพาะ "ใบไขว้" เทียบกับใบอื่นเท่านั้น
 * ไพ่ธรรมดาที่วางเรียงลงมาในคอลัมน์เดียวกันจึงทับกันได้โดยไม่มีใครเห็นเลย
 *
 * ตรวจจริงรอบนี้พบว่าปัญหากว้างกว่าที่ ISSUE-034 บันทึกไว้ (2 ผัง) — มี **4 ผัง**:
 *   `chakra`       7 ใบ · ทับกัน 6 คู่ ลึกถึง 48–52% ของความสูงการ์ด
 *   `year-ahead`  12 ใบ · ทับกัน 8 คู่ ลึก 24–44%
 *   `celtic-cross` 10 ใบ · ทับกัน 3 คู่ ลึก 20%
 *   `monthly-ten`  10 ใบ · ทับกัน 3 คู่ ลึก 20%
 */

/** ความกว้างการ์ดสูงสุด เทียบความกว้างกรอบ (ค่าที่ใช้มาตลอด) */
export const MAP_CARD_W_MAX = 0.13;

/**
 * ความกว้างการ์ดต่ำสุด — ห้ามเล็กกว่านี้
 *
 * คอลัมน์ที่วางผังแคบสุดคือ 260px (`sm:grid-cols-[minmax(0,260px)_1fr]`)
 * และการ์ดมี `min-width: 26px` เป็นพื้น · ที่ 10% ของ 260px = 26px พอดี
 * เล็กกว่านี้ `min-width` จะเข้ามาแทนที่ความกว้างที่คำนวณไว้
 * แล้วเรขาคณิตทั้งชุดนี้จะพังเงียบ ๆ (การ์ดกว้างกว่าที่คิด → กลับมาทับกันอีก)
 */
export const MAP_CARD_W_MIN = 0.1;

/** ความกว้างจริงของคอลัมน์ที่แคบที่สุดที่ผังนี้ถูกวาง (ใช้ยืนยัน MAP_CARD_W_MIN) */
export const MAP_MIN_COLUMN_PX = 260;
/** `min-width` ที่ตั้งไว้บนการ์ดในผัง */
export const MAP_CARD_MIN_PX = 26;

/** สัดส่วนการ์ด 2 : 3 */
export const MAP_CARD_ASPECT = 1.5;

/** สเกลแกน y ขั้นต่ำ — ค่าเดิม เก็บไว้ไม่ให้ผังที่หน้าตาปกติดีอยู่แล้วเตี้ยลง */
const BASE_Y_SCALE = 0.78;

/** ช่องไฟระหว่างการ์ดที่ชิดกันที่สุด — 6% กันขอบชนกันพอดีเป๊ะ */
const BREATHING = 1.06;

/** ระยะหายใจใต้ผัง ไม่ให้การ์ดใบล่างสุดชนขอบกรอบ */
const BOTTOM_PAD = 0.03;

/**
 * เพดานความสูงกรอบ เทียบความกว้างกรอบ
 *
 * ผังแนวตั้งอย่าง `chakra` (7 ใบเรียงลงมาคอลัมน์เดียว) ถ้าคงขนาดการ์ดไว้เท่าเดิม
 * กรอบต้องสูงถึง 1.64 เท่าของความกว้าง = 427px บนคอลัมน์ 260px ซึ่งยาวเกินไป
 * เกินเพดานนี้เมื่อไหร่ให้ "ย่อการ์ด" แทนการ "ยืดกรอบ" — ผังยังอ่านออกและไม่ทับกัน
 */
const MAX_BOX_H = 1.15;

/** ค่าที่ถือว่า "พิกัดเดียวกัน" — คู่ไพ่ไขว้ที่ตั้งใจวางทับ */
const SAME_SPOT = 1e-6;

export interface HalfExtent {
  halfW: number;
  halfH: number;
}

/**
 * ครึ่งความกว้าง/ความสูงของกล่องครอบการ์ด (หน่วยเดียวกับแกน x คือเทียบความกว้างกรอบ)
 * ใบที่ `rotate: 90` สลับด้าน กล่องจึงกว้างเท่าความสูงการ์ด และสูงเท่าความกว้างการ์ด
 */
export function halfExtentOf(pos: Pick<SpreadPosition, "rotate">, cardW: number): HalfExtent {
  const cardH = cardW * MAP_CARD_ASPECT;
  const rotated = pos.rotate === 90 || pos.rotate === 270;
  return {
    halfW: (rotated ? cardH : cardW) / 2,
    halfH: (rotated ? cardW : cardH) / 2,
  };
}

/**
 * สเกลแกน y ที่ทำให้ **ไม่มีไพ่คู่ไหนทับกัน** ในผังนี้ ที่ขนาดการ์ดที่กำหนด
 *
 * ที่มาของสูตร: การ์ดสองใบทับกันได้ก็ต่อเมื่อ "ช่วงแนวนอนซ้อนกัน" และ "ช่วงแนวตั้งซ้อนกัน"
 * พร้อมกัน · ช่วงแนวนอนคงที่ (มาจากพิกัด x ที่ออกแบบไว้ ห้ามขยับ)
 * สิ่งเดียวที่ปรับได้จึงเป็นระยะแนวตั้ง:
 *   |Δy| × yScale ≥ halfH(a) + halfH(b)   →   yScale ≥ (halfH(a) + halfH(b)) / |Δy|
 *
 * ตัวอย่างที่เป็นต้นเรื่อง (ISSUE-034): `celtic-cross` วางใบที่ 7–10 เรียงลงคอลัมน์เดียว
 * ห่างกันแกน y ทีละ 0.20 · ที่สเกลเดิม 0.78 ระยะจริงเหลือ 0.156 ขณะที่การ์ดสูง 0.195
 * → ทับกัน 0.039 = 20% ของความสูงการ์ด ตรงกับที่รายงานไว้เป๊ะ
 */
export function mapYScale(positions: readonly SpreadPosition[], cardW: number): number {
  let scale = BASE_Y_SCALE;

  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const a = positions[i];
      const b = positions[j];
      const dy = Math.abs(a.y - b.y);

      // วางพิกัดเดียวกัน = คู่ไขว้ที่ตั้งใจให้ทับ (เช่นใบ 1 กับ 2 ของเซลติกครอส)
      if (dy < SAME_SPOT) continue;

      const ea = halfExtentOf(a, cardW);
      const eb = halfExtentOf(b, cardW);

      // ช่วงแนวนอนไม่ซ้อนกันเลย → ไม่มีทางทับ ไม่ต้องบังคับระยะแนวตั้ง
      if (Math.abs(a.x - b.x) >= ea.halfW + eb.halfW) continue;

      scale = Math.max(scale, ((ea.halfH + eb.halfH) * BREATHING) / dy);
    }
  }

  return scale;
}

export interface MapLayout {
  /** ความกว้างการ์ดที่ใช้จริงกับผังนี้ (เทียบความกว้างกรอบ) */
  cardW: number;
  /** สเกลแกน y ที่ใช้จริง */
  yScale: number;
  /** ระยะดันลงทั้งผัง กันการ์ดใบบนสุดล้นขอบบน */
  offsetY: number;
  /** ความสูงกรอบ เทียบความกว้างกรอบ (ใช้เป็น `padding-bottom`) */
  boxHeight: number;
}

function layoutAt(positions: readonly SpreadPosition[], cardW: number): MapLayout {
  const yScale = mapYScale(positions, cardW);

  let minTop = Number.POSITIVE_INFINITY;
  let maxBottom = 0;
  for (const pos of positions) {
    const { halfH } = halfExtentOf(pos, cardW);
    const cy = pos.y * yScale;
    minTop = Math.min(minTop, cy - halfH);
    maxBottom = Math.max(maxBottom, cy + halfH);
  }

  // ถ้าใบบนสุดล้นขอบบน ให้ดันทั้งผังลงมาเท่าที่ล้น
  const offsetY = Number.isFinite(minTop) ? Math.max(0, -minTop) : 0;
  return { cardW, yScale, offsetY, boxHeight: maxBottom + offsetY + BOTTOM_PAD };
}

/**
 * คำนวณผังทั้งชุด — คอมโพเนนต์ที่วาดและด่านตรวจใช้ฟังก์ชันเดียวกันตัวนี้
 *
 * ใช้การ์ดใหญ่ที่สุดเท่าที่ยัง "ไม่ทับกัน" และ "กรอบไม่สูงเกินเพดาน"
 * ไล่ย่อทีละ 0.005 เพราะการย่อการ์ดเปลี่ยนทั้งความสูงการ์ดและความกว้างกล่องครอบ
 * (ซึ่งเปลี่ยนว่าคู่ไหนถือว่าอยู่คอลัมน์เดียวกัน) สูตรปิดจึงคำนวณตรง ๆ ไม่ได้
 */
export function mapLayout(positions: readonly SpreadPosition[]): MapLayout {
  let fallback = layoutAt(positions, MAP_CARD_W_MIN);

  for (let w = MAP_CARD_W_MAX; w >= MAP_CARD_W_MIN - 1e-9; w -= 0.005) {
    const candidate = layoutAt(positions, Number(w.toFixed(4)));
    if (candidate.boxHeight <= MAX_BOX_H) return candidate;
    fallback = candidate;
  }

  // ผังที่แน่นจนย่อสุดแล้วยังเกินเพดาน — ยอมให้กรอบสูงกว่าเพดาน ดีกว่าปล่อยให้ทับกัน
  return fallback;
}

/** กล่องครอบการ์ดใบหนึ่ง หลังใช้ผังแล้ว (หน่วยเทียบความกว้างกรอบ) */
export function boxOf(pos: SpreadPosition, layout: MapLayout) {
  const { halfW, halfH } = halfExtentOf(pos, layout.cardW);
  const cy = pos.y * layout.yScale + layout.offsetY;
  return { left: pos.x - halfW, right: pos.x + halfW, top: cy - halfH, bottom: cy + halfH };
}
