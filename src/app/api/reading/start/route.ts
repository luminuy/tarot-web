import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getSpread } from "@/data/spreads";
import { checkQuestion } from "@/lib/safety/guardrails";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { createCommitment } from "@/lib/tarot/shuffle";
import { checkRateLimit, clientKeyFromRequest, saveReading, persistReading } from "@/server/store";
import { recordEvents } from "@/lib/stats/record";

export const runtime = "nodejs";

const BodySchema = z.object({
  spreadId: z.string().min(1),
  question: z.string().max(500).default(""),
  personaId: z.string().default("warm"),
  nickname: z.string().max(40).optional(),
  category: z.enum(["general", "love", "work", "money", "self"]).optional(),
  intake: z
    .object({
      situation: z.string().max(500).optional(),
      feeling: z.string().max(300).optional(),
      hoped: z.string().max(300).optional(),
    })
    .default({}),
});

/**
 * ขั้นที่ 1 ของการเปิดไพ่ — ตรวจคำถามและประกาศคำมั่นเรื่องความสุ่ม
 *
 * สำคัญ: commitment ต้องถูกสร้างและส่งให้ผู้ใช้ "ก่อน" ที่ผู้ใช้จะสับไพ่
 * นั่นคือสิ่งที่ทำให้พิสูจน์ได้ว่าเราไม่ได้เลือกไพ่หลังจากเห็นคำถามแล้ว
 */
export async function POST(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึง API จากภายนอก (Unauthorized Origin)" }, { status: 403 });
  }

  const { isPrivilegedTestRequest } = await import("@/lib/security/privileged");
  const privileged = await isPrivilegedTestRequest(request);

  if (!privileged) {
    const limit = checkRateLimit(`start:${clientKeyFromRequest(request)}`, 20, 60 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "วันนี้เปิดไพ่ถี่ไปหน่อยแล้วนะ พักสักครู่แล้วค่อยกลับมา", retryAfter: limit.retryAfterSeconds },
        { status: 429 },
      );
    }
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลที่ส่งมาไม่ถูกต้อง" }, { status: 400 });
  }

  const { spreadId, question, personaId, nickname, category, intake } = parsed.data;
  const spread = getSpread(spreadId);
  if (!spread) {
    return NextResponse.json({ error: "ไม่พบรูปแบบการวางไพ่นี้" }, { status: 404 });
  }

  // ตรวจความปลอดภัยของคำถามก่อนทำอย่างอื่นทั้งหมด (รวมทุกฟิลด์ที่ผู้ใช้กรอก: P0-5 fix)
  const textToScan = [
    question,
    intake.situation,
    intake.feeling,
    intake.hoped,
    nickname,
  ]
    .filter(Boolean)
    .join(" ");

  const verdict = checkQuestion(textToScan);
  if (verdict.block) {
    recordEvents(["reading_blocked", `safety_flag:${verdict.flag}`]);
    return NextResponse.json({ blocked: true, message: verdict.message }, { status: 200 });
  }

  const { serverSeed, commitment } = createCommitment();
  const id = randomUUID();

  const record: import("@/server/store").ReadingRecord = {
    id,
    status: "DRAWING",
    spreadId,
    category: category ?? spread.defaultCategory,
    personaId,
    question: question.trim(),
    intake,
    nickname,
    safetyFlag: verdict.flag,
    safetyGuard: verdict.promptGuard,
    commitment,
    serverSeed,
    createdAt: Date.now(),
  };

  saveReading(record);
  await persistReading(record);

  recordEvents([
    "reading_started",
    `spread:${spreadId}`,
    `persona:${personaId}`,
    `category:${record.category}`,
    ...(verdict.flag !== "none" ? [`safety_flag:${verdict.flag}`] : []),
  ]);

  const { signReadingSessionToken } = await import("@/lib/security/session-token");
  const sessionToken = signReadingSessionToken(record);

  return NextResponse.json({
    id,
    readingId: id,
    commitment,
    sessionToken,
    spread: {
      id: spread.id,
      nameTh: spread.nameTh,
      positions: spread.positions,
    },
  });
}
