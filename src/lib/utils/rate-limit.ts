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

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of clientStore.entries()) {
      record.timestamps = record.timestamps.filter((t) => now - t < 15 * 60 * 1000);
      if (record.timestamps.length === 0 && record.concurrent <= 0) {
        clientStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Extract client IP from Next.js request headers
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
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
  record.concurrent += 1;

  let released = false;
  const releaseConcurrency = () => {
    if (!released) {
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
