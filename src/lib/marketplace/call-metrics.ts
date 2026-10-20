import { z } from "zod";

import type { AppAnalyticsDataset } from "@/lib/platform/cf";

/**
 * 📊 สถิติความเสถียรวิดีโอคอล ➔ Cloudflare Analytics Engine (dataset `seertarot_calls`)
 * ---------------------------------------------------------------------------
 * เจ้าของสั่ง 2026-10-19 — อยากรู้ว่าระบบต่อสายใหม่อัตโนมัติ (`call-recovery.ts`) ได้ผลจริงไหม
 *
 * ผู้ร่วมสายแต่ละฝั่งส่ง "สรุปสาย" ครั้งเดียวตอนออกจากห้อง (`action: "report"`) ➔ 1 จุดข้อมูล
 * 🔒 ไม่มีข้อมูลส่วนตัว: ไม่มีชื่อ/อีเมล/IP/รหัสลูกค้า · index = รหัสแม่หมอ (ข้อมูลภายใน) · ชนิดเครื่องแบบหยาบจาก UA
 *
 * ตำแหน่งคอลัมน์ (ห้ามสลับลำดับ — ข้อมูลเก่าใน dataset จะอ่านผิดคอลัมน์ · เพิ่มได้แค่ต่อท้าย):
 *   index1 = readerId
 *   blob1 = role · blob2 = outcome · blob3 = device
 *   double1 = firstConnectMs (-1 = ไม่เคยติด) · double2 = connectedMs · double3 = autoRestarts
 *   double4 = manualRestarts · double5 = recoveries · double6 = gaveUps · double7 = drops
 *   double8 = qualityGood · double9 = qualityFair · double10 = qualityWeak · double11 = peerSeen (0/1)
 */

const count = z.number().int().min(0).max(10_000);

export const CallReportSchema = z.object({
  firstConnectMs: z.number().int().min(-1).max(6 * 60 * 60 * 1000),
  connectedMs: z.number().int().min(0).max(6 * 60 * 60 * 1000),
  autoRestarts: count,
  manualRestarts: count,
  recoveries: count,
  gaveUps: count,
  drops: count,
  qualityGood: count,
  qualityFair: count,
  qualityWeak: count,
  peerSeen: z.boolean(),
});
export type CallReport = z.infer<typeof CallReportSchema>;

export type CallOutcome = "peer-absent" | "never-connected" | "gave-up" | "recovered" | "dropped" | "clean";

/**
 * ผลลัพธ์ของสายจากมุมฝั่งนี้
 *   peer-absent     — อีกฝั่งไม่เคยเข้าห้อง (ไม่นับเป็นปัญหาเทคนิค)
 *   never-connected — อีกฝั่งอยู่แต่ต่อไม่ติดเลย
 *   gave-up         — ต่อใหม่อัตโนมัติครบเพดานแล้วยังไม่ติด
 *   recovered       — หลุดแล้วกลับมาติดได้ทุกครั้ง
 *   dropped         — หลุดแล้วไม่ได้กลับมาติดก่อนออกจากห้อง
 *   clean           — ติดตลอด ไม่หลุดเลย
 */
export function callOutcome(r: CallReport): CallOutcome {
  if (r.firstConnectMs < 0) return r.peerSeen ? "never-connected" : "peer-absent";
  if (r.gaveUps > 0) return "gave-up";
  if (r.drops === 0) return "clean";
  return r.recoveries >= r.drops ? "recovered" : "dropped";
}

/** ชนิดเครื่องแบบหยาบ: ระบบ-เบราว์เซอร์ (แยกเบราว์เซอร์ในแอป LINE/Facebook ซึ่งคนไทยเปิดลิงก์ผ่านบ่อย) */
export function deviceFamily(ua: string | null | undefined): string {
  const s = ua ?? "";
  const os = /iPhone|iPad|iPod/i.test(s)
    ? "ios"
    : /Android/i.test(s)
      ? "android"
      : /Macintosh|Mac OS X/i.test(s)
        ? "mac"
        : /Windows/i.test(s)
          ? "windows"
          : "other";
  const browser = /\bLine\//i.test(s)
    ? "line"
    : /FBAN|FBAV|FB_IAB/i.test(s)
      ? "facebook"
      : /SamsungBrowser/i.test(s)
        ? "samsung"
        : /Edg\//i.test(s)
          ? "edge"
          : /Firefox|FxiOS/i.test(s)
            ? "firefox"
            : /Chrome|CriOS/i.test(s)
              ? "chrome"
              : /Safari/i.test(s)
                ? "safari"
                : "other";
  return `${os}-${browser}`;
}

export function toCallDataPoint(
  report: CallReport,
  ctx: { role: "customer" | "reader"; readerId: string; userAgent: string | null },
): { indexes: string[]; blobs: string[]; doubles: number[] } {
  return {
    indexes: [ctx.readerId.slice(0, 96)],
    blobs: [ctx.role, callOutcome(report), deviceFamily(ctx.userAgent)],
    doubles: [
      report.firstConnectMs,
      report.connectedMs,
      report.autoRestarts,
      report.manualRestarts,
      report.recoveries,
      report.gaveUps,
      report.drops,
      report.qualityGood,
      report.qualityFair,
      report.qualityWeak,
      report.peerSeen ? 1 : 0,
    ],
  };
}

/** บันทึกแบบไม่ขวางผู้ใช้ — ไม่มี binding / เขียนพลาด = ข้ามเงียบ ๆ (สถิติไม่ใช่เส้นทางหลัก) */
export function recordCallReport(
  dataset: AppAnalyticsDataset | null,
  report: CallReport,
  ctx: { role: "customer" | "reader"; readerId: string; userAgent: string | null },
): boolean {
  if (!dataset) return false;
  try {
    dataset.writeDataPoint(toCallDataPoint(report, ctx));
    return true;
  } catch (err) {
    console.warn("[call-metrics] เขียนสถิติไม่สำเร็จ", err);
    return false;
  }
}
