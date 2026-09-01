/**
 * นโยบายความปลอดภัยของรหัสผ่าน (NIST 2024 Guideline)
 * เน้นความยาวและความปลอดภัยโดยไม่บังคับรูปแบบตัวอักษรที่ซับซ้อนเกินไป
 */

const COMMON_PASSWORDS = new Set([
  "1234567890",
  "12345678901",
  "password123",
  "password1234",
  "password12345",
  "qwertyuiop",
  "admin123456",
  "iloveyou123",
  "welcome1234",
  "letmein1234",
  "tarot123456",
  "oracle12345",
  "secret12345",
  "monkey12345",
  "dragon12345",
  "master12345",
  "sunshine123",
  "princess123",
  "football123",
  "shadow12345",
]);

export interface PasswordValidationResult {
  ok: boolean;
  reason?: string;
}

export function validatePasswordPolicy(password: string, email?: string): PasswordValidationResult {
  if (!password || typeof password !== "string") {
    return { ok: false, reason: "กรุณาระบุรหัสผ่าน" };
  }

  const trimmed = password.trim();

  if (trimmed.length < 10) {
    return { ok: false, reason: "รหัสผ่านต้องมีความยาวอย่างน้อย 10 ตัวอักษร" };
  }

  if (trimmed.length > 200) {
    return { ok: false, reason: "รหัสผ่านยาวเกินไป (ไม่เกิน 200 ตัวอักษร)" };
  }

  if (email && typeof email === "string") {
    const emailPrefix = email.split("@")[0]?.toLowerCase().trim();
    const pwLower = trimmed.toLowerCase();
    if (emailPrefix && emailPrefix.length >= 3 && pwLower.includes(emailPrefix)) {
      return { ok: false, reason: "รหัสผ่านไม่ควรมีส่วนใดส่วนหนึ่งของชื่ออีเมล" };
    }
  }

  if (COMMON_PASSWORDS.has(trimmed.toLowerCase())) {
    return { ok: false, reason: "รหัสผ่านนี้ง่ายเกินไปและเป็นที่นิยม กรุณาเลือกรหัสผ่านที่มีความเฉพาะตัวมากขึ้น" };
  }

  return { ok: true };
}
