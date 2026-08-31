import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Admin session — แยกออกจาก OAuth ผู้ใช้ทั่วไปโดยสิ้นเชิง
 * -------------------------------------------------------
 * เข้าด้วย "รหัสผ่านแอดมิน" (`ADMIN_PASSWORD` secret) → ออก HMAC-signed cookie อายุสั้น
 * ไม่มี role / allowlist — แอดมินคือใครก็ตามที่รู้รหัสผ่าน
 *
 * ตั้ง secret ครั้งเดียว:  npx wrangler secret put ADMIN_PASSWORD
 * (dev: ใส่ใน .env.local — ต้อง ≥ 12 ตัวอักษร)
 */

export const ADMIN_COOKIE_NAME = "tarot_admin";
const SESSION_TTL_SEC = 8 * 60 * 60; // 8 ชั่วโมง
const MIN_PASSWORD_LEN = 12;

function getAdminSecret(): string {
  // เซ็น cookie ด้วย ADMIN_PASSWORD + TAROT_SESSION_SECRET รวมกัน —
  // เปลี่ยนรหัสผ่าน = เตะทุก session ทิ้งทันที
  const pw = process.env.ADMIN_PASSWORD ?? "";
  const base = process.env.TAROT_SESSION_SECRET ?? process.env.AUTH_SECRET ?? "tarot-admin-dev";
  return `${base}::admin::${pw}`;
}

/** true ถ้าตั้ง ADMIN_PASSWORD ไว้ถูกต้อง (ยาวพอ) — ถ้า false ให้ปิดการเข้าแอดมินทั้งหมด */
export function isAdminConfigured(): boolean {
  return (process.env.ADMIN_PASSWORD ?? "").trim().length >= MIN_PASSWORD_LEN;
}

/** เทียบรหัสผ่านแบบ constant-time */
export function verifyAdminPassword(input: string): boolean {
  const expected = (process.env.ADMIN_PASSWORD ?? "").trim();
  if (expected.length < MIN_PASSWORD_LEN) return false;
  const a = Buffer.from(String(input));
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    // ยัง timingSafeEqual กับ dummy เพื่อไม่ให้ต่างเวลา
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

export function signAdminSession(): string {
  const nowSec = Math.floor(Date.now() / 1000);
  const payload = { role: "admin" as const, iat: nowSec, exp: nowSec + SESSION_TTL_SEC };
  const data = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = createHmac("sha256", getAdminSecret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyAdminSession(token: string | undefined | null): boolean {
  if (!token || typeof token !== "string" || !isAdminConfigured()) return false;
  const dot = token.lastIndexOf(".");
  if (dot === -1) return false;

  const data = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", getAdminSecret()).update(data).digest("base64url");

  const sigBuf = Buffer.from(sig, "utf8");
  const expBuf = Buffer.from(expected, "utf8");
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return false;

  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as {
      role?: string;
      exp?: number;
    };
    if (payload.role !== "admin") return false;
    if (!payload.exp || Math.floor(Date.now() / 1000) > payload.exp) return false;
    return true;
  } catch {
    return false;
  }
}

export const ADMIN_SESSION_MAX_AGE = SESSION_TTL_SEC;
