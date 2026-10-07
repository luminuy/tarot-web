/**
 * ✦ สถิติสมุดดวงแบบซื่อตรง (REFLECTION_JOURNAL_PLAN 1.3 · "จุดที่ทำให้ระดับโลกต่างจากเว็บทั่วไป")
 * ---------------------------------------------------------------------------
 * เว็บทั่วไปโชว์ "ไพ่ที่คุณได้บ่อยที่สุด" ซึ่งส่วนใหญ่เป็นแค่ความบังเอิญของการสุ่ม
 * เว็บเราเป็น Provably Fair จึงต้องบอกตรง ๆ ว่าอะไร "เด่นจริง" และอะไร "อยู่ในช่วงปกติของการสุ่ม"
 *
 * กติกา:
 *  • รายใบ: เจอ ≥ 3 ครั้ง **และ** P(X ≥ k) ภายใต้การสุ่มปกติ < 0.05/78 (Bonferroni — ทดสอบพร้อมกัน 78 ใบ
 *    ถ้าใช้ 0.05 ตรง ๆ จะได้ไพ่ "เด่น" ปลอม ~4 ใบต่อสมุดเสมอ) ➔ ป้าย "เด่นจริง"
 *  • สัดส่วน (เมเจอร์ · กลับหัว · ธาตุ): z-score ของสัดส่วน |z| ≥ 2.58 (≈ p < 0.01 สองทาง) และ n ≥ 20
 *  • ข้อมูลน้อย (< 10 ใบ) ➔ บอกว่ายังน้อยเกินจะสรุป ไม่แสดงป้ายใด ๆ
 *
 * ฟังก์ชันบริสุทธิ์ ไม่ import สำรับเต็ม — ใช้ `deck-index-meta.ts` (เบา) จึงรันใน island ได้
 * ⚠️ ไม่ใช่ "ความแม่น" และไม่ใช่คำทำนาย — เป็นการนับเทียบกับโอกาสสุ่มเท่านั้น
 */

import { DECK_INDEX_META, deckMeta, type DeckElementCode } from "@/data/cards/deck-index-meta";
import { themesOf, THEME_IDS, type ThemeId } from "@/data/cards/themes";
import type { SavedReadingItem } from "@/lib/utils/history";

export const DECK_N = 78;
/** อัตราไพ่กลับหัวของเครื่องสับ — ต้องตรงกับ `REVERSAL_RATE` ใน `src/lib/tarot/shuffle.ts` */
export const EXPECTED_REVERSAL_RATE = 0.4;
export const MIN_CARDS_FOR_STATS = 10;
const CARD_ALPHA = 0.05 / DECK_N;
const RATIO_Z = 2.58;
const MIN_N_FOR_RATIO = 20;

