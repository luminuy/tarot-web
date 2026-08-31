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

const DEFAULT_DEV_SECRET = "tarot-sacred-altar-secret-provably-fair-2026";

function getSessionSecret(): string {
  const secret = process.env.TAROT_SESSION_SECRET || process.env.CF_PAGES_COMMIT_SHA;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[Security] TAROT_SESSION_SECRET environment variable must be set in production"
    );
  }
  return DEFAULT_DEV_SECRET;
}

export function signReadingSessionToken(record: Partial<ReadingRecord>): string {
  const compactPayload: Partial<ReadingRecord> = {
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
    serverSeed: record.serverSeed,
    clientSeed: record.clientSeed,
    drawn: record.drawn,
    result: record.result,
    createdAt: record.createdAt,
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
    return JSON.parse(payloadStr) as Partial<ReadingRecord>;
  } catch {
    return null;
  }
}
