import { NextResponse } from "next/server";
import { createHash } from "node:crypto";

import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { relatedTo, semanticSearch, type SearchType } from "@/lib/search/vectorize";
import { getCachedSearch, setCachedSearch } from "@/lib/search/search-cache";
import { bumpCounter, readCounter } from "@/lib/platform/kv-counter";
import { getClientIdentifier } from "@/lib/utils/rate-limit";
import { utcDay } from "@/lib/stats/record";

export const runtime = "nodejs";

const NO_STORE_ON_ERR = { "Cache-Control": "no-store" };
const CACHE_OK = { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" };

const SEARCH_DAILY_CAP = Number(process.env.SEARCH_DAILY_CAP) || 1500;
const PER_IP_DAILY = 40;

function hashIpForDay(ip: string, day: string): string {
  return createHash("sha256").update(`${ip}:${day}`).digest("hex").slice(0, 16);
}

/**
 * GET /api/search
 *   ?q=<ข้อความ>            — ค้นหาเชิงความหมาย
 *   ?like=card:major-00     — ไพ่/บทความที่ใกล้เคียงกับ item นี้
 *   &type=card|article      — กรองชนิดผลลัพธ์ (ไม่ใส่ = ทั้งคู่)
 *   &topK=<n>               — จำนวนผล (เพดาน 12)
 *
 * Vectorize ยังไม่พร้อม / index ว่าง → คืน { results: [] } (200) ให้ UI ซ่อนส่วนนั้น
 */
export async function GET(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึงจากภายนอก" }, { status: 403 });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const like = url.searchParams.get("like")?.trim() ?? "";
  const typeParam = url.searchParams.get("type");
  const type: SearchType | undefined =
    typeParam === "card" || typeParam === "article" ? typeParam : undefined;
  const topK = Math.min(12, Math.max(1, Number(url.searchParams.get("topK")) || 6));

  if (!like && q.length < 2) {
    return NextResponse.json({ results: [] }, { headers: NO_STORE_ON_ERR });
  }

  const cacheLookupKey = like ? `like:${like}` : q;

  try {
    // 1. ตรวจสอบ Upstash Cache ก่อนเสมอ — หากแคชมี ไม่ต้องนับโควตา IP หรือ AI
    const cached = await getCachedSearch(cacheLookupKey, type, topK);
    if (cached) {
      return NextResponse.json({ results: cached }, { headers: CACHE_OK });
    }

    // 2. เพดานรายวันของทั้งระบบ (Global Daily Cap) เพื่อปกป้องโควตา Workers AI ร่วมกับ ai-classifier
    const day = utcDay();
    const globalCapKey = `app:search:daily:${day}`;
    if ((await readCounter(globalCapKey)) >= SEARCH_DAILY_CAP) {
      return NextResponse.json({ results: [], degraded: true }, { headers: NO_STORE_ON_ERR });
    }

    // 3. จำกัดจำนวนค้นหาต่อ IP ข้าม Edge fleet (40 queries/วัน สำหรับ AI cache miss)
    const clientIp = getClientIdentifier(request);
    const ipHash = hashIpForDay(clientIp, day);
    const ipKey = `app:search:ip:${day}:${ipHash}`;
    if ((await readCounter(ipKey)) >= PER_IP_DAILY) {
      return NextResponse.json({ results: [], degraded: true }, { status: 429, headers: NO_STORE_ON_ERR });
    }

    // 4. รันการค้นหาจริง
    let results;
    if (like) {
      results = await relatedTo(like, { topK, type });
    } else {
      results = await semanticSearch(q, { topK, type });
    }

    // 5. เมื่อค้นหา AI สำเร็จ: บันทึกโควตา และเก็บลงแคช
    bumpCounter(globalCapKey, 60 * 60 * 48);
    bumpCounter(ipKey, 60 * 60 * 26);
    await setCachedSearch(cacheLookupKey, results, type, topK);

    return NextResponse.json({ results }, { headers: CACHE_OK });
  } catch (err) {
    console.error("[search] ล้มเหลว:", err);
    return NextResponse.json({ results: [], degraded: true }, { headers: NO_STORE_ON_ERR });
  }
}
