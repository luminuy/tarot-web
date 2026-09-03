import { NextResponse } from "next/server";

import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { relatedTo, semanticSearch, type SearchType } from "@/lib/search/vectorize";

export const runtime = "nodejs";

const NO_STORE_ON_ERR = { "Cache-Control": "no-store" };
const CACHE_OK = { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" };

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

  try {
    let results;
    if (like) {
      results = await relatedTo(like, { topK, type });
    } else if (q.length >= 2) {
      results = await semanticSearch(q, { topK, type });
    } else {
      return NextResponse.json({ results: [] }, { headers: NO_STORE_ON_ERR });
    }
    return NextResponse.json({ results }, { headers: CACHE_OK });
  } catch (err) {
    console.error("[search] ล้มเหลว:", err);
    return NextResponse.json({ results: [] }, { headers: NO_STORE_ON_ERR });
  }
}
