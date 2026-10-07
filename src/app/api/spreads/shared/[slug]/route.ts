import { NextResponse } from "next/server";
import { getSharedCustomSpread } from "@/lib/tarot/custom-spread.repo";
import { checkRateLimit, createRateLimitResponse, getClientIdentifier } from "@/lib/utils/rate-limit";

export const runtime = "nodejs";

/**
 * ✦ GET /api/spreads/shared/:slug — โครงผังที่เจ้าของเปิดลิงก์แบ่งปันไว้
 * คืนแค่ชื่อ · แม่แบบ · ตำแหน่ง — ไม่มีเจ้าของ ไม่มีสถิติ ไม่มีคำถาม/ไพ่/คำอ่านใด ๆ
 * slug สุ่ม 48 บิต + เพดานถี่ต่อ IP กันไล่เดา · ปิดลิงก์แล้วต้องหายทันที จึงแคชสั้น
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[0-9a-f]{12}$/.test(slug)) return NextResponse.json({ error: "ไม่พบผังนี้" }, { status: 404 });
  const gate = checkRateLimit(`shared_spread:${getClientIdentifier(request)}`, { maxRequests: 30, windowSeconds: 60 });
  if (!gate.allowed) return createRateLimitResponse(gate.retryAfterSeconds, "เรียกถี่เกินไป กรุณารอสักครู่");
  const spread = await getSharedCustomSpread(slug);
  if (!spread) return NextResponse.json({ error: "ลิงก์นี้ถูกปิดแล้วหรือไม่มีอยู่" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ spread }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } });
}
