import { NextResponse } from "next/server";

import { getGlobalDailyCard } from "@/lib/tarot/daily-card";
import { bangkokNextMidnightISO } from "@/lib/time/bangkok";

export const runtime = "nodejs";

/**
 * GET /api/daily-card — ไพ่ประจำวันของทุกคน (deterministic + แคช KV)
 * แคชที่ Cloudflare Edge CDN จนถึงเที่ยงคืนเวลาไทย (s-maxage) เพื่อให้ขอบโลกตอบใน ~15ms ไม่ปลุก Worker
 */
export async function GET() {
  try {
    const daily = await getGlobalDailyCard();
    const secondsUntilMidnight = Math.min(
      86400,
      Math.max(300, Math.floor((new Date(bangkokNextMidnightISO()).getTime() - Date.now()) / 1000)),
    );

    return NextResponse.json(daily, {
      headers: {
        "Cache-Control": `public, max-age=3600, s-maxage=${secondsUntilMidnight}, stale-while-revalidate=86400`,
        "CDN-Cache-Control": `public, s-maxage=${secondsUntilMidnight}, stale-while-revalidate=86400`,
        "Cloudflare-CDN-Cache-Control": `public, s-maxage=${secondsUntilMidnight}, stale-while-revalidate=86400`,
      },
    });
  } catch (err) {
    console.error("[daily-card] ล้มเหลว:", err);
    return NextResponse.json({ error: "ยังดึงไพ่ประจำวันไม่ได้ ลองใหม่อีกครั้งนะ" }, { status: 500 });
  }
}
