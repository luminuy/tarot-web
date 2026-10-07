import { getShareBucket } from "@/lib/platform/cf";
import { STUDIO_LOGO_PATH_RE } from "@/lib/studio/brand";

/**
 * 🖼️ โลโก้ของแม่หมอที่อัปโหลดจากเครื่อง (แทนการให้วางลิงก์รูปเอง)
 * ---------------------------------------------------------------------------
 * • หน้าเว็บย่อรูปเป็นสี่เหลี่ยมจัตุรัส 256px ก่อนส่ง — เซิร์ฟเวอร์รับแค่ PNG/WebP/JPEG ไม่เกิน 400 KB (ตรวจ magic bytes)
 * • เก็บใน R2 (`SHARE_BUCKET`) ใต้ `studio-logo/<readerId>/<id>.<ext>` · เสิร์ฟผ่าน `/api/studio/logo/...` (ไม่เปิด bucket สาธารณะ)
 * • เปลี่ยน/เอาออก/ลบข้อมูลสตูดิโอ ➔ ลบไฟล์เก่าทิ้ง (ไม่ทิ้งรูปค้างใน R2)
 */

export const STUDIO_LOGO_MAX_BYTES = 400_000;

export type LogoKind = "png" | "webp" | "jpg";
const CONTENT_TYPE: Record<LogoKind, string> = { png: "image/png", webp: "image/webp", jpg: "image/jpeg" };

/** ดูชนิดไฟล์จากไบต์แรก ๆ (ไม่เชื่อ Content-Type ที่ผู้ส่งบอก) */
export function sniffLogoKind(bytes: Uint8Array): LogoKind | null {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  return null;
}

export function logoContentType(kind: LogoKind): string {
  return CONTENT_TYPE[kind];
}

export function logoPath(readerId: string, id: string, kind: LogoKind): string {
  return `/api/studio/logo/${readerId}/${id}.${kind}`;
}

/** path ➔ key ใน R2 (เฉพาะโลโก้ของระบบเรา · อย่างอื่น = null) */
export function logoKeyFromPath(path: string | null | undefined): string | null {
  const m = STUDIO_LOGO_PATH_RE.exec((path ?? "").trim());
  return m ? `studio-logo/${m[1]}/${m[2]}.${m[3]}` : null;
}

/** ลบไฟล์โลโก้ของระบบเราแบบไม่ให้ล้มงานหลัก (ลิงก์ภายนอก = ไม่ทำอะไร) */
export async function deleteOwnLogo(path: string | null | undefined): Promise<void> {
  const key = logoKeyFromPath(path);
  if (!key) return;
  const bucket = await getShareBucket();
  await bucket?.delete(key).catch((err) => console.error("[Studio logo] ลบไฟล์เก่าไม่สำเร็จ", { key, err }));
}
