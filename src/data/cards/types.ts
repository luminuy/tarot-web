/**
 * โครงสร้างข้อมูลไพ่ทาโรต์ — สัญญากลางของทั้งระบบ
 * ความหมายทั้งหมดมาจากไฟล์เหล่านี้ ไม่ปล่อยให้ AI นึกเอง
 * เพื่อให้คำอ่านคงเส้นคงวา แก้ไขได้ และตรวจสอบได้
 */

export type Arcana = "major" | "minor";

/** ดอกของไพ่ Minor Arcana */
export type Suit = "wands" | "cups" | "swords" | "pentacles";

/** หมวดคำถาม — ใช้เลือกความหมายที่ตรงบริบทส่งให้ AI */
export type Category = "general" | "love" | "work" | "money" | "self";

/** คำตอบเชิงบวก/ลบของไพ่ ใช้กับ spread แบบ Yes/No */
export type YesNo = "yes" | "no" | "maybe";

export interface Interpretation {
  /** ไพ่หัวตั้ง — 2-4 ประโยค ภาษาไทยธรรมชาติ น้ำเสียงแม่หมอ */
  upright: string;
  /** ไพ่หัวกลับ — 2-4 ประโยค */
  reversed: string;
}

export interface TarotCard {
  /** major-00 ถึง major-21, wands-01..wands-14, ฯลฯ (page=11 knight=12 queen=13 king=14) */
  id: string;
  arcana: Arcana;
  suit: Suit | null;
  /** Major: 0-21 | Minor: 1-14 */
  number: number;
  nameTh: string;
  nameEn: string;
  /** คำสำคัญสั้น ๆ 4-6 คำ ใช้โชว์ใต้ไพ่บน UI */
  keywords: { upright: string[]; reversed: string[] };
  /** คำสำคัญสั้น ๆ ภาษาอังกฤษ 4-6 คำ */
  keywordsEn?: { upright: string[]; reversed: string[] };
  /** ความหมายแยกตามหมวดคำถาม — ต้องมีครบทั้ง 5 หมวด */
  meanings: Record<Category, Interpretation>;
  /** ความหมาย 5 หมวดภาษาอังกฤษ (Authentic English 5 Dimensions) */
  meaningsEn?: Record<Category, Interpretation>;
  /** ธาตุ: ไฟ / น้ำ / ลม / ดิน */
  element: "ไฟ" | "น้ำ" | "ลม" | "ดิน";
  /** ความเชื่อมโยงทางโหราศาสตร์ เช่น "ดาวยูเรนัส", "ราศีสิงห์" */
  astrology: string;
  /** โหราศาสตร์ภาษาอังกฤษสากล เช่น "Uranus / Element of Air" */
  astrologyEn?: string;
  /** ความหมายเชิงตัวเลข 1-2 ประโยค */
  numerology: string;
  /** ความหมายเชิงตัวเลขภาษาอังกฤษสากล */
  numerologyEn?: string;
  /** แนวโน้มคำตอบสำหรับ spread Yes/No */
  yesNo: YesNo;
  /** ชื่อไฟล์ภาพใน /public/cards เช่น "major-00.jpg" */
  image: string;
}
