import type { CSSProperties } from "react";

import { getCardImageSrc, getCardWebpSrcSet } from "@/lib/tarot/card-image";

interface CardImageProps {
  /** ชื่อไฟล์ดิบจากฐานข้อมูลไพ่ เช่น `"major-00.jpg"` หรือ path เต็ม `"/cards/major-00.jpg"` */
  image?: string | null;
  /** ใช้เป็นตัวสำรองเมื่อไม่มี `image` — จะกลายเป็น `/cards/<cardId>.jpg` */
  cardId?: string | null;
  alt: string;
  className?: string;
  style?: CSSProperties;
  /**
   * ความกว้างจริงที่ภาพถูกแสดงบนหน้าจอ (CSS length) เพื่อให้เบราว์เซอร์เลือกไฟล์ย่อได้ถูกขนาด
   * เช่น `"70px"` หรือ `"(min-width: 640px) 112px, 96px"`
   * ถ้าไม่ระบุจะใช้ `"120px"` ซึ่งครอบคลุมการ์ดขนาดกลางทั่วไป
   */
  sizes?: string;
  /**
   * `true` = ใช้ไฟล์ต้นฉบับความละเอียดเต็มเท่านั้น (ไม่ใช้ WebP ย่อ)
   * ใช้กับหน้ารายละเอียดไพ่ หน้าซูม และการ Export ภาพลง Canvas
   */
  full?: boolean;
  loading?: "lazy" | "eager";
  decoding?: "async" | "sync" | "auto";
  draggable?: boolean;
  onError?: () => void;
}

/**
 * 🃏 ภาพหน้าไพ่ 1909 Rider-Waite แบบ Responsive
 *
 * เลือกไฟล์ WebP ย่อขนาดที่พอดีกับพื้นที่แสดงผลจริงให้อัตโนมัติ
 * และถอยไปใช้ `.jpg` ต้นฉบับเสมอถ้าเบราว์เซอร์ไม่รองรับ
 *
 * `<picture>` ใช้ `display: contents` จึงไม่สร้างกล่อง layout เพิ่ม —
 * `<img>` ข้างในยังจัดวางตาม parent เดิมทุกประการ (`w-full h-full`, `absolute` ฯลฯ)
 */
export function CardImage({
  image,
  cardId,
  alt,
  className,
  style,
  sizes = "220px",
  full = false,
  loading = "lazy",
  decoding = "async",
  draggable,
  onError,
}: CardImageProps) {
  const src = getCardImageSrc(image, cardId);
  if (!src) return null;

  const img = (
    <img
      src={src}
      alt={alt}
      width={300}
      height={520}
      className={className}
      style={style}
      loading={loading}
      decoding={decoding}
      draggable={draggable}
      onError={onError}
    />
  );

  if (full) return img;

  const webpSrcSet = getCardWebpSrcSet(image, cardId);
  if (!webpSrcSet) return img;

  return (
    <picture className="contents">
      <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />
      {img}
    </picture>
  );
}

export default CardImage;
