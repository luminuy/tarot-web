import { NextResponse } from "next/server";

interface RateLimitConfig {
  /** Maximum allowed requests within window */
  maxRequests: number;
  /** Window size in seconds */
  windowSeconds: number;
  /** Max concurrent pending requests per client */
  maxConcurrent?: number;
}

interface ClientRecord {
  timestamps: number[];
  concurrent: number;
}

const clientStore = new Map<string, ClientRecord>();
let lastCleanupTime = Date.now();

/**
 * Lazy cleanup of stale entries (Avoids timer setInterval on serverless isolate)
 */
function performLazyCleanup() {
  const now = Date.now();
  if (now - lastCleanupTime < 60 * 1000) return; // run at most once per minute
  lastCleanupTime = now;

  for (const [key, record] of clientStore.entries()) {
    record.timestamps = record.timestamps.filter((t) => now - t < 15 * 60 * 1000);
    if (record.timestamps.length === 0 && record.concurrent <= 0) {
      clientStore.delete(key);
    }
  }
}

/**
 * ตัวระบุตัวตนของผู้เรียก — ใช้เป็นคีย์ของทุกบักเก็ตเพดานอัตราในระบบ
 * ---------------------------------------------------------------------------
 * 🔴 บทเรียน T-16: ของเดิมถอยไปอ่าน `x-real-ip` แล้ว `x-forwarded-for` เมื่อไม่มี
 * `cf-connecting-ip` และถ้าไม่มีเลยก็คืน `"127.0.0.1"`
 *
 * ทั้งสองหัวนี้ **ไคลเอนต์ตั้งเองได้** ทุกเส้นทางที่เข้าถึง Worker โดยไม่ผ่าน Cloudflare
 * (เช่นยิงตรงที่โฮสต์ `*.workers.dev`) จึงหมุนค่าหัวรีเซ็ตบักเก็ตได้ทุกคำขอ —
 * รวมถึงบักเก็ตกันเดารหัสผ่านบน KV ที่ใช้ helper ตัวเดียวกันนี้
 *
 * ตอนนี้เชื่อเฉพาะ `cf-connecting-ip` ซึ่ง Cloudflare เขียนทับให้เองเสมอและปลอมไม่ได้
 * ไม่มีค่านั้น = ไม่รู้ว่าใคร จึงคืนคีย์ `unknown` **ก้อนเดียวร่วมกันทุกคน**
 * ผลคือคำขอที่ไม่ผ่าน Cloudflare ทั้งหมดแชร์โควตาถังเดียว ซึ่งเป็นพฤติกรรมที่ถูกต้อง:
 * เข้มกว่าเดิมมากสำหรับผู้โจมตี และไม่กระทบผู้ใช้จริงเลยเพราะทราฟฟิกจริงผ่าน Cloudflare 100%
 *
 * ⚠️ ห้ามเติมสาขา `x-real-ip` / `x-forwarded-for` กลับมา เว้นแต่จะมีการตรวจว่า
 * คำขอมาจาก proxy ที่เชื่อถือได้จริง (ตรวจ IP ต้นทางกับรายการช่วงของ Cloudflare)
 */
export function getClientIdentifier(request: Request): string {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  // นอก Cloudflare (dev server / ทดสอบในเครื่อง) — ยังต้องแยกกันได้พอให้เทสต์ทำงาน
  if (process.env.NODE_ENV !== "production") {
    const devIp =
      request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",").pop();
    if (devIp) return `dev:${devIp.trim()}`;
    return "dev:local";
  }

  return "unknown-origin";
}

/**
 * Check and record rate limit for a client
 */
export function checkRateLimit(
  clientId: string,
  config: RateLimitConfig
): {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  releaseConcurrency: () => void;
} {
  performLazyCleanup();
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  let record = clientStore.get(clientId);
  if (!record) {
    record = { timestamps: [], concurrent: 0 };
    clientStore.set(clientId, record);
  }

  // Filter timestamps within current window
  record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

  // Check concurrency
  if (config.maxConcurrent && record.concurrent >= config.maxConcurrent) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 3,
      releaseConcurrency: () => {},
    };
  }

  // Check rate limit threshold
  if (record.timestamps.length >= config.maxRequests) {
    const oldest = record.timestamps[0];
    const resetTime = oldest + windowMs;
    const retryAfter = Math.max(1, Math.ceil((resetTime - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: retryAfter,
      releaseConcurrency: () => {},
    };
  }

  // Allow request
  record.timestamps.push(now);

  // ⚠️ นับ concurrent เฉพาะปลายทางที่ขอ `maxConcurrent` มาเท่านั้น
  // ของเดิม +1 ทุกครั้งแบบไม่มีเงื่อนไข แต่มีแค่ 2 ใน 9 ปลายทางที่เรียก releaseConcurrency()
  // (read / chat / share) — อีก 7 ปลายทาง (start, shuffle, journal*, admin_login, tester_login)
  // จึงทิ้งค่าค้างไว้ตลอด ทำให้ 2 เรื่องพังพร้อมกัน:
  //   1. performLazyCleanup() ลบ entry ไม่ได้เลย (เงื่อนไขบังคับ concurrent <= 0)
  //      → clientStore โตขึ้นเรื่อย ๆ 1 entry ต่อ IP ต่อ prefix ตลอดอายุ isolate
  //   2. ถ้าวันหนึ่งมีคนใส่ maxConcurrent ให้ปลายทางเหล่านั้น IP นั้นจะถูกล็อกถาวรทันที
  const tracksConcurrency = Boolean(config.maxConcurrent);
  if (tracksConcurrency) record.concurrent += 1;

  let released = false;
  const releaseConcurrency = () => {
    if (!released && tracksConcurrency) {
      released = true;
      if (record) {
        record.concurrent = Math.max(0, record.concurrent - 1);
      }
    }
  };

  return {
    allowed: true,
    remaining: config.maxRequests - record.timestamps.length,
    retryAfterSeconds: 0,
    releaseConcurrency,
  };
}

export function createRateLimitResponse(retryAfterSeconds: number, message?: string): Response {
  return NextResponse.json(
    {
      error: message || `คุณส่งคำขอเร็วเกินไป กรุณารอสักครู่ (${retryAfterSeconds} วินาที) ก่อนลองใหม่นะ`,
      retryAfter: retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": retryAfterSeconds.toString(),
        "X-RateLimit-Remaining": "0",
      },
    }
  );
}
