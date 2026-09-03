import { getShareBucket } from "@/lib/platform/cf";

export const runtime = "nodejs";

const ID_RE = /^[a-f0-9]{20,40}$/;

/**
 * GET /api/share/image/<id> — เสิร์ฟภาพการ์ดแชร์จาก R2 (ไม่ต้องเปิด public bucket)
 * cache 1 ปี (id สุ่ม + ภาพไม่เปลี่ยน)
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ID_RE.test(id)) return new Response("ไม่พบภาพ", { status: 404 });

  const bucket = await getShareBucket();
  if (!bucket) return new Response("ระบบภาพยังไม่พร้อม", { status: 503 });

  const obj = await bucket.get(`${id}.png`).catch(() => null);
  if (!obj || !obj.body) return new Response("ไม่พบภาพ", { status: 404 });

  return new Response(obj.body, {
    headers: {
      "content-type": obj.httpMetadata?.contentType || "image/png",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
