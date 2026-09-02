import { cardById, cardByIndex } from "@/data/cards";
import type { Category, Interpretation, TarotCard, YesNo } from "@/data/cards/types";
import { getPersona, type Persona } from "@/data/personas";
import { SYSTEM_CORE_KNOWLEDGE } from "@/lib/ai/prompt";
import { KEY, kvGetJSON } from "@/lib/platform/kv-store";

/**
 * ชั้น "แก้เนื้อหาแบบ live โดยไม่ต้อง deploy" (M3)
 * ------------------------------------------------
 * เก็บ override ทั้งหมดเป็น JSON ก้อนเดียวใน KV (`app:override:content`)
 * อ่านผ่าน isolate memo cache 60 วิ แล้ว merge ทับค่า default จากไฟล์
 *
 * 🔒 override แก้ได้เฉพาะ "ข้อความ" — ห้ามแตะโครงสร้างไพ่ (id/number/arcana/suit/element/image)
 *    เพราะ cardIndex คือ load-bearing (ดู src/data/cards/index.ts) และ gate 3/6 ตรวจ DECK static
 */

export const CATEGORIES: Category[] = ["general", "love", "work", "money", "self"];
export const YESNO_VALUES: YesNo[] = ["yes", "no", "maybe"];

export interface CardOverride {
  meanings?: Partial<Record<Category, Partial<Interpretation>>>;
  keywords?: { upright?: string[]; reversed?: string[] };
  yesNo?: YesNo;
}
export interface PersonaOverride {
  voice?: string;
  tagline?: string;
  nameTh?: string;
}
export interface ContentOverrideDoc {
  systemPrompt?: string;
  personas?: Record<string, PersonaOverride>;
  cards?: Record<string, CardOverride>;
  updatedAt?: number;
  updatedBy?: string;
}

const CACHE_TTL_MS = 60_000;

/** ดึงเอกสาร override (memo cache 60 วิ) */
export async function getContentOverrides(): Promise<ContentOverrideDoc> {
  return (await kvGetJSON<ContentOverrideDoc>(KEY.contentOverride(), CACHE_TTL_MS)) ?? {};
}

function pick(overrideText: string | undefined, fallback: string): string {
  const t = overrideText?.trim();
  return t && t.length > 0 ? t : fallback;
}

export function resolveSystemCore(doc: ContentOverrideDoc): string {
  return pick(doc.systemPrompt, SYSTEM_CORE_KNOWLEDGE);
}

export function resolvePersona(doc: ContentOverrideDoc, id: string | null | undefined): Persona {
  const base = getPersona(id);
  const o = doc.personas?.[base.id];
  if (!o) return base;
  return {
    ...base,
    voice: pick(o.voice, base.voice),
    tagline: pick(o.tagline, base.tagline),
    nameTh: pick(o.nameTh, base.nameTh),
  };
}

/** merge override ลงบนไพ่ 1 ใบ — คงทุก field ยกเว้นข้อความที่อนุญาต */
export function applyCardOverride(card: TarotCard, o: CardOverride | undefined): TarotCard {
  if (!o) return card;

  const meanings: Record<Category, Interpretation> = { ...card.meanings };
  if (o.meanings) {
    for (const cat of CATEGORIES) {
      const patch = o.meanings[cat];
      if (!patch) continue;
      meanings[cat] = {
        upright: pick(patch.upright, card.meanings[cat].upright),
        reversed: pick(patch.reversed, card.meanings[cat].reversed),
      };
    }
  }

  const cleanList = (list: string[] | undefined, fallback: string[]) => {
    const filtered = (list ?? []).map((s) => s.trim()).filter(Boolean);
    return filtered.length > 0 ? filtered : fallback;
  };

  return {
    ...card,
    meanings,
    keywords: {
      upright: cleanList(o.keywords?.upright, card.keywords.upright),
      reversed: cleanList(o.keywords?.reversed, card.keywords.reversed),
    },
    yesNo: o.yesNo && YESNO_VALUES.includes(o.yesNo) ? o.yesNo : card.yesNo,
    // id / arcana / suit / number / element / astrology / numerology / image — ไม่แตะ
  };
}

export function resolveCardByIndex(doc: ContentOverrideDoc, index: number | null | undefined): TarotCard | undefined {
  const card = cardByIndex(index);
  return card ? applyCardOverride(card, doc.cards?.[card.id]) : undefined;
}

export function resolveCardById(doc: ContentOverrideDoc, id: string): TarotCard | undefined {
  const card = cardById(id);
  return card ? applyCardOverride(card, doc.cards?.[card.id]) : undefined;
}
