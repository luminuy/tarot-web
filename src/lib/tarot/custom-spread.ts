/**
 * ✦ ผังที่ผู้ใช้สร้างเอง (REFLECTION_JOURNAL_PLAN 1.8 · คลื่น 5) — ใช้ร่วมกันทั้งหน้าเว็บและเซิร์ฟเวอร์
 * ---------------------------------------------------------------------------
 *  • เลย์เอาต์: แม่แบบเรขาคณิตที่ทดสอบแล้วเท่านั้น (ห้ามลากวางอิสระ — ไพ่ล้น/ทับกันบนมือถือ · กฎเหล็กข้อ 3 · 9)
 *  • ตรวจผัง: ข้อผิดพลาดที่ "ห้ามผ่าน" (จำนวนใบ · ความยาว · คำสั่งแฝง · อิโมจิ) + คำแนะนำที่ "ผ่านได้แต่ควรแก้"
 *  • ตอนเปิดไพ่ เซิร์ฟเวอร์ตรวจซ้ำแล้ว **ตรึง** ผังลงในเซสชัน (`ReadingRecord.customSpread`)
 *    prompt จึงใช้ตำแหน่งที่ตรวจแล้วเสมอ ไม่ใช่ข้อความสด ๆ จากหน้าเว็บ
 *  • สิทธิ์: 1–3 ใบ = เหมือนผังมาตรฐาน · 4–7 ใบ = เหมือนผังใหญ่ (ไม่ใช่ช่องหลบโควตา)
 * ⚠️ ไฟล์นี้ต้องเบา — ห้าม import สำรับ/สารานุกรม (ใช้ใน island)
 */

import type { Spread, SpreadPosition } from "@/data/spreads-helpers";

export const CUSTOM_SPREAD_ID = "custom";
export const CUSTOM_MIN_CARDS = 1;
export const CUSTOM_MAX_CARDS = 7;
export const CUSTOM_NAME_MAX = 60;
export const CUSTOM_POS_NAME_MAX = 60;
export const CUSTOM_POS_MEANING_MAX = 200;
/** ผังที่สร้างเองเกินกี่ใบถึงนับเป็น "ผังใหญ่" (สงวนให้ผู้ถือรอบที่ซื้อ/สิทธิ์ทดลอง เหมือนผังใหญ่ในบ้าน) */
export const CUSTOM_STANDARD_MAX_CARDS = 3;

export type LayoutId = "row" | "arc" | "pyramid" | "diamond" | "grid" | "cross" | "rows";

export interface CustomPositionInput {
  nameTh: string;
  nameEn?: string;
  meaning: string;
  meaningEn?: string;
}

export interface CustomSpreadInput {
  name: string;
  layout: LayoutId;
  positions: CustomPositionInput[];
}

type Pt = readonly [number, number];

/** แม่แบบพิกัด (0–1) ต่อจำนวนใบ — ทุกชุดผ่านด่านเรขาคณิตเดียวกับผังในบ้าน (test-custom-spreads) */
const LAYOUTS: Record<LayoutId, Partial<Record<number, readonly Pt[]>>> = {
  row: {
    1: [[0.5, 0.5]],
    2: [[0.35, 0.5], [0.65, 0.5]],
    3: [[0.22, 0.5], [0.5, 0.5], [0.78, 0.5]],
    4: [[0.14, 0.5], [0.38, 0.5], [0.62, 0.5], [0.86, 0.5]],
    5: [[0.1, 0.5], [0.3, 0.5], [0.5, 0.5], [0.7, 0.5], [0.9, 0.5]],
  },
  arc: {
    3: [[0.2, 0.62], [0.5, 0.36], [0.8, 0.62]],
    4: [[0.14, 0.66], [0.38, 0.38], [0.62, 0.38], [0.86, 0.66]],
    5: [[0.1, 0.7], [0.3, 0.42], [0.5, 0.3], [0.7, 0.42], [0.9, 0.7]],
  },
  pyramid: {
    3: [[0.5, 0.3], [0.3, 0.7], [0.7, 0.7]],
    6: [[0.5, 0.18], [0.35, 0.5], [0.65, 0.5], [0.2, 0.82], [0.5, 0.82], [0.8, 0.82]],
  },
  diamond: {
    4: [[0.5, 0.18], [0.25, 0.5], [0.75, 0.5], [0.5, 0.82]],
  },
  grid: {
    4: [[0.35, 0.32], [0.65, 0.32], [0.35, 0.72], [0.65, 0.72]],
    6: [[0.22, 0.32], [0.5, 0.32], [0.78, 0.32], [0.22, 0.72], [0.5, 0.72], [0.78, 0.72]],
  },
  cross: {
    5: [[0.5, 0.5], [0.2, 0.5], [0.8, 0.5], [0.5, 0.16], [0.5, 0.84]],
  },
  // 7 ใบ = 2 ชั้น 4+3 (กฎเหล็กข้อ 9) · 6 ใบ = 3+3 · 5 ใบ = 3+2
  rows: {
    5: [[0.22, 0.32], [0.5, 0.32], [0.78, 0.32], [0.35, 0.72], [0.65, 0.72]],
    6: [[0.22, 0.32], [0.5, 0.32], [0.78, 0.32], [0.22, 0.72], [0.5, 0.72], [0.78, 0.72]],
    7: [[0.15, 0.35], [0.38, 0.35], [0.62, 0.35], [0.85, 0.35], [0.26, 0.7], [0.5, 0.7], [0.74, 0.7]],
  },
};

