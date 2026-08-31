import { NextResponse } from "next/server";
import { z } from "zod";

import { cardByIndex, DECK_SIZE } from "@/data/cards";
import { getSpread } from "@/data/spreads";
import { drawCards, normalizeClientSeed } from "@/lib/tarot/shuffle";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { checkRateLimit, clientKeyFromRequest, getReading, updateReading } from "@/server/store";

export const runtime = "nodejs";

const BodySchema = z.object({
  /** เก็บจากการขยับจริงของผู้ใช้ตอนสับไพ่ เพื่อให้ผู้ใช้มีส่วนกำหนดผล */
  clientSeed: z.string().max(4096).optional(),
  /** ตำแหน่งไพ่ในพัดสำรับที่ผู้ใช้แตะเลือกด้วยตนเอง */
  pickedIndices: z.array(z.number().int().min(0).max(DECK_SIZE - 1)).optional(),
  sessionToken: z.string().optional(),
});

/**
 * ขั้นที่ 2 — สับและจั่วไพ่ (หรือนำไพ่ที่ผู้ใช้เลือกมาเรียงตามตำแหน่ง)
 *
 * ไพ่ถูกกำหนดที่นี่ ครั้งเดียว และเปลี่ยนไม่ได้อีก
 * ถ้ามีคนเรียกซ้ำ จะได้ผลเดิมเสมอ เพราะ seed ถูกล็อกไว้แล้ว
 * (กันคนกดรีเฟรชเพื่อ "สุ่มใหม่จนกว่าจะได้ไพ่ที่ชอบ")
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึง API จากภายนอก (Unauthorized Origin)" }, { status: 403 });
  }

  const limit = checkRateLimit(`shuffle:${clientKeyFromRequest(request)}`, 30, 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "ส่งคำขอเร็วเกินไป กรุณารอสักครู่", retryAfter: limit.retryAfterSeconds },
      { status: 429 },
    );
  }

  const { id } = await params;
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลที่ส่งมาไม่ถูกต้อง (Invalid payload)" }, { status: 400 });
  }

  let record = getReading(id);

  // Stateless failover recovery: if memory was lost on edge worker isolate
  if (!record) {
    const token = request.headers.get("x-reading-token") || parsed.data.sessionToken;
    if (token) {
      const { verifyReadingSessionToken } = await import("@/lib/security/session-token");
      const recovered = verifyReadingSessionToken(token);
      if (recovered && recovered.id === id) {
        record = recovered as import("@/server/store").ReadingRecord;
        const { saveReading } = await import("@/server/store");
        saveReading(record);
      }
    }
  }

  if (!record) {
    return NextResponse.json({ error: "การเปิดไพ่นี้หมดอายุแล้ว เริ่มใหม่อีกครั้งนะ" }, { status: 404 });
  }

  const spread = getSpread(record.spreadId);
  if (!spread) {
    return NextResponse.json({ error: "ไม่พบรูปแบบการวางไพ่นี้" }, { status: 404 });
  }

  // P1-3 Replay Guard: If cards are already drawn, return the existing drawn cards
  if (record.drawn && record.drawn.length > 0) {
    const { signReadingSessionToken } = await import("@/lib/security/session-token");
    const sessionToken = signReadingSessionToken(record);
    return NextResponse.json({
      clientSeed: record.clientSeed,
      drawn: record.drawn,
      sessionToken,
      cards: record.drawn.map((d) => {
        const card = cardByIndex(d.cardIndex);
        return {
          id: card.id,
          nameTh: card.nameTh,
          nameEn: card.nameEn,
          image: card.image,
          element: card.element,
          keywords: d.isReversed ? card.keywords.reversed : card.keywords.upright,
        };
      }),
    });
  }

  const clientSeed = record.clientSeed ?? normalizeClientSeed(parsed.data.clientSeed);
  const pickedIndices = parsed.data.pickedIndices;

  let drawn: import("@/lib/tarot/shuffle").DrawnCard[];
  try {
    drawn =
      pickedIndices && pickedIndices.length > 0
        ? drawCards({
            serverSeed: record.serverSeed,
            clientSeed,
            count: spread.positions.length,
            pickedIndices,
            deckSize: DECK_SIZE,
          })
        : record.drawn ??
          drawCards({
            serverSeed: record.serverSeed,
            clientSeed,
            count: spread.positions.length,
            pickedIndices,
            deckSize: DECK_SIZE,
          });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "การเลือกไพ่ไม่ถูกต้อง";
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }

  const updated = updateReading(id, { drawn, clientSeed });
  const { signReadingSessionToken } = await import("@/lib/security/session-token");
  const sessionToken = signReadingSessionToken(updated || { ...record, drawn, clientSeed });

  return NextResponse.json({
    clientSeed,
    drawn,
    sessionToken,
    cards: drawn.map((d) => {
      const card = cardByIndex(d.cardIndex);
      return {
        id: card.id,
        nameTh: card.nameTh,
        nameEn: card.nameEn,
        image: card.image,
        element: card.element,
        keywords: d.isReversed ? card.keywords.reversed : card.keywords.upright,
      };
    }),
  });
}
