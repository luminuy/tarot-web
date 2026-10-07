/**
 * 🎨 แบรนด์ของแม่หมอใน Reader Studio (REFLECTION_JOURNAL_PLAN 1.13)
 * สีหลัก 1 สี — **ตรวจคอนทราสต์อัตโนมัติ**: ถ้าอ่านไม่ออกบนพื้นกระดาษอุ่นของเว็บ (< 4.5:1 ตาม WCAG AA)
 * จะเข้มขึ้นทีละขั้นจนผ่าน แล้วบอกแม่หมอว่าปรับให้แล้ว (ไม่ปฏิเสธเฉย ๆ)
 * ⚠️ ไฟล์นี้เบา (ไม่มี I/O) — ใช้ได้ทั้งหน้าแก้แบรนด์และหน้าคำอ่านที่ส่งให้ลูกค้า
 */

export const STUDIO_PAPER = "#FAF7F2";
export const STUDIO_DEFAULT_COLOR = "#8F5C1A";
export const MIN_TEXT_CONTRAST = 4.5;

const HEX = /^#?([0-9a-f]{6})$/i;

export function normalizeHex(input: string | null | undefined): string | null {
  const m = HEX.exec((input ?? "").trim());
  return m ? `#${m[1].toUpperCase()}` : null;
}

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  const [r, g, b] = rgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

function darken(hex: string, step: number): string {
  const [r, g, b] = rgb(hex).map((c) => Math.max(0, Math.round(c * (1 - step))));
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

/** คืนสีที่อ่านออกบนพื้นเว็บแน่นอน + บอกว่าต้องปรับไหม */
export function ensureReadableColor(input: string | null | undefined, bg = STUDIO_PAPER): { color: string; adjusted: boolean; ratio: number } {
  const hex = normalizeHex(input) ?? STUDIO_DEFAULT_COLOR;
  let color = hex;
  let i = 0;
  while (contrastRatio(color, bg) < MIN_TEXT_CONTRAST && i < 40) {
    i++;
    color = darken(hex, i * 0.05);
  }
  return { color, adjusted: color !== hex, ratio: Math.round(contrastRatio(color, bg) * 100) / 100 };
}

/** ชุดสีสำเร็จรูป — ทุกสีอ่านออกบนพื้นกระดาษ (≥ 4.5:1) ไม่ต้องให้แม่หมอรู้เรื่องคอนทราสต์ (ด่านทดสอบตรวจ) */
export const STUDIO_COLOR_PRESETS: ReadonlyArray<{ hex: string; nameTh: string }> = [
  { hex: STUDIO_DEFAULT_COLOR, nameTh: "ทองโบราณ" },
  { hex: "#6B4A2E", nameTh: "น้ำตาลกาแฟ" },
  { hex: "#A3302B", nameTh: "แดงชาด" },
  { hex: "#9C2F62", nameTh: "ชมพูกุหลาบ" },
  { hex: "#5B3A8C", nameTh: "ม่วงอเมทิสต์" },
  { hex: "#234E8C", nameTh: "น้ำเงินคราม" },
  { hex: "#1F6B4F", nameTh: "เขียวมรกต" },
  { hex: "#2B2B2B", nameTh: "ดำถ่าน" },
];

/** โลโก้ที่อัปโหลดเข้าระบบเราเอง: `/api/studio/logo/<readerId>/<32 hex>.<png|webp|jpg>` */
export const STUDIO_LOGO_PATH_RE = /^\/api\/studio\/logo\/([a-z0-9_]{3,64})\/([a-f0-9]{32})\.(png|webp|jpg)$/;

/** โลโก้: ไฟล์ที่อัปโหลดเข้าระบบเรา หรือลิงก์ https ไม่เกิน 500 ตัวอักษร (กัน javascript:/data: และ URL ยาวผิดปกติ) */
export function sanitizeLogoUrl(input: string | null | undefined): string | null {
  const raw = (input ?? "").trim();
  if (!raw || raw.length > 500) return null;
  if (STUDIO_LOGO_PATH_RE.test(raw)) return raw;
  try {
    const u = new URL(raw);
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}
