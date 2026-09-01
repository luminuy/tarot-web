import { createHash } from "node:crypto";
import { getAppKV } from "@/lib/platform/cf";
import { isPrivilegedTestRequest } from "@/lib/security/privileged";

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

// In-memory fallback
const memoryBuckets = new Map<string, RateLimitBucket>();

function getClientIp(request: Request): string {
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) return xForwardedFor.split(",")[0].trim();

  return "127.0.0.1";
}

function hashKey(value: string): string {
  const utcDay = new Date().toISOString().slice(0, 10);
  return createHash("sha256").update(`${value}:${utcDay}`).digest("hex").slice(0, 16);
}

export type AuthRateLimitAction = "login" | "signup" | "forgot" | "resend";

interface AuthRateLimitConfig {
  max: number;
  windowSec: number;
}

const ACTION_CONFIGS: Record<AuthRateLimitAction, AuthRateLimitConfig> = {
  login: { max: 8, windowSec: 15 * 60 }, // 8 ครั้ง / 15 นาที
  signup: { max: 3, windowSec: 60 * 60 }, // 3 ครั้ง / 1 ชั่วโมง
  forgot: { max: 3, windowSec: 60 * 60 }, // 3 ครั้ง / 1 ชั่วโมง
  resend: { max: 3, windowSec: 60 * 60 }, // 3 ครั้ง / 1 ชั่วโมง
};

/**
 * ตรวจสอบและบันทึก Rate Limit สำหรับธุรกรรม Authentication
 * @returns true ถ้าอนุญาตให้ดำเนินการต่อ, false ถ้าเกินโควตา (Rate Limited)
 */
export async function checkAuthRateLimit(
  request: Request,
  action: AuthRateLimitAction,
  identifier?: string
): Promise<{ allowed: boolean; retryAfterSec?: number }> {
  // ข้ามการจำกัดสำหรับผู้ทดสอบที่ได้รับอนุญาต (Admin Cookie / X-Tarot-Bypass Token)
  if (await isPrivilegedTestRequest(request)) {
    return { allowed: true };
  }

  const config = ACTION_CONFIGS[action];
  const now = Date.now();
  const ip = getClientIp(request);
  const ipHash = hashKey(`ip:${ip}`);
  const idHash = identifier ? hashKey(`id:${identifier.toLowerCase().trim()}`) : null;

  const keysToCheck = [`app:authrl:${action}:${ipHash}`];
  if (idHash) {
    keysToCheck.push(`app:authrl:${action}:${idHash}`);
  }

  const kv = await getAppKV();

  for (const key of keysToCheck) {
    let bucket: RateLimitBucket | null = null;

    // 1. Try KV
    try {
      const raw = await kv.get(key);
      if (raw) {
        bucket = JSON.parse(raw) as RateLimitBucket;
      }
    } catch {
      // ignore parse error
    }

    // 2. Fallback in-memory
    if (!bucket) {
      bucket = memoryBuckets.get(key) ?? null;
    }

    if (!bucket || now >= bucket.resetAt) {
      bucket = {
        count: 1,
        resetAt: now + config.windowSec * 1000,
      };
    } else {
      bucket.count += 1;
    }

    // Update in-memory
    memoryBuckets.set(key, bucket);

    // Update KV
    try {
      await kv.put(key, JSON.stringify(bucket), { expirationTtl: config.windowSec });
    } catch {
      // ignore KV write errors in local dev
    }

    if (bucket.count > config.max) {
      const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      return { allowed: false, retryAfterSec };
    }
  }

  return { allowed: true };
}
