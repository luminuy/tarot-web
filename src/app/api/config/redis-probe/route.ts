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

  // ยิง PING แบบดิบ ๆ เพื่อดูว่าล้มที่ขั้นไหน (สถานะ HTTP / error ของ Upstash / exception)
  let rawStatus = -1;
  let rawBody = "";
  let rawError: string | null = null;
  let urlHost = "";
  let urlScheme = "";

  try {
    const rawUrl = (process.env.UPSTASH_REDIS_REST_URL ?? "").trim();
    const rawToken = (process.env.UPSTASH_REDIS_REST_TOKEN ?? "").trim();
    if (rawUrl) {
      try {
        const u = new URL(rawUrl);
        urlHost = u.host;
        urlScheme = u.protocol;
      } catch {
        urlScheme = "INVALID_URL";
      }
    }

    const res = await fetch(rawUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${rawToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["PING"]),
    });
    rawStatus = res.status;
    // ตัดให้สั้น — ข้อความ error ของ Upstash ไม่มี secret อยู่ในนั้น
    rawBody = (await res.text()).slice(0, 200);
  } catch (err) {
    rawError = err instanceof Error ? `${err.name}: ${err.message}`.slice(0, 200) : "unknown";
  }

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
      urlScheme,
      urlHost,
      rawStatus,
      rawBody,
      rawError,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
