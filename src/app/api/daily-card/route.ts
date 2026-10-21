import { NextResponse } from "next/server";

import { withEdgeCache } from "@/lib/platform/edge-cache";
import { getGlobalDailyCard } from "@/lib/tarot/daily-card";
import { bangkokDayKey, bangkokNextMidnightISO } from "@/lib/time/bangkok";

export const runtime = "nodejs";

/**
 * GET /api/daily-card — ไพ่ประจำวันของทุกคน (deterministic + แคช KV)
 * `/api/*` วิ่งเข้า Worker เสมอ (run_worker_first) หัว s-maxage อย่างเดียวจึงไม่แคชที่ขอบ —
 * คำตอบเก็บใน Cache API ของ data center ผ่าน `withEdgeCache` จนถึงเที่ยงคืนเวลาไทย (A9-02)
 * คีย์แคชผูกกับวันไทย และไม่อ่าน query (`?d=` ของไคลเอนต์มีไว้ข้ามแคชเบราว์เซอร์เท่านั้น)
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  return withEdgeCache(request, buildDailyCardResponse, {
    key: `${url.origin}${url.pathname}?day=${bangkokDayKey()}`,
  });
}

async function buildDailyCardResponse(): Promise<Response> {
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
