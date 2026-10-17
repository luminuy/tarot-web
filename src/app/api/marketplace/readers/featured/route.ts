import { NextResponse } from "next/server";

import { getNextAvailableSlot, getScheduleRules } from "@/lib/marketplace/booking.repo";
import { readerPriceThb } from "@/lib/marketplace/offer";
import { listLiveReaderIds } from "@/lib/marketplace/queue.repo";
import { listPublicApprovedReaders } from "@/lib/marketplace/readers.repo";

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
 * แคชที่ขอบ 2 นาที (คำตอบเหมือนกันทุกคน) — หน้าแรกยิงเส้นนี้ก็ต่อเมื่อเลื่อนมาใกล้กล่องนี้
 */
export async function GET() {
  try {
    const nowMs = Date.now();
    const [readers, live] = await Promise.all([listPublicApprovedReaders(), listLiveReaderIds(nowMs)]);
    const rows = await Promise.all(
      readers.map(async (reader) => {
        const isLive = live.has(reader.id);
        const hasSchedule = (await getScheduleRules(reader.id)).length > 0;
        const nextSlot = hasSchedule ? await getNextAvailableSlot(reader.id, nowMs) : null;
        return { reader, isLive, nextSlot };
      }),
    );
    const featured = rows
      .filter((r) => r.isLive || r.nextSlot !== null)
      .sort((a, b) => Number(b.isLive) - Number(a.isLive) || (a.nextSlot ?? Infinity) - (b.nextSlot ?? Infinity))
      .slice(0, FEATURED_MAX)
      .map(({ reader, isLive, nextSlot }) => ({
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
