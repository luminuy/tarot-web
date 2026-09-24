/**
 * ✦ "ราศีของฉัน" — ผู้ใช้กดบันทึกจากเครื่องหาราศีในหน้า `/cards/zodiac`
 * แล้วทุกคำขอเปิดไพ่จะส่งราศีไปให้แม่หมอเป็นบริบท (ดู `src/lib/ai/zodiac-context.ts`)
 *
 * เก็บในเบราว์เซอร์ของผู้ใช้เท่านั้น (ไม่ผูกบัญชี · ลบได้เอง) — เป็นความสะดวกส่วนตัว
 * ไม่ใช่ข้อมูลที่ต้องอยู่ถาวร · ทุกการอ่าน/เขียนห่อ try/catch เพราะ storage ถูกปิดได้
 * (โหมดส่วนตัว · ผู้ใช้บล็อกข้อมูลเว็บ) — อ่านไม่ได้ = เปิดไพ่ได้ตามปกติแค่ไม่มีราศี
 */

import { STORAGE_KEYS } from "@/lib/storage/keys";

export interface MySign {
  tropical: string;
  thai?: string;
  decan?: number;
}

const KEY = STORAGE_KEYS.mySign;
const SLUG = /^[a-z]{3,12}$/;

export function readMySign(): MySign | undefined {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null;
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<MySign>;
    if (typeof parsed.tropical !== "string" || !SLUG.test(parsed.tropical)) return undefined;
    return {
      tropical: parsed.tropical,
      thai: typeof parsed.thai === "string" && SLUG.test(parsed.thai) ? parsed.thai : undefined,
      decan: parsed.decan === 0 || parsed.decan === 1 || parsed.decan === 2 ? parsed.decan : undefined,
    };
  } catch {
    return undefined;
  }
}

export function saveMySign(sign: MySign): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(sign));
    return true;
  } catch {
    return false;
  }
}

export function clearMySign(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // storage ถูกปิด — ไม่มีอะไรให้ลบอยู่แล้ว
  }
}

/**
 * ✦ บอก island อื่นในหน้าเดียวกันว่าผู้ใช้เพิ่งหาราศีเจอ (วงล้อ ➔ ดวงวันนี้ · ความเข้ากัน)
 * island แต่ละตัว hydrate แยกกัน จึงคุยกันผ่าน window event แทน state ร่วม
 */
const SIGN_EVENT = "seer:zodiac-sign";

/* island ที่ hydrate ทีหลัง (`client:visible`) พลาดเหตุการณ์ไปแล้ว — เก็บค่าล่าสุดไว้ให้อ่านตอนเริ่ม */
let lastAnnounced: MySign | undefined;

/** ราศีที่วงล้อประกาศล่าสุดในหน้านี้ ไม่มี ➔ ราศีที่บันทึกไว้ */
export function currentSign(): MySign | undefined {
  return lastAnnounced ?? readMySign();
}

export function announceSign(sign: MySign): void {
  lastAnnounced = sign;
  try {
    window.dispatchEvent(new CustomEvent<MySign>(SIGN_EVENT, { detail: sign }));
  } catch {
    // ไม่มี window (ฝั่งเซิร์ฟเวอร์) — ไม่มีใครฟังอยู่แล้ว
  }
}

export function onSignAnnounced(listener: (sign: MySign) => void): () => void {
  const handler = (e: Event) => listener((e as CustomEvent<MySign>).detail);
  window.addEventListener(SIGN_EVENT, handler);
  return () => window.removeEventListener(SIGN_EVENT, handler);
}
