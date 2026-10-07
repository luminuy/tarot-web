/**
 * ✦ "สิ่งที่สมุดของคุณสะท้อน" — ขั้นคำนวณ (REFLECTION_JOURNAL_PLAN 1.5 · คลื่น 4)
 * ---------------------------------------------------------------------------
 * โค้ดคิด AI เล่า: ฟังก์ชันนี้หา "ข้อเท็จจริง" จากบันทึกในช่วงที่เลือก แต่ละข้อมีรหัสอ้างอิงคำอ่านต้นทาง (r1, r2 …)
 * แล้วค่อยส่งเฉพาะข้อเท็จจริงนี้ให้ AI เรียบเรียง — AI อ้างได้แค่รหัสที่มีอยู่จริง (ด่านตรวจตัดทิ้งถ้าอ้างมั่ว)
 * และถ้า AI ล่ม ข้อเท็จจริงชุดนี้แสดงได้ทันทีโดยไม่ต้องมี AI
 *
 * 🔐 ความเป็นส่วนตัว: ไม่ใช้ข้อความคำถาม/บันทึกโดยตรง — ใช้แค่ "ชนิดของคำถาม" (จัดกลุ่มด้วยคำบ่งชี้)
 *    ใจตอนนี้ใช้เป็นตัวเลขสรุปเท่านั้น · ไม่มีฟังก์ชันไหนในไฟล์นี้ส่งข้อความผู้ใช้ออกไป
 * ⚠️ ฟังก์ชันบริสุทธิ์ ใช้ `deck-index-meta` (เบา) — ไม่เดาไพ่ใบที่หาไม่เจอ (กฎเหล็กข้อ 14)
 */

import { deckMeta, type DeckElementCode } from "@/data/cards/deck-index-meta";
import { THEME_LABEL, themesOf, type ThemeId } from "@/data/cards/themes";
import type { SavedReadingItem } from "@/lib/utils/history";
import { binomialUpperTail, DECK_N } from "@/lib/journal/stats";

export type FactKind = "card-repeat" | "theme" | "element-shift" | "mood" | "outcome" | "question-shift";

export interface PatternFact {
  id: string;
  kind: FactKind;
  th: string;
  en: string;
  /** รหัสคำอ่านที่เป็นหลักฐาน (r1, r2 …) — อย่างน้อย 1 */
  refs: string[];
}

export interface PatternRef {
  ref: string;
  entryId: string;
  date: string;
  cardTh?: string;
  cardEn?: string;
  outcome: string;
}

export interface PatternResult {
  refs: PatternRef[];
  facts: PatternFact[];
  /** มีคำอ่านพอจะเห็นรูปแบบหรือยัง (≥ 3) */
  enough: boolean;
}

export const MIN_ENTRIES_FOR_PATTERNS = 3;

const ELEMENT: Record<DeckElementCode, { th: string; en: string }> = {
  F: { th: "ไฟ", en: "Fire" },
  W: { th: "น้ำ", en: "Water" },
  A: { th: "ลม", en: "Air" },
  E: { th: "ดิน", en: "Earth" },
};

/** ชนิดของคำถาม — จับจากคำบ่งชี้เท่านั้น ไม่เก็บ/ไม่ส่งข้อความคำถาม */
export type QuestionKind = "other" | "self" | "timing" | "outcome";
export function classifyQuestion(q: string): QuestionKind | null {
  const s = q.toLowerCase();
  if (/เขา|เธอ|แฟน|คนนั้น|อีกฝ่าย|คิดยังไง|รู้สึกยังไงกับ|\bhe\b|\bshe\b|\bthey\b|\bhis\b|\bher\b|partner|ex\b/.test(s)) return "other";
  if (/เมื่อไหร่|เมื่อไร|อีกนานไหม|when\b|how long/.test(s)) return "timing";
  if (/ฉันควร|ควรจะ|ตัวเอง|ฉันต้องการ|ทำอย่างไร|ทำยังไง|should i|what do i|how can i|myself|what should/.test(s)) return "self";
  if (/จะ.*ไหม|จะได้|will\b|going to/.test(s)) return "outcome";
  return null;
}

const QK_LABEL: Record<QuestionKind, { th: string; en: string }> = {
  other: { th: "อีกฝ่ายคิดหรือรู้สึกอย่างไร", en: "what the other person thinks or feels" },
  self: { th: "ตัวคุณเองควรทำอย่างไร", en: "what you yourself should do" },
  timing: { th: "จะเกิดขึ้นเมื่อไหร่", en: "when things will happen" },
  outcome: { th: "ผลจะออกมาอย่างไร", en: "how things will turn out" },
};

