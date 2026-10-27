import { z } from "zod";

import { deviceFamily } from "@/lib/marketplace/call-metrics";
import { INP_REPORT_THRESHOLD_MS, TOKEN_PATTERN, type InpReport } from "@/lib/observability/inp-reporter";
import type { AppAnalyticsDataset } from "@/lib/platform/cf";

/**
 * 📏 INP ผู้ใช้จริง ➔ Cloudflare Analytics Engine (dataset `seertarot_rum`) — ฝั่งเซิร์ฟเวอร์
 * ---------------------------------------------------------------------------
 * ตัวเก็บฝั่งเบราว์เซอร์และเหตุผลอยู่ที่ `inp-reporter.ts` · อ่านผลด้วย `npm run cf:inp-stats`
 * 🔒 ไม่มีข้อมูลส่วนตัว: ไม่มี IP/คุกกี้/รหัสผู้ใช้ · ชนิดเครื่องแบบหยาบจาก UA · ตัวระบุ element ไม่มีข้อความบนจอ
 *
 * ตำแหน่งคอลัมน์ (ห้ามสลับลำดับ — ข้อมูลเก่าใน dataset จะอ่านผิดคอลัมน์ · เพิ่มได้แค่ต่อท้าย):
 *   index1 = route
 *   blob1 = route · blob2 = target · blob3 = event · blob4 = fx · blob5 = loaf (hit/miss/none)
 *   blob6 = loafScript · blob7 = device · blob8 = blockScript
 *   double1 = duration (INP) · double2 = inputDelay · double3 = processing · double4 = presentation
 *   double5 = styleLayout (-1 = ไม่มี) · double6 = renderMain (-1 = ไม่มี) · double7 = interactions
 *   double8 = beforeLoad (0/1) · double9 = deviceMemory (0 = ไม่รู้) · double10 = cpuCores (0 = ไม่รู้)
 *   double11 = blockRemaining (-1 = ไม่มีเฟรมขวาง) · double12 = blockStyleLayout (-1 = ไม่มี)
 */

const time = z.number().min(0).max(60_000);
const timeOrNone = z.number().min(-1).max(60_000);
/** ตัวระบุ element/สคริปต์: ตัวอักษรที่ selector ใช้เท่านั้น — กันข้อความอิสระ (และข้อมูลส่วนตัว) เข้าสถิติ */
const token = (max: number) => z.string().max(max).regex(TOKEN_PATTERN);

export const InpReportSchema = z
  .object({
    /* `%` = เส้นทางที่มีอักษรไทย (pathname ถูกเข้ารหัสแล้ว) · ไม่มี `?`/`#` = ไม่มี query/โทเคนหลุดเข้าสถิติ */
    route: z.string().max(120).regex(/^\/[\w\-./%]*$/),
    target: token(120),
    event: z.string().regex(/^[a-z]{0,24}$/),
    fx: z.enum(["full", "lite", "off", ""]),
    duration: z.number().min(INP_REPORT_THRESHOLD_MS).max(60_000),
    inputDelay: time,
    processing: time,
    presentation: time,
    loaf: z.enum(["hit", "miss", "none"]),
    styleLayout: timeOrNone,
    renderMain: timeOrNone,
    loafScript: token(80),
    interactions: z.number().int().min(1).max(100_000),
    beforeLoad: z.boolean(),
    deviceMemory: z.number().min(0).max(1024),
    cpuCores: z.number().int().min(0).max(1024),
    blockScript: token(80),
    blockRemaining: timeOrNone,
    blockStyleLayout: timeOrNone,
  })
  .strict() satisfies z.ZodType<InpReport>;

export function toInpDataPoint(
  r: InpReport,
  userAgent: string | null,
): { indexes: string[]; blobs: string[]; doubles: number[] } {
  return {
    indexes: [r.route.slice(0, 96)],
    blobs: [r.route, r.target, r.event, r.fx, r.loaf, r.loafScript, deviceFamily(userAgent), r.blockScript],
    doubles: [
      r.duration,
      r.inputDelay,
      r.processing,
      r.presentation,
      r.styleLayout,
      r.renderMain,
      r.interactions,
      r.beforeLoad ? 1 : 0,
      r.deviceMemory,
      r.cpuCores,
      r.blockRemaining,
      r.blockStyleLayout,
    ],
  };
}

/** บันทึกแบบไม่ขวางผู้ใช้ — ไม่มี binding / เขียนพลาด = ข้ามเงียบ ๆ (สถิติไม่ใช่เส้นทางหลัก) */
export function recordInpReport(dataset: AppAnalyticsDataset | null, report: InpReport, userAgent: string | null): boolean {
  if (!dataset) return false;
  try {
    dataset.writeDataPoint(toInpDataPoint(report, userAgent));
    return true;
  } catch (err) {
    console.warn("[inp-metrics] เขียนสถิติไม่สำเร็จ", err);
    return false;
  }
}
