import { apiFail, apiOk } from "@/lib/api/envelope";
import { createCommitment, drawCards, normalizeClientSeed, verifyCommitment } from "@/lib/tarot/shuffle";
import { readJson, studioGate } from "@/lib/studio/gate";
import { DrawSchema, ID, spreadOfReading } from "@/lib/studio/schemas";
import { getReading, getReadingSecrets, setReadingCards, setReadingCommitment, type StudioCard } from "@/lib/studio/studio.repo";
import { readingView } from "@/lib/studio/view";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/marketplace/studio/readings/[id]/draw — ไพ่ของคำอ่านนี้ มาได้ 2 ทาง (ครั้งเดียว · จั่วแล้วล็อก)
 *  • `fair`   — สุ่มแบบ Provably Fair: คำมั่นถูกตรึงตั้งแต่สร้างคำอ่าน + เมล็ดจากหมอ ➔ ลูกค้าตรวจย้อนหลังได้
 *  • `manual` — กรอกจากสำรับจริงของหมอ ➔ หน้าลูกค้าติดป้าย "ไพ่จากสำรับของหมอ — ไม่ผ่านการยืนยัน" ตรง ๆ
 * ห้ามจั่วใหม่ (กันสุ่มซ้ำจนได้ไพ่ที่อยากได้) — อยากเปลี่ยนต้องสร้างคำอ่านใหม่
 */
export async function POST(request: Request, { params }: Ctx) {
  const gate = await studioGate(request);
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const parsed = DrawSchema.safeParse(await readJson(request));
  if (!ID.reading.test(id) || !parsed.success) return apiFail("ข้อมูลไม่ถูกต้อง", 400);
  const reading = await getReading(gate.readerId, id);
  if (!reading) return apiFail("ไม่พบคำอ่าน", 404);
  if (reading.cards.length) return apiFail("คำอ่านนี้มีไพ่แล้ว จั่วซ้ำไม่ได้ — สร้างคำอ่านใหม่ถ้าต้องการเปิดใหม่", 409, "already_drawn");
  const spread = spreadOfReading(reading);
  if (!spread) return apiFail("ข้อมูลผังของคำอ่านนี้เสียหาย กรุณาโหลดใหม่อีกครั้ง", 409, "spread_missing");
  const count = spread.positions.length;

  let cards: StudioCard[];
  let clientSeed: string | null = null;
  if (parsed.data.mode === "fair") {
    let secrets = await getReadingSecrets(gate.readerId, id);
    if (!secrets?.serverSeed || !secrets.commitment) {
      // คำอ่านเก่าที่ยังไม่มีคำมั่น — ตรึงตอนนี้ (ก่อนใช้เมล็ดของหมอ จึงยังยุติธรรม)
      const c = createCommitment();
      await setReadingCommitment(gate.readerId, id, c.serverSeed, c.commitment);
      secrets = await getReadingSecrets(gate.readerId, id);
    }
    if (!secrets?.serverSeed || !secrets.commitment || !verifyCommitment(secrets.serverSeed, secrets.commitment)) {
      return apiFail("ตรวจคำมั่นการสุ่มไม่ผ่าน กรุณาโหลดใหม่อีกครั้ง", 500, "commitment");
    }
    clientSeed = normalizeClientSeed(parsed.data.clientSeed);
    cards = drawCards({ serverSeed: secrets.serverSeed, clientSeed, count });
  } else {
    const picked = parsed.data.cards;
    if (picked.length !== count) return apiFail(`ผังนี้ใช้ไพ่ ${count} ใบ`, 400, "card_count");
    if (new Set(picked.map((c) => c.cardIndex)).size !== picked.length) return apiFail("มีไพ่ซ้ำกัน", 400, "duplicate");
    cards = picked.map((c, order) => ({ order, cardIndex: c.cardIndex, isReversed: c.isReversed }));
  }

  if (!(await setReadingCards(gate.readerId, id, parsed.data.mode, cards, clientSeed))) {
    return apiFail("คำอ่านนี้มีไพ่แล้ว", 409, "already_drawn");
  }
  const after = await getReading(gate.readerId, id);
  return apiOk({ reading: after ? readingView(after) : null });
}