export const LAYOUT_LABEL: Record<LayoutId, { th: string; en: string }> = {
  row: { th: "เรียงแถว", en: "Row" },
  arc: { th: "โค้งรุ้ง", en: "Arc" },
  pyramid: { th: "พีระมิด", en: "Pyramid" },
  diamond: { th: "เพชร", en: "Diamond" },
  grid: { th: "ตาราง", en: "Grid" },
  cross: { th: "กากบาท", en: "Cross" },
  rows: { th: "สองชั้น", en: "Two rows" },
};

/** แม่แบบที่ใช้ได้กับจำนวนใบนี้ (เรียงตามความเหมาะสม) */
export function layoutsFor(count: number): LayoutId[] {
  return (Object.keys(LAYOUTS) as LayoutId[]).filter((id) => Boolean(LAYOUTS[id][count]));
}

export function layoutPoints(layout: LayoutId, count: number): readonly Pt[] | undefined {
  return LAYOUTS[layout]?.[count];
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

const EMOJI = /\p{Extended_Pictographic}/u;
/** กันการปิดแท็ก prompt / คำสั่งแฝง — ตรวจซ้ำด้วย looksLikePromptInjection ฝั่งเซิร์ฟเวอร์อีกชั้น */
const SUSPICIOUS = /<\/?[a-z_]+>|ignore (all|previous)|system prompt|ละเว้นกฎ|ไม่ต้องทำตามคำสั่ง/i;

function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s.,!?·\-–—"'()“”]/g, "");
}

