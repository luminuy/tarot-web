/**
 * ✦ ตัวช่วยแสดงผลของสมุดดวง — วันที่ตามเวลาไทย · ป้ายผลจริง · คีย์วัน
 * เบาโดยตั้งใจ (ใช้ใน island ของ /journal และ /daily)
 */
import type { ReadingOutcome, SavedReadingItem } from "@/lib/utils/history";

const TZ = "Asia/Bangkok";

/** คีย์วันแบบ YYYY-MM-DD ตามเวลาไทย — ใช้จัดกลุ่มในปฏิทิน (ผู้ใช้ส่วนใหญ่อยู่ไทย และพิธีประจำวันใช้เวลาไทย) */
export function dayKeyOf(iso: string | number | Date): string {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  return parts; // en-CA = YYYY-MM-DD
}

export function formatDate(iso: string, isEnglish: boolean, withTime = false): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(isEnglish ? "en-GB" : "th-TH", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(d);
}

export function formatMonth(year: number, month: number, isEnglish: boolean): string {
  return new Intl.DateTimeFormat(isEnglish ? "en-GB" : "th-TH", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month, 1)),
  );
}

export const OUTCOME_LABEL: Record<ReadingOutcome, { th: string; en: string }> = {
  PENDING: { th: "รอดูผล", en: "Waiting" },
  ACCURATE: { th: "เกิดขึ้นจริง", en: "Happened" },
  PARTIAL: { th: "เกิดบางส่วน", en: "Partly" },
  NOT_HAPPENED: { th: "ไม่เกิด", en: "Didn't happen" },
};

export const CATEGORY_LABEL: Record<string, { th: string; en: string }> = {
  general: { th: "ภาพรวม", en: "General" },
  love: { th: "ความรัก", en: "Love" },
  work: { th: "การงาน", en: "Career" },
  money: { th: "การเงิน", en: "Money" },
  self: { th: "ตัวเอง", en: "Self" },
  daily: { th: "ประจำวัน", en: "Daily" },
};

/** ดิถีคร่าว ๆ สำหรับปฏิทิน — จันทร์ดับ/เพ็ญ (สูตรเดียวกับ `src/lib/ai/cosmic.ts` · ไม่ import ไฟล์นั้นเพื่อให้ island เบา) */
const SYNODIC = 29.53058867;
const REF_NEW_MOON = 947182440000;
export function moonMarker(dayKey: string): "new" | "full" | null {
  const noonBkk = Date.parse(`${dayKey}T12:00:00+07:00`);
  const frac = (((noonBkk - REF_NEW_MOON) / 86_400_000) % SYNODIC + SYNODIC) % SYNODIC / SYNODIC;
  const step = 1 / SYNODIC / 2; // ครึ่งวันในหน่วยรอบ — ให้ได้วันเดียวต่อเหตุการณ์
  if (frac < step || frac > 1 - step) return "new";
  if (Math.abs(frac - 0.5) < step) return "full";
  return null;
}

/** ไพ่ใบหลักของคำอ่าน (ใบแรกตามลำดับตำแหน่ง) */
export function primaryCard(r: SavedReadingItem) {
  return [...(r.cards ?? [])].sort((a, b) => a.order - b.order)[0];
}
