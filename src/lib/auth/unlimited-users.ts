/**
 * รายชื่ออีเมลที่ใช้เว็บได้ "ไม่จำกัด" — สำหรับเจ้าของ/หุ้นส่วน/ทีมงาน
 * -----------------------------------------------------------------
 * ผู้ใช้ที่ล็อกอินปกติ (Google / LINE / อีเมล-รหัสผ่าน ผ่านหน้าต่างเข้าสู่ระบบ)
 * ถ้าอีเมลตรงกับรายการนี้ → `isPrivilegedTestRequest()` คืน true → ข้ามทุกลิมิต
 * (rate limit / โควตาเปิดไพ่ / เพดาน AI / origin guard / entitlement)
 *
 * ตั้งค่า secret `UNLIMITED_EMAILS` — คั่นด้วย comma หรือเว้นวรรค เช่น:
 *   npx wrangler secret put UNLIMITED_EMAILS
 *   partner@example.com, boss@example.com
 *
 * ต่างจาก `/tester` (รหัสผ่านรวม): อันนี้ผูกกับ "บัญชีจริง" — มีประวัติดูดวง ซิงก์ข้ามเครื่อง คุยแม่หมอได้
 * ยังบังคับ: safety guard, provably-fair — เหมือน bypass ทุกแบบ
 */

function normalizeEmail(email: string): string {
  return (email || "").trim().toLowerCase();
}

let cache: { raw: string; set: Set<string> } | null = null;

function getSet(): Set<string> {
  const raw = (process.env.UNLIMITED_EMAILS ?? "").trim();
  if (cache && cache.raw === raw) return cache.set;
  const set = new Set(
    raw
      .split(/[,\s]+/)
      .map((e) => e.trim())
      .filter((e) => e.includes("@"))
      .map((e) => normalizeEmail(e)),
  );
  cache = { raw, set };
  return set;
}

export function isUnlimitedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const set = getSet();
  if (set.size === 0) return false;
  return set.has(normalizeEmail(email));
}

/** จำนวนอีเมลใน allowlist (ไว้ debug / health check) */
export function unlimitedEmailCount(): number {
  return getSet().size;
}
