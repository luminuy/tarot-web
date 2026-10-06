import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * 🔗 ลิงก์ส่วนตัวของคำอ่านที่ส่งให้ลูกค้า (REFLECTION_JOURNAL_PLAN 1.13)
 *  • โทเคนสุ่ม 128 บิต (base64url 22 ตัว) — เก็บแค่ SHA-256 ในฐานข้อมูล (ฐานข้อมูลหลุดก็เปิดลิงก์ไม่ได้)
 *  • มีวันหมดอายุ · ใส่รหัสผ่านได้ · เพิกถอนได้ทันที (ตรวจทุกครั้งที่เปิด ไม่แคช)
 *  • ปลดล็อกด้วยรหัสแล้วได้คุกกี้ลายเซ็น HMAC ผูกกับโทเคนนั้น อายุ 12 ชม.
 */

export const SHARE_EXPIRY_DAYS = [7, 30, 90] as const;
export const VIEW_COOKIE_PREFIX = "st_view_";
const VIEW_COOKIE_TTL_MS = 12 * 3600 * 1000;

export function newShareToken(): string {
  return randomBytes(16).toString("base64url");
}

export function hashShareToken(token: string): string {
  return createHash("sha256").update(`studio-share:${token}`).digest("hex");
}

export function isWellFormedToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{22}$/.test(token);
}

function viewSecret(): string {
  const s = process.env.STUDIO_VIEW_SECRET || process.env.TAROT_SESSION_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === "production") throw new Error("STUDIO_VIEW_SECRET/TAROT_SESSION_SECRET must be ≥ 32 chars");
    return "dev-only-studio-view-secret-change-me-0000";
  }
  return s;
}

/** ชื่อคุกกี้ต่อโทเคน (ใช้ส่วนต้นของแฮช ไม่ใช่โทเคน) */
export function viewCookieName(tokenHash: string): string {
  return `${VIEW_COOKIE_PREFIX}${tokenHash.slice(0, 12)}`;
}

export function signViewCookie(tokenHash: string, now = Date.now()): string {
  const exp = now + VIEW_COOKIE_TTL_MS;
  const sig = createHmac("sha256", viewSecret()).update(`${tokenHash}.${exp}`).digest("base64url");
  return `${exp}.${sig}`;
}

export function verifyViewCookie(tokenHash: string, value: string | undefined, now = Date.now()): boolean {
  if (!value) return false;
  const [expStr, sig] = value.split(".");
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < now || !sig) return false;
  const expected = createHmac("sha256", viewSecret()).update(`${tokenHash}.${exp}`).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
