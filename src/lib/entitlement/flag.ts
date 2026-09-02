import { KEY, kvGetJSON } from "@/lib/platform/kv-store";

/**
 * ธงเปิด/ปิดระบบสิทธิ์ทั้งหมด — เปิดปิดได้จากแผงแอดมินโดยไม่ต้อง deploy
 * (ENTITLEMENT_PLAN ข้อ 8)
 *
 * ⚠️ **ค่าเริ่มต้น = เปิด** ตั้งแต่ PR #101 — ระบบจำกัดสิทธิ์ทำงานอยู่บน production
 * (เดิมค่าเริ่มต้นเป็น "ปิด" ตอน PR A–F เพื่อให้ปล่อยโค้ดขึ้นได้อย่างปลอดภัยก่อน)
 *
 * ผลของการเป็น default-on: ถ้า KV ล่ม อ่านค่าไม่ได้ หรือคีย์หาย → ระบบ **ยังบังคับสิทธิ์ต่อ**
 * เก็บเป็น KV key `app:flag:entitlement.enforced` → `{ "value": false }` หรือ `false` เพื่อปิด
 */
const FLAG_NAME = "entitlement.enforced";
const MEMO_MS = 30_000;

export async function isEntitlementEnabled(): Promise<boolean> {
  const raw = await kvGetJSON<boolean | { value?: boolean; enabled?: boolean }>(
    KEY.flag(FLAG_NAME),
    MEMO_MS,
  ).catch(() => null);

  // If explicitly disabled in KV by admin
  if (raw === false || (raw && typeof raw === "object" && (raw.value === false || raw.enabled === false))) {
    return false;
  }
  // Default is TRUE (Entitlement enforcement active for guest 1 reading & member 3 readings/day)
  return true;
}
