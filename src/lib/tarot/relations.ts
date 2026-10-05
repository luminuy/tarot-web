/**
 * ✦ แผนที่ความเชื่อมโยงของไพ่ในผัง (Card Relationship Engine v2)
 * ---------------------------------------------------------------------------
 * ฟังก์ชันบริสุทธิ์ — คำนวณจากสารานุกรม 78 ใบอย่างเดียว ไม่เรียก AI ไม่อ่านข้อมูลผู้ใช้
 * ผลเหมือนเดิมทุกครั้งสำหรับไพ่ชุดเดิม ➔ แคชได้ ตรวจสอบได้ (แผน REFLECTION_JOURNAL_PLAN 1.1)
 *
 * 3 ชั้น:
 *  1. คู่ไพ่ (pairs) — ธาตุคู่กันตามหลัก Golden Dawn (กติกาเดียวกับ `src/lib/ai/alchemy.ts`)
 *     + แก่นเรื่องที่ตรงกัน (`src/data/cards/themes.ts`)
 *  2. กลุ่มแก่นเรื่อง (clusters) — ไพ่ ≥ 2 ใบที่ชี้เรื่องเดียวกัน
 *  3. สัญญาณโครงสร้าง (signals) — เมเจอร์เยอะ · ชุดเด่น · เลขซ้ำ · ราชสำนักหลายใบ · กลับหัวเยอะ · ขาดธาตุ
 *
 * ⚠️ อ้างไพ่ด้วย "ลำดับตำแหน่งในผัง" ไม่ใช่ชื่อไพ่ — ผู้เรียกแปลงเป็นชื่อเองจากสำรับจริง (กฎเหล็กข้อ 14)
 * ⚠️ ไฟล์นี้ยังไม่ถูกส่งเข้า prompt — การแตะ prompt ต้องรอผล ai:judge (HANDOFF_AI_JUDGE_BASELINE)
 */

import type { TarotCard } from "@/data/cards/types";
import { THEME_LABEL, themesOf, type ThemeId } from "@/data/cards/themes";

type Element = TarotCard["element"];

export type RelationKind = "support" | "tension" | "echo";
export type RelationSource = "element" | "theme";

export interface RelationPair {
  /** ลำดับตำแหน่งในผัง (0-based) — a < b เสมอ */
  a: number;
  b: number;
  kind: RelationKind;
  sources: RelationSource[];
  noteTh: string;
  noteEn: string;
  /** จำนวนหลักฐานที่ชี้ทางเดียวกัน (1–2) */
  strength: number;
}

export interface ThemeCluster {
  theme: ThemeId;
  labelTh: string;
  labelEn: string;
  positions: number[];
}

export type SignalId =
  | "major-heavy"
  | "suit-dominant"
  | "number-echo"
  | "court-crowd"
  | "reversal-heavy"
  | "missing-element";

export interface StructuralSignal {
  id: SignalId;
  noteTh: string;
  noteEn: string;
  /** ตำแหน่งที่เกี่ยวข้อง — ว่าง = ทั้งผัง */
  positions: number[];
}

export interface RelationsResult {
  pairs: RelationPair[];
  clusters: ThemeCluster[];
  signals: StructuralSignal[];
}

export interface RelationInput {
  card: Pick<TarotCard, "id" | "arcana" | "suit" | "number" | "element">;
  isReversed: boolean;
}

/** เพดานจำนวนคู่ที่คืน — ผังใหญ่ 10 ใบมีได้ 45 คู่ ผู้ใช้อ่านไม่ไหว */
export const MAX_PAIRS = 8;

const ELEMENT_EN: Record<Element, string> = { ไฟ: "Fire", น้ำ: "Water", ลม: "Air", ดิน: "Earth" };

const SUIT_TH: Record<string, string> = { wands: "ไม้เท้า", cups: "ถ้วย", swords: "ดาบ", pentacles: "เหรียญ" };
const SUIT_EN: Record<string, string> = { wands: "Wands", cups: "Cups", swords: "Swords", pentacles: "Pentacles" };

