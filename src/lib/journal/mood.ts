/**
 * ✦ "ใจตอนนี้" 5 ระดับ — แหล่งความจริงเดียวของคำ สี และค่าที่เก็บ (REFLECTION_JOURNAL_PLAN 1.3)
 * ---------------------------------------------------------------------------
 * เก็บเป็นเลข 1..5 ใน `mood_before` / `mood_after` (NULL = ผู้ใช้ข้าม — ห้ามเดาแทน)
 * หน้าจอใช้ "จุดสี + คำสั้น" ไม่ใช้อิโมจิหน้ายิ้ม/หน้าเศร้า (กฎเหล็กข้อ 2 — อนุญาตแค่ ✦ ✨)
 *
 * ⚠️ ลำดับคือความหมาย: 1 = สับสน ➔ 5 = มั่นใจ · ห้ามสลับลำดับหลังมีข้อมูลจริงแล้ว
 *    (เลขในฐานข้อมูลจะกลายเป็นความรู้สึกคนละแบบทันที)
 * ⚠️ ไฟล์นี้ต้องเบา — ถูก import ทั้งในหน้าแรก (TarotFlow) และ island ของ /journal · /daily
 */

export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export interface MoodOption {
  level: MoodLevel;
  th: string;
  en: string;
  /** สีจุด — เลือกให้ไล่จากหม่นไปสว่างและแยกได้แม้คนตาบอดสีแดงเขียว (อ่านค่าจากคำเสมอ ไม่พึ่งสีอย่างเดียว) */
  color: string;
}

export const MOOD_OPTIONS: readonly MoodOption[] = [
  { level: 1, th: "สับสน", en: "Unsure", color: "#7A6A86" },
  { level: 2, th: "กังวล", en: "Worried", color: "#B0644A" },
  { level: 3, th: "เฉย ๆ", en: "Neutral", color: "#A39A8B" },
  { level: 4, th: "มีหวัง", en: "Hopeful", color: "#C2913A" },
  { level: 5, th: "มั่นใจ", en: "Confident", color: "#4F8A5B" },
] as const;

export function isMoodLevel(v: unknown): v is MoodLevel {
  return typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 5;
}

export function moodOption(level: number | null | undefined): MoodOption | undefined {
  return isMoodLevel(level) ? MOOD_OPTIONS[level - 1] : undefined;
}

export function moodLabel(level: number | null | undefined, isEnglish: boolean): string | undefined {
  const opt = moodOption(level);
  return opt ? (isEnglish ? opt.en : opt.th) : undefined;
}