/** ความคล้ายแบบหยาบ (สัดส่วนอักขระร่วม) — ใช้เตือนตำแหน่งที่ความหมายซ้อนกัน */
function similarity(a: string, b: string): number {
  const x = normalize(a);
  const y = normalize(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  const grams = (s: string) => new Set(Array.from({ length: Math.max(0, s.length - 1) }, (_, i) => s.slice(i, i + 2)));
  const A = grams(x);
  const B = grams(y);
  let inter = 0;
  for (const g of A) if (B.has(g)) inter++;
  return (2 * inter) / (A.size + B.size || 1);
}

export function validateCustomSpread(input: CustomSpreadInput, lang: "th" | "en" = "th"): ValidationResult {
  const isEn = lang === "en";
  const errors: string[] = [];
  const warnings: string[] = [];
  const n = input.positions?.length ?? 0;

  if (!input.name?.trim()) errors.push(isEn ? "Give your spread a name." : "ตั้งชื่อผังก่อนนะ");
  if ((input.name ?? "").length > CUSTOM_NAME_MAX) errors.push(isEn ? "The name is too long." : "ชื่อผังยาวเกินไป");
  if (n < CUSTOM_MIN_CARDS || n > CUSTOM_MAX_CARDS) {
    errors.push(isEn ? `A spread needs 1–${CUSTOM_MAX_CARDS} cards.` : `ผังต้องมี 1–${CUSTOM_MAX_CARDS} ใบ`);
  }
  if (n > 0 && !layoutPoints(input.layout, n)) {
    errors.push(isEn ? "That layout doesn't fit this many cards." : "รูปแบบการวางนี้ใช้กับจำนวนใบนี้ไม่ได้");
  }
  const texts = [input.name, ...(input.positions ?? []).flatMap((p) => [p.nameTh, p.nameEn ?? "", p.meaning, p.meaningEn ?? ""])];
  if (texts.some((t) => EMOJI.test(t ?? ""))) errors.push(isEn ? "Please remove emoji." : "ขอไม่ใส่อิโมจินะ");
  if (texts.some((t) => SUSPICIOUS.test(t ?? ""))) errors.push(isEn ? "Some text isn't allowed." : "มีข้อความบางส่วนที่ไม่อนุญาต");

  (input.positions ?? []).forEach((p, i) => {
    const label = isEn ? `Position ${i + 1}` : `ตำแหน่งที่ ${i + 1}`;
    if (!p.nameTh?.trim()) errors.push(isEn ? `${label} needs a name.` : `${label} ยังไม่มีชื่อ`);
    if (!p.meaning?.trim()) errors.push(isEn ? `${label} needs a short meaning.` : `${label} ยังไม่ได้บอกว่าตำแหน่งนี้ถามอะไร`);
    if ((p.nameTh ?? "").length > CUSTOM_POS_NAME_MAX || (p.nameEn ?? "").length > CUSTOM_POS_NAME_MAX) {
      errors.push(isEn ? `${label}: name too long.` : `${label}: ชื่อยาวเกินไป`);
    }
    if ((p.meaning ?? "").length > CUSTOM_POS_MEANING_MAX || (p.meaningEn ?? "").length > CUSTOM_POS_MEANING_MAX) {
      errors.push(isEn ? `${label}: meaning too long.` : `${label}: คำอธิบายยาวเกินไป`);
    }
  });

  // ── คำแนะนำ (ไม่บล็อก) ──
  const ps = input.positions ?? [];
  for (let i = 0; i < ps.length; i++) {
    for (let j = i + 1; j < ps.length; j++) {
      if (similarity(`${ps[i].nameTh} ${ps[i].meaning}`, `${ps[j].nameTh} ${ps[j].meaning}`) > 0.72) {
        warnings.push(
          isEn
            ? `Positions ${i + 1} and ${j + 1} ask almost the same thing — the reading may repeat itself.`
            : `ตำแหน่งที่ ${i + 1} กับ ${j + 1} ถามแทบเรื่องเดียวกัน คำอ่านอาจซ้ำกัน`,
        );
      }
    }
  }
  if (ps.length >= 3 && !ps.some((p) => /แนะนำ|ก้าว|ควร|โฟกัส|ทำ|advice|step|should|focus|guidance/i.test(`${p.nameTh} ${p.nameEn ?? ""} ${p.meaning}`))) {
    warnings.push(
      isEn ? "Consider adding a guidance or next-step position so the reading ends with something you can do." : "ลองเพิ่มตำแหน่ง \"คำแนะนำ\" หรือ \"ก้าวต่อไป\" ให้คำอ่านจบด้วยสิ่งที่ลงมือได้",
    );
  }
  return { ok: errors.length === 0, errors, warnings };
}

/** ประกอบเป็น `Spread` เต็มรูป (พิกัดจากแม่แบบ) — เรียกหลังผ่าน `validateCustomSpread` เท่านั้น */
export function buildCustomSpread(input: CustomSpreadInput): Spread {
  const pts = layoutPoints(input.layout, input.positions.length);
  if (!pts) throw new Error("invalid layout for count");
  const positions: SpreadPosition[] = input.positions.map((p, index) => ({
    index,
    nameTh: p.nameTh.trim(),
    nameEn: p.nameEn?.trim() || undefined,
    meaning: p.meaning.trim(),
    meaningEn: p.meaningEn?.trim() || undefined,
    x: pts[index][0],
    y: pts[index][1],
  }));
  const name = input.name.trim();
  return {
    id: CUSTOM_SPREAD_ID,
    nameTh: name,
    nameEn: name,
    tagline: "ผังที่คุณออกแบบเอง",
    taglineEn: "A spread you designed",
    description: "ผังที่ผู้ใช้สร้างเองจากคลังตำแหน่ง",
    descriptionEn: "A custom spread built by the seeker",
    defaultCategory: "general",
    positions,
    credits: 0,
    guestAllowed: positions.length <= CUSTOM_STANDARD_MAX_CARDS,
    internal: true,
  } as Spread;
}

export function isCustomStandard(spread: Pick<Spread, "positions">): boolean {
  return spread.positions.length <= CUSTOM_STANDARD_MAX_CARDS;
}
