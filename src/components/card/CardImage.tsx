import type { CSSProperties } from "react";
import { useState } from "react";

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
 *
 * UX improvement: blur-up shimmer placeholder ระหว่างรอโหลด,
 * onError fallback ป้องกันกล่องว่างเมื่อภาพโหลดไม่ได้
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
  draggable = false,
  onError,
}: CardImageProps) {
  const src = getCardImageSrc(image, cardId);
  if (!src) return null;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [loaded, setLoaded] = useState(loading === "eager");
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [errored, setErrored] = useState(false);

  if (errored) {
    // Graceful fallback — gold shimmer placeholder instead of blank box
    return (
      <div
        className={`bg-gradient-to-br from-[#1a1230] to-[#0d081a] border border-[#e5c07b]/20 flex items-center justify-center select-none ${className || ""}`}
        style={style}
        aria-label={alt}
        role="img"
      >
        <span className="text-[#e5c07b]/30 text-xs font-mono">✦</span>
      </div>
    );
  }

  const imgElement = (
    <img
      src={src}
      alt={alt}
      width={300}
      height={520}
      className={`select-none transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"} ${className || ""}`}
      style={style}
      loading={loading}
      decoding={decoding}
      draggable={draggable}
      onLoad={() => setLoaded(true)}
      onError={() => {
        setErrored(true);
        onError?.();
      }}
    />
  );

  const shimmer = !loaded && (
    <div
      className="absolute inset-0 bg-gradient-to-br from-[#1a1230] to-[#0d081a] animate-pulse rounded-[inherit]"
      aria-hidden
    />
  );

  if (full) {
    return (
      <div className="relative contents">
        {shimmer}
        {imgElement}
      </div>
    );
  }

  const webpSrcSet = getCardWebpSrcSet(image, cardId);
  if (!webpSrcSet) {
    return (
      <div className="relative contents">
        {shimmer}
        {imgElement}
      </div>
    );
  }

  return (
    <picture className="contents">
      <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />
      {shimmer}
      {imgElement}
    </picture>
  );
}

export default CardImage;
