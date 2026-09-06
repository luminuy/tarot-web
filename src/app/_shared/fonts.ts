import { Noto_Serif_Thai, Sarabun } from "next/font/google";

/**
 * ฟอนต์ของทั้งเว็บ — ประกาศไว้ที่เดียวแล้วให้ root layout ทั้งสองภาษาใช้ร่วมกัน
 *
 * ⚠️ ต้องเป็นโมดูลเดียวเท่านั้น ห้ามก็อปไปประกาศซ้ำใน `(en)/layout.tsx`
 * `next/font` สร้างไฟล์ .woff2 หนึ่งชุดต่อการเรียกหนึ่งครั้ง — ถ้าเรียกสองที่
 * จะได้ฟอนต์ซ้ำสองชุด (คนละ hash) ผู้ใช้ที่ข้ามภาษาจึงต้องโหลดฟอนต์ใหม่ทั้งหมด
 */
export const notoSerifThai = Noto_Serif_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-noto-serif-thai",
  adjustFontFallback: true,
});

export const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-sarabun",
  adjustFontFallback: true,
});

export const fontVariables = `${notoSerifThai.variable} ${sarabun.variable}`;
