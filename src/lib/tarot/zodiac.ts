import type { MonthDay } from "@/data/zodiac";

/**
 * ✦ หาราศีและช่วง (decan) จากวันเกิด — ไม่ผูกกับข้อมูลคำอธิบายราศี
 *
 * ⚠️ ไฟล์นี้ถูกใช้ใน island ฝั่งเบราว์เซอร์ จึง **ห้าม import ค่าจาก `@/data/zodiac`**
 *    (คำอธิบาย 12 ราศีสองภาษาจะติดไปทั้งก้อน) — รับรายการราศีแบบย่อเป็นพารามิเตอร์แทน
 *    ส่วน `import type` ข้างบนหายไปตอนคอมไพล์ ไม่มีผลกับบันเดิล
 */

/** เส้นทางหน้าราศี — ประกอบจากที่เดียว (ไม่เขียน path ของหน้าราศีกระจายหลายไฟล์) */
export const ZODIAC_INDEX_PATH = "/cards/zodiac";
export function zodiacSignPath(id: string): string {
  return `${ZODIAC_INDEX_PATH}/${id}`;
}

export interface ZodiacLookupItem {
  id: string;
  decans: readonly { start: MonthDay }[];
}

export interface ZodiacLookupResult<T extends ZodiacLookupItem> {
  sign: T;
  /** 0 · 1 · 2 */
  decanIndex: number;
}

/** แปลงวันเดือนเป็นลำดับวันในปีอธิกสุรทิน (1 ม.ค. = 1 · 29 ก.พ. = 60) เพื่อเทียบลำดับ */
function ordinal({ month, day }: MonthDay): number {
  const cumulative = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
  return cumulative[month - 1] + day;
}

/** วันนี้มีจริงในปฏิทินไหม (29 ก.พ. นับว่ามี เพราะคนเกิดวันนั้นมีจริง) */
export function isValidMonthDay(month: number, day: number): boolean {
  if (!Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12 || day < 1) return false;
  const maxDays = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  return day <= maxDays;
}

/**
 * หาราศี + ช่วงจากวันเดือนเกิด
 * คืน `undefined` เมื่อวันไม่ถูกต้องหรือรายการราศีไม่ครบ (ห้ามเดาราศีให้ — กฎข้อ 14 ฉบับราศี)
 */
export function findZodiacByDate<T extends ZodiacLookupItem>(
  signs: readonly T[],
  month: number,
  day: number,
): ZodiacLookupResult<T> | undefined {
  if (!isValidMonthDay(month, day)) return undefined;
  const starts = signs
    .flatMap((sign) => sign.decans.map((decan, decanIndex) => ({ sign, decanIndex, at: ordinal(decan.start) })))
    .sort((a, b) => a.at - b.at);
  if (starts.length === 0) return undefined;

  const target = ordinal({ month, day });
  /* ช่วงสุดท้ายของปี (มังกรช่วงแรกเริ่ม 22 ธ.ค.) ต่อข้ามปีไปถึงก่อนช่วงแรกของปีถัดไป
     ➔ ถ้าไม่มีช่วงไหนเริ่มก่อนหรือตรงวันนี้ ให้วนกลับไปใช้ช่วงสุดท้ายของรายการ */
  let hit = starts[starts.length - 1];
  for (const entry of starts) {
    if (entry.at <= target) hit = entry;
    else break;
  }
  return { sign: hit.sign, decanIndex: hit.decanIndex };
}

/** วันสุดท้ายของช่วง = วันก่อนช่วงถัดไปเริ่ม (ข้ามปีได้) */
export function decanEnd(nextStart: MonthDay): MonthDay {
  if (nextStart.day > 1) return { month: nextStart.month, day: nextStart.day - 1 };
  const prevMonth = nextStart.month === 1 ? 12 : nextStart.month - 1;
  const lastDay = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][prevMonth - 1];
  /* ก.พ. ใช้ 28 เป็นวันสิ้นสุดที่แสดงผล (ปีส่วนใหญ่) — 29 ก.พ. ยังหาเจอด้วย findZodiacByDate */
  return { month: prevMonth, day: prevMonth === 2 ? 28 : lastDay };
}

const TH_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatMonthDay({ month, day }: MonthDay, isEnglish: boolean): string {
  return isEnglish ? `${EN_MONTHS[month - 1]} ${day}` : `${day} ${TH_MONTHS[month - 1]}`;
}

/** ช่วงวันของ decan ที่ `index` ใน `signs` ทั้งปี (ใช้ช่วงถัดไปของราศีถัดไปเป็นจุดสิ้นสุด) */
export function decanRanges<T extends ZodiacLookupItem>(
  signs: readonly T[],
): Map<string, { start: MonthDay; end: MonthDay }[]> {
  const flat = signs.flatMap((sign) => sign.decans.map((d, i) => ({ id: sign.id, i, start: d.start })));
  const sorted = [...flat].sort((a, b) => ordinal(a.start) - ordinal(b.start));
  const out = new Map<string, { start: MonthDay; end: MonthDay }[]>();
  sorted.forEach((entry, idx) => {
    const next = sorted[(idx + 1) % sorted.length];
    const list = out.get(entry.id) ?? [];
    list[entry.i] = { start: entry.start, end: decanEnd(next.start) };
    out.set(entry.id, list);
  });
  return out;
}
