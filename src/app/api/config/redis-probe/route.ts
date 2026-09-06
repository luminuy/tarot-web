import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 🔬 ชั่วคราว — ตรวจว่า Worker "มองเห็น" ค่า Upstash ทางไหนบ้าง
 * ---------------------------------------------------------------------------
 * ⚠️ ต้องลบทิ้งทันทีที่วินิจฉัยเสร็จ (ดู docs/WORK_LOG.md วันที่ 2026-09-06)
 *
 * คืนค่าเป็น **boolean ล้วน** เท่านั้น ไม่คืนค่า url/token จริงแม้แต่ตัวเดียว
 * มีไว้เพราะ: ตั้ง secret ครบแล้ว deploy แล้ว แต่ Redis ไม่ถูกเรียกเลย
 * และหน้า /admin (Cloud Health) เข้าดูไม่ได้โดยไม่มีรหัสผ่านแอดมิน
 */
export async function GET() {
  let ctxUrlSet = false;
  let ctxTokenSet = false;
  let ctxError: string | null = null;
  let ctxEnvKeyCount = -1;

  try {
    const { safelyGetCloudflareContext } = await import("@/lib/platform/cf");
    const ctx = await safelyGetCloudflareContext();
    const env = (ctx?.env ?? {}) as Record<string, unknown>;
    ctxEnvKeyCount = Object.keys(env).length;
    ctxUrlSet = typeof env.UPSTASH_REDIS_REST_URL === "string" && env.UPSTASH_REDIS_REST_URL.length > 0;
    ctxTokenSet = typeof env.UPSTASH_REDIS_REST_TOKEN === "string" && env.UPSTASH_REDIS_REST_TOKEN.length > 0;
  } catch (err) {
    ctxError = err instanceof Error ? err.name : "unknown";
  }

  const { isRedisEnabled, redisPing } = await import("@/lib/platform/redis");
  const enabled = await isRedisEnabled();

  return NextResponse.json(
    {
      ctxUrlSet,
      ctxTokenSet,
      ctxEnvKeyCount,
      ctxError,
      procUrlSet: Boolean(process.env.UPSTASH_REDIS_REST_URL),
      procTokenSet: Boolean(process.env.UPSTASH_REDIS_REST_TOKEN),
      enabled,
      ping: enabled ? await redisPing() : false,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
