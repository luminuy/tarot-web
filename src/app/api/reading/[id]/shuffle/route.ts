import { NextResponse } from "next/server";
import { z } from "zod";

import { cardByIndex, DECK_SIZE } from "@/data/cards";
import { getSpread } from "@/data/spreads";
import { drawCards, normalizeClientSeed, verifyCommitment } from "@/lib/tarot/shuffle";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { getReading, updateReading, persistReading } from "@/server/store";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from "@/lib/utils/rate-limit";

export const runtime = "nodejs";

const BodySchema = z.object({
  /** เก็บจากการขยับจริงของผู้ใช้ตอนสับไพ่ เพื่อให้ผู้ใช้มีส่วนกำหนดผล */
  clientSeed: z.string().max(4096).optional(),
  /** ตำแหน่งไพ่ในพัดสำรับที่ผู้ใช้แตะเลือกด้วยตนเอง */
  pickedIndices: z.array(z.number().int().min(0).max(DECK_SIZE - 1)).max(DECK_SIZE).optional(),
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

  const { isPrivilegedTestRequest } = await import("@/lib/security/privileged");
  const privileged = await isPrivilegedTestRequest(request);

  if (!privileged) {
    const clientIp = getClientIdentifier(request);
    const limit = checkRateLimit(`shuffle:${clientIp}`, {
      maxRequests: 30,
      windowSeconds: 60,
    });
    if (!limit.allowed) {
      return createRateLimitResponse(
        limit.retryAfterSeconds,
        "ส่งคำขอเร็วเกินไป กรุณารอสักครู่",
      );
    }
  }

  const { id } = await params;
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลที่ส่งมาไม่ถูกต้อง (Invalid payload)" }, { status: 400 });
  }

  let record = getReading(id);

  // Durable KV failover recovery: if memory was lost on edge worker isolate
  if (!record) {
    const { loadReadingFromKV, saveReading } = await import("@/server/store");
    const fromKv = await loadReadingFromKV(id);
    if (fromKv) {
      record = fromKv;
      saveReading(record);
    }
  }

  // Stateless session-token fallback: last resort
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

  // Cryptographic seed integrity guard (GAP-2 Prevention)
  if (!record.serverSeed || record.serverSeed.length < 64) {
    return NextResponse.json(
      { error: "เซสชันหมดอายุระหว่างการสับไพ่ กรุณาเริ่มดูดวงใหม่", code: "SESSION_SEED_LOST" },
      { status: 410 },
    );
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

  if (!verifyCommitment(record.serverSeed, record.commitment)) {
    console.error("[PF] commitment mismatch on shuffle", { id });
    return NextResponse.json({ error: "เกิดข้อผิดพลาดด้านความสมบูรณ์ของข้อมูล กรุณาเริ่มใหม่" }, { status: 500 });
  }

  const updated = updateReading(id, { drawn, clientSeed, pickedIndices: pickedIndices ?? undefined });
  if (updated) {
    await persistReading(updated);
  }
  const { signReadingSessionToken } = await import("@/lib/security/session-token");
  const sessionToken = signReadingSessionToken(updated || { ...record, drawn, clientSeed, pickedIndices: pickedIndices ?? undefined });

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
