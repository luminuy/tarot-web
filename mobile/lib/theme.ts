/**
 * โทเคนสีของธีมกระจกอุ่น — ค่าตรงกับ `src/app/globals.css` (:root)
 * (แผน IOS_APP_PLAN ข้อ 3.5: ระยะยาวให้สคริปต์สร้างไฟล์นี้จาก globals.css · ตอนนี้คัดลอกมือ 1 ครั้ง)
 * ตัวอักษรหลัก ink บน canvas ผ่านเกณฑ์ตัดกัน AA — อย่าเปลี่ยนสีเดี่ยว ๆ โดยไม่เช็กคอนทราสต์
 */
export const colors = {
  canvas: "#F7EDDC",
  surface: "#FFFFFF",
  surfaceWarm: "#FAF7F2",
  inset: "#EAE7E0",
  insetWarm: "#F3EDE2",
  line: "#D5CEC2",
  lineWarm: "#D9C8AC",
  ink: "#29261F",
  inkSoft: "#6F5B4A",
  muted: "#635B4E",
  gold: "#A58A5C",
  goldInk: "#8F5C1A",
  goldOnDark: "#D2A354",
  dark: "#171512",
  ok: "#3A7044",
  err: "#A6392C",
  errWash: "#FCEEEA",
} as const;

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

/** ไพ่ 1909 สัดส่วน 7:12 (กว้าง:สูง) ตามสูตรของเว็บ */
export const CARD_ASPECT = 7 / 12;
