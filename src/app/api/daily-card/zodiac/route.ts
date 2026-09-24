import { NextResponse } from "next/server";

import { computeZodiacDaily } from "@/lib/tarot/zodiac-daily";
import { bangkokDayKey, bangkokNextMidnightISO } from "@/lib/time/bangkok";

export const runtime = "nodejs";

/**
 * GET /api/daily-card/zodiac — ไพ่รายวันของ 12 ราศี + ไพ่ประจำฤดูราศี (deterministic)
 * ใช้นโยบายแคชเดียวกับ `/api/daily-card`: ทุกชั้นหมดอายุไม่เกินเที่ยงคืนเวลาไทย (A2-06)
 * วันที่อ่านจากนาฬิกาเซิร์ฟเวอร์เท่านั้น — query string ใด ๆ มีไว้ข้ามแคชอย่างเดียว ไม่ถูกอ่าน
 */
export async function GET() {
  try {
    const daily = await computeZodiacDaily(bangkokDayKey());
    const secondsUntilMidnight = Math.min(
      86400,
      Math.max(30, Math.floor((new Date(bangkokNextMidnightISO()).getTime() - Date.now()) / 1000)),
    );
    const browserMaxAge = Math.min(3600, secondsUntilMidnight);
    const swr = Math.min(60, secondsUntilMidnight);
    return NextResponse.json(daily, {
      headers: {
        "Cache-Control": `public, max-age=${browserMaxAge}, s-maxage=${secondsUntilMidnight}, stale-while-revalidate=${swr}`,
        "CDN-Cache-Control": `public, s-maxage=${secondsUntilMidnight}, stale-while-revalidate=${swr}`,
        "Cloudflare-CDN-Cache-Control": `public, s-maxage=${secondsUntilMidnight}, stale-while-revalidate=${swr}`,
      },
    });
  } catch (err) {
    console.error("[daily-card/zodiac] ล้มเหลว:", err);
    return NextResponse.json({ error: "ยังดึงดวงรายวันไม่ได้ ลองใหม่อีกครั้งนะ" }, { status: 500 });
  }
}
