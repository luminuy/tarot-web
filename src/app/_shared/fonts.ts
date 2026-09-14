import { Noto_Serif_Thai, Sarabun } from "next/font/google";

/**
 * ฟอนต์ของทั้งเว็บ — ประกาศไว้ที่เดียวแล้วให้ root layout ทั้งสองภาษาใช้ร่วมกัน
 *
 * ⚠️ ต้องเป็นโมดูลเดียวเท่านั้น ห้ามก็อปไปประกาศซ้ำใน `(en)/layout.tsx`
 * `next/font` สร้างไฟล์ .woff2 หนึ่งชุดต่อการเรียกหนึ่งครั้ง — ถ้าเรียกสองที่
 * จะได้ฟอนต์ซ้ำสองชุด (คนละ hash) ผู้ใช้ที่ข้ามภาษาจึงต้องโหลดฟอนต์ใหม่ทั้งหมด
 */
/**
 * ฟอนต์หัวเรื่อง — **ตั้งใจไม่ `preload`** (วัดจริงด้วย Lighthouse 2026-09-14)
 *
 * `next/font` ใส่ `<link rel="preload">` ให้ทุกไฟล์ฟอนต์เป็นค่าเริ่มต้น ซึ่งแปลว่า
 * ฟอนต์ทั้งสองตระกูล 6 ไฟล์ 117 KB ถูกดึงด้วย **ลำดับความสำคัญสูงสุด** พร้อมกันตั้งแต่
 * มิลลิวินาทีแรก แย่งท่อกับ HTML · CSS · JS และภาพที่ใช้วาดหน้าจริง
 * ทั้งที่ฟอนต์พวกนี้ **ไม่ได้บล็อกการวาดหน้าเลย** เพราะเป็น `display: "swap"`
 * (ข้อความขึ้นด้วยฟอนต์สำรองทันที แล้วค่อยสลับ)
 *
 * ผลวัดบนบิลด์ production เครื่องเดียวกัน รันชุดละ 2 ครั้ง:
 *
 *   | ตั้งค่า                      | คะแนนรวม | FCP  | TBT     |
 *   | preload ทั้งคู่ (ของเดิม)      |  72–76   |  98  | 71–85   |
 *   | **ไม่ preload เฉพาะหัวเรื่อง**  | **78–79**|90–91 | **93–99** |
 *   | ไม่ preload ทั้งคู่            |  79–80   |  80  | 100     |
 *
 * เลือกทางกลาง: ฟอนต์เนื้อความ (Sarabun) ยัง preload อยู่เพราะเป็นตัวที่ผู้ใช้อ่านจริง
 * ทั้งหน้า ส่วนหัวเรื่องยอมให้สลับทีหลังได้ · `adjustFontFallback` ด้านล่างทำให้ฟอนต์สำรอง
 * มีสัดส่วนใกล้ของจริง การสลับจึงไม่ดันเลย์เอาต์ (ยืนยันแล้ว CLS ยัง 0.00x)
 *
 * ⚠️ ถ้าจะเปลี่ยนค่านี้ ต้องยิง Lighthouse เทียบก่อน/หลังเสมอ — ทั้ง FCP และ TBT
 *    ขยับสวนทางกัน ดูตัวเลขด้านเดียวแล้วสรุปจะได้คำตอบผิด
 */
export const notoSerifThai = Noto_Serif_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-noto-serif-thai",
  adjustFontFallback: true,
  preload: false,
});

export const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-sarabun",
  adjustFontFallback: true,
});

export const fontVariables = `${notoSerifThai.variable} ${sarabun.variable}`;
