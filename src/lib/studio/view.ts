import { DECK } from "@/data/cards";
import { spreadOfReading, spreadView } from "@/lib/studio/schemas";
import type { StudioReading } from "@/lib/studio/studio.repo";

/**
 * 👁️ รูปข้อมูลคำอ่านที่ส่งออกจาก API — ไม่มี hash ของลิงก์/รหัสผ่าน · serverSeed เปิดเฉพาะหลังจั่ว (repo จัดให้แล้ว)
 * ชื่อไพ่มาจากสำรับด้วย index · index ผิด = ตัดใบนั้นทิ้งและติดธง `cardsBroken` (ห้ามกุไพ่แทน — กฎเหล็กข้อ 14)
 */
export function readingCards(r: Pick<StudioReading, "cards">) {
  const out = r.cards
    .map((c) => {
      const card = DECK[c.cardIndex];
      return card ? { ...c, id: card.id, nameTh: card.nameTh, nameEn: card.nameEn, image: card.image } : null;
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);
  return { cards: out, broken: out.length !== r.cards.length };
}

export function readingView(r: StudioReading) {
  const spread = spreadOfReading(r);
  const { cards, broken } = readingCards(r);
  return { ...r, cards, cardsBroken: broken, spread: spread ? spreadView(spread) : null };
}

export function readingSummary(r: StudioReading) {
  const spread = spreadOfReading(r);
  return {
    id: r.id,
    clientId: r.clientId,
    title: r.title,
    spreadName: spread?.nameTh ?? null,
    cardSource: r.cardSource,
    cardCount: r.cards.length,
    status: r.status,
    shareActive: r.share.active,
    viewCount: r.share.viewCount,
    sentAt: r.sentAt,
    fromQueue: Boolean(r.sourceTicketId),
    updatedAt: r.updatedAt,
  };
}
