/**
 * 🛡️ ตัวหา "origin ของเว็บเรา" ที่เชื่อถือได้ (Host Header Injection Guard)
 * ---------------------------------------------------------------------------
 * ลิงก์ยืนยันอีเมล / ลิงก์ตั้งรหัสผ่านใหม่ / redirect_uri ของ OAuth ถูกประกอบขึ้นจาก
 * host ของ request ผู้โจมตีที่ส่ง `X-Forwarded-Host: evil.example` เข้ามาพร้อมคำขอ
 * "ลืมรหัสผ่าน" ของเหยื่อ จะทำให้ระบบส่งอีเมลที่มี **token จริง** ชี้ไปเว็บของผู้โจมตี
 * — กดลิงก์ครั้งเดียวก็เสียบัญชี (password reset link poisoning)
 *
 * ทุกจุดที่ต้องใช้ origin ของตัวเองต้องเรียกผ่านไฟล์นี้เท่านั้น
 * ห้ามเขียน `x-forwarded-host || url.host` ใหม่ที่อื่นอีก
 */

/** โดเมนที่ยอมรับได้ — นอกเหนือจากนี้จะถูกตีกลับไปใช้ค่าปลอดภัยเสมอ */
const ALLOWED_HOSTS = new Set(["tarot.luminuy.com", "luminuy.com", "localhost:3000", "127.0.0.1:3000"]);

/** โดเมนหลักที่ใช้เมื่อ host ที่ส่งมาไม่น่าเชื่อถือ */
const CANONICAL_ORIGIN = "https://tarot.luminuy.com";

function isAllowedHost(host: string): boolean {
  if (!host) return false;
  if (ALLOWED_HOSTS.has(host)) return true;
  // preview deployment ของโปรเจกต์เอง
  if (host.endsWith(".workers.dev")) return true;
  if (host.endsWith(".luminuy.com")) return true;
  return false;
}

/**
 * คืน origin ที่ใช้ประกอบลิงก์ได้อย่างปลอดภัย
 * ลำดับความน่าเชื่อถือ: `APP_ORIGIN` (ตั้งไว้เอง) → host ของ request ที่อยู่ใน allowlist → โดเมนหลัก
 */
export function resolveAppOrigin(request: Request): string {
  const configured = (process.env.APP_ORIGIN ?? "").trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // APP_ORIGIN ตั้งไว้ผิดรูปแบบ — ตกไปใช้ลำดับถัดไปแทนที่จะพังทั้งเส้นทาง
    }
  }

  let requestHost = "";
  let requestProtocol = "https";
  try {
    const url = new URL(request.url);
    requestHost = url.host;
    requestProtocol = url.protocol.replace(":", "") || "https";
  } catch {
    return CANONICAL_ORIGIN;
  }

  // ยอมรับ x-forwarded-host ได้เฉพาะเมื่ออยู่ใน allowlist เท่านั้น
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ?? "";
  const host = isAllowedHost(forwardedHost)
    ? forwardedHost
    : isAllowedHost(requestHost)
      ? requestHost
      : "";

  if (!host) return CANONICAL_ORIGIN;

  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol =
    host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? (forwardedProto || requestProtocol || "http")
      : "https"; // production ต้องเป็น https เสมอ ไม่ให้ downgrade ผ่าน header

  return `${protocol}://${host}`;
}
