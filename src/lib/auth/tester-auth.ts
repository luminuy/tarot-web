import { createHmac, timingSafeEqual } from "node:crypto";

import {
  isPrivilegedSessionActive,
  newSessionId,
  registerPrivilegedSession,
  revokePrivilegedSession,
} from "@/lib/auth/privileged-session";

/**
 * Tester session — บัญชี "ผู้ทดสอบ" สำหรับหุ้นส่วน/ทีมงานที่ต้องใช้เว็บได้ไม่จำกัด
 * ---------------------------------------------------------------------------
 * ต่างจากแอดมิน: **ปลดล็อกแค่การใช้งาน** (rate limit / โควตา / เพดาน AI / origin guard / entitlement)
 * ไม่เปิดแผงแอดมิน ไม่แก้ prompt ไม่เห็นสถิติ/ยอดจ่าย
 *
 * เข้าด้วย "รหัสผ่านผู้ทดสอบ" (`TESTER_PASSWORD` secret) → ออก HMAC-signed cookie อายุ 7 วัน
 * ผู้ทดสอบคือใครก็ตามที่รู้รหัสผ่าน (แจกให้คนใกล้ตัวเท่านั้น)
 *
 * 🔑 บทเรียน T-15: คุกกี้ใบนี้ข้ามทั้งเพดานอัตรา เพดานพร้อมกัน เพดานค่าใช้จ่าย และด่าน origin
 * ของเดิมอายุ **30 วัน** และเพิกถอนไม่ได้เลยนอกจากเปลี่ยนรหัสผ่าน (ซึ่งเตะทุกคนออกพร้อมกัน)
 * ตอนนี้: อายุ 7 วัน · มี `sid` ใน allowlist บน KV จึงถอนทีละใบได้ · ผูกกับชื่อผู้ถือ
 * เพื่อให้รู้ว่าใบไหนเป็นของใครตอนต้องถอน
 *
 * ตั้ง secret ครั้งเดียว:  npx wrangler secret put TESTER_PASSWORD
 * (dev: ใส่ใน .env.local — ต้อง ≥ 12 ตัวอักษร)
 *
 * ⚠️ ไม่ข้าม: safety checkQuestion, provably-fair integrity, body-size cap — เหมือน isPrivilegedTestRequest
 */

export const TESTER_COOKIE_NAME = "tarot_tester";
const SESSION_TTL_SEC = 7 * 24 * 60 * 60; // 7 วัน (เดิม 30 วัน — ดูบทเรียน T-15 ด้านบน)
const MIN_PASSWORD_LEN = 12;

function getTesterSecret(): string {
  // เซ็น cookie ด้วย TESTER_PASSWORD + session secret รวมกัน — เปลี่ยนรหัส = เตะทุก session ทิ้ง
  const pw = process.env.TESTER_PASSWORD ?? "";
  const base = process.env.TAROT_SESSION_SECRET ?? process.env.AUTH_SECRET ?? "tarot-tester-dev";
  return `${base}::tester::${pw}`;
}

/** true ถ้าตั้ง TESTER_PASSWORD ไว้ถูกต้อง (ยาวพอ) — ถ้า false ให้ปิดการเข้าผู้ทดสอบทั้งหมด */
export function isTesterConfigured(): boolean {
  return (process.env.TESTER_PASSWORD ?? "").trim().length >= MIN_PASSWORD_LEN;
}

/** เทียบรหัสผ่านแบบ constant-time */
export function verifyTesterPassword(input: string): boolean {
  const expected = (process.env.TESTER_PASSWORD ?? "").trim();
  if (expected.length < MIN_PASSWORD_LEN) return false;
  const a = Buffer.from(String(input));
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

/**
 * ออกคุกกี้ผู้ทดสอบใหม่ พร้อมลงทะเบียน `sid` ลง allowlist
 * @param holder ชื่อผู้ถือ (ไม่บังคับ) — เก็บไว้เพื่อให้รู้ว่าถอนใบไหนของใคร
 */
export async function signTesterSession(holder?: string): Promise<string> {
  const nowSec = Math.floor(Date.now() / 1000);
  const sid = newSessionId();
  const payload = {
    role: "tester" as const,
    sid,
    ...(holder ? { holder: holder.slice(0, 40) } : {}),
    iat: nowSec,
    exp: nowSec + SESSION_TTL_SEC,
  };
  const data = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = createHmac("sha256", getTesterSecret()).update(data).digest("base64url");
  await registerPrivilegedSession("tester", sid, SESSION_TTL_SEC);
  return `${data}.${sig}`;
}

/** อ่าน `sid` ออกจากคุกกี้โดยไม่ตรวจลายเซ็น — ใช้ตอนออกจากระบบเท่านั้น */
export function readTesterSessionId(token: string | undefined | null): string | undefined {
  if (!token) return undefined;
  const dot = token.lastIndexOf(".");
  if (dot === -1) return undefined;
  try {
    const payload = JSON.parse(Buffer.from(token.slice(0, dot), "base64url").toString("utf8")) as {
      sid?: string;
    };
    return payload.sid;
  } catch {
    return undefined;
  }
}

/** เพิกถอนคุกกี้ผู้ทดสอบใบนี้ให้ใช้ไม่ได้อีกทันที */
export async function revokeTesterSession(token: string | undefined | null): Promise<void> {
  const sid = readTesterSessionId(token);
  if (sid) await revokePrivilegedSession("tester", sid);
}

export function verifyTesterSession(token: string | undefined | null): boolean {
  if (!token || typeof token !== "string" || !isTesterConfigured()) return false;
  const dot = token.lastIndexOf(".");
  if (dot === -1) return false;

  const data = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", getTesterSecret()).update(data).digest("base64url");

  const sigBuf = Buffer.from(sig, "utf8");
  const expBuf = Buffer.from(expected, "utf8");
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return false;

  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as {
      role?: string;
      exp?: number;
    };
    if (payload.role !== "tester") return false;
    if (!payload.exp || Math.floor(Date.now() / 1000) > payload.exp) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * ด่านจริงของสิทธิ์ผู้ทดสอบ — ลายเซ็น + วันหมดอายุ + ยังอยู่ใน allowlist
 * `verifyTesterSession` ตรวจแค่ลายเซ็น จึงใช้เป็นด่านสุดท้ายไม่ได้ (T-15)
 */
export async function verifyTesterSessionLive(token: string | undefined | null): Promise<boolean> {
  if (!verifyTesterSession(token)) return false;
  return isPrivilegedSessionActive("tester", readTesterSessionId(token));
}

export const TESTER_SESSION_MAX_AGE = SESSION_TTL_SEC;
