import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getQualityStats } from "@/lib/ai/quality.repo";

export const runtime = "nodejs";

/**
 * 📊 ดึงสถิติคุณภาพและการตอบสนองของ AI (แอดมินเท่านั้น - AI_INTELLIGENCE_PLAN W1.1)
 * รายงาน:
 * - อัตราความแม่นยำ (Accurate Rate) จากผลลัพธ์จริงที่ผู้ใช้บันทึก
 * - เวลาหน่วงเฉลี่ย (Average Latency)
 * - อัตราการ Failover
 * - สถิติแยกตาม Prompt Version, Provider (Groq / Gemini) และ Persona
 */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const stats = await getQualityStats(1000);
    return NextResponse.json(stats);
  } catch (err) {
    console.error("[admin/quality] Failed to fetch stats:", err);
    return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลสถิติคุณภาพ AI ได้" }, { status: 500 });
  }
}
