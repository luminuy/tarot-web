import type { AppUser } from "@/lib/users/users.repo";

/**
 * 👤 แคชโปรไฟล์ผู้ใช้ในหน่วยความจำของ isolate (อายุสั้น)
 * ---------------------------------------------------------------------------
 * ทำไมต้องมี: หน้าเว็บยิง `GET /api/auth/me` ทุก ~30 วินาทีและทุกครั้งที่สลับหน้า
 * แต่ละครั้งเดิมสั่ง `SELECT * FROM users WHERE id = ?` ลง D1 ใหม่เสมอ
 * ทั้งที่ข้อมูลที่ใช้ (ชื่อ, อีเมล, ยืนยันอีเมลแล้วหรือยัง, ตั้งรหัสผ่านหรือยัง)
 * แทบไม่เปลี่ยนเลยระหว่างเซสชัน
 *
 * ⚠️ ขอบเขตที่ตั้งใจจำกัดไว้ — อ่านก่อนเอาไปใช้ที่อื่น:
 * 1. ใช้ **เฉพาะ** เส้น `/api/auth/me` ซึ่งเอาไปแสดงผลอย่างเดียว
 *    ห้ามเอาไปใช้ในเส้นทางที่ตัดสินใจเรื่องความปลอดภัย (ยืนยันอีเมล, รีเซ็ตรหัสผ่าน,
 *    ผูกบัญชี OAuth) — เส้นพวกนั้นต้องอ่านสด ๆ จาก D1 เสมอ
 * 2. **ไม่แคชสถานะเพิกถอนเซสชัน** — การเทียบ `token_version` ยังทำผ่าน
 *    `getRevocationState()` ใน `session.ts` ตามเดิม (ซึ่งมีแคชของตัวเองอยู่แล้ว)
 *    การล็อกเอาต์ทุกอุปกรณ์/เปลี่ยนรหัสผ่านจึงยังมีผลทันทีเหมือนเดิม
 * 3. แคชอยู่ในหน่วยความจำของ isolate เท่านั้น ล้างข้ามเครื่องไม่ได้ —
 *    เส้นที่แก้โปรไฟล์จึงเรียก `invalidateUserCache()` เพื่อล้างของ isolate ตัวเอง
 *    ส่วน isolate อื่นรอหมดอายุเองภายใน 30 วินาที
 */

const TTL_MS = 30_000;
const MAX_ENTRIES = 2000;

type CacheGlobal = {
  __tarot_user_cache__?: Map<string, { user: AppUser | null; at: number }>;
};

function store(): Map<string, { user: AppUser | null; at: number }> {
  const g = globalThis as CacheGlobal;
  return (g.__tarot_user_cache__ ??= new Map());
}

/**
 * อ่านโปรไฟล์ผู้ใช้แบบมีแคช — ใช้กับการ "แสดงผล" เท่านั้น
 * `loader` คือฟังก์ชันอ่านจริงจาก D1 (ส่งเข้ามาเพื่อไม่ให้ไฟล์นี้ผูกกับ repo โดยตรง)
 */
export async function getCachedUser(
  id: string,
  loader: (id: string) => Promise<AppUser | null>,
): Promise<AppUser | null> {
  const cache = store();
  const hit = cache.get(id);
  if (hit && Date.now() - hit.at < TTL_MS) {
    return hit.user;
  }

  const user = await loader(id);

  // กัน memory leak เมื่อมีผู้ใช้พร้อมกันจำนวนมากใน isolate เดียว
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next();
    if (!oldest.done) cache.delete(oldest.value);
  }

  cache.set(id, { user, at: Date.now() });
  return user;
}

/** ล้างแคชของผู้ใช้คนหนึ่ง — เรียกทุกครั้งที่เส้นทางใดแก้ข้อมูลโปรไฟล์ */
export function invalidateUserCache(id: string): void {
  store().delete(id);
}
