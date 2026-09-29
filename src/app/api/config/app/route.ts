import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SEMVER = /^\d+\.\d+\.\d+$/;

function versionFromEnv(name: string): string {
  const value = process.env[name]?.trim();
  return value && SEMVER.test(value) ? value : "1.0.0";
}

/**
 * GET /api/config/app — ให้แอป iOS ถามว่าเวอร์ชันที่ติดตั้งยังใช้ได้ไหม
 * (แผน docs/plans/IOS_APP_PLAN_2026-09-29.md หัวข้อ 4.6)
 *
 * - `minVersion`: ต่ำกว่านี้แอปต้องบังคับอัปเดต — ใช้เมื่อ API เปลี่ยนแบบเข้ากันไม่ได้เท่านั้น
 * - `latestVersion`: ต่ำกว่านี้แสดงข้อความชวนอัปเดตแบบข้ามได้
 *
 * ตั้งผ่าน Worker secret/var `APP_MIN_VERSION` · `APP_LATEST_VERSION` (รูปแบบ x.y.z)
 * ค่าที่ไม่ถูกรูปแบบถือเป็น 1.0.0 = ไม่บังคับใคร · ไม่ใช่ความลับจึงแคชสั้น ๆ ได้
 */
export function GET() {
  return NextResponse.json(
    {
      minVersion: versionFromEnv("APP_MIN_VERSION"),
      latestVersion: versionFromEnv("APP_LATEST_VERSION"),
    },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}
