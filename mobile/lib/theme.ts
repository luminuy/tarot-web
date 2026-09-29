/**
 * ✦ ระบบดีไซน์แอป SeerTarot (รอบ 3 — ดู mobile/DESIGN.md)
 *
 * โทเคนสีฐานตรงกับธีมกระจกอุ่นของเว็บ `src/app/globals.css` (:root)
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

/**
 * โทน "แท่นบูชายามค่ำ" — ใช้กับจังหวะพิธี (ตั้งจิต · เลือกไพ่ · เปิดไพ่) และฮีโร่ไพ่ประจำวัน
 * ตัวอักษร `text` บนพื้น `base`/`mid` ตัดกัน ≥ 12:1 · `textSoft` ≥ 7:1 (ผ่าน AAA สำหรับตัวเนื้อความ)
 */
export const night = {
  top: "#342838",
  mid: "#1F1A22",
  base: "#141116",
  text: "#F7EDDC",
  textSoft: "rgba(247,237,220,0.78)",
  line: "rgba(210,163,84,0.35)",
  gold: colors.goldOnDark,
} as const;

/**
 * สีประจำหัวข้อ — ใช้กับไอคอนบนวงกลมสีอ่อนเท่านั้น (ไม่ใช้เป็นสีตัวหนังสือเนื้อความ)
 * ทุกค่าตัดกับพื้นครีม ≥ 4.5:1 จึงใช้กับไอคอนและป้ายสั้นได้
 */
export const topicColor = {
  general: colors.goldInk,
  love: "#A8483F",
  work: "#355F7A",
  money: "#4F6B2C",
  self: "#62508F",
} as const;

export const radius = { xs: 6, sm: 10, md: 16, lg: 22, xl: 28, pill: 999 } as const;
export const space = { xxs: 2, xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

/** ระยะขอบซ้าย-ขวาของทุกหน้า (ตามระยะมาตรฐานของ iOS บน iPhone) */
export const GUTTER = 20;

/**
 * ฟอนต์หัวเรื่อง — Noto Serif Thai ตัวเดียวกับหัวข้อบนเว็บ (`--font-serif-th`) ให้แบรนด์ตรงกันสองฝั่ง
 * เนื้อความใช้ฟอนต์ระบบ (SF + Thonburi) อ่านง่ายที่สุดบน iPhone และรองรับ Dynamic Type
 * ⚠️ ฟอนต์นอกต้องเลือกน้ำหนักด้วยชื่อ family ต่อน้ำหนัก ห้ามใส่ fontWeight คู่ (iOS จะหาไม่เจอแล้วตกไปฟอนต์ระบบ)
 * โหลดที่ `app/_layout.tsx` ก่อนเรนเดอร์หน้าแรก
 */
export const font = {
  display: "NotoSerifThai_700Bold",
  displaySemi: "NotoSerifThai_600SemiBold",
  serif: "NotoSerifThai_400Regular",
} as const;

/**
 * ชุดตัวอักษร (ตามลำดับขั้นของ iOS Dynamic Type) — ภาษาไทยต้องมี line-height ≥ 1.6 เท่าของขนาด
 * ไม่งั้นสระบน/วรรณยุกต์ถูกตัดกล่อง (INC-0197) · ห้ามเขียน lineHeight เองต่ำกว่านี้
 */
export const type = {
  largeTitle: { fontFamily: font.display, fontSize: 32, lineHeight: 54, letterSpacing: -0.2 },
  title: { fontFamily: font.display, fontSize: 26, lineHeight: 44, letterSpacing: -0.1 },
  title2: { fontFamily: font.displaySemi, fontSize: 21, lineHeight: 36 },
  heading: { fontFamily: font.displaySemi, fontSize: 19, lineHeight: 32 },
  /** ข้อความอ้างคำพูด/คำถามของผู้ใช้ — serif ตัวบาง ให้รู้สึกเป็น "ถ้อยคำ" ไม่ใช่ป้าย UI */
  quote: { fontFamily: font.serif, fontSize: 17, lineHeight: 30 },
  headline: { fontSize: 17, lineHeight: 28, fontWeight: "600" as const },
  body: { fontSize: 17, lineHeight: 29, fontWeight: "400" as const },
  bodyStrong: { fontSize: 17, lineHeight: 29, fontWeight: "600" as const },
  callout: { fontSize: 16, lineHeight: 26, fontWeight: "400" as const },
  subhead: { fontSize: 15, lineHeight: 24, fontWeight: "400" as const },
  footnote: { fontSize: 13, lineHeight: 21, fontWeight: "400" as const },
  caption: { fontSize: 13, lineHeight: 21, fontWeight: "400" as const },
  eyebrow: { fontSize: 13, lineHeight: 21, fontWeight: "700" as const, letterSpacing: 0.6 },
  caption2: { fontSize: 12, lineHeight: 20, fontWeight: "500" as const },
} as const;

/**
 * เงา — ชั้นเนื้อหาใช้เงาบางมาก (กระดาษวางบนโต๊ะ) · ชั้นนำทางลอยใช้เงานุ่มกว้าง (กระจกลอยเหนือเนื้อหา)
 */
export const shadow = {
  card: {
    shadowColor: "#5A3E12",
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  float: {
    shadowColor: "#3B2708",
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  glow: {
    shadowColor: "#D2A354",
    shadowOpacity: 0.45,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
} as const;

/** ความเร็วการเคลื่อนไหวกลาง — ทุกชิ้นใช้ชุดเดียวกันให้จังหวะทั้งแอปเสมอกัน */
export const motion = { fast: 160, base: 260, slow: 520 } as const;

/** ไพ่ 1909 สัดส่วน 7:12 (กว้าง:สูง) ตามสูตรของเว็บ */
export const CARD_ASPECT = 7 / 12;

/** ชื่อผังในข้อมูลกลางมี "(ไพ่ 3 ใบ)" ต่อท้าย — แอปโชว์จำนวนใบเป็นป้ายแยก จึงตัดออกตอนแสดงผล (ไม่แก้ข้อมูลกลาง) */
export const spreadTitle = (nameTh: string) => nameTh.replace(/\s*\(ไพ่\s*\d+\s*ใบ\)\s*$/, "").trim();
