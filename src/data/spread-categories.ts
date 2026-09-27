import { PUBLIC_SPREADS, type Spread } from "./spreads";

/**
 * หมวดหมู่ของแถวผังหน้าแรก (`SpreadCardSelector` โหมด featured)
 *
 * กติกา:
 * - หมวดตามเรื่อง (quick · love · career · time · life) แบ่งผังสาธารณะ **ครบทุกผัง ผังละหมวดเดียว**
 *   ไม่มีผังตกหล่น ไม่มีผังซ้ำ — แท็บ "ผังทั้งหมด" คือหมวดตามเรื่องต่อกันตามลำดับนี้
 * - ในหมวดเรียงจากไพ่น้อยไปมาก (เปิดง่ายก่อน เจาะลึกทีหลัง) · ไพ่เท่ากันคงลำดับเดิมใน `SPREADS`
 * - หมวด "ยอดนิยมแนะนำ" คัดมือ ซ้ำกับหมวดอื่นได้ และคงลำดับตามที่เขียน (ผังที่คนเลือกบ่อยขึ้นก่อน)
 * - จำนวนในชิปนับจากตารางนี้เสมอ ห้ามเขียนเลขตายตัว (ของเดิมเขียน 5 ทั้งที่มี 6)
 */
export type SpreadCategoryId = "popular" | "quick" | "love" | "career" | "time" | "life" | "all";

export const POPULAR_SPREAD_IDS = ["three-card", "yes-no", "love", "daily", "career", "celtic-cross"];

/** หมวดตามเรื่อง — ลำดับ key = ลำดับแท็บ = ลำดับในแท็บ "ผังทั้งหมด" */
export const TOPIC_SPREAD_IDS: Record<Exclude<SpreadCategoryId, "popular" | "all">, string[]> = {
  quick: ["daily", "quick", "yes-no", "three-card", "situation-solution", "decision"],
  love: ["how-they-feel", "ex-reconciliation", "love", "soulmate", "love-six"],
  career: ["money", "luck", "inner-potential", "study", "career", "career-switch"],
  time: ["monthly", "weekly", "monthly-ten", "year-ahead"],
  life: ["mind-body-spirit", "family", "chakra", "celtic-cross", "twelve-houses"],
};

const byCardCount = (list: Spread[]): Spread[] =>
  list
    .map((s, i) => ({ s, i }))
    .sort((a, b) => a.s.positions.length - b.s.positions.length || a.i - b.i)
    .map(({ s }) => s);

const pick = (ids: string[]): Spread[] =>
  PUBLIC_SPREADS.filter((s) => ids.includes(s.id));

const topicLists = Object.fromEntries(
  Object.entries(TOPIC_SPREAD_IDS).map(([id, ids]) => [id, byCardCount(pick(ids))])
) as Record<keyof typeof TOPIC_SPREAD_IDS, Spread[]>;

/** รายชื่อผังของแต่ละแท็บ เรียงพร้อมใช้ */
export const SPREADS_BY_CATEGORY: Record<SpreadCategoryId, Spread[]> = {
  popular: POPULAR_SPREAD_IDS.map((id) => PUBLIC_SPREADS.find((s) => s.id === id)).filter(
    (s): s is Spread => Boolean(s)
  ),
  ...topicLists,
  all: Object.values(topicLists).flat(),
};
