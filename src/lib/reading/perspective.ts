/**
 * ✦ "มองเรื่องเดียวกันจากอีกมุม" — เทียบคำอ่านสองบุคลิกด้วยโค้ด (REFLECTION_JOURNAL_PLAN 1.7)
 * ---------------------------------------------------------------------------
 * ไพ่ชุดเดียวกันเป๊ะ (เซสชัน Provably Fair เดิม) ต่างกันแค่มุมมองของแม่หมอ
 * จึงเทียบ "สิ่งที่แต่ละมุมเน้น" จากถ้อยคำในคำอ่าน — ไม่เรียก AI เพิ่มเพื่อสรุป
 * ⚠️ ห้ามมีคำว่า "แม่นกว่า" / "ถูกกว่า" หรือจัดอันดับมุมมองใดทั้งสิ้น และไม่แสดงชื่อโมเดล
 */

import type { Reading } from "@/lib/schema/reading";

export type AspectId = "feeling" | "action" | "people" | "self" | "caution" | "symbol";

export const ASPECT_LABEL: Record<AspectId, { th: string; en: string }> = {
  feeling: { th: "ความรู้สึกในใจ", en: "feelings" },
  action: { th: "สิ่งที่ลงมือทำได้", en: "practical steps" },
  people: { th: "คนรอบตัวและความสัมพันธ์", en: "the people involved" },
  self: { th: "การทบทวนตัวเอง", en: "inner reflection" },
  caution: { th: "สิ่งที่ควรระวัง", en: "what to watch out for" },
  symbol: { th: "สัญลักษณ์บนหน้าไพ่", en: "the symbolism" },
};

const LEXICON: Record<AspectId, RegExp> = {
  feeling: /ความรู้สึก|อารมณ์|หัวใจ|ใจ(?:ของ|คุณ)|เสียใจ|อบอุ่น|กังวล|เหงา|feel|emotion|heart|hurt|warmth|anxious|lonely/gi,
  action: /ลงมือ|เริ่ม|ก้าว|วางแผน|ตัดสินใจ|ลองทำ|ขั้นตอน|จัดการ|act(?:ion)?\b|step|plan|decide|start|practical|try\b/gi,
  people: /อีกฝ่าย|คนรอบ|ครอบครัว|เพื่อน|คนรัก|คู่|เจ้านาย|ทีม|partner|family|friend|colleague|team|other person|people/gi,
  self: /ตัวเอง|ข้างใน|ภายใน|ทบทวน|ตัวตน|yourself|inner|within|reflect|self\b/gi,
  caution: /ระวัง|อุปสรรค|เสี่ยง|ล่าช้า|ติดขัด|careful|caution|obstacle|risk|delay|blocked/gi,
  symbol: /สัญลักษณ์|ภาพบนหน้าไพ่|ตัวละคร|จิตวิญญาณ|แม่แบบ|symbol|imagery|figure|archetyp|spirit/gi,
};

function readingText(r: Partial<Reading>): string {
  return [r.opening, ...(r.cards ?? []).map((c) => `${c.headline ?? ""} ${c.reading ?? ""}`), r.connections, r.summary, ...(r.advice ?? [])]
    .filter(Boolean)
    .join(" ");
}

/** สัดส่วนการเน้นแต่ละด้าน (รวม = 1) — ข้อความว่าง = ทุกด้านเป็น 0 */
export function aspectProfile(r: Partial<Reading>): Record<AspectId, number> {
  const text = readingText(r);
  const counts = {} as Record<AspectId, number>;
  let total = 0;
  for (const a of Object.keys(LEXICON) as AspectId[]) {
    const n = (text.match(LEXICON[a]) ?? []).length;
    counts[a] = n;
    total += n;
  }
  for (const a of Object.keys(counts) as AspectId[]) counts[a] = total ? counts[a] / total : 0;
  return counts;
}

/** ด้านที่เน้นจริง = สัดส่วน ≥ 60% ของด้านที่เน้นที่สุด (และมีอย่างน้อยบ้าง) */
function emphasized(p: Record<AspectId, number>): AspectId[] {
  const max = Math.max(...Object.values(p));
  if (max <= 0) return [];
  return (Object.keys(p) as AspectId[]).filter((a) => p[a] >= max * 0.6).sort((x, y) => p[y] - p[x]);
}

export interface PerspectiveComparison {
  shared: AspectId[];
  onlyA: AspectId[];
  onlyB: AspectId[];
  /** ผังใช่/ไม่ใช่ — สองมุมตอบตรงกันไหม (null = ไม่ใช่ผังใช่/ไม่ใช่) */
  yesNoAgree: boolean | null;
}

export function comparePerspectives(a: Partial<Reading>, b: Partial<Reading>): PerspectiveComparison {
  const ea = emphasized(aspectProfile(a));
  const eb = emphasized(aspectProfile(b));
  return {
    shared: ea.filter((x) => eb.includes(x)),
    onlyA: ea.filter((x) => !eb.includes(x)),
    onlyB: eb.filter((x) => !ea.includes(x)),
    yesNoAgree: a.yesNoAnswer && b.yesNoAnswer ? a.yesNoAnswer === b.yesNoAnswer : null,
  };
}

/** คำที่ห้ามโผล่ในหน้าจอเทียบมุมมอง — ด่าน test-perspective ตรวจ */
export const BANNED_COMPARISON_WORDS = /แม่นกว่า|ถูกกว่า|ดีกว่า|more accurate|better reader|more correct/i;