export function computePatterns(entries: readonly SavedReadingItem[]): PatternResult {
  const list = [...entries]
    .filter((e) => !e.corrupted)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const refs: PatternRef[] = list.map((e, i) => {
    const pc = [...(e.cards ?? [])].sort((a, b) => a.order - b.order)[0];
    const meta = pc ? deckMeta(pc.cardIndex) : undefined;
    return {
      ref: `r${i + 1}`,
      entryId: e.id,
      date: e.date,
      cardTh: meta ? `${meta.nameTh}${pc?.isReversed ? " (กลับหัว)" : ""}` : undefined,
      cardEn: meta ? `${meta.nameEn}${pc?.isReversed ? " (reversed)" : ""}` : undefined,
      outcome: e.outcome ?? "PENDING",
    };
  });
  const refOf = (e: SavedReadingItem) => refs[list.indexOf(e)].ref;
  const facts: PatternFact[] = [];
  const add = (kind: FactKind, th: string, en: string, factRefs: string[]) => {
    if (factRefs.length === 0) return;
    facts.push({ id: `f${facts.length + 1}`, kind, th, en, refs: [...new Set(factRefs)] });
  };

  if (list.length < MIN_ENTRIES_FOR_PATTERNS) return { refs, facts, enough: false };

  // ── ไพ่ที่ซ้ำ (เกินโอกาสสุ่มจริง: P < 0.01 ภายใต้การสุ่มปกติ หรือ ≥ 3 ครั้งในช่วงสั้น) ──
  const byCard = new Map<number, SavedReadingItem[]>();
  let drawn = 0;
  for (const e of list) {
    for (const c of e.cards ?? []) {
      if (!deckMeta(c.cardIndex)) continue;
      drawn++;
      byCard.set(c.cardIndex, [...(byCard.get(c.cardIndex) ?? []), e]);
    }
  }
  for (const [idx, es] of [...byCard.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 3)) {
    if (es.length < 2) continue;
    const p = binomialUpperTail(drawn, es.length, 1 / DECK_N);
    if (es.length < 3 && p >= 0.01) continue;
    const m = deckMeta(idx)!;
    add(
      "card-repeat",
      `${m.nameTh} มาหาคุณ ${es.length} ครั้งในช่วงนี้${p < 0.05 / DECK_N ? " — มากเกินกว่าจะเป็นแค่ความบังเอิญของการสุ่ม" : ""}`,
      `${m.nameEn} came up ${es.length} times${p < 0.05 / DECK_N ? " — more than chance alone would explain" : ""}`,
      es.map(refOf),
    );
  }

  // ── แก่นเรื่องที่วนกลับมา ──
  const byTheme = new Map<ThemeId, SavedReadingItem[]>();
  for (const e of list) {
    const seen = new Set<ThemeId>();
    for (const c of e.cards ?? []) {
      const m = deckMeta(c.cardIndex);
      if (!m) continue;
      for (const t of themesOf(m.id, c.isReversed)) seen.add(t);
    }
    for (const t of seen) byTheme.set(t, [...(byTheme.get(t) ?? []), e]);
  }
  const topTheme = [...byTheme.entries()].sort((a, b) => b[1].length - a[1].length)[0];
  if (topTheme && topTheme[1].length >= Math.max(2, Math.ceil(list.length * 0.5))) {
    add(
      "theme",
      `ไพ่ของคุณพูดถึง "${THEME_LABEL[topTheme[0]].th}" ใน ${topTheme[1].length} จาก ${list.length} คำอ่าน`,
      `Your cards speak of "${THEME_LABEL[topTheme[0]].en}" in ${topTheme[1].length} of ${list.length} readings`,
      topTheme[1].map(refOf),
    );
  }

  // ── ธาตุเด่นเปลี่ยนจากครึ่งแรกไปครึ่งหลัง ──
  if (list.length >= 4) {
    const half = Math.floor(list.length / 2);
    const dominant = (es: SavedReadingItem[]) => {
      const n: Record<DeckElementCode, number> = { F: 0, W: 0, A: 0, E: 0 };
      for (const e of es) for (const c of e.cards ?? []) {
        const m = deckMeta(c.cardIndex);
        if (m) n[m.element]++;
      }
      const sorted = (Object.entries(n) as Array<[DeckElementCode, number]>).sort((a, b) => b[1] - a[1]);
      return sorted[0][1] > sorted[1][1] ? sorted[0][0] : null; // ต้องชนะขาด
    };
    const a = dominant(list.slice(0, half));
    const b = dominant(list.slice(half));
    if (a && b && a !== b) {
      add(
        "element-shift",
        `พลังในไพ่เปลี่ยนจากธาตุ${ELEMENT[a].th}ช่วงแรก ไปเป็นธาตุ${ELEMENT[b].th}ช่วงหลัง`,
        `The energy in your cards moved from ${ELEMENT[a].en} early on to ${ELEMENT[b].en} more recently`,
        [refOf(list[0]), refOf(list[half - 1]), refOf(list[half]), refOf(list[list.length - 1])],
      );
    }
  }

  // ── ใจก่อน ➔ หลังเปิดไพ่ ──
  const moodPairs = list.filter((e) => e.moodBefore && e.moodAfter);
  if (moodPairs.length >= 2) {
    const lifted = moodPairs.filter((e) => e.moodAfter! > e.moodBefore!);
    const dropped = moodPairs.filter((e) => e.moodAfter! < e.moodBefore!);
    if (lifted.length > dropped.length) {
      add("mood", `${lifted.length} จาก ${moodPairs.length} ครั้ง ใจคุณเบาลงหลังเปิดไพ่`, `In ${lifted.length} of ${moodPairs.length} readings you felt lighter afterwards`, lifted.map(refOf));
    } else if (dropped.length > lifted.length) {
      add("mood", `${dropped.length} จาก ${moodPairs.length} ครั้ง ใจคุณหนักขึ้นหลังเปิดไพ่`, `In ${dropped.length} of ${moodPairs.length} readings you felt heavier afterwards`, dropped.map(refOf));
    }
  }

  // ── ผลจริงที่บันทึกไว้ ──
  const recorded = list.filter((e) => e.outcome && e.outcome !== "PENDING");
  if (recorded.length >= 2) {
    const happened = recorded.filter((e) => e.outcome === "ACCURATE" || e.outcome === "PARTIAL");
    add(
      "outcome",
      `คุณบันทึกผลจริงไว้ ${recorded.length} ครั้ง — เกิดขึ้นจริงหรือบางส่วน ${happened.length} ครั้ง`,
      `You recorded what happened ${recorded.length} times — fully or partly as read in ${happened.length}`,
      recorded.map(refOf),
    );
  }

  // ── ชนิดคำถามที่เปลี่ยนไป (ไม่ใช้ข้อความคำถาม — ใช้แค่ชนิด) ──
  if (list.length >= 4) {
    const half = Math.floor(list.length / 2);
    const top = (es: SavedReadingItem[]) => {
      const n = new Map<QuestionKind, SavedReadingItem[]>();
      for (const e of es) {
        const k = classifyQuestion(e.question);
        if (k) n.set(k, [...(n.get(k) ?? []), e]);
      }
      const best = [...n.entries()].sort((a, b) => b[1].length - a[1].length)[0];
      return best && best[1].length >= 2 ? best : null;
    };
    const a = top(list.slice(0, half));
    const b = top(list.slice(half));
    if (a && b && a[0] !== b[0]) {
      add(
        "question-shift",
        `ช่วงแรกคุณถามเรื่อง "${QK_LABEL[a[0]].th}" บ่อย ช่วงหลังเปลี่ยนมาถามว่า "${QK_LABEL[b[0]].th}"`,
        `Early on you mostly asked about ${QK_LABEL[a[0]].en}; lately you've been asking about ${QK_LABEL[b[0]].en}`,
        [...a[1], ...b[1]].map(refOf),
      );
    }
  }

  return { refs, facts, enough: true };
}

