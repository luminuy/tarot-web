/**
 * 🗂️ 6 หมวดของคลังผัง `/spreads` (UI 2.0 · แผน UI_2_0_SPREADS_PLAN_2026-10-13 หัวข้อ 2)
 * ===========================================================================
 *
 * แหล่งความจริงเดียวของ "ผังไหนอยู่หมวดไหน" บนหน้าคลังผัง — แทน `TAB_MEMBERS` เดิม
 * (ซึ่งพิมพ์เลขแท็บเองจนป้ายเขียน 5 แต่มีผัง 6 · และมีผัง 6 แบบไม่อยู่แท็บไหนเลย — ISSUE-059)
 *
 * ⚠️ ไฟล์นี้เป็นข้อมูลล้วน **ห้าม import `./spreads`** (แพตเทิร์นเดียวกับ `spreads-helpers.ts`)
 * ⚠️ หมวดชุดนี้ **ไม่ใช่** `SPREAD_TOPICS` (หน้า `/spreads/topic/*`) — คนละชุด ห้ามรวม
 *
 * ด่าน `scripts/qa/test-spreads.ts` บังคับว่าทุก id ใน `PUBLIC_SPREADS` อยู่ในหมวดเดียวพอดี
 * และทุกหมวดมีแถวในตารางกระจายไพ่ (`SHELF_SCATTER`) — เพิ่มผังใหม่เมื่อไรด่านบังคับให้เลือกหมวด
 */

export type ShelfKey = "quick" | "love" | "work" | "self" | "time" | "grand";

export interface SpreadShelf {
  key: ShelfKey;
  /** ลำดับสี `--ui2-note-N` / `--ui2-note-ink-N` (ไม่มีชมพู ตามคำสั่ง 2026-09-21) */
  tone: 1 | 2 | 3 | 4 | 5 | 6;
  nameTh: string;
  nameEn: string;
  /** คำอธิบายใต้หัวข้อ — `{range}` ถูกแทนด้วยช่วงจำนวนใบที่คำนวณจากผังจริง */
  leadTh: string;
  leadEn: string;
  ids: readonly string[];
  /** ผังแนะนำให้เริ่มของหมวด (กล่อง "เริ่มง่ายที่สุด" ขวาหัวข้อหมวด) — ต้องอยู่ใน `ids` (ด่าน test-spreads) */
  starter: string;
}

export const SPREAD_SHELVES: readonly SpreadShelf[] = [
  {
    key: "quick",
    tone: 4,
    nameTh: "ถามด่วน ได้คำตอบไว",
    nameEn: "Quick answers",
    leadTh: "ไพ่ {range} ใบ สำหรับคำถามเดียวที่อยากรู้ตอนนี้",
    leadEn: "{range} cards for the one question on your mind right now",
    ids: ["daily", "quick", "yes-no", "three-card", "situation-solution"],
    starter: "three-card",
  },
  {
    key: "love",
    tone: 3,
    nameTh: "ความรัก",
    nameEn: "Love",
    leadTh: "ใจเขา ใจเรา คนคุย แฟนเก่า และเนื้อคู่",
    leadEn: "Their feelings, yours, a new crush, an ex, and your soulmate",
    ids: ["how-they-feel", "love", "ex-reconciliation", "soulmate", "love-six"],
    starter: "love",
  },
  {
    key: "work",
    tone: 1,
    nameTh: "การงาน การเงิน การเรียน",
    nameEn: "Work · Money · Study",
    leadTh: "งานที่ทำอยู่ ย้ายงาน เงินไหลไปไหน และผลสอบ",
    leadEn: "Your job, a career move, where the money goes, and exam results",
    ids: ["career", "career-switch", "inner-potential", "money", "luck", "study"],
    starter: "career",
  },
  {
    key: "self",
    tone: 5,
    nameTh: "ใจ ตัวเอง และคนรอบตัว",
    nameEn: "Self & People",
    leadTh: "สมดุลกายใจ ทางแยกสองทาง และคนรอบข้าง",
    leadEn: "Body–mind balance, two-way decisions, and the people around you",
    ids: ["mind-body-spirit", "decision", "family", "chakra"],
    starter: "decision",
  },
  {
    key: "time",
    tone: 2,
    nameTh: "ดวงตามช่วงเวลา",
    nameEn: "Timing",
    leadTh: "วางแผนล่วงหน้าทั้งสัปดาห์และทั้งเดือน",
    leadEn: "Plan ahead for the week and the month",
    ids: ["weekly", "monthly", "monthly-ten"],
    starter: "weekly",
  },
  {
    key: "grand",
    tone: 6,
    nameTh: "ผังใหญ่เจาะลึก",
    nameEn: "The Grand Spreads",
    leadTh: "ไพ่ {range} ใบ เห็นภาพรวมทั้งชีวิต อ่านละเอียดที่สุด",
    leadEn: "{range} cards for the whole picture — the most detailed readings",
    ids: ["celtic-cross", "year-ahead", "twelve-houses"],
    starter: "celtic-cross",
  },
];

/** ป้าย "ยอดนิยม" บนไพ่ผัง — ผังที่คนเลือกบ่อยที่สุด (ช่วยคนที่เลือกไม่ถูก · แผน UX 2026-10-13) */
export const POPULAR_SPREAD_IDS: readonly string[] = ["three-card", "love", "celtic-cross"];

/** ตำแหน่งไพ่บนโต๊ะ: [สัดส่วนแนวนอนของ (กว้างโต๊ะ − กว้างไพ่), ระยะลง px, มุมเอียง deg] */
export type ScatterSpot = readonly [x: number, y: number, angle: number];

/**
 * การกระจายไพ่บนโต๊ะคอม/แท็บเล็ต ตามจำนวนผังในหมวด (แผนหัวข้อ 4.4)
 * ตัวเลขตกแต่งล้วน · `maxWidth` = ความกว้างโต๊ะสูงสุด (px)
 */
export const SHELF_SCATTER: Readonly<Record<number, { spots: readonly ScatterSpot[]; maxWidth: number }>> = {
  3: { maxWidth: 760, spots: [[0.14, 70, -9], [0.5, 18, 3], [0.86, 84, 10]] },
  4: { maxWidth: 900, spots: [[0.05, 84, -11], [0.35, 20, -3], [0.65, 96, 6], [0.95, 34, 11]] },
  5: {
    maxWidth: 1120,
    spots: [[0.02, 96, -12], [0.26, 26, -5], [0.5, 110, 4], [0.74, 32, -7], [0.98, 100, 11]],
  },
  6: {
    maxWidth: 1160,
    spots: [[0, 50, -12], [0.2, 150, 7], [0.4, 18, -5], [0.6, 136, 8], [0.8, 24, -8], [1, 128, 12]],
  },
};

/** ช่วงจำนวนใบในหมวด เช่น "1–3" · ผังเดียวหรือเท่ากันหมด = "10" */
export function shelfCardRange(counts: readonly number[]): string {
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  return min === max ? `${min}` : `${min}–${max}`;
}
