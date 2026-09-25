import { NextResponse } from "next/server";

import { getPublicReadingTotal } from "@/lib/stats/read";

export const runtime = "nodejs";

/**
 * GET /api/stats/public — ยอดคำทำนายที่อ่านจบแล้วทั้งหมด สำหรับตัวนับในหน้าแรก (แผนหน้าแรก ข้อ 3)
 * ---------------------------------------------------------------------------
 * ตัวเลขเดียวกันสำหรับทุกคน จึงแคชที่ขอบ 1 ชั่วโมง — ผู้ชมส่วนใหญ่ได้คำตอบจากขอบโดยไม่ปลุก Worker
 * (แบบเดียวกับ `/api/daily-card`) · หน้าแรกยิงเส้นนี้ก็ต่อเมื่อเลื่อนลงมาถึงส่วนที่แสดงตัวนับ
 *
 * ⚠️ ส่งแค่ยอดรวมเลขเดียว ห้ามเพิ่มเมตริกอื่นลงเส้นนี้ — ตัวนับที่เหลือเป็นข้อมูลภายในของแผงแอดมิน
 */
export async function GET() {
  try {
    const readings = await getPublicReadingTotal();
    return NextResponse.json(
      { readings },
      {
        headers: {
          "Cache-Control": "public, max-age=600, s-maxage=3600, stale-while-revalidate=600",
          "CDN-Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
          "Cloudflare-CDN-Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
        },
      },
    );
  } catch {
    // อ่านไม่ได้ = หน้าแรกซ่อนตัวนับ ห้ามคืนเลขเดา
    return NextResponse.json({ readings: null }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
