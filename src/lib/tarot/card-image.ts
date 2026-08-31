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

/** ขนาดภาพย่อ WebP ที่มีอยู่จริงใน `public/cards/<dir>/` */
export const CARD_IMAGE_VARIANTS = [
  { dir: "w256", width: 256 },
  { dir: "w512", width: 512 },
] as const;

const CARDS_ROOT = "/cards/";

/**
 * แปลงชื่อไฟล์ดิบจากฐานข้อมูลไพ่ (เช่น `"major-00.jpg"`) ให้เป็น path เต็มจาก root เสมอ
 * รองรับกรณีข้อมูลใส่ path เต็มมาแล้ว (`"/cards/major-00.jpg"`) และกรณีมีแต่ `id`
 */
export function getCardImageSrc(
  image?: string | null,
  fallbackId?: string | null,
): string | null {
  if (image) return image.startsWith("/") ? image : `${CARDS_ROOT}${image}`;
  if (fallbackId) return `${CARDS_ROOT}${fallbackId}.jpg`;
  return null;
}

/**
 * สร้าง `srcSet` ของภาพย่อ WebP สำหรับใช้กับ `<source type="image/webp">`
 * คืนค่า `null` ถ้าภาพนั้นไม่ได้อยู่ใน `/cards/*.jpg` (จึงไม่มีไฟล์ย่อคู่กัน)
 */
export function getCardWebpSrcSet(
  image?: string | null,
  fallbackId?: string | null,
): string | null {
  const src = getCardImageSrc(image, fallbackId);
  if (!src) return null;

  // รับเฉพาะภาพไพ่ต้นฉบับที่วางอยู่ใน /cards/ ชั้นบนสุดเท่านั้น
  const match = /^\/cards\/([^/]+)\.jpe?g$/i.exec(src);
  if (!match) return null;

  const name = match[1];
  return CARD_IMAGE_VARIANTS.map(
    (v) => `${CARDS_ROOT}${v.dir}/${name}.webp ${v.width}w`,
  ).join(", ");
}
