import { NextResponse } from "next/server";
import { z } from "zod";

import { cardByIndex, DECK_SIZE } from "@/data/cards";
import { getSpread } from "@/data/spreads";
import { drawCards, normalizeClientSeed } from "@/lib/tarot/shuffle";
import { getReading, updateReading } from "@/server/store";

export const runtime = "nodejs";

const BodySchema = z.object({
  /** เก็บจากการขยับจริงของผู้ใช้ตอนสับไพ่ เพื่อให้ผู้ใช้มีส่วนกำหนดผล */
  clientSeed: z.string().max(4096).optional(),
  /** ตำแหน่งไพ่ในพัดสำรับที่ผู้ใช้แตะเลือกด้วยตนเอง */
  pickedIndices: z.array(z.number().int().min(0).max(DECK_SIZE - 1)).optional(),
});

/**
 * ขั้นที่ 2 — สับและจั่วไพ่ (หรือนำไพ่ที่ผู้ใช้เลือกมาเรียงตามตำแหน่ง)
 *
 * ไพ่ถูกกำหนดที่นี่ ครั้งเดียว และเปลี่ยนไม่ได้อีก
 * ถ้ามีคนเรียกซ้ำ จะได้ผลเดิมเสมอ เพราะ seed ถูกล็อกไว้แล้ว
 * (กันคนกดรีเฟรชเพื่อ "สุ่มใหม่จนกว่าจะได้ไพ่ที่ชอบ")
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = getReading(id);

  if (!record) {
    return NextResponse.json({ error: "การเปิดไพ่นี้หมดอายุแล้ว เริ่มใหม่อีกครั้งนะ" }, { status: 404 });
  }

  const spread = getSpread(record.spreadId);
  if (!spread) {
    return NextResponse.json({ error: "ไม่พบรูปแบบการวางไพ่นี้" }, { status: 404 });
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => ({})));
  const clientSeed = record.clientSeed ?? normalizeClientSeed(parsed.success ? parsed.data.clientSeed : undefined);
  const pickedIndices = parsed.success ? parsed.data.pickedIndices : undefined;

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

  updateReading(id, { drawn, clientSeed });

  return NextResponse.json({
    clientSeed,
    drawn,
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
