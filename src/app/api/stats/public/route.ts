import { NextResponse } from "next/server";

import { withEdgeCache } from "@/lib/platform/edge-cache";
import { getPublicReadingTotal } from "@/lib/stats/read";

export const runtime = "nodejs";

/**
 * GET /api/stats/public — ยอดคำทำนายที่อ่านจบแล้วทั้งหมด สำหรับตัวนับในหน้าแรก (แผนหน้าแรก ข้อ 3)
 * ---------------------------------------------------------------------------
 * ตัวเลขเดียวกันสำหรับทุกคน จึงแคชที่ขอบ 1 ชั่วโมงผ่าน Cache API (`withEdgeCache` · A9-02)
 * Worker ยังถูกปลุกทุกคำขอ แต่คำขอที่เจอในแคชไม่ต้องอ่าน KV/D1 · หน้าแรกยิงเส้นนี้ก็ต่อเมื่อเลื่อนลงมาถึงตัวนับ
 *
 * ⚠️ ส่งแค่ยอดรวมเลขเดียว ห้ามเพิ่มเมตริกอื่นลงเส้นนี้ — ตัวนับที่เหลือเป็นข้อมูลภายในของแผงแอดมิน
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  return withEdgeCache(request, buildStatsResponse, { key: `${url.origin}${url.pathname}` });
}

async function buildStatsResponse(): Promise<Response> {
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
