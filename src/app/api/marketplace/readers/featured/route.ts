import { NextResponse } from "next/server";

import { getNextAvailableSlots } from "@/lib/marketplace/booking.repo";
import { readerPriceThb } from "@/lib/marketplace/offer";
import { listLiveReaderIds } from "@/lib/marketplace/queue.repo";
import { listPublicApprovedReaders, type PublicReaderProfile } from "@/lib/marketplace/readers.repo";
import { withEdgeCache } from "@/lib/platform/edge-cache";

export const runtime = "nodejs";

/** โชว์ในหน้าแรกกี่คน (แผน UI_2_0 หัวข้อ 6.6: แม่หมอจริง 1–2 คน) */
const FEATURED_MAX = 2;

/**
 * GET /api/marketplace/readers/featured — แม่หมอตัวจริงที่ "ว่างเร็วที่สุด" สำหรับกล่องในหน้าแรก UI 2.0
 * ---------------------------------------------------------------------------
 * เจ้าของเคาะ (2026-10-12 · คำถามเปิดข้อ 1 ของแผน UI_2_0): เรียงตามว่างเร็วที่สุด
 *   1. เปิดคิวสดอยู่ตอนนี้ก่อน · 2. เวลานัดว่างใกล้สุดก่อน (ภายใน 14 วันตามตารางของแม่หมอ)
 * แม่หมอที่ไม่เปิดคิวสดและไม่มีเวลาว่างเลย = ไม่ส่ง · ไม่มีใครว่าง = `readers: []` หน้าแรกเหลือแค่ลิงก์
 *
 * ⚠️ ข้อมูลสาธารณะเท่านั้น (ชื่อ · รูป · ความถนัด · ราคา · เวลาว่าง) — ห้ามส่งอีเมล/LINE/กุญแจแผงแม่หมอ
 * ⚠️ ห้ามมีชื่อ/ราคาสมมุติ — อ่านไม่ได้ = 503 แล้วหน้าแรกเหลือแค่ลิงก์
 * แคชที่ขอบ 2 นาทีผ่าน Cache API (`withEdgeCache` · A9-02 · คำตอบเหมือนกันทุกคน)
 * หน้าแรกยิงเส้นนี้ก็ต่อเมื่อเลื่อนมาใกล้กล่องนี้
 *
 * จำนวนคำสั่ง D1 คงที่ไม่โตตามจำนวนแม่หมอ (A9-03): คนที่เปิดคิวสดได้ที่ก่อนโดยไม่ต้องคำนวณเวลานัด
 * (หน้าแรกโชว์ป้าย "เปิดคิวสด" แทนเวลา จึงส่ง `nextSlot: null`) · ที่เหลือคำนวณเวลาว่างแบบรวมชุดเดียว
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  return withEdgeCache(request, buildFeaturedResponse, { key: `${url.origin}${url.pathname}` });
}

type FeaturedRow = { reader: PublicReaderProfile; isLive: boolean; nextSlot: number | null };

async function buildFeaturedResponse(): Promise<Response> {
  try {
    const nowMs = Date.now();
    const [readers, live] = await Promise.all([listPublicApprovedReaders(), listLiveReaderIds(nowMs)]);
    const rows: FeaturedRow[] = readers
      .filter((reader) => live.has(reader.id))
      .slice(0, FEATURED_MAX)
      .map((reader) => ({ reader, isLive: true, nextSlot: null }));
    if (rows.length < FEATURED_MAX) {
      const others = readers.filter((reader) => !live.has(reader.id));
      const nextSlots = await getNextAvailableSlots(others.map((reader) => reader.id), nowMs);
      const soonest = others
        .map((reader) => ({ reader, isLive: false, nextSlot: nextSlots.get(reader.id) ?? null }))
        .filter((r): r is FeaturedRow & { nextSlot: number } => r.nextSlot !== null)
        .sort((a, b) => a.nextSlot - b.nextSlot);
      rows.push(...soonest.slice(0, FEATURED_MAX - rows.length));
    }
    const featured = rows.map(({ reader, isLive, nextSlot }) => ({
      id: reader.id,
      name: reader.displayName,
      avatarUrl: reader.avatarUrl,
      specialties: reader.specialties.slice(0, 3),
      priceThb: readerPriceThb(reader),
      live: isLive,
      nextSlot,
    }));
    return NextResponse.json(
      { readers: featured },
      {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=120, stale-while-revalidate=300",
          "CDN-Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
          "Cloudflare-CDN-Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        },
      },
    );
  } catch (err) {
    console.error("[featured readers]", err);
    return NextResponse.json({ readers: [] }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
