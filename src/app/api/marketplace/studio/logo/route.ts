import { apiFail, apiOk } from "@/lib/api/envelope";
import { getShareBucket } from "@/lib/platform/cf";
import { consumeEdgeRateLimits, edgeRateLimitKey } from "@/lib/security/edge-ratelimit";
import { studioGate } from "@/lib/studio/gate";
import { STUDIO_LOGO_MAX_BYTES, deleteOwnLogo, logoContentType, logoPath, sniffLogoKind } from "@/lib/studio/logo";
import { setStudioLogo } from "@/lib/studio/studio.repo";

export const runtime = "nodejs";

/**
 * POST   /api/marketplace/studio/logo — อัปโหลดโลโก้ (body = ไฟล์รูปดิบที่หน้าเว็บย่อเป็น 256px แล้ว) ➔ ตั้งเป็นโลโก้ทันที
 * DELETE /api/marketplace/studio/logo — เอาโลโก้ออก
 * ไฟล์เก่าของระบบเราถูกลบทิ้งทุกครั้ง · ไม่มีที่เก็บไฟล์ (dev) ➔ 503 `storage_unavailable` (หน้าเว็บให้วางลิงก์รูปแทน)
 */
export async function POST(request: Request) {
  const gate = await studioGate(request);
  if (!gate.ok) return gate.response;
  const limit = await consumeEdgeRateLimits([
    { key: edgeRateLimitKey("studio:logo", gate.readerId), config: { max: 12, windowSec: 3600 } },
  ]);
  if (!limit.allowed) return apiFail("เปลี่ยนโลโก้บ่อยเกินไป รอสักครู่แล้วลองใหม่", 429, "rate_limited");

  const bucket = await getShareBucket();
  if (!bucket) return apiFail("อัปโหลดรูปยังไม่พร้อม ลองวางลิงก์รูปแทน", 503, "storage_unavailable");

  const buf = await request.arrayBuffer().catch(() => null);
  if (!buf || buf.byteLength < 64) return apiFail("ไม่พบไฟล์รูป", 400, "empty");
  if (buf.byteLength > STUDIO_LOGO_MAX_BYTES) return apiFail("รูปใหญ่เกินไป (ไม่เกิน 400 KB)", 413, "too_large");
  const kind = sniffLogoKind(new Uint8Array(buf.slice(0, 16)));
  if (!kind) return apiFail("รองรับเฉพาะรูป PNG, JPG หรือ WebP", 415, "bad_type");

  try {
    const id = crypto.randomUUID().replace(/-/g, "");
    await bucket.put(`studio-logo/${gate.readerId}/${id}.${kind}`, buf, {
      httpMetadata: { contentType: logoContentType(kind), cacheControl: "public, max-age=31536000, immutable" },
    });
    const path = logoPath(gate.readerId, id, kind);
    const before = await setStudioLogo(gate.readerId, path);
    if (before && before !== path) await deleteOwnLogo(before);
    return apiOk({ logoUrl: path });
  } catch (err) {
    console.error("[Studio logo] อัปโหลดไม่สำเร็จ", err);
    return apiFail("อัปโหลดรูปไม่สำเร็จ ลองใหม่อีกครั้ง", 500);
  }
}

export async function DELETE(request: Request) {
  const gate = await studioGate(request);
  if (!gate.ok) return gate.response;
  const before = await setStudioLogo(gate.readerId, null);
  await deleteOwnLogo(before);
  return apiOk({ logoUrl: null });
}
