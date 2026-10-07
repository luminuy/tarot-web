import { getShareBucket } from "@/lib/platform/cf";
import { logoKeyFromPath } from "@/lib/studio/logo";

export const runtime = "nodejs";

/**
 * GET /api/studio/logo/<readerId>/<id>.<ext> — เสิร์ฟโลโก้แม่หมอจาก R2 (หน้าคำอ่านของลูกค้าเรียก)
 * id สุ่ม + ไฟล์ไม่เปลี่ยน ➔ cache 1 ปี · path ผิดรูป = 404 (ไม่เปิดให้อ่าน key อื่นใน bucket)
 */
export async function GET(_req: Request, { params }: { params: Promise<{ readerId: string; file: string }> }) {
  const { readerId, file } = await params;
  const key = logoKeyFromPath(`/api/studio/logo/${readerId}/${file}`);
  if (!key) return new Response("ไม่พบรูป", { status: 404 });
  const bucket = await getShareBucket();
  if (!bucket) return new Response("ระบบรูปยังไม่พร้อม", { status: 503 });
  const obj = await bucket.get(key).catch(() => null);
  if (!obj || !obj.body) return new Response("ไม่พบรูป", { status: 404 });
  return new Response(obj.body, {
    headers: {
      "content-type": obj.httpMetadata?.contentType || "image/png",
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}