const ELEMENTS: Element[] = ["ไฟ", "น้ำ", "ลม", "ดิน"];

/** กติกาธาตุคู่ — ต้องตรงกับ `alchemy.ts` (ไฟ+ลม · น้ำ+ดิน เกื้อ / ไฟ+น้ำ · ลม+ดิน ขัด / ที่เหลือกลาง) */
function elementRelation(x: Element, y: Element): { kind: RelationKind; th: string; en: string } | null {
  const is = (p: Element, q: Element) => (x === p && y === q) || (x === q && y === p);
  if (x === y) {
    return {
      kind: "support",
      th: `ธาตุ${x}เหมือนกัน — พลังเดียวกันเสริมให้หนักแน่นขึ้น`,
      en: `Both ${ELEMENT_EN[x]} — the same energy doubles down`,
    };
  }
  if (is("ไฟ", "ลม")) {
    return { kind: "support", th: "ไฟกับลมเกื้อกัน — ความคิดหนุนให้กล้าลงมือ", en: "Fire and Air feed each other — ideas fuel action" };
  }
  if (is("น้ำ", "ดิน")) {
    return {
      kind: "support",
      th: "น้ำกับดินเกื้อกัน — ความรู้สึกกลายเป็นสิ่งที่จับต้องได้",
      en: "Water and Earth nourish each other — feelings take tangible form",
    };
  }
  if (is("ไฟ", "น้ำ")) {
    return {
      kind: "tension",
      th: "ไฟกับน้ำขัดกัน — ใจอยากพุ่งไปข้างหน้าแต่ความรู้สึกยังดึงไว้",
      en: "Fire and Water clash — the urge to move pulls against what you feel",
    };
  }
  if (is("ลม", "ดิน")) {
    return {
      kind: "tension",
      th: "ลมกับดินขัดกัน — สิ่งที่คิดไว้ชนกับข้อจำกัดในความเป็นจริง",
      en: "Air and Earth clash — plans in your head meet real-world limits",
    };
  }
  return null; // ไฟ+ดิน · ลม+น้ำ = กลาง ไม่นับเป็นความเชื่อมโยงที่ควรชี้ให้ดู
}

