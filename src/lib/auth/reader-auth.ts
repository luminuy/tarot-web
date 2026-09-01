import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getReaderById, type Reader } from "@/lib/marketplace/readers.repo";

export const READER_COOKIE_NAME = "tarot_reader_session";

interface ReaderSessionPayload {
  readerId: string;
  exp: number; // timestamp ms
  nonce: string;
}

function base64urlEncode(str: string): string {
  return Buffer.from(str, "utf8").toString("base64url");
}

function base64urlDecode(str: string): string {
  return Buffer.from(str, "base64url").toString("utf8");
}

/**
 * สร้าง Token สำหรับ Reader เข้าใช้งาน Console (อายุ 24 ชั่วโมง)
 */
export function signReaderToken(readerId: string, secret: string, expiresInHours = 24): string {
  const payload: ReaderSessionPayload = {
    readerId,
    exp: Date.now() + expiresInHours * 60 * 60 * 1000,
    nonce: Math.random().toString(36).slice(2, 10),
  };

  const payloadB64 = base64urlEncode(JSON.stringify(payload));
  const sig = createHmac("sha256", secret).update(payloadB64).digest("base64url");
  return `${payloadB64}.${sig}`;
}

/**
 * ตรวจสอบความถูกต้องของ Token
 */
export function verifyReaderToken(token: string | undefined | null, secret: string): ReaderSessionPayload | null {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;

  const [payloadB64, providedSig] = token.split(".");
  if (!payloadB64 || !providedSig) return null;

  try {
    const expectedSig = createHmac("sha256", secret).update(payloadB64).digest("base64url");
    const sigBuf = Buffer.from(providedSig);
    const expBuf = Buffer.from(expectedSig);

    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload = JSON.parse(base64urlDecode(payloadB64)) as ReaderSessionPayload;
    if (Date.now() > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

export type ReaderAuthResult =
  | { success: true; reader: Reader; readerId: string }
  | { success: false; response: NextResponse };

/**
 * Guard ตรวจสอบสิทธิ์ Reader สำหรับ API และ Console
 */
export async function requireReader(request?: Request): Promise<ReaderAuthResult> {
  let token: string | undefined;
  let readerIdParam: string | undefined;

  // 1. Check cookies
  const cookieStore = await cookies();
  token = cookieStore.get(READER_COOKIE_NAME)?.value;

  // 2. Check query params or headers if request provided
  if (request) {
    const url = new URL(request.url);
    const queryToken = url.searchParams.get("token");
    const queryReaderId = url.searchParams.get("readerId") || url.searchParams.get("id");
    const authHeader = request.headers.get("authorization");

    if (queryToken) token = queryToken;
    if (queryReaderId) readerIdParam = queryReaderId;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7).trim();
    }
  }

  if (!token) {
    return {
      success: false,
      response: NextResponse.json({ error: "ต้องระบุ Token เพื่อเข้าสู่ระบบแม่หมอ" }, { status: 401 }),
    };
  }

  // Extract readerId from token payload
  const [payloadB64] = token.split(".");
  if (!payloadB64) {
    return {
      success: false,
      response: NextResponse.json({ error: "รูปแบบ Token ไม่ถูกต้อง" }, { status: 401 }),
    };
  }

  let readerId = readerIdParam;
  try {
    const parsedPayload = JSON.parse(base64urlDecode(payloadB64)) as { readerId?: string };
    if (parsedPayload.readerId) readerId = parsedPayload.readerId;
  } catch {
    return {
      success: false,
      response: NextResponse.json({ error: "ข้อมูล Token เสียหาย" }, { status: 401 }),
    };
  }

  if (!readerId) {
    return {
      success: false,
      response: NextResponse.json({ error: "ไม่พบรหัสแม่หมอใน Token" }, { status: 401 }),
    };
  }

  const reader = await getReaderById(readerId);
  if (!reader) {
    return {
      success: false,
      response: NextResponse.json({ error: "ไม่พบบัญชีแม่หมอนี้ในระบบ" }, { status: 404 }),
    };
  }

  if (reader.status !== "approved") {
    return {
      success: false,
      response: NextResponse.json({ error: "บัญชีแม่หมออยู่ในสถานะระงับหรือรออนุมัติ" }, { status: 403 }),
    };
  }

  const payload = verifyReaderToken(token, reader.sessionSecret);
  if (!payload || payload.readerId !== reader.id) {
    return {
      success: false,
      response: NextResponse.json({ error: "Token หมดอายุหรือไม่ถูกต้อง" }, { status: 401 }),
    };
  }

  return { success: true, reader, readerId: reader.id };
}
