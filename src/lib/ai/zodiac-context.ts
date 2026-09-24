import { ZODIAC_SIGNS, getZodiacSign } from "@/data/zodiac";

/**
 * ✦ ราศีของผู้ถาม ➔ บริบทใน prompt ของแม่หมอ
 * ===========================================================================
 * ผู้ใช้บอกราศีไว้ในหน้า `/cards/zodiac` (เก็บในเบราว์เซอร์ของผู้ใช้เอง) แล้วส่งมาพร้อมคำขอเปิดไพ่
 *
 * หลักสำคัญ: **เซิร์ฟเวอร์เป็นคนเทียบเองว่าไพ่ที่เปิดได้ใบไหนเป็นไพ่ประจำราศีของผู้ถาม**
 * แล้วบอกโมเดลตรง ๆ — ไม่ปล่อยให้โมเดลเดาเอง เพราะโมเดลชอบ "เห็นความเชื่อมโยง" ที่ไม่มีจริง
 * (เช่น อ้างว่าไพ่ธาตุไฟทุกใบคือไพ่ของคนราศีเมษ) ซึ่งคือการกุข้อมูลแบบเดียวกับกฎข้อ 14
 *
 * ราศีเป็นแค่บริบท — ห้ามให้โมเดลทำนายจากราศีแทนไพ่
 */

export const ZODIAC_IDS = ZODIAC_SIGNS.map((s) => s.id) as [string, ...string[]];

export interface SeekerZodiac {
  /** ราศีแบบสากล (ใช้กับไพ่ประจำช่วงวันเกิดด้วย) */
  tropical: string;
  /** ราศีแบบไทย (สุริยยาตร์) */
  thai?: string;
  /** ช่วงวันเกิด 0–2 ของราศีสากล */
  decan?: number;
}

interface PersonalCard {
  cardId: string;
  roleTh: string;
  roleEn: string;
}

/** ไพ่ประจำตัวทั้งหมดของผู้ถาม (ไม่ซ้ำใบ) — ใบแรกที่เจอได้บทบาทนั้นไป */
export function personalZodiacCards(zodiac: SeekerZodiac): PersonalCard[] {
  const out: PersonalCard[] = [];
  const push = (cardId: string, roleTh: string, roleEn: string) => {
    if (!out.some((c) => c.cardId === cardId)) out.push({ cardId, roleTh, roleEn });
  };
  const sign = getZodiacSign(zodiac.tropical);
  if (sign) {
    push(sign.majorCardId, `ไพ่ประจำ${sign.nameTh} (ราศีสากลของผู้ถาม)`, `the card of ${sign.nameEn}, the seeker's western sign`);
    push(sign.rulerCardId, `ไพ่ของ${sign.rulerTh} ดาวผู้ครอง${sign.nameTh}`, `the card of ${sign.rulerEn}, ruler of the seeker's sign`);
    const decan = zodiac.decan !== undefined ? sign.decans[zodiac.decan] : undefined;
    if (decan) push(decan.cardId, "ไพ่ประจำช่วงวันเกิดของผู้ถาม", "the seeker's birth decan card");
  }
  const thai = zodiac.thai ? getZodiacSign(zodiac.thai) : undefined;
  if (thai) {
    push(thai.majorCardId, `ไพ่ประจำ${thai.nameTh} (ราศีไทยของผู้ถาม)`, `the card of ${thai.nameEn}, the seeker's Thai sign`);
    push(thai.thai.rulerCardId, `ไพ่ของ${thai.thai.rulerTh} เจ้าเรือนราศีไทยของผู้ถาม`, `the card of ${thai.thai.rulerEn}, ruler of the seeker's Thai sign`);
  }
  return out;
}

/**
 * บล็อกบริบทราศีสำหรับ `<user_profile>` — คืน "" เมื่อไม่มีราศีหรือราศีไม่ถูกต้อง
 * (ไม่มีบล็อกนี้ = prompt เหมือนเดิมทุกตัวอักษร)
 */
export function formatZodiacForPrompt(
  zodiac: SeekerZodiac | undefined,
  drawnCards: readonly { id: string; nameTh: string; nameEn: string }[],
  lang: "th" | "en",
): string {
  if (!zodiac) return "";
  const sign = getZodiacSign(zodiac.tropical);
  if (!sign) return "";
  const thai = zodiac.thai ? getZodiacSign(zodiac.thai) : undefined;
  const isEn = lang === "en";
  const personal = personalZodiacCards(zodiac);
  const hits = drawnCards
    .map((card) => ({ card, hit: personal.find((p) => p.cardId === card.id) }))
    .filter((x): x is { card: (typeof drawnCards)[number]; hit: PersonalCard } => !!x.hit);

  if (isEn) {
    const who = `Western sign: ${sign.nameEn}${thai ? ` · Thai (sidereal) sign: ${thai.nameEn}` : ""}`;
    const hitLines = hits.length
      ? hits.map((h) => `  - The drawn card ${h.card.nameEn} is ${h.hit.roleEn}. In that card's "reading", mention this personal link once, naturally, in one sentence.`).join("\n")
      : "  - None of the drawn cards is one of the seeker's zodiac cards. Do NOT claim any card belongs to their sign.";
    return `<zodiac>
  ${who}
${hitLines}
  - Use the sign only as light personality context (at most one sentence in the whole reading besides the lines above). Never predict from the sign instead of the cards.
  </zodiac>`;
  }

  const who = `ราศีสากล: ${sign.nameTh}${thai ? ` · ราศีไทย (สุริยยาตร์): ${thai.nameTh}` : ""}`;
  const hitLines = hits.length
    ? hits.map((h) => `  - ไพ่ ${h.card.nameTh} (${h.card.nameEn}) ที่เปิดได้ คือ${h.hit.roleTh} ให้ทักเรื่องนี้ใน "reading" ของใบนั้น 1 ประโยคอย่างเป็นธรรมชาติ`).join("\n")
    : "  - ไม่มีไพ่ใบไหนเป็นไพ่ประจำราศีของผู้ถาม ห้ามอ้างว่าไพ่ใบใดเป็นไพ่ของราศีผู้ถาม";
  return `<zodiac>
  ${who}
${hitLines}
  - ใช้ราศีเป็นบริบทบุคลิกเบา ๆ เท่านั้น (นอกจากข้อข้างบน ไม่เกิน 1 ประโยคทั้งคำอ่าน) ห้ามทำนายจากราศีแทนไพ่
  </zodiac>`;
}