export function analyzeRelations(inputs: readonly RelationInput[]): RelationsResult {
  const n = inputs.length;
  const themes = inputs.map((i) => themesOf(i.card.id, i.isReversed));

  // ── 1. คู่ไพ่ ──
  const pairs: RelationPair[] = [];
  for (let a = 0; a < n; a++) {
    for (let b = a + 1; b < n; b++) {
      const el = elementRelation(inputs[a].card.element, inputs[b].card.element);
      const shared = themes[a].filter((t) => themes[b].includes(t));
      if (!el && shared.length === 0) continue;

      const sources: RelationSource[] = [];
      const th: string[] = [];
      const en: string[] = [];
      if (shared.length > 0) {
        sources.push("theme");
        th.push(`ชี้เรื่องเดียวกัน: ${shared.map((t) => THEME_LABEL[t].th).join(" · ")}`);
        en.push(`Point to the same theme: ${shared.map((t) => THEME_LABEL[t].en).join(" · ")}`);
      }
      if (el) {
        sources.push("element");
        th.push(el.th);
        en.push(el.en);
      }
      // ธาตุขัดกันมีน้ำหนักกว่า "เรื่องเดียวกัน" — เรื่องเดียวกันแต่พลังสวนกันคือจุดที่ผู้ใช้ควรเห็น
      const kind: RelationKind = el?.kind === "tension" ? "tension" : el?.kind === "support" ? "support" : "echo";
      pairs.push({ a, b, kind, sources, noteTh: th.join(" — "), noteEn: en.join(" — "), strength: sources.length });
    }
  }
  // เรียง: หลักฐานมากก่อน · ขัดกันก่อนเสริมกัน (สิ่งที่ต้องระวังมีค่ากว่า) · ตำแหน่งใกล้กันก่อน
  const kindRank: Record<RelationKind, number> = { tension: 0, support: 1, echo: 2 };
  pairs.sort(
    (p, q) =>
      q.strength - p.strength || kindRank[p.kind] - kindRank[q.kind] || p.b - p.a - (q.b - q.a) || p.a - q.a,
  );

  // ── 2. กลุ่มแก่นเรื่อง ──
  const byTheme = new Map<ThemeId, number[]>();
  themes.forEach((list, pos) => {
    for (const t of list) byTheme.set(t, [...(byTheme.get(t) ?? []), pos]);
  });
  const clusters: ThemeCluster[] = [...byTheme.entries()]
    .filter(([, positions]) => positions.length >= 2)
    .sort((x, y) => y[1].length - x[1].length || x[1][0] - y[1][0])
    .map(([theme, positions]) => ({ theme, labelTh: THEME_LABEL[theme].th, labelEn: THEME_LABEL[theme].en, positions }));

  // ── 3. สัญญาณโครงสร้าง (ผัง 1–2 ใบไม่มีโครงให้อ่าน) ──
  const signals: StructuralSignal[] = [];
  if (n >= 3) {
    const all = inputs.map((_, i) => i);
    const majors = all.filter((i) => inputs[i].card.arcana === "major");
    if (majors.length * 2 >= n) {
      signals.push({
        id: "major-heavy",
        noteTh: `ไพ่ชุดใหญ่ ${majors.length} จาก ${n} ใบ — เรื่องนี้เป็นจังหวะชีวิตที่ใหญ่กว่าการตัดสินใจรายวัน`,
        noteEn: `${majors.length} of ${n} cards are Major Arcana — this is a larger life chapter, not a day-to-day matter`,
        positions: majors,
      });
    }

    const bySuit = new Map<string, number[]>();
    for (const i of all) {
      const suit = inputs[i].card.suit;
      if (suit) bySuit.set(suit, [...(bySuit.get(suit) ?? []), i]);
    }
    for (const [suit, positions] of bySuit) {
      if (positions.length * 2 > n) {
        signals.push({
          id: "suit-dominant",
          noteTh: `ชุด${SUIT_TH[suit]}เด่น ${positions.length} ใบ — เรื่องหลักอยู่ที่${ELEMENT_FOCUS_TH[suit]}`,
          noteEn: `${SUIT_EN[suit]} dominate (${positions.length} cards) — the heart of this is ${ELEMENT_FOCUS_EN[suit]}`,
          positions,
        });
      }
    }

    // เลขซ้ำ: เฉพาะไพ่เลข 1–10 ของชุดเล็ก (ราชสำนักนับแยก)
    const byNumber = new Map<number, number[]>();
    for (const i of all) {
      const c = inputs[i].card;
      if (c.arcana === "minor" && c.number >= 1 && c.number <= 10) {
        byNumber.set(c.number, [...(byNumber.get(c.number) ?? []), i]);
      }
    }
    for (const [num, positions] of byNumber) {
      if (positions.length >= 2) {
        signals.push({
          id: "number-echo",
          noteTh: `เลข ${num} ซ้ำ ${positions.length} ใบ — ${NUMBER_TH[num]}`,
          noteEn: `The number ${num} repeats ${positions.length} times — ${NUMBER_EN[num]}`,
          positions,
        });
      }
    }

    const courts = all.filter((i) => inputs[i].card.arcana === "minor" && inputs[i].card.number >= 11);
    if (courts.length >= 2) {
      signals.push({
        id: "court-crowd",
        noteTh: `ไพ่บุคคล ${courts.length} ใบ — มีคนอื่นหรือบทบาทหลายแบบเข้ามาเกี่ยวข้องกับเรื่องนี้`,
        noteEn: `${courts.length} court cards — other people, or several roles you play, are part of this`,
        positions: courts,
      });
    }

    const reversed = all.filter((i) => inputs[i].isReversed);
    if (reversed.length * 10 >= n * 6) {
      signals.push({
        id: "reversal-heavy",
        noteTh: `ไพ่กลับหัว ${reversed.length} จาก ${n} ใบ — พลังยังติดค้างหรือหันเข้าข้างใน ยังไม่ถึงจังหวะแสดงออก`,
        noteEn: `${reversed.length} of ${n} cards reversed — energy is held back or turned inward, not yet ready to show`,
        positions: reversed,
      });
    }

    if (n >= 4) {
      const present = new Set(inputs.map((i) => i.card.element));
      for (const el of ELEMENTS) {
        if (!present.has(el)) {
          signals.push({
            id: "missing-element",
            noteTh: `ไม่มีธาตุ${el}เลย — ${MISSING_TH[el]}`,
            noteEn: `No ${ELEMENT_EN[el]} at all — ${MISSING_EN[el]}`,
            positions: [],
          });
        }
      }
    }
  }

  return { pairs: pairs.slice(0, MAX_PAIRS), clusters, signals };
}

