/**
 * 🖼️ ตัวช่วยอ้างอิงภาพหน้าไพ่ 1909 Rider-Waite (Card Image Source Resolver)
 *
 * ไฟล์นี้คือแหล่งความจริงเดียว (Single Source of Truth) สำหรับ "path ของภาพไพ่"
 * ทุกจุดในระบบ ตามกฎเหล็ก 2 ข้อในคู่มือ:
 *
 *  1. Root Image Path Resolution — ต้องการันตี prefix `/cards/` เสมอ
 *     ห้ามเขียน `<img src={card.image} />` เปล่าๆ เพราะเมื่ออยู่ที่ sub-route
 *     เช่น `/cards` เบราว์เซอร์จะ resolve ผิดโฟลเดอร์จนภาพไม่ขึ้น
 *
 *  2. Responsive Downscaling — ห้ามโหลดภาพต้นฉบับ ~820px (~280KB/ใบ)
 *     มาแสดงที่ขนาด 34-112px ให้ใช้ WebP ย่อจาก `scripts/generate-card-variants.ts` แทน
 *
 * ⚠️ ค่าใน CARD_IMAGE_VARIANTS ต้องตรงกับ VARIANTS ใน `scripts/generate-card-variants.ts`
 *    ถ้าเพิ่ม/แก้ขนาดที่นี่ ต้องรัน `npm run cards:variants` ใหม่เสมอ
 */

/** ขนาดภาพย่อ WebP ที่มีอยู่จริงใน `public/cards/<dir>/` (ย่อจากต้นฉบับจริง ~829px) */
export const CARD_IMAGE_VARIANTS = [
  { dir: "w64", width: 64 },
  { dir: "w128", width: 128 },
  { dir: "w256", width: 256 },
  /*
   * w320 — ตัวเชื่อมช่องว่าง 256→512 ที่เคยทำให้กริดไพ่กินแบนด์วิดท์เกินจริง
   *
   * วัดจากหน้า /cards จริง: ไพ่แสดงที่ 130–151 CSS px ทุกเบรกพอยต์
   * จอ DPR 2 (มือถือส่วนใหญ่) จึงต้องการ 261–301 px — เกิน 256 อยู่นิดเดียว
   * เมื่อไม่มีขั้นกลาง เบราว์เซอร์ต้องกระโดดไป w512b (101 KB) ทั้งที่ใช้จริงไม่ถึงครึ่ง
   * w320 (~45 KB) ครอบคลุมช่วง 261–301 ได้ครบ → ลดลง 55% ต่อใบโดยตาเปล่าไม่เห็นต่าง
   * (จอ DPR 3 ต้องการ ~410 px จะยังเลือก w512b ตามเดิม ซึ่งถูกต้องแล้ว)
   */
  { dir: "w320", width: 320 },
  { dir: "w512b", width: 512 },
  { dir: "w768b", width: 768 },
] as const;

const CARDS_ROOT = "/cards/";

/**
 * ดึง URL Endpoint ของ ImageKit CDN จาก Environment Variable
 * หากไม่ได้ตั้งค่า จะคืนค่าสตริงว่าง เพื่อให้ระบบถอยไปใช้ Path ภายในเครื่อง (Zero Breaking Change)
 */
export function getImageKitEndpoint(): string {
  const endpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "";
  return endpoint.trim().replace(/^["']+|["']+$/g, "").replace(/\/+$/, "");
}

/**
 * Options สำหรับการดึง Path ของภาพไพ่
 */
export interface CardImageSrcOptions {
  /**
   * บังคับให้ใช้ local path จาก Origin เสมอ (ไม่ใช้ CDN เช่น ImageKit)
   * ใช้สำหรับ fallback ฝั่ง Client เมื่อ CDN ไม่ตอบสนอง หรือการ Export ภาพ
   */
  forceLocal?: boolean;
}

/**
 * แปลงชื่อไฟล์ดิบจากฐานข้อมูลไพ่ (เช่น `"major-00.jpg"`) ให้เป็น path เต็มจาก root เสมอ
 * รองรับกรณีข้อมูลใส่ path เต็มมาแล้ว (`"/cards/major-00.jpg"`) และกรณีมีแต่ `id`
 * หากเปิดใช้ ImageKit CDN จะต่อ prefix อัตโนมัติเพื่อลดภาระ Cloudflare Egress Bandwidth
 */
export function getCardImageSrc(
  image?: string | null,
  fallbackId?: string | null,
  options?: CardImageSrcOptions,
): string | null {
  const endpoint = options?.forceLocal ? "" : getImageKitEndpoint();
  let localPath: string | null = null;

  if (image) {
    localPath = image.startsWith("/") ? image : `${CARDS_ROOT}${image}`;
  } else if (fallbackId) {
    localPath = `${CARDS_ROOT}${fallbackId}.jpg`;
  }

  if (!localPath) return null;
  return endpoint ? `${endpoint}${localPath}` : localPath;
}

/**
 * สกัดชื่อฐานของไฟล์ไพ่ เช่น `"major-00"` จาก path หรือชื่อไฟล์
 */
function extractCardBaseName(image?: string | null, fallbackId?: string | null): string | null {
  const raw = image || (fallbackId ? `${fallbackId}.jpg` : "");
  if (!raw) return null;
  const match = /([^/]+)\.jpe?g$/i.exec(raw);
  return match ? match[1] : null;
}

/**
 * สร้าง `srcSet` ของภาพย่อ WebP สำหรับใช้กับ `<source type="image/webp">`
 * คืนค่า `null` ถ้าภาพนั้นไม่ได้อยู่ใน `/cards/*.jpg` (จึงไม่มีไฟล์ย่อคู่กัน)
 */
export function getCardWebpSrcSet(
  image?: string | null,
  fallbackId?: string | null,
  options?: CardImageSrcOptions,
): string | null {
  const name = extractCardBaseName(image, fallbackId);
  if (!name) return null;

  const endpoint = options?.forceLocal ? "" : getImageKitEndpoint();
  const base = endpoint ? `${endpoint}${CARDS_ROOT}` : CARDS_ROOT;

  return CARD_IMAGE_VARIANTS.map(
    (v) => `${base}${v.dir}/${name}.webp ${v.width}w`,
  ).join(", ");
}

/**
 * ดึง URL ของภาพ WebP ขนาดย่อที่ระบุ (เช่น "w128") ผ่าน Single Source of Truth
 */
export function getCardWebpVariantSrc(
  image?: string | null,
  variant: "w64" | "w128" | "w256" | "w320" | "w512b" | "w768b" = "w128",
  fallbackId?: string | null,
  options?: CardImageSrcOptions,
): string | null {
  const name = extractCardBaseName(image, fallbackId);
  const endpoint = options?.forceLocal ? "" : getImageKitEndpoint();
  const base = endpoint ? `${endpoint}${CARDS_ROOT}` : CARDS_ROOT;

  if (!name) {
    return getCardImageSrc(image, fallbackId, options);
  }

  return `${base}${variant}/${name}.webp`;
}
