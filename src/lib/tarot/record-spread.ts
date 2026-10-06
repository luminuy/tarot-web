import { getSpread } from "@/data/spreads";
import type { Spread } from "@/data/spreads-helpers";
import { buildCustomSpread, CUSTOM_SPREAD_ID, layoutPoints } from "@/lib/tarot/custom-spread";

/**
 * ✦ ผังของเซสชันเปิดไพ่ — จุดเดียวที่ทุกเส้นทาง (`/shuffle` · `/read` · `/chat` · มุมที่สอง · แชทสำรอง) ใช้หาผัง
 * ผังที่สร้างเองมาจาก `record.customSpread` ที่ตรึงไว้ตอน `/start` เท่านั้น — ไม่มี = คืน undefined
 * (ผู้เรียกต้องตอบ "โหลดใหม่" · ห้ามเดาผังแทน กฎเหล็กข้อ 14)
 */
export function resolveRecordSpread(record: {
  spreadId?: string;
  customSpread?: import("@/lib/tarot/custom-spread").CustomSpreadInput;
}): Spread | undefined {
  if (!record.spreadId) return undefined;
  if (record.spreadId !== CUSTOM_SPREAD_ID) return getSpread(record.spreadId);
  const cs = record.customSpread;
  if (!cs?.positions?.length || !layoutPoints(cs.layout, cs.positions.length)) return undefined;
  return buildCustomSpread(cs);
}
