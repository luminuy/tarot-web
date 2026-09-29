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
  goldInkDeep: "#74490F",
  goldOnDark: "#D2A354",
  dark: "#171512",
  darkSoft: "#26221C",
  ok: "#3A7044",
  err: "#A6392C",
  errWash: "#FCEEEA",
} as const;

export const radius = { sm: 10, md: 16, lg: 24, xl: 32, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

/**
 * ชุดตัวอักษร — ภาษาไทยต้องมี line-height ≥ 1.6 เท่าของขนาด
 * ไม่งั้นสระบน/วรรณยุกต์ถูกตัดกล่อง (INC-0197)
 */
export const type = {
  title: { fontSize: 28, lineHeight: 46, fontWeight: "700" as const },
  heading: { fontSize: 20, lineHeight: 34, fontWeight: "700" as const },
  body: { fontSize: 17, lineHeight: 29, fontWeight: "400" as const },
  bodyStrong: { fontSize: 17, lineHeight: 29, fontWeight: "600" as const },
  caption: { fontSize: 13, lineHeight: 22, fontWeight: "400" as const },
} as const;

/** เงาบางของการ์ดพื้นอุ่น */
export const shadow = {
  card: {
    shadowColor: "#5A3E12",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;

/** ไพ่ 1909 สัดส่วน 7:12 (กว้าง:สูง) ตามสูตรของเว็บ */
export const CARD_ASPECT = 7 / 12;
