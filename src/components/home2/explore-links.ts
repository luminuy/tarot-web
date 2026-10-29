/**
 * 🧭 ลิงก์ภายในทั้งหมดของหน้าแรก UI 2.0 (ส่วน "คลังไพ่ยิปซี" · แผน UI_2_0 หัวข้อ 6.7)
 * ===========================================================================
 * ⚠️ ห้ามทำลิงก์หาย — ทุกเส้นที่หน้าแรกเดิมมี (ดูดวงแบบอื่น · ราศีรายตัว · ผังยอดนิยม · ไพ่เมเจอร์เด่น ·
 *    บทความ · "คนค้นหาบ่อย") ต้องอยู่ใน HTML · พับเป็นกลุ่มได้ (`<details>`) แต่ห้ามตัดทิ้ง
 *    วิธีตรวจ: เทียบ `href` ภายในของ `dist/index.html` ก่อน-หลังแก้ (หายได้เฉพาะที่เจ้าของอนุมัติ)
 * ⚠️ ข้อความในลิงก์ "คนค้นหาบ่อย" = คำค้นเป้าหมายของหน้านั้น (GSC + Google Trends ไทย 2026-09-27 ·
 *    docs/SEO_INDEXING_LOG.md) หน้าดูดวงใช้ "ไพ่ยิปซี" · หน้าความหมายไพ่ใช้ "ไพ่ทาโร่" · ห้ามเปลี่ยนเป็นคำกว้าง ๆ
 * ⚠️ ไฟล์นี้ใช้เฉพาะส่วน HTML นิ่ง (`HomeSeoContent` ไม่ hydrate) — ห้าม import เข้า island
 */

export interface ExploreLink {
  path: string;
  th: string;
  en: string;
}

/** ดูดวงแบบอื่น — ประตูไปหน้าที่เคยไม่มีลิงก์เข้าเลย (ย้ายมาจาก HomeMoreWaysSection เดิม) */
export const MORE_WAYS: ExploreLink[] = [
  { path: "/pick-a-card", th: "Pick A Card · เลือกกองไพ่ 8 หัวข้อ", en: "Pick A Card · 8 topics" },
  { path: "/daily", th: "ดูดวงไพ่ยิปซีรายวัน", en: "Daily tarot" },
  { path: "/love/1-card", th: "ดูดวงความรัก 1 ใบ", en: "One-card love reading" },
  { path: "/cards/birth-card", th: "ไพ่ประจำตัวจากวันเกิด", en: "Your tarot birth card" },
  { path: "/natal-chart", th: "ผังดวงกำเนิด ลัคนา ดาว 10 ดวง", en: "Natal chart calculator" },
];

/** คำที่คนค้นจริง (ย้ายมาจาก HomeMoreWaysSection เดิม — ข้อความทุกตัวเหมือนเดิม) */
export const POPULAR_SEARCHES: ExploreLink[] = [
  { path: "/daily", th: "ดูดวงไพ่ยิปซีรายวัน", en: "Daily tarot reading" },
  { path: "/spreads/topic/love", th: "ดูดวงไพ่ยิปซีความรัก", en: "Love tarot spreads" },
  { path: "/spreads/three-card", th: "ดูดวงไพ่ยิปซี 3 ใบ", en: "3-card tarot reading" },
  { path: "/spreads/monthly", th: "ดูดวงไพ่ยิปซีรายเดือน", en: "Monthly tarot reading" },
  { path: "/spreads/celtic-cross", th: "ดูดวงไพ่ยิปซี 10 ใบ", en: "10-card Celtic Cross" },
  { path: "/spreads/yes-no", th: "ไพ่ยิปซี ใช่หรือไม่", en: "Yes or no tarot" },
  { path: "/cards", th: "ความหมายไพ่ทาโร่ 78 ใบ", en: "Tarot card meanings" },
  { path: "/cards/all", th: "ความหมายไพ่ยิปซีทั้งหมด", en: "All 78 cards at a glance" },
  { path: "/cards/birth-card", th: "ไพ่ประจำตัว", en: "Tarot birth card" },
  { path: "/questions", th: "คำถามที่คนถามไพ่บ่อย", en: "Popular tarot questions" },
];

/** ผังยอดนิยม (เดิมอยู่ในส่วน "ผังและไพ่" + ตัวเลือกผังของหน้าแรก) */
export const POPULAR_SPREADS: ExploreLink[] = [
  { path: "/spreads/celtic-cross", th: "ผังเซลติกครอส 10 ใบ", en: "Celtic Cross · 10 cards" },
  { path: "/read/celtic-cross", th: "เปิดไพ่เซลติกครอสเลย", en: "Draw the Celtic Cross now" },
  { path: "/spreads/three-card", th: "ผัง 3 ใบ อดีต-ปัจจุบัน-อนาคต", en: "3 cards · past, present, future" },
  { path: "/spreads/decision", th: "ผังตัดสินใจ เลือกทาง", en: "Decision spread" },
  { path: "/spreads/daily", th: "ผังรายวัน", en: "Daily spread" },
  { path: "/spreads/twelve-houses", th: "ผัง 12 เรือนชะตา", en: "12 Houses spread" },
  { path: "/spreads/create", th: "ออกแบบผังเอง", en: "Design your own spread" },
];

/** ไพ่เมเจอร์เด่น (เดิมอยู่ในส่วน "ผังและไพ่") */
export const MAJOR_HIGHLIGHTS: ExploreLink[] = [
  { path: "/cards/major-00", th: "คนเขลา (The Fool)", en: "The Fool" },
  { path: "/cards/major-01", th: "นักมายากล (The Magician)", en: "The Magician" },
  { path: "/cards/major-02", th: "นักบวชหญิง (The High Priestess)", en: "The High Priestess" },
  { path: "/cards/major-06", th: "คู่รัก (The Lovers)", en: "The Lovers" },
  { path: "/cards/major-19", th: "ดวงอาทิตย์ (The Sun)", en: "The Sun" },
  { path: "/cards/major-21", th: "โลก (The World)", en: "The World" },
  { path: "/cards/all", th: "ดูไพ่ครบ 78 ใบ", en: "See all 78 cards" },
];
