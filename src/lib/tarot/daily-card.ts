/**
 * 🌅 ไพ่ประจำวันของทุกคน (Global Daily Tarot)
 * ---------------------------------------------------------------------------
 * ไพ่ใบเดียวต่อวัน เหมือนกันทุกคนทั้งเว็บ — เป็น "พลังงานประจำวัน" ให้แตะดูตอนเปิดหน้าแรก
 * ต่างจาก "ไพ่ประจำวันฟรี" ในระบบสิทธิ์ (`lib/entitlement/daily.ts`) ซึ่งเป็นการเปิดไพ่ส่วนตัว
 *
 * เลือกไพ่แบบ deterministic จากวันที่ (เวลาไทย) → ตรวจสอบเองได้ (provably-fair style):
 *   SHA-256("<salt>:<YYYY-MM-DD>") → 4 ไบต์แรกเป็น uint32 → mod 78 = ดัชนีไพ่
 *
 * แคชผลลง KV (namespace เดิม, prefix `app:daily:`) — คนแรกของวันคำนวณ + เขียน
 * คนที่เหลืออ่านจาก KV ที่ edge (~0ms) · TTL 48 ชม. เผื่อคาบเกี่ยววัน
 *
 * ⚠️ ใช้ฝั่งเซิร์ฟเวอร์เท่านั้น (อ่าน KV binding)
 */

import { cardByIndex, DECK, type TarotCard } from "@/data/cards";
import { dayKey } from "@/lib/entitlement/week";
import { KEY, kvGetJSON, kvPutJSON } from "@/lib/platform/kv-store";

/** เปลี่ยนค่านี้เมื่ออยากรีเซ็ตลำดับไพ่ทั้งชุด (เช่นปรับสูตร) */
const DAILY_SALT = "seertarot-daily-oracle-v1";
const CACHE_TTL_SEC = 48 * 60 * 60;
const MEMO_TTL_MS = 5 * 60 * 1000;

export interface DailyCard {
  /** วันที่เวลาไทย 'YYYY-MM-DD' */
  dateKey: string;
  cardId: string;
  cardIndex: number;
  nameTh: string;
  nameEn: string;
  /** ชื่อไฟล์ภาพ เช่น 'major-00.jpg' — ส่งต่อให้ <CardImage image=...> */
  image: string;
  /** คำสำคัญ 4 คำสำหรับโชว์ใต้ไพ่ */
  keywords: string[];
  element: TarotCard["element"];
  astrology: string;
  /** ประโยคพลังงานประจำวัน (ตัดจาก meanings.general.upright) */
  message: string;
  /** SHA-256 hex เต็ม — ผู้ใช้ตรวจสอบเองได้ว่าไพ่วันนี้ไม่ได้ถูกจัดฉาก */
  proof: string;
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function indexFromHex(hex: string): number {
  // 8 อักษรแรก = 4 ไบต์ = uint32
  const n = parseInt(hex.slice(0, 8), 16) >>> 0;
  return n % DECK.length;
}

function trimMessage(text: string, max = 170): string {
  const clean = text.trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

/** สร้างข้อมูลไพ่ประจำวันจากวันที่ (บริสุทธิ์ ไม่แตะ KV) — ใช้ทั้ง runtime และเทสต์ */
export async function computeDailyCard(dateKey: string): Promise<DailyCard> {
  const proof = await sha256Hex(`${DAILY_SALT}:${dateKey}`);
  const cardIndex = indexFromHex(proof);
  const card = cardByIndex(cardIndex);
  if (!card) throw new Error(`ดัชนีไพ่ประจำวันผิดช่วง: ${cardIndex}`);

  return {
    dateKey,
    cardId: card.id,
    cardIndex,
    nameTh: card.nameTh,
    nameEn: card.nameEn,
    image: card.image,
    keywords: card.keywords.upright.slice(0, 4),
    element: card.element,
    astrology: card.astrology,
    message: trimMessage(card.meanings.general.upright),
    proof,
  };
}

/**
 * ไพ่ประจำวันนี้ (เวลาไทย) — อ่านจาก KV ก่อน ถ้าไม่มีก็คำนวณแล้วเขียนคืน
 * KV ล่ม/ไม่มี binding → คำนวณสด (deterministic อยู่แล้ว ไม่พึ่ง KV เพื่อความถูกต้อง)
 */
export async function getGlobalDailyCard(now: Date = new Date()): Promise<DailyCard> {
  const dk = dayKey(now);
  const cacheKey = KEY.dailyCard(dk);

  const cached = await kvGetJSON<DailyCard>(cacheKey, MEMO_TTL_MS).catch(() => null);
  if (cached && cached.dateKey === dk && cached.proof) return cached;

  const fresh = await computeDailyCard(dk);
  await kvPutJSON(cacheKey, fresh, { expirationTtl: CACHE_TTL_SEC }).catch(() => {
    // เขียน KV ไม่ได้ก็ไม่เป็นไร — ครั้งหน้าคำนวณใหม่ (ถูกต้องเท่ากัน)
  });
  return fresh;
}
