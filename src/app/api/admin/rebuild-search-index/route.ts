import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { buildSearchCorpus, rebuildSearchIndex } from "@/lib/search/vectorize";

export const runtime = "nodejs";

/**
 * GET  /api/admin/rebuild-search-index — ดูจำนวน doc ที่จะ index (ไม่แตะ Vectorize)
 * POST /api/admin/rebuild-search-index — embed ทั้ง corpus แล้ว upsert เข้า Vectorize
 *
 * เจ้าของโปรเจกต์รันครั้งเดียวหลัง deploy · รันซ้ำได้ (upsert = idempotent ต่อ id)
 * ถ้าเพิ่มไพ่/บทความหรือแก้ความหมาย → รันใหม่
 */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const corpus = buildSearchCorpus();
  return NextResponse.json({
    total: corpus.length,
    cards: corpus.filter((d) => d.type === "card").length,
    articles: corpus.filter((d) => d.type === "article").length,
  });
}

export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const report = await rebuildSearchIndex();
  return NextResponse.json(report, { status: report.ok ? 200 : 502 });
}
