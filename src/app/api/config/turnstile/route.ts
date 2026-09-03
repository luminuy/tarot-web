import { NextResponse } from "next/server";

import { getTurnstileSiteKey } from "@/lib/security/turnstile";

export const runtime = "nodejs";

/**
 * GET /api/config/turnstile — คืน site key ให้ widget ฝั่ง client
 *
 * ทำไมต้องมี endpoint: `NEXT_PUBLIC_*` ต้องมีตอน `next build` แต่ pipeline deploy
 * ของโปรเจกต์นี้ไม่ได้ส่ง env ตอน build (ดู .github/workflows/deploy.yml) —
 * ตั้งเป็น NEXT_PUBLIC ไปก็ inline เป็น undefined เสมอ
 *
 * site key ไม่ใช่ความลับ (ส่งให้ทุกเบราว์เซอร์อยู่แล้ว) จึงตั้งผ่าน `wrangler secret put`
 * แล้วอ่านตอน runtime ที่นี่ · คืน null เมื่อยังไม่ได้ตั้งครบคู่ (site + secret)
 */
export function GET() {
  return NextResponse.json(
    { siteKey: getTurnstileSiteKey() },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}
