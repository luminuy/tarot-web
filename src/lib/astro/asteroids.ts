/**
 * ☄️ ดาวเคราะห์น้อย 4 ดวง — โหลดแบบ dynamic import เมื่อผู้ใช้เปิด "แสดงดาวเคราะห์น้อย" เท่านั้น
 * (ตารางรวม ~59 KB gzip ไม่ควรติดไปกับตัวคำนวณหลักที่ทุกคนโหลด)
 */
import { ASTEROID_START_JD_UT, ASTEROID_STEP_DAYS, CERES_DELTAS, JUNO_DELTAS, PALLAS_DELTAS, VESTA_DELTAS } from "./asteroid-tables";
import { decodeTable, type AsteroidId, type LonTable } from "./natal";

let cache: Record<AsteroidId, LonTable> | null = null;

export function asteroidTables(): Record<AsteroidId, LonTable> {
  if (!cache) {
    cache = {
      ceres: decodeTable(CERES_DELTAS, ASTEROID_START_JD_UT, ASTEROID_STEP_DAYS),
      pallas: decodeTable(PALLAS_DELTAS, ASTEROID_START_JD_UT, ASTEROID_STEP_DAYS),
      juno: decodeTable(JUNO_DELTAS, ASTEROID_START_JD_UT, ASTEROID_STEP_DAYS),
      vesta: decodeTable(VESTA_DELTAS, ASTEROID_START_JD_UT, ASTEROID_STEP_DAYS),
    };
  }
  return cache;
}
