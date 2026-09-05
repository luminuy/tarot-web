import { NextResponse } from "next/server";
import { isValidGaId, isValidMetaPixelId } from "@/lib/analytics";

export const runtime = "nodejs";

/**
 * GET /api/config/analytics
 * ---------------------------------------------------------------------------
 * คืนค่า Google Analytics 4 Measurement ID และ Meta Pixel ID ให้กับ Client
 * รองรับทั้ง:
 * 1. NEXT_PUBLIC_* ที่ inline ตอน build
 * 2. Secrets / Environment variables ที่ตั้งค่าตอน runtime บน Cloudflare Workers
 *    (เช่น npx wrangler secret put GA_MEASUREMENT_ID)
 */
export function GET() {
  const rawGaId =
    process.env.NEXT_PUBLIC_GA_ID ||
    process.env.GA_MEASUREMENT_ID ||
    process.env.GA_ID ||
    null;

  const rawMetaPixelId =
    process.env.NEXT_PUBLIC_META_PIXEL_ID ||
    process.env.META_PIXEL_ID ||
    null;

  const gaId = isValidGaId(rawGaId) ? rawGaId!.trim() : null;
  const metaPixelId = isValidMetaPixelId(rawMetaPixelId) ? rawMetaPixelId!.trim() : null;

  return NextResponse.json(
    {
      gaId,
      metaPixelId,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      },
    }
  );
}
