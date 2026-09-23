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
      Math.max(30, Math.floor((new Date(bangkokNextMidnightISO()).getTime() - Date.now()) / 1000)),
    );
    /*
     * ⚠️ ทุกชั้นแคชต้องหมดอายุ "ไม่เกินเที่ยงคืนเวลาไทย" (A2-06)
     * เดิมเบราว์เซอร์ได้ `max-age=3600` ตายตัว + `stale-while-revalidate=86400` ทุกชั้น
     * เปิดเว็บ 23:40 แล้วกลับมา 00:20 ได้ไพ่ของเมื่อวานจาก HTTP cache แล้วถูกจำเป็น "ไพ่วันนี้" ทั้งวัน
     * SWR จึงเหลือสั้น ๆ และไม่เลยเที่ยงคืน (ไพ่ของวันใหม่ต้องไม่เสิร์ฟของเก่าแม้แต่คนแรก)
     */
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
    console.error("[daily-card] ล้มเหลว:", err);
    return NextResponse.json({ error: "ยังดึงไพ่ประจำวันไม่ได้ ลองใหม่อีกครั้งนะ" }, { status: 500 });
  }
}
