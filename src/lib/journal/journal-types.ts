/**
 * ✦ ชนิดข้อมูลและเพดานของสมุดดวง v2 ที่ใช้ร่วมกันทั้งฝั่งเบราว์เซอร์และเซิร์ฟเวอร์
 * ---------------------------------------------------------------------------
 * ไฟล์นี้ห้าม import อะไรที่หนัก (สำรับ · zod · ฐานข้อมูล) — ถูกดึงเข้า island ของ /journal และ /daily
 * สคีมาตรวจข้อมูลจริงอยู่ที่ `journal.schema.ts` และอ่านเพดานจากที่นี่ ตัวเลขจึงตรงกันสองฝั่งเสมอ
 */

/** แท็กส่วนตัวต่อบันทึก (แผน 1.3) — หมวดเดิมเป็นแท็กอัตโนมัติอยู่แล้ว ไม่นับรวม */
export const MAX_TAGS_PER_ENTRY = 5;
export const MAX_TAG_LENGTH = 24;
/** บรรทัดเดียวของพิธีเช้า/เย็น — ตั้งใจให้สั้น (≤ 1 นาที) */
export const MAX_RITUAL_NOTE_LENGTH = 200;

/** ชิป "วันนี้อยากใส่ใจเรื่องอะไร" ของพิธีเช้า (แผน 1.9) */
export const RITUAL_FOCUS_IDS = ["work", "heart", "people", "money", "self"] as const;
export type RitualFocus = (typeof RITUAL_FOCUS_IDS)[number];

export const RITUAL_FOCUS_LABEL: Record<RitualFocus, { th: string; en: string }> = {
  work: { th: "งาน", en: "Work" },
  heart: { th: "ใจ", en: "Heart" },
  people: { th: "คน", en: "People" },
  money: { th: "เงิน", en: "Money" },
  self: { th: "ตัวเอง", en: "Myself" },
};

export type RitualKind = "morning" | "evening";

/** รายละเอียดพิธีประจำวันที่ผูกกับบันทึกพิธีเช้า — ข้อความผู้ใช้ทั้งหมด **ไม่เข้า prompt** */
export interface JournalRitual {
  focus?: RitualFocus;
  /** บรรทัดเดียวตอนเช้า (ไม่บังคับ) */
  morningNote?: string;
  /** บรรทัดเดียวตอนเย็น "วันนี้เกิดอะไรขึ้น" (ไม่บังคับ) */
  eveningNote?: string;
  /** เวลาที่ทำรอบเย็น ISO — มีค่า = เช็กอินรอบเย็นแล้ว */
  eveningAt?: string;
}

/** ตัดช่องว่างหัวท้าย รวมช่องว่างซ้ำ ตัดซ้ำแบบไม่สนตัวพิมพ์ และตัดตามเพดาน — ใช้ทั้งสองฝั่ง */
export function normalizeTags(tags: readonly string[] | undefined | null): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of tags ?? []) {
    if (typeof raw !== "string") continue;
    const tag = raw.replace(/\s+/g, " ").trim().replace(/^#+/, "");
    if (!tag || tag.length > MAX_TAG_LENGTH) continue;
    const key = tag.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
    if (out.length >= MAX_TAGS_PER_ENTRY) break;
  }
  return out;
}
