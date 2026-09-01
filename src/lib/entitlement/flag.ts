import { KEY, kvGetJSON } from "@/lib/platform/kv-store";

/**
 * ธงเปิด/ปิดระบบสิทธิ์ทั้งหมด — เปิดปิดได้จากแผงแอดมินโดยไม่ต้อง deploy
 * (ENTITLEMENT_PLAN ข้อ 8) · ค่าเริ่มต้น = ปิด (พฤติกรรมเว็บเหมือนเดิม 100%)
 *
 * เก็บเป็น KV key `app:flag:entitlement.enabled` → `{ "value": true }` หรือ `true`
 */
const FLAG_NAME = "entitlement.enabled";
const MEMO_MS = 30_000;

export async function isEntitlementEnabled(): Promise<boolean> {
  const raw = await kvGetJSON<boolean | { value?: boolean; enabled?: boolean }>(
    KEY.flag(FLAG_NAME),
    MEMO_MS,
  ).catch(() => null);

  if (raw === true) return true;
  if (raw && typeof raw === "object") return raw.value === true || raw.enabled === true;
  return false;
}
