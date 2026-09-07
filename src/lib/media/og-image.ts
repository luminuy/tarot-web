import { buildCloudinaryShareImageUrl } from "@/lib/media/cloudinary";
import { OG_IMAGE_ALT, OG_IMAGE_URL } from "@/lib/config/site";

export interface PageOgImageParams {
  /** หัวข้อหลักบนภาพ — ปกติใช้ h1 หรือชื่อหลักของหน้านั้น */
  title: string;
  /** บรรทัดเล็กเหนือหัวข้อ เช่น "คัมภีร์ไพ่ทาโรต์" / "คู่มือผังพยากรณ์" */
  eyebrow?: string;
  /** ชื่อไฟล์ไพ่ที่ใช้เป็นภาพประกอบฝั่งขวา เช่น "major-19.jpg" */
  cardImage?: string;
  alt?: string;
}

/**
 * แหล่งความจริงเดียวของ `openGraph.images` ทุกหน้าในเว็บ
 *
 * ⚠️ ห้ามเขียน `images: [{ url, width, height }]` ด้วยมือที่หน้าใดอีก —
 * ความกว้าง/สูงที่พิมพ์เองเคยผิดมาแล้วทั้งหน้าไพ่ (300×520 ที่ของจริง 825×1429)
 * และหน้า one-card (512×878 ที่ของจริง 512×881) · ฟังก์ชันนี้คืน 1200×630 เสมอ
 * ไม่ว่าจะตกไปทางสำรองหรือไม่ ตัวเลขจึงไม่สามารถผิดพลาดได้อีก
 *
 * ถ้าไม่ได้ตั้ง NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME จะถอยไป og/default.png
 * ซึ่งเป็น 1200×630 อยู่แล้ว (Zero Breaking Change)
 */
export function buildPageOgImage(params: PageOgImageParams) {
  const composed = buildCloudinaryShareImageUrl({
    title: params.title,
    spreadName: params.eyebrow,
    cardImageNames: params.cardImage ? [params.cardImage] : [],
  });

  return [
    {
      url: composed ?? OG_IMAGE_URL,
      width: 1200,
      height: 630,
      alt: params.alt ?? OG_IMAGE_ALT,
    },
  ];
}
