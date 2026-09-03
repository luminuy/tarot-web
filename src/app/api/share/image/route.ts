import { NextResponse } from "next/server";

import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { getShareBucket } from "@/lib/platform/cf";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from "@/lib/utils/rate-limit";
import { resolveAppOrigin } from "@/lib/security/app-origin";

export const runtime = "nodejs";

const MAX_BYTES = 1_200_000; // ~1.2MB — canvas PNG ของเราปกติ ~300-800KB
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47]; // \x89PNG

/**
 * POST /api/share/image
 * body = raw PNG (Content-Type: image/png) ที่ ShareModal สร้างจาก <canvas>
 * query ?title=<หัวข้อ> &spread=<ชื่อผัง>  → เก็บ meta ไว้ทำ OG ที่หน้า /s/<id>
 *
 * เก็บลง R2 (SHARE_BUCKET) ด้วย id สุ่ม → คืน { id, url }
 * R2 ไม่พร้อม → 503 (ShareModal ถอยไปแชร์ลิงก์หน้าแรกแบบเดิม)
 */
export async function POST(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึงจากภายนอก" }, { status: 403 });
  }

  const clientId = getClientIdentifier(request);
  const rl = checkRateLimit(clientId, { maxRequests: 12, windowSeconds: 600 });
  if (!rl.allowed) {
    rl.releaseConcurrency();
    return createRateLimitResponse(rl.retryAfterSeconds, "สร้างลิงก์แชร์บ่อยเกินไป รออีกสักครู่นะ");
  }

  try {
    const bucket = await getShareBucket();
    if (!bucket) {
      return NextResponse.json({ error: "ระบบลิงก์แชร์ยังไม่พร้อม" }, { status: 503 });
    }

    const buf = await request.arrayBuffer();
    if (buf.byteLength < 100 || buf.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: "ไฟล์ภาพขนาดไม่ถูกต้อง" }, { status: 400 });
    }
    const head = new Uint8Array(buf.slice(0, 4));
    if (!PNG_MAGIC.every((b, i) => head[i] === b)) {
      return NextResponse.json({ error: "รองรับเฉพาะ PNG" }, { status: 400 });
    }

    const id = crypto.randomUUID().replace(/-/g, "");
    await bucket.put(`${id}.png`, buf, {
      httpMetadata: { contentType: "image/png", cacheControl: "public, max-age=31536000, immutable" },
    });

    const url = new URL(request.url);
    const title = url.searchParams.get("title")?.slice(0, 200) || "";
    const spread = url.searchParams.get("spread")?.slice(0, 80) || "";
    if (title || spread) {
      await bucket
        .put(`${id}.json`, JSON.stringify({ title, spread, at: Date.now() }), {
          httpMetadata: { contentType: "application/json" },
        })
        .catch(() => {});
    }

    const origin = resolveAppOrigin(request);
    return NextResponse.json({ id, url: `${origin}/s/${id}` });
  } catch (err) {
    console.error("[share/image] ล้มเหลว:", err);
    return NextResponse.json({ error: "อัปโหลดภาพไม่สำเร็จ" }, { status: 500 });
  } finally {
    rl.releaseConcurrency();
  }
}
