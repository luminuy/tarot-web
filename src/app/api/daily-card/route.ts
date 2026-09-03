import { NextResponse } from "next/server";

import { getGlobalDailyCard } from "@/lib/tarot/daily-card";

export const runtime = "nodejs";

/**
 * GET /api/daily-card — ไพ่ประจำวันของทุกคน (deterministic + แคช KV)
 * cache header ให้เบราว์เซอร์/CDN เก็บได้ 5 นาที (ค่าเปลี่ยนวันละครั้งอยู่แล้ว)
 */
export async function GET() {
  try {
    const daily = await getGlobalDailyCard();
    return NextResponse.json(daily, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" },
    });
  } catch (err) {
    console.error("[daily-card] ล้มเหลว:", err);
    return NextResponse.json({ error: "ยังดึงไพ่ประจำวันไม่ได้ ลองใหม่อีกครั้งนะ" }, { status: 500 });
  }
}