/** log ของ C(n, k) ด้วย log-gamma (Lanczos) — n ระดับหลักพันก็ไม่ล้น */
function logGamma(z: number): number {
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
    12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function logChoose(n: number, k: number): number {
  return logGamma(n + 1) - logGamma(k + 1) - logGamma(n - k + 1);
}

/** P(X ≥ k) เมื่อ X ~ Binomial(n, p) — รวมหางบนในโดเมน log กันค่าเล็กจนเป็นศูนย์ */
export function binomialUpperTail(n: number, k: number, p: number): number {
  if (k <= 0) return 1;
  if (k > n) return 0;
  let sum = 0;
  for (let i = k; i <= n; i++) {
    sum += Math.exp(logChoose(n, i) + i * Math.log(p) + (n - i) * Math.log1p(-p));
  }
  return Math.min(1, sum);
}

export interface CardFrequency {
  cardIndex: number;
  cardId: string;
  nameTh: string;
  nameEn: string;
  count: number;
  expected: number;
  pValue: number;
  /** เด่นจริงทางสถิติ (ผ่าน Bonferroni) — false = อยู่ในช่วงปกติของการสุ่ม */
  standsOut: boolean;
}

export interface RatioStat {
  key: string;
  count: number;
  n: number;
  actual: number;
  expected: number;
  z: number;
  /** "higher" / "lower" เมื่อต่างจากโอกาสสุ่มอย่างมีนัย · "normal" = อยู่ในช่วงปกติ · "too-few" = ข้อมูลน้อย */
  verdict: "higher" | "lower" | "normal" | "too-few";
}

export interface JournalStats {
  readings: number;
  cardsDrawn: number;
  enoughData: boolean;
  /** เรียงจากเจอบ่อยไปน้อย ตัดที่ 12 ใบ (เฉพาะที่เจอ ≥ 2 ครั้ง) */
  topCards: CardFrequency[];
  standOutCards: CardFrequency[];
  major: RatioStat;
  reversed: RatioStat;
  elements: Record<DeckElementCode, RatioStat>;
  themes: Array<RatioStat & { theme: ThemeId }>;
  /** การเปลี่ยนของใจก่อน ➔ หลังเปิดไพ่ (เฉพาะรายการที่บันทึกทั้งสองค่า) */
  mood: { pairs: number; lifted: number; same: number; dropped: number; avgShift: number };
  outcomes: { recorded: number; accurate: number; partial: number; notHappened: number };
}

function ratio(key: string, count: number, n: number, expected: number): RatioStat {
  const actual = n > 0 ? count / n : 0;
  const sd = Math.sqrt((expected * (1 - expected)) / Math.max(1, n));
  const z = n > 0 && sd > 0 ? (actual - expected) / sd : 0;
  const verdict: RatioStat["verdict"] =
    n < MIN_N_FOR_RATIO ? "too-few" : z >= RATIO_Z ? "higher" : z <= -RATIO_Z ? "lower" : "normal";
  return { key, count, n, actual, expected, z, verdict };
}

const ELEMENT_DECK_SHARE: Record<DeckElementCode, number> = (() => {
  const counts: Record<DeckElementCode, number> = { F: 0, W: 0, A: 0, E: 0 };
  for (const row of DECK_INDEX_META) counts[row[1]]++;
  return {
    F: counts.F / DECK_N,
    W: counts.W / DECK_N,
    A: counts.A / DECK_N,
    E: counts.E / DECK_N,
  };
})();

/** สัดส่วน "ไพ่ทั้งสำรับ (ทั้งสองทิศตามอัตรากลับหัว) ที่มีแก่นเรื่องนี้" = ค่าคาดหมายของแก่นเรื่อง */
const THEME_EXPECTED: Record<ThemeId, number> = (() => {
  const out = {} as Record<ThemeId, number>;
  for (const t of THEME_IDS) {
    let share = 0;
    for (const row of DECK_INDEX_META) {
      if (themesOf(row[0], false).includes(t)) share += 1 - EXPECTED_REVERSAL_RATE;
      if (themesOf(row[0], true).includes(t)) share += EXPECTED_REVERSAL_RATE;
    }
    out[t] = share / DECK_N;
  }
  return out;
})();

export function computeJournalStats(items: readonly SavedReadingItem[]): JournalStats {
  const counts = new Map<number, number>();
  let cardsDrawn = 0;
  let majors = 0;
  let reversed = 0;
  const elementCounts: Record<DeckElementCode, number> = { F: 0, W: 0, A: 0, E: 0 };
  const themeCounts = new Map<ThemeId, number>();

  for (const r of items) {
    if (r.corrupted) continue;
    for (const c of r.cards ?? []) {
      const meta = deckMeta(c.cardIndex);
      if (!meta) continue; // ไพ่ที่อ่านไม่ได้ไม่นับ — ไม่เดาแทน
      cardsDrawn++;
      counts.set(c.cardIndex, (counts.get(c.cardIndex) ?? 0) + 1);
      if (meta.isMajor) majors++;
      if (c.isReversed) reversed++;
      elementCounts[meta.element]++;
      for (const t of themesOf(meta.id, c.isReversed)) themeCounts.set(t, (themeCounts.get(t) ?? 0) + 1);
    }
  }

  const expectedPerCard = cardsDrawn / DECK_N;
  const freq: CardFrequency[] = [...counts.entries()]
    .map(([cardIndex, count]) => {
      const meta = deckMeta(cardIndex)!;
      const pValue = binomialUpperTail(cardsDrawn, count, 1 / DECK_N);
      return {
        cardIndex,
        cardId: meta.id,
        nameTh: meta.nameTh,
        nameEn: meta.nameEn,
        count,
        expected: expectedPerCard,
        pValue,
        standsOut: cardsDrawn >= MIN_CARDS_FOR_STATS && count >= 3 && pValue < CARD_ALPHA,
      };
    })
    .sort((a, b) => b.count - a.count || a.cardIndex - b.cardIndex);

  // ใจก่อน ➔ หลัง
  let pairs = 0;
  let lifted = 0;
  let same = 0;
  let dropped = 0;
  let shift = 0;
  for (const r of items) {
    if (r.moodBefore && r.moodAfter) {
      pairs++;
      const d = r.moodAfter - r.moodBefore;
      shift += d;
      if (d > 0) lifted++;
      else if (d < 0) dropped++;
      else same++;
    }
  }

  const outcomes = { recorded: 0, accurate: 0, partial: 0, notHappened: 0 };
  for (const r of items) {
    if (r.outcome && r.outcome !== "PENDING") outcomes.recorded++;
    if (r.outcome === "ACCURATE") outcomes.accurate++;
    if (r.outcome === "PARTIAL") outcomes.partial++;
    if (r.outcome === "NOT_HAPPENED") outcomes.notHappened++;
  }

  return {
    readings: items.filter((r) => !r.corrupted).length,
    cardsDrawn,
    enoughData: cardsDrawn >= MIN_CARDS_FOR_STATS,
    topCards: freq.filter((f) => f.count >= 2).slice(0, 12),
    standOutCards: freq.filter((f) => f.standsOut),
    major: ratio("major", majors, cardsDrawn, 22 / DECK_N),
    reversed: ratio("reversed", reversed, cardsDrawn, EXPECTED_REVERSAL_RATE),
    elements: {
      F: ratio("F", elementCounts.F, cardsDrawn, ELEMENT_DECK_SHARE.F),
      W: ratio("W", elementCounts.W, cardsDrawn, ELEMENT_DECK_SHARE.W),
      A: ratio("A", elementCounts.A, cardsDrawn, ELEMENT_DECK_SHARE.A),
      E: ratio("E", elementCounts.E, cardsDrawn, ELEMENT_DECK_SHARE.E),
    },
    themes: THEME_IDS.map((t) => ({ ...ratio(t, themeCounts.get(t) ?? 0, cardsDrawn, THEME_EXPECTED[t]), theme: t }))
      .filter((t) => t.count > 0)
      .sort((a, b) => b.actual - b.expected - (a.actual - a.expected)),
    mood: { pairs, lifted, same, dropped, avgShift: pairs > 0 ? shift / pairs : 0 },
    outcomes,
  };
}
