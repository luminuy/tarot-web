import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDB } from "@/lib/platform/db";

export const runtime = "nodejs";

const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  category: z.enum(["accuracy", "feature_request", "bug", "general"]).default("general"),
  comment: z.string().trim().max(1000).optional(),
  readingId: z.string().max(100).optional(),
  personaId: z.string().max(50).optional(),
  pageUrl: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json().catch(() => null);
    if (!raw) {
      return NextResponse.json(
        { error: "รูปแบบข้อมูลไม่ถูกต้อง กรุณาส่งข้อมูล JSON" },
        { status: 400 }
      );
    }

    const parsed = feedbackSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้องตามเกณฑ์", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    if (!data.rating && (!data.comment || data.comment.trim() === "")) {
      return NextResponse.json(
        { error: "กรุณาระบุคะแนนหรือพิมพ์ข้อความอย่างน้อย 1 รายการ" },
        { status: 400 }
      );
    }

    const feedbackId = crypto.randomUUID();
    const now = Date.now();
    const userAgent = req.headers.get("user-agent")?.slice(0, 255) || "unknown";

    const db = await getDB();
    if (db) {
      await db
        .prepare(`
          INSERT INTO user_feedback (
            id, rating, category, comment, reading_id, persona_id, page_url, user_agent, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          feedbackId,
          data.rating ?? null,
          data.category,
          data.comment || null,
          data.readingId || null,
          data.personaId || null,
          data.pageUrl || null,
          userAgent,
          now
        )
        .run();
    }

    return NextResponse.json({
      success: true,
      id: feedbackId,
      message: "ขอบคุณสำหรับข้อเสนอแนะ ทีมงานได้รับข้อมูลเรียบร้อยแล้ว",
    });
  } catch (error: any) {
    console.error("[API /api/feedback] เกิดข้อผิดพลาด:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ ไม่สามารถบันทึกข้อเสนอแนะได้" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const db = await getDB();
    if (!db) {
      return NextResponse.json({ success: true, count: 0, items: [] });
    }

    const rows = await db
      .prepare(`
        SELECT id, rating, category, comment, reading_id, persona_id, page_url, created_at
        FROM user_feedback
        ORDER BY created_at DESC
        LIMIT 50
      `)
      .all<any>();

    return NextResponse.json({
      success: true,
      count: rows.results.length,
      items: rows.results,
    });
  } catch (error: any) {
    console.error("[API /api/feedback GET] เกิดข้อผิดพลาด:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลฟีดแบค" },
      { status: 500 }
    );
  }
}
