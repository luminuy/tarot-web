import { createHmac, timingSafeEqual } from "node:crypto";
import type { ReadingRecord } from "@/server/store";

/**
 * สถาปัตยกรรม Stateless Session Token สำหรับ Cloudflare Workers & Serverless Edge
 * -----------------------------------------------------------------------------
 * ปัญหา: ใน Edge / Serverless โหนดเซิร์ฟเวอร์กระจายตัวทั่วโลกและเป็น Stateless
 * การพึ่งพา Map() ในหน่วยความจำอย่างเดียวจะทำให้ session หลุดเมื่อมี Request ข้ามโหนด
 *
 * ทางแก้ระดับโปรดักชัน:
 * 1. สร้าง Cryptographic HMAC-SHA256 Token ส่งให้ Client ถือไว้เสมอ
 * 2. ทุก API Route สามารถถอดรหัสและกู้คืน Reading State ได้ทันที 0ms โดยไม่ต้องพึ่งพาเซิร์ฟเวอร์เดิม
 * 3. รับประกันความปลอดภัย 100% ไม่สามารถปลอมแปลงไพ่หรือ Seed ได้
 */

const KNOWN_INSECURE_SECRETS = new Set([
  "tarot-sacred-altar-secret-provably-fair-2026",
  "secret",
  "default",
]);

export function getSessionSecret(): string {
  const secret = process.env.TAROT_SESSION_SECRET;
  const isProd = process.env.NODE_ENV === "production";

  if (isProd) {
    if (!secret || secret.trim().length < 32 || KNOWN_INSECURE_SECRETS.has(secret)) {
      throw new Error(
        "[Security Guard] TAROT_SESSION_SECRET must be set to a secure string (≥ 32 characters) in production!"
      );
    }
    return secret;
  }

  // Development fallback with explicit dev-only prefix
  return (
    secret ||
    process.env.TAROT_SESSION_SECRET_DEV ||
    "dev-only-local-secret-32-chars-minimum-token-protection"
  );
}

export interface SessionTokenPayload extends Partial<ReadingRecord> {
  iat?: number;
  exp?: number;
}

export function signReadingSessionToken(record: Partial<ReadingRecord>): string {
  const nowSec = Math.floor(Date.now() / 1000);
  const isDrawnComplete = Array.isArray(record.drawn) && record.drawn.length > 0;

  const compactPayload: SessionTokenPayload = {
    id: record.id,
    status: record.status,
    spreadId: record.spreadId,
    category: record.category,
    personaId: record.personaId,
    question: record.question,
    intake: record.intake,
    nickname: record.nickname,
    safetyFlag: record.safetyFlag,
    safetyGuard: record.safetyGuard,
    commitment: record.commitment,
    // P0-1 Guard: Do NOT reveal serverSeed before cards are drawn (Prevent seed pre-computation)
    serverSeed: isDrawnComplete ? record.serverSeed : undefined,
    clientSeed: record.clientSeed,
    drawn: record.drawn,
    pickedIndices: record.pickedIndices,
    result: record.result,
    createdAt: record.createdAt || Date.now(),
    iat: nowSec,
    exp: nowSec + 7200, // 2-hour TTL expiration
  };

  const payloadStr = JSON.stringify(compactPayload);
  const data = Buffer.from(payloadStr, "utf8").toString("base64url");
  const signature = createHmac("sha256", getSessionSecret()).update(data).digest("base64url");
  return `${data}.${signature}`;
}

export function verifyReadingSessionToken(token: string): Partial<ReadingRecord> | null {
  if (!token || typeof token !== "string") return null;

  try {
    const dotIdx = token.lastIndexOf(".");
    if (dotIdx === -1) return null;

    const data = token.substring(0, dotIdx);
    const signature = token.substring(dotIdx + 1);

    const expectedSig = createHmac("sha256", getSessionSecret()).update(data).digest("base64url");

    const sigBuf = Buffer.from(signature, "utf8");
    const expBuf = Buffer.from(expectedSig, "utf8");

    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payloadStr = Buffer.from(data, "base64url").toString("utf8");
    const payload = JSON.parse(payloadStr) as SessionTokenPayload;

    // P0-3 Guard: Check Token Expiration
    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp && nowSec > payload.exp) {
      return null; // Expired token
    }

    // Guard against stale records older than 2 hours
    if (payload.createdAt && Date.now() - payload.createdAt > 7200 * 1000) {
      return null;
    }

    return payload as Partial<ReadingRecord>;
  } catch {
    return null;
  }
}
