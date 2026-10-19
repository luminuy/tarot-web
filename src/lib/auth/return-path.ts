/**
 * แปลงค่า "กลับไปหน้าเดิม" (returnUrl) ที่มาจากผู้ใช้ — query string หรือคุกกี้ —
 * ให้เหลือเฉพาะ path ภายในเว็บเราเท่านั้น ใช้ทั้งตอนเริ่ม OAuth และตอน callback
 *
 * หลักการ: ตรวจ "หลังแยก URL" ด้วยตัวแยกเดียวกับที่ใช้ประกอบปลายทางจริง (WHATWG URL)
 * ไม่ตรวจแค่หน้าตาสตริง เพราะตัวแยกตัดอักขระควบคุมทิ้งและยุบ `.`/`..` ก่อนแยก
 * สตริงที่ดูเหมือน path ภายในจึงกลายเป็นโฮสต์อื่นได้ (A1-02)
 *
 * คืน null เมื่อไม่มีค่าหรือค่าไม่ปลอดภัย — ผู้เรียกใช้ "/" แทน
 */
const PARSE_BASE = "https://return-path.invalid";
const MAX_RETURN_PATH_LENGTH = 2048;

export function toSafeReturnPath(raw: string | null | undefined): string | null {
  if (!raw || raw.length > MAX_RETURN_PATH_LENGTH) return null;
  // อักขระควบคุมทุกตัว (ตัวแยก URL ตัดทิ้งเงียบ ๆ) และ backslash (ตัวแยกถือเป็น "/") ไม่มีใน path ปกติของเว็บ
  if (/[\u0000-\u001F\u007F\\]/.test(raw)) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;

  let parsed: URL;
  try {
    parsed = new URL(raw, PARSE_BASE);
  } catch {
    return null;
  }
  if (parsed.origin !== PARSE_BASE) return null;

  const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
  // path ที่ยุบแล้วขึ้นต้น "//" จะถูกอ่านเป็นโฮสต์เมื่อนำไปแยกซ้ำ — ไม่รับ
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  return path;
}

/**
 * ประกอบ URL ปลายทางบน origin ของเราจาก returnUrl ที่ผู้ใช้ส่งมา
 * ตรวจ origin ของผลลัพธ์อีกชั้น — ถ้าไม่ตรง origin ของเว็บ คืนหน้าแรกของ origin นั้นแทน
 */
export function buildSafeReturnUrl(raw: string | null | undefined, origin: string): URL {
  const path = toSafeReturnPath(raw) ?? "/";
  const target = new URL(path, origin);
  if (target.origin !== new URL(origin).origin) return new URL("/", origin);
  return target;
}
