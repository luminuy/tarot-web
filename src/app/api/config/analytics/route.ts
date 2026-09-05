import { NextResponse } from "next/server";
import { isValidGaId, isValidMetaPixelId, isValidGoogleAdsId } from "@/lib/analytics";

export const runtime = "nodejs";

/**
 * GET /api/config/analytics
 * ---------------------------------------------------------------------------
 * คืนค่า GA4 Measurement ID, Meta Pixel ID และ Google Ads ID ให้กับ Client
 * รองรับทั้ง:
 * 1. NEXT_PUBLIC_* ที่ inline ตอน build
 * 2. Secrets / Environment variables ที่ตั้งค่าตอน runtime บน Cloudflare Workers
 *    (เช่น npx wrangler secret put GA_MEASUREMENT_ID หรือ GOOGLE_ADS_ID)
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

  const rawGoogleAdsId =
    process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ||
    process.env.GOOGLE_ADS_ID ||
    process.env.AW_CONVERSION_ID ||
    null;

  const gaId = isValidGaId(rawGaId) ? rawGaId!.trim() : null;
  const metaPixelId = isValidMetaPixelId(rawMetaPixelId) ? rawMetaPixelId!.trim() : null;
  const googleAdsId = isValidGoogleAdsId(rawGoogleAdsId) ? rawGoogleAdsId!.trim() : null;

  return NextResponse.json(
    {
      gaId,
      metaPixelId,
      googleAdsId,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      },
    }
  );
}

