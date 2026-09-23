import { useEffect, useState } from "react";
import type { TarotCard } from "./types";

/**
 * 🃏 ตัวหาไพ่จากเลข (cardIndex) ฝั่งเบราว์เซอร์ — โหลดตามภาษาของหน้า (A8-02)
 * ---------------------------------------------------------------------------
 * `@/data/cards` ผสมคำทำนายอังกฤษ (meanings-en 44 KB + keywords-en 5 KB gzip) เข้าไพ่ทุกใบตั้งแต่ตอนสร้าง
 * ผู้ใช้ไทยที่เปิดไพ่บนหน้าแรกจึงโหลดสำรับรวม ~133 KB ทั้งที่ใช้แค่ ~83 KB
 *   • ไทย   ➔ `deck-th` อย่างเดียว
 *   • อังกฤษ ➔ `deck-th` + `en-enrich` (ผลเท่ากับ `DECK` ใน `./index.ts` ทุกฟิลด์)
 *
 * ⚠️ ฝั่งเบราว์เซอร์ห้าม import `@/data/cards` ตรง ๆ — ใช้ไฟล์นี้ (ด่าน test-bundle-budget เฝ้าอยู่)
 * ⚠️ กฎเหล็กข้อ 14: เลขที่ไม่มีในสำรับคืน `undefined` เสมอ ห้ามเดาไพ่ใบอื่นแทน
 */
export type CardResolver = (index?: number | null) => TarotCard | undefined;

const loaded: { th?: CardResolver; en?: CardResolver } = {};
const pending: { th?: Promise<CardResolver>; en?: Promise<CardResolver> } = {};

function makeResolver(deck: readonly TarotCard[], enrich?: (card: TarotCard) => TarotCard): CardResolver {
  const cache = new Map<number, TarotCard>();
  return (index) => {
    if (typeof index !== "number" || !Number.isInteger(index) || index < 0 || index >= deck.length) return undefined;
    if (!enrich) return deck[index];
    let card = cache.get(index);
    if (!card) {
      card = enrich(deck[index]);
      cache.set(index, card);
    }
    return card;
  };
}

/** เริ่มโหลด (หรือคืนตัวที่โหลดแล้ว) — เรียกล่วงหน้าได้ ขนานกับการยิง API */
export function loadCardResolver(isEnglish: boolean): Promise<CardResolver> {
  const key = isEnglish ? "en" : "th";
  const ready = loaded[key];
  if (ready) return Promise.resolve(ready);
  pending[key] ??= (async () => {
    const [{ DECK_TH }, enMod] = await Promise.all([
      import("./deck-th"),
      isEnglish ? import("./en-enrich") : Promise.resolve(null),
    ]);
    const resolver = makeResolver(DECK_TH, enMod?.enrichCardEn);
    loaded[key] = resolver;
    return resolver;
  })();
  // โหลดล้ม (เน็ตหลุด) ต้องลองใหม่ได้ในครั้งถัดไป ไม่ค้าง promise ที่ล้มไว้ตลอดไป
  pending[key]!.catch(() => {
    pending[key] = undefined;
  });
  return pending[key]!;
}

const NOT_READY: CardResolver = () => undefined;

/**
 * ฮุกสำหรับคอมโพเนนต์ที่ต้องการหาไพ่ตอน render — ปกติหน้าแรกโหลดไว้ก่อนแล้วจึงได้ทันที
 * ระหว่างยังไม่พร้อมคืนตัวที่ตอบ `undefined` ให้ผู้เรียกตกไปใช้ข้อมูลย่อจากเซสชันเอง
 */
export function useCardResolver(isEnglish: boolean): CardResolver {
  const key = isEnglish ? "en" : "th";
  const [resolver, setResolver] = useState<CardResolver | undefined>(() => loaded[key]);
  useEffect(() => {
    if (loaded[key]) {
      setResolver(() => loaded[key]);
      return;
    }
    let alive = true;
    loadCardResolver(isEnglish)
      .then((r) => {
        if (alive) setResolver(() => r);
      })
      .catch(() => {
        // โหลดสำรับไม่ได้ — คอมโพเนนต์ยังแสดงข้อมูลย่อจากเซสชันได้ ผู้ใช้กดโหลดใหม่ได้ตามปกติ
      });
    return () => {
      alive = false;
    };
  }, [isEnglish, key]);
  return resolver ?? NOT_READY;
}