/** คำต้องห้ามในข้อสังเกตที่ AI เรียบเรียง — เชิงพยากรณ์/ฟันธง */
export const BANNED_REFLECTION = /จะเกิดขึ้นแน่|แน่นอน|ฟันธง|ดวงกำหนด|โชคชะตาลิขิต|destined|will definitely|guarantee|fated/i;

export interface ReflectionObservation {
  text: string;
  refs: string[];
}

/**
 * ตรวจคำตอบของ AI: ทุกข้อต้องอ้างรหัสที่มีจริง ≥ 1 · ไม่มีคำฟันธง · ภาษาตรง (อังกฤษห้ามมีอักษรไทย)
 * ข้อที่ไม่ผ่าน "ตัดทิ้ง" ไม่ใช่แก้ — ผู้ใช้ไม่ควรเห็นข้อสังเกตที่ไม่มีหลักฐาน
 */
export function validateObservations(raw: unknown, validRefs: ReadonlySet<string>, isEnglish: boolean): ReflectionObservation[] {
  if (!Array.isArray(raw)) return [];
  const out: ReflectionObservation[] = [];
  for (const item of raw.slice(0, 6)) {
    const text = typeof item?.text === "string" ? item.text.trim() : "";
    const refs = Array.isArray(item?.refs) ? item.refs.filter((r: unknown): r is string => typeof r === "string" && validRefs.has(r)) : [];
    if (!text || text.length > 400 || refs.length === 0) continue;
    if (BANNED_REFLECTION.test(text)) continue;
    if (isEnglish && /[฀-๿]/.test(text)) continue;
    // ข้อความที่อ้างรหัสในเนื้อหาแต่รหัสนั้นไม่มีจริง = แต่งหลักฐาน
    const mentioned = text.match(/\br\d+\b/g) ?? [];
    if (mentioned.some((r: string) => !validRefs.has(r))) continue;
    out.push({ text: text.replace(/\s*\(?\br\d+(?:\s*,\s*r\d+)*\)?/g, "").trim(), refs: [...new Set(refs as string[])] });
  }
  return out;
}