const ELEMENT_FOCUS_TH: Record<string, string> = {
  wands: "แรงขับ ความกล้า และการลงมือทำ",
  cups: "ความรู้สึกและความสัมพันธ์",
  swords: "ความคิด การสื่อสาร และการตัดสินใจ",
  pentacles: "เงิน งาน และความมั่นคงที่จับต้องได้",
};
const ELEMENT_FOCUS_EN: Record<string, string> = {
  wands: "drive, courage and action",
  cups: "feelings and relationships",
  swords: "thinking, communication and decisions",
  pentacles: "money, work and tangible security",
};

const NUMBER_TH: Record<number, string> = {
  1: "จุดเริ่มต้นใหม่กำลังเปิดหลายทาง",
  2: "ต้องเลือกหรือหาสมดุลระหว่างสองฝั่ง",
  3: "สิ่งที่เริ่มไว้กำลังเติบโตและขยายออก",
  4: "ช่วงตั้งหลักให้มั่นคง แต่ระวังติดอยู่กับที่",
  5: "ช่วงเปลี่ยนผ่านที่มีแรงเสียดทาน",
  6: "การปรับสมดุลและการให้-รับ",
  7: "ช่วงทดสอบ ต้องประเมินและยืนหยัด",
  8: "การเคลื่อนไหวและการลงมือต่อเนื่อง",
  9: "ใกล้ถึงปลายทาง เหลือแรงสุดท้าย",
  10: "จบวงจรหนึ่งและเตรียมขึ้นวงจรใหม่",
};
const NUMBER_EN: Record<number, string> = {
  1: "a fresh start is opening on several fronts",
  2: "a choice or a balance between two sides",
  3: "what you started is growing and expanding",
  4: "a time to stabilise — but beware of standing still",
  5: "a transition that comes with friction",
  6: "rebalancing, giving and receiving",
  7: "a test that asks you to assess and hold your ground",
  8: "movement and sustained effort",
  9: "near the finish line, one last push",
  10: "a cycle closing as a new one begins",
};

const MISSING_TH: Record<Element, string> = {
  ไฟ: "ขาดแรงผลักและความกล้า อาจรู้สึกเฉื่อยหรือไม่อยากออกจากที่เดิม",
  น้ำ: "เหตุผลนำหัวใจ ความรู้สึกจริงอาจถูกเก็บไว้",
  ลม: "ขาดการคิดวางแผนหรือการพูดคุยให้ชัด",
  ดิน: "ยังไม่ลงมือให้เป็นรูปธรรม ความตั้งใจยังไม่หยั่งราก",
};
const MISSING_EN: Record<Element, string> = {
  ไฟ: "drive and courage are missing; it may feel hard to leave your comfort zone",
  น้ำ: "logic leads the heart; true feelings may be set aside",
  ลม: "clear planning or honest conversation is missing",
  ดิน: "no concrete action yet; intentions have not taken root",
};
