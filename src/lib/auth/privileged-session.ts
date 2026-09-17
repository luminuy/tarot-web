import { getAppKV } from "@/lib/platform/cf";
import { recordEvent } from "@/lib/stats/record";

/**
 * 🔑 ทะเบียนเซสชันของบทบาทที่ใช้รหัสผ่านร่วม (แอดมิน / ผู้ทดสอบ)
 * ---------------------------------------------------------------------------
 * ## ทำไมต้องมีไฟล์นี้ (T-15)
 *
 * คุกกี้แอดมินกับผู้ทดสอบเป็น HMAC ที่เซ็นด้วย `รหัสผ่าน + session secret` เท่านั้น
 * ไม่มีตัวระบุเซสชันอยู่ข้างใน ผลคือ:
 *
 *   - `POST /api/admin/logout` ลบได้แค่คุกกี้ **ฝั่งไคลเอนต์**
 *     คุกกี้ที่ถูกขโมยไปแล้วยังใช้ได้ครบอายุ และเพิกถอนไม่ได้เลย
 *   - ทางเดียวที่เพิกถอนได้คือเปลี่ยน `ADMIN_PASSWORD` ซึ่งเตะทุกคนออกพร้อมกัน
 *   - คุกกี้ผู้ทดสอบอายุ 30 วัน และถือแล้วข้ามทั้งเพดานอัตรา เพดานพร้อมกัน
 *     เพดานค่าใช้จ่าย และด่าน origin
 *
 * วิธีแก้: ใส่ `sid` สุ่มลงในคุกกี้ แล้วเก็บ allowlist บน KV
 * ออกจากระบบ = ลบคีย์ออกจาก KV → คุกกี้ใบนั้นใช้ไม่ได้ทันทีทุก isolate ทุก colo
 *
 * ## นโยบายเมื่อ KV ใช้ไม่ได้
 *
 * แยก "อ่านแล้วไม่เจอ" (= ถูกเพิกถอนจริง → ปฏิเสธ) ออกจาก "อ่านไม่ได้เพราะ KV พัง"
 * (= ปล่อยผ่านโดยอาศัยลายเซ็น + วันหมดอายุที่ยังตรวจอยู่ พร้อมยิง metric)
 * ถ้าไม่แยก KV ล่มครั้งเดียวจะล็อกเจ้าของเว็บออกจากแผงแอดมินของตัวเอง
 */

const PREFIX = "app:privsess";

export type PrivilegedRole = "admin" | "tester";

function keyFor(role: PrivilegedRole, sid: string): string {
  return `${PREFIX}:${role}:${sid}`;
}

/** สร้างตัวระบุเซสชันใหม่ — สุ่ม 128 บิต เดาไม่ได้ */
export function newSessionId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** ลงทะเบียนเซสชันใหม่ลง allowlist */
export async function registerPrivilegedSession(
  role: PrivilegedRole,
  sid: string,
  ttlSec: number,
): Promise<void> {
  try {
    const kv = await getAppKV();
    await kv.put(keyFor(role, sid), String(Date.now()), { expirationTtl: Math.max(60, ttlSec) });
  } catch {
    // KV ไม่พร้อม — เซสชันยังใช้ได้ด้วยลายเซ็น แต่เพิกถอนทันทีไม่ได้จนกว่า KV จะกลับมา
    recordEvent(`privsess_register_failed:${role}`);
  }
}

/** เพิกถอนเซสชันเดียว (ออกจากระบบ) — มีผลทันทีทุก isolate */
export async function revokePrivilegedSession(role: PrivilegedRole, sid: string): Promise<void> {
  if (!sid) return;
  try {
    const kv = await getAppKV();
    await kv.delete(keyFor(role, sid));
  } catch {
    recordEvent(`privsess_revoke_failed:${role}`);
  }
}

/**
 * true = เซสชันนี้ยังอยู่ใน allowlist
 *
 * - อ่านได้และเจอ       → true
 * - อ่านได้แต่ไม่เจอ     → **false** (ถูกเพิกถอน หรือออกก่อนระบบนี้มีอยู่)
 * - อ่านไม่ได้ (KV พัง)  → true พร้อม metric (ไม่ล็อกเจ้าของเว็บออกเพราะระบบเราพัง)
 */
export async function isPrivilegedSessionActive(
  role: PrivilegedRole,
  sid: string | undefined,
): Promise<boolean> {
  // คุกกี้ยุคก่อนระบบนี้ไม่มี `sid` — ถือว่าใช้ไม่ได้ ให้ล็อกอินใหม่ครั้งเดียวจบ
  if (!sid) return false;
  try {
    const kv = await getAppKV();
    const found = await kv.get(keyFor(role, sid));
    return Boolean(found);
  } catch {
    recordEvent(`privsess_check_degraded:${role}`);
    return true;
  }
}
